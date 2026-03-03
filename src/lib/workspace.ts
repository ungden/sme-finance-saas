import { createClient } from "@/utils/supabase/client";
import type { Workspace, WorkspaceMember, Branch, MemberRole, YearData, Employee, Facility } from "./types";

function getSupabase() {
    return createClient();
}

// ══════════════════════════════════════════════════
// WORKSPACE CRUD
// ══════════════════════════════════════════════════

export async function getMyWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await getSupabase()
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function createWorkspace(name: string): Promise<Workspace> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await getSupabase()
        .from("workspaces")
        .insert({ name, owner_id: user.id })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteWorkspace(id: string) {
    const { error } = await getSupabase().from("workspaces").delete().eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// MEMBERS
// ══════════════════════════════════════════════════

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await getSupabase()
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("invited_at");
    if (error) throw error;
    return data || [];
}

export async function inviteMember(workspaceId: string, email: string, role: MemberRole): Promise<void> {
    // Step 1: Look up user by email using Supabase admin or RPC
    // For MVP we require the user to have already registered
    // We'll use a simple approach: search by email in the members + invite tracking

    // For now, create a pending invite record. The user will be matched on login.
    // This is a simplified MVP flow — in production you'd send an email invite.
    const { error } = await getSupabase().rpc("invite_member_by_email", {
        p_workspace_id: workspaceId,
        p_email: email,
        p_role: role,
    });
    if (error) throw error;
}

export async function removeMember(memberId: string) {
    const { error } = await getSupabase().from("workspace_members").delete().eq("id", memberId);
    if (error) throw error;
}

export async function getMyRole(workspaceId: string): Promise<MemberRole | null> {
    const { data: { user } } = await getSupabase().auth.getUser();
    if (!user) return null;

    const { data, error } = await getSupabase()
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .single();
    if (error) return null;
    return data?.role || null;
}

// ══════════════════════════════════════════════════
// BRANCHES
// ══════════════════════════════════════════════════

export async function getBranches(workspaceId: string): Promise<Branch[]> {
    const { data, error } = await getSupabase()
        .from("branches")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
    if (error) throw error;
    return (data || []).map(b => ({
        ...b,
        years_data: (b.years_data || []) as YearData[],
        employees: (b.employees || []) as Employee[],
        facilities: (b.facilities || []) as Facility[],
    }));
}

export async function createBranch(workspaceId: string, name: string): Promise<Branch> {
    const currentYear = new Date().getFullYear();
    const defaultYears: YearData[] = [currentYear, currentYear + 1, currentYear + 2].map(year => ({
        id: `${year}-${Math.random().toString(36).slice(2, 8)}`,
        year,
        revenue: 0, cogs: 0, operatingExpenses: 0, depreciation: 0,
        interestExpense: 0, taxes: 0, cash: 0, accountsReceivable: 0,
        inventory: 0, propertyPlantEquipment: 0, accountsPayable: 0,
        shortTermDebt: 0, longTermDebt: 0, ownerCapital: 0,
    }));

    const { data, error } = await getSupabase()
        .from("branches")
        .insert({
            workspace_id: workspaceId,
            name,
            years_data: defaultYears,
            employees: [],
            facilities: [],
        })
        .select()
        .single();
    if (error) throw error;
    return {
        ...data,
        years_data: data.years_data as YearData[],
        employees: data.employees as Employee[],
        facilities: data.facilities as Facility[],
    };
}

export async function updateBranchData(
    branchId: string,
    updates: Partial<Pick<Branch, "years_data" | "employees" | "facilities" | "name">>
) {
    const { error } = await getSupabase()
        .from("branches")
        .update(updates)
        .eq("id", branchId);
    if (error) throw error;
}

export async function deleteBranch(branchId: string) {
    const { error } = await getSupabase().from("branches").delete().eq("id", branchId);
    if (error) throw error;
}
