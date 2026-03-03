"use client";

import React, { useState } from "react";
import { Plus, FileText, ArrowDownCircle, ArrowUpCircle, Trash2, CheckCircle2, Clock, AlertTriangle, Send } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import type { Invoice, InvoiceItem, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const STATUS_CONFIG = {
    draft: { label: 'Nháp', color: 'bg-slate-100 text-slate-600', icon: FileText },
    sent: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-700', icon: Send },
    paid: { label: 'Đã thu', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
    overdue: { label: 'Quá hạn', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

export default function InvoicesPage() {
    const { formatVND } = useFinance();
    const [invoices, setInvoices] = useState<Invoice[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('rp_invoices');
        return saved ? JSON.parse(saved) : [];
    });
    const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all');
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'income' | 'expense'>('income');

    // Form state
    const [contactName, setContactName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<ExpenseCategory | 'Doanh thu'>('Doanh thu');
    const [amount, setAmount] = useState(0);
    const [vatRate, setVatRate] = useState(10);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<Invoice['status']>('draft');

    const save = (updated: Invoice[]) => {
        setInvoices(updated);
        localStorage.setItem('rp_invoices', JSON.stringify(updated));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const vatAmount = amount * vatRate / 100;
        const inv: Invoice = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type: formType,
            contactId: '', contactName,
            description, category: formType === 'income' ? 'Doanh thu' : category,
            amount, vatRate, vatAmount,
            date, dueDate: dueDate || date,
            status, items: [],
        };
        save([inv, ...invoices]);
        setShowForm(false);
        resetForm();
    };

    const resetForm = () => {
        setContactName(''); setDescription(''); setAmount(0); setVatRate(10);
        setDate(new Date().toISOString().split('T')[0]); setDueDate(''); setStatus('draft');
        setCategory('Doanh thu');
    };

    const handleDelete = (id: string) => {
        save(invoices.filter(i => i.id !== id));
    };

    const toggleStatus = (id: string) => {
        save(invoices.map(i => {
            if (i.id !== id) return i;
            const next = i.status === 'draft' ? 'sent' : i.status === 'sent' ? 'paid' : i.status === 'paid' ? 'draft' : 'paid';
            return { ...i, status: next };
        }));
    };

    const filtered = invoices.filter(i => tab === 'all' || i.type === tab);
    const totalIncome = invoices.filter(i => i.type === 'income' && i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const totalExpense = invoices.filter(i => i.type === 'expense' && i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const totalOverdue = invoices.filter(i => i.status === 'overdue').length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" /> Hóa đơn & Thu Chi
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý mọi giao dịch thu nhập và chi phí.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFormType('income'); setShowForm(true); }} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition">
                        <ArrowDownCircle className="w-4 h-4" /> + Thu
                    </button>
                    <button onClick={() => { setFormType('expense'); setShowForm(true); }} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">
                        <ArrowUpCircle className="w-4 h-4" /> + Chi
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Thu (Đã nhận)</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{formatVND(totalIncome)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Chi (Đã trả)</p>
                    <p className="text-2xl font-black text-red-600 mt-1">{formatVND(totalExpense)}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Quá hạn</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{totalOverdue} <span className="text-sm font-normal text-slate-400">hóa đơn</span></p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {([['all', 'Tất cả'], ['income', 'Thu'], ['expense', 'Chi']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >{label}</button>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">{formType === 'income' ? '📥 Tạo phiếu Thu' : '📤 Tạo phiếu Chi'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">{formType === 'income' ? 'Khách hàng' : 'Nhà cung cấp'}</label>
                            <input value={contactName} onChange={e => setContactName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Mô tả</label>
                            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        {formType === 'expense' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Phân loại</label>
                                <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ)</label>
                            <input type="number" value={amount || ''} onChange={e => setAmount(Number(e.target.value))} required min={0} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">VAT (%)</label>
                            <select value={vatRate} onChange={e => setVatRate(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                <option value={0}>0%</option><option value={5}>5%</option><option value={8}>8%</option><option value={10}>10%</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Ngày</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Hạn thanh toán</label>
                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái</label>
                            <select value={status} onChange={e => setStatus(e.target.value as Invoice['status'])} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="draft">Nháp</option><option value="sent">Đã gửi</option><option value="paid">Đã thu/trả</option><option value="overdue">Quá hạn</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">Lưu</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Hủy</button>
                    </div>
                </form>
            )}

            {/* Invoice Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 font-semibold">
                            <th className="text-left px-4 py-3">Ngày</th>
                            <th className="text-left px-4 py-3">Loại</th>
                            <th className="text-left px-4 py-3">Đối tác</th>
                            <th className="text-left px-4 py-3">Phân loại</th>
                            <th className="text-right px-4 py-3">Số tiền</th>
                            <th className="text-right px-4 py-3">VAT</th>
                            <th className="text-center px-4 py-3">Trạng thái</th>
                            <th className="text-center px-4 py-3 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">Chưa có hóa đơn nào. Bấm "+ Thu" hoặc "+ Chi" để tạo.</td></tr>
                        ) : filtered.map(inv => {
                            const cfg = STATUS_CONFIG[inv.status];
                            const StatusIcon = cfg.icon;
                            return (
                                <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-600">{new Date(inv.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-4 py-3">
                                        {inv.type === 'income'
                                            ? <span className="text-emerald-600 font-medium flex items-center gap-1"><ArrowDownCircle className="w-3.5 h-3.5" /> Thu</span>
                                            : <span className="text-red-600 font-medium flex items-center gap-1"><ArrowUpCircle className="w-3.5 h-3.5" /> Chi</span>}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{inv.contactName}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{inv.category}</td>
                                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{formatVND(inv.amount)}</td>
                                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{inv.vatRate}%</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggleStatus(inv.id)} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} cursor-pointer hover:opacity-80`}>
                                            <StatusIcon className="w-3 h-3" /> {cfg.label}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => handleDelete(inv.id)} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
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
