// ── Shared Types for Multi-Tenant Workspace System ──

export type MemberRole = 'owner' | 'editor' | 'viewer' | 'investor';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: MemberRole;
    invited_at: string;
    // Joined from auth.users for display
    email?: string;
}

export interface YearData {
    id: string;
    year: number;
    revenue: number;
    cogs: number;
    operatingExpenses: number;
    depreciation: number;
    interestExpense: number;
    taxes: number;
    cash: number;
    accountsReceivable: number;
    inventory: number;
    propertyPlantEquipment: number;
    accountsPayable: number;
    shortTermDebt: number;
    longTermDebt: number;
    ownerCapital: number;
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    monthlySalary: number;
    startDate: string;
}

export interface Facility {
    id: string;
    name: string;
    monthlyRent: number;
    fireSafetyValid: boolean;
    contractEnd: string;
}

export interface Branch {
    id: string;
    workspace_id: string;
    name: string;
    years_data: YearData[];
    employees: Employee[];
    facilities: Facility[];
    created_at: string;
}

export interface BranchInvestor {
    id: string;
    branch_id: string;
    member_id: string;
    equity_percent: number;
}
