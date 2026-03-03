"use client";

import React, { useState } from "react";
import { Users, Plus, Trash2, Building, AlertCircle } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function HRPage() {
    const { employees, addEmployee, deleteEmployee, formatVND, isLoaded } = useFinance();
    const [isAdding, setIsAdding] = useState(false);
    const [form, setForm] = useState({ name: "", role: "", monthlySalary: 0, startDate: new Date().toISOString().slice(0, 7) });

    if (!isLoaded) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || form.monthlySalary <= 0) return alert("Vui lòng nhập Tên và Mức lương hợp lệ!");
        addEmployee(form);
        setForm({ name: "", role: "", monthlySalary: 0, startDate: new Date().toISOString().slice(0, 7) });
        setIsAdding(false);
    };

    const totalMonthlyRaw = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
    const totalYearlyRaw = totalMonthlyRaw * 12;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Quản lý Nhân sự & Tiền lương
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Danh sách nhân sự. Quỹ lương tự động đồng bộ vào Báo cáo KQKD (P&L).</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Nhân sự</span>
                </button>
            </div>

            {/* Quỹ Lương Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng quỹ lương / Tháng</p>
                        <p className="text-2xl font-black text-slate-900">{formatVND(totalMonthlyRaw)}</p>
                    </div>
                </div>
                <div className="bg-white border border-blue-200 p-5 rounded-2xl shadow-sm bg-blue-50/50 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Dự phóng cả năm (Đồng bộ BCTC)</p>
                        <p className="text-2xl font-black text-blue-700">{formatVND(totalYearlyRaw)}</p>
                    </div>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Thêm Nhân sự mới</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nguyễn Văn A" autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Vị trí</label>
                            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Sale, Kế toán..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Lương cố định / tháng</label>
                            <input type="number" value={form.monthlySalary || ""} onChange={e => setForm({ ...form, monthlySalary: Number(e.target.value) })} required min="0" className="w-full px-3 py-2 border rounded-lg text-sm tabular-nums" placeholder="10000000" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tháng bắt đầu</label>
                            <input type="month" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Lưu Nhân sự</button>
                    </div>
                </form>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {employees.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Chưa có nhân sự nào. Bấm "Thêm Nhân sự" để bắt đầu.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3">Họ và Tên</th>
                                    <th className="px-4 py-3">Vị trí</th>
                                    <th className="px-4 py-3 text-right">Mức lương / tháng</th>
                                    <th className="px-4 py-3 text-center">Bắt đầu</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{emp.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{emp.role || "---"}</td>
                                        <td className="px-4 py-3 text-right font-medium text-blue-700">{formatVND(emp.monthlySalary)}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{emp.startDate}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => deleteEmployee(emp.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Xóa nhân sự">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 text-slate-500 p-4 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                Lưu ý: Ngay khi thêm mới/xóa nhân sự, mức Lương (OPEX) của toàn bộ các năm trong dự án sẽ được đồng bộ ngay lập tức. Tính năng Tăng lương theo thâm niên mỗi năm sẽ được cập nhật ở V3.
            </div>
        </div>
    );
}
