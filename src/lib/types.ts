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

