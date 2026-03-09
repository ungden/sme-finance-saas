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
    { href: "/dashboard/invoices", label: "Hóa đơn", desc: "Quản lý hóa đơn mua bán", icon: FileText, color: "bg-blue-50 text-blue-600" },
    { href: "/dashboard/contacts", label: "Đối tác", desc: "Khách hàng & nhà cung cấp", icon: UserCircle, color: "bg-violet-50 text-violet-600" },
    { href: "/dashboard/inventory", label: "Kho hàng", desc: "Tồn kho & xuất nhập", icon: Package, color: "bg-amber-50 text-amber-600" },
    { href: "/dashboard/budget", label: "Ngân sách", desc: "Kế hoạch vs thực tế", icon: Target, color: "bg-emerald-50 text-emerald-600" },
    { href: "/dashboard/tax", label: "Thuế & VAT", desc: "Tính thuế tự động", icon: Receipt, color: "bg-rose-50 text-rose-600" },
    { href: "/dashboard/import", label: "Import CSV", desc: "Nhập dữ liệu hàng loạt", icon: Upload, color: "bg-cyan-50 text-cyan-600" },
    { href: "/dashboard/audit", label: "Nhật ký", desc: "Lịch sử thay đổi", icon: Clock, color: "bg-slate-100 text-slate-600" },
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
                    Quản lý vận hành doanh nghiệp &mdash; hóa đơn, đối tác, kho, thuế
                </p>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phải thu (AR)</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalAR)}</div>
                    <div className="text-xs text-slate-400 mt-1">{invoices.filter(i => i.type === "income").length} hóa đơn bán</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phải trả (AP)</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalAP)}</div>
                    <div className="text-xs text-slate-400 mt-1">{invoices.filter(i => i.type === "expense").length} hóa đơn mua</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quá hạn</span>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${overdueCount > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {overdueCount > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{overdueCount}</div>
                    <div className="text-xs text-slate-400 mt-1">hóa đơn quá hạn</div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                         <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Giá trị kho</span>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">{formatVND(totalInventoryValue)}</div>
                    <div className="text-xs text-slate-400 mt-1">{products.length} sản phẩm &middot; {contacts.length} đối tác</div>
                </div>
            </div>

            {/* ERP Tools Grid */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Công cụ ERP</h2>
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
