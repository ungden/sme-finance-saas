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

// ── ERP Module Types ──

export const EXPENSE_CATEGORIES = [
    'Lương & Nhân sự', 'Thuê mặt bằng', 'Marketing', 'Vận chuyển',
    'Điện nước', 'Bảo hiểm', 'Văn phòng phẩm', 'Phần mềm/SaaS',
    'Tiếp khách', 'Bảo trì/Sửa chữa', 'Khác',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface InvoiceItem {
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    type: 'income' | 'expense';
    contactId: string;
    contactName: string;
    description: string;
    category: ExpenseCategory | 'Doanh thu';
    amount: number;
    vatRate: number;
    vatAmount: number;
    date: string;
    dueDate: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    items: InvoiceItem[];
}

export interface Contact {
    id: string;
    type: 'customer' | 'supplier';
    name: string;
    phone: string;
    email: string;
    taxCode: string;
    address: string;
    notes: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    userEmail: string;
    action: 'create' | 'update' | 'delete';
    entity: string;
    entityId: string;
    description: string;
    timestamp: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    unit: string;
    unitCost: number;
    currentQty: number;
    reorderLevel: number;
}

export interface StockMovement {
    id: string;
    productId: string;
    type: 'in' | 'out';
    qty: number;
    date: string;
    note: string;
}

export interface Budget {
    id: string;
    year: number;
    category: ExpenseCategory;
    planned: number;
    actual: number;
}

// ── Finance OS: Revenue Allocation Model ──

export type AllocationCategory = 'cogs' | 'marketing' | 'operations' | 'payroll' | 'profit';

export const ALLOCATION_CATEGORY_LABELS: Record<AllocationCategory, string> = {
    cogs: 'Chi phí hàng bán (COGS)',
    marketing: 'Marketing',
    operations: 'Vận hành (Operations)',
    payroll: 'Quỹ lương (Payroll)',
    profit: 'Lợi nhuận (Profit)',
};

export const ALLOCATION_CATEGORY_COLORS: Record<AllocationCategory, string> = {
    cogs: '#ef4444',
    marketing: '#f59e0b',
    operations: '#3b82f6',
    payroll: '#8b5cf6',
    profit: '#10b981',
};

export interface AllocationRule {
    id: string;
    workspace_id: string;
    category: AllocationCategory;
    percent: number;
    created_at: string;
}

export interface Department {
    id: string;
    workspace_id: string;
    name: string;
    payroll_percent: number;
    created_at: string;
}

export interface EmployeeAssignment {
    id: string;
    workspace_id: string;
    department_id: string;
    employee_name: string;
    role: string;
    base_salary: number;
    bonus: number;
    created_at: string;
}

export interface MarketingChannel {
    id: string;
    workspace_id: string;
    name: string;
    percent: number;
    created_at: string;
}

export type CashflowSource = 'manual' | 'invoice';

export interface DailyCashflow {
    id: string;
    workspace_id: string;
    branch_id: string | null;
    date: string;
    revenue: number;
    expense: number;
    source: CashflowSource;
    notes: string;
    created_at: string;
}

// Computed types for Finance OS dashboard
export interface AllocationAmount {
    category: AllocationCategory;
    percent: number;
    amount: number;
}

export interface DepartmentBudget {
    department: Department;
    budget: number;
    totalSalary: number;
    totalBonus: number;
    totalUsed: number;
    remaining: number;
    employees: EmployeeAssignment[];
}

export interface ChannelBudget {
    channel: MarketingChannel;
    budget: number;
}

// ── Finance OS: AI Financial Planner ──

export type PlanStatus = 'draft' | 'active' | 'archived';

export interface FinancialPlan {
    id: string;
    workspace_id: string;
    name: string;
    year: number;
    annual_revenue_target: number;
    industry: string;
    business_context: string;
    status: PlanStatus;
    ai_summary: string;
    created_at: string;
    updated_at: string;
}

export interface MonthlyTarget {
    id: string;
    plan_id: string;
    month: number; // 1-12
    revenue: number;
    cogs: number;
    marketing: number;
    operations: number;
    payroll: number;
    profit: number;
    notes: string;
    created_at: string;
}

// AI response shape from /api/ai-plan
export interface AIPlanResponse {
    months: {
        month: number;
        revenue: number;
        cogs: number;
        marketing: number;
        operations: number;
        payroll: number;
        profit: number;
        notes: string;
    }[];
    summary: string;
    insights: string[];
}

// Computed: Plan vs Actual for a month
export interface PlanVsActual {
    month: number;
    monthLabel: string;
    planned: {
        revenue: number;
        cogs: number;
        marketing: number;
        operations: number;
        payroll: number;
        profit: number;
    };
    actual: {
        revenue: number;
        expense: number;
    };
    variance: number; // actual revenue - planned revenue
    variancePercent: number; // variance / planned revenue * 100
}

// Quarter aggregation
export interface QuarterSummary {
    quarter: number;
    label: string;
    planned: { revenue: number; profit: number };
    actual: { revenue: number; expense: number };
    variance: number;
}

// Week target (derived from monthly)
export interface WeekTarget {
    weekNumber: number;
    weekLabel: string;
    revenue: number;
    expense: number;
    profit: number;
}

// Day target (derived from monthly)
export interface DayTarget {
    date: string;
    dayOfWeek: string;
    revenue: number;
    expense: number;
}

