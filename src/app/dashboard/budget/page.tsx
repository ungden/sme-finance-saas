"use client";

import React, { useState } from "react";
import { Target, AlertTriangle } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useERP } from "@/context/ERPContext";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import type { ExpenseCategory } from "@/lib/types";

export default function BudgetPage() {
    const { formatVND } = useFinance();
    const erp = useERP();
    const { budgets, isLoaded } = erp;
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);

    const getActual = (cat: ExpenseCategory, yr: number) => {
        return erp.getActualSpend(yr, cat);
    };

    const getBudget = (cat: ExpenseCategory) => {
        return budgets.find(b => b.category === cat && b.year === year);
    };

    const updateBudget = (cat: ExpenseCategory, planned: number) => {
        erp.upsertBudget(year, cat, planned);
    };

    if (!isLoaded) return null;

    const totalPlanned = EXPENSE_CATEGORIES.reduce((s, c) => s + (getBudget(c)?.planned || 0), 0);
    const totalActual = EXPENSE_CATEGORIES.reduce((s, c) => s + getActual(c, year), 0);

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Target className="w-6 h-6 text-violet-600" /> Ngan sach vs Thuc te
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">So sanh chi phi du kien va thuc te theo danh muc.</p>
                </div>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium bg-white">
                    {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tong Ngan sach</p>
                    <p className="text-2xl font-black text-violet-600 mt-1">{formatVND(totalPlanned)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tong Thuc te</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{formatVND(totalActual)}</p>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm ${totalActual > totalPlanned && totalPlanned > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs font-semibold uppercase opacity-60">Chenh lech</p>
                    <p className={`text-2xl font-black mt-1 ${totalActual > totalPlanned && totalPlanned > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {totalPlanned > 0 ? (totalActual > totalPlanned ? '+' : '') : ''}{formatVND(totalActual - totalPlanned)}
                    </p>
                </div>
            </div>

            {/* Budget Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold">
                            <th className="text-left px-4 py-3">Danh muc Chi phi</th>
                            <th className="text-right px-4 py-3 w-44">Ngan sach (VND)</th>
                            <th className="text-right px-4 py-3 w-36">Thuc te</th>
                            <th className="text-right px-4 py-3 w-36">Chenh lech</th>
                            <th className="text-center px-4 py-3 w-28">% Su dung</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {EXPENSE_CATEGORIES.map(cat => {
                            const planned = getBudget(cat)?.planned || 0;
                            const actual = getActual(cat, year);
                            const diff = actual - planned;
                            const pct = planned > 0 ? (actual / planned) * 100 : 0;
                            const isOver = diff > 0 && planned > 0;
                            return (
                                <tr key={cat} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800">{cat}</td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number"
                                            value={planned || ''}
                                            onChange={e => updateBudget(cat, Number(e.target.value))}
                                            className="w-full text-right px-2 py-1 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 tabular-nums"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatVND(actual)}</td>
                                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${isOver ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {isOver ? '+' : ''}{formatVND(diff)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {planned > 0 ? (
                                            <div className="flex items-center gap-2 justify-center">
                                                <div className="w-16 bg-slate-100 rounded-full h-2">
                                                    <div className={`h-2 rounded-full ${isOver ? 'bg-red-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                                </div>
                                                <span className={`text-xs font-bold ${isOver ? 'text-red-600' : ''}`}>{pct.toFixed(0)}%</span>
                                                {isOver && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                                            </div>
                                        ) : <span className="text-xs text-slate-300">&mdash;</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
