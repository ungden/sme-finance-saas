import { describe, it, expect } from "vitest";

// ── Pure business logic tests for Revenue Allocation Model ──
// These functions replicate the computation logic from FinanceOSContext
// to validate correctness without needing React rendering.

type AllocationCategory = "cogs" | "marketing" | "operations" | "payroll" | "profit";

interface AllocationRule {
    category: AllocationCategory;
    percent: number;
}

interface AllocationAmount {
    category: AllocationCategory;
    percent: number;
    amount: number;
}

interface Department {
    id: string;
    name: string;
    payroll_percent: number;
}

interface Employee {
    id: string;
    department_id: string;
    base_salary: number;
    bonus: number;
}

interface MarketingChannel {
    id: string;
    name: string;
    percent: number;
}

interface MarketingSpendEntry {
    channel_id: string;
    spend: number;
    leads: number;
    customers: number;
    revenue_attributed: number;
}

// Replicate allocation calculation from FinanceOSContext:260
function computeAllocations(rules: AllocationRule[], monthlyRevenue: number): AllocationAmount[] {
    const categories: AllocationCategory[] = ["cogs", "marketing", "operations", "payroll", "profit"];
    return categories.map(cat => {
        const rule = rules.find(r => r.category === cat);
        const percent = rule?.percent || 0;
        return { category: cat, percent, amount: monthlyRevenue * (percent / 100) };
    });
}

// Replicate department budget calculation from FinanceOSContext:274
function computeDepartmentBudgets(
    departments: Department[],
    employees: Employee[],
    payrollPool: number
) {
    return departments.map(dept => {
        const budget = payrollPool * (dept.payroll_percent / 100);
        const deptEmps = employees.filter(e => e.department_id === dept.id);
        const totalSalary = deptEmps.reduce((s, e) => s + e.base_salary, 0);
        const totalBonus = deptEmps.reduce((s, e) => s + e.bonus, 0);
        const totalUsed = totalSalary + totalBonus;
        return {
            department: dept,
            budget,
            totalSalary,
            totalBonus,
            totalUsed,
            remaining: budget - totalUsed,
            employees: deptEmps,
        };
    });
}

// Replicate channel ROI calculation from FinanceOSContext:371
function computeChannelROIs(
    channels: MarketingChannel[],
    marketingPool: number,
    spends: MarketingSpendEntry[]
) {
    return channels.map(ch => {
        const budget = marketingPool * (ch.percent / 100);
        const channelSpends = spends.filter(s => s.channel_id === ch.id);
        const totalSpend = channelSpends.reduce((s, e) => s + e.spend, 0);
        const totalLeads = channelSpends.reduce((s, e) => s + e.leads, 0);
        const totalCustomers = channelSpends.reduce((s, e) => s + e.customers, 0);
        const totalRevenue = channelSpends.reduce((s, e) => s + e.revenue_attributed, 0);
        const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const cac = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
        const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        return { channel: ch, budget, totalSpend, totalLeads, totalCustomers, totalRevenue, roi, cac, cpl, roas };
    });
}

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

