"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Plus, Building2, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { Workspace } from "@/lib/types";
import * as api from "@/lib/workspace";

export default function WorkspacesPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const ws = await api.getMyWorkspaces();
                setWorkspaces(ws);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            const ws = await api.createWorkspace(newName.trim());
            setWorkspaces(prev => [ws, ...prev]);
            setNewName("");
            setIsCreating(false);
        } catch (err) {
            alert("Tạo workspace thất bại. Vui lòng thử lại.");
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa workspace này? Mọi dữ liệu sẽ bị mất.")) return;
        try {
            await api.deleteWorkspace(id);
            setWorkspaces(prev => prev.filter(w => w.id !== id));
        } catch (err) {
            alert("Xóa thất bại.");
        }
    };

    const handleSelect = (wsId: string) => {
        localStorage.setItem("rp_current_workspace", wsId);
        router.push("/dashboard");
    };

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">RealProfit</span>
                    </div>
                    <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-600 transition font-medium">
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Chọn Workspace</h1>
                        <p className="text-sm text-slate-500 mt-1">Mỗi workspace đại diện cho 1 Brand / Chuỗi doanh nghiệp.</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo mới
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên Workspace / Brand</label>
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                autoFocus
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder='VD: "Phở Thìn Group"'
                            />
                        </div>
                        <button type="submit" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">Tạo</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Hủy</button>
                    </form>
                )}

                {workspaces.length === 0 && !isCreating ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có Workspace nào</h3>
                        <p className="text-sm text-slate-500 mb-6">Tạo workspace đầu tiên để bắt đầu quản trị tài chính doanh nghiệp.</p>
                        <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                            + Tạo Workspace Đầu Tiên
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
                                onClick={() => handleSelect(ws.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center border border-blue-100">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition">{ws.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Tạo lúc {new Date(ws.created_at).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(ws.id); }}
                                        className="text-slate-300 hover:text-red-500 transition p-2"
                                        title="Xóa workspace"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
