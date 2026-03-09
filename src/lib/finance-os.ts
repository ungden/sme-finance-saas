import { createClient } from "@/utils/supabase/client";
import type {
    AllocationRule,
    AllocationCategory,
    Department,
    EmployeeAssignment,
    MarketingChannel,
    DailyCashflow,
    CashflowSource,
    FinancialPlan,
    MonthlyTarget,
    PlanStatus,
} from "./types";

function getSupabase() {
    return createClient();
}

// ══════════════════════════════════════════════════
// ALLOCATION RULES
// ══════════════════════════════════════════════════

export async function getAllocationRules(workspaceId: string): Promise<AllocationRule[]> {
    const { data, error } = await getSupabase()
        .from("allocation_rules")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
    if (error) throw error;
    return (data || []).map(r => ({
        ...r,
        percent: Number(r.percent),
    }));
}

export async function upsertAllocationRule(
    workspaceId: string,
    category: AllocationCategory,
    percent: number
): Promise<AllocationRule> {
    const { data, error } = await getSupabase()
        .from("allocation_rules")
        .upsert(
            { workspace_id: workspaceId, category, percent },
            { onConflict: "workspace_id,category" }
        )
        .select()
        .single();
    if (error) throw error;
    return { ...data, percent: Number(data.percent) };
}

export async function bulkUpdateAllocationRules(
    workspaceId: string,
    rules: { category: AllocationCategory; percent: number }[]
): Promise<void> {
    for (const rule of rules) {
        await upsertAllocationRule(workspaceId, rule.category, rule.percent);
    }
}

// ══════════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════════

export async function getDepartments(workspaceId: string): Promise<Department[]> {
    const { data, error } = await getSupabase()
        .from("departments")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
    if (error) throw error;
    return (data || []).map(d => ({
        ...d,
        payroll_percent: Number(d.payroll_percent),
    }));
}

export async function createDepartment(
    workspaceId: string,
    name: string,
    payrollPercent: number
): Promise<Department> {
    const { data, error } = await getSupabase()
        .from("departments")
        .insert({ workspace_id: workspaceId, name, payroll_percent: payrollPercent })
        .select()
        .single();
    if (error) throw error;
    return { ...data, payroll_percent: Number(data.payroll_percent) };
}

