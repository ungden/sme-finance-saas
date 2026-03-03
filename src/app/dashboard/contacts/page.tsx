"use client";

import React, { useState } from "react";
import { Plus, Users, Building2, Trash2, Phone, Mail, MapPin, FileText } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
    const { formatVND } = useFinance();
    const [contacts, setContacts] = useState<Contact[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('rp_contacts');
        return saved ? JSON.parse(saved) : [];
    });
    const [tab, setTab] = useState<'all' | 'customer' | 'supplier'>('all');
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'customer' | 'supplier'>('customer');

    // Form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [taxCode, setTaxCode] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    const save = (updated: Contact[]) => {
        setContacts(updated);
        localStorage.setItem('rp_contacts', JSON.stringify(updated));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const c: Contact = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            type: formType, name, phone, email, taxCode, address, notes,
        };
        save([c, ...contacts]);
        setShowForm(false);
        setName(''); setPhone(''); setEmail(''); setTaxCode(''); setAddress(''); setNotes('');
    };

    const handleDelete = (id: string) => {
        save(contacts.filter(c => c.id !== id));
    };

    const filtered = contacts.filter(c => tab === 'all' || c.type === tab);

    // Get invoice data for AR/AP calculation
    const invoices = (() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('rp_invoices');
        return saved ? JSON.parse(saved) : [];
    })();

    const getBalance = (cName: string) => {
        const related = invoices.filter((i: any) => i.contactName === cName && i.status !== 'paid');
        return related.reduce((sum: number, i: any) => sum + i.amount, 0);
    };

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-600" /> Khách hàng & Nhà cung cấp
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý thông tin đối tác kinh doanh.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setFormType('customer'); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                        <Plus className="w-4 h-4" /> Khách hàng
                    </button>
                    <button onClick={() => { setFormType('supplier'); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                        <Plus className="w-4 h-4" /> NCC
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Khách hàng</p>
                    <p className="text-2xl font-black text-blue-600 mt-1">{contacts.filter(c => c.type === 'customer').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Nhà cung cấp</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">{contacts.filter(c => c.type === 'supplier').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Đối tác</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{contacts.length}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {([['all', 'Tất cả'], ['customer', 'Khách hàng'], ['supplier', 'NCC']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >{label}</button>
                ))}
            </div>

            {/* Create Form */}
            {showForm && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">{formType === 'customer' ? '👤 Thêm Khách hàng' : '🏭 Thêm Nhà cung cấp'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Tên *</label>
                            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                            <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Mã số thuế</label>
                            <input value={taxCode} onChange={e => setTaxCode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ</label>
                            <input value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
                            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">Lưu</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Hủy</button>
                    </div>
                </form>
            )}

            {/* Contact Cards */}
            <div className="grid gap-4">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                        Chưa có đối tác nào. Bấm nút phía trên để thêm.
                    </div>
                ) : filtered.map(c => {
                    const balance = getBalance(c.name);
                    return (
                        <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between hover:border-blue-200 transition">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${c.type === 'customer' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                                    {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900">{c.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.type === 'customer' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {c.type === 'customer' ? 'Khách hàng' : 'NCC'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                                        {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                                        {c.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.address}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {balance > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{c.type === 'customer' ? 'Còn nợ' : 'Phải trả'}</p>
                                        <p className={`font-bold tabular-nums ${c.type === 'customer' ? 'text-amber-600' : 'text-red-600'}`}>{formatVND(balance)}</p>
                                    </div>
                                )}
                                <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500 transition p-2"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
