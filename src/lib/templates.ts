// ── Industry Templates → Full YearData Conversion ──
// Extracted from BOE page templates and expanded to generate complete 3 BCTC
// (P&L + Balance Sheet + Cash Flow) for dashboard display.

import type { YearData } from "@/lib/types";

// ── Template Data Structure ──
export interface IndustryTemplate {
    id: string;
    name: string;
    description: string;
    gradient: string;
    // Revenue drivers
    tc: number;              // Transactions/day
    ac: number;              // Average check (VND)
    // Premises
    sizeSqm: number;
    rent: number;            // Monthly rent per m²
    // Cost percentages (of revenue)
    cogsPercent: number;
    utilitiesPercent: number;
    marketingPercent: number;
    otherOpexPercent: number;
    maintenancePercent: number;
    reinvestmentPercent: number;
    // Labor
    smCount: number;
    smSalary: number;
    staffCount: number;
    staffSalary: number;
    // CapEx
    capexSqm: number;
    equipment: number;
    depreciationYears: number;
    // Labels
    tcLabel: string;
    acLabel: string;
}

// ── 6 Industry Templates ──
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
    {
        id: "fnb",
        name: "F&B / Quán Cà phê",
        description: "Dựa theo BOE Nam Long — Quán cà phê & nhà hàng 500m²",
        gradient: "from-amber-500 to-orange-600",
        tc: 189, ac: 71000, sizeSqm: 500, rent: 180960,
        cogsPercent: 31, utilitiesPercent: 6, marketingPercent: 3,
        otherOpexPercent: 1, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 8, staffSalary: 5500000,
        capexSqm: 14300000, equipment: 520000000, depreciationYears: 5,
        tcLabel: "TC (Giao dịch/ngày)", acLabel: "AC (Đơn giá TB, VNĐ)",
    },
    {
        id: "retail",
        name: "Bán lẻ / Cửa hàng",
        description: "Cửa hàng thời trang, mỹ phẩm, tiện lợi — 80-200m²",
        gradient: "from-blue-500 to-indigo-600",
        tc: 80, ac: 350000, sizeSqm: 120, rent: 390000,
        cogsPercent: 55, utilitiesPercent: 3, marketingPercent: 5,
        otherOpexPercent: 2, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 10000000, staffCount: 3, staffSalary: 6000000,
        capexSqm: 7800000, equipment: 390000000, depreciationYears: 5,
        tcLabel: "Khách/ngày", acLabel: "Giá trị đơn TB (VNĐ)",
    },
    {
        id: "ecommerce",
        name: "Thương mại Điện tử",
        description: "Shop online Shopee/TikTok/Lazada — Kho hàng + nhân sự",
        gradient: "from-rose-500 to-pink-600",
        tc: 150, ac: 250000, sizeSqm: 80, rent: 104000,
        cogsPercent: 50, utilitiesPercent: 1, marketingPercent: 15,
        otherOpexPercent: 5, maintenancePercent: 0, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 5, staffSalary: 6500000,
        capexSqm: 1300000, equipment: 260000000, depreciationYears: 3,
        tcLabel: "Đơn hàng/ngày", acLabel: "AOV (Giá trị đơn TB, VNĐ)",
    },
    {
        id: "salon",
        name: "Salon / Spa / Làm đẹp",
        description: "Tiệm tóc, spa, nail — 60-150m², dịch vụ cao cấp",
        gradient: "from-purple-500 to-fuchsia-600",
        tc: 25, ac: 450000, sizeSqm: 100, rent: 260000,
        cogsPercent: 15, utilitiesPercent: 5, marketingPercent: 8,
        otherOpexPercent: 2, maintenancePercent: 2, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 6, staffSalary: 8000000,
        capexSqm: 10400000, equipment: 650000000, depreciationYears: 5,
        tcLabel: "Khách/ngày", acLabel: "Đơn giá dịch vụ TB (VNĐ)",
    },
    {
        id: "education",
        name: "Giáo dục / Trung tâm dạy học",
        description: "Trung tâm ngoại ngữ, luyện thi, kỹ năng — 150-300m²",
        gradient: "from-emerald-500 to-teal-600",
        tc: 60, ac: 200000, sizeSqm: 200, rent: 208000,
        cogsPercent: 5, utilitiesPercent: 4, marketingPercent: 10,
        otherOpexPercent: 3, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 15000000, staffCount: 8, staffSalary: 10000000,
        capexSqm: 5200000, equipment: 390000000, depreciationYears: 5,
        tcLabel: "Học viên/ngày", acLabel: "Học phí TB/buổi (VNĐ)",
    },
    {
        id: "logistics",
        name: "Vận chuyển / Giao hàng",
        description: "Đội xe giao hàng, kho bãi, last-mile delivery",
        gradient: "from-sky-500 to-cyan-600",
        tc: 200, ac: 35000, sizeSqm: 150, rent: 78000,
        cogsPercent: 40, utilitiesPercent: 8, marketingPercent: 3,
        otherOpexPercent: 5, maintenancePercent: 5, reinvestmentPercent: 2,
        smCount: 1, smSalary: 12000000, staffCount: 10, staffSalary: 7000000,
        capexSqm: 1300000, equipment: 1300000000, depreciationYears: 4,
        tcLabel: "Đơn giao/ngày", acLabel: "Phí giao hàng TB (VNĐ)",
    },
];

// ── Convert Industry Template → Full YearData ──
// Generates realistic financial data for all 14 fields of YearData
// based on industry benchmarks and template parameters.

export function getTemplateYearData(templateId: string, year: number): YearData {
    const t = INDUSTRY_TEMPLATES.find(tpl => tpl.id === templateId);
    if (!t) {
        throw new Error(`Template not found: ${templateId}`);
    }
    return computeYearDataFromTemplate(t, year);
}

