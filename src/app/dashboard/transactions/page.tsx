"use client";

import React, { useState } from "react";
import { useFinance, TX_TYPES, TransactionType } from "@/context/FinanceContext";
import FileUploader from "@/components/FileUploader";
import { Plus, Trash2, Sparkles, BookOpen } from "lucide-react";

export default function TransactionsPage() {
    const { transactions, addTransaction, removeTransaction, clearAll, loadExample, formatVND } = useFinance();
    const [isLoading, setIsLoading] = useState(false);

    // Form
    const [txType, setTxType] = useState<TransactionType>("SALE_CASH");
    const [txDesc, setTxDesc] = useState("");
    const [txAmount, setTxAmount] = useState<number | "">("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!txAmount || Number(txAmount) <= 0 || !txDesc.trim()) return;

        addTransaction({
            date: new Date().toLocaleDateString("vi-VN"),
            description: txDesc.trim(),
            type: txType,
            amount: Number(txAmount),
        });

        setTxDesc("");
        setTxAmount("");
    };

    const handleFileUpload = async (file: File) => {
        setIsLoading(true);
        await new Promise((res) => setTimeout(res, 2000));
        addTransaction({
            date: new Date().toLocaleDateString("vi-VN"),
            description: `AI đọc: ${file.name}`,
            type: "EXPENSE_CASH",
            amount: 12000000,
        });
        setIsLoading(false);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Giao Dịch</h1>
                <p className="text-sm text-slate-500 mt-1">Ghi nhận thu chi hàng ngày — hệ thống sẽ tự tổng hợp vào Báo cáo Tài chính.</p>
            </div>

            {/* ── Add Transaction Card ─────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <h2 className="font-bold text-base">Thêm Giao Dịch Mới</h2>
                </div>

                <div className="p-6">
                    {/* AI Uploader */}
                    <div className="mb-6">
                        <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại giao dịch</label>
                            <select
                                value={txType}
                                onChange={(e) => setTxType(e.target.value as TransactionType)}
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white outline-none text-sm"
                            >
                                {TX_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.emoji} {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Diễn giải</label>
                            <input
                                type="text"
                                value={txDesc}
                                onChange={(e) => setTxDesc(e.target.value)}
                                required
                                placeholder="VD: Mua văn phòng phẩm"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Số tiền (VNĐ)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={txAmount === "" || txAmount === 0 ? "" : new Intl.NumberFormat("vi-VN").format(Number(txAmount))}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/[^\d]/g, "");
                                    setTxAmount(rawValue === "" ? "" : Number(rawValue));
                                }}
                                required
                                placeholder="5.000.000"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm tabular-nums"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center space-x-2 text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Thêm</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Transaction History ───────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-slate-500" />
                        <h2 className="font-bold text-base text-slate-900">Sổ Nhật Ký</h2>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-medium">{transactions.length} bút toán</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={loadExample} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition flex items-center space-x-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Tải ví dụ mẫu</span>
                        </button>
                        <button onClick={clearAll} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition">
                            Xóa tất cả
                        </button>
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-base font-medium text-slate-500">Chưa có giao dịch nào</p>
                        <p className="text-sm text-slate-400 mt-1">Hãy thêm giao dịch đầu tiên hoặc nhấn "Tải ví dụ mẫu" để xem demo.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Diễn giải</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Số tiền</th>
                                    <th className="px-6 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx) => {
                                    const txMeta = TX_TYPES.find((t) => t.value === tx.type);
                                    return (
                                        <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{tx.date}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${txMeta?.color || ""}`}>
                                                    <span>{txMeta?.emoji}</span>
                                                    <span>{txMeta?.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-slate-800 max-w-xs truncate">{tx.description}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-slate-900 tabular-nums whitespace-nowrap">{formatVND(tx.amount)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => removeTransaction(tx.id)}
                                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
            </div>
        </div>
    );
}
