"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, Landmark, TrendingUp, LogOut, Loader2, Plus, FolderSync, Users, Building, BarChart3, GitBranch, FileText, UserCircle, Upload, Target, Package, Receipt, Clock } from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { createClient } from "@/utils/supabase/client";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Tổng Quan", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/invoices", label: "Hóa đơn", icon: FileText, exact: false },
    { href: "/dashboard/contacts", label: "Đối tác", icon: UserCircle, exact: false },
    { href: "/dashboard/input", label: "Nhập Liệu", icon: BookOpen, exact: false },
    { href: "/dashboard/hr", label: "Nhân Sự", icon: Users, exact: false },
    { href: "/dashboard/facilities", label: "Mặt Bằng", icon: Building, exact: false },
    { href: "/dashboard/inventory", label: "Kho", icon: Package, exact: false },
    { href: "/dashboard/budget", label: "Ngân sách", icon: Target, exact: false },
    { href: "/dashboard/tax", label: "Thuế & VAT", icon: Receipt, exact: false },
    { href: "/dashboard/import", label: "Import CSV", icon: Upload, exact: false },
    { href: "/dashboard/consolidated", label: "Tổng Hợp", icon: BarChart3, exact: false },
    { href: "/dashboard/boe", label: "BOE", icon: TrendingUp, exact: false },
    { href: "/dashboard/audit", label: "Nhật ký", icon: Clock, exact: false },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isLoaded, projects, currentProjectId, switchProject, createProject } = useFinance();
    const ws = useWorkspace();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
    };

    const isActive = (item: typeof NAV_ITEMS[0]) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
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
                                    onClick={async () => {
                                        const name = prompt("Tên Chi nhánh mới:", `Chi nhánh ${ws.branches.length + 1}`);
                                        if (name) await ws.createBranch(name);
                                    }}
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
                                    onClick={() => {
                                        const name = prompt("Nhập tên Kế hoạch dự phóng mới:", `Phương án nhánh ${projects.length + 1}`);
                                        if (name) createProject(name);
                                    }}
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
        </div>
    );
}
