export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* ── Navbar ──────────────────────────────────── */}
            <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">SME Finance</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="#features" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Tính năng</a>
                        <a href="#pricing" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Bảng giá</a>
                        <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Đăng nhập</a>
                        <a href="/login" className="text-sm font-semibold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow-sm transition-colors">
                            Dùng thử miễn phí
                        </a>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ────────────────────────────── */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white" />
                <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 mb-6">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
                        <span>Phiên bản v1.0 — Miễn phí cho SME Việt Nam</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                        Quản trị tài chính<br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">tự động thông minh.</span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mt-6">
                        Thay thế hoàn toàn bảng tính Excel cũ kỹ. Chỉ cần ghi nhận thu chi hàng ngày — hệ thống sẽ tự động tổng hợp thành 3 Báo cáo Tài chính chuẩn quốc tế.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                        <a href="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                            Sử dụng ngay — Miễn phí
                        </a>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-full border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                            Tìm hiểu thêm ↓
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Social Proof Stats ──────────────────────── */}
            <section className="border-y border-slate-100 bg-slate-50/50">
                <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    <div><span className="text-3xl font-extrabold text-slate-900">500+</span><p className="text-sm text-slate-500 mt-1">Doanh nghiệp SME</p></div>
                    <div><span className="text-3xl font-extrabold text-slate-900">6</span><p className="text-sm text-slate-500 mt-1">Ngành nghề BOE</p></div>
                    <div><span className="text-3xl font-extrabold text-slate-900">3</span><p className="text-sm text-slate-500 mt-1">Báo cáo Tài chính</p></div>
                    <div><span className="text-3xl font-extrabold text-slate-900">99.9%</span><p className="text-sm text-slate-500 mt-1">Uptime Vercel</p></div>
                </div>
            </section>

            {/* ── Features ────────────────────────────────── */}
            <section id="features" className="max-w-6xl mx-auto px-4 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-extrabold text-slate-900">Mọi thứ bạn cần trong một nền tảng</h2>
                    <p className="text-base text-slate-500 mt-3 max-w-xl mx-auto">Được xây dựng riêng cho doanh nghiệp vừa và nhỏ Việt Nam.</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard icon="📊" title="BOE Simulator 6 Ngành" desc="Dự phóng Unit Economics F&B, TMĐT, Bán lẻ, Spa, Giáo dục, Giao hàng. Thay đổi input → P&L tự tính." />
                    <FeatureCard icon="📑" title="3 BCTC Tự động" desc="P&L, Cân đối Kế toán & Lưu chuyển Tiền tệ được đồng bộ tức thì từ mọi giao dịch nhập vào." />
                    <FeatureCard icon="🔒" title="Xác thực Supabase" desc="Đăng nhập/Đăng ký an toàn với chính sách bảo mật cấp doanh nghiệp. Deploy trên Vercel." />
                    <FeatureCard icon="💾" title="Lưu trữ Vĩnh viễn" desc="Dữ liệu giao dịch được lưu trên trình duyệt. Tải lại trang không mất dữ liệu." />
                    <FeatureCard icon="📈" title="Biểu đồ Trực quan" desc="Dashboard hiển thị biểu đồ Doanh thu vs Chi phí bằng Recharts — dễ nhìn, dễ hiểu." />
                    <FeatureCard icon="🇻🇳" title="Giao diện Tiếng Việt" desc="Toàn bộ thuật ngữ kế toán hiển thị chính xác bằng Tiếng Việt chuẩn. Định dạng VNĐ." />
                </div>
            </section>

            {/* ── Pricing ─────────────────────────────────── */}
            <section id="pricing" className="bg-slate-50 py-20">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-slate-900">Bảng giá đơn giản, minh bạch</h2>
                        <p className="text-base text-slate-500 mt-3">Bắt đầu miễn phí, nâng cấp khi bạn cần.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Free */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-900">Miễn phí</h3>
                            <div className="mt-4 flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold text-slate-900">0₫</span>
                                <span className="text-sm text-slate-500">/tháng</span>
                            </div>
                            <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-1">
                                <li className="flex items-start space-x-2"><span className="text-green-500 mt-0.5">✓</span><span>3 Báo cáo Tài chính</span></li>
                                <li className="flex items-start space-x-2"><span className="text-green-500 mt-0.5">✓</span><span>BOE Simulator 6 ngành</span></li>
                                <li className="flex items-start space-x-2"><span className="text-green-500 mt-0.5">✓</span><span>Lưu trữ trên trình duyệt</span></li>
                                <li className="flex items-start space-x-2"><span className="text-green-500 mt-0.5">✓</span><span>Biểu đồ Recharts</span></li>
                            </ul>
                            <a href="/login" className="mt-8 w-full text-center bg-white text-slate-700 font-bold py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                                Bắt đầu ngay
                            </a>
                        </div>
                        {/* Pro */}
                        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-blue-500 text-xs font-bold px-3 py-1 rounded-full">Phổ biến</div>
                            <h3 className="text-lg font-bold">Pro</h3>
                            <div className="mt-4 flex items-baseline space-x-1">
                                <span className="text-4xl font-extrabold">299.000₫</span>
                                <span className="text-sm text-slate-400">/tháng</span>
                            </div>
                            <ul className="mt-6 space-y-3 text-sm text-slate-300 flex-1">
                                <li className="flex items-start space-x-2"><span className="text-blue-400 mt-0.5">✓</span><span>Tất cả tính năng Miễn phí</span></li>
                                <li className="flex items-start space-x-2"><span className="text-blue-400 mt-0.5">✓</span><span>Cloud database (Supabase)</span></li>
                                <li className="flex items-start space-x-2"><span className="text-blue-400 mt-0.5">✓</span><span>Xuất PDF / Excel</span></li>
                                <li className="flex items-start space-x-2"><span className="text-blue-400 mt-0.5">✓</span><span>AI đọc hóa đơn (Gemini)</span></li>
                                <li className="flex items-start space-x-2"><span className="text-blue-400 mt-0.5">✓</span><span>Hỗ trợ ưu tiên</span></li>
                            </ul>
                            <a href="/login" className="mt-8 w-full text-center bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors">
                                Nâng cấp Pro
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────── */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-extrabold text-slate-900">Sẵn sàng nâng tầm quản trị tài chính?</h2>
                    <p className="text-base text-slate-500 mt-4">Tham gia cùng hàng trăm doanh nghiệp SME đã tin dùng SME Finance.</p>
                    <a href="/login" className="mt-8 inline-block px-10 py-4 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                        Tạo tài khoản miễn phí →
                    </a>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────── */}
            <footer className="border-t border-slate-100 py-10 bg-white">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                    <p className="text-sm text-slate-400">© 2026 SME Finance Builder. All rights reserved.</p>
                    <div className="flex items-center space-x-6 text-sm text-slate-400">
                        <a href="#" className="hover:text-slate-600 transition-colors">Điều khoản</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">Bảo mật</a>
                        <a href="#" className="hover:text-slate-600 transition-colors">Liên hệ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
            <span className="text-2xl">{icon}</span>
            <h3 className="text-base font-bold text-slate-900 mt-3 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
    );
}
