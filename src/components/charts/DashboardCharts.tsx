"use client";

import React from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line
} from "recharts";

export default function DashboardCharts({ yearsData }: { yearsData: any[] }) {
    if (!yearsData || yearsData.length === 0) return null;

    // Formatting Tooltips
    const formatBillion = (value: number) => {
        if (value === 0) return "0";
        if (Math.abs(value) >= 1_000_000_000) {
            return (value / 1_000_000_000).toFixed(1) + " Tỷ";
        }
        if (Math.abs(value) >= 1_000_000) {
            return (value / 1_000_000).toFixed(0) + " Tr";
        }
        return new Intl.NumberFormat("vi-VN").format(value);
    };

    // Chuẩn bị dữ liệu cho Chart 1: Tăng trưởng & Khả năng sinh lời (P&L Trend)
    const plData = yearsData.map(y => ({
        name: `Năm ${y.year}`,
        Revenue: y.revenue,
        COGS: Math.abs(y.cogs),
        NetIncome: y._calculated.netIncome
    }));

    // Chuẩn bị dữ liệu cho Chart 2: Cấu trúc Chi phí Vận hành (Opex Breakdown)
    const costData = yearsData.map(y => ({
        name: `Năm ${y.year}`,
        OPEX: Math.abs(y.operatingExpenses),
        KhauHao: Math.abs(y.depreciation),
        LaiVay: Math.abs(y.interestExpense),
    }));

    // Chuẩn bị dữ liệu cho Chart 3: Lưu chuyển tiền tệ (Cash Flows)
    const cfData = yearsData.map(y => ({
        name: `Năm ${y.year}`,
        OpsCF: y._calculated.opsCF,
        InvCF: y._calculated.invCF,
        FinCF: y._calculated.finCF,
        NetCash: y._calculated.netCashFlow
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* CHART 1: LNTT & DOANH THU */}
            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-2">Tăng trưởng Doanh thu & Lợi nhuận</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={plData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <YAxis yAxisId="left" tickFormatter={formatBillion} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={formatBillion} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <Tooltip formatter={(value: number | string | undefined) => [new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ"]} cursor={{ fill: "#f1f5f9" }} />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                            <Bar yAxisId="left" dataKey="Revenue" name="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                            <Line yAxisId="right" type="monotone" dataKey="NetIncome" name="Lợi nhuận ròng" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 3: DÒNG TIỀN (CASH FLOW) */}
            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 px-2">Cấu trúc Dòng tiền Cơ sở</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cfData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <YAxis tickFormatter={formatBillion} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                            <Tooltip formatter={(value: number | string | undefined) => [new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ"]} cursor={{ fill: "#f1f5f9" }} />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                            <Bar dataKey="OpsCF" name="HĐ Kinh doanh" fill="#14b8a6" stackId="a" />
                            <Bar dataKey="InvCF" name="HĐ Đầu tư" fill="#f59e0b" stackId="a" />
                            <Bar dataKey="FinCF" name="HĐ Tài chính" fill="#8b5cf6" stackId="a" />
                            <Line type="step" dataKey="NetCash" name="Lưu chuyển thuần" stroke="#0f172a" strokeWidth={2} dot={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
}
