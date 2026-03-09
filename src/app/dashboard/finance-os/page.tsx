"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
    TrendingUp, TrendingDown, DollarSign, Activity,
    Settings2, Building2, ArrowDownUp, Wallet,
    AlertTriangle, CheckCircle, Sparkles, Megaphone, LineChart, FileDown,
} from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import { ALLOCATION_CATEGORY_LABELS, ALLOCATION_CATEGORY_COLORS } from "@/lib/types";
import type { AllocationCategory } from "@/lib/types";

const SankeyChart = dynamic(() => import("@/components/charts/SankeyChart"), { ssr: false });

function KPICard({ label, value, sub, icon: Icon, color }: {
    label: string; value: string; sub?: string;
    icon: React.ElementType; color: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
            {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </div>
    );
}

export default function FinanceOSDashboard() {
    const fos = useFinanceOS();
    const {
        monthlyRevenue, allocations, departmentBudgets, channelBudgets,
        cashflowSummary, totalAllocPercent, formatVND, isLoaded,
    } = fos;

    // Sankey data
    const sankeyData = useMemo(() => {
        const cats: AllocationCategory[] = ["cogs", "marketing", "operations", "payroll", "profit"];
        const nodes = [
            { name: "Doanh thu", color: "#0ea5e9" },
            ...cats.map(c => ({ name: ALLOCATION_CATEGORY_LABELS[c], color: ALLOCATION_CATEGORY_COLORS[c] })),
        ];
        const links = cats.map((c, i) => {
            const alloc = allocations.find(a => a.category === c);
            return {
                source: 0,
                target: i + 1,
                value: alloc?.amount || 0,
                color: ALLOCATION_CATEGORY_COLORS[c],
            };
        });
        return { nodes, links };
    }, [allocations]);

    // Health indicators
    const profitAlloc = allocations.find(a => a.category === "profit");
    const profitMargin = monthlyRevenue > 0 && profitAlloc ? profitAlloc.percent : 0;
    const overBudgetDepts = departmentBudgets.filter(db => db.remaining < 0);

    if (!isLoaded) return null;

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Finance OS</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Revenue Allocation Model &mdash; Dòng tiền từ doanh thu đến từng nhân viên
                </p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { href: "/dashboard/finance-os/rules", label: "Phân bổ %", icon: Settings2, color: "bg-blue-50 text-blue-600" },
                    { href: "/dashboard/finance-os/departments", label: "Phòng ban", icon: Building2, color: "bg-purple-50 text-purple-600" },
                    { href: "/dashboard/finance-os/cashflow", label: "Dòng tiền", icon: ArrowDownUp, color: "bg-green-50 text-green-600" },
                    { href: "/dashboard/finance-os/salary", label: "Lương & Budget", icon: Wallet, color: "bg-amber-50 text-amber-600" },
                    { href: "/dashboard/finance-os/plan", label: "AI Planner", icon: Sparkles, color: "bg-rose-50 text-rose-600" },
                    { href: "/dashboard/finance-os/marketing", label: "Marketing ROI", icon: Megaphone, color: "bg-orange-50 text-orange-600" },
                    { href: "/dashboard/finance-os/forecast", label: "Dự báo CF", icon: LineChart, color: "bg-cyan-50 text-cyan-600" },
                    { href: "/dashboard/finance-os/reports", label: "Báo cáo", icon: FileDown, color: "bg-slate-100 text-slate-600" },
                ].map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                            <link.icon className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-sm text-slate-700">{link.label}</span>
                    </Link>
                ))}
            </div>

            {/* Layer 1: Company Health KPIs */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sức khỏe doanh nghiệp</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        label="Doanh thu tháng"
                        value={formatVND(monthlyRevenue)}
                        icon={DollarSign}
                        color="bg-blue-50 text-blue-600"
                    />
                    <KPICard
                        label="Lợi nhuận (%)"
                        value={`${profitMargin.toFixed(1)}%`}
                        sub={formatVND(profitAlloc?.amount || 0)}
                        icon={monthlyRevenue > 0 && profitMargin >= 15 ? TrendingUp : TrendingDown}
                        color={profitMargin >= 15 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}
                    />
                    <KPICard
                        label="Net Cash Flow"
                        value={formatVND(cashflowSummary.netFlow)}
                        sub={`${cashflowSummary.daysWithData} ngày dữ liệu`}
                        icon={Activity}
                        color={cashflowSummary.netFlow >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}
                    />
                    <KPICard
                        label="Cash Runway"
                        value={cashflowSummary.cashRunway === Infinity ? "An toàn" : `${Math.round(cashflowSummary.cashRunway)} ngày`}
                        sub={cashflowSummary.avgDailyNet < 0 ? "Đang cháy tiền!" : "Dòng tiền dương"}
                        icon={cashflowSummary.cashRunway < 30 ? AlertTriangle : CheckCircle}
                        color={cashflowSummary.cashRunway < 30 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
                    />
                </div>
            </section>

            {/* Layer 2: Revenue Allocation Sankey */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Dòng chảy tài chính (Revenue Allocation)
                </h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    {totalAllocPercent !== 100 && totalAllocPercent > 0 && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                             Tổng phân bổ = {totalAllocPercent.toFixed(1)}% (cần = 100%).
                            <Link href="/dashboard/finance-os/rules" className="underline font-semibold">Chỉnh sửa</Link>
                        </div>
                    )}
                    <SankeyChart
                        nodes={sankeyData.nodes}
                        links={sankeyData.links}
                        formatValue={(v) => formatVND(v)}
                    />

                    {/* Allocation breakdown bars */}
                    <div className="mt-6 space-y-3">
                        {allocations.map(a => (
                            <div key={a.category} className="flex items-center gap-3">
                                <div className="w-32 text-xs font-semibold text-slate-600 truncate">
                                    {ALLOCATION_CATEGORY_LABELS[a.category]}
                                </div>
                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, a.percent)}%`,
                                            backgroundColor: ALLOCATION_CATEGORY_COLORS[a.category],
                                        }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                        {a.percent}% = {formatVND(a.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Layer 3: Department Tracking */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        Budget phòng ban (từ Payroll Pool: {formatVND(fos.payrollPool)})
                    </h2>
                    <Link href="/dashboard/finance-os/departments" className="text-xs text-blue-600 font-semibold hover:underline">
                        Quản lý &rarr;
                    </Link>
                </div>

                {departmentBudgets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 text-sm">
                        Chưa có phòng ban nào.
                        <Link href="/dashboard/finance-os/departments" className="text-blue-600 underline ml-1">Tạo phòng ban</Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                     <th className="text-left px-5 py-3 font-semibold">Phòng ban</th>
                                     <th className="text-right px-5 py-3 font-semibold">Budget</th>
                                     <th className="text-right px-5 py-3 font-semibold">Đã dùng</th>
                                     <th className="text-right px-5 py-3 font-semibold">Còn lại</th>
                                     <th className="text-center px-5 py-3 font-semibold">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {departmentBudgets.map(db => (
                                    <tr key={db.department.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3 font-semibold text-slate-800">{db.department.name}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.budget)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.totalUsed)}</td>
                                        <td className={`px-5 py-3 text-right tabular-nums font-semibold ${db.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                            {db.remaining < 0 ? "-" : ""}{formatVND(Math.abs(db.remaining))}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            {db.remaining < 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                                                     <AlertTriangle className="w-3 h-3" /> Vượt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600">
                                                    <CheckCircle className="w-3 h-3" /> OK
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {overBudgetDepts.length > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                        <strong>{overBudgetDepts.length} phòng ban</strong> vượt budget!
                        Tổng vượt: {formatVND(overBudgetDepts.reduce((s, d) => s + Math.abs(d.remaining), 0))}
                    </div>
                )}
            </section>

            {/* Marketing Channels */}
            {channelBudgets.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Marketing Channels (Budget: {formatVND(fos.marketingPool)})
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {channelBudgets.map(cb => (
                            <div key={cb.channel.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                <div className="text-xs text-slate-500 font-medium">{cb.channel.name}</div>
                                <div className="text-lg font-bold text-slate-900 mt-1 tabular-nums">{formatVND(cb.budget)}</div>
                                <div className="text-xs text-slate-400">{cb.channel.percent}% Marketing</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Today's Cashflow */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Hôm nay</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                        <div className="text-xs text-slate-500 mb-1">Thu</div>
                        <div className="text-xl font-bold text-emerald-600 tabular-nums">{formatVND(cashflowSummary.todayRevenue)}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                        <div className="text-xs text-slate-500 mb-1">Chi</div>
                        <div className="text-xl font-bold text-red-600 tabular-nums">{formatVND(cashflowSummary.todayExpense)}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                        <div className="text-xs text-slate-500 mb-1">Net</div>
                        <div className={`text-xl font-bold tabular-nums ${cashflowSummary.todayNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {cashflowSummary.todayNet >= 0 ? "+" : "-"}{formatVND(Math.abs(cashflowSummary.todayNet))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Revenue Override Simulation */}
            <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Mô phỏng doanh thu</h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <p className="text-xs text-slate-500 mb-3">
                        Nhập doanh thu giả định để xem phân bổ thay đổi thế nào. Để trống để dùng doanh thu thực từ dòng tiền.
                    </p>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            placeholder="VD: 1000000000 (1 tỷ)"
                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={fos.revenueOverride ?? ""}
                            onChange={e => {
                                const v = e.target.value;
                                fos.setRevenueOverride(v === "" ? null : Number(v));
                            }}
                        />
                        {fos.revenueOverride !== null && (
                            <button
                                onClick={() => fos.setRevenueOverride(null)}
                                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    {fos.revenueOverride !== null && (
                        <div className="mt-2 text-xs text-amber-600 font-medium">
                            Đang dùng doanh thu mô phỏng: {formatVND(fos.revenueOverride)}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
