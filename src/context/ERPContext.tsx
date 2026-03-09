"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useWorkspace } from "./WorkspaceContext";
import * as erpApi from "@/lib/erp";
import type {
    Invoice, Contact, Product, StockMovement, Budget,
    AuditLog, ExpenseCategory,
} from "@/lib/types";

interface ERPContextType {
    invoices: Invoice[];
    contacts: Contact[];
    products: Product[];
    movements: StockMovement[];
    budgets: Budget[];
    auditLogs: AuditLog[];
    isLoaded: boolean;

    // Invoice mutations
    addInvoice: (inv: Omit<Invoice, "id">) => Promise<void>;
    updateInvoiceStatus: (id: string, status: string) => Promise<void>;
    removeInvoice: (id: string) => Promise<void>;

    // Contact mutations
    addContact: (contact: Omit<Contact, "id">) => Promise<void>;
    removeContact: (id: string) => Promise<void>;

    // Product mutations
    addProduct: (product: Omit<Product, "id">) => Promise<void>;
    removeProduct: (id: string) => Promise<void>;
    addStockMovement: (productId: string, type: "in" | "out", qty: number, note: string) => Promise<void>;

    // Budget mutations
    upsertBudget: (year: number, category: ExpenseCategory, planned: number) => Promise<void>;

    // Computed
    getActualSpend: (year: number, category: string) => number;

    refresh: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | null>(null);

export function useERP() {
    const ctx = useContext(ERPContext);
    if (!ctx) throw new Error("useERP must be used within ERPProvider");
    return ctx;
}

export function ERPProvider({ children }: { children: React.ReactNode }) {
    const ws = useWorkspace();
    const workspaceId = ws.currentWorkspace?.id || null;

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const loadData = useCallback(async () => {
        if (!workspaceId) {
            setInvoices([]);
            setContacts([]);
            setProducts([]);
            setMovements([]);
            setBudgets([]);
            setAuditLogs([]);
            setIsLoaded(true);
            return;
        }

        try {
            const [inv, con, prod, mov, bud, logs] = await Promise.all([
                erpApi.getInvoices(workspaceId),
                erpApi.getContacts(workspaceId),
                erpApi.getProducts(workspaceId),
                erpApi.getStockMovements(workspaceId),
                erpApi.getBudgets(workspaceId),
                erpApi.getAuditLogs(workspaceId),
            ]);
            setInvoices(inv);
            setContacts(con);
            setProducts(prod);
            setMovements(mov);
            setBudgets(bud);
            setAuditLogs(logs);
        } catch (err) {
            console.error("ERP: Failed to load data", err);
        } finally {
            setIsLoaded(true);
        }
    }, [workspaceId]);

    useEffect(() => {
        setIsLoaded(false);
        loadData();
    }, [loadData]);

    // ── Invoice mutations ──
    const addInvoice = useCallback(async (inv: Omit<Invoice, "id">) => {
        if (!workspaceId) return;
        const created = await erpApi.createInvoice(workspaceId, inv);
        setInvoices(prev => [created, ...prev]);
    }, [workspaceId]);

    const updateInvoiceStatus = useCallback(async (id: string, status: string) => {
        setInvoices(prev => prev.map(i => (i.id === id ? { ...i, status: status as Invoice["status"] } : i)));
        await erpApi.updateInvoice(id, { status });
    }, []);

    const removeInvoice = useCallback(async (id: string) => {
        setInvoices(prev => prev.filter(i => i.id !== id));
        await erpApi.deleteInvoice(id);
    }, []);

    // ── Contact mutations ──
    const addContact = useCallback(async (contact: Omit<Contact, "id">) => {
        if (!workspaceId) return;
        const created = await erpApi.createContact(workspaceId, contact);
        setContacts(prev => [created, ...prev]);
    }, [workspaceId]);

    const removeContact = useCallback(async (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
        await erpApi.deleteContact(id);
    }, []);

    // ── Product mutations ──
    const addProduct = useCallback(async (product: Omit<Product, "id">) => {
        if (!workspaceId) return;
        const created = await erpApi.createProduct(workspaceId, product);
        setProducts(prev => [created, ...prev]);
    }, [workspaceId]);

    const removeProduct = useCallback(async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        await erpApi.deleteProduct(id);
    }, []);

    const addStockMovement = useCallback(async (productId: string, type: "in" | "out", qty: number, note: string) => {
        if (!workspaceId) return;
        const movement = await erpApi.createStockMovement(workspaceId, {
            productId,
            type,
            qty,
            date: new Date().toISOString(),
            note,
        });
        setMovements(prev => [movement, ...prev]);

        // Update product qty
        const product = products.find(p => p.id === productId);
        if (product) {
            const newQty = type === "in"
                ? product.currentQty + qty
                : Math.max(0, product.currentQty - qty);
            setProducts(prev => prev.map(p => (p.id === productId ? { ...p, currentQty: newQty } : p)));
            await erpApi.updateProduct(productId, { currentQty: newQty });
        }
    }, [workspaceId, products]);

    // ── Budget mutations ──
    const upsertBudgetFn = useCallback(async (year: number, category: ExpenseCategory, planned: number) => {
        if (!workspaceId) return;
        const updated = await erpApi.upsertBudget(workspaceId, year, category, planned);
        setBudgets(prev => {
            const existing = prev.findIndex(b => b.year === year && b.category === category);
            if (existing >= 0) {
                const newBudgets = [...prev];
                newBudgets[existing] = updated;
                return newBudgets;
            }
            return [updated, ...prev];
        });
    }, [workspaceId]);

    // ── Computed: actual spend from invoices ──
    const getActualSpend = useCallback((year: number, category: string): number => {
        return invoices
            .filter(inv => inv.type === "expense" && inv.status === "paid" && inv.category === category && inv.date.startsWith(String(year)))
            .reduce((sum, inv) => sum + inv.amount, 0);
    }, [invoices]);

    const refresh = useCallback(async () => {
        await loadData();
    }, [loadData]);

    const value = useMemo<ERPContextType>(() => ({
        invoices, contacts, products, movements, budgets, auditLogs, isLoaded,
        addInvoice, updateInvoiceStatus, removeInvoice,
        addContact, removeContact,
        addProduct, removeProduct, addStockMovement,
        upsertBudget: upsertBudgetFn,
        getActualSpend,
        refresh,
    }), [
        invoices, contacts, products, movements, budgets, auditLogs, isLoaded,
        addInvoice, updateInvoiceStatus, removeInvoice,
        addContact, removeContact,
        addProduct, removeProduct, addStockMovement,
        upsertBudgetFn, getActualSpend, refresh,
    ]);

    return (
        <ERPContext.Provider value={value}>
            {children}
        </ERPContext.Provider>
    );
}
