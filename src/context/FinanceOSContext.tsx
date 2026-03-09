"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useWorkspace } from "./WorkspaceContext";
import * as api from "@/lib/finance-os";
import type {
    AllocationRule,
    AllocationCategory,
    AllocationAmount,
    Department,
    DepartmentBudget,
    EmployeeAssignment,
    MarketingChannel,
    ChannelBudget,
    DailyCashflow,
    CashflowSource,
    FinancialPlan,
    MonthlyTarget,
    PlanStatus,
    PlanVsActual,
    MarketingSpend,
    ChannelROI,
    CashflowForecast,
    ForecastScenario,
    ForecastMonth,
    ForecastAssumptions,
} from "@/lib/types";

// ── Context Type ──

interface FinanceOSContextType {
    // State
    allocationRules: AllocationRule[];
    departments: Department[];
    employees: EmployeeAssignment[];
    marketingChannels: MarketingChannel[];
    dailyCashflow: DailyCashflow[];
    isLoaded: boolean;
    isSaving: boolean;

    // Computed
    monthlyRevenue: number;
    allocations: AllocationAmount[];
    payrollPool: number;
    marketingPool: number;
    departmentBudgets: DepartmentBudget[];
    channelBudgets: ChannelBudget[];
    totalAllocPercent: number;
    totalDeptPercent: number;
    totalChannelPercent: number;

    // Cashflow computed
    cashflowSummary: {
        totalRevenue: number;
        totalExpense: number;
        netFlow: number;
        todayRevenue: number;
        todayExpense: number;
        todayNet: number;
        daysWithData: number;
        avgDailyNet: number;
        cashRunway: number;
    };

    // Manual revenue override for simulation
    revenueOverride: number | null;
    setRevenueOverride: (v: number | null) => void;

    // Mutations: Allocation Rules
    updateAllocationRule: (category: AllocationCategory, percent: number) => void;
    saveAllocationRules: () => Promise<void>;

    // Mutations: Departments
    addDepartment: (name: string, payrollPercent: number) => Promise<void>;
    updateDept: (id: string, updates: Partial<Pick<Department, "name" | "payroll_percent">>) => Promise<void>;
    removeDepartment: (id: string) => Promise<void>;

    // Mutations: Employee Assignments
    addEmployeeAssignment: (deptId: string, name: string, role: string, baseSalary: number, bonus: number) => Promise<void>;
    updateEmployeeAssign: (id: string, updates: Partial<Pick<EmployeeAssignment, "employee_name" | "role" | "base_salary" | "bonus" | "department_id">>) => Promise<void>;
    removeEmployeeAssignment: (id: string) => Promise<void>;

    // Mutations: Marketing Channels
    addMarketingChannel: (name: string, percent: number) => Promise<void>;
    updateChannel: (id: string, updates: Partial<Pick<MarketingChannel, "name" | "percent">>) => Promise<void>;
    removeMarketingChannel: (id: string) => Promise<void>;

    // Mutations: Daily Cashflow
    addCashflowEntry: (entry: { date: string; revenue: number; expense: number; source: CashflowSource; notes: string }) => Promise<void>;
    updateCashflowEntry: (id: string, updates: Partial<Pick<DailyCashflow, "date" | "revenue" | "expense" | "source" | "notes">>) => Promise<void>;
    removeCashflowEntry: (id: string) => Promise<void>;

    // ── Financial Plans ──
    plans: FinancialPlan[];
    activePlan: FinancialPlan | null;
    activePlanTargets: MonthlyTarget[];
    planVsActual: PlanVsActual[];
    setActivePlanId: (id: string | null) => void;
    createPlan: (plan: {
        name: string;
        year: number;
        annual_revenue_target: number;
        industry: string;
        business_context: string;
        ai_summary: string;
    }) => Promise<FinancialPlan>;
    savePlanTargets: (planId: string, targets: {
        month: number; revenue: number; cogs: number; marketing: number;
        operations: number; payroll: number; profit: number; notes: string;
    }[]) => Promise<void>;
    updatePlanStatus: (id: string, status: PlanStatus) => Promise<void>;
    removePlan: (id: string) => Promise<void>;