describe("Revenue Allocation Model", () => {
    const defaultRules: AllocationRule[] = [
        { category: "cogs", percent: 30 },
        { category: "marketing", percent: 15 },
        { category: "operations", percent: 20 },
        { category: "payroll", percent: 20 },
        { category: "profit", percent: 15 },
    ];

    describe("computeAllocations", () => {
        it("should calculate correct amounts for standard allocation", () => {
            const revenue = 100_000_000; // 100M VND
            const result = computeAllocations(defaultRules, revenue);

            expect(result).toHaveLength(5);
            expect(result.find(a => a.category === "cogs")?.amount).toBe(30_000_000);
            expect(result.find(a => a.category === "marketing")?.amount).toBe(15_000_000);
            expect(result.find(a => a.category === "operations")?.amount).toBe(20_000_000);
            expect(result.find(a => a.category === "payroll")?.amount).toBe(20_000_000);
            expect(result.find(a => a.category === "profit")?.amount).toBe(15_000_000);
        });

        it("should sum to 100% of revenue when rules total 100%", () => {
            const revenue = 500_000_000;
            const result = computeAllocations(defaultRules, revenue);
            const totalAllocated = result.reduce((s, a) => s + a.amount, 0);
            expect(totalAllocated).toBe(revenue);
        });

        it("should handle zero revenue", () => {
            const result = computeAllocations(defaultRules, 0);
            result.forEach(a => {
                expect(a.amount).toBe(0);
            });
        });

        it("should handle missing rules (default to 0%)", () => {
            const partialRules: AllocationRule[] = [
                { category: "cogs", percent: 40 },
                { category: "profit", percent: 10 },
            ];
            const result = computeAllocations(partialRules, 100_000_000);
            expect(result.find(a => a.category === "cogs")?.amount).toBe(40_000_000);
            expect(result.find(a => a.category === "marketing")?.amount).toBe(0);
            expect(result.find(a => a.category === "operations")?.amount).toBe(0);
            expect(result.find(a => a.category === "payroll")?.amount).toBe(0);
            expect(result.find(a => a.category === "profit")?.amount).toBe(10_000_000);
        });

        it("should allow over-allocation (rules > 100%)", () => {
            const overRules: AllocationRule[] = [
                { category: "cogs", percent: 50 },
                { category: "marketing", percent: 30 },
                { category: "operations", percent: 30 },
                { category: "payroll", percent: 30 },
                { category: "profit", percent: 10 },
            ];
            const result = computeAllocations(overRules, 100_000_000);
            const totalPercent = result.reduce((s, a) => s + a.percent, 0);
            expect(totalPercent).toBe(150);
        });

        it("should preserve percent values in output", () => {
            const result = computeAllocations(defaultRules, 100_000_000);
            expect(result.find(a => a.category === "cogs")?.percent).toBe(30);
            expect(result.find(a => a.category === "profit")?.percent).toBe(15);
        });
    });

    describe("computeDepartmentBudgets", () => {
        const departments: Department[] = [
            { id: "d1", name: "Sales", payroll_percent: 40 },
            { id: "d2", name: "Engineering", payroll_percent: 35 },
            { id: "d3", name: "Admin", payroll_percent: 25 },
        ];

        const employees: Employee[] = [
            { id: "e1", department_id: "d1", base_salary: 3_000_000, bonus: 500_000 },
            { id: "e2", department_id: "d1", base_salary: 4_000_000, bonus: 1_000_000 },
            { id: "e3", department_id: "d2", base_salary: 5_000_000, bonus: 2_000_000 },
        ];

        it("should calculate budgets from payroll pool", () => {
            const payrollPool = 20_000_000;
            const result = computeDepartmentBudgets(departments, employees, payrollPool);

            expect(result[0].budget).toBe(8_000_000); // 40% of 20M
            expect(result[1].budget).toBe(7_000_000); // 35% of 20M
            expect(result[2].budget).toBe(5_000_000); // 25% of 20M
        });

        it("should calculate correct salary and bonus totals per department", () => {
            const result = computeDepartmentBudgets(departments, employees, 20_000_000);

            // Sales: 2 employees
            expect(result[0].totalSalary).toBe(7_000_000); // 3M + 4M
            expect(result[0].totalBonus).toBe(1_500_000);   // 500K + 1M
            expect(result[0].totalUsed).toBe(8_500_000);

            // Engineering: 1 employee
            expect(result[1].totalSalary).toBe(5_000_000);
            expect(result[1].totalBonus).toBe(2_000_000);
            expect(result[1].totalUsed).toBe(7_000_000);

            // Admin: 0 employees
            expect(result[2].totalSalary).toBe(0);
            expect(result[2].totalUsed).toBe(0);
        });

        it("should calculate remaining budget correctly", () => {
            const result = computeDepartmentBudgets(departments, employees, 20_000_000);

            // Sales budget 8M, used 8.5M => -500K (over budget)
            expect(result[0].remaining).toBe(-500_000);

            // Engineering budget 7M, used 7M => 0
            expect(result[1].remaining).toBe(0);

            // Admin budget 5M, used 0 => 5M
            expect(result[2].remaining).toBe(5_000_000);
        });

        it("should handle empty departments", () => {
            const result = computeDepartmentBudgets([], [], 20_000_000);
            expect(result).toHaveLength(0);
        });

        it("should handle zero payroll pool", () => {
            const result = computeDepartmentBudgets(departments, employees, 0);
            result.forEach(d => {
                expect(d.budget).toBe(0);
            });
        });
    });

    describe("computeChannelROIs", () => {
        const channels: MarketingChannel[] = [
            { id: "c1", name: "Facebook Ads", percent: 40 },
            { id: "c2", name: "Google Ads", percent: 35 },
            { id: "c3", name: "TikTok Ads", percent: 25 },
        ];

        const spends: MarketingSpendEntry[] = [
            { channel_id: "c1", spend: 5_000_000, leads: 200, customers: 20, revenue_attributed: 15_000_000 },
            { channel_id: "c1", spend: 6_000_000, leads: 250, customers: 25, revenue_attributed: 18_000_000 },
            { channel_id: "c2", spend: 10_000_000, leads: 100, customers: 10, revenue_attributed: 8_000_000 },
        ];

        it("should calculate correct budget allocation", () => {
            const marketingPool = 15_000_000;
            const result = computeChannelROIs(channels, marketingPool, spends);

            expect(result[0].budget).toBe(6_000_000);  // 40% of 15M
            expect(result[1].budget).toBe(5_250_000);  // 35% of 15M
            expect(result[2].budget).toBe(3_750_000);  // 25% of 15M
        });

        it("should aggregate spend across multiple entries", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // Facebook: 5M + 6M = 11M spend
            expect(result[0].totalSpend).toBe(11_000_000);
            expect(result[0].totalLeads).toBe(450); // 200 + 250
            expect(result[0].totalCustomers).toBe(45); // 20 + 25
            expect(result[0].totalRevenue).toBe(33_000_000); // 15M + 18M
        });

        it("should calculate ROI correctly", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // Facebook ROI: (33M - 11M) / 11M * 100 = 200%
            expect(result[0].roi).toBeCloseTo(200, 1);

            // Google ROI: (8M - 10M) / 10M * 100 = -20%
            expect(result[1].roi).toBeCloseTo(-20, 1);
        });

        it("should calculate CAC correctly", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // Facebook CAC: 11M / 45 customers = ~244,444
            expect(result[0].cac).toBeCloseTo(244_444, -2);

            // Google CAC: 10M / 10 customers = 1,000,000
            expect(result[1].cac).toBe(1_000_000);
        });

        it("should calculate CPL correctly", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // Facebook CPL: 11M / 450 leads = ~24,444
            expect(result[0].cpl).toBeCloseTo(24_444, -2);
        });

        it("should calculate ROAS correctly", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // Facebook ROAS: 33M / 11M = 3.0
            expect(result[0].roas).toBe(3);

            // Google ROAS: 8M / 10M = 0.8
            expect(result[1].roas).toBeCloseTo(0.8, 2);
        });

        it("should handle channel with no spend data", () => {
            const result = computeChannelROIs(channels, 15_000_000, spends);

            // TikTok has no spend data
            expect(result[2].totalSpend).toBe(0);
            expect(result[2].roi).toBe(0);
            expect(result[2].cac).toBe(0);
            expect(result[2].cpl).toBe(0);
            expect(result[2].roas).toBe(0);
        });

        it("should handle zero customers (avoid divide by zero for CAC)", () => {
            const zeroCustomers: MarketingSpendEntry[] = [
                { channel_id: "c1", spend: 5_000_000, leads: 100, customers: 0, revenue_attributed: 0 },
            ];
            const result = computeChannelROIs(channels, 15_000_000, zeroCustomers);
            expect(result[0].cac).toBe(0);
        });
    });
});

