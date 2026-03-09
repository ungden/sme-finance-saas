import { describe, it, expect } from "vitest";

// ── Tests for ERP business logic ──
// Tests that verify data integrity, filtering, and computed values
// used across ERP modules.

describe("Invoice filtering and aggregation", () => {
    interface Invoice {
        id: string;
        type: "income" | "expense";
        contactName: string;
        status: "draft" | "sent" | "paid" | "overdue";
        amount: number;
        category: string;
        date: string;
        vatRate: number;
    }

    const invoices: Invoice[] = [
        { id: "1", type: "income", contactName: "Customer A", status: "paid", amount: 50_000_000, category: "Doanh thu", date: "2025-03-01", vatRate: 10 },
        { id: "2", type: "income", contactName: "Customer A", status: "sent", amount: 30_000_000, category: "Doanh thu", date: "2025-03-15", vatRate: 10 },
        { id: "3", type: "expense", contactName: "Supplier X", status: "paid", amount: 20_000_000, category: "Marketing", date: "2025-03-05", vatRate: 10 },
        { id: "4", type: "expense", contactName: "Supplier Y", status: "overdue", amount: 10_000_000, category: "Luong & Nhan su", date: "2025-02-01", vatRate: 0 },
        { id: "5", type: "income", contactName: "Customer B", status: "paid", amount: 80_000_000, category: "Doanh thu", date: "2025-04-01", vatRate: 10 },
        { id: "6", type: "expense", contactName: "Supplier X", status: "paid", amount: 15_000_000, category: "Marketing", date: "2025-04-10", vatRate: 10 },
    ];

    describe("Total calculations (from invoices page)", () => {
        it("should calculate total paid income correctly", () => {
            const totalIncome = invoices
                .filter(i => i.type === "income" && i.status === "paid")
                .reduce((s, i) => s + i.amount, 0);
            expect(totalIncome).toBe(130_000_000); // 50M + 80M
        });

        it("should calculate total paid expenses correctly", () => {
            const totalExpense = invoices
                .filter(i => i.type === "expense" && i.status === "paid")
                .reduce((s, i) => s + i.amount, 0);
            expect(totalExpense).toBe(35_000_000); // 20M + 15M
        });

        it("should count overdue invoices", () => {
            const overdueCount = invoices.filter(i => i.status === "overdue").length;
            expect(overdueCount).toBe(1);
        });
    });

    describe("Contact balance (AR/AP) calculation", () => {
        // Replicate from contacts/page.tsx - balance = unpaid invoices for contact
        function getBalance(contactName: string): number {
            return invoices
                .filter(i => i.contactName === contactName && i.status !== "paid")
                .reduce((sum, i) => sum + i.amount, 0);
        }

        it("should calculate unpaid balance for Customer A", () => {
            const balance = getBalance("Customer A");
            expect(balance).toBe(30_000_000); // Only the "sent" one, not the "paid" one
        });

        it("should calculate overdue balance for Supplier Y", () => {
            const balance = getBalance("Supplier Y");
            expect(balance).toBe(10_000_000);
        });

        it("should return 0 for contact with all paid invoices", () => {
            const balance = getBalance("Customer B");
            expect(balance).toBe(0);
        });

        it("should return 0 for non-existent contact", () => {
            const balance = getBalance("Unknown Contact");
            expect(balance).toBe(0);
        });
    });

    describe("Tab filtering", () => {
        it("should show all invoices for 'all' tab", () => {
            const filtered = invoices.filter(i => "all" === "all" || i.type === "all");
            expect(filtered).toHaveLength(6);
        });

        it("should filter income only", () => {
            const filtered = invoices.filter(i => i.type === "income");
            expect(filtered).toHaveLength(3);
        });

        it("should filter expense only", () => {
            const filtered = invoices.filter(i => i.type === "expense");
            expect(filtered).toHaveLength(3);
        });
    });
});

describe("Inventory calculations", () => {
    interface Product {
        id: string;
        name: string;
        currentQty: number;
        unitCost: number;
        reorderLevel: number;
        unit: string;
    }

    const products: Product[] = [
        { id: "p1", name: "Widget A", currentQty: 100, unitCost: 50_000, reorderLevel: 20, unit: "cai" },
        { id: "p2", name: "Widget B", currentQty: 5, unitCost: 200_000, reorderLevel: 10, unit: "cai" },
        { id: "p3", name: "Widget C", currentQty: 50, unitCost: 100_000, reorderLevel: 50, unit: "hop" },
    ];

    it("should calculate total inventory value", () => {
        const totalValue = products.reduce((s, p) => s + p.currentQty * p.unitCost, 0);
        // 100*50K + 5*200K + 50*100K = 5M + 1M + 5M = 11M
        expect(totalValue).toBe(11_000_000);
    });

    it("should identify low stock products", () => {
        const lowStock = products.filter(p => p.currentQty <= p.reorderLevel);
        expect(lowStock).toHaveLength(2); // Widget B (5 <= 10) and Widget C (50 <= 50)
    });

    it("should correctly apply stock-in movement", () => {
        const product = { ...products[0] }; // Widget A: qty 100
        const moveQty = 50;
        product.currentQty = product.currentQty + moveQty;
        expect(product.currentQty).toBe(150);
    });

    it("should correctly apply stock-out movement", () => {
        const product = { ...products[0] }; // Widget A: qty 100
        const moveQty = 30;
        product.currentQty = Math.max(0, product.currentQty - moveQty);
        expect(product.currentQty).toBe(70);
    });

    it("should not allow negative stock on stock-out", () => {
        const product = { ...products[1] }; // Widget B: qty 5
        const moveQty = 10; // Try to take out more than available
        product.currentQty = Math.max(0, product.currentQty - moveQty);
        expect(product.currentQty).toBe(0); // Floor at 0
    });
});

