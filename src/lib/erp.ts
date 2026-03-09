import { createClient } from "@/utils/supabase/client";
import type {
    Invoice, InvoiceItem, Contact, Product, StockMovement, Budget,
    AuditLog, ExpenseCategory,
} from "./types";

function getSupabase() {
    return createClient();
}

// ══════════════════════════════════════════════════
// CONTACTS
// ══════════════════════════════════════════════════

export async function getContacts(workspaceId: string): Promise<Contact[]> {
    const { data, error } = await getSupabase()
        .from("erp_contacts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(c => ({
        id: c.id,
        type: c.type as "customer" | "supplier",
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        taxCode: c.tax_code || "",
        address: c.address || "",
        notes: c.notes || "",
    }));
}

export async function createContact(
    workspaceId: string,
    contact: Omit<Contact, "id">
): Promise<Contact> {
    const { data, error } = await getSupabase()
        .from("erp_contacts")
        .insert({
            workspace_id: workspaceId,
            type: contact.type,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            tax_code: contact.taxCode,
            address: contact.address,
            notes: contact.notes,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        type: data.type,
        name: data.name,
        phone: data.phone || "",
        email: data.email || "",
        taxCode: data.tax_code || "",
        address: data.address || "",
        notes: data.notes || "",
    };
}

export async function deleteContact(id: string): Promise<void> {
    const { error } = await getSupabase().from("erp_contacts").delete().eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════

export async function getInvoices(workspaceId: string): Promise<Invoice[]> {
    const { data, error } = await getSupabase()
        .from("erp_invoices")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(inv => ({
        id: inv.id,
        type: inv.type as "income" | "expense",
        contactId: inv.contact_id || "",
        contactName: inv.contact_name || "",
        description: inv.description || "",
        category: inv.category as ExpenseCategory | "Doanh thu",
        amount: Number(inv.amount),
        vatRate: Number(inv.vat_rate),
        vatAmount: Number(inv.vat_amount),
        date: inv.date,
        dueDate: inv.due_date || "",
        status: inv.status as "draft" | "sent" | "paid" | "overdue",
        items: (inv.items || []) as InvoiceItem[],
    }));
}

export async function createInvoice(
    workspaceId: string,
    invoice: Omit<Invoice, "id">
): Promise<Invoice> {
    const { data, error } = await getSupabase()
        .from("erp_invoices")
        .insert({
            workspace_id: workspaceId,
            type: invoice.type,
            contact_id: invoice.contactId || null,
            contact_name: invoice.contactName,
            description: invoice.description,
            category: invoice.category,
            amount: invoice.amount,
            vat_rate: invoice.vatRate,
            vat_amount: invoice.vatAmount,
            date: invoice.date,
            due_date: invoice.dueDate || null,
            status: invoice.status,
            items: invoice.items,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        type: data.type,
        contactId: data.contact_id || "",
        contactName: data.contact_name || "",
        description: data.description || "",
        category: data.category,
        amount: Number(data.amount),
        vatRate: Number(data.vat_rate),
        vatAmount: Number(data.vat_amount),
        date: data.date,
        dueDate: data.due_date || "",
        status: data.status,
        items: (data.items || []) as InvoiceItem[],
    };
}

export async function updateInvoice(
    id: string,
    updates: Partial<{
        status: string;
        amount: number;
        description: string;
        category: string;
    }>
): Promise<void> {
    const { error } = await getSupabase()
        .from("erp_invoices")
        .update(updates)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteInvoice(id: string): Promise<void> {
    const { error } = await getSupabase().from("erp_invoices").delete().eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════

export async function getProducts(workspaceId: string): Promise<Product[]> {
    const { data, error } = await getSupabase()
        .from("erp_products")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        unit: p.unit,
        unitCost: Number(p.unit_cost),
        currentQty: p.current_qty,
        reorderLevel: p.reorder_level,
    }));
}

export async function createProduct(
    workspaceId: string,
    product: Omit<Product, "id">
): Promise<Product> {
    const { data, error } = await getSupabase()
        .from("erp_products")
        .insert({
            workspace_id: workspaceId,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            unit_cost: product.unitCost,
            current_qty: product.currentQty,
            reorder_level: product.reorderLevel,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        name: data.name,
        sku: data.sku || "",
        unit: data.unit,
        unitCost: Number(data.unit_cost),
        currentQty: data.current_qty,
        reorderLevel: data.reorder_level,
    };
}

export async function updateProduct(
    id: string,
    updates: Partial<Pick<Product, "currentQty">>
): Promise<void> {
    const mapped: Record<string, unknown> = {};
    if (updates.currentQty !== undefined) mapped.current_qty = updates.currentQty;
    const { error } = await getSupabase()
        .from("erp_products")
        .update(mapped)
        .eq("id", id);
    if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
    const { error } = await getSupabase().from("erp_products").delete().eq("id", id);
    if (error) throw error;
}

// ══════════════════════════════════════════════════
// STOCK MOVEMENTS
// ══════════════════════════════════════════════════

export async function getStockMovements(workspaceId: string): Promise<StockMovement[]> {
    const { data, error } = await getSupabase()
        .from("erp_stock_movements")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("date", { ascending: false });
    if (error) throw error;
    return (data || []).map(m => ({
        id: m.id,
        productId: m.product_id,
        type: m.type as "in" | "out",
        qty: m.qty,
        date: m.date,
        note: m.note || "",
    }));
}

export async function createStockMovement(
    workspaceId: string,
    movement: Omit<StockMovement, "id">
): Promise<StockMovement> {
    const { data, error } = await getSupabase()
        .from("erp_stock_movements")
        .insert({
            workspace_id: workspaceId,
            product_id: movement.productId,
            type: movement.type,
            qty: movement.qty,
            date: movement.date,
            note: movement.note,
        })
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        productId: data.product_id,
        type: data.type,
        qty: data.qty,
        date: data.date,
        note: data.note || "",
    };
}

// ══════════════════════════════════════════════════
// BUDGETS
// ══════════════════════════════════════════════════

export async function getBudgets(workspaceId: string): Promise<Budget[]> {
    const { data, error } = await getSupabase()
        .from("erp_budgets")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("year", { ascending: false });
    if (error) throw error;
    return (data || []).map(b => ({
        id: b.id,
        year: b.year,
        category: b.category as ExpenseCategory,
        planned: Number(b.planned),
        actual: 0, // Computed from invoices
    }));
}

export async function upsertBudget(
    workspaceId: string,
    year: number,
    category: string,
    planned: number
): Promise<Budget> {
    const { data, error } = await getSupabase()
        .from("erp_budgets")
        .upsert(
            { workspace_id: workspaceId, year, category, planned },
            { onConflict: "workspace_id,year,category" }
        )
        .select()
        .single();
    if (error) throw error;
    return {
        id: data.id,
        year: data.year,
        category: data.category,
        planned: Number(data.planned),
        actual: 0,
    };
}

// ══════════════════════════════════════════════════
// AUDIT LOG
// ══════════════════════════════════════════════════

export async function getAuditLogs(workspaceId: string): Promise<AuditLog[]> {
    const { data, error } = await getSupabase()
        .from("erp_audit_log")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(200);
    if (error) throw error;
    return (data || []).map(l => ({
        id: l.id,
        userId: l.user_id || "",
        userEmail: l.user_email || "",
        action: l.action as "create" | "update" | "delete",
        entity: l.entity,
        entityId: l.entity_id || "",
        description: l.description || "",
        timestamp: l.created_at,
    }));
}

export async function createAuditLog(
    workspaceId: string,
    log: {
        user_email: string;
        action: "create" | "update" | "delete";
        entity: string;
        entity_id: string;
        description: string;
    }
): Promise<void> {
    await getSupabase()
        .from("erp_audit_log")
        .insert({
            workspace_id: workspaceId,
            user_email: log.user_email,
            action: log.action,
            entity: log.entity,
            entity_id: log.entity_id,
            description: log.description,
        });
}
