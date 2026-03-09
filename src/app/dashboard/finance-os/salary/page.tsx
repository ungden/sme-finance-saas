"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Users, Calculator } from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";


export default function SalaryPage() {
    const fos = useFinanceOS();
    const {
        departments, departmentBudgets, employees,
        monthlyRevenue, allocations, payrollPool,
        formatVND, isLoaded,
    } = fos;

    // Add employee form
    const [showForm, setShowForm] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState("");
    const [empForm, setEmpForm] = useState({ name: "", role: "", baseSalary: 0, bonus: 0 });

    const handleAdd = async () => {
        if (!empForm.name.trim() || !selectedDeptId) return;
        try {
            await fos.addEmployeeAssignment(selectedDeptId, empForm.name.trim(), empForm.role, empForm.baseSalary, empForm.bonus);
            setEmpForm({ name: "", role: "", baseSalary: 0, bonus: 0 });
            setShowForm(false);
        } catch (err) {
            console.error("Failed to add employee:", err);
        }
    };

    if (!isLoaded) return null;

    const payrollRule = allocations.find(a => a.category === "payroll");
    const payrollPercent = payrollRule?.percent || 0;

    return (
        <div className="max-w-[1200px] mx-auto pb-20 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-slate-900">Lương & Budget theo phòng ban</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Gán nhân viên vào phòng ban, enforce không vượt budget
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (departments.length === 0) {
                            alert("Vui lòng tạo phòng ban trước!");
                            return;
                        }
                        setSelectedDeptId(departments[0].id);
                        setShowForm(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" /> Thêm nhân viên
                </button>
            </div>

            {/* Formula display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-900">Công thức tính lương</span>
                </div>
                <div className="font-mono text-sm text-blue-800 bg-white/60 rounded-xl px-4 py-3">
                    <span className="text-slate-500">Lương NV = </span>
                    <span className="text-blue-600">Doanh thu</span>
                    <span className="text-slate-400"> x </span>
                    <span className="text-purple-600">Payroll%</span>
                    <span className="text-slate-400"> x </span>
                    <span className="text-amber-600">Dept%</span>
                    <span className="text-slate-400"> x </span>
                    <span className="text-emerald-600">Employee Share</span>
                </div>
                <div className="mt-2 text-xs text-blue-700">
                    Hiện tại: {formatVND(monthlyRevenue)} x {payrollPercent}% = Payroll Pool {formatVND(payrollPool)}
                </div>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">Thêm nhân viên mới</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Phòng ban</label>
                            <select
                                value={selectedDeptId}
                                onChange={e => setSelectedDeptId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Họ tên</label>
                            <input
                                value={empForm.name}
                                onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nguyen Van A"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Vị trí</label>
                            <input
                                value={empForm.role}
                                onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Manager"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Lương cơ bản</label>
                            <input
                                type="number"
                                value={empForm.baseSalary || ""}
                                onChange={e => setEmpForm(p => ({ ...p, baseSalary: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="15000000"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Thưởng</label>
                            <input
                                type="number"
                                value={empForm.bonus || ""}
                                onChange={e => setEmpForm(p => ({ ...p, bonus: Number(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="5000000"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                            Thêm
                        </button>
                        <button onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200">
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Department-by-department breakdown */}
            {departments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                    Chưa có phòng ban nào.
                    <Link href="/dashboard/finance-os/departments" className="text-blue-600 underline ml-1">Tạo phòng ban trước</Link>
                </div>
            ) : (
                departmentBudgets.map(db => {
                    const overBudget = db.remaining < 0;
                    const usagePercent = db.budget > 0 ? Math.min(100, (db.totalUsed / db.budget) * 100) : 0;

                    return (
                        <section key={db.department.id}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    <h2 className="text-base font-bold text-slate-800">{db.department.name}</h2>
                                    <span className="text-xs text-slate-400">({db.department.payroll_percent}% Payroll)</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-slate-500">Budget: <strong>{formatVND(db.budget)}</strong></span>
                                    <span className={overBudget ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                                        {overBudget ? (
                                            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Vượt {formatVND(Math.abs(db.remaining))}</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Còn {formatVND(db.remaining)}</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 bg-slate-100 rounded-full mb-3 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${overBudget ? "bg-red-500" : usagePercent > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                                />
                            </div>

                            {/* Employees table */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                            <th className="text-left px-5 py-2.5 font-semibold">Họ tên</th>
                                            <th className="text-left px-5 py-2.5 font-semibold">Vị trí</th>
                                            <th className="text-right px-5 py-2.5 font-semibold">Lương</th>
                                            <th className="text-right px-5 py-2.5 font-semibold">Thưởng</th>
                                            <th className="text-right px-5 py-2.5 font-semibold">Tổng</th>
                                            <th className="text-right px-5 py-2.5 font-semibold">% Budget</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {db.employees.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-5 py-6 text-center text-slate-400 text-xs">
                                                     Chưa có nhân viên nào trong phòng ban này
                                                </td>
                                            </tr>
                                        ) : (
                                            db.employees.map(emp => {
                                                const total = emp.base_salary + emp.bonus;
                                                const sharePercent = db.budget > 0 ? (total / db.budget * 100) : 0;
                                                return (
                                                    <tr key={emp.id} className="hover:bg-slate-50/50">
                                                        <td className="px-5 py-3 font-medium text-slate-800">{emp.employee_name}</td>
                                                        <td className="px-5 py-3 text-slate-500">{emp.role}</td>
                                                        <td className="px-5 py-3 text-right tabular-nums">{formatVND(emp.base_salary)}</td>
                                                        <td className="px-5 py-3 text-right tabular-nums text-amber-600">{formatVND(emp.bonus)}</td>
                                                        <td className="px-5 py-3 text-right tabular-nums font-semibold">{formatVND(total)}</td>
                                                        <td className="px-5 py-3 text-right text-xs text-slate-400">{sharePercent.toFixed(1)}%</td>
                                                        <td className="px-5 py-3">
                                                            <button
                                                                onClick={() => fos.removeEmployeeAssignment(emp.id)}
                                                                className="text-slate-300 hover:text-red-500 transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    {db.employees.length > 0 && (
                                        <tfoot>
                                            <tr className="bg-slate-50 border-t border-slate-200">
                                                <td className="px-5 py-2.5 font-bold text-slate-700" colSpan={2}>Tổng phòng ban</td>
                                                <td className="px-5 py-2.5 text-right tabular-nums font-bold">{formatVND(db.totalSalary)}</td>
                                                <td className="px-5 py-2.5 text-right tabular-nums font-bold text-amber-600">{formatVND(db.totalBonus)}</td>
                                                <td className="px-5 py-2.5 text-right tabular-nums font-bold">{formatVND(db.totalUsed)}</td>
                                                <td className="px-5 py-2.5 text-right text-xs text-slate-400">
                                                    {db.budget > 0 ? (db.totalUsed / db.budget * 100).toFixed(1) : 0}%
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </section>
                    );
                })
            )}

            {/* Grand total */}
            {departmentBudgets.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Tổng hợp toàn công ty</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Tổng Payroll Pool</div>
                            <div className="text-lg font-bold text-slate-900 tabular-nums">{formatVND(payrollPool)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Tổng lương thực tế</div>
                            <div className="text-lg font-bold text-slate-900 tabular-nums">
                                {formatVND(departmentBudgets.reduce((s, d) => s + d.totalUsed, 0))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Còn trống</div>
                            <div className={`text-lg font-bold tabular-nums ${departmentBudgets.reduce((s, d) => s + d.remaining, 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {formatVND(Math.abs(departmentBudgets.reduce((s, d) => s + d.remaining, 0)))}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Tổng nhân viên</div>
                            <div className="text-lg font-bold text-slate-900">{employees.length}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