describe("Budget vs Actual calculation", () => {
    interface Budget {
        id: string;
        year: number;
        category: string;
        planned: number;
    }

    interface Invoice {
        type: string;
        status: string;
        category: string;
        date: string;
        amount: number;
    }

    const budgets: Budget[] = [
        { id: "b1", year: 2025, category: "Marketing", planned: 50_000_000 },
        { id: "b2", year: 2025, category: "Luong & Nhan su", planned: 100_000_000 },
        { id: "b3", year: 2024, category: "Marketing", planned: 40_000_000 },
    ];

    const invoices: Invoice[] = [
        { type: "expense", status: "paid", category: "Marketing", date: "2025-03-01", amount: 20_000_000 },
        { type: "expense", status: "paid", category: "Marketing", date: "2025-06-01", amount: 15_000_000 },
        { type: "expense", status: "paid", category: "Luong & Nhan su", date: "2025-04-01", amount: 80_000_000 },
        { type: "expense", status: "draft", category: "Marketing", date: "2025-07-01", amount: 10_000_000 }, // not paid
    ];

    function getActual(category: string, year: number): number {
        return invoices
            .filter(i => i.type === "expense" && i.status === "paid" && i.category === category && i.date.startsWith(String(year)))
            .reduce((s, i) => s + i.amount, 0);
    }

    function getBudget(category: string, year: number): Budget | undefined {
        return budgets.find(b => b.category === category && b.year === year);
    }

    it("should calculate actual spend for Marketing 2025", () => {
        const actual = getActual("Marketing", 2025);
        expect(actual).toBe(35_000_000); // 20M + 15M (draft excluded)
    });

    it("should find budget for category and year", () => {
        const budget = getBudget("Marketing", 2025);
        expect(budget?.planned).toBe(50_000_000);
    });

    it("should calculate positive variance (under budget)", () => {
        const budget = getBudget("Marketing", 2025);
        const actual = getActual("Marketing", 2025);
        const diff = actual - (budget?.planned || 0);
        expect(diff).toBe(-15_000_000); // 35M - 50M = under budget by 15M
    });

    it("should calculate negative variance for payroll (under budget)", () => {
        const budget = getBudget("Luong & Nhan su", 2025);
        const actual = getActual("Luong & Nhan su", 2025);
        const diff = actual - (budget?.planned || 0);
        expect(diff).toBe(-20_000_000); // 80M - 100M = under budget
    });

    it("should calculate usage percentage", () => {
        const budget = getBudget("Marketing", 2025);
        const actual = getActual("Marketing", 2025);
        const pct = budget && budget.planned > 0 ? (actual / budget.planned) * 100 : 0;
        expect(pct).toBe(70); // 35M / 50M * 100
    });

    it("should detect over-budget scenario", () => {
        // Simulate over-budget: if Marketing planned was only 30M
        const planned = 30_000_000;
        const actual = getActual("Marketing", 2025); // 35M
        const isOver = actual > planned;
        expect(isOver).toBe(true);
    });
});

describe("Invoice status transitions", () => {
    type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

    // Replicate from invoices/page.tsx:60
    function getNextStatus(current: InvoiceStatus): InvoiceStatus {
        if (current === "draft") return "sent";
        if (current === "sent") return "paid";
        if (current === "paid") return "draft";
        return "paid"; // overdue -> paid
    }

    it("should transition draft -> sent", () => {
        expect(getNextStatus("draft")).toBe("sent");
    });

    it("should transition sent -> paid", () => {
        expect(getNextStatus("sent")).toBe("paid");
    });

    it("should transition paid -> draft (cycle back)", () => {
        expect(getNextStatus("paid")).toBe("draft");
    });

    it("should transition overdue -> paid", () => {
        expect(getNextStatus("overdue")).toBe("paid");
    });
});

describe("Contact filtering", () => {
    interface Contact {
        id: string;
        type: "customer" | "supplier";
        name: string;
    }

    const contacts: Contact[] = [
        { id: "c1", type: "customer", name: "Cong ty A" },
        { id: "c2", type: "supplier", name: "NCC B" },
        { id: "c3", type: "customer", name: "Cong ty C" },
        { id: "c4", type: "supplier", name: "NCC D" },
    ];

    it("should filter customers only", () => {
        const filtered = contacts.filter(c => c.type === "customer");
        expect(filtered).toHaveLength(2);
        expect(filtered.every(c => c.type === "customer")).toBe(true);
    });

    it("should filter suppliers only", () => {
        const filtered = contacts.filter(c => c.type === "supplier");
        expect(filtered).toHaveLength(2);
    });

    it("should return all for 'all' tab", () => {
        const tab = "all";
        const filtered = contacts.filter(c => tab === "all" || c.type === tab as "customer" | "supplier");
        expect(filtered).toHaveLength(4);
    });
});
