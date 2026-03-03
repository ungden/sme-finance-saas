"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ── Types ──────────────────────────────────────────────

export interface Employee {
    id: string;
    name: string;
    role: string;
    monthlySalary: number;
    startDate: string; // YYYY-MM
}

export interface Facility {
    id: string;
    name: string;
    monthlyRent: number;
    fireSafetyValid: boolean;
    contractEnd: string; // YYYY-MM
}

export interface YearData {
    id: string; // Typically just the year as string
    year: number;

    // ── Income Statement (P&L) Inputs ──
    revenue: number;
    cogs: number; // Tùy chọn: Nhập số âm hoặc dương đều được, hệ thống sẽ tự normalize
    operatingExpenses: number;
    depreciation: number;
    interestExpense: number;
    taxes: number;

    // ── Balance Sheet Inputs ──
    // Assets
    cash: number;
    accountsReceivable: number;
    inventory: number;
    propertyPlantEquipment: number;

    // Liabilities
    accountsPayable: number;
    shortTermDebt: number;
    longTermDebt: number;

    // Equity
    ownerCapital: number;
}

export interface Project {
    id: string;
    name: string;
    yearsData: YearData[];
    employees?: Employee[];
    facilities?: Facility[];
    createdAt: number;
}

// ── Constants ──────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();

export const createEmptyYear = (year: number): YearData => ({
    id: year.toString(),
    year,
    revenue: 0, cogs: 0, operatingExpenses: 0, depreciation: 0, interestExpense: 0, taxes: 0,
    cash: 0, accountsReceivable: 0, inventory: 0, propertyPlantEquipment: 0,
    accountsPayable: 0, shortTermDebt: 0, longTermDebt: 0,
    ownerCapital: 0,
});

const DEFAULT_YEARS: YearData[] = [
    createEmptyYear(CURRENT_YEAR - 1),
    createEmptyYear(CURRENT_YEAR),
    createEmptyYear(CURRENT_YEAR + 1),
];

// ── Context ────────────────────────────────────────────
interface FinanceContextType {
    projects: Project[];
    currentProjectId: string | null;
    yearsData: YearData[]; // Derived from current project
    employees: Employee[]; // Derived from current project
    facilities: Facility[]; // Derived from current project
    isLoaded: boolean;

    // Data Entry Actions
    updateYearData: (year: number, field: keyof Omit<YearData, "id" | "year">, value: number) => void;
    addYear: (year: number) => void;

    // Project Management
    createProject: (name: string, initialYears?: YearData[]) => string;
    switchProject: (id: string) => void;
    renameProject: (id: string, newName: string) => void;
    deleteProject: (id: string) => void;
    // ERP Management
    addEmployee: (employee: Omit<Employee, "id">) => void;
    deleteEmployee: (id: string) => void;
    addFacility: (facility: Omit<Facility, "id">) => void;
    deleteFacility: (id: string) => void;

    // Formatting
    formatVND: (val: number) => string;
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
    const [isLoaded, setIsLoaded] = useState(false);

    // Derived active years data
    const yearsData = React.useMemo(() => {
        return projects.find(p => p.id === currentProjectId)?.yearsData || [];
    }, [projects, currentProjectId]);

    const employees = React.useMemo(() => {
        return projects.find(p => p.id === currentProjectId)?.employees || [];
    }, [projects, currentProjectId]);

    const facilities = React.useMemo(() => {
        return projects.find(p => p.id === currentProjectId)?.facilities || [];
    }, [projects, currentProjectId]);

