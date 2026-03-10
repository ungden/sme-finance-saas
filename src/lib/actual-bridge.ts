// ── Actual Bridge: Daily Cashflow → Annual YearData ──
// Converts daily cashflow entries into a YearData object for the Dashboard,
// using allocation rules to split aggregate expenses into categories.

import type { YearData, DailyCashflow, AllocationRule } from "@/lib/types";

/**
 * Compute an "Actual" YearData from daily cashflow entries for a given year.
 *
 * Revenue: sum of all daily revenue entries for the year.
 * Expenses: sum of all daily expense entries, split by allocation rules:
 *   - COGS%  → YearData.cogs
 *   - Marketing% + Operations% + Payroll% → YearData.operatingExpenses
 *   - Profit% is excluded from expenses (it's the residual)
 *
 * Balance Sheet items are estimated from P&L using industry ratios.
 */
export function computeActualYearData(
    cashflowEntries: DailyCashflow[],
    allocationRules: AllocationRule[],
    year: number,
    planYearData?: YearData | null,
): YearData {
    // Filter entries for the target year
    const yearPrefix = `${year}`;
    const yearEntries = cashflowEntries.filter(cf => cf.date.startsWith(yearPrefix));

    // Aggregate revenue and expenses
    const totalRevenue = yearEntries.reduce((sum, cf) => sum + cf.revenue, 0);
    const totalExpense = yearEntries.reduce((sum, cf) => sum + cf.expense, 0);

    // Get allocation percentages (exclude 'profit' — it's not an expense)
    const cogsRule = allocationRules.find(r => r.category === "cogs");
    const mktRule = allocationRules.find(r => r.category === "marketing");
    const opsRule = allocationRules.find(r => r.category === "operations");
    const payrollRule = allocationRules.find(r => r.category === "payroll");

    const cogsPercent = cogsRule?.percent || 30;
    const mktPercent = mktRule?.percent || 15;
    const opsPercent = opsRule?.percent || 20;
    const payrollPercent = payrollRule?.percent || 20;

    // Total expense-allocatable percentages (excluding profit)
    const totalExpensePercent = cogsPercent + mktPercent + opsPercent + payrollPercent;

    // Split total expense proportionally
    const cogs = totalExpensePercent > 0
        ? Math.round(totalExpense * cogsPercent / totalExpensePercent)
        : Math.round(totalExpense * 0.35);

    const operatingExpenses = totalExpensePercent > 0
        ? Math.round(totalExpense * (mktPercent + opsPercent + payrollPercent) / totalExpensePercent)
        : Math.round(totalExpense * 0.65);

    // Depreciation & Interest: use plan ratios if available, else estimate
    let depreciation = 0;
    let interestExpense = 0;
    if (planYearData && planYearData.revenue > 0) {
        const depreciationRatio = planYearData.depreciation / planYearData.revenue;
        const interestRatio = planYearData.interestExpense / planYearData.revenue;
        depreciation = Math.round(totalRevenue * depreciationRatio);
        interestExpense = Math.round(totalRevenue * interestRatio);
    }

    // Taxes: 20% CIT on profit before tax (if positive)
    const ebt = totalRevenue - cogs - operatingExpenses - depreciation - interestExpense;
    const taxes = ebt > 0 ? Math.round(ebt * 0.20) : 0;

    // ── Balance Sheet: derive from P&L actuals ──
    // Use plan's balance sheet ratios if available for consistency,
    // otherwise use reasonable defaults.
    let cash = 0, accountsReceivable = 0, inventory = 0, propertyPlantEquipment = 0;
    let accountsPayable = 0, shortTermDebt = 0, longTermDebt = 0, ownerCapital = 0;

    if (planYearData && planYearData.revenue > 0) {
        // Scale plan's balance sheet items by actual/plan revenue ratio
        const scale = totalRevenue / planYearData.revenue;
        cash = Math.round(planYearData.cash * scale);
        accountsReceivable = Math.round(planYearData.accountsReceivable * scale);
        inventory = Math.round(planYearData.inventory * scale);
        propertyPlantEquipment = planYearData.propertyPlantEquipment; // PPE doesn't scale with revenue
        accountsPayable = Math.round(planYearData.accountsPayable * scale);
        shortTermDebt = planYearData.shortTermDebt; // Debt stays as planned
        longTermDebt = planYearData.longTermDebt;
        ownerCapital = planYearData.ownerCapital;
    } else {
        // Fallback: simple estimates
        const monthlyOpex = (cogs + operatingExpenses) / 12;
        cash = Math.round(monthlyOpex * 2);
        accountsReceivable = Math.round(totalRevenue * 15 / 365);
        inventory = Math.round(cogs * 15 / 365);
        propertyPlantEquipment = depreciation * 4;
        accountsPayable = Math.round(cogs * 20 / 365);
    }

    return {
        id: year.toString(),
        year,
        revenue: totalRevenue,
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