describe("ERP getActualSpend logic", () => {
    interface Invoice {
        type: string;
        status: string;
        category: string;
        date: string;
        amount: number;
    }

    // Replicate logic from ERPContext:181
    function getActualSpend(invoices: Invoice[], year: number, category: string): number {
        return invoices
            .filter(inv => inv.type === "expense" && inv.status === "paid" && inv.category === category && inv.date.startsWith(String(year)))
            .reduce((sum, inv) => sum + inv.amount, 0);
    }

    const invoices: Invoice[] = [
        { type: "expense", status: "paid", category: "Marketing", date: "2025-03-01", amount: 5_000_000 },
        { type: "expense", status: "paid", category: "Marketing", date: "2025-06-15", amount: 3_000_000 },
        { type: "expense", status: "draft", category: "Marketing", date: "2025-07-01", amount: 2_000_000 },
        { type: "income", status: "paid", category: "Doanh thu", date: "2025-03-01", amount: 50_000_000 },
        { type: "expense", status: "paid", category: "Marketing", date: "2024-12-01", amount: 4_000_000 },
        { type: "expense", status: "paid", category: "Luong & Nhan su", date: "2025-04-01", amount: 10_000_000 },
    ];

    it("should sum only paid expenses for the given year and category", () => {
        const result = getActualSpend(invoices, 2025, "Marketing");
        expect(result).toBe(8_000_000); // 5M + 3M (not 2M draft, not 4M from 2024)
    });

    it("should return 0 for year with no matching expenses", () => {
        const result = getActualSpend(invoices, 2023, "Marketing");
        expect(result).toBe(0);
    });

    it("should not include income invoices", () => {
        const result = getActualSpend(invoices, 2025, "Doanh thu");
        expect(result).toBe(0); // type is "income", not "expense"
    });

    it("should filter by category correctly", () => {
        const result = getActualSpend(invoices, 2025, "Luong & Nhan su");
        expect(result).toBe(10_000_000);
    });

    it("should handle empty invoice list", () => {
        const result = getActualSpend([], 2025, "Marketing");
        expect(result).toBe(0);
    });
});

