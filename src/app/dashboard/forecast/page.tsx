"use client";

import React, { useMemo } from "react";
import { BrainCircuit, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { generateForecast } from "@/utils/ai-insights";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const INSIGHT_ICONS = {
    positive: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    negative: <AlertTriangle className="w-5 h-5 text-red-500" />,
    warning: <Lightbulb className="w-5 h-5 text-amber-500" />,
    neutral: <BrainCircuit className="w-5 h-5 text-slate-400" />,
};

const INSIGHT_COLORS = {
    positive: 'bg-emerald-50 border-emerald-200',
    negative: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    neutral: 'bg-slate-50 border-slate-200',
};

export default function ForecastPage() {
    const { yearsData, formatVND } = useFinance();

    const forecast = useMemo(() => generateForecast(yearsData), [yearsData]);

    const revenueChartData = forecast.revenue.map((r, i) => ({
        year: r.year,
        'Thực tế': r.actual,
        'Dự báo': !r.actual ? r.forecast : undefined,
        'Xu hướng': r.forecast,
        'Khoảng tin cậy': [r.lower, r.upper],
        lower: r.lower,
        upper: r.upper,
        isForecast: !r.actual,
    }));

    const netIncomeChartData = forecast.netIncome.map(r => ({
        year: r.year,
        'Thực tế': r.actual,
        'Dự báo': !r.actual ? r.forecast : undefined,
        'Xu hướng': r.forecast,
        lower: r.lower,
        upper: r.upper,
    }));

    const formatAxis = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
        if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
        return val.toString();
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-purple-600" /> AI Forecast
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Dự báo xu hướng doanh thu, chi phí, và lợi nhuận dựa trên phân tích hồi quy tuyến tính với khoảng tin cậy 95%.
                </p>
            </div>

            {/* AI Forecast Insights */}
            {forecast.insights.length > 0 && (
                <div className="grid gap-3">
                    {forecast.insights.map((insight, i) => (
                        <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 ${INSIGHT_COLORS[insight.type]}`}>
                            <div className="mt-0.5">{INSIGHT_ICONS[insight.type]}</div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">{insight.title}</h3>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{insight.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Revenue Forecast Chart */}
            {forecast.revenue.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Dự báo Doanh thu
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(value: number | string | undefined) => formatVND(Number(value ?? 0))}
                                labelFormatter={(label) => `Năm ${label}`}
                            />
                            <Legend />
                            <Area
                                dataKey="upper" type="monotone" stroke="none" fill="#dbeafe"
                                fillOpacity={0.4} name="Biên trên (95% CI)" legendType="none"
                            />
                            <Area
                                dataKey="lower" type="monotone" stroke="none" fill="#ffffff"
                                fillOpacity={1} name="Biên dưới" legendType="none"
                            />
                            <Line
                                dataKey="Thực tế" type="monotone" stroke="#2563eb"
                                strokeWidth={3} dot={{ r: 5, fill: '#2563eb' }}
                                connectNulls={false}
                            />
                            <Line
                                dataKey="Dự báo" type="monotone" stroke="#2563eb"
                                strokeWidth={2} strokeDasharray="8 4"
                                dot={{ r: 5, fill: '#93c5fd', stroke: '#2563eb', strokeWidth: 2 }}
                                connectNulls={false}
                            />
                            <Line
                                dataKey="Xu hướng" type="monotone" stroke="#94a3b8"
                                strokeWidth={1} strokeDasharray="3 3" dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Net Income Forecast Chart */}
            {forecast.netIncome.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-emerald-600" /> Dự báo Lợi nhuận ròng
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={netIncomeChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(value: number | string | undefined) => formatVND(Number(value ?? 0))} labelFormatter={(label) => `Năm ${label}`} />
                            <Legend />
                            <Area dataKey="upper" type="monotone" stroke="none" fill="#d1fae5" fillOpacity={0.4} legendType="none" />
                            <Area dataKey="lower" type="monotone" stroke="none" fill="#ffffff" fillOpacity={1} legendType="none" />
                            <Line dataKey="Thực tế" type="monotone" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#059669' }} connectNulls={false} />
                            <Line dataKey="Dự báo" type="monotone" stroke="#059669" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 5, fill: '#a7f3d0', stroke: '#059669', strokeWidth: 2 }} connectNulls={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Forecast Data Table */}
            {forecast.revenue.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">Bảng số liệu Dự báo</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 text-slate-600 font-semibold">
                                <th className="text-left px-4 py-3">Năm</th>
                                <th className="text-right px-4 py-3">Doanh thu (Dự báo)</th>
                                <th className="text-right px-4 py-3">COGS</th>
                                <th className="text-right px-4 py-3">OPEX</th>
                                <th className="text-right px-4 py-3">LN Ròng</th>
                                <th className="text-center px-4 py-3">Loại</th>
                            </tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {forecast.revenue.map((r, i) => (
                                    <tr key={r.year} className={`hover:bg-slate-50 ${!r.actual ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-4 py-2.5 font-bold text-slate-800">{r.year}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatVND(r.actual ?? r.forecast)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-red-600">{formatVND(forecast.cogs[i]?.actual ?? forecast.cogs[i]?.forecast ?? 0)}</td>
                                        <td className="px-4 py-2.5 text-right tabular-nums text-red-600">{formatVND(forecast.opex[i]?.actual ?? forecast.opex[i]?.forecast ?? 0)}</td>
                                        <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${(forecast.netIncome[i]?.actual ?? forecast.netIncome[i]?.forecast ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatVND(forecast.netIncome[i]?.actual ?? forecast.netIncome[i]?.forecast ?? 0)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {r.actual ? <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Thực tế</span>
                                                : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Dự báo</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
