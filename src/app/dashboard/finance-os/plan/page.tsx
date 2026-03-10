"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, BrainCircuit, Loader2, Plus, Trash2, CheckCircle, Clock,
    Archive, TrendingUp, TrendingDown, Target, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import { useFinance } from "@/context/FinanceContext";
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Line, Cell, Legend,
} from "recharts";
import type { AIPlanResponse, PlanStatus } from "@/lib/types";

const MONTH_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const MONTH_FULL = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const STATUS_CONFIG: Record<PlanStatus, { label: string; color: string; icon: React.ElementType }> = {
    draft: { label: "Nháp", color: "bg-slate-100 text-slate-600", icon: Clock },
    active: { label: "Hoạt động", color: "bg-emerald-50 text-emerald-600", icon: CheckCircle },
    archived: { label: "Lưu trữ", color: "bg-amber-50 text-amber-600", icon: Archive },
};

export default function AIPlannerPage() {
    const fos = useFinanceOS();
    const { setPlanYearData } = useFinance();
    const {
        plans, activePlan, activePlanTargets, planVsActual,
        allocationRules, departments, marketingChannels,
        formatVND, isLoaded,
    } = fos;

    // Create plan form
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [form, setForm] = useState({
        name: `Kế hoạch ${new Date().getFullYear()}`,
        year: new Date().getFullYear(),
        annualRevenue: 0,
        industry: "",
        businessContext: "",
    });
    const [aiResult, setAiResult] = useState<AIPlanResponse | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"month" | "quarter" | "week">("month");

    // Generate AI plan
    const handleGenerate = async () => {
        if (form.annualRevenue <= 0) return;
        setGenerating(true);
        setAiResult(null);
        try {
            const res = await fetch("/api/ai-plan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    annualRevenue: form.annualRevenue,
                    industry: form.industry,
                    businessContext: form.businessContext,
                    allocationRules,
                    departments,
                    channels: marketingChannels,
                    year: form.year,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Lỗi khi tạo kế hoạch");
                return;
            }
            const data: AIPlanResponse = await res.json();
            setAiResult(data);
        } catch (err) {
            console.error("AI Plan error:", err);
            alert("Không thể kết nối AI. Vui lòng thử lại.");
        } finally {
            setGenerating(false);
        }
    };

    // Save plan + targets to Supabase, and yearData to FinanceContext
    const handleSavePlan = async () => {
        if (!aiResult) return;
        setCreating(true);
        try {
            const plan = await fos.createPlan({
                name: form.name,
                year: form.year,
                annual_revenue_target: form.annualRevenue,
                industry: form.industry,
                business_context: form.businessContext,
                ai_summary: aiResult.summary,
            });
            await fos.savePlanTargets(plan.id, aiResult.months);

            // Save full YearData as Plan for Dashboard Plan vs Actual
            if (aiResult.yearData) {
                setPlanYearData(aiResult.yearData);
            }

            setShowCreate(false);
            setAiResult(null);
            setForm({
                name: `Kế hoạch ${new Date().getFullYear()}`,
                year: new Date().getFullYear(),
                annualRevenue: 0,
                industry: "",
                businessContext: "",
            });
        } catch (err) {
            console.error("Save plan error:", err);
            alert("Không thể lưu kế hoạch. Thử lại.");
        } finally {
            setCreating(false);
        }
    };

    // Quarter aggregation from targets
    const quarterData = useMemo(() => {
        if (planVsActual.length === 0) return [];
        const quarters = [
            { quarter: 1, label: "Q1", months: [1, 2, 3] },
            { quarter: 2, label: "Q2", months: [4, 5, 6] },
            { quarter: 3, label: "Q3", months: [7, 8, 9] },
            { quarter: 4, label: "Q4", months: [10, 11, 12] },
        ];
        return quarters.map(q => {
            const qMonths = planVsActual.filter(m => q.months.includes(m.month));
            const plannedRev = qMonths.reduce((s, m) => s + m.planned.revenue, 0);
            const plannedProfit = qMonths.reduce((s, m) => s + m.planned.profit, 0);
            const actualRev = qMonths.reduce((s, m) => s + m.actual.revenue, 0);
            const actualExp = qMonths.reduce((s, m) => s + m.actual.expense, 0);
            return {
                quarter: q.quarter,
                label: q.label,
                planned: { revenue: plannedRev, profit: plannedProfit },
                actual: { revenue: actualRev, expense: actualExp },
                variance: actualRev - plannedRev,
            };
        });
    }, [planVsActual]);

    // Week targets (derived from monthly: 4 weeks per month)
    const weekData = useMemo(() => {
        if (activePlanTargets.length === 0) return [];
        const weeks: { weekNumber: number; weekLabel: string; revenue: number; expense: number; profit: number }[] = [];
        activePlanTargets.forEach(t => {
            for (let w = 0; w < 4; w++) {
                const weekNum = (t.month - 1) * 4 + w + 1;
                const weekRev = Math.round(t.revenue / 4);
                const weekExp = Math.round((t.cogs + t.marketing + t.operations + t.payroll) / 4);
                weeks.push({
                    weekNumber: weekNum,
                    weekLabel: `T${weekNum}`,
                    revenue: weekRev,
                    expense: weekExp,
                    profit: weekRev - weekExp,
                });
            }
        });
        return weeks;
    }, [activePlanTargets]);

    // Chart data for plan vs actual
    const chartData = useMemo(() => {
        return planVsActual.map(m => ({
            name: m.monthLabel,
            "KH Doanh thu": m.planned.revenue,
            "Thực tế": m.actual.revenue,
            "KH Lợi nhuận": m.planned.profit,
        }));
    }, [planVsActual]);

    // Plan totals
    const planTotals = useMemo(() => {
        if (activePlanTargets.length === 0) return null;
        return {
            revenue: activePlanTargets.reduce((s, t) => s + t.revenue, 0),
            cogs: activePlanTargets.reduce((s, t) => s + t.cogs, 0),
            marketing: activePlanTargets.reduce((s, t) => s + t.marketing, 0),
            operations: activePlanTargets.reduce((s, t) => s + t.operations, 0),
            payroll: activePlanTargets.reduce((s, t) => s + t.payroll, 0),
            profit: activePlanTargets.reduce((s, t) => s + t.profit, 0),
            actualRevenue: planVsActual.reduce((s, m) => s + m.actual.revenue, 0),
            actualExpense: planVsActual.reduce((s, m) => s + m.actual.expense, 0),
        };
    }, [activePlanTargets, planVsActual]);

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
                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                        AI Financial Planner
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        AI lập kế hoạch 12 tháng &rarr; Chia quý, tháng, tuần, ngày &rarr; So sánh Plan vs Actual
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition"
                >
                    <Plus className="w-4 h-4" /> Tạo kế hoạch mới
                </button>
            </div>

            {/* Plan switcher */}
            {plans.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Kế hoạch:</span>
                    {plans.map(p => {
                        const sc = STATUS_CONFIG[p.status];
                        const isActive = p.id === activePlan?.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => fos.setActivePlanId(p.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                    isActive
                                        ? "border-purple-300 bg-purple-50 text-purple-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <sc.icon className="w-3 h-3" />
                                {p.name} ({p.year})
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${sc.color}`}>{sc.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ═══════ CREATE PLAN FORM ═══════ */}
            {showCreate && (
                <div className="bg-white rounded-2xl border border-purple-200 shadow-lg p-6 space-y-5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-purple-600" />
                        Tạo kế hoạch tài chính với AI
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Tên kế hoạch</label>
                            <input
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="VD: Kế hoạch 2026"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Năm</label>
                            <input
                                type="number"
                                value={form.year}
                                onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Doanh thu mục tiêu cả năm (VND)</label>
                            <input
                                type="number"
                                value={form.annualRevenue || ""}
                                onChange={e => setForm(p => ({ ...p, annualRevenue: Number(e.target.value) }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="VD: 5000000000 (5 tỷ)"
                            />
                            {form.annualRevenue > 0 && (
                                <div className="text-xs text-purple-600 mt-1">
                                    = {formatVND(form.annualRevenue)} / năm = {formatVND(Math.round(form.annualRevenue / 12))} / tháng
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Ngành nghề</label>
                            <select
                                value={form.industry}
                                onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="">Chọn ngành...</option>
                                <option value="F&B">F&B (Nhà hàng / Cafe)</option>
                                <option value="Retail">Bán lẻ</option>
                                <option value="E-commerce">Thương mại điện tử</option>
                                <option value="SaaS">Phần mềm / SaaS</option>
                                <option value="Education">Giáo dục</option>
                                <option value="Healthcare">Y tế</option>
                                <option value="Manufacturing">Sản xuất</option>
                                <option value="Services">Dịch vụ</option>
                                <option value="Logistics">Vận tải / Logistics</option>
                                <option value="Real Estate">Bất động sản</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Bối cảnh doanh nghiệp (tùy chọn)</label>
                        <textarea
                            value={form.businessContext}
                            onChange={e => setForm(p => ({ ...p, businessContext: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            rows={3}
                            placeholder="VD: Công ty F&B có 3 chi nhánh tại HCM, đang mở rộng ra Hà Nội. Team 25 người. Doanh thu năm trước 3 tỷ..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={generating || form.annualRevenue <= 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition disabled:opacity-50"
                        >
                            {generating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> AI đang lập kế hoạch...</>
                            ) : (
                                <><BrainCircuit className="w-4 h-4" /> AI Generate kế hoạch</>
                            )}
                        </button>
                        <button
                            onClick={() => { setShowCreate(false); setAiResult(null); }}
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200"
                        >
                            Hủy
                        </button>
                    </div>

                    {/* AI Result Preview */}
                    {aiResult && (
                        <div className="space-y-4 border-t border-slate-200 pt-5">
                            <div className="bg-purple-50 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-purple-900 mb-2">AI Summary</h3>
                                <p className="text-xs text-purple-800">{aiResult.summary}</p>
                            </div>

                            {aiResult.insights && aiResult.insights.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {aiResult.insights.map((insight, i) => (
                                        <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800 flex items-start gap-2">
                                            <Target className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                            {insight}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Monthly preview table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                                            <th className="text-left px-3 py-2">Tháng</th>
                                            <th className="text-right px-3 py-2">Doanh thu</th>
                                            <th className="text-right px-3 py-2">COGS</th>
                                            <th className="text-right px-3 py-2">MKT</th>
                                            <th className="text-right px-3 py-2">Ops</th>
                                            <th className="text-right px-3 py-2">Payroll</th>
                                            <th className="text-right px-3 py-2">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {aiResult.months.map(m => (
                                            <tr key={m.month} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-semibold">{MONTH_FULL[m.month - 1]}</td>
                                                <td className="px-3 py-2 text-right tabular-nums text-blue-600">{formatVND(m.revenue)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatVND(m.cogs)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatVND(m.marketing)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatVND(m.operations)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatVND(m.payroll)}</td>
                                                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                    {formatVND(m.profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handleSavePlan}
                                disabled={creating}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                                {creating ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                                ) : (
                                <><CheckCircle className="w-4 h-4" /> Lưu kế hoạch này</>
                            )}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ ACTIVE PLAN DISPLAY ═══════ */}
            {activePlan && activePlanTargets.length > 0 && (
                <>
                    {/* Plan header */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{activePlan.name}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{activePlan.ai_summary}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {(["draft", "active", "archived"] as PlanStatus[]).map(status => {
                                    const sc = STATUS_CONFIG[status];
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => fos.updatePlanStatus(activePlan.id, status)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                activePlan.status === status ? sc.color + " ring-2 ring-offset-1 ring-slate-300" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                            }`}
                                        >
                                            {sc.label}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        if (confirm("Xóa kế hoạch này?")) fos.removePlan(activePlan.id);
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* KPI row */}
                        {planTotals && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <div className="text-[10px] text-blue-500 font-semibold uppercase">KH Doanh thu</div>
                                    <div className="text-lg font-bold text-blue-700 tabular-nums">{formatVND(planTotals.revenue)}</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3">
                                    <div className="text-[10px] text-emerald-500 font-semibold uppercase">KH Lợi nhuận</div>
                                    <div className="text-lg font-bold text-emerald-700 tabular-nums">{formatVND(planTotals.profit)}</div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3">
                                    <div className="text-[10px] text-purple-500 font-semibold uppercase">Thực tế DT</div>
                                    <div className="text-lg font-bold text-purple-700 tabular-nums">{formatVND(planTotals.actualRevenue)}</div>
                                </div>
                                <div className={`rounded-xl p-3 ${planTotals.actualRevenue - planTotals.revenue >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                                    <div className="text-[10px] font-semibold uppercase text-slate-500">Chênh lệch</div>
                                    <div className={`text-lg font-bold tabular-nums ${planTotals.actualRevenue - planTotals.revenue >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                        {planTotals.actualRevenue - planTotals.revenue >= 0 ? "+" : ""}{formatVND(planTotals.actualRevenue - planTotals.revenue)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View mode tabs */}
                    <div className="flex items-center gap-2">
                        {([
                            { key: "month" as const, label: "Tháng", icon: Calendar },
                            { key: "quarter" as const, label: "Quý", icon: Target },
                            { key: "week" as const, label: "Tuần", icon: Clock },
                        ]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setViewMode(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                                    viewMode === tab.key ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Plan vs Actual Chart */}
                    {viewMode === "month" && chartData.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Plan vs Actual - Theo tháng</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => {
                                        if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                                        if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                                        return v.toString();
                                    }} />
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(v: any) => formatVND(Number(v) || 0)}
                                    />
                                    <Legend />
                                    <Bar dataKey="KH Doanh thu" fill="#93c5fd" opacity={0.7} />
                                    <Bar dataKey="Thực tế" fill="#3b82f6">
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={entry["Thực tế"] >= entry["KH Doanh thu"] ? "#10b981" : "#ef4444"} />
                                        ))}
                                    </Bar>
                                    <Line type="monotone" dataKey="KH Lợi nhuận" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ═══ MONTHLY VIEW ═══ */}
                    {viewMode === "month" && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                        <th className="text-left px-4 py-3 font-semibold">Tháng</th>
                                        <th className="text-right px-4 py-3 font-semibold">KH Doanh thu</th>
                                        <th className="text-right px-4 py-3 font-semibold">Thực tế</th>
                                        <th className="text-right px-4 py-3 font-semibold">Chênh lệch</th>
                                        <th className="text-right px-4 py-3 font-semibold">%</th>
                                        <th className="text-right px-4 py-3 font-semibold">KH Profit</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {planVsActual.map(m => {
                                        const target = activePlanTargets.find(t => t.month === m.month);
                                        const isExpanded = expandedMonth === m.month;
                                        return (
                                            <React.Fragment key={m.month}>
                                                <tr className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setExpandedMonth(isExpanded ? null : m.month)}>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{MONTH_FULL[m.month - 1]}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(m.planned.revenue)}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{formatVND(m.actual.revenue)}</td>
                                                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${m.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {m.variance >= 0 ? "+" : ""}{formatVND(m.variance)}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right tabular-nums text-xs ${m.variancePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {m.variancePercent >= 0 ? "+" : ""}{m.variancePercent.toFixed(1)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-purple-600">{formatVND(m.planned.profit)}</td>
                                                    <td className="px-4 py-3">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </td>
                                                </tr>
                                                {isExpanded && target && (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-3 bg-slate-50">
                                                            <div className="grid grid-cols-5 gap-3 text-xs mb-2">
                                                                <div><span className="text-slate-400">COGS:</span> <span className="font-semibold">{formatVND(target.cogs)}</span></div>
                                                                <div><span className="text-slate-400">MKT:</span> <span className="font-semibold">{formatVND(target.marketing)}</span></div>
                                                                <div><span className="text-slate-400">Ops:</span> <span className="font-semibold">{formatVND(target.operations)}</span></div>
                                                                <div><span className="text-slate-400">Payroll:</span> <span className="font-semibold">{formatVND(target.payroll)}</span></div>
                                                                <div><span className="text-slate-400">Profit:</span> <span className="font-semibold text-emerald-600">{formatVND(target.profit)}</span></div>
                                                            </div>
                                                            {target.notes && (
                                                                <div className="text-xs text-slate-600 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                                                    {target.notes}
                                                                </div>
                                                            )}
                                                            {/* Daily breakdown */}
                                                            <div className="mt-2 text-[10px] text-slate-400">
                                                                Mục tiêu ngày: {formatVND(Math.round(target.revenue / 30))} DT / {formatVND(Math.round((target.cogs + target.marketing + target.operations + target.payroll) / 30))} CP
                                                                &nbsp;|&nbsp; Mục tiêu tuần: {formatVND(Math.round(target.revenue / 4))} DT
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ═══ QUARTER VIEW ═══ */}
                    {viewMode === "quarter" && quarterData.length > 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {quarterData.map(q => {
                                    const isAhead = q.variance >= 0;
                                    return (
                                        <div key={q.quarter} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-lg font-bold text-slate-900">{q.label}</span>
                                                {isAhead ? (
                                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                                ) : q.actual.revenue > 0 ? (
                                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                                ) : (
                                                    <Clock className="w-5 h-5 text-slate-300" />
                                                )}
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">KH Doanh thu</span>
                                                    <span className="font-semibold tabular-nums">{formatVND(q.planned.revenue)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Thực tế</span>
                                                    <span className="font-semibold tabular-nums">{formatVND(q.actual.revenue)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">KH Profit</span>
                                                    <span className="font-semibold tabular-nums text-emerald-600">{formatVND(q.planned.profit)}</span>
                                                </div>
                                                <div className="h-px bg-slate-100 my-1" />
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Chênh lệch</span>
                                                    <span className={`font-bold tabular-nums ${isAhead ? "text-emerald-600" : "text-red-600"}`}>
                                                        {isAhead ? "+" : ""}{formatVND(q.variance)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ═══ WEEK VIEW ═══ */}
                    {viewMode === "week" && weekData.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-700">Mục tiêu theo tuần (48 tuần)</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Chia đều từ kế hoạch tháng (4 tuần / tháng)</p>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-slate-50">
                                        <tr className="text-slate-500 uppercase tracking-wider">
                                             <th className="text-left px-4 py-2 font-semibold">Tuần</th>
                                            <th className="text-left px-4 py-2 font-semibold">Tháng</th>
                                            <th className="text-right px-4 py-2 font-semibold">DT Mục tiêu</th>
                                            <th className="text-right px-4 py-2 font-semibold">CP Mục tiêu</th>
                                            <th className="text-right px-4 py-2 font-semibold">LN Mục tiêu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {weekData.map(w => {
                                            const monthIdx = Math.floor((w.weekNumber - 1) / 4);
                                            return (
                                                <tr key={w.weekNumber} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-2 font-semibold text-slate-700">Tuần {w.weekNumber}</td>
                                                    <td className="px-4 py-2 text-slate-500">{MONTH_LABELS[monthIdx]}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-blue-600">{formatVND(w.revenue)}</td>
                                                    <td className="px-4 py-2 text-right tabular-nums text-red-600">{formatVND(w.expense)}</td>
                                                    <td className={`px-4 py-2 text-right tabular-nums font-semibold ${w.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {formatVND(w.profit)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Empty state */}
            {plans.length === 0 && !showCreate && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <BrainCircuit className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Chưa có kế hoạch nào</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                        Nhập doanh thu mục tiêu, AI sẽ lập kế hoạch 12 tháng chi tiết với seasonality phù hợp ngành nghề của bạn.
                        Sau đó so sánh Plan vs Actual theo tháng/quý/tuần.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition"
                    >
                        <BrainCircuit className="w-5 h-5" /> Tạo kế hoạch đầu tiên
                    </button>
                </div>
            )}
        </div>
    );
}
