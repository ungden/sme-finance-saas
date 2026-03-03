"use client";

import React, { useState } from "react";
import { Clock, User, Plus, Trash2, Edit3, FileText, Users, Building, DollarSign } from "lucide-react";
import type { AuditLog } from "@/lib/types";

const ENTITY_ICONS: Record<string, React.ReactNode> = {
    invoice: <FileText className="w-4 h-4 text-blue-500" />,
    employee: <Users className="w-4 h-4 text-indigo-500" />,
    facility: <Building className="w-4 h-4 text-amber-500" />,
    yearData: <DollarSign className="w-4 h-4 text-emerald-500" />,
    contact: <User className="w-4 h-4 text-purple-500" />,
};

const ACTION_COLORS = {
    create: 'bg-emerald-100 text-emerald-700',
    update: 'bg-blue-100 text-blue-700',
    delete: 'bg-red-100 text-red-700',
};

const ACTION_ICONS = {
    create: <Plus className="w-3 h-3" />,
    update: <Edit3 className="w-3 h-3" />,
    delete: <Trash2 className="w-3 h-3" />,
};

export default function AuditPage() {
    const [logs] = useState<AuditLog[]>(() => {
        if (typeof window === 'undefined') return [];
        const saved = localStorage.getItem('rp_audit_log');
        return saved ? JSON.parse(saved) : [];
    });

    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? logs : logs.filter(l => l.entity === filter);

    return (
        <div className="space-y-6 max-w-[1000px] mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-purple-600" /> Nhật ký Hoạt động
                </h1>
                <p className="text-sm text-slate-500 mt-1">Lịch sử thay đổi dữ liệu bởi tất cả thành viên.</p>
            </div>

            {/* Filter */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
                {['all', 'invoice', 'employee', 'facility', 'yearData', 'contact'].map(key => (
                    <button key={key} onClick={() => setFilter(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >{key === 'all' ? 'Tất cả' : key === 'invoice' ? 'Hóa đơn' : key === 'employee' ? 'Nhân sự' : key === 'facility' ? 'Mặt bằng' : key === 'yearData' ? 'Tài chính' : 'Liên hệ'}</button>
                ))}
            </div>

            {/* Timeline */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-600 mb-2">Chưa có hoạt động nào</h3>
                    <p className="text-sm text-slate-400">Nhật ký sẽ tự động ghi nhận khi có thay đổi dữ liệu.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(log => (
                        <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4 hover:border-slate-300 transition">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                                {ENTITY_ICONS[log.entity] || <FileText className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                                        {ACTION_ICONS[log.action]} {log.action === 'create' ? 'Tạo' : log.action === 'update' ? 'Sửa' : 'Xóa'}
                                    </span>
                                    <span className="text-sm text-slate-900 font-medium">{log.description}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.userEmail}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
