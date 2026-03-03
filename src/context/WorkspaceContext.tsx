"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Workspace, Branch, MemberRole, YearData, Employee, Facility } from "@/lib/types";
import * as api from "@/lib/workspace";

interface WorkspaceContextType {
    // Workspace
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setCurrentWorkspaceId: (id: string) => void;
    createWorkspace: (name: string) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;

    // Branches
    branches: Branch[];
    currentBranch: Branch | null;
    setCurrentBranchId: (id: string | null) => void;
    createBranch: (name: string) => Promise<void>;
    deleteBranch: (id: string) => Promise<void>;

    // Active Branch Data (mirrors old FinanceContext API)
    yearsData: YearData[];
    employees: Employee[];
    facilities: Facility[];
    updateYearData: (year: number, field: keyof Omit<YearData, "id" | "year">, value: number) => void;
    addYear: (year: number) => void;
    addEmployee: (employee: Omit<Employee, "id">) => void;
    deleteEmployee: (id: string) => void;
    addFacility: (facility: Omit<Facility, "id">) => void;
    deleteFacility: (id: string) => void;

    // Role
    myRole: MemberRole | null;

    // State
    isLoaded: boolean;
    isSaving: boolean;
    isConsolidated: boolean;
    setConsolidated: (v: boolean) => void;

