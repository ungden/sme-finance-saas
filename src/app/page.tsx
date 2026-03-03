"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark, TrendingUp, BarChart3, Users, Building, FileText } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-blue-500/30">
            {/* ── NAVBAR ── */}
            <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">RealProfit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-white transition">Tính năng</a>
                        <a href="#demo" className="hover:text-white transition">Giao diện</a>
                        <a href="#pricing" className="hover:text-white transition">Bảng giá</a>
                    </div>
                    <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all border border-white/10">
                        Đăng nhập
                    </Link>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden mx-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        RealProfit V2 - Sẵn sàng cho SME
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-8">
                        Từ "Mù Số Liệu" đến <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Dashboard Chuẩn IPO</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Phần mềm Quản trị Nguồn lực & Tài chính Doanh nghiệp (Mini-ERP). Tự động lập 3 Báo cáo Kế toán, chẩn đoán sức khỏe dòng tiền bằng AI chỉ trong 5 phút.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 group">
                            Bắt đầu miễn phí <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold text-lg transition-all border border-white/10 text-center">
                            Xem Demo
                        </a>
                    </div>
                </div>
            </section>

            {/* ── DASHBOARD PREVIEW ── */}
            <section id="demo" className="max-w-6xl mx-auto px-6 pb-24 relative z-10">
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-2 md:p-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="bg-slate-950 rounded-xl border border-white/5 overflow-hidden aspect-video relative">
                        {/* Mock wireframe of Dashboard */}
                        <div className="absolute top-0 w-full h-10 border-b border-white/10 bg-slate-900 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <div className="ml-4 h-4 w-48 bg-white/5 rounded"></div>
                        </div>
                        <div className="p-6 pt-16 flex gap-6 h-full">
                            <div className="w-48 hidden md:flex flex-col gap-4 border-r border-white/5 pr-6">
                                <div className="h-6 w-32 bg-white/10 rounded"></div>
                                <div className="h-6 w-24 bg-blue-500/20 rounded"></div>
                                <div className="h-6 w-28 bg-white/5 rounded"></div>
                                <div className="h-6 w-20 bg-white/5 rounded"></div>
                            </div>
                            <div className="flex-1 flex flex-col gap-6">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
                                    <div className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
                                    <div className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
                                    <div className="h-24 bg-white/5 rounded-xl border border-white/5"></div>
                                </div>
                                <div className="flex-1 flex gap-6">
                                    <div className="flex-[2] bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col">
                                        <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                                        <div className="flex-1 flex items-end gap-2">
                                            {[40, 70, 45, 90, 65, 100].map((h, i) => (
                                                <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gradient-to-br from-indigo-500/20 to-blue-600/20 rounded-xl border border-white/10 p-4">
                                        <div className="h-6 w-32 bg-white/20 rounded mb-4"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 w-full bg-white/10 rounded"></div>
                                            <div className="h-4 w-4/5 bg-white/10 rounded"></div>
                                            <div className="h-4 w-full bg-white/10 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CORE FEATURES ── */}
            <section id="features" className="py-24 border-t border-white/5 bg-slate-900/20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Mọi thứ bạn cần để điều hành</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Không dùng bảng tính lộn xộn, RealProfit tích hợp toàn bộ luồng Tài chính & Resource trong một nền tảng.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BarChart3 />}
                            title="Analytics Đa Năm"
                            desc="Hệ thống tự động dựng 3 Bảng Cân đối kế toán, KQKD và LCTT dựa trên grid nhập liệu thân thiện."
                        />
                        <FeatureCard
                            icon={<Users />}
                            title="Quản trị ERP & Nhân sự"
                            desc="Module HR & Thiết bị nội bộ. Quỹ lương tự cộng dồn vào OPEX thay vì nhập tay bóc tách thủ công."
                        />
                        <FeatureCard
                            icon={<FileText />}
                            title="Sẵn sàng Gọi vốn"
                            desc="Khởi chạy báo cáo AI CFO Insights nhận diện rủi ro dòng tiền và xuất File PDF chuẩn Pitch Deck trong 1 click."
                        />
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="py-24 border-t border-white/5">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Bắt đầu hoàn toàn Miễn phí</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
                        {/* Free Tier */}
                        <div className="bg-slate-900 p-8 rounded-3xl border border-white/10 flex flex-col">
                            <h3 className="text-2xl font-bold text-white mb-2">Gói Cơ Bản</h3>
                            <div className="text-4xl font-black text-white mb-6">0đ <span className="text-sm text-slate-500 font-normal">/tháng</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Quản lý 1 Doanh nghiệp</li>
                                <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> 3 Báo cáo Kế toán chuẩn</li>
                                <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" /> Local Storage 100% bảo mật</li>
                            </ul>
                            <Link href="/login" className="block text-center w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition">Bắt đầu ngay</Link>
                        </div>
                        {/* Pro Tier */}
                        <div className="bg-gradient-to-b from-blue-900/50 to-slate-900 p-8 rounded-3xl border border-blue-500/30 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                            <h3 className="text-2xl font-bold text-white mb-2 flex justify-between items-center">
                                Gói Chuyên Nghiệp
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">MỚI</span>
                            </h3>
                            <div className="text-4xl font-black text-white mb-6">299k <span className="text-sm text-blue-200/50 font-normal">/tháng</span></div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> KHÔNG GIỚI HẠN Công ty</li>
                                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Cloud Sync đa thiết bị</li>
                                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Module HR & Facilities (ERP)</li>
                                <li className="flex gap-3 text-blue-100"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Xuất Báo Cáo PDF Investor</li>
                            </ul>
                            <Link href="/login" className="block text-center w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20">Nâng cấp liền</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Landmark className="w-5 h-5 text-slate-600" />
                    <span className="font-bold text-slate-400">RealProfit</span>
                </div>
                <p>© {new Date().getFullYear()} SME Finance SaaS Platform. Developed for Next.js.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition duration-300 group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
        </div>
    )
}
