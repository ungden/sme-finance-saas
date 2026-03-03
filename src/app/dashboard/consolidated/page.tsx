"use client";

import React from "react";
import { BarChart3, TrendingUp, DollarSign, Building2 } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function ConsolidatedPage() {
    const { branches, formatVND, isLoaded } = useWorkspace();

    if (!isLoaded) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full border-b-2 border-blue-600 h-8 w-8"></div></div>;

    if (branches.length === 0) {
        return <div className="p-8 text-slate-500">Chưa có chi nhánh nào. Tạo chi nhánh đầu tiên trong Sidebar.</div>;
    }

    // Aggregate all branches
    const consolidatedYears = new Map<number, {
        revenue: number; cogs: number; operatingExpenses: number; depreciation: number;
        interestExpense: number; taxes: number; cash: number; totalEmployees: number; totalFacilities: number;
    }>();

    branches.forEach(branch => {
        branch.years_data.forEach(y => {
            const existing = consolidatedYears.get(y.year) || {
                revenue: 0, cogs: 0, operatingExpenses: 0, depreciation: 0,
                interestExpense: 0, taxes: 0, cash: 0, totalEmployees: 0, totalFacilities: 0,
            };
            consolidatedYears.set(y.year, {
                revenue: existing.revenue + y.revenue,
                cogs: existing.cogs + y.cogs,
                operatingExpenses: existing.operatingExpenses + y.operatingExpenses,
                depreciation: existing.depreciation + y.depreciation,
                interestExpense: existing.interestExpense + y.interestExpense,
                taxes: existing.taxes + y.taxes,
                cash: existing.cash + y.cash,
                totalEmployees: existing.totalEmployees,
                totalFacilities: existing.totalFacilities,
            });
        });
    });

    const totalEmployees = branches.reduce((sum, b) => sum + b.employees.length, 0);
    const totalFacilities = branches.reduce((sum, b) => sum + b.facilities.length, 0);

    const years = Array.from(consolidatedYears.entries()).sort((a, b) => a[0] - b[0]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                    Bảng Tổng Hợp Toàn Chuỗi
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Dữ liệu cộng gộp từ tất cả {branches.length} chi nhánh • {totalEmployees} nhân sự • {totalFacilities} mặt bằng
                </p>
            </div>

            {/* Branch Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={<Building2 className="w-5 h-5" />} label="Tổng Chi Nhánh" value={String(branches.length)} color="blue" />
                <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="Tổng Doanh Thu (Năm gần nhất)" value={years.length > 0 ? formatVND(years[years.length - 1][1].revenue) : "—"} color="emerald" />
                <SummaryCard icon={<TrendingUp className="w-5 h-5" />} label="Tổng Nhân Sự" value={String(totalEmployees)} color="indigo" />
                <SummaryCard icon={<BarChart3 className="w-5 h-5" />} label="Tổng Mặt Bằng" value={String(totalFacilities)} color="amber" />
            </div>

            {/* Consolidated P&L */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Kết quả Kinh doanh Tổng hợp (P&L)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 font-semibold">
                                <th className="text-left px-4 py-3 w-60">Khoản mục</th>
                                {years.map(([year]) => (
                                    <th key={year} className="text-right px-4 py-3 min-w-[150px]">Năm {year}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <ConsolidatedRow label="Doanh thu thuần" years={years} field="revenue" />
                            <ConsolidatedRow label="Giá vốn hàng bán" years={years} field="cogs" negative />
                            <ConsolidatedRow label="Chi phí vận hành" years={years} field="operatingExpenses" negative />
                            <ConsolidatedRow label="Khấu hao" years={years} field="depreciation" negative />
                            <ConsolidatedRow label="Chi phí lãi vay" years={years} field="interestExpense" negative />
                            <ConsolidatedRow label="Thuế TNDN" years={years} field="taxes" negative />
                            {/* Net Income */}
                            <tr className="bg-blue-50 font-bold">
                                <td className="px-4 py-3 text-blue-800">Lợi nhuận ròng</td>
                                {years.map(([year, data]) => {
                                    const net = data.revenue - data.cogs - data.operatingExpenses - data.depreciation - data.interestExpense - data.taxes;
                                    return (
                                        <td key={year} className={`text-right px-4 py-3 ${net >= 0 ? "text-blue-700" : "text-red-600"}`}>
                                            {net >= 0 ? "" : "-"}{new Intl.NumberFormat("vi-VN").format(Math.abs(net))}
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Branch-by-Branch Comparison */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">So sánh Chi nhánh (Năm gần nhất)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 font-semibold">
                                <th className="text-left px-4 py-3">Chi nhánh</th>
                                <th className="text-right px-4 py-3">Doanh thu</th>
                                <th className="text-right px-4 py-3">COGS</th>
                                <th className="text-right px-4 py-3">OPEX</th>
                                <th className="text-right px-4 py-3">LN Ròng</th>
                                <th className="text-center px-4 py-3">Nhân sự</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {branches.map(branch => {
                                const latestYear = branch.years_data.length > 0
                                    ? branch.years_data[branch.years_data.length - 1]
                                    : null;
                                const net = latestYear
                                    ? latestYear.revenue - latestYear.cogs - latestYear.operatingExpenses - latestYear.depreciation - latestYear.interestExpense - latestYear.taxes
                                    : 0;
                                return (
                                    <tr key={branch.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{branch.name}</td>
                                        <td className="px-4 py-3 text-right text-slate-700">{latestYear ? formatVND(latestYear.revenue) : "—"}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{latestYear ? formatVND(latestYear.cogs) : "—"}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{latestYear ? formatVND(latestYear.operatingExpenses) : "—"}</td>
                                        <td className={`px-4 py-3 text-right font-bold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatVND(net)}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{branch.employees.length}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };
    return (
        <div className={`p-4 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">{icon}</div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
                <p className="text-xl font-black mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function ConsolidatedRow({ label, years, field, negative }: {
    label: string,
    years: [number, Record<string, number>][],
    field: string,
    negative?: boolean,
}) {
    return (
        <tr className="hover:bg-slate-50">
            <td className="px-4 py-2.5 font-medium text-slate-700">{label}</td>
            {years.map(([year, data]) => {
                const val = (data as Record<string, number>)[field] || 0;
                return (
                    <td key={year} className={`text-right px-4 py-2.5 tabular-nums ${negative ? "text-red-600" : "text-slate-800"}`}>
                        {negative && val > 0 ? "-" : ""}{new Intl.NumberFormat("vi-VN").format(Math.abs(val))}
                    </td>
                );
            })}
        </tr>
    );
}
