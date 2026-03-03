"use client";

import React, { useState } from "react";
import { Building, Plus, Trash2, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";

export default function FacilitiesPage() {
    const { facilities, addFacility, deleteFacility, formatVND, isLoaded } = useFinance();
    const [isAdding, setIsAdding] = useState(false);

    const [form, setForm] = useState({
        name: "",
        monthlyRent: 0,
        fireSafetyValid: true,
        contractEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 7)
    });

    if (!isLoaded) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || form.monthlyRent < 0) return alert("Vui lòng nhập Tên mặt bằng và Giá thuê hợp lệ!");
        addFacility(form);
        setForm({ ...form, name: "", monthlyRent: 0 });
        setIsAdding(false);
    };

    const totalMonthlyRaw = facilities.reduce((sum, f) => sum + f.monthlyRent, 0);
    const totalYearlyRaw = totalMonthlyRaw * 12;

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Building className="w-6 h-6 text-indigo-600" />
                        Quản lý Mặt bằng & Chi nhánh
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý giá thuê, PCCC và hạn hợp đồng. Tiền thuê tự động đồng bộ vào Báo cáo KQKD (P&L).</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Chi nhánh</span>
                </button>
            </div>

            {/* Quỹ Thuê Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng tiền thuê / Tháng</p>
                        <p className="text-2xl font-black text-slate-900">{formatVND(totalMonthlyRaw)}</p>
                    </div>
                </div>
                <div className="bg-white border border-indigo-200 p-5 rounded-2xl shadow-sm bg-indigo-50/50 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">Dự phóng cả năm (Đồng bộ BCTC)</p>
                        <p className="text-2xl font-black text-indigo-700">{formatVND(totalYearlyRaw)}</p>
                    </div>
                </div>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Thêm Mặt bằng / Chi nhánh mới</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tên Cơ sở / Địa chỉ</label>
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Chi nhánh Q1..." autoFocus />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Giá thuê / Tháng</label>
                            <input type="number" value={form.monthlyRent || ""} onChange={e => setForm({ ...form, monthlyRent: Number(e.target.value) })} required min="0" className="w-full px-3 py-2 border rounded-lg text-sm tabular-nums" placeholder="50000000" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tháng Hết Hợp Đồng</label>
                            <input type="month" value={form.contractEnd} onChange={e => setForm({ ...form, contractEnd: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Kiểm định PCCC</label>
                            <select
                                value={form.fireSafetyValid ? "yes" : "no"}
                                onChange={e => setForm({ ...form, fireSafetyValid: e.target.value === "yes" })}
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            >
                                <option value="yes">Đã Đạt PCCC</option>
                                <option value="no">Chưa Nghiệm Thu / Bị Đình Chỉ</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Lưu Cơ sở</button>
                    </div>
                </form>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {facilities.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">Chưa có dữ liệu mặt bằng nào. Bấm "Thêm Chi nhánh" để bắt đầu.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 min-w-[200px]">Chi nhánh / Mặt bằng</th>
                                    <th className="px-4 py-3 text-right">Giá thuê / tháng</th>
                                    <th className="px-4 py-3 text-center">Tình trạng PCCC</th>
                                    <th className="px-4 py-3 text-center">Hết Hợp đồng</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {facilities.map(fac => (
                                    <tr key={fac.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{fac.name}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-700">{formatVND(fac.monthlyRent)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {fac.fireSafetyValid ? (
                                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 text-xs font-bold">
                                                    <ShieldCheck className="w-3 h-3" /> Đạt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-bold">
                                                    <ShieldAlert className="w-3 h-3" /> Chưa Đạt/Cảnh Báo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center text-slate-500">{fac.contractEnd}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => deleteFacility(fac.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Xóa chi nhánh">
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
                Lưu ý: Ngay khi cấu hình, tổng tiền thuê (12 tháng) sẽ tự động cộng đè vào mục "Chi phí Vận hành (OPEX)" trong Dashboard BCTC.
            </div>
        </div>
    );
}
