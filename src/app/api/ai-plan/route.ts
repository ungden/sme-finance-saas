import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/utils/supabase/server";
import { deriveBalanceSheetFromPL } from "@/lib/templates";

const apiKey = process.env.GEMINI_API_KEY;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ai: any = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: NextRequest) {
    try {
        // Auth check: ensure user is authenticated
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        } catch (e: unknown) {
            if (!(e instanceof Error) || e.message !== "SUPABASE_NOT_CONFIGURED") {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const body = await request.json();
        const {
            annualRevenue,
            industry,
            businessContext,
            allocationRules,
            departments,
            channels,
            year,
        } = body;

        if (!annualRevenue || annualRevenue <= 0) {
            return NextResponse.json(
                { error: "Doanh thu du kien phai lon hon 0" },
                { status: 400 }
            );
        }

        // Build allocation context string
        const allocStr = allocationRules
            ?.map((r: { category: string; percent: number }) => `${r.category}: ${r.percent}%`)
            .join(", ") || "cogs: 30%, marketing: 15%, operations: 20%, payroll: 20%, profit: 15%";

        const deptStr = departments
            ?.map((d: { name: string; payroll_percent: number }) => `${d.name} (${d.payroll_percent}% payroll)`)
            .join(", ") || "Chua co phong ban";

        const channelStr = channels
            ?.map((c: { name: string; percent: number }) => `${c.name} (${c.percent}% marketing)`)
            .join(", ") || "Chua co kenh marketing";

        // If no API key, return intelligent mock data
        if (!ai) {
            console.warn("No GEMINI_API_KEY. Returning mock AI plan.");
            await new Promise((r) => setTimeout(r, 1500));

            const monthly = annualRevenue / 12;
            // Realistic seasonality curve: Q1 low, Q2 ramp, Q3 peak, Q4 strong
            const seasonality = [0.7, 0.75, 0.85, 0.9, 0.95, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1, 1.05];

            const cogsPercent = allocationRules?.find((r: { category: string }) => r.category === "cogs")?.percent || 30;
            const mktPercent = allocationRules?.find((r: { category: string }) => r.category === "marketing")?.percent || 15;
            const opsPercent = allocationRules?.find((r: { category: string }) => r.category === "operations")?.percent || 20;
            const payPercent = allocationRules?.find((r: { category: string }) => r.category === "payroll")?.percent || 20;
            const profPercent = allocationRules?.find((r: { category: string }) => r.category === "profit")?.percent || 15;

            const monthNames = ["Thang 1", "Thang 2", "Thang 3", "Thang 4", "Thang 5", "Thang 6",
                "Thang 7", "Thang 8", "Thang 9", "Thang 10", "Thang 11", "Thang 12"];

            const months = seasonality.map((s, i) => {
                const rev = Math.round(monthly * s);
                return {
                    month: i + 1,
                    revenue: rev,
                    cogs: Math.round(rev * cogsPercent / 100),
                    marketing: Math.round(rev * mktPercent / 100),
                    operations: Math.round(rev * opsPercent / 100),
                    payroll: Math.round(rev * payPercent / 100),
                    profit: Math.round(rev * profPercent / 100),
                    notes: `${monthNames[i]}: Doanh thu du kien ${(s * 100).toFixed(0)}% binh quan. ${s < 0.9 ? "Mua thap diem, tap trung xay nen tang." : s > 1.1 ? "Mua cao diem, day manh ban hang." : "On dinh, toi uu chi phi."}`,
                };
            });

            // Derive full YearData from P&L totals
            const totalCogs = months.reduce((s, m) => s + m.cogs, 0);
            const totalMarketing = months.reduce((s, m) => s + m.marketing, 0);
            const totalOps = months.reduce((s, m) => s + m.operations, 0);
            const totalPayroll = months.reduce((s, m) => s + m.payroll, 0);
            const totalOpex = totalMarketing + totalOps + totalPayroll;
            // Estimate depreciation & interest from industry template or defaults
            const depreciationEstimate = Math.round(annualRevenue * 0.03);
            const interestEstimate = Math.round(annualRevenue * 0.01);
            const ebt = annualRevenue - totalCogs - totalOpex - depreciationEstimate - interestEstimate;
            const taxesEstimate = ebt > 0 ? Math.round(ebt * 0.20) : 0;

            const balanceSheet = deriveBalanceSheetFromPL(
                annualRevenue, totalCogs, totalOpex,
                depreciationEstimate, interestEstimate, taxesEstimate,
                industry || undefined,
            );

            const yearData = {
                id: year.toString(),
                year: year as number,
                revenue: annualRevenue,
                cogs: totalCogs,
                operatingExpenses: totalOpex,
                depreciation: depreciationEstimate,
                interestExpense: interestEstimate,
                taxes: taxesEstimate,
                ...balanceSheet,
            };

            return NextResponse.json({
                months,
                yearData,
                summary: `Kế hoạch tài chính ${year} với doanh thu mục tiêu ${(annualRevenue / 1e9).toFixed(1)} tỷ VND. Ngành ${industry || "kinh doanh chung"}. Phân bổ: COGS ${cogsPercent}%, Marketing ${mktPercent}%, Operations ${opsPercent}%, Payroll ${payPercent}%, Profit ${profPercent}%. Dự kiến Q1 thấp điểm (70-85% bình quân), Q3 cao điểm (110-120%), Q4 ổn định. Lợi nhuận mục tiêu ${profPercent}% doanh thu.`,
                insights: [
                    `Doanh thu bình quân tháng: ${(monthly / 1e6).toFixed(0)} triệu VND`,
                    `Q1 (T1-T3) là mùa thấp điểm - tập trung xây nền tảng, marketing nhẹ`,
                    `Q3 (T7-T9) là mùa cao điểm - tăng cường marketing, tuyển thêm nhân sự tạm thời`,
                    `Payroll Pool cả năm: ${(annualRevenue * payPercent / 100 / 1e6).toFixed(0)} triệu - chia ${departments?.length || 0} phòng ban`,
                    `Cần duy trì profit margin >= ${profPercent}% để đảm bảo sức khỏe tài chính`,
                ],
            });
        }

        // Real AI generation with Gemini
        const prompt = `
Ban la AI CFO chuyen gia tai chinh doanh nghiep Viet Nam (SME).
Nhiem vu: Lap ke hoach tai chinh 12 thang chi tiet.

THONG TIN DOANH NGHIEP:
- Nganh: ${industry || "Kinh doanh chung"}
- Boi canh: ${businessContext || "Khong co thong tin bo sung"}
- Nam ke hoach: ${year}
- Doanh thu muc tieu ca nam: ${annualRevenue.toLocaleString()} VND

QUY TAC PHAN BO HIEN TAI:
${allocStr}

PHONG BAN: ${deptStr}
KENH MARKETING: ${channelStr}

YEU CAU:
1. Phan bo doanh thu cho tung thang (1-12) co tinh seasonality (mua vu) thuc te cua nganh "${industry || "kinh doanh chung"}" tai Viet Nam
2. Chia chi phi theo tung thang dua tren quy tac phan bo tren
3. Ghi chu cu the cho tung thang: nen lam gi, chu y gi, rui ro gi
4. Tong 12 thang revenue phai = doanh thu muc tieu
5. Moi thang profit = revenue - cogs - marketing - operations - payroll

Tra ve JSON CHINH XAC theo format nay (KHONG co text thua, chi JSON):
{
  "months": [
    {
      "month": 1,
      "revenue": <so nguyen>,
      "cogs": <so nguyen>,
      "marketing": <so nguyen>,
      "operations": <so nguyen>,
      "payroll": <so nguyen>,
      "profit": <so nguyen>,
      "notes": "<ghi chu chien luoc thang nay>"
    },
    ... (12 thang)
  ],
  "summary": "<tom tat ke hoach ca nam, 2-3 cau>",
  "insights": [
    "<insight 1>",
    "<insight 2>",
    "<insight 3>",
    "<insight 4>",
    "<insight 5>"
  ]
}

RANG BUOC:
- Tat ca so phai la so nguyen (khong thap phan)
- Tong revenue 12 thang = ${annualRevenue}
- profit = revenue - cogs - marketing - operations - payroll (cho tung thang)
- Ghi chu bang tieng Viet KHONG DAU
- Tra ve ONLY JSON, khong markdown, khong giai thich
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

            // Derive full YearData from AI's monthly breakdown
            const aiMonths = parsed.months || [];
            const aiTotalCogs = aiMonths.reduce((s: number, m: { cogs: number }) => s + m.cogs, 0);
            const aiTotalMkt = aiMonths.reduce((s: number, m: { marketing: number }) => s + m.marketing, 0);
            const aiTotalOps = aiMonths.reduce((s: number, m: { operations: number }) => s + m.operations, 0);
            const aiTotalPayroll = aiMonths.reduce((s: number, m: { payroll: number }) => s + m.payroll, 0);
            const aiTotalOpex = aiTotalMkt + aiTotalOps + aiTotalPayroll;
            const aiDepreciation = Math.round(annualRevenue * 0.03);
            const aiInterest = Math.round(annualRevenue * 0.01);
            const aiEbt = annualRevenue - aiTotalCogs - aiTotalOpex - aiDepreciation - aiInterest;
            const aiTaxes = aiEbt > 0 ? Math.round(aiEbt * 0.20) : 0;

            const aiBalanceSheet = deriveBalanceSheetFromPL(
                annualRevenue, aiTotalCogs, aiTotalOpex,
                aiDepreciation, aiInterest, aiTaxes,
                industry || undefined,
            );

            parsed.yearData = {
                id: year.toString(),
                year: year as number,
                revenue: annualRevenue,
                cogs: aiTotalCogs,
                operatingExpenses: aiTotalOpex,
                depreciation: aiDepreciation,
                interestExpense: aiInterest,
                taxes: aiTaxes,
                ...aiBalanceSheet,
            };

            return NextResponse.json(parsed);
        } catch {
            console.error("Failed to parse AI plan response:", aiText);
            return NextResponse.json(
                { error: "AI khong tra ve du lieu hop le. Vui long thu lai." },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("AI Plan API Error:", error);
        return NextResponse.json(
            { error: "Loi he thong. Vui long thu lai." },
            { status: 500 }
        );
    }
}
