"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign,
    Users, Target, BarChart3, Trash2,
} from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, ComposedChart, Line,
} from "recharts";

export default function MarketingROIPage() {
    const fos = useFinanceOS();
    const { marketingChannels, channelROIs, marketingSpend, marketingPool, formatVND, isLoaded } = fos;

    // Form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        channel_id: "",
        month: (() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        })(),
        spend: 0,
        leads: 0,
        customers: 0,
        revenue_attributed: 0,
        notes: "",
    });

    const handleAdd = async () => {
        if (!form.channel_id || form.spend <= 0) return;
        try {
            await fos.addMarketingSpend(form);
            setForm(prev => ({ ...prev, spend: 0, leads: 0, customers: 0, revenue_attributed: 0, notes: "" }));
            setShowForm(false);
        } catch (err) {
            console.error("Failed to add marketing spend:", err);
        }
    };

    // Totals
    const totals = useMemo(() => {
        const totalSpend = channelROIs.reduce((s, c) => s + c.totalSpend, 0);
        const totalLeads = channelROIs.reduce((s, c) => s + c.totalLeads, 0);
        const totalCustomers = channelROIs.reduce((s, c) => s + c.totalCustomers, 0);
        const totalRevenue = channelROIs.reduce((s, c) => s + c.totalRevenue, 0);
        const avgROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
        const avgCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
        const blendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        return { totalSpend, totalLeads, totalCustomers, totalRevenue, avgROI, avgCAC, blendedROAS };
    }, [channelROIs]);

    // Chart data per channel
    const channelChartData = useMemo(() => {
        return channelROIs
            .filter(c => c.totalSpend > 0)
            .map(c => ({
                name: c.channel.name,
                "Chi phí": c.totalSpend,
                "Doanh thu": c.totalRevenue,
                "ROI (%)": Math.round(c.roi),
                "ROAS": Number(c.roas.toFixed(2)),
            }));
    }, [channelROIs]);

    // Monthly trend across all channels
    const monthlyTrend = useMemo(() => {
        const map = new Map<string, { month: string; spend: number; revenue: number; leads: number; customers: number }>();
        marketingSpend.forEach(s => {
            const existing = map.get(s.month) || { month: s.month, spend: 0, revenue: 0, leads: 0, customers: 0 };
            existing.spend += s.spend;
            existing.revenue += s.revenue_attributed;
            existing.leads += s.leads;
            existing.customers += s.customers;
            map.set(s.month, existing);
        });
        return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    }, [marketingSpend]);

    if (!isLoaded) return null;

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        Marketing ROI Tracker
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Theo dõi chi phí, leads, khách hàng, ROI và CAC trên từng kênh
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition"
                >
                    <Plus className="w-4 h-4" /> Nhập chi phí
                </button>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Budget MKT</span>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-blue-600 tabular-nums">{formatVND(marketingPool)}</div>
                    <div className="text-xs text-slate-400 mt-1">Đã chi: {formatVND(totals.totalSpend)}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Blended ROI</span>
                        {totals.avgROI >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className={`text-xl font-bold tabular-nums ${totals.avgROI >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {totals.avgROI >= 0 ? "+" : ""}{totals.avgROI.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">ROAS: {totals.blendedROAS.toFixed(2)}x</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">CAC</span>
                        <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-purple-600 tabular-nums">{formatVND(totals.avgCAC)}</div>
                    <div className="text-xs text-slate-400 mt-1">{totals.totalCustomers} khách hàng</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Doanh thu MKT</span>
                        <BarChart3 className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold text-amber-600 tabular-nums">{formatVND(totals.totalRevenue)}</div>
                    <div className="text-xs text-slate-400 mt-1">{totals.totalLeads} leads</div>
                </div>
            </div>

            {/* Add spend form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Nhập chi phí marketing</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Kênh</label>
                            <select
                                value={form.channel_id}
                                onChange={e => setForm(p => ({ ...p, channel_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="">Chọn kênh...</option>
                                {marketingChannels.map(ch => (
                                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Tháng</label>
                            <input
                                type="month"
                                value={form.month}
                                onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Chi phí (VND)</label>
                            <input
                                type="number"
                                value={form.spend || ""}
                                onChange={e => setForm(p => ({ ...p, spend: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Leads</label>
                            <input
                                type="number"
                                value={form.leads || ""}
                                onChange={e => setForm(p => ({ ...p, leads: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Khách hàng mới</label>
                            <input
                                type="number"
                                value={form.customers || ""}
                                onChange={e => setForm(p => ({ ...p, customers: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Doanh thu từ kênh (VND)</label>
                            <input
                                type="number"
                                value={form.revenue_attributed || ""}
                                onChange={e => setForm(p => ({ ...p, revenue_attributed: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Ghi chu</label>
                            <input
                                value={form.notes}
                                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="VD: Facebook Ads T3..."
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} disabled={!form.channel_id || form.spend <= 0} className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50">
                            Lưu
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200">
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Channel ROI cards */}
            {channelROIs.length > 0 && (
                <section>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Hiệu quả từng kênh</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {channelROIs.map(c => {
                            const budgetUsage = c.budget > 0 ? (c.totalSpend / c.budget) * 100 : 0;
                            return (
                                <div key={c.channel.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{c.channel.name}</h3>
                                            <div className="text-xs text-slate-500">
                                                {c.channel.percent}% Marketing Pool = Budget {formatVND(c.budget)}
                                            </div>
                                        </div>
                                        {c.totalSpend > 0 && (
                                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.roi >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                                ROI {c.roi >= 0 ? "+" : ""}{c.roi.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>

                                    {c.totalSpend > 0 ? (
                                        <>
                                            <div className="grid grid-cols-4 gap-2 text-center mb-3">
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase">Chi phí</div>
                                                    <div className="text-sm font-bold text-red-600 tabular-nums">{formatVND(c.totalSpend)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase">DT</div>
                                                    <div className="text-sm font-bold text-emerald-600 tabular-nums">{formatVND(c.totalRevenue)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase">CAC</div>
                                                    <div className="text-sm font-bold text-purple-600 tabular-nums">{formatVND(c.cac)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase">ROAS</div>
                                                    <div className="text-sm font-bold text-amber-600 tabular-nums">{c.roas.toFixed(2)}x</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <span>{c.totalLeads} leads</span>
                                                <span className="text-slate-300">|</span>
                                                <span>{c.totalCustomers} KH</span>
                                                <span className="text-slate-300">|</span>
                                                <span>CPL: {formatVND(c.cpl)}</span>
                                            </div>

                                            {/* Budget usage bar */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                                    <span>Đã chi / Budget</span>
                                                    <span>{budgetUsage.toFixed(0)}%</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${budgetUsage > 100 ? "bg-red-500" : budgetUsage > 80 ? "bg-amber-500" : "bg-blue-500"}`}
                                                        style={{ width: `${Math.min(100, budgetUsage)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-slate-400 py-2">Chưa có dữ liệu chi phí. Bấm &quot;Nhập chi phí&quot; để bắt đầu.</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Channel comparison chart */}
            {channelChartData.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">So sánh hiệu quả kênh</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart data={channelChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => {
                                if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                                if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                                return v.toString();
                            }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, name: any) => {
                                    if (name === "ROI (%)") return [`${v}%`, name];
                                    if (name === "ROAS") return [`${v}x`, name];
                                    return [formatVND(Number(v) || 0), name];
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Chi phí" fill="#ef4444" opacity={0.7} />
                            <Bar yAxisId="left" dataKey="Doanh thu" fill="#10b981" opacity={0.7} />
                            <Line yAxisId="right" type="monotone" dataKey="ROI (%)" stroke="#8b5cf6" strokeWidth={2} dot />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Monthly trend */}
            {monthlyTrend.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-4">Xu hướng chi phí MKT theo tháng</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => {
                                if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                                if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                                return v.toString();
                            }} />
                            <Tooltip
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(v: any, name: any) => [name === "spend" ? formatVND(Number(v)) : v, name === "spend" ? "Chi phí" : name === "revenue" ? "Doanh thu" : name]}
                            />
                            <Legend />
                            <Bar dataKey="spend" fill="#ef4444" name="Chi phí" />
                            <Bar dataKey="revenue" fill="#10b981" name="Doanh thu" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Recent spend entries */}
            {marketingSpend.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700">Lịch sử chi phí</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="text-left px-5 py-3 font-semibold">Tháng</th>
                                <th className="text-left px-5 py-3 font-semibold">Kênh</th>
                                <th className="text-right px-5 py-3 font-semibold">Chi phí</th>
                                <th className="text-right px-5 py-3 font-semibold">Leads</th>
                                <th className="text-right px-5 py-3 font-semibold">KH</th>
                                <th className="text-right px-5 py-3 font-semibold">DT</th>
                                <th className="text-right px-5 py-3 font-semibold">ROI</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {marketingSpend.slice(0, 20).map(s => {
                                const ch = marketingChannels.find(c => c.id === s.channel_id);
                                const roi = s.spend > 0 ? ((s.revenue_attributed - s.spend) / s.spend) * 100 : 0;
                                return (
                                    <tr key={s.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-2.5 font-medium text-slate-700">{s.month}</td>
                                        <td className="px-5 py-2.5 text-slate-600">{ch?.name || "—"}</td>
                                        <td className="px-5 py-2.5 text-right tabular-nums text-red-600">{formatVND(s.spend)}</td>
                                        <td className="px-5 py-2.5 text-right tabular-nums">{s.leads}</td>
                                        <td className="px-5 py-2.5 text-right tabular-nums">{s.customers}</td>
                                        <td className="px-5 py-2.5 text-right tabular-nums text-emerald-600">{formatVND(s.revenue_attributed)}</td>
                                        <td className={`px-5 py-2.5 text-right tabular-nums text-xs font-semibold ${roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
                                        </td>
                                        <td className="px-5 py-2.5">
                                            <button
                                                onClick={() => fos.removeMarketingSpend(s.id)}
                                                className="text-slate-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty state */}
            {marketingChannels.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                    Chưa có kênh marketing nào. Tạo kênh trong
                    <Link href="/dashboard/finance-os/departments" className="text-blue-600 underline ml-1">Phòng ban & Kênh</Link>
                </div>
            )}
        </div>
    );
}
