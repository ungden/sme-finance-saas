"use client";

import React, { useState } from "react";
import { Receipt, Download } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function TaxPage() {
    const { formatVND } = useFinance();
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    const invoices = (() => {
        if (typeof window === 'undefined') return [];
        return JSON.parse(localStorage.getItem('rp_invoices') || '[]');
    })();

    const yearInvoices = invoices.filter((i: any) => new Date(i.date).getFullYear() === year && i.status === 'paid');

    // VAT
    const vatOut = yearInvoices.filter((i: any) => i.type === 'income').reduce((s: number, i: any) => s + (i.amount * i.vatRate / 100), 0);
    const vatIn = yearInvoices.filter((i: any) => i.type === 'expense').reduce((s: number, i: any) => s + (i.amount * i.vatRate / 100), 0);
    const vatOwed = vatOut - vatIn;

    // Quarterly breakdown
    const quarters = [1, 2, 3, 4].map(q => {
        const qInvoices = yearInvoices.filter((i: any) => {
            const month = new Date(i.date).getMonth() + 1;
            return Math.ceil(month / 3) === q;
        });
        const qVatOut = qInvoices.filter((i: any) => i.type === 'income').reduce((s: number, i: any) => s + (i.amount * i.vatRate / 100), 0);
        const qVatIn = qInvoices.filter((i: any) => i.type === 'expense').reduce((s: number, i: any) => s + (i.amount * i.vatRate / 100), 0);
        const qRevenue = qInvoices.filter((i: any) => i.type === 'income').reduce((s: number, i: any) => s + i.amount, 0);
        const qExpense = qInvoices.filter((i: any) => i.type === 'expense').reduce((s: number, i: any) => s + i.amount, 0);
        return { q, vatOut: qVatOut, vatIn: qVatIn, vatOwed: qVatOut - qVatIn, revenue: qRevenue, expense: qExpense, count: qInvoices.length };
    });

    const totalRevenue = yearInvoices.filter((i: any) => i.type === 'income').reduce((s: number, i: any) => s + i.amount, 0);
    const totalExpense = yearInvoices.filter((i: any) => i.type === 'expense').reduce((s: number, i: any) => s + i.amount, 0);

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-teal-600" /> Thuế & VAT
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Tổng hợp thuế GTGT theo quý, xuất báo cáo thuế.</p>
                </div>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white">
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-semibold text-slate-400 uppercase">VAT Đầu ra</p><p className="text-xl font-black text-blue-600 mt-1">{formatVND(vatOut)}</p></div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-semibold text-slate-400 uppercase">VAT Đầu vào</p><p className="text-xl font-black text-emerald-600 mt-1">{formatVND(vatIn)}</p></div>
                <div className={`p-4 rounded-2xl border shadow-sm ${vatOwed > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs font-semibold uppercase opacity-60">Thuế phải nộp</p>
                    <p className={`text-xl font-black mt-1 ${vatOwed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatVND(vatOwed)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><p className="text-xs font-semibold text-slate-400 uppercase">Lợi nhuận trước thuế</p><p className="text-xl font-black text-slate-800 mt-1">{formatVND(totalRevenue - totalExpense)}</p></div>
            </div>

            {/* Quarterly Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Bảng tổng hợp VAT theo Quý — {year}</h3>
                </div>
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 text-slate-600 font-semibold">
                        <th className="text-left px-4 py-3">Quý</th>
                        <th className="text-right px-4 py-3">Doanh thu</th>
                        <th className="text-right px-4 py-3">Chi phí</th>
                        <th className="text-right px-4 py-3">VAT Đầu ra</th>
                        <th className="text-right px-4 py-3">VAT Đầu vào</th>
                        <th className="text-right px-4 py-3">Thuế phải nộp</th>
                        <th className="text-center px-4 py-3">Số HĐ</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {quarters.map(qd => (
                            <tr key={qd.q} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-bold text-slate-800">Q{qd.q}/{year}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatVND(qd.revenue)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatVND(qd.expense)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(qd.vatOut)}</td>
                                <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{formatVND(qd.vatIn)}</td>
                                <td className={`px-4 py-3 text-right tabular-nums font-bold ${qd.vatOwed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatVND(qd.vatOwed)}</td>
                                <td className="px-4 py-3 text-center text-slate-500">{qd.count}</td>
                            </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                            <td className="px-4 py-3 text-slate-800">Cả năm {year}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{formatVND(totalRevenue)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-red-600">{formatVND(totalExpense)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-blue-600">{formatVND(vatOut)}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{formatVND(vatIn)}</td>
                            <td className={`px-4 py-3 text-right tabular-nums ${vatOwed > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatVND(vatOwed)}</td>
                            <td className="px-4 py-3 text-center text-slate-500">{yearInvoices.length}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
