"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from "lucide-react";
import type { Invoice, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [rows, setRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [imported, setImported] = useState(false);
    const [error, setError] = useState('');

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setImported(false);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return;
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { setError('File cần ít nhất 2 dòng (header + data)'); return; }
            const parseLine = (line: string) => line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            setHeaders(parseLine(lines[0]));
            setRows(lines.slice(1).map(parseLine));
        };
        reader.readAsText(f);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.csv') || f.name.endsWith('.txt'))) handleFile(f);
        else setError('Vui lòng upload file .csv');
    };

    const handleImport = () => {
        try {
            // Try to map columns intelligently
            const dateIdx = headers.findIndex(h => /ngày|date/i.test(h));
            const nameIdx = headers.findIndex(h => /tên|name|đối tác|khách/i.test(h));
            const amountIdx = headers.findIndex(h => /số tiền|amount|tiền/i.test(h));
            const typeIdx = headers.findIndex(h => /loại|type|thu|chi/i.test(h));
            const descIdx = headers.findIndex(h => /mô tả|desc|ghi chú|note/i.test(h));

            if (amountIdx === -1) { setError('Không tìm thấy cột "Số tiền". Vui lòng đặt tên cột rõ ràng.'); return; }

            const existingInvoices = JSON.parse(localStorage.getItem('rp_invoices') || '[]');
            const newInvoices: Invoice[] = rows.map(row => {
                const amount = Math.abs(Number(row[amountIdx]?.replace(/[,.]/g, '') || 0));
                const isExpense = typeIdx >= 0 ? /chi|expense|out/i.test(row[typeIdx]) : amount < 0;
                return {
                    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
                    type: isExpense ? 'expense' as const : 'income' as const,
                    contactId: '', contactName: nameIdx >= 0 ? row[nameIdx] || '' : '',
                    description: descIdx >= 0 ? row[descIdx] || '' : '',
                    category: isExpense ? 'Khác' as ExpenseCategory : 'Doanh thu' as const,
                    amount, vatRate: 0, vatAmount: 0,
                    date: dateIdx >= 0 ? row[dateIdx] || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    dueDate: dateIdx >= 0 ? row[dateIdx] || '' : '',
                    status: 'paid' as const,
                    items: [],
                };
            }).filter(inv => inv.amount > 0);

            localStorage.setItem('rp_invoices', JSON.stringify([...newInvoices, ...existingInvoices]));
            setImported(true);
        } catch (err) {
            setError('Lỗi khi import. Vui lòng kiểm tra format file.');
        }
    };

    return (
        <div className="space-y-6 max-w-[1000px] mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> Import Excel / CSV
                </h1>
                <p className="text-sm text-slate-500 mt-1">Đổ dữ liệu từ file CSV vào hệ thống hóa đơn.</p>
            </div>

            {/* Drop Zone */}
            {!file && (
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-slate-300 rounded-2xl p-16 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50"
                    onClick={() => document.getElementById('csv-input')?.click()}
                >
                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-600 mb-2">Kéo thả file .csv vào đây</p>
                    <p className="text-sm text-slate-400">hoặc click để chọn file</p>
                    <input id="csv-input" type="file" accept=".csv,.txt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {/* Preview */}
            {file && rows.length > 0 && !imported && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-700">📄 {file.name} — {rows.length} dòng dữ liệu</p>
                        <button onClick={() => { setFile(null); setRows([]); setHeaders([]); }} className="text-sm text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    {headers.map((h, i) => <th key={i} className="text-left px-3 py-2 text-slate-600 font-semibold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.slice(0, 10).map((row, ri) => (
                                    <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-700">{cell}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                        {rows.length > 10 && <p className="text-xs text-slate-400 p-3">... và {rows.length - 10} dòng nữa</p>}
                    </div>
                    <button onClick={handleImport} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Import {rows.length} giao dịch vào Hóa đơn
                    </button>
                </div>
            )}

            {imported && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-emerald-800 mb-2">Import thành công!</h3>
                    <p className="text-sm text-emerald-600">{rows.length} giao dịch đã được thêm vào mục Hóa đơn & Thu Chi.</p>
                    <button onClick={() => { setFile(null); setRows([]); setHeaders([]); setImported(false); }} className="mt-4 px-6 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition">Import file khác</button>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-2">
                <h3 className="font-bold text-slate-800">📋 Hướng dẫn format CSV:</h3>
                <p>Dòng đầu tiên là header. Hệ thống tự nhận diện các cột:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                    <li><b>Ngày</b> (date) — Ngày giao dịch</li>
                    <li><b>Tên / Đối tác</b> — Tên khách hàng hoặc NCC</li>
                    <li><b>Số tiền</b> (amount) — Giá trị giao dịch (bắt buộc)</li>
                    <li><b>Loại</b> (type) — &ldquo;Thu&rdquo; hoặc &ldquo;Chi&rdquo;</li>
                    <li><b>Mô tả</b> (note) — Ghi chú</li>
                </ul>
            </div>
        </div>
    );
}
