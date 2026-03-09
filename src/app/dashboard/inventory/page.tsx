"use client";

import React, { useState } from "react";
import { Package, Plus, ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useERP } from "@/context/ERPContext";

export default function InventoryPage() {
    const { formatVND } = useFinance();
    const erp = useERP();
    const { products, isLoaded } = erp;

    const [showForm, setShowForm] = useState(false);
    const [showMove, setShowMove] = useState<string | null>(null);
    const [moveType, setMoveType] = useState<'in' | 'out'>('in');
    const [moveQty, setMoveQty] = useState(0);
    const [moveNote, setMoveNote] = useState('');

    // Product form
    const [pName, setPName] = useState('');
    const [pSku, setPSku] = useState('');
    const [pUnit, setPUnit] = useState('cai');
    const [pCost, setPCost] = useState(0);
    const [pQty, setPQty] = useState(0);
    const [pReorder, setPReorder] = useState(10);

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        await erp.addProduct({ name: pName, sku: pSku, unit: pUnit, unitCost: pCost, currentQty: pQty, reorderLevel: pReorder });
        setShowForm(false);
        setPName(''); setPSku(''); setPUnit('cai'); setPCost(0); setPQty(0); setPReorder(10);
    };

    const handleMove = async (productId: string) => {
        if (moveQty <= 0) return;
        await erp.addStockMovement(productId, moveType, moveQty, moveNote);
        setShowMove(null); setMoveQty(0); setMoveNote('');
    };

    if (!isLoaded) return null;

    const totalValue = products.reduce((s, p) => s + p.currentQty * p.unitCost, 0);
    const lowStock = products.filter(p => p.currentQty <= p.reorderLevel).length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-orange-600" /> Quan ly Kho
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Theo doi ton kho, nhap/xuat, va gia von hang ban (COGS).</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-700 transition">
                    <Plus className="w-4 h-4" /> Them San pham
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tong San pham</p>
                    <p className="text-2xl font-black text-orange-600 mt-1">{products.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Gia tri Ton kho</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{formatVND(totalValue)}</p>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm ${lowStock > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs font-semibold uppercase opacity-60">Sap het hang</p>
                    <p className={`text-2xl font-black mt-1 ${lowStock > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{lowStock} <span className="text-sm font-normal opacity-60">san pham</span></p>
                </div>
            </div>

            {/* Add Product Form */}
            {showForm && (
                <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">Them San pham</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Ten SP *</label><input value={pName} onChange={e => setPName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">SKU</label><input value={pSku} onChange={e => setPSku(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Don vi</label><input value={pUnit} onChange={e => setPUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Gia von/DV</label><input type="number" value={pCost || ''} onChange={e => setPCost(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Ton kho dau</label><input type="number" value={pQty || ''} onChange={e => setPQty(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Muc canh bao</label><input type="number" value={pReorder || ''} onChange={e => setPReorder(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Luu</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Huy</button>
                    </div>
                </form>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 text-slate-600 font-semibold">
                        <th className="text-left px-4 py-3">San pham</th><th className="text-left px-4 py-3">SKU</th>
                        <th className="text-right px-4 py-3">Ton kho</th><th className="text-right px-4 py-3">Gia von</th>
                        <th className="text-right px-4 py-3">Tong gia tri</th><th className="text-center px-4 py-3"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Chua co san pham nao.</td></tr>
                        ) : products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                    {p.name}
                                    {p.currentQty <= p.reorderLevel && <span title="Sap het hang"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>}
                                </td>
                                <td className="px-4 py-3 text-slate-500">{p.sku || '—'}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-bold">{p.currentQty} <span className="text-slate-400 font-normal">{p.unit}</span></td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatVND(p.unitCost)}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{formatVND(p.currentQty * p.unitCost)}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => { setShowMove(p.id); setMoveType('in'); }} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Nhap kho"><ArrowDownCircle className="w-4 h-4" /></button>
                                        <button onClick={() => { setShowMove(p.id); setMoveType('out'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Xuat kho"><ArrowUpCircle className="w-4 h-4" /></button>
                                        <button onClick={() => erp.removeProduct(p.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    {showMove === p.id && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-xl text-left space-y-2">
                                            <p className="text-xs font-bold">{moveType === 'in' ? 'Nhap kho' : 'Xuat kho'}</p>
                                            <input type="number" value={moveQty || ''} onChange={e => setMoveQty(Number(e.target.value))} placeholder="So luong" className="w-full px-2 py-1 border rounded-lg text-xs" />
                                            <input value={moveNote} onChange={e => setMoveNote(e.target.value)} placeholder="Ghi chu" className="w-full px-2 py-1 border rounded-lg text-xs" />
                                            <div className="flex gap-1"><button onClick={() => handleMove(p.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">OK</button><button onClick={() => setShowMove(null)} className="px-2 py-1 text-xs text-slate-400">Huy</button></div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