    // Internal hook to auto-sync HR & Facility costs to OPEX whenever they change,
    // assuming uniform cost for simplicity across all years for MVP
    useEffect(() => {
        if (!currentProjectId || !isLoaded) return;

        const proj = projects.find(p => p.id === currentProjectId);
        if (!proj) return;

        const totalMonthlySalary = (proj.employees || []).reduce((sum, e) => sum + e.monthlySalary, 0);
        const totalMonthlyRent = (proj.facilities || []).reduce((sum, f) => sum + f.monthlyRent, 0);

        const extraMonthlyOpex = totalMonthlySalary + totalMonthlyRent;
        const extraAnnualOpex = extraMonthlyOpex * 12;

        // Note: For MVP Phase 2, we just override operatingExpenses to equal (HR + Rent).
        // If users typed custom opex in the grid, it will be overridden by the ERP modules 
        // if they are actively using them. Better approach is to separate `baseOpex` and `erpOpex`
        // but for this MVP, we will inject the calculation directly.
        setProjects(prev => prev.map(p => {
            if (p.id !== currentProjectId) return p;

            // Should we update OPEX? Only if there are ERP items.
            if ((p.employees && p.employees.length > 0) || (p.facilities && p.facilities.length > 0)) {
                return {
                    ...p,
                    yearsData: p.yearsData.map(y => ({
                        ...y,
                        operatingExpenses: extraAnnualOpex // Override
                    }))
                };
            }
            return p;
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employees, facilities]);

    useEffect(() => {
        const savedProjects = localStorage.getItem("sme_finance_projects_v2");
        const savedCurrent = localStorage.getItem("sme_finance_current_project_v2");

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
            initialProjects = [{
                id: defaultId,
                name: "Kế hoạch kinh doanh #1",
                yearsData: DEFAULT_YEARS,
                createdAt: Date.now()
            }];
            initialCurrent = defaultId;
        }

        setProjects(initialProjects);
        setCurrentProjectId(initialCurrent);
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem("sme_finance_projects_v2", JSON.stringify(projects));
        if (currentProjectId) {
            localStorage.setItem("sme_finance_current_project_v2", currentProjectId);
        }
    }, [projects, currentProjectId, isLoaded]);

    // ── Input Actions ──────────────────────────────
    const updateYearData = (year: number, field: keyof Omit<YearData, "id" | "year">, value: number) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                const newYearsData = p.yearsData.map(y =>
                    y.year === year ? { ...y, [field]: value } : y
                );
                return { ...p, yearsData: newYearsData };
            }
            return p;
        }));
    };

    const addYear = (year: number) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                // Check if year already exists
                if (p.yearsData.find(y => y.year === year)) return p;

                const newYears = [...p.yearsData, createEmptyYear(year)].sort((a, b) => a.year - b.year);
                return { ...p, yearsData: newYears };
            }
            return p;
        }));
    };

    // ── ERP Actions ────────────────────────────────
    const addEmployee = (employee: Omit<Employee, "id">) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                const newEmp = { ...employee, id: Date.now().toString() + Math.random().toString(36).slice(2) };
                return { ...p, employees: [...(p.employees || []), newEmp] };
            }
            return p;
        }));
    };

    const deleteEmployee = (id: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                return { ...p, employees: (p.employees || []).filter(e => e.id !== id) };
            }
            return p;
        }));
    };

    const addFacility = (facility: Omit<Facility, "id">) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                const newFac = { ...facility, id: Date.now().toString() + Math.random().toString(36).slice(2) };
                return { ...p, facilities: [...(p.facilities || []), newFac] };
            }
            return p;
        }));
    };

    const deleteFacility = (id: string) => {
        setProjects(prev => prev.map(p => {
            if (p.id === currentProjectId) {
                return { ...p, facilities: (p.facilities || []).filter(f => f.id !== id) };
            }
            return p;
        }));
    };

    // ── Project Management Actions ─────────────────
    const createProject = (name: string, initialYears: YearData[] = DEFAULT_YEARS) => {
        const newId = Date.now().toString() + Math.random().toString(36).slice(2);
        setProjects(prev => [{ id: newId, name, yearsData: initialYears, createdAt: Date.now() }, ...prev]);
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
                return [{ id: defaultId, name: "Kế hoạch #1", yearsData: DEFAULT_YEARS, createdAt: Date.now() }];
            }
            if (currentProjectId === id) {
                setCurrentProjectId(filtered[0].id);
            }
            return filtered;
        });
    };

    const formatVND = (val: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Math.abs(val));

    return (
        <FinanceContext.Provider value={{
            projects, currentProjectId, yearsData, employees, facilities, isLoaded,
            updateYearData, addYear, formatVND,
            createProject, switchProject, renameProject, deleteProject,
            addEmployee, deleteEmployee, addFacility, deleteFacility
        }}>
            {children}
        </FinanceContext.Provider>
    );
}
