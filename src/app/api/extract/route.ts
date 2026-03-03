import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
let ai: any = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // If no API key, return a mock realistic response to demo the UI
        if (!ai) {
            console.warn("No GEMINI_API_KEY found. Returning mock data.");
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay

            return NextResponse.json({
                financials: {
                    incomeStatement: {
                        revenue: 125000000,
                        cogs: 45000000,
                        grossProfit: 80000000,
                        operatingExpenses: 25000000,
                        depreciation: 5000000,
                        netIncome: 40000000, // (80M - 25M - 5M - tax if any) Let's say 40M net
                    },
                    balanceSheet: {
                        assets: {
                            cash: 50000000,
                            accountsReceivable: 15000000,
                            propertyPlantEquipment: 135000000, // 200M total
                            totalAssets: 200000000,
                        },
                        liabilities: {
                            accountsPayable: 30000000,
                            totalLiabilities: 30000000,
                        },
                        equity: {
                            ownerCapital: 130000000,
                            retainedEarnings: 40000000,
                            totalEquity: 170000000, // 200M total L&E
                        }
                    },
                    cashFlow: {
                        operations: 45000000,
                        investing: -10000000,
                        financing: 5000000,
                        netCashFlow: 40000000,
                    }
                }
            });
        }

        // Real AI Extraction
        const buffer = await file.arrayBuffer();

        // Prepare image for Gemini
        // @ts-ignore
        const base64Data = Buffer.from(buffer).toString("base64");
        const mimeType = file.type;

        const prompt = `
      You are an expert accountant and financial analyst. 
      Analyze the provided invoice, receipt, or financial document.
      Extract the financial data and reconstruct three perfectly balanced financial statements.
      
      Strict Rules:
      1. All numbers must be integers (e.g. 1000000).
      2. The accounting equation MUST balance perfectly: 
         totalAssets = totalLiabilities + totalEquity
      3. retainedEarnings in Balance Sheet should generally reflect netIncome from the Income Statement for a single period.
      4. If some fields are missing, intelligently infer them or set to 0 to keep equations balanced.
      5. Return ONLY a valid JSON object with the exact structure:
      {
        "incomeStatement": {
          "revenue": number,
          "cogs": number,
          "grossProfit": number, // revenue - cogs
          "operatingExpenses": number,
          "depreciation": number,
          "netIncome": number // grossProfit - operatingExpenses - depreciation
        },
        "balanceSheet": {
          "assets": {
            "cash": number,
            "accountsReceivable": number,
            "propertyPlantEquipment": number,
            "totalAssets": number // cash + accountsReceivable + propertyPlantEquipment
          },
          "liabilities": {
            "accountsPayable": number,
            "totalLiabilities": number // equals accountsPayable + any other debt
          },
          "equity": {
            "ownerCapital": number,
            "retainedEarnings": number, // Should tie to net income
            "totalEquity": number // ownerCapital + retainedEarnings
          }
        },
        "cashFlow": {
          "operations": number,
          "investing": number,
          "financing": number,
          "netCashFlow": number // operations + investing + financing
        }
      }
      
      Ensure totalAssets === totalLiabilities + totalEquity. No conversational text, only the raw JSON.
    `;

        // Process with Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: mimeType
                            }
                        }
                    ]
                }
            ]
        });

        const aiText = response.text() || "";
        // Regex to extract JSON if encapsulated in markdown code blocks
        const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/) || aiText.match(/```\n([\s\S]*?)\n```/);
        const rawJsonString = jsonMatch ? jsonMatch[1] : aiText;

        try {
            const parsedData = JSON.parse(rawJsonString);
            return NextResponse.json({ financials: parsedData });
        } catch (parseError) {
            console.error("Failed to parse AI response into JSON", aiText);
            return NextResponse.json({ error: "Failed to parse document data" }, { status: 500 });
        }

    } catch (error) {
        console.error("API Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
