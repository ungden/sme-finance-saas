"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ── Types ──────────────────────────────────────────────
export type TransactionType =
    | "SALE_CASH"
    | "SALE_CREDIT"
    | "EXPENSE_CASH"
    | "EXPENSE_CREDIT"
    | "BUY_ASSET"
    | "DEPRECIATION"
    | "CAPITAL_INJECT"
    | "COLLECT_AR"
    | "PAY_AP";

export interface Transaction {
    id: string;
    date: string;
    description: string;
    type: TransactionType;
    amount: number;
}

export interface Project {
    id: string;
    name: string;
    transactions: Transaction[];
    createdAt: number;
}

export interface FinancialData {
    incomeStatement: {
        revenue: number;
        cogs: number;
        grossProfit: number;
        operatingExpenses: number;
        depreciation: number;
        netIncome: number;
    };
    balanceSheet: {
        assets: {
            cash: number;
            accountsReceivable: number;
            propertyPlantEquipment: number;
            totalAssets: number;
        };
        liabilities: {
            accountsPayable: number;
            totalLiabilities: number;
        };
        equity: {
            ownerCapital: number;
            retainedEarnings: number;
            totalEquity: number;
        };
    };
    cashFlow: {
        operations: number;
        investing: number;
        financing: number;
        netCashFlow: number;
    };
}

