"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    ArrowLeft, LineChart as LineChartIcon, Loader2, Plus, Trash2,
    TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle,
} from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Bar, Line, Legend,
} from "recharts";
import type { ForecastScenario, ForecastMonth, ForecastAssumptions } from "@/lib/types";

const SCENARIO_CONFIG: Record<ForecastScenario, { label: string; color: string; bg: string }> = {
    base: { label: "Co so", color: "text-blue-600", bg: "bg-blue-50" },
    optimistic: { label: "Lac quan", color: "text-emerald-600", bg: "bg-emerald-50" },
    pessimistic: { label: "Than trong", color: "text-red-600", bg: "bg-red-50" },
    custom: { label: "Tuy chinh", color: "text-purple-600", bg: "bg-purple-50" },
};

interface AIForecastResponse {
    monthly_data: ForecastMonth[];
    assumptions: ForecastAssumptions;
    summary: string;
    insights: string[];
}

export default function CashflowForecastPage() {
    const fos = useFinanceOS();
    const {
        dailyCashflow, forecasts, activeForecast,
        formatVND, isLoaded,
    } = fos;

    const [showCreate, setShowCreate] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [aiResult, setAiResult] = useState<AIForecastResponse | null>(null);
    const [form, setForm] = useState({
        name: "Du bao dong tien",
        scenario: "base" as ForecastScenario,
        forecastMonths: 6,
        industry: "",
        context: "",
    });

    // Build historical monthly data from daily cashflow
    const historicalMonthly = useMemo(() => {
        const map = new Map<string, { month: string; revenue: number; expense: number; net: number }>();
        dailyCashflow.forEach(cf => {
            const m = cf.date.slice(0, 7);
            const existing = map.get(m) || { month: m, revenue: 0, expense: 0, net: 0 };
            existing.revenue += cf.revenue;
            existing.expense += cf.expense;
            existing.net = existing.revenue - existing.expense;
            map.set(m, existing);
        });
        return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    }, [dailyCashflow]);

    // Generate forecast
    const handleGenerate = async () => {
        if (historicalMonthly.length === 0) return;
        setGenerating(true);
        setAiResult(null);
        try {
            const res = await fetch("/api/ai-forecast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    historicalData: historicalMonthly,
                    forecastMonths: form.forecastMonths,
                    scenario: form.scenario,
                    industry: form.industry,
                    context: form.context,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Loi khi tao du bao");
                return;
            }
            const data: AIForecastResponse = await res.json();
            setAiResult(data);
        } catch (err) {
            console.error("AI Forecast error:", err);
            alert("Khong the ket noi AI. Vui long thu lai.");
        } finally {
            setGenerating(false);
        }
    };

    // Save forecast
    const handleSave = async () => {
        if (!aiResult) return;
        setSaving(true);
        try {
            await fos.createForecast({
                name: form.name,
                scenario: form.scenario,
                forecast_months: form.forecastMonths,
                monthly_data: aiResult.monthly_data,
                assumptions: aiResult.assumptions,
                ai_summary: aiResult.summary,
            });
            setShowCreate(false);
            setAiResult(null);
        } catch (err) {
            console.error("Save forecast error:", err);
            alert("Khong the luu du bao. Thu lai.");
        } finally {
            setSaving(false);
        }
    };

    // Combined chart data: historical + forecast
    const combinedChartData = useMemo(() => {
        if (!activeForecast) return [];
        const hist = historicalMonthly.map(m => ({
            month: m.month,
            "DT Thuc te": m.revenue,
            "CP Thuc te": m.expense,
            "DT Du bao": null as number | null,
            "CP Du bao": null as number | null,
            confidence: null as number | null,
        }));
        const forecast = activeForecast.monthly_data.map(m => ({
            month: m.month,
            "DT Thuc te": null as number | null,
            "CP Thuc te": null as number | null,
            "DT Du bao": m.revenue,
            "CP Du bao": m.expense,
            confidence: m.confidence,
        }));
        return [...hist.slice(-6), ...forecast];
    }, [historicalMonthly, activeForecast]);

    // Forecast totals
    const forecastTotals = useMemo(() => {
        if (!activeForecast) return null;
        const data = activeForecast.monthly_data;
        const totalRev = data.reduce((s, m) => s + m.revenue, 0);
        const totalExp = data.reduce((s, m) => s + m.expense, 0);
        const avgConfidence = data.reduce((s, m) => s + m.confidence, 0) / data.length;
        return { totalRev, totalExp, net: totalRev - totalExp, avgConfidence };
    }, [activeForecast]);

    // Preview chart data
    const previewChartData = useMemo(() => {
        if (!aiResult) return [];
        const hist = historicalMonthly.slice(-6).map(m => ({
            month: m.month.slice(5),
            "Lich su": m.revenue,
            "Du bao": null as number | null,
        }));
        const forecast = aiResult.monthly_data.map(m => ({
            month: m.month.slice(5),
            "Lich su": null as number | null,
            "Du bao": m.revenue,
        }));
        return [...hist, ...forecast];
    }, [historicalMonthly, aiResult]);

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
                        <LineChartIcon className="w-5 h-5 text-cyan-600" />
                        Du bao dong tien (Cash Flow Forecast)
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        AI du bao tu lich su dong tien &rarr; 3 kich ban &rarr; Do tin cay
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition"
                >
                    <Plus className="w-4 h-4" /> Tao du bao
                </button>
            </div>

            {/* Historical summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">DT TB/thang</div>
                    <div className="text-xl font-bold text-blue-600 tabular-nums">
                        {formatVND(historicalMonthly.length > 0
                            ? historicalMonthly.reduce((s, m) => s + m.revenue, 0) / historicalMonthly.length
                            : 0)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{historicalMonthly.length} thang lich su</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">CP TB/thang</div>
                    <div className="text-xl font-bold text-red-600 tabular-nums">
                        {formatVND(historicalMonthly.length > 0
                            ? historicalMonthly.reduce((s, m) => s + m.expense, 0) / historicalMonthly.length
                            : 0)}
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Net TB/thang</div>
                    {(() => {
                        const avg = historicalMonthly.length > 0
                            ? historicalMonthly.reduce((s, m) => s + m.net, 0) / historicalMonthly.length
                            : 0;
                        return (
                            <div className={`text-xl font-bold tabular-nums ${avg >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {formatVND(avg)}
                            </div>
                        );
                    })()}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Du bao da luu</div>
                    <div className="text-xl font-bold text-slate-900">{forecasts.length}</div>
                </div>
            </div>

            {/* Saved forecasts switcher */}
            {forecasts.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500">Du bao:</span>
                    {forecasts.map(f => {
                        const sc = SCENARIO_CONFIG[f.scenario as ForecastScenario] || SCENARIO_CONFIG.base;
                        const isActive = f.id === activeForecast?.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => fos.setActiveForecastId(f.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                                    isActive
                                        ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {f.name}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${sc.bg} ${sc.color}`}>{sc.label}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Xoa du bao nay?")) fos.removeForecast(f.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 ml-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ═══ CREATE FORECAST FORM ═══ */}
            {showCreate && (
                <div className="bg-white rounded-2xl border border-cyan-200 shadow-lg p-6 space-y-5">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-cyan-600" />
                        Tao du bao dong tien
                    </h2>

                    {historicalMonthly.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Chua co du lieu dong tien. Hay nhap du lieu trong
                            <Link href="/dashboard/finance-os/cashflow" className="underline font-semibold">Dong tien</Link>
                            truoc.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Ten du bao</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="VD: Du bao Q3-Q4 2026"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">So thang du bao</label>
                                    <select
                                        value={form.forecastMonths}
                                        onChange={e => setForm(p => ({ ...p, forecastMonths: Number(e.target.value) }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        <option value={3}>3 thang</option>
                                        <option value={6}>6 thang</option>
                                        <option value={9}>9 thang</option>
                                        <option value={12}>12 thang</option>
                                    </select>
                                </div>
                            </div>

                            {/* Scenario buttons */}
                            <div>
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Kich ban</label>
                                <div className="flex gap-2">
                                    {(["base", "optimistic", "pessimistic"] as ForecastScenario[]).map(s => {
                                        const sc = SCENARIO_CONFIG[s];
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => setForm(p => ({ ...p, scenario: s }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                                                    form.scenario === s
                                                        ? `${sc.bg} ${sc.color} border-current`
                                                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                                }`}
                                            >
                                                {sc.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Nganh nghe</label>
                                    <select
                                        value={form.industry}
                                        onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                    >
                                        <option value="">Chon nganh...</option>
                                        <option value="F&B">F&B</option>
                                        <option value="Retail">Ban le</option>
                                        <option value="E-commerce">TMDT</option>
                                        <option value="SaaS">SaaS</option>
                                        <option value="Education">Giao duc</option>
                                        <option value="Healthcare">Y te</option>
                                        <option value="Manufacturing">San xuat</option>
                                        <option value="Services">Dich vu</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Boi canh (tuy chon)</label>
                                    <input
                                        value={form.context}
                                        onChange={e => setForm(p => ({ ...p, context: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                                        placeholder="VD: Dang mo rong, mua cao diem..."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition disabled:opacity-50"
                                >
                                    {generating ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> AI dang du bao...</>
                                    ) : (
                                        <><LineChartIcon className="w-4 h-4" /> Tao du bao</>
                                    )}
                                </button>
                                <button
                                    onClick={() => { setShowCreate(false); setAiResult(null); }}
                                    className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200"
                                >
                                    Huy
                                </button>
                            </div>

                            {/* AI Preview */}
                            {aiResult && (
                                <div className="space-y-4 border-t border-slate-200 pt-5">
                                    <div className="bg-cyan-50 rounded-xl p-4">
                                        <h3 className="text-sm font-bold text-cyan-900 mb-2">AI Summary</h3>
                                        <p className="text-xs text-cyan-800">{aiResult.summary}</p>
                                    </div>

                                    {aiResult.insights && aiResult.insights.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {aiResult.insights.map((insight, i) => (
                                                <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-800 flex items-start gap-2">
                                                    <CheckCircle className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                                                    {insight}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Preview chart */}
                                    {previewChartData.length > 0 && (
                                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                                            <ResponsiveContainer width="100%" height={200}>
                                                <ComposedChart data={previewChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
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
                                                    <Bar dataKey="Lich su" fill="#94a3b8" />
                                                    <Bar dataKey="Du bao" fill="#06b6d4" />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {/* Preview table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 uppercase">
                                                    <th className="text-left px-3 py-2">Thang</th>
                                                    <th className="text-right px-3 py-2">Doanh thu</th>
                                                    <th className="text-right px-3 py-2">Chi phi</th>
                                                    <th className="text-right px-3 py-2">Net</th>
                                                    <th className="text-right px-3 py-2">Do tin cay</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {aiResult.monthly_data.map(m => (
                                                    <tr key={m.month}>
                                                        <td className="px-3 py-2 font-semibold">{m.month}</td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-blue-600">{formatVND(m.revenue)}</td>
                                                        <td className="px-3 py-2 text-right tabular-nums text-red-600">{formatVND(m.expense)}</td>
                                                        <td className={`px-3 py-2 text-right tabular-nums font-semibold ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                            {formatVND(m.net)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                                m.confidence >= 0.7 ? "bg-emerald-50 text-emerald-600"
                                                                    : m.confidence >= 0.5 ? "bg-amber-50 text-amber-600"
                                                                        : "bg-red-50 text-red-600"
                                                            }`}>
                                                                {(m.confidence * 100).toFixed(0)}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Dang luu...</>
                                        ) : (
                                            <><CheckCircle className="w-4 h-4" /> Luu du bao nay</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══ ACTIVE FORECAST DISPLAY ═══ */}
            {activeForecast && (
                <>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">{activeForecast.name}</h2>
                                <p className="text-xs text-slate-500 mt-0.5">{activeForecast.ai_summary}</p>
                            </div>
                            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${SCENARIO_CONFIG[activeForecast.scenario as ForecastScenario]?.bg || ""} ${SCENARIO_CONFIG[activeForecast.scenario as ForecastScenario]?.color || ""}`}>
                                {SCENARIO_CONFIG[activeForecast.scenario as ForecastScenario]?.label || activeForecast.scenario}
                            </div>
                        </div>

                        {forecastTotals && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <div className="text-[10px] text-blue-500 font-semibold uppercase">DT Du bao</div>
                                    <div className="text-lg font-bold text-blue-700 tabular-nums">{formatVND(forecastTotals.totalRev)}</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3">
                                    <div className="text-[10px] text-red-500 font-semibold uppercase">CP Du bao</div>
                                    <div className="text-lg font-bold text-red-700 tabular-nums">{formatVND(forecastTotals.totalExp)}</div>
                                </div>
                                <div className={`rounded-xl p-3 ${forecastTotals.net >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Net Du bao</div>
                                    <div className={`text-lg font-bold tabular-nums ${forecastTotals.net >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                        {formatVND(forecastTotals.net)}
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-xl p-3">
                                    <div className="text-[10px] text-purple-500 font-semibold uppercase">Do tin cay TB</div>
                                    <div className="text-lg font-bold text-purple-700 tabular-nums">
                                        {(forecastTotals.avgConfidence * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Combined chart: historical + forecast */}
                    {combinedChartData.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Lich su & Du bao</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={combinedChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => {
                                        if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
                                        if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
                                        return v.toString();
                                    }} />
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(v: any, name: any) => v != null ? [formatVND(Number(v)), name] : ["-", name]}
                                    />
                                    <Legend />
                                    <Bar dataKey="DT Thuc te" fill="#94a3b8" />
                                    <Bar dataKey="DT Du bao" fill="#06b6d4" />
                                    <Line type="monotone" dataKey="CP Thuc te" stroke="#ef4444" strokeWidth={1.5} dot={false} connectNulls={false} />
                                    <Line type="monotone" dataKey="CP Du bao" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Confidence area chart */}
                    {activeForecast.monthly_data.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Net cash flow du bao & Do tin cay</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={activeForecast.monthly_data.map(m => ({
                                    month: m.month.slice(5),
                                    net: m.net,
                                    confidence: m.confidence * 100,
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        formatter={(v: any, name: any) => name === "confidence" ? [`${Number(v).toFixed(0)}%`, "Do tin cay"] : [formatVND(Number(v) || 0), "Net"]}
                                    />
                                    <Area type="monotone" dataKey="net" fill="#06b6d4" fillOpacity={0.15} stroke="#06b6d4" strokeWidth={2} />
                                    <Area type="monotone" dataKey="confidence" fill="#8b5cf6" fillOpacity={0.1} stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 4" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Detailed table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="text-left px-4 py-3 font-semibold">Thang</th>
                                    <th className="text-right px-4 py-3 font-semibold">Doanh thu</th>
                                    <th className="text-right px-4 py-3 font-semibold">Chi phi</th>
                                    <th className="text-right px-4 py-3 font-semibold">Net</th>
                                    <th className="text-right px-4 py-3 font-semibold">Do tin cay</th>
                                    <th className="text-center px-4 py-3 font-semibold">Xu huong</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeForecast.monthly_data.map((m, i) => {
                                    const prevNet = i > 0 ? activeForecast.monthly_data[i - 1].net : m.net;
                                    const trend = m.net > prevNet ? "up" : m.net < prevNet ? "down" : "flat";
                                    return (
                                        <tr key={m.month} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-semibold text-slate-800">{m.month}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(m.revenue)}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatVND(m.expense)}</td>
                                            <td className={`px-4 py-3 text-right tabular-nums font-semibold ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                {formatVND(m.net)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                    m.confidence >= 0.7 ? "bg-emerald-50 text-emerald-600"
                                                        : m.confidence >= 0.5 ? "bg-amber-50 text-amber-600"
                                                            : "bg-red-50 text-red-600"
                                                }`}>
                                                    {(m.confidence * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {trend === "up" && <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto" />}
                                                {trend === "down" && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                                                {trend === "flat" && <Activity className="w-4 h-4 text-slate-400 mx-auto" />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Assumptions */}
                    {activeForecast.assumptions && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-slate-700 mb-3">Gia dinh du bao</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Tang truong:</span>{" "}
                                    <span className="font-semibold">{typeof activeForecast.assumptions.growth_rate === "number" ? activeForecast.assumptions.growth_rate.toFixed(1) : 0}%</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">So thang:</span>{" "}
                                    <span className="font-semibold">{activeForecast.forecast_months}</span>
                                </div>
                            </div>
                            {activeForecast.assumptions.notes && (
                                <p className="text-xs text-slate-600 mt-3 bg-slate-50 rounded-lg px-3 py-2">{activeForecast.assumptions.notes}</p>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Empty state */}
            {forecasts.length === 0 && !showCreate && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <LineChartIcon className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Chua co du bao nao</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                        AI se phan tich du lieu dong tien lich su va du bao doanh thu, chi phi cho cac thang tiep theo.
                        Ho tro 3 kich ban: Co so, Lac quan, Than trong.
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition"
                    >
                        <LineChartIcon className="w-5 h-5" /> Tao du bao dau tien
                    </button>
                </div>
            )}
        </div>
    );
}