describe("Cashflow Summary calculations", () => {
    interface CashflowEntry {
        date: string;
        revenue: number;
        expense: number;
    }

    // Replicate from FinanceOSContext:306
    function computeCashflowSummary(entries: CashflowEntry[], todayStr: string) {
        const todayEntries = entries.filter(cf => cf.date === todayStr);
        const totalRevenue = entries.reduce((s, cf) => s + cf.revenue, 0);
        const totalExpense = entries.reduce((s, cf) => s + cf.expense, 0);
        const todayRevenue = todayEntries.reduce((s, cf) => s + cf.revenue, 0);
        const todayExpense = todayEntries.reduce((s, cf) => s + cf.expense, 0);
        const uniqueDates = new Set(entries.map(cf => cf.date));
        const daysWithData = uniqueDates.size;
        const avgDailyNet = daysWithData > 0 ? (totalRevenue - totalExpense) / daysWithData : 0;
        const currentCash = totalRevenue - totalExpense;
        const cashRunway = avgDailyNet < 0 ? Math.abs(currentCash / avgDailyNet) : Infinity;

        return {
            totalRevenue,
            totalExpense,
            netFlow: totalRevenue - totalExpense,
            todayRevenue,
            todayExpense,
            todayNet: todayRevenue - todayExpense,
            daysWithData,
            avgDailyNet,
            cashRunway,
        };
    }

    it("should calculate totals correctly", () => {
        const entries: CashflowEntry[] = [
            { date: "2025-03-01", revenue: 10_000_000, expense: 3_000_000 },
            { date: "2025-03-02", revenue: 8_000_000, expense: 5_000_000 },
            { date: "2025-03-03", revenue: 12_000_000, expense: 4_000_000 },
        ];
        const result = computeCashflowSummary(entries, "2025-03-02");

        expect(result.totalRevenue).toBe(30_000_000);
        expect(result.totalExpense).toBe(12_000_000);
        expect(result.netFlow).toBe(18_000_000);
    });

    it("should calculate today's values", () => {
        const entries: CashflowEntry[] = [
            { date: "2025-03-01", revenue: 10_000_000, expense: 3_000_000 },
            { date: "2025-03-02", revenue: 8_000_000, expense: 5_000_000 },
            { date: "2025-03-02", revenue: 2_000_000, expense: 1_000_000 },
        ];
        const result = computeCashflowSummary(entries, "2025-03-02");

        expect(result.todayRevenue).toBe(10_000_000); // 8M + 2M
        expect(result.todayExpense).toBe(6_000_000); // 5M + 1M
        expect(result.todayNet).toBe(4_000_000);
    });

    it("should count unique dates", () => {
        const entries: CashflowEntry[] = [
            { date: "2025-03-01", revenue: 10_000_000, expense: 3_000_000 },
            { date: "2025-03-01", revenue: 5_000_000, expense: 2_000_000 },
            { date: "2025-03-02", revenue: 8_000_000, expense: 5_000_000 },
        ];
        const result = computeCashflowSummary(entries, "2025-03-01");
        expect(result.daysWithData).toBe(2);
    });

    it("should calculate average daily net", () => {
        const entries: CashflowEntry[] = [
            { date: "2025-03-01", revenue: 10_000_000, expense: 4_000_000 },
            { date: "2025-03-02", revenue: 8_000_000, expense: 2_000_000 },
        ];
        const result = computeCashflowSummary(entries, "2025-03-01");
        // net = 18M - 6M = 12M, days = 2, avg = 6M
        expect(result.avgDailyNet).toBe(6_000_000);
    });

    it("should return Infinity runway when net is positive", () => {
        const entries: CashflowEntry[] = [
            { date: "2025-03-01", revenue: 10_000_000, expense: 3_000_000 },
        ];
        const result = computeCashflowSummary(entries, "2025-03-01");
        expect(result.cashRunway).toBe(Infinity);
    });

    it("should handle empty entries", () => {
        const result = computeCashflowSummary([], "2025-03-01");
        expect(result.totalRevenue).toBe(0);
        expect(result.totalExpense).toBe(0);
        expect(result.daysWithData).toBe(0);
        expect(result.avgDailyNet).toBe(0);
    });
});

describe("formatVND utility", () => {
    function formatVND(val: number): string {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Math.abs(val));
    }

    it("should format positive VND values", () => {
        const result = formatVND(1_000_000);
        // Intl output varies by environment but should contain the number
        expect(result).toContain("1.000.000");
    });

    it("should format negative as absolute value", () => {
        const result = formatVND(-5_000_000);
        expect(result).toContain("5.000.000");
    });

    it("should handle zero", () => {
        const result = formatVND(0);
        expect(result).toContain("0");
    });
});
