"use client";

import React, { useState } from "react";
import { Package, Plus, ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import type { Product, StockMovement } from "@/lib/types";

export default function InventoryPage() {
    const { formatVND } = useFinance();
    const [products, setProducts] = useState<Product[]>(() => {
        if (typeof window === 'undefined') return [];
        return JSON.parse(localStorage.getItem('rp_products') || '[]');
    });
    const [movements, setMovements] = useState<StockMovement[]>(() => {
        if (typeof window === 'undefined') return [];
        return JSON.parse(localStorage.getItem('rp_movements') || '[]');
    });
    const [showForm, setShowForm] = useState(false);
    const [showMove, setShowMove] = useState<string | null>(null);
    const [moveType, setMoveType] = useState<'in' | 'out'>('in');
    const [moveQty, setMoveQty] = useState(0);
    const [moveNote, setMoveNote] = useState('');

    // Product form
    const [pName, setPName] = useState('');
    const [pSku, setPSku] = useState('');
    const [pUnit, setPUnit] = useState('cái');
    const [pCost, setPCost] = useState(0);
    const [pQty, setPQty] = useState(0);
    const [pReorder, setPReorder] = useState(10);

    const saveProducts = (p: Product[]) => { setProducts(p); localStorage.setItem('rp_products', JSON.stringify(p)); };
    const saveMovements = (m: StockMovement[]) => { setMovements(m); localStorage.setItem('rp_movements', JSON.stringify(m)); };

    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const p: Product = { id: Date.now().toString(), name: pName, sku: pSku, unit: pUnit, unitCost: pCost, currentQty: pQty, reorderLevel: pReorder };
        saveProducts([p, ...products]);
        setShowForm(false);
        setPName(''); setPSku(''); setPUnit('cái'); setPCost(0); setPQty(0); setPReorder(10);
    };

    const handleMove = (productId: string) => {
        if (moveQty <= 0) return;
        const m: StockMovement = { id: Date.now().toString(), productId, type: moveType, qty: moveQty, date: new Date().toISOString(), note: moveNote };
        saveMovements([m, ...movements]);
        saveProducts(products.map(p => {
            if (p.id !== productId) return p;
            return { ...p, currentQty: moveType === 'in' ? p.currentQty + moveQty : Math.max(0, p.currentQty - moveQty) };
        }));
        setShowMove(null); setMoveQty(0); setMoveNote('');
    };

    const totalValue = products.reduce((s, p) => s + p.currentQty * p.unitCost, 0);
    const lowStock = products.filter(p => p.currentQty <= p.reorderLevel).length;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-orange-600" /> Quản lý Kho
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi tồn kho, nhập/xuất, và giá vốn hàng bán (COGS).</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-700 transition">
                    <Plus className="w-4 h-4" /> Thêm Sản phẩm
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Tổng Sản phẩm</p>
                    <p className="text-2xl font-black text-orange-600 mt-1">{products.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Giá trị Tồn kho</p>
                    <p className="text-2xl font-black text-slate-800 mt-1">{formatVND(totalValue)}</p>
                </div>
                <div className={`p-4 rounded-2xl border shadow-sm ${lowStock > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className="text-xs font-semibold uppercase opacity-60">Sắp hết hàng</p>
                    <p className={`text-2xl font-black mt-1 ${lowStock > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{lowStock} <span className="text-sm font-normal opacity-60">sản phẩm</span></p>
                </div>
            </div>

            {/* Add Product Form */}
            {showForm && (
                <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800">📦 Thêm Sản phẩm</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Tên SP *</label><input value={pName} onChange={e => setPName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">SKU</label><input value={pSku} onChange={e => setPSku(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Đơn vị</label><input value={pUnit} onChange={e => setPUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Giá vốn/ĐV</label><input type="number" value={pCost || ''} onChange={e => setPCost(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Tồn kho đầu</label><input type="number" value={pQty || ''} onChange={e => setPQty(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Mức cảnh báo</label><input type="number" value={pReorder || ''} onChange={e => setPReorder(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" /></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Lưu</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Hủy</button>
                    </div>
                </form>
            )}

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-slate-50 text-slate-600 font-semibold">
                        <th className="text-left px-4 py-3">Sản phẩm</th><th className="text-left px-4 py-3">SKU</th>
                        <th className="text-right px-4 py-3">Tồn kho</th><th className="text-right px-4 py-3">Giá vốn</th>
                        <th className="text-right px-4 py-3">Tổng giá trị</th><th className="text-center px-4 py-3"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Chưa có sản phẩm nào.</td></tr>
                        ) : products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                    {p.name}
                                    {p.currentQty <= p.reorderLevel && <span title="Sắp hết hàng"><AlertTriangle className="w-4 h-4 text-amber-500" /></span>}
                                </td>
                                <td className="px-4 py-3 text-slate-500">{p.sku || '—'}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-bold">{p.currentQty} <span className="text-slate-400 font-normal">{p.unit}</span></td>
                                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatVND(p.unitCost)}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{formatVND(p.currentQty * p.unitCost)}</td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <button onClick={() => { setShowMove(p.id); setMoveType('in'); }} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg" title="Nhập kho"><ArrowDownCircle className="w-4 h-4" /></button>
                                        <button onClick={() => { setShowMove(p.id); setMoveType('out'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Xuất kho"><ArrowUpCircle className="w-4 h-4" /></button>
                                        <button onClick={() => saveProducts(products.filter(pp => pp.id !== p.id))} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    {showMove === p.id && (
                                        <div className="mt-2 p-3 bg-slate-50 rounded-xl text-left space-y-2">
                                            <p className="text-xs font-bold">{moveType === 'in' ? '📥 Nhập kho' : '📤 Xuất kho'}</p>
                                            <input type="number" value={moveQty || ''} onChange={e => setMoveQty(Number(e.target.value))} placeholder="Số lượng" className="w-full px-2 py-1 border rounded-lg text-xs" />
                                            <input value={moveNote} onChange={e => setMoveNote(e.target.value)} placeholder="Ghi chú" className="w-full px-2 py-1 border rounded-lg text-xs" />
                                            <div className="flex gap-1"><button onClick={() => handleMove(p.id)} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">OK</button><button onClick={() => setShowMove(null)} className="px-2 py-1 text-xs text-slate-400">Hủy</button></div>
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
