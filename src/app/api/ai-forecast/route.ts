import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ai: any = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

interface MonthlyHistory {
    month: string;
    revenue: number;
    expense: number;
    net: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            historicalData,
            forecastMonths,
            scenario,
            industry,
            context,
        } = body as {
            historicalData: MonthlyHistory[];
            forecastMonths: number;
            scenario: string;
            industry: string;
            context: string;
        };

        if (!historicalData || historicalData.length === 0) {
            return NextResponse.json(
                { error: "Can it nhat 1 thang du lieu lich su" },
                { status: 400 }
            );
        }

        const months = forecastMonths || 6;
        const scenarioType = scenario || "base";

        // Calculate historical stats
        const avgRevenue = historicalData.reduce((s, m) => s + m.revenue, 0) / historicalData.length;
        const avgExpense = historicalData.reduce((s, m) => s + m.expense, 0) / historicalData.length;
        const avgNet = avgRevenue - avgExpense;

        // Growth trend from historical data
        let growthRate = 0;
        if (historicalData.length >= 2) {
            const firstHalf = historicalData.slice(0, Math.floor(historicalData.length / 2));
            const secondHalf = historicalData.slice(Math.floor(historicalData.length / 2));
            const avgFirst = firstHalf.reduce((s, m) => s + m.revenue, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((s, m) => s + m.revenue, 0) / secondHalf.length;
            if (avgFirst > 0) growthRate = (avgSecond - avgFirst) / avgFirst;
        }

        // Scenario multipliers
        const scenarioMultipliers: Record<string, { growth: number; expense: number; label: string }> = {
            base: { growth: 1, expense: 1, label: "Co so" },
            optimistic: { growth: 1.5, expense: 0.9, label: "Lac quan" },
            pessimistic: { growth: 0.5, expense: 1.15, label: "Than trong" },
            custom: { growth: 1, expense: 1, label: "Tuy chinh" },
        };
        const mult = scenarioMultipliers[scenarioType] || scenarioMultipliers.base;

        // If no API key, return calculated forecast
        if (!ai) {
            console.warn("No GEMINI_API_KEY. Returning calculated forecast.");
            await new Promise((r) => setTimeout(r, 1200));

            const lastMonth = historicalData[historicalData.length - 1];
            const lastDate = new Date(lastMonth.month + "-01");

            const forecastData = [];
            for (let i = 1; i <= months; i++) {
                const date = new Date(lastDate);
                date.setMonth(date.getMonth() + i);
                const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                // Apply growth with seasonality
                const monthOfYear = date.getMonth(); // 0-11
                const seasonality = [0.85, 0.88, 0.95, 0.98, 1.0, 1.02, 1.08, 1.1, 1.12, 1.05, 1.0, 0.95];
                const seasonal = seasonality[monthOfYear];
                const growthFactor = 1 + (growthRate * mult.growth * (i / months));

                const revenue = Math.round(avgRevenue * seasonal * growthFactor);
                const expense = Math.round(avgExpense * mult.expense * (1 + growthRate * 0.3 * (i / months)));
                const net = revenue - expense;

                // Confidence decreases over time
                const confidence = Math.max(0.3, 1 - (i * 0.08));

                forecastData.push({ month: monthStr, revenue, expense, net, confidence });
            }

            const totalForecastRev = forecastData.reduce((s, m) => s + m.revenue, 0);
            const totalForecastExp = forecastData.reduce((s, m) => s + m.expense, 0);

            return NextResponse.json({
                monthly_data: forecastData,
                assumptions: {
                    growth_rate: growthRate * mult.growth * 100,
                    seasonal_factors: [0.85, 0.88, 0.95, 0.98, 1.0, 1.02, 1.08, 1.1, 1.12, 1.05, 1.0, 0.95],
                    notes: `Du bao ${months} thang theo kich ban ${mult.label}. Tang truong co so: ${(growthRate * 100).toFixed(1)}%/giai doan. Doanh thu TB lich su: ${(avgRevenue / 1e6).toFixed(0)}M/thang.`,
                },
                summary: `Du bao dong tien ${months} thang tiep theo (kich ban ${mult.label}). Du kien doanh thu ${(totalForecastRev / 1e9).toFixed(2)} ty, chi phi ${(totalForecastExp / 1e9).toFixed(2)} ty, net ${((totalForecastRev - totalForecastExp) / 1e9).toFixed(2)} ty. Tang truong ${(growthRate * mult.growth * 100).toFixed(1)}% so voi ky truoc.`,
                insights: [
                    `Doanh thu binh quan lich su: ${(avgRevenue / 1e6).toFixed(0)} trieu/thang`,
                    `Chi phi binh quan lich su: ${(avgExpense / 1e6).toFixed(0)} trieu/thang`,
                    `Net cash flow TB: ${(avgNet / 1e6).toFixed(0)} trieu/thang`,
                    growthRate > 0
                        ? `Xu huong tang truong ${(growthRate * 100).toFixed(1)}% - tich cuc`
                        : growthRate < 0
                            ? `Xu huong giam ${(Math.abs(growthRate) * 100).toFixed(1)}% - can chu y`
                            : "On dinh, khong co xu huong ro rang",
                    `Do tin cay giam dan: thang 1 = ${(forecastData[0]?.confidence * 100).toFixed(0)}%, thang ${months} = ${(forecastData[months - 1]?.confidence * 100).toFixed(0)}%`,
                ],
            });
        }

        // Real AI generation with Gemini
        const histStr = historicalData
            .map(m => `${m.month}: Thu ${m.revenue.toLocaleString()}, Chi ${m.expense.toLocaleString()}, Net ${m.net.toLocaleString()}`)
            .join("\n");

        const prompt = `
Ban la AI CFO chuyen du bao dong tien (cashflow forecasting) cho doanh nghiep Viet Nam.
Nhiem vu: Du bao dong tien ${months} thang tiep theo.

DU LIEU LICH SU:
${histStr}

THONG TIN BO SUNG:
- Nganh: ${industry || "Kinh doanh chung"}
- Boi canh: ${context || "Khong co"}
- Kich ban: ${mult.label} (${scenarioType})
- Doanh thu TB: ${avgRevenue.toLocaleString()} VND/thang
- Chi phi TB: ${avgExpense.toLocaleString()} VND/thang
- Tang truong hien tai: ${(growthRate * 100).toFixed(1)}%

YEU CAU:
1. Du bao doanh thu va chi phi cho ${months} thang tiep theo
2. Ap dung seasonality thuc te cua nganh "${industry || "kinh doanh chung"}" tai VN
3. Kich ban "${mult.label}": ${scenarioType === "optimistic" ? "tang truong manh, chi phi toi uu" : scenarioType === "pessimistic" ? "tang truong cham, chi phi tang" : "du bao thuc te nhat"}
4. Do tin cay (confidence) giam dan theo thoi gian (0.3-1.0)
5. Phan tich insights huu ich

Tra ve JSON CHINH XAC:
{
  "monthly_data": [
    { "month": "YYYY-MM", "revenue": <so nguyen>, "expense": <so nguyen>, "net": <so nguyen>, "confidence": <0.0-1.0> }
  ],
  "assumptions": {
    "growth_rate": <% tang truong>,
    "seasonal_factors": [12 so tu 0.5-1.5 cho moi thang trong nam],
    "notes": "<ghi chu gia dinh>"
  },
  "summary": "<tom tat du bao 2-3 cau>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>", "<insight 4>", "<insight 5>"]
}

RANG BUOC:
- revenue, expense, net la so nguyen
- net = revenue - expense
- confidence: 0.3-1.0, giam dan
- Tieng Viet KHONG DAU
- Tra ve ONLY JSON, khong markdown
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const aiText = response.text() || "";
        const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/```\n([\s\S]*?)\n```/);
        const rawJson = jsonMatch ? jsonMatch[1] : aiText;

        try {
            const parsed = JSON.parse(rawJson);
            return NextResponse.json(parsed);
        } catch {
            console.error("Failed to parse AI forecast response:", aiText);
            return NextResponse.json(
                { error: "AI khong tra ve du lieu hop le. Vui long thu lai." },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("AI Forecast API Error:", error);
        return NextResponse.json(
            { error: "Loi he thong. Vui long thu lai." },
            { status: 500 }
        );
    }
}