    // ── Marketing Spend (ROI) ──
    marketingSpend: MarketingSpend[];
    channelROIs: ChannelROI[];
    addMarketingSpend: (entry: {
        channel_id: string; month: string; spend: number;
        leads: number; customers: number; revenue_attributed: number; notes: string;
    }) => Promise<void>;
    updateMarketingSpendEntry: (id: string, updates: Partial<Pick<MarketingSpend, "spend" | "leads" | "customers" | "revenue_attributed" | "notes">>) => Promise<void>;
    removeMarketingSpend: (id: string) => Promise<void>;

    // ── Cashflow Forecasts ──
    forecasts: CashflowForecast[];
    activeForecast: CashflowForecast | null;
    setActiveForecastId: (id: string | null) => void;
    createForecast: (forecast: {
        name: string; scenario: ForecastScenario; forecast_months: number;
        monthly_data: ForecastMonth[]; assumptions: ForecastAssumptions; ai_summary: string;
    }) => Promise<CashflowForecast>;
    removeForecast: (id: string) => Promise<void>;

    // Refresh
    refresh: () => Promise<void>;

    // Utility
    formatVND: (val: number) => string;
}

const FinanceOSContext = createContext<FinanceOSContextType | null>(null);

export function useFinanceOS() {
    const ctx = useContext(FinanceOSContext);
    if (!ctx) throw new Error("useFinanceOS must be used within FinanceOSProvider");
    return ctx;
}

// ── Provider ──