export async function updateDepartment(
    id: string,
    updates: Partial<Pick<Department, "name" | "payroll_percent">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("departments")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteDepartment(id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("departments")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// EMPLOYEE ASSIGNMENTS
// ══════════════════════════════════════════════════

export async function getEmployeeAssignments(workspaceId: string): Promise<EmployeeAssignment[]> {
    const { data, error } = await getSupabase()
        .from("employee_assignments")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
    if (error) throw error;
    return (data || []).map(e => ({
        ...e,
        base_salary: Number(e.base_salary),
        bonus: Number(e.bonus),
    }));
}

export async function createEmployeeAssignment(
    workspaceId: string,
    departmentId: string,
    employeeName: string,
    role: string,
    baseSalary: number,
    bonus: number
): Promise<EmployeeAssignment> {
    const { data, error } = await getSupabase()
        .from("employee_assignments")
        .insert({
            workspace_id: workspaceId,
            department_id: departmentId,
            employee_name: employeeName,
            role,
            base_salary: baseSalary,
            bonus,
        })
        .select()
        .single();
    if (error) throw error;
    return { ...data, base_salary: Number(data.base_salary), bonus: Number(data.bonus) };
}

export async function updateEmployeeAssignment(
    id: string,
    updates: Partial<Pick<EmployeeAssignment, "employee_name" | "role" | "base_salary" | "bonus" | "department_id">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("employee_assignments")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteEmployeeAssignment(id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("employee_assignments")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// MARKETING CHANNELS
// ══════════════════════════════════════════════════

export async function getMarketingChannels(workspaceId: string): Promise<MarketingChannel[]> {
    const { data, error } = await getSupabase()
        .from("marketing_channels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
    if (error) throw error;
    return (data || []).map(c => ({
        ...c,
        percent: Number(c.percent),
    }));
}

export async function createMarketingChannel(
    workspaceId: string,
    name: string,
    percent: number
): Promise<MarketingChannel> {
    const { data, error } = await getSupabase()
        .from("marketing_channels")
        .insert({ workspace_id: workspaceId, name, percent })
        .select()
        .single();
    if (error) throw error;
    return { ...data, percent: Number(data.percent) };
}

export async function updateMarketingChannel(
    id: string,
    updates: Partial<Pick<MarketingChannel, "name" | "percent">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("marketing_channels")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteMarketingChannel(id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("marketing_channels")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// DAILY CASHFLOW
// ══════════════════════════════════════════════════

export async function getDailyCashflow(
    workspaceId: string,
    startDate?: string,
    endDate?: string
): Promise<DailyCashflow[]> {
    let query = getSupabase()
        .from("daily_cashflow")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false });

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(cf => ({
        ...cf,
        revenue: Number(cf.revenue),
        expense: Number(cf.expense),
    }));
}

export async function createDailyCashflowEntry(
    workspaceId: string,
    entry: {
        date: string;
        revenue: number;
        expense: number;
        source: CashflowSource;
        notes: string;
        branch_id?: string | null;
    }
): Promise<DailyCashflow> {
    const { data, error } = await getSupabase()
        .from("daily_cashflow")
        .insert({
            workspace_id: workspaceId,
            branch_id: entry.branch_id || null,
            date: entry.date,
            revenue: entry.revenue,
            expense: entry.expense,
            source: entry.source,
            notes: entry.notes,
        })
        .select()
        .single();
    if (error) throw error;
    return { ...data, revenue: Number(data.revenue), expense: Number(data.expense) };
}

export async function updateDailyCashflowEntry(
    id: string,
    updates: Partial<Pick<DailyCashflow, "date" | "revenue" | "expense" | "source" | "notes">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("daily_cashflow")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteDailyCashflowEntry(id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("daily_cashflow")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// FINANCIAL PLANS
// ══════════════════════════════════════════════════

export async function getFinancialPlans(workspaceId: string): Promise<FinancialPlan[]> {
    const { data, error } = await getSupabase()
        .from("financial_plans")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
        ...p,
        annual_revenue_target: Number(p.annual_revenue_target),
    }));
}

export async function createFinancialPlan(
    workspaceId: string,
    plan: {
        name: string;
        year: number;
        annual_revenue_target: number;
        industry: string;
        business_context: string;
        ai_summary: string;
        status?: PlanStatus;
    }
): Promise<FinancialPlan> {
    const { data, error } = await getSupabase()
        .from("financial_plans")
        .insert({
            workspace_id: workspaceId,
            name: plan.name,
            year: plan.year,
            annual_revenue_target: plan.annual_revenue_target,
            industry: plan.industry,
            business_context: plan.business_context,
            ai_summary: plan.ai_summary,
            status: plan.status || "draft",
        })
        .select()
        .single();
    if (error) throw error;
    return { ...data, annual_revenue_target: Number(data.annual_revenue_target) };
}

export async function updateFinancialPlan(
    id: string,
    updates: Partial<Pick<FinancialPlan, "name" | "status" | "ai_summary" | "annual_revenue_target" | "industry" | "business_context">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("financial_plans")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
    if (error) throw error;
}

export async function deleteFinancialPlan(id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("financial_plans")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// MONTHLY TARGETS
// ══════════════════════════════════════════════════

export async function getMonthlyTargets(planId: string): Promise<MonthlyTarget[]> {
    const { data, error } = await getSupabase()
        .from("monthly_targets")
        .select("*")
        .eq("plan_id", planId)
        .order("month");
    if (error) throw error;
    return (data || []).map(t => ({
        ...t,
        revenue: Number(t.revenue),
        cogs: Number(t.cogs),
        marketing: Number(t.marketing),
        operations: Number(t.operations),
        payroll: Number(t.payroll),
        profit: Number(t.profit),
    }));
}

export async function bulkUpsertMonthlyTargets(
    planId: string,
    targets: {
        month: number;
        revenue: number;
        cogs: number;
        marketing: number;
        operations: number;
        payroll: number;
        profit: number;
        notes: string;
    }[]
): Promise<void> {
    // Delete existing targets for this plan and re-insert
    await getSupabase().from("monthly_targets").delete().eq("plan_id", planId);

    if (targets.length > 0) {
        const rows = targets.map(t => ({ plan_id: planId, ...t }));
        const { error } = await getSupabase().from("monthly_targets").insert(rows);
        if (error) throw error;
    }
}

export async function updateMonthlyTarget(
    id: string,
    updates: Partial<Pick<MonthlyTarget, "revenue" | "cogs" | "marketing" | "operations" | "payroll" | "profit" | "notes">>
): Promise<void> {
    const { error } = await getSupabase()
        .from("monthly_targets")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}
