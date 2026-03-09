"use client";

import React from "react";
import Link from "next/link";
import {
    FileText, UserCircle, Package, Target, Receipt,
    Upload, Clock, TrendingUp, TrendingDown, DollarSign,
    AlertCircle, CheckCircle2,
} from "lucide-react";
import { useERP } from "@/context/ERPContext";
import { useFinance } from "@/context/FinanceContext";

const ERP_TOOLS = [
    { href: "/dashboard/invoices", label: "Hoa don", desc: "Quan ly hoa don mua ban", icon: FileText, color: "bg-blue-50 text-blue-600" },
    { href: "/dashboard/contacts", label: "Doi tac", desc: "Khach hang & nha cung cap", icon: UserCircle, color: "bg-violet-50 text-violet-600" },
    { href: "/dashboard/inventory", label: "Kho", desc: "Ton kho & xuat nhap", icon: Package, color: "bg-amber-50 text-amber-600" },
    { href: "/dashboard/budget", label: "Ngan sach", desc: "Ke hoach vs thuc te", icon: Target, color: "bg-emerald-50 text-emerald-600" },
    { href: "/dashboard/tax", label: "Thue & VAT", desc: "Tinh thue tu dong", icon: Receipt, color: "bg-rose-50 text-rose-600" },
    { href: "/dashboard/import", label: "Import CSV", desc: "Nhap du lieu hang loat", icon: Upload, color: "bg-cyan-50 text-cyan-600" },
    { href: "/dashboard/audit", label: "Nhat ky", desc: "Lich su thay doi", icon: Clock, color: "bg-slate-100 text-slate-600" },
];

export default function ERPHubPage() {
    const { invoices, contacts, products, isLoaded } = useERP();
    const { formatVND } = useFinance();

    if (!isLoaded) return null;

    // Quick KPIs
    const totalAR = invoices
        .filter(i => i.type === "income" && i.status !== "paid")
        .reduce((s, i) => s + i.amount, 0);
    const totalAP = invoices
        .filter(i => i.type === "expense" && i.status !== "paid")
        .reduce((s, i) => s + i.amount, 0);
    const overdueCount = invoices.filter(i => {
        if (i.status === "paid") return false;
        const due = new Date(i.dueDate);
        return due < new Date();
    }).length;
    const totalInventoryValue = products.reduce((s, p) => s + p.currentQty * p.unitCost, 0);

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">ERP</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Quan ly van hanh doanh nghiep &mdash; hoa don, doi tac, kho, thue
                </p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phai thu (AR)</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalAR)}</div>
                    <div className="text-xs text-slate-400 mt-1">{invoices.filter(i => i.type === "income").length} hoa don ban</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phai tra (AP)</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalAP)}</div>
                    <div className="text-xs text-slate-400 mt-1">{invoices.filter(i => i.type === "expense").length} hoa don mua</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qua han</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overdueCount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {overdueCount > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{overdueCount}</div>
                    <div className="text-xs text-slate-400 mt-1">hoa don qua han</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gia tri kho</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalInventoryValue)}</div>
                    <div className="text-xs text-slate-400 mt-1">{products.length} san pham &middot; {contacts.length} doi tac</div>
                </div>
            </div>

            {/* ERP Tools Grid */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cong cu ERP</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ERP_TOOLS.map(tool => (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">{tool.label}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{tool.desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
