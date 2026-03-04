"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowRight, CheckCircle2, Landmark, BarChart3, Users,
    FileText, Zap, Shield, ChevronRight, MessageSquareQuote,
    Clock, Smartphone, LayoutDashboard, BrainCircuit, Receipt, Server, Target, TrendingUp, TrendingDown,
    Building, Package, Upload
} from "lucide-react";

export default function LandingHero() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    animation: marquee 25s linear infinite;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float 5s ease-in-out 2s infinite;
                }
            `}</style>

            {/* ── NAVBAR ── */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl py-3' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">RealProfit</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-blue-400 transition">Giải pháp</a>
                        <a href="#how-it-works" className="hover:text-blue-400 transition">Tính năng</a>
                        <a href="#testimonials" className="hover:text-blue-400 transition">Khách hàng</a>
                        <a href="#pricing" className="hover:text-blue-400 transition">Bảng giá</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block text-sm font-semibold text-slate-300 hover:text-white transition">
                            Đăng nhập
                        </Link>
                        <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20">
                            Dùng thử Miễn phí
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 isolate">
                {/* Background Ambient Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Phiên bản 2.0 — All-in-one Mini ERP cho SME
                    </div>
                    <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold text-white tracking-tight leading-[1.1] mb-8">
                        Từ "Mù Số Liệu" đến <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                            Dashboard Chuẩn IPO
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Chấm dứt kỷ nguyên quản trị bằng cảm tính. Tự động hóa Báo Cáo Tài Chính, Quản Lý Kho, Thuế và Chẩn Đoán Dòng Tiền bằng AI chỉ trong 1 nền tảng duy nhất.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)] flex items-center justify-center gap-2 group">
                            Bắt đầu dùng thử miễn phí <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-lg transition-all border border-slate-700 text-center flex items-center justify-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-400" /> Xem cách hoạt động
                        </a>
                    </div>
                </div>

                {/* Dynamic Mockup UI */}
                <div className="mt-20 max-w-6xl mx-auto relative perspective-1000">
                    {/* Floating Cards */}
                    <div className="absolute -left-12 top-20 z-20 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl animate-float hidden lg:flex items-center gap-4 w-64 backdrop-blur-xl">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Dự báo Biên LN Gộp</p>
                            <p className="text-lg font-bold text-white">+15.4% <span className="text-xs text-emerald-400 font-normal">Vượt mốc</span></p>
                        </div>
                    </div>

                    <div className="absolute -right-8 top-1/3 z-20 bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl animate-float-delayed hidden lg:flex items-center gap-4 w-56 backdrop-blur-xl">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">AI Cảnh Báo</p>
                            <p className="text-sm font-bold text-white">Cash Runway: 4 tháng</p>
                        </div>
                    </div>

                    {/* Main Mockup */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md p-2 md:p-4 shadow-2xl relative z-10 transform-gpu hover:scale-[1.01] transition-transform duration-500">
                        <div className="bg-slate-950 rounded-xl border border-white/5 overflow-hidden aspect-[16/10] relative flex flex-col">
                            {/* Browser Header */}
                            <div className="h-10 border-b border-white/10 bg-slate-900 flex items-center px-4 gap-2 shrink-0">
                                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80"></div><div className="w-3 h-3 rounded-full bg-yellow-500/80"></div><div className="w-3 h-3 rounded-full bg-green-500/80"></div></div>
                                <div className="ml-4 h-5 w-48 bg-slate-800 rounded-md flex items-center px-2"><Landmark className="w-3 h-3 text-slate-500 mr-2" /><div className="h-2 w-24 bg-slate-600 rounded"></div></div>
                            </div>

                            {/* App Content Fake */}
                            <div className="flex-1 flex bg-slate-950">
                                {/* Sidebar */}
                                <div className="w-48 border-r border-white/5 p-4 flex flex-col gap-4 hidden sm:flex pt-6">
                                    <div className="h-8 w-full bg-blue-600/20 rounded-lg border border-blue-500/30 mb-4"></div>
                                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-4 w-[70%] bg-slate-800 rounded"></div>)}
                                </div>
                                {/* Main Content */}
                                <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
                                    {/* Top Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-24 bg-slate-900 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                                                <div className="h-3 w-20 bg-slate-800 rounded"></div>
                                                <div className="h-6 w-32 bg-slate-700 rounded-sm"></div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Charts area */}
                                    <div className="flex-1 grid md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2 bg-slate-900 rounded-xl border border-white/5 p-4 flex flex-col">
                                            <div className="h-4 w-32 bg-slate-800 rounded mb-6"></div>
                                            <div className="flex-1 flex items-end gap-2 px-2">
                                                {[30, 45, 60, 40, 75, 55, 90, 80, 100].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 rounded-xl border border-white/5 p-4 flex flex-col gap-4">
                                            <div className="h-4 w-24 bg-slate-800 rounded"></div>
                                            <div className="w-full pt-[100%] rounded-full border-8 border-slate-800 relative">
                                                <div className="absolute inset-0 border-8 border-t-blue-500 border-r-indigo-500 border-b-emerald-500 border-l-transparent rounded-full rotate-45"></div>
                                            </div>
                                            <div className="h-4 w-full bg-slate-800 rounded mt-auto"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── SOCIAL PROOF (Marquee) ── */}
            <section className="py-10 border-y border-white/5 bg-slate-900/30 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-widest">
                        ĐƯỢC TIN DÙNG BỞI QUẢN LÝ TẠI HƠN 500+ DOANH NGHIỆP SME
                    </p>
                </div>
                <div className="flex w-[200%] gap-16 md:gap-32 opacity-40 grayscale animate-marquee hover:grayscale-0 transition duration-500">
                    {/* Duplicate set for infinite loop */}
                    {[1, 2].map((set) => (
                        <div key={set} className="flex gap-16 md:gap-32 items-center min-w-full justify-around">
                            <div className="text-xl font-bold flex items-center gap-2"><Landmark /> Techcombank SME</div>
                            <div className="text-xl font-bold flex items-center gap-2"><Building /> Vinasoy</div>
                            <div className="text-xl font-bold flex items-center gap-2"><Server /> FPT Retail</div>
                            <div className="text-xl font-bold flex items-center gap-2"><Users /> Golden Gate</div>
                            <div className="text-xl font-bold flex items-center gap-2"><Smartphone /> The Coffee House</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── THE PAIN ── */}
            <section className="py-24 max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Bạn đang điều hành CEO hay làm "khổ sai" cho bảng tính?</h2>
                <p className="text-slate-400 max-w-3xl mx-auto text-lg mb-16">
                    90% SME Việt Nam chết yểu trong 3 năm đầu không phải vì sản phẩm tồi, mà vì đứt gãy dòng tiền do quản trị tài chính mù mờ.
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-8 bg-slate-900/50 rounded-3xl border border-red-500/10 hover:border-red-500/30 transition text-left">
                        <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center mb-6"><BarChart3 className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Mù số liệu thực tế</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Dữ liệu phân mảnh ở 10 file Excel khác nhau. Cuối tháng không biết công ty đang lãi hay lỗ thực, tiền đang kẹt ở đâu.</p>
                    </div>
                    <div className="p-8 bg-slate-900/50 rounded-3xl border border-amber-500/10 hover:border-amber-500/30 transition text-left">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6"><TrendingDown className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Cạn dòng tiền ẩn</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Báo cáo Lãi nhưng két lại móm tiền. Hàng tồn kho ứ đọng, công nợ khó đòi gặm nhấm lợi nhuận mà bạn không hề hay biết.</p>
                    </div>
                    <div className="p-8 bg-slate-900/50 rounded-3xl border border-slate-700 hover:border-slate-500 transition text-left">
                        <div className="w-12 h-12 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center mb-6"><Users className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold mb-3 text-white">Lệ thuộc Kế toán</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Chủ DN không biết đọc báo cáo tài chính, phụ thuộc hoàn toàn vào ngôn ngữ chuyên môn phức tạp của kế toán viên.</p>
                    </div>
                </div>
            </section>

            {/* ── BENTO GRID FEATURES ── */}
            <section id="features" className="py-24 bg-slate-900/20 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-semibold mb-4">Mọi tính năng trong 1 tab</div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Hệ sinh thái Mini-ERP Toàn diện</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Thay thế 5 phần mềm rời rạc bằng 1 nền tảng duy nhất. Tất cả dữ liệu liên thông, tự động feed vào báo cáo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 auto-rows-[250px]">

                        {/* FEATURE 1 (Large) - AI CFO */}
                        <div className="col-span-1 md:col-span-2 md:row-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8 rounded-[32px] border border-indigo-500/20 shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition"></div>
                            <BrainCircuit className="w-10 h-10 text-indigo-400 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-3">AI CFO & Forecast</h3>
                            <p className="text-slate-400 mb-6 w-3/4">Tự động phân tích sức khỏe tài chính, phát hiện lổ hổng dòng tiền và dự báo doanh thu 3 năm tới bằng Linear Regression.</p>
                            <div className="absolute bottom-[-10px] right-[-10px] w-64 h-40 bg-slate-950/80 rounded-tl-2xl border-t border-l border-white/10 p-4 backdrop-blur shadow-2xl">
                                <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-red-500"></div><p className="text-xs font-bold text-slate-300">Cảnh báo Lợi Nhuận Gộp</p></div>
                                <p className="text-xs text-slate-500">Biên LN giảm xuống 20%. Cần xem lại giá vốn...</p>
                            </div>
                        </div>

                        {/* FEATURE 2 - Báo Cáo */}
                        <div className="col-span-1 md:col-span-2 bg-slate-900 p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
                            <LayoutDashboard className="w-8 h-8 text-blue-400 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">3 Báo cáo Kế toán Đa Năm</h3>
                            <p className="text-slate-400 text-sm">Hiển thị trực quan Balance Sheet, P&L, Cashflow. So sánh đa năm tức thì.</p>
                        </div>

                        {/* FEATURE 3 - Multi Branch */}
                        <div className="col-span-1 md:col-span-1 bg-slate-900 p-8 rounded-[32px] border border-white/5 flex flex-col justify-between">
                            <div>
                                <Building className="w-8 h-8 text-emerald-400 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Quản lý Đa Chi Nhánh</h3>
                                <p className="text-slate-400 text-sm leading-tight">Mỗi chi nhánh một BCTC riêng. Owner xem bảng tổng hợp hợp nhất toàn chuỗi.</p>
                            </div>
                        </div>

                        {/* FEATURE 4 - Invoices / CRM */}
                        <div className="col-span-1 md:col-span-1 bg-slate-900 p-8 rounded-[32px] border border-white/5 flex flex-col justify-between">
                            <div>
                                <Receipt className="w-8 h-8 text-amber-400 mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">Invoices & CRM</h3>
                                <p className="text-slate-400 text-sm leading-tight">Quản lý Thu Chi thực tế hàng ngày, tự động tính Phải Thu/Phải Trả.</p>
                            </div>
                        </div>

                        {/* FEATURE 5 (Wide) - Kho & Ngân sách */}
                        <div className="col-span-1 md:col-span-4 bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[32px] border border-white/5 flex items-center justify-between overflow-hidden relative">
                            <div className="max-w-xl z-10">
                                <div className="flex gap-4 mb-4">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-slate-300 border border-white/10"><Target className="w-3 h-3 text-pink-400" /> Ngân Sách</span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-slate-300 border border-white/10"><FileText className="w-3 h-3 text-blue-400" /> Thuế & VAT</span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-slate-300 border border-white/10"><Package className="w-3 h-3 text-orange-400" /> Quản lý Kho</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Không chỉ là báo cáo, đó là vận hành</h3>
                                <p className="text-slate-400">Kiểm soát ngân sách chống lạm chi (Budget vs Actual), tự động tính Giá vốn tồn kho và hệ thống cảnh báo lịch nộp Thuế VAT hàng quý.</p>
                            </div>
                            <div className="hidden md:flex gap-4 opacity-50 absolute right-10">
                                <div className="w-32 h-32 rounded-2xl bg-slate-800 border border-white/10 rotate-12 flex items-center justify-center shadow-xl"><Landmark className="w-8 h-8 text-slate-600" /></div>
                                <div className="w-32 h-32 rounded-2xl bg-slate-800 border border-white/10 -rotate-6 flex items-center justify-center shadow-xl mt-12"><FileText className="w-8 h-8 text-slate-600" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Đơn giản hóa quản trị trong 3 bước</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 z-0"></div>

                    {[
                        { step: "01", icon: <Upload className="w-6 h-6" />, title: "Import Dữ liệu", desc: "Kéo thả file Excel hoặc nhập liệu dễ dàng trên thiết bị bất kỳ. RealProfit chuẩn hóa data tự động." },
                        { step: "02", icon: <Server className="w-6 h-6" />, title: "Data Flow Tự Động", desc: "Hóa đơn, Lương, Kho tự động đổ về các tài khoản kế toán hợp nhất." },
                        { step: "03", icon: <CheckCircle2 className="w-6 h-6" />, title: "Báo cáo & Phân tích", desc: "Mở Dashboard lên xem. Mọi insight AI, cảnh báo, P&L đã sẵn sàng." },
                    ].map((s, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-950 shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center text-blue-500 mb-6 text-xl font-bold font-mono">
                                {s.step}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── TESTIMONIALS ── */}
            <section id="testimonials" className="py-24 bg-slate-900/40 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Nghe lời người thật việc thật</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: "Anh Tuấn Nguyễn", role: "CEO Chuỗi F&B (12 cửa hàng)", text: "Tính năng Consolidated (Tổng hợp chi nhánh) là cứu tinh của tôi. Trước đây tôi phải đợi kế toán 15 ngày mới gom xong số liệu. Giờ tôi xem P&L toàn chuỗi theo thời gian thực." },
                            { name: "Chị Lan Phạm", role: "Founder Agency Marketing", text: "AI CFO Insights chỉ ra tôi đang 'đốt' quá mức vào chi phí vận hành cố định. Tôi đã kịp cắt giảm trước khi dòng tiền bị bóp cứng. Đáng từng xu!" },
                            { name: "Anh Hoàng Bùi", role: "Giám đốc Phân phối Kim Khí", text: "Module Quản lý Kho kết hợp với nhập hóa đơn tự động giúp tính COGS chính xác tuyệt đối. Tôi tiết kiệm được 1 suất lương nhân viên kho." }
                        ].map((t, i) => (
                            <div key={i} className="bg-slate-900 p-8 rounded-3xl border border-white/5 hover:border-blue-500/30 transition-colors">
                                <MessageSquareQuote className="w-8 h-8 text-slate-700 mb-6" />
                                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">{t.name.charAt(0)}</div>
                                    <div>
                                        <p className="text-white font-bold text-sm">{t.name}</p>
                                        <p className="text-slate-500 text-xs">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ── */}
            <section id="pricing" className="py-24 max-w-5xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Đầu tư nhỏ, Giá trị khổng lồ</h2>
                    <p className="text-slate-400">Rẻ hơn <span className="text-white font-bold line-through">1 vé xem phim</span> 1 cốc cafe Starbucks mỗi tháng.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8 text-left relative">
                    {/* Background glow for Pro pricing */}
                    <div className="hidden md:block absolute top-1/2 right-[25%] -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/30 rounded-full blur-[100px] -z-10"></div>

                    <div className="bg-slate-900/80 backdrop-blur-md p-10 rounded-[40px] border border-white/10 flex flex-col">
                        <h3 className="text-2xl font-bold text-white mb-2">Gói Cơ Bản (Local)</h3>
                        <p className="text-sm text-slate-500 mb-6">Dành cho chủ DN nhỏ muốn thử nghiệm.</p>
                        <div className="text-5xl font-black text-white mb-8">0đ</div>
                        <ul className="space-y-4 mb-10 flex-1 text-sm font-medium">
                            <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> Quản lý 1 Doanh nghiệp</li>
                            <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> 3 Báo cáo Kế toán chuẩn</li>
                            <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> AI Insights cơ bản</li>
                            <li className="flex gap-3 text-slate-300"><CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0" /> Lưu trữ Local Storage (Chỉ trên máy bạn)</li>
                        </ul>
                        <Link href="/login" className="block text-center w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition">Bắt đầu miễn phí</Link>
                    </div>

                    <div className="bg-gradient-to-b from-blue-900/60 to-slate-900 p-10 rounded-[40px] border-2 border-blue-500/40 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
                        <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-blue-400 to-emerald-400"></div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-bold text-white">Gói Chuyên Nghiệp</h3>
                            <span className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-full font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">PHỔ BIẾN NHẤT</span>
                        </div>
                        <p className="text-sm text-blue-200/60 mb-6">Trải nghiệm Full ERP Cloud Hệ sinh thái.</p>
                        <div className="text-5xl font-black text-white mb-2 flex items-end gap-2">299k <span className="text-lg text-blue-200/50 font-normal mb-1">/tháng</span></div>
                        <p className="text-xs text-emerald-400 font-medium mb-8">Thanh toán theo năm giảm sốc 30%</p>
                        <ul className="space-y-4 mb-10 flex-1 text-sm font-medium">
                            <li className="flex gap-3 text-blue-50"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <b>Tất cả của gói Cơ Bản</b></li>
                            <li className="flex gap-3 text-blue-50"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> <b>Mở khóa FULL 10 MODULES</b> (Kho, Ngân sách, Thuế...)</li>
                            <li className="flex gap-3 text-blue-50"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Cloud Sync (Supabase) Đa thiết bị</li>
                            <li className="flex gap-3 text-blue-50"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Quản lý Multi-Branch (Nhiều chi nhánh)</li>
                            <li className="flex gap-3 text-blue-50"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" /> Forecast AI 3 Năm & Xuất Invest PDF</li>
                        </ul>
                        <Link href="/login" className="block text-center w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition shadow-lg shadow-blue-500/30">Nâng cấp Pro ngay</Link>
                    </div>
                </div>
            </section>

            {/* ── FAQ & BOTTOM CTA ── */}
            <section className="py-24 border-t border-white/5 bg-slate-900/20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Câu hỏi thường gặp</h2>
                    <div className="grid gap-6 mb-24">
                        {[
                            { q: "Tôi không có nghiệp vụ kế toán thì có dùng được không?", a: "Hoàn toàn được. RealProfit sinh ra dành cho CEO/Owner. Thuật ngữ và biểu mẫu được tối giản hóa, AI CFO sẽ tự giải thích các con số cho bạn bằng ngôn ngữ kinh doanh." },
                            { q: "Dữ liệu của công ty tôi có bảo mật không?", a: "Với gói Cơ Bản, dữ liệu 100% nằm trên trình duyệt (máy) của bạn. Với gói Pro, dữ liệu mã hóa trên hệ thống Supabase theo chuẩn bảo mật đa tầng, không ai được truy cập ngoài bạn." },
                            { q: "Chuyển dữ liệu từ Excel cũ vào phần mềm có lâu không?", a: "Phần mềm có sẵn module Import CSV. Bạn chỉ cần kéo thả file excel, hệ thống tự động nhận diện các cột (Ngày, Số tiền, Mô tả) và đưa vào hệ thống trong vài giây." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-blue-500" />{faq.q}</h4>
                                <p className="text-slate-400 text-sm pl-6 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] p-12 text-center relative overflow-hidden shadow-2xl shadow-blue-900/50">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Sẵn sàng scale-up doanh nghiệp?</h2>
                        <p className="text-blue-100 mb-10 text-lg relative z-10">Đăng ký tài khoản trong 30 giây. Hủy bất cứ lúc nào.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-900 px-10 py-5 rounded-full font-black text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transition-all relative z-10">
                            Truy cập Dashboard <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Landmark className="w-6 h-6 text-slate-600" />
                    <span className="font-bold text-slate-400 text-lg">RealProfit</span>
                </div>
                <p className="mb-2">Phần mềm quản trị tài chính số 1 cho SME Việt Nam.</p>
                <div className="flex justify-center gap-6 mt-6">
                    <a href="#" className="hover:text-white transition">Điều khoản</a>
                    <a href="#" className="hover:text-white transition">Bảo mật</a>
                    <a href="#" className="hover:text-white transition">Hỗ trợ</a>
                </div>
                <p className="mt-8 opacity-50">© {new Date().getFullYear()} RealProfit. All rights reserved.</p>
            </footer>
        </div>
    );
}