    formatVND: (val: number) => string;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
    return ctx;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<MemberRole | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isConsolidated, setConsolidated] = useState(false);

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;
    const currentBranch = branches.find(b => b.id === currentBranchId) || null;

    // Derived data from current branch
    const yearsData = currentBranch?.years_data || [];
    const employees = currentBranch?.employees || [];
    const facilities = currentBranch?.facilities || [];

    // ── Load Workspaces ──
    const refreshWorkspaces = useCallback(async () => {
        try {
            const ws = await api.getMyWorkspaces();
            setWorkspaces(ws);
            if (ws.length > 0 && !currentWorkspaceId) {
                setCurrentWorkspaceId(ws[0].id);
            }
        } catch (err) {
            console.error("Failed to load workspaces", err);
        }
    }, [currentWorkspaceId]);

    useEffect(() => {
        refreshWorkspaces().then(() => setIsLoaded(true));
    }, [refreshWorkspaces]);

    // ── Load Branches when workspace changes ──
    useEffect(() => {
        if (!currentWorkspaceId) { setBranches([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const [branchList, role] = await Promise.all([
                    api.getBranches(currentWorkspaceId),
                    api.getMyRole(currentWorkspaceId),
                ]);
                if (cancelled) return;
                setBranches(branchList);
                setMyRole(role);
                if (branchList.length > 0 && !currentBranchId) {
                    setCurrentBranchId(branchList[0].id);
                }
            } catch (err) {
                console.error("Failed to load branches", err);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWorkspaceId]);

    // ── Debounced Save to Supabase ──
    const saveBranch = useCallback(async (branchId: string, updates: Partial<Pick<Branch, "years_data" | "employees" | "facilities">>) => {
        setIsSaving(true);
        try {
            await api.updateBranchData(branchId, updates);
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setIsSaving(false);
        }
    }, []);

    // ── Branch Data Mutations (mirror old FinanceContext API) ──
    const updateYearData = useCallback((year: number, field: keyof Omit<YearData, "id" | "year">, value: number) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newYearsData = b.years_data.map(y => y.year === year ? { ...y, [field]: value } : y);
            // Fire async save
            saveBranch(b.id, { years_data: newYearsData });
            return { ...b, years_data: newYearsData };
        }));
    }, [currentBranchId, saveBranch]);

    const addYear = useCallback((year: number) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            if (b.years_data.find(y => y.year === year)) return b;
            const newYear: YearData = {
                id: `${year}-${Math.random().toString(36).slice(2, 8)}`,
                year, revenue: 0, cogs: 0, operatingExpenses: 0, depreciation: 0,
                interestExpense: 0, taxes: 0, cash: 0, accountsReceivable: 0,
                inventory: 0, propertyPlantEquipment: 0, accountsPayable: 0,
                shortTermDebt: 0, longTermDebt: 0, ownerCapital: 0,
            };
            const newYearsData = [...b.years_data, newYear].sort((a, b2) => a.year - b2.year);
            saveBranch(b.id, { years_data: newYearsData });
            return { ...b, years_data: newYearsData };
        }));
    }, [currentBranchId, saveBranch]);

    const addEmployee = useCallback((employee: Omit<Employee, "id">) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newEmp = { ...employee, id: Date.now().toString() + Math.random().toString(36).slice(2) };
            const newEmployees = [...b.employees, newEmp];
            saveBranch(b.id, { employees: newEmployees });
            return { ...b, employees: newEmployees };
        }));
    }, [currentBranchId, saveBranch]);

    const deleteEmployee = useCallback((id: string) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newEmployees = b.employees.filter(e => e.id !== id);
            saveBranch(b.id, { employees: newEmployees });
            return { ...b, employees: newEmployees };
        }));
    }, [currentBranchId, saveBranch]);

    const addFacility = useCallback((facility: Omit<Facility, "id">) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newFac = { ...facility, id: Date.now().toString() + Math.random().toString(36).slice(2) };
            const newFacilities = [...b.facilities, newFac];
            saveBranch(b.id, { facilities: newFacilities });
            return { ...b, facilities: newFacilities };
        }));
    }, [currentBranchId, saveBranch]);

    const deleteFacility = useCallback((id: string) => {
        if (!currentBranchId) return;
        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newFacilities = b.facilities.filter(f => f.id !== id);
            saveBranch(b.id, { facilities: newFacilities });
            return { ...b, facilities: newFacilities };
        }));
    }, [currentBranchId, saveBranch]);

    // ── Workspace/Branch Management ──
    const handleCreateWorkspace = async (name: string) => {
        const ws = await api.createWorkspace(name);
        setWorkspaces(prev => [ws, ...prev]);
        setCurrentWorkspaceId(ws.id);
    };

    const handleCreateBranch = async (name: string) => {
        if (!currentWorkspaceId) return;
        const branch = await api.createBranch(currentWorkspaceId, name);
        setBranches(prev => [...prev, branch]);
        setCurrentBranchId(branch.id);
    };

    const handleDeleteBranch = async (id: string) => {
        await api.deleteBranch(id);
        setBranches(prev => {
            const filtered = prev.filter(b => b.id !== id);
            if (currentBranchId === id && filtered.length > 0) {
                setCurrentBranchId(filtered[0].id);
            }
            return filtered;
        });
    };

    // ── Auto-sync OPEX from HR + Facilities ──
    useEffect(() => {
        if (!currentBranchId) return;
        const branch = branches.find(b => b.id === currentBranchId);
        if (!branch) return;

        const totalMonthlySalary = branch.employees.reduce((sum, e) => sum + e.monthlySalary, 0);
        const totalMonthlyRent = branch.facilities.reduce((sum, f) => sum + f.monthlyRent, 0);
        const extraAnnualOpex = (totalMonthlySalary + totalMonthlyRent) * 12;

        const hasErpItems = (branch.employees.length + branch.facilities.length) > 0;
        const currentOpex = branch.years_data.length > 0 ? branch.years_data[0].operatingExpenses : -1;
        if (!hasErpItems || currentOpex === extraAnnualOpex) return;

        setBranches(prev => prev.map(b => {
            if (b.id !== currentBranchId) return b;
            const newYearsData = b.years_data.map(y => ({ ...y, operatingExpenses: extraAnnualOpex }));
            saveBranch(b.id, { years_data: newYearsData });
            return { ...b, years_data: newYearsData };
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employees, facilities]);

    const formatVND = (val: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Math.abs(val));

    return (
        <WorkspaceContext.Provider value={{
            workspaces, currentWorkspace, setCurrentWorkspaceId: setCurrentWorkspaceId,
            createWorkspace: handleCreateWorkspace, refreshWorkspaces,
            branches, currentBranch, setCurrentBranchId, createBranch: handleCreateBranch, deleteBranch: handleDeleteBranch,
            yearsData, employees, facilities,
            updateYearData, addYear, addEmployee, deleteEmployee, addFacility, deleteFacility,
            myRole, isLoaded, isSaving, isConsolidated, setConsolidated, formatVND,
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}
