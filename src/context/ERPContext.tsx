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

    // ── Invoice mutations (with error rollback) ──
    const addInvoice = useCallback(async (inv: Omit<Invoice, "id">) => {
        if (!workspaceId) return;
        try {
            const created = await erpApi.createInvoice(workspaceId, inv);
            setInvoices(prev => [created, ...prev]);
        } catch (err) {
            console.error("Failed to create invoice", err);
            throw err;
        }
    }, [workspaceId]);

    const updateInvoiceStatus = useCallback(async (id: string, status: string) => {
        const rollback = invoices.find(i => i.id === id);
        setInvoices(prev => prev.map(i => (i.id === id ? { ...i, status: status as Invoice["status"] } : i)));
        try {
            await erpApi.updateInvoice(id, { status });
        } catch (err) {
            console.error("Failed to update invoice status, rolling back", err);
            if (rollback) setInvoices(prev => prev.map(i => (i.id === id ? rollback : i)));
            throw err;
        }
    }, [invoices]);

    const removeInvoice = useCallback(async (id: string) => {
        const rollback = invoices;
        setInvoices(prev => prev.filter(i => i.id !== id));
        try {
            await erpApi.deleteInvoice(id);
        } catch (err) {
            console.error("Failed to delete invoice, rolling back", err);
            setInvoices(rollback);
            throw err;
        }
    }, [invoices]);

    // ── Contact mutations (with error rollback) ──
    const addContact = useCallback(async (contact: Omit<Contact, "id">) => {
        if (!workspaceId) return;
        try {
            const created = await erpApi.createContact(workspaceId, contact);
            setContacts(prev => [created, ...prev]);
        } catch (err) {
            console.error("Failed to create contact", err);
            throw err;
        }
    }, [workspaceId]);

    const removeContact = useCallback(async (id: string) => {
        const rollback = contacts;
        setContacts(prev => prev.filter(c => c.id !== id));
        try {
            await erpApi.deleteContact(id);
        } catch (err) {
            console.error("Failed to delete contact, rolling back", err);
            setContacts(rollback);
            throw err;
        }
    }, [contacts]);

    // ── Product mutations (with error rollback) ──
    const addProduct = useCallback(async (product: Omit<Product, "id">) => {
        if (!workspaceId) return;
        try {
            const created = await erpApi.createProduct(workspaceId, product);
            setProducts(prev => [created, ...prev]);
        } catch (err) {
            console.error("Failed to create product", err);
            throw err;
        }
    }, [workspaceId]);

    const removeProduct = useCallback(async (id: string) => {
        const rollback = products;
        setProducts(prev => prev.filter(p => p.id !== id));
        try {
            await erpApi.deleteProduct(id);
        } catch (err) {
            console.error("Failed to delete product, rolling back", err);
            setProducts(rollback);
            throw err;
        }
    }, [products]);

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

        // Use functional setState to avoid stale closure on products
        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;
            const newQty = type === "in"
                ? p.currentQty + qty
                : Math.max(0, p.currentQty - qty);
            // Fire async update (non-blocking)
            erpApi.updateProduct(productId, { currentQty: newQty }).catch(err =>
                console.error("Failed to update product qty", err)
            );
            return { ...p, currentQty: newQty };
        }));
    }, [workspaceId]);

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
