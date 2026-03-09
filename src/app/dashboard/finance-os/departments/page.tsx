"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle, Users, Megaphone } from "lucide-react";
import { useFinanceOS } from "@/context/FinanceOSContext";

export default function DepartmentsPage() {
    const fos = useFinanceOS();
    const {
        departments, departmentBudgets, payrollPool,
        marketingChannels, channelBudgets, marketingPool,
        totalDeptPercent, totalChannelPercent,
        formatVND, isLoaded,
    } = fos;

    // Department form
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [deptName, setDeptName] = useState("");
    const [deptPercent, setDeptPercent] = useState(0);

    // Channel form
    const [showChForm, setShowChForm] = useState(false);
    const [chName, setChName] = useState("");
    const [chPercent, setChPercent] = useState(0);

    const handleAddDept = async () => {
        if (!deptName.trim()) return;
        try {
            await fos.addDepartment(deptName.trim(), deptPercent);
            setDeptName("");
            setDeptPercent(0);
            setShowDeptForm(false);
        } catch (err) {
            console.error("Failed to add department:", err);
        }
    };

    const handleAddChannel = async () => {
        if (!chName.trim()) return;
        try {
            await fos.addMarketingChannel(chName.trim(), chPercent);
            setChName("");
            setChPercent(0);
            setShowChForm(false);
        } catch (err) {
            console.error("Failed to add marketing channel:", err);
        }
    };

    if (!isLoaded) return null;

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/finance-os" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Phong ban & Kenh Marketing</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Chia Payroll Pool va Marketing Pool cho tung don vi</p>
                </div>
            </div>

            {/* ═══════ DEPARTMENTS ═══════ */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <h2 className="text-sm font-bold text-slate-700">
                            Phong ban (Payroll Pool: {formatVND(payrollPool)})
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowDeptForm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition"
                    >
                        <Plus className="w-3.5 h-3.5" /> Them phong ban
                    </button>
                </div>

                {/* Dept percent warning */}
                {totalDeptPercent > 0 && Math.abs(totalDeptPercent - 100) > 0.01 && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Tong phan bo phong ban = {totalDeptPercent.toFixed(1)}% (nen = 100% Payroll Pool)
                    </div>
                )}

                {/* Add dept form */}
                {showDeptForm && (
                    <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="Ten phong ban (VD: Sales)"
                                value={deptName}
                                onChange={e => setDeptName(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="% Payroll"
                                    min={0}
                                    max={100}
                                    value={deptPercent || ""}
                                    onChange={e => setDeptPercent(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <span className="text-xs text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddDept} className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700">
                                Them
                            </button>
                            <button onClick={() => setShowDeptForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200">
                                Huy
                            </button>
                        </div>
                    </div>
                )}

                {/* Departments table */}
                {departmentBudgets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                        Chua co phong ban nao. Bam &quot;Them phong ban&quot; de bat dau.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="text-left px-5 py-3 font-semibold">Phong ban</th>
                                    <th className="text-center px-5 py-3 font-semibold">% Payroll</th>
                                    <th className="text-right px-5 py-3 font-semibold">Budget</th>
                                    <th className="text-right px-5 py-3 font-semibold">Da dung</th>
                                    <th className="text-right px-5 py-3 font-semibold">Con lai</th>
                                    <th className="text-center px-5 py-3 font-semibold">NV</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {departmentBudgets.map(db => (
                                    <tr key={db.department.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3">
                                            <input
                                                value={db.department.name}
                                                onChange={e => fos.updateDept(db.department.id, { name: e.target.value })}
                                                className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full"
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={db.department.payroll_percent}
                                                onChange={e => fos.updateDept(db.department.id, { payroll_percent: Number(e.target.value) })}
                                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm tabular-nums focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.budget)}</td>
                                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(db.totalUsed)}</td>
                                        <td className={`px-5 py-3 text-right tabular-nums font-semibold ${db.remaining < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                            {db.remaining < 0 ? "-" : ""}{formatVND(Math.abs(db.remaining))}
                                        </td>
                                        <td className="px-5 py-3 text-center text-slate-500">{db.employees.length}</td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Xoa phong ban "${db.department.name}"? Tat ca nhan vien trong phong ban cung se bi xoa.`))
                                                        fos.removeDepartment(db.department.id);
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t border-slate-200">
                                    <td className="px-5 py-3 font-bold text-slate-700">Tong</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`font-bold text-sm ${Math.abs(totalDeptPercent - 100) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
                                            {totalDeptPercent.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-700">
                                        {formatVND(departmentBudgets.reduce((s, d) => s + d.budget, 0))}
                                    </td>
                                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-700">
                                        {formatVND(departmentBudgets.reduce((s, d) => s + d.totalUsed, 0))}
                                    </td>
                                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-700">
                                        {formatVND(departmentBudgets.reduce((s, d) => s + d.remaining, 0))}
                                    </td>
                                    <td className="px-5 py-3 text-center text-slate-500">
                                        {departmentBudgets.reduce((s, d) => s + d.employees.length, 0)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </section>

            {/* ═══════ MARKETING CHANNELS ═══════ */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-amber-500" />
                        <h2 className="text-sm font-bold text-slate-700">
                            Kenh Marketing (Pool: {formatVND(marketingPool)})
                        </h2>
                    </div>
                    <button
                        onClick={() => setShowChForm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition"
                    >
                        <Plus className="w-3.5 h-3.5" /> Them kenh
                    </button>
                </div>

                {totalChannelPercent > 0 && Math.abs(totalChannelPercent - 100) > 0.01 && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Tong phan bo kenh = {totalChannelPercent.toFixed(1)}% (nen = 100% Marketing Pool)
                    </div>
                )}

                {showChForm && (
                    <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                placeholder="Ten kenh (VD: Facebook Ads)"
                                value={chName}
                                onChange={e => setChName(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="% Marketing"
                                    min={0}
                                    max={100}
                                    value={chPercent || ""}
                                    onChange={e => setChPercent(Number(e.target.value))}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <span className="text-xs text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddChannel} className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600">
                                Them
                            </button>
                            <button onClick={() => setShowChForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200">
                                Huy
                            </button>
                        </div>
                    </div>
                )}

                {channelBudgets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                        Chua co kenh marketing nao.
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="text-left px-5 py-3 font-semibold">Kenh</th>
                                    <th className="text-center px-5 py-3 font-semibold">% Marketing</th>
                                    <th className="text-right px-5 py-3 font-semibold">Budget</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {channelBudgets.map(cb => (
                                    <tr key={cb.channel.id} className="hover:bg-slate-50/50">
                                        <td className="px-5 py-3">
                                            <input
                                                value={cb.channel.name}
                                                onChange={e => fos.updateChannel(cb.channel.id, { name: e.target.value })}
                                                className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full"
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={cb.channel.percent}
                                                onChange={e => fos.updateChannel(cb.channel.id, { percent: Number(e.target.value) })}
                                                className="w-16 text-center px-2 py-1 border border-slate-200 rounded-lg text-sm tabular-nums focus:ring-2 focus:ring-amber-500 outline-none"
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">{formatVND(cb.budget)}</td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Xoa kenh "${cb.channel.name}"?`))
                                                        fos.removeMarketingChannel(cb.channel.id);
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t border-slate-200">
                                    <td className="px-5 py-3 font-bold text-slate-700">Tong</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`font-bold text-sm ${Math.abs(totalChannelPercent - 100) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
                                            {totalChannelPercent.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-700">
                                        {formatVND(channelBudgets.reduce((s, c) => s + c.budget, 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
