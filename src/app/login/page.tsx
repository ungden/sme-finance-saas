import { login, signup } from "@/app/login/actions";
import { Landmark, AlertCircle } from "lucide-react";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
    const params = await searchParams;
    const errorMessage = params?.message;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <a href="/" className="flex items-center space-x-2.5">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-sm">
                            <Landmark className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">SME Finance</span>
                    </a>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.</span>
                    </div>
                )}

                {/* Card */}
                <div className="bg-white p-8 border border-slate-200 shadow-sm rounded-3xl">
                    <h2 className="text-xl font-bold text-slate-900 text-center mb-6">Đăng nhập vào hệ thống</h2>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="password">
                                Mật khẩu
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-4 flex flex-col space-y-3">
                            <button
                                formAction={login}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Đăng nhập
                            </button>
                            <button
                                formAction={signup}
                                className="w-full bg-white text-slate-700 font-bold py-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                                Tạo tài khoản mới
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    <a href="/" className="underline hover:text-slate-600">← Về trang chủ</a>
                </p>
            </div>
        </div>
    );
}
