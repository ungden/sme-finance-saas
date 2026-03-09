"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import type { CashflowSource } from "@/lib/types";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from "recharts";

export default function CashflowPage() {
    const fos = useFinanceOS();
    const { dailyCashflow, cashflowSummary, formatVND, isLoaded } = fos;

    // Form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        revenue: 0,
        expense: 0,
        source: "manual" as CashflowSource,
        notes: "",
    });

    // Filter
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    const handleAdd = async () => {
        try {
            await fos.addCashflowEntry(form);
            setForm({ date: new Date().toISOString().slice(0, 10), revenue: 0, expense: 0, source: "manual", notes: "" });
            setShowForm(false);
        } catch (err) {
            console.error("Failed to add cashflow entry:", err);
        }
    };

    // Filtered entries
    const filteredEntries = useMemo(() => {
        return dailyCashflow
            .filter(cf => cf.date.startsWith(filterMonth))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [dailyCashflow, filterMonth]);

    // Chart data (daily aggregated)
    const chartData = useMemo(() => {
        const map = new Map<string, { date: string; revenue: number; expense: number; net: number }>();
        filteredEntries.forEach(cf => {
            const existing = map.get(cf.date) || { date: cf.date, revenue: 0, expense: 0, net: 0 };
            existing.revenue += cf.revenue;
            existing.expense += cf.expense;
            existing.net = existing.revenue - existing.expense;
            map.set(cf.date, existing);
        });
        return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredEntries]);

    // Monthly totals
    const monthTotals = useMemo(() => {
        const rev = filteredEntries.reduce((s, cf) => s + cf.revenue, 0);
        const exp = filteredEntries.reduce((s, cf) => s + cf.expense, 0);
        return { revenue: rev, expense: exp, net: rev - exp };
    }, [filteredEntries]);

    // Cumulative for chart
    const cumulativeData = useMemo(() => {
        let cumulative = 0;
        return chartData.map(d => {
            cumulative += d.net;
            return { ...d, cumulative };
        });
    }, [chartData]);

    if (!isLoaded) return null;

    const fmtShort = (v: number) => {
        if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
        if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
        if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
        return v.toString();
    };

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">Dong tien hang ngay</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Ghi nhan thu chi moi ngay, theo doi net cash flow</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" /> Them ban ghi
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-slate-500 font-medium">Thu thang nay</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600 tabular-nums">{formatVND(monthTotals.revenue)}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-slate-500 font-medium">Chi thang nay</span>
                    </div>
                    <div className="text-xl font-bold text-red-600 tabular-nums">{formatVND(monthTotals.expense)}</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-slate-500 font-medium">Net Flow</span>
                    </div>
                    <div className={`text-xl font-bold tabular-nums ${monthTotals.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {monthTotals.net >= 0 ? "+" : "-"}{formatVND(Math.abs(monthTotals.net))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-slate-500 font-medium">TB/ngay</span>
                    </div>
                    <div className={`text-xl font-bold tabular-nums ${cashflowSummary.avgDailyNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatVND(Math.abs(cashflowSummary.avgDailyNet))}
                    </div>
                </div>
            </div>

            {/* Month filter */}
            <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-500">Thang:</label>
                <input
                    type="month"
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Chart */}
            {cumulativeData.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Bieu do dong tien</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={cumulativeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={fmtShort} />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, name: any) => [formatVND(Number(v) || 0), name === "revenue" ? "Thu" : name === "expense" ? "Chi" : name === "net" ? "Net" : "Luy ke"]}
                                labelFormatter={(l) => `Ngay ${l}`}
                            />
                            <Bar dataKey="revenue" fill="#10b981" opacity={0.7} name="Thu" />
                            <Bar dataKey="expense" fill="#ef4444" opacity={0.7} name="Chi" />
                            <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} name="Luy ke" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Add form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Them ban ghi moi</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Ngay</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Thu (VND)</label>
                            <input
                                type="number"
                                value={form.revenue || ""}
                                onChange={e => setForm(p => ({ ...p, revenue: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Chi (VND)</label>
                            <input
                                type="number"
                                value={form.expense || ""}
                                onChange={e => setForm(p => ({ ...p, expense: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Nguon</label>
                            <select
                                value={form.source}
                                onChange={e => setForm(p => ({ ...p, source: e.target.value as CashflowSource }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="manual">Nhap tay</option>
                                <option value="invoice">Tu hoa don</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Ghi chu</label>
                        <input
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="VD: Doanh thu ban hang, Thanh toan NCC..."
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                            Luu
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200">
                            Huy
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="text-left px-5 py-3 font-semibold">Ngay</th>
                            <th className="text-right px-5 py-3 font-semibold">Thu</th>
                            <th className="text-right px-5 py-3 font-semibold">Chi</th>
                            <th className="text-right px-5 py-3 font-semibold">Net</th>
                            <th className="text-left px-5 py-3 font-semibold">Nguon</th>
                            <th className="text-left px-5 py-3 font-semibold">Ghi chu</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                    Chua co du lieu cho thang nay. Bam &quot;Them ban ghi&quot; de bat dau.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map(cf => {
                                const net = cf.revenue - cf.expense;
                                return (
                                    <tr key={cf.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3 font-medium text-slate-700">{cf.date}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-emerald-600">{formatVND(cf.revenue)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-red-600">{formatVND(cf.expense)}</td>
                                        <td className={`px-5 py-3 text-right tabular-nums font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {net >= 0 ? "+" : "-"}{formatVND(Math.abs(net))}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cf.source === "manual" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                                                {cf.source === "manual" ? "Tay" : "Hoa don"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate">{cf.notes}</td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => fos.removeCashflowEntry(cf.id)}
                                                className="text-slate-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
