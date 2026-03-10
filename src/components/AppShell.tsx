"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Landmark, LogOut, Loader2, Plus, FolderSync, GitBranch, FileText, Workflow, FileDown, X } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { createClient } from "@/utils/supabase/client";

/* ── Inline Modal Component ── */
function NameModal({ title, defaultValue, onConfirm, onCancel }: {
    title: string;
    defaultValue: string;
    onConfirm: (name: string) => void;
    onCancel: () => void;
}) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) onConfirm(value.trim());
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
            <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-sm mx-4 space-y-4"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Nhập tên..."
                    required
                />
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition">
                        Tạo
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── ERP sub-paths (used for sidebar active highlight) ── */
const ERP_PATHS = [
    "/dashboard/erp", "/dashboard/invoices", "/dashboard/contacts",
    "/dashboard/inventory", "/dashboard/budget", "/dashboard/tax",
    "/dashboard/import", "/dashboard/audit",
];

/* ── Tong Quan sub-paths ── */
const OVERVIEW_PATHS = [
    "/dashboard", "/dashboard/input", "/dashboard/hr",
    "/dashboard/facilities", "/dashboard/forecast",
    "/dashboard/consolidated", "/dashboard/boe",
];

const NAV_ITEMS = [
    { href: "/dashboard", label: "Tổng Quan", icon: LayoutDashboard, match: OVERVIEW_PATHS, excludeMatch: [] as string[] },
    { href: "/dashboard/erp", label: "ERP", icon: FileText, match: ERP_PATHS, excludeMatch: [] as string[] },
    { href: "/dashboard/finance-os", label: "Finance OS", icon: Workflow, match: ["/dashboard/finance-os"], excludeMatch: ["/dashboard/finance-os/reports"] },
    { href: "/dashboard/finance-os/reports", label: "Báo cáo", icon: FileDown, match: ["/dashboard/finance-os/reports"], excludeMatch: [] },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoaded, projects, currentProjectId, switchProject, createProject } = useFinance();
    const ws = useWorkspace();
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    const isActive = (item: typeof NAV_ITEMS[0]) => {
        const excluded = item.excludeMatch.some(p => pathname === p || pathname.startsWith(p + "/"));
        if (excluded) return false;
        return item.match.some(p => pathname === p || pathname.startsWith(p + "/"));
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            {/* ── Top Navbar ────────────────────────────────── */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shrink-0">
                <div className="px-4 sm:px-6 lg:px-8 flex justify-between items-center h-14">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center space-x-2.5">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">RealProfit</span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500 font-medium">
                        {ws.currentWorkspace && (
                            <Link href="/workspaces" className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-slate-700 font-bold text-xs">
                                {ws.currentWorkspace.name}
                            </Link>
                        )}
                        {ws.isSaving && <span className="text-xs text-blue-500 animate-pulse">Đang lưu...</span>}
                    </div>
                </div>
            </header>

            {/* ── Body: Sidebar + Content ──────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <nav className="w-16 lg:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col py-4 px-2 lg:px-4">
                    <div className="flex flex-col flex-1">
                        {/* ── Branch Switcher (Workspace mode) ────── */}
                        {ws.branches.length > 0 && (
                            <div className="hidden lg:block mb-6">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block px-1 flex items-center gap-1.5">
                                    <GitBranch className="w-3 h-3" /> Chi nhánh
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                                        value={ws.currentBranch?.id || ""}
                                        onChange={(e) => ws.setCurrentBranchId(e.target.value)}
                                    >
                                        {ws.branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <FolderSync className="w-4 h-4" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBranchModal(true)}
                                    className="mt-2 w-full flex items-center justify-center space-x-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Thêm Chi nhánh</span>
                                </button>
                            </div>
                        )}

                        {/* ── Legacy Project Switcher (localStorage fallback) ── */}
                        {ws.branches.length === 0 && (
                            <div className="hidden lg:block mb-6">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block px-1">Kế hoạch hiện tại</label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium cursor-pointer"
                                        value={currentProjectId || ""}
                                        onChange={(e) => switchProject(e.target.value)}
                                        disabled={!isLoaded}
                                    >
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                        <FolderSync className="w-4 h-4" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowProjectModal(true)}
                                    className="mt-2 w-full flex items-center justify-center space-x-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Tạo kế hoạch mới</span>
                                </button>
                            </div>
                        )}

                        {/* Mobile Branch/Project Icon */}
                        <div className="lg:hidden mb-4 flex justify-center">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600" title={ws.currentBranch?.name || projects.find(p => p.id === currentProjectId)?.name}>
                                <FolderSync className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-1.5 flex-1">
                            {NAV_ITEMS.map(item => {
                                const active = isActive(item);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-center lg:justify-start space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150
                                        ${active
                                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 shrink-0 ${active ? "text-blue-600" : ""}`} />
                                        <span className="hidden lg:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout Button */}
                        <div className="mt-auto pt-4 px-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center lg:justify-start space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                                <LogOut className="w-5 h-5 shrink-0" />
                                <span className="hidden lg:inline">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {isLoaded ? children : (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex flex-col items-center space-y-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</span>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ── Modals ── */}
            {showBranchModal && (
                <NameModal
                    title="Tạo Chi nhánh mới"
                    defaultValue={`Chi nhánh ${ws.branches.length + 1}`}
                    onConfirm={async (name) => {
                        setShowBranchModal(false);
                        await ws.createBranch(name);
                    }}
                    onCancel={() => setShowBranchModal(false)}
                />
            )}
            {showProjectModal && (
                <NameModal
                    title="Tạo Kế hoạch mới"
                    defaultValue={`Phương án nhánh ${projects.length + 1}`}
                    onConfirm={(name) => {
                        setShowProjectModal(false);
                        createProject(name);
                    }}
                    onCancel={() => setShowProjectModal(false)}
                />
            )}
        </div>
    );
}
