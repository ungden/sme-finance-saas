"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Sliders } from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";
import { ALLOCATION_CATEGORY_LABELS, ALLOCATION_CATEGORY_COLORS } from "@/lib/types";
import type { AllocationCategory } from "@/lib/types";

const CATEGORIES: AllocationCategory[] = ["cogs", "marketing", "operations", "payroll", "profit"];

export default function AllocationRulesPage() {
    const fos = useFinanceOS();
    const { allocationRules, allocations, totalAllocPercent, monthlyRevenue, formatVND, isLoaded, isSaving } = fos;
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        try {
            await fos.saveAllocationRules();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save allocation rules:", err);
        }
    };

    if (!isLoaded) return null;

    const isValid = Math.abs(totalAllocPercent - 100) < 0.01;

    return (
        <div className="max-w-3xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">Quy tắc phân bổ doanh thu</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Cấu hình % revenue cho từng quỹ (tổng phải = 100%)</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu thay đổi"}
                </button>
            </div>

            {/* Validation banner */}
            {!isValid && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Tổng phân bổ hiện tại = <strong>{totalAllocPercent.toFixed(1)}%</strong>. Cần điều chỉnh để tổng = 100%.
                </div>
            )}
            {isValid && allocationRules.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Tổng phân bổ = 100%. Hệ thống sẵn sàng hoạt động.
                </div>
            )}

            {/* Rules Editor */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="col-span-4">Hạng mục</div>
                        <div className="col-span-3 text-center">% Revenue</div>
                        <div className="col-span-3 text-right">Số tiền (tháng)</div>
                        <div className="col-span-2 text-center">Preview</div>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {CATEGORIES.map(cat => {
                        const rule = allocationRules.find(r => r.category === cat);
                        const percent = rule?.percent || 0;
                        const alloc = allocations.find(a => a.category === cat);
                        const amount = alloc?.amount || 0;

                        return (
                            <div key={cat} className="grid grid-cols-12 gap-4 items-center px-5 py-4">
                                {/* Category label */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: ALLOCATION_CATEGORY_COLORS[cat] }}
                                    />
                                    <span className="font-semibold text-sm text-slate-800">
                                        {ALLOCATION_CATEGORY_LABELS[cat]}
                                    </span>
                                </div>

                                {/* Percent input + slider */}
                                <div className="col-span-3 flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            step={0.5}
                                            value={percent}
                                            onChange={e => fos.updateAllocationRule(cat, Number(e.target.value))}
                                            className="w-20 text-center px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none tabular-nums"
                                        />
                                        <span className="text-xs text-slate-400">%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={50}
                                        step={0.5}
                                        value={percent}
                                        onChange={e => fos.updateAllocationRule(cat, Number(e.target.value))}
                                        className="w-full h-1.5 accent-blue-600"
                                    />
                                </div>

                                {/* Amount */}
                                <div className="col-span-3 text-right tabular-nums text-sm font-medium text-slate-600">
                                    {formatVND(amount)}
                                </div>

                                {/* Preview bar */}
                                <div className="col-span-2">
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${Math.min(100, percent * 2)}%`,
                                                backgroundColor: ALLOCATION_CATEGORY_COLORS[cat],
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary footer */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200">
                    <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 text-sm font-bold text-slate-700">Tổng</div>
                        <div className="col-span-3 text-center">
                            <span className={`text-sm font-bold ${isValid ? "text-emerald-600" : "text-red-600"}`}>
                                {totalAllocPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="col-span-3 text-right text-sm font-bold text-slate-700 tabular-nums">
                            {formatVND(allocations.reduce((s, a) => s + a.amount, 0))}
                        </div>
                        <div className="col-span-2" />
                    </div>
                </div>
            </div>

            {/* Revenue simulation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">Mô phỏng doanh thu</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                    Nhập doanh thu giả định để xem số tiền phân bổ tương ứng.
                    Doanh thu hiện tại: <strong>{formatVND(monthlyRevenue)}</strong>
                </p>
                <input
                    type="number"
                    placeholder="VD: 1000000000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={fos.revenueOverride ?? ""}
                    onChange={e => {
                        const v = e.target.value;
                        fos.setRevenueOverride(v === "" ? null : Number(v));
                    }}
                />
                {fos.revenueOverride !== null && (
                    <button
                        onClick={() => fos.setRevenueOverride(null)}
                        className="mt-2 text-xs text-blue-600 font-medium hover:underline"
                    >
                        Reset về doanh thu thực
                    </button>
                )}
            </div>

            {/* Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
                <h3 className="font-bold mb-2">Hướng dẫn phân bổ</h3>
                <ul className="space-y-1 text-xs">
                    <li><strong>COGS (25-35%):</strong> Chi phí hàng bán, nguyên vật liệu, sản xuất</li>
                    <li><strong>Marketing (10-20%):</strong> Quảng cáo, brand, content, PR</li>
                    <li><strong>Operations (15-25%):</strong> Mặt bằng, điện nước, văn phòng, bảo hiểm</li>
                    <li><strong>Payroll (15-25%):</strong> Lương, thưởng, BHXH cho toàn bộ nhân viên</li>
                    <li><strong>Profit (10-20%):</strong> Lợi nhuận giữ lại, tái đầu tư, dự phòng</li>
                </ul>
            </div>
        </div>
    );
}