// ── Constants ──────────────────────────────────────────
export const TX_TYPES: { value: TransactionType; label: string; emoji: string; color: string }[] = [
    { value: "SALE_CASH", label: "Bán hàng – Thu tiền ngay", emoji: "💰", color: "text-green-700 bg-green-50 border-green-200" },
    { value: "SALE_CREDIT", label: "Bán hàng – Ghi nợ khách", emoji: "📄", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { value: "EXPENSE_CASH", label: "Chi phí – Trả tiền ngay", emoji: "💸", color: "text-red-700 bg-red-50 border-red-200" },
    { value: "EXPENSE_CREDIT", label: "Chi phí – Nợ NCC", emoji: "📋", color: "text-orange-700 bg-orange-50 border-orange-200" },
    { value: "BUY_ASSET", label: "Mua Tài sản / Máy móc", emoji: "🏭", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    { value: "DEPRECIATION", label: "Khấu hao tài sản", emoji: "📉", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { value: "CAPITAL_INJECT", label: "Chủ sở hữu góp vốn", emoji: "🏦", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { value: "COLLECT_AR", label: "Thu tiền khách hàng nợ", emoji: "✅", color: "text-teal-700 bg-teal-50 border-teal-200" },
    { value: "PAY_AP", label: "Thanh toán nợ NCC", emoji: "🔄", color: "text-purple-700 bg-purple-50 border-purple-200" },
];

const DUMMY_TRANSACTIONS: Transaction[] = [
    { id: "ex1", date: "03/03/2026", description: "Chủ sở hữu góp vốn ban đầu", type: "CAPITAL_INJECT", amount: 500000000 },
    { id: "ex2", date: "03/03/2026", description: "Mua sắm máy pha cà phê & nội thất", type: "BUY_ASSET", amount: 200000000 },
    { id: "ex3", date: "03/03/2026", description: "Doanh thu bán hàng tháng 3", type: "SALE_CASH", amount: 120000000 },
    { id: "ex4", date: "03/03/2026", description: "Hợp đồng B2B – ghi nợ 30 ngày", type: "SALE_CREDIT", amount: 35000000 },
    { id: "ex5", date: "03/03/2026", description: "Nhập nguyên liệu – nợ nhà cung cấp", type: "EXPENSE_CREDIT", amount: 40000000 },
    { id: "ex6", date: "03/03/2026", description: "Lương nhân viên tháng 3", type: "EXPENSE_CASH", amount: 30000000 },
    { id: "ex7", date: "03/03/2026", description: "Tiền thuê mặt bằng tháng 3", type: "EXPENSE_CASH", amount: 15000000 },
    { id: "ex8", date: "03/03/2026", description: "Khấu hao thiết bị tháng 3", type: "DEPRECIATION", amount: 5000000 },
];

const INITIAL_DATA: FinancialData = {
    incomeStatement: { revenue: 0, cogs: 0, grossProfit: 0, operatingExpenses: 0, depreciation: 0, netIncome: 0 },
    balanceSheet: { assets: { cash: 0, accountsReceivable: 0, propertyPlantEquipment: 0, totalAssets: 0 }, liabilities: { accountsPayable: 0, totalLiabilities: 0 }, equity: { ownerCapital: 0, retainedEarnings: 0, totalEquity: 0 } },
    cashFlow: { operations: 0, investing: 0, financing: 0, netCashFlow: 0 }
};

// ── Calculation Engine ─────────────────────────────────
function computeFinancials(transactions: Transaction[]): FinancialData {
    let revenue = 0, cogs = 0, operatingExpenses = 0, depreciation = 0;
    let cash = 0, accountsReceivable = 0, propertyPlantEquipment = 0;
    let accountsPayable = 0, ownerCapital = 0;
    let opsCF = 0, invCF = 0, finCF = 0;

    for (const tx of transactions) {
        const a = tx.amount;
        switch (tx.type) {
            case "SALE_CASH": revenue += a; cash += a; opsCF += a; break;
            case "SALE_CREDIT": revenue += a; accountsReceivable += a; break;
            case "EXPENSE_CASH": operatingExpenses += a; cash -= a; opsCF -= a; break;
            case "EXPENSE_CREDIT": operatingExpenses += a; accountsPayable += a; break;
            case "BUY_ASSET": propertyPlantEquipment += a; cash -= a; invCF -= a; break;
            case "DEPRECIATION": depreciation += a; propertyPlantEquipment -= a; break;
            case "CAPITAL_INJECT": ownerCapital += a; cash += a; finCF += a; break;
            case "COLLECT_AR": accountsReceivable -= a; cash += a; opsCF += a; break;
            case "PAY_AP": accountsPayable -= a; cash -= a; opsCF -= a; break;
        }
    }

    const grossProfit = revenue - cogs;
    const netIncome = grossProfit - operatingExpenses - depreciation;
    const netCashFlow = opsCF + invCF + finCF;
    const retainedEarnings = netIncome;
    const totalEquity = ownerCapital + retainedEarnings;
    const totalLiabilities = accountsPayable;
    const totalAssets = cash + accountsReceivable + propertyPlantEquipment;

    return {
        incomeStatement: { revenue, cogs, grossProfit, operatingExpenses, depreciation, netIncome },
        balanceSheet: {
            assets: { cash, accountsReceivable, propertyPlantEquipment, totalAssets },
            liabilities: { accountsPayable, totalLiabilities },
            equity: { ownerCapital, retainedEarnings, totalEquity },
        },
        cashFlow: { operations: opsCF, investing: invCF, financing: finCF, netCashFlow },
    };
}

// ── Context ────────────────────────────────────────────
interface FinanceContextType {
    projects: Project[];
    currentProjectId: string | null;
    transactions: Transaction[];
    financialData: FinancialData;
    isLoaded: boolean;
    addTransaction: (tx: Omit<Transaction, "id">) => void;
    removeTransaction: (id: string) => void;
    clearAll: () => void;
    loadExample: () => void;
    formatVND: (val: number) => string;
    createProject: (name: string, initialTransactions?: Transaction[]) => string;
    switchProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    deleteProject: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
    return ctx;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
    const [financialData, setFinancialData] = useState<FinancialData>(INITIAL_DATA);
    const [isLoaded, setIsLoaded] = useState(false);

    // Derived active transactions
    const transactions = React.useMemo(() => {
        return projects.find(p => p.id === currentProjectId)?.transactions || [];
    }, [projects, currentProjectId]);

    useEffect(() => {
        const savedProjects = localStorage.getItem("sme_finance_projects");
        const savedCurrent = localStorage.getItem("sme_finance_current_project");

        let initialProjects: Project[] = [];
        let initialCurrent: string | null = null;

        if (savedProjects) {
            try {
                const parsed = JSON.parse(savedProjects);
                if (parsed.length > 0) {
                    initialProjects = parsed;
                    initialCurrent = savedCurrent || parsed[0].id;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        if (initialProjects.length === 0) {
            const defaultId = Date.now().toString();
            initialProjects = [{ id: defaultId, name: "Kế hoạch kinh doanh #1", transactions: DUMMY_TRANSACTIONS, createdAt: Date.now() }];
            initialCurrent = defaultId;
        }

        setProjects(initialProjects);
        setCurrentProjectId(initialCurrent);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        setFinancialData(computeFinancials(transactions));
        localStorage.setItem("sme_finance_projects", JSON.stringify(projects));
        if (currentProjectId) {
            localStorage.setItem("sme_finance_current_project", currentProjectId);
        }
    }, [projects, currentProjectId, transactions, isLoaded]);

    const addTransaction = (tx: Omit<Transaction, "id">) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                return { ...p, transactions: [{ ...tx, id: Date.now().toString() + Math.random().toString(36).slice(2) }, ...p.transactions] };
            }
            return p;
        }));
    };

    const removeTransaction = (id: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                return { ...p, transactions: p.transactions.filter(t => t.id !== id) };
            }
            return p;
        }));
    };

    const clearAll = () => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) return { ...p, transactions: [] };
            return p;
        }));
    };

    const loadExample = () => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) return { ...p, transactions: DUMMY_TRANSACTIONS };
            return p;
        }));
    };

    // ── Project Management Actions ─────────────────
    const createProject = (name: string, initialTxs: Transaction[] = []) => {
        const newId = Date.now().toString() + Math.random().toString(36).slice(2);
        setProjects(prev => [{ id: newId, name, transactions: initialTxs, createdAt: Date.now() }, ...prev]);
        setCurrentProjectId(newId);
        return newId;
    };

    const switchProject = (id: string) => setCurrentProjectId(id);

    const renameProject = (id: string, newName: string) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    };

    const deleteProject = (id: string) => {
        setProjects(prev => {
            const filtered = prev.filter(p => p.id !== id);
            if (filtered.length === 0) {
                const defaultId = Date.now().toString();
                setCurrentProjectId(defaultId);
                return [{ id: defaultId, name: "Kế hoạch #1", transactions: [], createdAt: Date.now() }];
            }
            if (currentProjectId === id) {
                setCurrentProjectId(filtered[0].id);
            }
            return filtered;
        });
    };

    const formatVND = (val: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

    return (
        <FinanceContext.Provider value={{
            projects, currentProjectId, transactions, financialData, isLoaded,
            addTransaction, removeTransaction, clearAll, loadExample, formatVND,
            createProject, switchProject, renameProject, deleteProject
        }}>
            {children}
        </FinanceContext.Provider>
    );
}
