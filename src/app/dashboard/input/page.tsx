"use client";

import React from "react";
import { Plus, Save, CalendarDays, DollarSign, Building2 } from "lucide-react";
import { useFinance, YearData } from "@/context/FinanceContext";

export default function InputPage() {
    const { yearsData, isLoaded, updateYearData, addYear, formatVND } = useFinance();

    if (!isLoaded) return <div className="p-8"><div className="animate-pulse flex space-x-4"><div className="rounded-full bg-slate-200 h-10 w-10"></div><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div></div>;

    const handleAddYear = () => {
        if (yearsData.length === 0) {
            addYear(new Date().getFullYear());
            return;
        }
        const lastYear = yearsData[yearsData.length - 1].year;
        addYear(lastYear + 1);
    };

    return (
        <div className="space-y-6 max-w-screen-2xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-blue-600" />
                        Nhập liệu Báo cáo Tài chính
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Dữ liệu được lưu tự động. Nhập chính xác các thông số để hệ thống dựng 3 BCTC chuẩn.</p>
                </div>
                <button
                    onClick={handleAddYear}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>Thêm năm tiếp theo</span>
                </button>
            </div>

            {/* Input Grid Area */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 font-semibold text-slate-700 w-64 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Hạng mục</th>
                                {yearsData.map(y => (
                                    <th key={y.id} className="px-4 py-3 font-bold text-slate-900 text-right min-w-[160px]">Năm {y.year}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* SECTION: INCOME STATEMENT */}
                            <tr>
                                <td colSpan={yearsData.length + 1} className="bg-blue-50/50 px-4 py-2 font-bold text-blue-800 text-xs uppercase tracking-wider flex items-center gap-2 sticky left-0">
                                    <DollarSign className="w-4 h-4" /> Kết quả Kinh doanh (P&L)
                                </td>
                            </tr>
                            <InputRow label="Doanh thu thuần" field="revenue" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Giá vốn hàng bán (COGS)" field="cogs" yearsData={yearsData} update={updateYearData} negative />
                            <InputRow label="Chi phí vận hành (OPEX)" field="operatingExpenses" yearsData={yearsData} update={updateYearData} negative />
                            <InputRow label="Khấu hao" field="depreciation" yearsData={yearsData} update={updateYearData} negative />
                            <InputRow label="Chi phí lãi vay" field="interestExpense" yearsData={yearsData} update={updateYearData} negative />
                            <InputRow label="Thuế TNDN" field="taxes" yearsData={yearsData} update={updateYearData} negative />

                            {/* SECTION: BALANCE SHEET */}
                            <tr>
                                <td colSpan={yearsData.length + 1} className="bg-emerald-50/50 px-4 py-2 font-bold text-emerald-800 text-xs uppercase tracking-wider flex items-center gap-2 sticky left-0 border-t border-slate-200 mt-4">
                                    <Building2 className="w-4 h-4" /> Bảng Cân đối Kế toán (Balance Sheet)
                                </td>
                            </tr>
                            <tr className="bg-slate-50/30"><td colSpan={yearsData.length + 1} className="px-6 py-1 text-xs font-semibold text-slate-500 italic sticky left-0">TÀI SẢN</td></tr>
                            <InputRow label="Tiền và Tương đương tiền" field="cash" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Phải thu khách hàng" field="accountsReceivable" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Hàng tồn kho" field="inventory" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Tài sản Cố định (PPE)" field="propertyPlantEquipment" yearsData={yearsData} update={updateYearData} />

                            <tr className="bg-slate-50/30 border-t border-slate-100"><td colSpan={yearsData.length + 1} className="px-6 py-1 text-xs font-semibold text-slate-500 italic sticky left-0">NỢ PHẢI TRẢ</td></tr>
                            <InputRow label="Phải trả nhà cung cấp" field="accountsPayable" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Nợ vay ngắn hạn" field="shortTermDebt" yearsData={yearsData} update={updateYearData} />
                            <InputRow label="Nợ vay dài hạn" field="longTermDebt" yearsData={yearsData} update={updateYearData} />

                            <tr className="bg-slate-50/30 border-t border-slate-100"><td colSpan={yearsData.length + 1} className="px-6 py-1 text-xs font-semibold text-slate-500 italic sticky left-0">VỐN CHỦ SỞ HỮU</td></tr>
                            <InputRow label="Vốn góp Chủ sở hữu" field="ownerCapital" yearsData={yearsData} update={updateYearData} />
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end p-2 opacity-50 text-xs text-slate-500 items-center gap-1">
                <Save className="w-3 h-3" /> Tự động lưu trữ trên trình duyệt
            </div>
        </div>
    );
}

function InputRow({
    label, field, yearsData, update, negative
}: {
    label: string, field: keyof Omit<YearData, "id" | "year">, yearsData: YearData[], update: (y: number, f: any, v: number) => void, negative?: boolean
}) {
    return (
        <tr className="hover:bg-slate-50 transition-colors group">
            <td className="px-4 py-2.5 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 transition-colors">
                {label}
            </td>
            {yearsData.map(y => {
                const val = y[field] as number;
                return (
                    <td key={y.id} className="px-3 py-1.5 align-middle">
                        <NumberInput
                            value={val}
                            onChange={(num) => update(y.year, field, num)}
                            negative={negative}
                        />
                    </td>
                );
            })}
        </tr>
    );
}

function NumberInput({ value, onChange, negative }: { value: number; onChange: (v: number) => void; negative?: boolean }) {
    // Determine the color based on if it's considered an outflow/negative field, or literally negative.
    const displayColor = (negative && value > 0) ? "text-red-600" : value < 0 ? "text-red-600" : "text-slate-900";
    const displayValue = value === 0 ? "" : new Intl.NumberFormat("vi-VN").format(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^\d]/g, "");
        if (rawValue === "") {
            onChange(0);
            return;
        }
        onChange(parseInt(rawValue, 10));
    };

    return (
        <div className="relative flex items-center">
            {negative && value > 0 && <span className="absolute left-3 text-red-500 text-sm font-bold">-</span>}
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                placeholder="0"
                className={`w-full ${negative && value > 0 ? "pl-7" : "px-3"} pr-3 py-1.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right tabular-nums text-sm bg-white font-medium ${displayColor} shadow-sm focus:shadow-md transition-shadow`}
            />
        </div>
    );
}
