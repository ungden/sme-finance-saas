"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
    ArrowLeft, FileDown, FileSpreadsheet, Printer, Download,
    TrendingUp, Activity, DollarSign,
    Building2, Users, BarChart3, Target,
} from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import { ALLOCATION_CATEGORY_LABELS } from "@/lib/types";
import type { AllocationCategory } from "@/lib/types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";

type ReportType = "overview" | "allocation" | "departments" | "cashflow" | "planvsactual";

const REPORT_TABS: { key: ReportType; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Tổng quan", icon: BarChart3 },
    { key: "allocation", label: "Phân bổ DT", icon: Target },
    { key: "departments", label: "Phòng ban", icon: Building2 },
    { key: "cashflow", label: "Dòng tiền", icon: Activity },
    { key: "planvsactual", label: "Plan vs Actual", icon: TrendingUp },
];

const PIE_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];

function generateCSV(headers: string[], rows: string[][]): string {
    const escape = (v: string) => {
        if (v.includes(",") || v.includes('"') || v.includes("\n")) {
            return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
    };
    const lines = [headers.map(escape).join(",")];
    rows.forEach(row => lines.push(row.map(escape).join(",")));
    return "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
}

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export default function ReportsPage() {
    const fos = useFinanceOS();
    const {
        monthlyRevenue, allocations, departmentBudgets, channelBudgets,
        cashflowSummary, dailyCashflow, totalAllocPercent,
        activePlan, activePlanTargets, planVsActual,
        employees, departments, marketingChannels,
        formatVND, isLoaded, payrollPool, marketingPool,
    } = fos;

    const [activeReport, setActiveReport] = useState<ReportType>("overview");
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const printRef = useRef<HTMLDivElement>(null);

    // ── Export Helpers ──

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleExportPDF = useCallback(async () => {
        if (!printRef.current) return;
        try {
            const html2canvas = (await import("html2canvas")).default;
            const jsPDF = (await import("jspdf")).default;

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position -= pdf.internal.pageSize.getHeight();
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            const dateStr = new Date().toISOString().slice(0, 10);
            pdf.save(`RealProfit_${activeReport}_${dateStr}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            alert("Xuất PDF thất bại. Vui lòng thử lại.");
        }
    }, [activeReport]);

    const handleExportCSV = useCallback(() => {
        const dateStr = new Date().toISOString().slice(0, 10);

        if (activeReport === "overview") {
            const headers = ["Chỉ số", "Giá trị"];
            const rows = [
                ["Doanh thu tháng", monthlyRevenue.toString()],
                ["Tổng phân bổ %", totalAllocPercent.toFixed(1) + "%"],
                ...allocations.map(a => [
                    ALLOCATION_CATEGORY_LABELS[a.category],
                    `${a.percent}% = ${a.amount}`,
                ]),
                ["Payroll Pool", payrollPool.toString()],
                ["Marketing Pool", marketingPool.toString()],
                ["Net Cash Flow", cashflowSummary.netFlow.toString()],
                ["Cash Runway", cashflowSummary.cashRunway === Infinity ? "An toàn" : `${Math.round(cashflowSummary.cashRunway)} ngày`],
            ];
            downloadFile(generateCSV(headers, rows), `RealProfit_TongQuan_${dateStr}.csv`, "text/csv;charset=utf-8");
        }

        if (activeReport === "allocation") {
            const headers = ["Hạng mục", "Tỷ lệ (%)", "Số tiền (VND)"];
            const rows = allocations.map(a => [
                ALLOCATION_CATEGORY_LABELS[a.category],
                a.percent.toString(),
                a.amount.toString(),
            ]);
            rows.push(["TONG", totalAllocPercent.toFixed(1), monthlyRevenue.toString()]);
            downloadFile(generateCSV(headers, rows), `RealProfit_PhanBo_${dateStr}.csv`, "text/csv;charset=utf-8");
        }

        if (activeReport === "departments") {
            const headers = ["Phòng ban", "% Payroll", "Budget (VND)", "Lương", "Thưởng", "Đã dùng", "Còn lại", "Trạng thái"];
            const rows = departmentBudgets.map(db => [
                db.department.name,
                db.department.payroll_percent.toString(),
                db.budget.toString(),
                db.totalSalary.toString(),
                db.totalBonus.toString(),
                db.totalUsed.toString(),
                db.remaining.toString(),
                db.remaining >= 0 ? "OK" : "Vượt budget",
            ]);
            // Add employee details
            const empHeaders = ["Nhân viên", "Phòng ban", "Vị trí", "Lương cơ bản", "Thưởng"];
            const empRows = employees.map(e => {
                const dept = departments.find(d => d.id === e.department_id);
                return [e.employee_name, dept?.name || "", e.role, e.base_salary.toString(), e.bonus.toString()];
            });
            const combined = generateCSV(headers, rows) + "\n\n" + generateCSV(empHeaders, empRows);
            downloadFile(combined, `RealProfit_PhongBan_${dateStr}.csv`, "text/csv;charset=utf-8");
        }

        if (activeReport === "cashflow") {
            const filtered = dailyCashflow
                .filter(cf => cf.date.startsWith(filterMonth))
                .sort((a, b) => a.date.localeCompare(b.date));
            const headers = ["Ngày", "Thu (VND)", "Chi (VND)", "Net (VND)", "Nguồn", "Ghi chú"];
            const rows = filtered.map(cf => [
                cf.date,
                cf.revenue.toString(),
                cf.expense.toString(),
                (cf.revenue - cf.expense).toString(),
                cf.source === "manual" ? "Nhập tay" : "Từ hóa đơn",
                cf.notes,
            ]);
            const totalRev = filtered.reduce((s, cf) => s + cf.revenue, 0);
            const totalExp = filtered.reduce((s, cf) => s + cf.expense, 0);
            rows.push(["TONG", totalRev.toString(), totalExp.toString(), (totalRev - totalExp).toString(), "", ""]);
            downloadFile(generateCSV(headers, rows), `RealProfit_DongTien_${filterMonth}_${dateStr}.csv`, "text/csv;charset=utf-8");
        }

        if (activeReport === "planvsactual") {
            if (planVsActual.length === 0) return;
            const headers = ["Tháng", "KH Doanh thu", "Thực tế DT", "Chênh lệch", "% Chênh lệch", "KH COGS", "KH MKT", "KH Ops", "KH Payroll", "KH Profit"];
            const rows = planVsActual.map(m => [
                `Tháng ${m.month}`,
                m.planned.revenue.toString(),
                m.actual.revenue.toString(),
                m.variance.toString(),
                m.variancePercent.toFixed(1) + "%",
                m.planned.cogs.toString(),
                m.planned.marketing.toString(),
                m.planned.operations.toString(),
                m.planned.payroll.toString(),
                m.planned.profit.toString(),
            ]);
            downloadFile(generateCSV(headers, rows), `RealProfit_PlanVsActual_${dateStr}.csv`, "text/csv;charset=utf-8");
        }
    }, [activeReport, monthlyRevenue, allocations, totalAllocPercent, payrollPool, marketingPool,
        cashflowSummary, departmentBudgets, employees, departments, dailyCashflow, filterMonth,
        planVsActual]);

    // ── Report Data ──

    const pieData = useMemo(() => {
        return allocations.map(a => ({
            name: ALLOCATION_CATEGORY_LABELS[a.category],
            value: a.amount,
            percent: a.percent,
        }));
    }, [allocations]);

    const cashflowMonthly = useMemo(() => {
        const map = new Map<string, { month: string; revenue: number; expense: number; net: number }>();
        dailyCashflow.forEach(cf => {
            const m = cf.date.slice(0, 7);
            const existing = map.get(m) || { month: m, revenue: 0, expense: 0, net: 0 };
            existing.revenue += cf.revenue;
            existing.expense += cf.expense;
            existing.net = existing.revenue - existing.expense;
            map.set(m, existing);
        });
        return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    }, [dailyCashflow]);

    const planChartData = useMemo(() => {
        return planVsActual.map(m => ({
            name: m.monthLabel,
            "KH Doanh thu": m.planned.revenue,
            "Thực tế": m.actual.revenue,
            "KH Profit": m.planned.profit,
        }));
    }, [planVsActual]);

    if (!isLoaded) return null;

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 print:hidden">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileDown className="w-5 h-5 text-indigo-600" />
                        Báo cáo & Xuất dữ liệu
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Xuất PDF, CSV cho từng module Finance OS
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-600 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition"
                    >
                        <Printer className="w-4 h-4" /> In
                    </button>
                </div>
            </div>

            {/* Report tabs */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
                {REPORT_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveReport(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                            activeReport === tab.key
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Printable content */}
            <div ref={printRef}>
                {/* Print header (only shows on print) */}
                <div className="hidden print:block mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">RealProfit - Báo cáo tài chính</h1>
                    <p className="text-sm text-slate-500">Ngày xuất: {new Date().toLocaleDateString("vi-VN")}</p>
                </div>

                {/* ═══ OVERVIEW REPORT ═══ */}
                {activeReport === "overview" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900">Báo cáo Tổng quan</h2>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Doanh thu tháng</span>
                                    <DollarSign className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-xl font-bold text-slate-900 tabular-nums">{formatVND(monthlyRevenue)}</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Net Cash Flow</span>
                                    <Activity className="w-4 h-4 text-green-500" />
                                </div>
                                <div className={`text-xl font-bold tabular-nums ${cashflowSummary.netFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatVND(cashflowSummary.netFlow)}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Phòng ban</span>
                                    <Building2 className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="text-xl font-bold text-slate-900">{departments.length}</div>
                                <div className="text-xs text-slate-400">{employees.length} nhân viên</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Kênh MKT</span>
                                    <Users className="w-4 h-4 text-amber-500" />
                                </div>
                                <div className="text-xl font-bold text-slate-900">{marketingChannels.length}</div>
                                <div className="text-xs text-slate-400">Budget: {formatVND(marketingPool)}</div>
                            </div>
                        </div>

                        {/* Allocation Summary */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4">Phân bổ doanh thu</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    {allocations.map(a => (
                                        <div key={a.category} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[["cogs", "marketing", "operations", "payroll", "profit"].indexOf(a.category)] }} />
                                                <span className="text-slate-700">{ALLOCATION_CATEGORY_LABELS[a.category]}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-slate-500 tabular-nums">{a.percent}%</span>
                                                <span className="font-semibold text-slate-900 tabular-nums">{formatVND(a.amount)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-px bg-slate-200 my-2" />
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-slate-900">Tổng cộng</span>
                                        <span className="text-slate-900">{totalAllocPercent.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div className="print:hidden">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                innerRadius={40}
                                                dataKey="value"
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                label={({ name, percent }: any) => `${(name || "").split(" ")[0]} ${percent}%`}
                                                labelLine={false}
                                            >
                                                {pieData.map((_entry, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                formatter={(v: any) => formatVND(Number(v) || 0)}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Department summary */}
                        {departmentBudgets.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-700">Tổng hợp phòng ban</h3>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                             <th className="text-left px-5 py-3 font-semibold">Phòng ban</th>
                                            <th className="text-right px-5 py-3 font-semibold">NV</th>
                                            <th className="text-right px-5 py-3 font-semibold">Budget</th>
                                             <th className="text-right px-5 py-3 font-semibold">Đã dùng</th>
                                             <th className="text-right px-5 py-3 font-semibold">Còn lại</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {departmentBudgets.map(db => (
                                            <tr key={db.department.id}>
                                                <td className="px-5 py-3 font-semibold text-slate-800">{db.department.name}</td>
                                                <td className="px-5 py-3 text-right text-slate-600">{db.employees.length}</td>
                                                <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.budget)}</td>
                                                <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.totalUsed)}</td>
                                                <td className={`px-5 py-3 text-right tabular-nums font-semibold ${db.remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                    {formatVND(Math.abs(db.remaining))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ ALLOCATION REPORT ═══ */}
                {activeReport === "allocation" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900">Báo cáo Phân bổ Doanh thu</h2>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="text-center mb-6">
                                <div className="text-xs text-slate-500 mb-1">Doanh thu tháng hiện tại</div>
                                <div className="text-3xl font-bold text-blue-600 tabular-nums">{formatVND(monthlyRevenue)}</div>
                            </div>

                            <div className="space-y-4">
                                {allocations.map(a => {
                                    const cats: AllocationCategory[] = ["cogs", "marketing", "operations", "payroll", "profit"];
                                    const colorIdx = cats.indexOf(a.category);
                                    return (
                                        <div key={a.category} className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: PIE_COLORS[colorIdx] }} />
                                                    <span className="font-semibold text-sm text-slate-800">{ALLOCATION_CATEGORY_LABELS[a.category]}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-slate-900 tabular-nums">{formatVND(a.amount)}</span>
                                                    <span className="text-xs text-slate-500 ml-2">({a.percent}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(100, a.percent)}%`,
                                                        backgroundColor: PIE_COLORS[colorIdx],
                                                    }}
                                                />
                                            </div>

                                            {/* Sub-details for payroll & marketing */}
                                            {a.category === "payroll" && departmentBudgets.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {departmentBudgets.map(db => (
                                                        <div key={db.department.id} className="flex items-center justify-between text-xs text-slate-600">
                                                            <span>{db.department.name} ({db.department.payroll_percent}%)</span>
                                                            <span className="tabular-nums">{formatVND(db.budget)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {a.category === "marketing" && channelBudgets.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {channelBudgets.map(cb => (
                                                        <div key={cb.channel.id} className="flex items-center justify-between text-xs text-slate-600">
                                                            <span>{cb.channel.name} ({cb.channel.percent}%)</span>
                                                            <span className="tabular-nums">{formatVND(cb.budget)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ DEPARTMENTS REPORT ═══ */}
                {activeReport === "departments" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900">Báo cáo Phòng ban & Nhân sự</h2>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                                <div className="text-xs text-slate-500 mb-1">Payroll Pool</div>
                                <div className="text-xl font-bold text-purple-600 tabular-nums">{formatVND(payrollPool)}</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                                <div className="text-xs text-slate-500 mb-1">Tổng Phòng ban</div>
                                <div className="text-xl font-bold text-slate-900">{departments.length}</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                                <div className="text-xs text-slate-500 mb-1">Tổng Nhân viên</div>
                                <div className="text-xl font-bold text-slate-900">{employees.length}</div>
                            </div>
                        </div>

                        {departmentBudgets.map(db => (
                            <div key={db.department.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{db.department.name}</h3>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {db.department.payroll_percent}% Payroll Pool = {formatVND(db.budget)}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${db.remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                            Còn lại: {db.remaining >= 0 ? "" : "-"}{formatVND(Math.abs(db.remaining))}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Đã dùng: {formatVND(db.totalUsed)} / {formatVND(db.budget)}
                                        </div>
                                    </div>
                                </div>

                                {db.employees.length > 0 ? (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                                                <th className="text-left px-5 py-2 font-semibold">Nhân viên</th>
                                                <th className="text-left px-5 py-2 font-semibold">Vị trí</th>
                                                <th className="text-right px-5 py-2 font-semibold">Lương</th>
                                                <th className="text-right px-5 py-2 font-semibold">Thưởng</th>
                                                <th className="text-right px-5 py-2 font-semibold">Tổng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {db.employees.map(emp => (
                                                <tr key={emp.id}>
                                                    <td className="px-5 py-2.5 font-medium text-slate-800">{emp.employee_name}</td>
                                                    <td className="px-5 py-2.5 text-slate-500">{emp.role}</td>
                                                    <td className="px-5 py-2.5 text-right tabular-nums">{formatVND(emp.base_salary)}</td>
                                                    <td className="px-5 py-2.5 text-right tabular-nums">{formatVND(emp.bonus)}</td>
                                                    <td className="px-5 py-2.5 text-right tabular-nums font-semibold">{formatVND(emp.base_salary + emp.bonus)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="px-5 py-4 text-xs text-slate-400">Chưa có nhân viên</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ═══ CASHFLOW REPORT ═══ */}
                {activeReport === "cashflow" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Báo cáo Dòng tiền</h2>
                            <div className="flex items-center gap-3 print:hidden">
                                <label className="text-xs font-semibold text-slate-500">Tháng:</label>
                                <input
                                    type="month"
                                    value={filterMonth}
                                    onChange={e => setFilterMonth(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="text-xs text-slate-500 mb-1">Tổng Thu</div>
                                <div className="text-xl font-bold text-emerald-600 tabular-nums">{formatVND(cashflowSummary.totalRevenue)}</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="text-xs text-slate-500 mb-1">Tổng Chi</div>
                                <div className="text-xl font-bold text-red-600 tabular-nums">{formatVND(cashflowSummary.totalExpense)}</div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="text-xs text-slate-500 mb-1">Net Cash Flow</div>
                                <div className={`text-xl font-bold tabular-nums ${cashflowSummary.netFlow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                    {formatVND(cashflowSummary.netFlow)}
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <div className="text-xs text-slate-500 mb-1">Số ngày dữ liệu</div>
                                <div className="text-xl font-bold text-slate-900">{cashflowSummary.daysWithData}</div>
                            </div>
                        </div>

                        {/* Monthly trend chart */}
                        {cashflowMonthly.length > 1 && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:hidden">
                                <h3 className="text-sm font-bold text-slate-700 mb-4">Xu hướng dòng tiền theo tháng</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={cashflowMonthly}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
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
                                        <Bar dataKey="revenue" fill="#10b981" name="Thu" />
                                        <Bar dataKey="expense" fill="#ef4444" name="Chi" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                         <th className="text-left px-5 py-3 font-semibold">Ngày</th>
                                        <th className="text-right px-5 py-3 font-semibold">Thu</th>
                                        <th className="text-right px-5 py-3 font-semibold">Chi</th>
                                        <th className="text-right px-5 py-3 font-semibold">Net</th>
                                        <th className="text-left px-5 py-3 font-semibold">Ghi chu</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {dailyCashflow
                                        .filter(cf => cf.date.startsWith(filterMonth))
                                        .sort((a, b) => a.date.localeCompare(b.date))
                                        .map(cf => {
                                            const net = cf.revenue - cf.expense;
                                            return (
                                                <tr key={cf.id}>
                                                    <td className="px-5 py-2.5 font-medium text-slate-700">{cf.date}</td>
                                                    <td className="px-5 py-2.5 text-right tabular-nums text-emerald-600">{formatVND(cf.revenue)}</td>
                                                    <td className="px-5 py-2.5 text-right tabular-nums text-red-600">{formatVND(cf.expense)}</td>
                                                    <td className={`px-5 py-2.5 text-right tabular-nums font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {formatVND(Math.abs(net))}
                                                    </td>
                                                    <td className="px-5 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{cf.notes}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══ PLAN VS ACTUAL REPORT ═══ */}
                {activeReport === "planvsactual" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-900">Báo cáo Plan vs Actual</h2>

                        {!activePlan || planVsActual.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                                Chưa có kế hoạch nào. Tạo kế hoạch trong
                                <Link href="/dashboard/finance-os/plan" className="text-blue-600 underline ml-1">AI Planner</Link>
                            </div>
                        ) : (
                            <>
                                {/* Plan info */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                    <h3 className="font-bold text-slate-900">{activePlan.name} ({activePlan.year})</h3>
                                    <p className="text-xs text-slate-500 mt-1">{activePlan.ai_summary}</p>
                                    <div className="grid grid-cols-4 gap-3 mt-4">
                                        <div className="bg-blue-50 rounded-xl p-3">
                                            <div className="text-[10px] text-blue-500 font-semibold">KH Doanh thu</div>
                                            <div className="text-lg font-bold text-blue-700 tabular-nums">
                                                {formatVND(activePlanTargets.reduce((s, t) => s + t.revenue, 0))}
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-3">
                                            <div className="text-[10px] text-emerald-500 font-semibold">KH Lợi nhuận</div>
                                            <div className="text-lg font-bold text-emerald-700 tabular-nums">
                                                {formatVND(activePlanTargets.reduce((s, t) => s + t.profit, 0))}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 rounded-xl p-3">
                                            <div className="text-[10px] text-purple-500 font-semibold">Thực tế DT</div>
                                            <div className="text-lg font-bold text-purple-700 tabular-nums">
                                                {formatVND(planVsActual.reduce((s, m) => s + m.actual.revenue, 0))}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-3">
                                            <div className="text-[10px] text-slate-500 font-semibold">Thực tế CP</div>
                                            <div className="text-lg font-bold text-slate-700 tabular-nums">
                                                {formatVND(planVsActual.reduce((s, m) => s + m.actual.expense, 0))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart */}
                                {planChartData.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:hidden">
                                        <h3 className="text-sm font-bold text-slate-700 mb-4">Biểu đồ Plan vs Actual</h3>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={planChartData}>
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
                                                <Bar dataKey="KH Doanh thu" fill="#93c5fd" />
                                                <Bar dataKey="Thực tế" fill="#3b82f6" />
                                                <Bar dataKey="KH Profit" fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                {/* Detailed table */}
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                                 <th className="text-left px-4 py-3 font-semibold">Tháng</th>
                                                <th className="text-right px-4 py-3 font-semibold">KH DT</th>
                                                 <th className="text-right px-4 py-3 font-semibold">Thực tế</th>
                                                 <th className="text-right px-4 py-3 font-semibold">Chênh lệch</th>
                                                <th className="text-right px-4 py-3 font-semibold">%</th>
                                                <th className="text-right px-4 py-3 font-semibold">KH COGS</th>
                                                <th className="text-right px-4 py-3 font-semibold">KH MKT</th>
                                                <th className="text-right px-4 py-3 font-semibold">KH Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {planVsActual.map(m => (
                                                <tr key={m.month}>
                                                    <td className="px-4 py-2.5 font-semibold text-slate-800">T{m.month}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-blue-600">{formatVND(m.planned.revenue)}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums">{formatVND(m.actual.revenue)}</td>
                                                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${m.variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {m.variance >= 0 ? "+" : ""}{formatVND(m.variance)}
                                                    </td>
                                                    <td className={`px-4 py-2.5 text-right tabular-nums text-xs ${m.variancePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                                        {m.variancePercent >= 0 ? "+" : ""}{m.variancePercent.toFixed(1)}%
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatVND(m.planned.cogs)}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatVND(m.planned.marketing)}</td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600">{formatVND(m.planned.profit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