export function FinanceOSProvider({ children }: { children: React.ReactNode }) {
    const ws = useWorkspace();
    const workspaceId = ws.currentWorkspace?.id || null;

    // State
    const [allocationRules, setAllocationRules] = useState<AllocationRule[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<EmployeeAssignment[]>([]);
    const [marketingChannels, setMarketingChannels] = useState<MarketingChannel[]>([]);
    const [dailyCashflow, setDailyCashflow] = useState<DailyCashflow[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [revenueOverride, setRevenueOverride] = useState<number | null>(null);

    // Plan state
    const [plans, setPlans] = useState<FinancialPlan[]>([]);
    const [activePlanId, setActivePlanIdState] = useState<string | null>(null);
    const [activePlanTargets, setActivePlanTargets] = useState<MonthlyTarget[]>([]);

    // Marketing spend state
    const [marketingSpend, setMarketingSpend] = useState<MarketingSpend[]>([]);

    // Cashflow forecast state
    const [forecasts, setForecasts] = useState<CashflowForecast[]>([]);
    const [activeForecastId, setActiveForecastIdState] = useState<string | null>(null);

    // ── Load data when workspace changes ──
    const loadData = useCallback(async () => {
        if (!workspaceId) {
            setAllocationRules([]);
            setDepartments([]);
            setEmployees([]);
            setMarketingChannels([]);
            setDailyCashflow([]);
            setPlans([]);
            setActivePlanTargets([]);
            setMarketingSpend([]);
            setForecasts([]);
            setIsLoaded(true);
            return;
        }

        try {
            const [rules, depts, emps, channels, cashflow, plansData, spendData, forecastsData] = await Promise.all([
                api.getAllocationRules(workspaceId),
                api.getDepartments(workspaceId),
                api.getEmployeeAssignments(workspaceId),
                api.getMarketingChannels(workspaceId),
                api.getDailyCashflow(workspaceId),
                api.getFinancialPlans(workspaceId),
                api.getMarketingSpend(workspaceId),
                api.getCashflowForecasts(workspaceId),
            ]);
            setAllocationRules(rules);
            setDepartments(depts);
            setEmployees(emps);
            setMarketingChannels(channels);
            setDailyCashflow(cashflow);
            setPlans(plansData);
            setMarketingSpend(spendData);
            setForecasts(forecastsData);
            // Auto-select active plan
            const active = plansData.find(p => p.status === "active") || plansData[0] || null;
            if (active) {
                setActivePlanIdState(active.id);
            }
        } catch (err) {
            console.error("FinanceOS: Failed to load data", err);
        } finally {
            setIsLoaded(true);
        }
    }, [workspaceId]);

    useEffect(() => {
        setIsLoaded(false);
        loadData();
    }, [loadData]);

    // ── Load plan targets when activePlanId changes ──
    useEffect(() => {
        if (!activePlanId) {
            setActivePlanTargets([]);
            return;
        }
        let cancelled = false;
        api.getMonthlyTargets(activePlanId).then(targets => {
            if (!cancelled) setActivePlanTargets(targets);
        }).catch(err => console.error("Failed to load plan targets", err));
        return () => { cancelled = true; };
    }, [activePlanId]);

    const activePlan = useMemo(() => plans.find(p => p.id === activePlanId) || null, [plans, activePlanId]);

    const setActivePlanId = useCallback((id: string | null) => {
        setActivePlanIdState(id);
    }, []);

    // ── Computed: Monthly Revenue ──
    const monthlyRevenue = useMemo(() => {
        if (revenueOverride !== null) return revenueOverride;

        // Calculate from current month's cashflow entries
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthEntries = dailyCashflow.filter(cf => cf.date.startsWith(currentMonth));
        return monthEntries.reduce((sum, cf) => sum + cf.revenue, 0);
    }, [dailyCashflow, revenueOverride]);

    // ── Computed: Allocations ──
    const allocations = useMemo<AllocationAmount[]>(() => {
        const categories: AllocationCategory[] = ["cogs", "marketing", "operations", "payroll", "profit"];
        return categories.map(cat => {
            const rule = allocationRules.find(r => r.category === cat);
            const percent = rule?.percent || 0;
            return { category: cat, percent, amount: monthlyRevenue * (percent / 100) };
        });
    }, [allocationRules, monthlyRevenue]);

    const totalAllocPercent = useMemo(() => allocations.reduce((s, a) => s + a.percent, 0), [allocations]);
    const payrollPool = useMemo(() => allocations.find(a => a.category === "payroll")?.amount || 0, [allocations]);
    const marketingPool = useMemo(() => allocations.find(a => a.category === "marketing")?.amount || 0, [allocations]);

    // ── Computed: Department Budgets ──
    const departmentBudgets = useMemo<DepartmentBudget[]>(() => {
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
    }, [departments, employees, payrollPool]);

    const totalDeptPercent = useMemo(() => departments.reduce((s, d) => s + d.payroll_percent, 0), [departments]);

    // ── Computed: Marketing Channel Budgets ──
    const channelBudgets = useMemo<ChannelBudget[]>(() => {
        return marketingChannels.map(ch => ({
            channel: ch,
            budget: marketingPool * (ch.percent / 100),
        }));
    }, [marketingChannels, marketingPool]);

    const totalChannelPercent = useMemo(() => marketingChannels.reduce((s, c) => s + c.percent, 0), [marketingChannels]);

    // ── Computed: Cashflow Summary ──
    const cashflowSummary = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const todayEntries = dailyCashflow.filter(cf => cf.date === today);
        const totalRevenue = dailyCashflow.reduce((s, cf) => s + cf.revenue, 0);
        const totalExpense = dailyCashflow.reduce((s, cf) => s + cf.expense, 0);
        const todayRevenue = todayEntries.reduce((s, cf) => s + cf.revenue, 0);
        const todayExpense = todayEntries.reduce((s, cf) => s + cf.expense, 0);
        const uniqueDates = new Set(dailyCashflow.map(cf => cf.date));
        const daysWithData = uniqueDates.size;
        const avgDailyNet = daysWithData > 0 ? (totalRevenue - totalExpense) / daysWithData : 0;
        // Cash runway: if burning cash, how many days until 0 (using current cash balance from workspace)
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
    }, [dailyCashflow]);

    // ── Computed: Plan vs Actual ──
    const planVsActual = useMemo<PlanVsActual[]>(() => {
        if (!activePlan || activePlanTargets.length === 0) return [];

        const monthLabels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

        return activePlanTargets.map(target => {
            // Get actual data from dailyCashflow for this month
            const monthStr = `${activePlan.year}-${String(target.month).padStart(2, "0")}`;
            const monthEntries = dailyCashflow.filter(cf => cf.date.startsWith(monthStr));
            const actualRevenue = monthEntries.reduce((s, cf) => s + cf.revenue, 0);
            const actualExpense = monthEntries.reduce((s, cf) => s + cf.expense, 0);

            const variance = actualRevenue - target.revenue;
            const variancePercent = target.revenue > 0 ? (variance / target.revenue) * 100 : 0;

            return {
                month: target.month,
                monthLabel: monthLabels[target.month - 1],
                planned: {
                    revenue: target.revenue,
                    cogs: target.cogs,
                    marketing: target.marketing,
                    operations: target.operations,
                    payroll: target.payroll,
                    profit: target.profit,
                },
                actual: {
                    revenue: actualRevenue,
                    expense: actualExpense,
                },
                variance,
                variancePercent,
            };
        });
    }, [activePlan, activePlanTargets, dailyCashflow]);

    // ── Computed: Channel ROIs ──
    const channelROIs = useMemo<ChannelROI[]>(() => {
        return marketingChannels.map(ch => {
            const budget = marketingPool * (ch.percent / 100);
            const spends = marketingSpend.filter(s => s.channel_id === ch.id);
            const totalSpend = spends.reduce((s, e) => s + e.spend, 0);
            const totalLeads = spends.reduce((s, e) => s + e.leads, 0);
            const totalCustomers = spends.reduce((s, e) => s + e.customers, 0);
            const totalRevenue = spends.reduce((s, e) => s + e.revenue_attributed, 0);
            const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
            const cac = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
            const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
            const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
            return { channel: ch, budget, totalSpend, totalLeads, totalCustomers, totalRevenue, roi, cac, cpl, roas, spendByMonth: spends };
        });
    }, [marketingChannels, marketingPool, marketingSpend]);

    // ── Active Forecast ──
    const activeForecast = useMemo(() => forecasts.find(f => f.id === activeForecastId) || null, [forecasts, activeForecastId]);
    const setActiveForecastId = useCallback((id: string | null) => { setActiveForecastIdState(id); }, []);

    // ── Format VND ──
    const formatVND = useCallback((val: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Math.abs(val));
    }, []);

    // ════════════════════════════════════════
    // MUTATIONS
    // ════════════════════════════════════════

    // ── Allocation Rules (optimistic local + batch save) ──
    const updateAllocationRule = useCallback((category: AllocationCategory, percent: number) => {
        setAllocationRules(prev =>
            prev.map(r => (r.category === category ? { ...r, percent } : r))
        );
    }, []);

    const saveAllocationRules = useCallback(async () => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            await api.bulkUpdateAllocationRules(
                workspaceId,
                allocationRules.map(r => ({ category: r.category, percent: r.percent }))
            );
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId, allocationRules]);

    // ── Departments ──
    const addDepartment = useCallback(async (name: string, payrollPercent: number) => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            const dept = await api.createDepartment(workspaceId, name, payrollPercent);
            setDepartments(prev => [...prev, dept]);
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const updateDept = useCallback(async (id: string, updates: Partial<Pick<Department, "name" | "payroll_percent">>) => {
        setDepartments(prev => prev.map(d => (d.id === id ? { ...d, ...updates } : d)));
        setIsSaving(true);
        try {
            await api.updateDepartment(id, updates);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removeDepartment = useCallback(async (id: string) => {
        setDepartments(prev => prev.filter(d => d.id !== id));
        setEmployees(prev => prev.filter(e => e.department_id !== id));
        setIsSaving(true);
        try {
            await api.deleteDepartment(id);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Employee Assignments ──
    const addEmployeeAssignment = useCallback(async (
        deptId: string, name: string, role: string, baseSalary: number, bonus: number
    ) => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            const emp = await api.createEmployeeAssignment(workspaceId, deptId, name, role, baseSalary, bonus);
            setEmployees(prev => [...prev, emp]);
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const updateEmployeeAssign = useCallback(async (
        id: string,
        updates: Partial<Pick<EmployeeAssignment, "employee_name" | "role" | "base_salary" | "bonus" | "department_id">>
    ) => {
        setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
        setIsSaving(true);
        try {
            await api.updateEmployeeAssignment(id, updates);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removeEmployeeAssignment = useCallback(async (id: string) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
        setIsSaving(true);
        try {
            await api.deleteEmployeeAssignment(id);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Marketing Channels ──
    const addMarketingChannel = useCallback(async (name: string, percent: number) => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            const ch = await api.createMarketingChannel(workspaceId, name, percent);
            setMarketingChannels(prev => [...prev, ch]);
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const updateChannel = useCallback(async (id: string, updates: Partial<Pick<MarketingChannel, "name" | "percent">>) => {
        setMarketingChannels(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
        setIsSaving(true);
        try {
            await api.updateMarketingChannel(id, updates);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removeMarketingChannel = useCallback(async (id: string) => {
        setMarketingChannels(prev => prev.filter(c => c.id !== id));
        setIsSaving(true);
        try {
            await api.deleteMarketingChannel(id);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Daily Cashflow ──
    const addCashflowEntry = useCallback(async (entry: {
        date: string; revenue: number; expense: number; source: CashflowSource; notes: string;
    }) => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            const cf = await api.createDailyCashflowEntry(workspaceId, entry);
            setDailyCashflow(prev => [cf, ...prev]);
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const updateCashflowEntry = useCallback(async (
        id: string,
        updates: Partial<Pick<DailyCashflow, "date" | "revenue" | "expense" | "source" | "notes">>
    ) => {
        setDailyCashflow(prev => prev.map(cf => (cf.id === id ? { ...cf, ...updates } : cf)));
        setIsSaving(true);
        try {
            await api.updateDailyCashflowEntry(id, updates);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removeCashflowEntry = useCallback(async (id: string) => {
        setDailyCashflow(prev => prev.filter(cf => cf.id !== id));
        setIsSaving(true);
        try {
            await api.deleteDailyCashflowEntry(id);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Financial Plans ──
    const createPlan = useCallback(async (plan: {
        name: string; year: number; annual_revenue_target: number;
        industry: string; business_context: string; ai_summary: string;
    }): Promise<FinancialPlan> => {
        if (!workspaceId) throw new Error("No workspace");
        setIsSaving(true);
        try {
            const created = await api.createFinancialPlan(workspaceId, plan);
            setPlans(prev => [created, ...prev]);
            setActivePlanIdState(created.id);
            return created;
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const savePlanTargets = useCallback(async (
        planId: string,
        targets: { month: number; revenue: number; cogs: number; marketing: number; operations: number; payroll: number; profit: number; notes: string; }[]
    ) => {
        setIsSaving(true);
        try {
            await api.bulkUpsertMonthlyTargets(planId, targets);
            // Reload targets
            const updated = await api.getMonthlyTargets(planId);
            setActivePlanTargets(updated);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const updatePlanStatus = useCallback(async (id: string, status: PlanStatus) => {
        setPlans(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
        setIsSaving(true);
        try {
            await api.updateFinancialPlan(id, { status });
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removePlan = useCallback(async (id: string) => {
        setPlans(prev => prev.filter(p => p.id !== id));
        if (activePlanId === id) {
            setActivePlanIdState(null);
            setActivePlanTargets([]);
        }
        setIsSaving(true);
        try {
            await api.deleteFinancialPlan(id);
        } finally {
            setIsSaving(false);
        }
    }, [activePlanId]);

    // ── Marketing Spend ──
    const addMarketingSpend = useCallback(async (entry: {
        channel_id: string; month: string; spend: number;
        leads: number; customers: number; revenue_attributed: number; notes: string;
    }) => {
        if (!workspaceId) return;
        setIsSaving(true);
        try {
            const created = await api.createMarketingSpend(workspaceId, entry);
            setMarketingSpend(prev => {
                // Replace if same channel+month (upsert)
                const existing = prev.findIndex(s => s.channel_id === entry.channel_id && s.month === entry.month);
                if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = created;
                    return updated;
                }
                return [created, ...prev];
            });
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const updateMarketingSpendEntry = useCallback(async (
        id: string,
        updates: Partial<Pick<MarketingSpend, "spend" | "leads" | "customers" | "revenue_attributed" | "notes">>
    ) => {
        setMarketingSpend(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
        setIsSaving(true);
        try {
            await api.updateMarketingSpend(id, updates);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const removeMarketingSpend = useCallback(async (id: string) => {
        setMarketingSpend(prev => prev.filter(s => s.id !== id));
        setIsSaving(true);
        try {
            await api.deleteMarketingSpend(id);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Cashflow Forecasts ──
    const createForecast = useCallback(async (forecast: {
        name: string; scenario: ForecastScenario; forecast_months: number;
        monthly_data: ForecastMonth[]; assumptions: ForecastAssumptions; ai_summary: string;
    }): Promise<CashflowForecast> => {
        if (!workspaceId) throw new Error("No workspace");
        setIsSaving(true);
        try {
            const created = await api.createCashflowForecast(workspaceId, forecast);
            setForecasts(prev => [created, ...prev]);
            setActiveForecastIdState(created.id);
            return created;
        } finally {
            setIsSaving(false);
        }
    }, [workspaceId]);

    const removeForecast = useCallback(async (id: string) => {
        setForecasts(prev => prev.filter(f => f.id !== id));
        if (activeForecastId === id) {
            setActiveForecastIdState(null);
        }
        setIsSaving(true);
        try {
            await api.deleteCashflowForecast(id);
        } finally {
            setIsSaving(false);
        }
    }, [activeForecastId]);

    const refresh = useCallback(async () => {
        await loadData();
    }, [loadData]);

    // ── Context value ──
    const value = useMemo<FinanceOSContextType>(() => ({
        allocationRules,
        departments,
        employees,
        marketingChannels,
        dailyCashflow,
        isLoaded,
        isSaving,
        monthlyRevenue,
        allocations,
        payrollPool,
        marketingPool,
        departmentBudgets,
        channelBudgets,
        totalAllocPercent,
        totalDeptPercent,
        totalChannelPercent,
        cashflowSummary,
        revenueOverride,
        setRevenueOverride,
        plans,
        activePlan,
        activePlanTargets,
        planVsActual,
        setActivePlanId,
        createPlan,
        savePlanTargets,
        updatePlanStatus,
        removePlan,
        updateAllocationRule,
        saveAllocationRules,
        addDepartment,
        updateDept,
        removeDepartment,
        addEmployeeAssignment,
        updateEmployeeAssign,
        removeEmployeeAssignment,
        addMarketingChannel,
        updateChannel,
        removeMarketingChannel,
        addCashflowEntry,
        updateCashflowEntry,
        removeCashflowEntry,
        marketingSpend,
        channelROIs,
        addMarketingSpend,
        updateMarketingSpendEntry,
        removeMarketingSpend,
        forecasts,
        activeForecast,
        setActiveForecastId,
        createForecast,
        removeForecast,
        refresh,
        formatVND,
    }), [
        allocationRules, departments, employees, marketingChannels, dailyCashflow,
        isLoaded, isSaving, monthlyRevenue, allocations, payrollPool, marketingPool,
        departmentBudgets, channelBudgets, totalAllocPercent, totalDeptPercent, totalChannelPercent,
        cashflowSummary, revenueOverride,
        plans, activePlan, activePlanTargets, planVsActual, activePlanId,
        setActivePlanId, createPlan, savePlanTargets, updatePlanStatus, removePlan,
        updateAllocationRule, saveAllocationRules,
        addDepartment, updateDept, removeDepartment,
        addEmployeeAssignment, updateEmployeeAssign, removeEmployeeAssignment,
        addMarketingChannel, updateChannel, removeMarketingChannel,
        addCashflowEntry, updateCashflowEntry, removeCashflowEntry,
        marketingSpend, channelROIs,
        addMarketingSpend, updateMarketingSpendEntry, removeMarketingSpend,
        forecasts, activeForecast, activeForecastId,
        setActiveForecastId, createForecast, removeForecast,
        refresh, formatVND,
    ]);

    return (
        <FinanceOSContext.Provider value={value}>
            {children}
        </FinanceOSContext.Provider>
    );
}