export function computeYearDataFromTemplate(t: IndustryTemplate, year: number): YearData {
    // ── Income Statement ──
    const annualRevenue = t.tc * t.ac * 365;
    const cogs = Math.round(annualRevenue * t.cogsPercent / 100);

    // Operating expenses = rent + utilities + marketing + other + maintenance + labor
    const annualRent = t.rent * t.sizeSqm * 12;
    const annualLabor = (t.smCount * t.smSalary + t.staffCount * t.staffSalary) * 12;
    const annualUtilities = Math.round(annualRevenue * t.utilitiesPercent / 100);
    const annualMarketing = Math.round(annualRevenue * t.marketingPercent / 100);
    const annualOtherOpex = Math.round(annualRevenue * t.otherOpexPercent / 100);
    const annualMaintenance = Math.round(annualRevenue * t.maintenancePercent / 100);
    const operatingExpenses = annualRent + annualLabor + annualUtilities + annualMarketing + annualOtherOpex + annualMaintenance;

    // CapEx & Depreciation
    const totalCapex = t.capexSqm * t.sizeSqm + t.equipment;
    const depreciation = Math.round(totalCapex / t.depreciationYears);

    // Interest: assume 40% of CapEx is financed with 10% annual rate
    const debtFinancedCapex = totalCapex * 0.4;
    const interestExpense = Math.round(debtFinancedCapex * 0.10);

    // Taxes: 20% CIT on profit before tax (if positive)
    const grossProfit = annualRevenue - cogs;
    const ebitda = grossProfit - operatingExpenses;
    const ebit = ebitda - depreciation;
    const ebt = ebit - interestExpense;
    const taxes = ebt > 0 ? Math.round(ebt * 0.20) : 0;

    // ── Balance Sheet ──
    // Cash: ~2 months of operating expenses as working capital buffer
    const monthlyOpex = (operatingExpenses + cogs) / 12;
    const cash = Math.round(monthlyOpex * 2);

    // Accounts Receivable: industry-specific days of revenue
    const arDays = t.id === "ecommerce" ? 5 : t.id === "logistics" ? 20 : 15;
    const accountsReceivable = Math.round(annualRevenue * arDays / 365);

    // Inventory: COGS-based, varies by industry
    const invDays = (t.cogsPercent >= 40) ? 30 : (t.cogsPercent >= 15) ? 15 : 5;
    const inventory = Math.round(cogs * invDays / 365);

    // PPE: total CapEx minus 1 year depreciation
    const propertyPlantEquipment = totalCapex - depreciation;

    // Accounts Payable: ~20 days of COGS
    const accountsPayable = Math.round(cogs * 20 / 365);

    // Debt splits
    const shortTermDebt = Math.round(debtFinancedCapex * 0.20);
    const longTermDebt = Math.round(debtFinancedCapex * 0.80);

    // Owner's capital: 60% equity-financed
    const ownerCapital = Math.round(totalCapex * 0.60);

    return {
        id: year.toString(),
        year,
        revenue: annualRevenue,
        cogs,
        operatingExpenses,
        depreciation,
        interestExpense,
        taxes,
        cash,
        accountsReceivable,
        inventory,
        propertyPlantEquipment,
        accountsPayable,
        shortTermDebt,
        longTermDebt,
        ownerCapital,
    };
}

// ── Generate Balance Sheet from P&L data + industry benchmarks ──
// Used by AI Planner (mock & real) to derive Balance Sheet items
// when only P&L annual totals are available.

export function deriveBalanceSheetFromPL(
    revenue: number,
    cogs: number,
    operatingExpenses: number,
    depreciation: number,
    interestExpense: number,
    taxes: number,
    industryId?: string,
): Omit<YearData, "id" | "year" | "revenue" | "cogs" | "operatingExpenses" | "depreciation" | "interestExpense" | "taxes"> {
    const template = INDUSTRY_TEMPLATES.find(t => t.id === industryId);

    // Use industry-specific ratios or reasonable defaults
    const arDays = template
        ? (template.id === "ecommerce" ? 5 : template.id === "logistics" ? 20 : 15)
        : 15;
    const invDays = template
        ? (template.cogsPercent >= 40 ? 30 : template.cogsPercent >= 15 ? 15 : 5)
        : 15;

    // Derive values
    const monthlyOpex = (operatingExpenses + cogs) / 12;
    const cash = Math.round(monthlyOpex * 2);
    const accountsReceivable = Math.round(revenue * arDays / 365);
    const inventory = Math.round(cogs * invDays / 365);

    // PPE: estimate from depreciation × remaining useful life (assume 4 years remaining)
    const propertyPlantEquipment = depreciation * 4;
    const accountsPayable = Math.round(cogs * 20 / 365);

    // Debt structure: back-calculate from interest expense
    const totalDebt = interestExpense > 0 ? Math.round(interestExpense / 0.10) : 0;
    const shortTermDebt = Math.round(totalDebt * 0.20);
    const longTermDebt = Math.round(totalDebt * 0.80);

    // Owner's capital: balance the balance sheet
    const totalAssets = cash + accountsReceivable + inventory + propertyPlantEquipment;
    const totalLiabilities = accountsPayable + shortTermDebt + longTermDebt;
    const netIncome = revenue - cogs - operatingExpenses - depreciation - interestExpense - taxes;
    const ownerCapital = totalAssets - totalLiabilities - netIncome;

    return {
        cash,
        accountsReceivable,
        inventory,
        propertyPlantEquipment,
        accountsPayable,
        shortTermDebt,
        longTermDebt,
        ownerCapital: Math.max(ownerCapital, 0),
    };
}
