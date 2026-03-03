"use client";

import React from "react";
import { DollarSign, Landmark, TrendingUp, AlertTriangle, Building2, Wallet } from "lucide-react";
import { useFinance, YearData } from "@/context/FinanceContext";

export default function DashboardPage() {
  const { yearsData, isLoaded, formatVND } = useFinance();

  if (!isLoaded) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full border-b-2 border-blue-600 h-8 w-8"></div></div>;

  if (yearsData.length === 0) {
    return <div className="p-8 text-slate-500">Chưa có dữ liệu dự án. Vùi lòng tạo Kế hoạch mới.</div>;
  }

  // Prepare derived calculations for all years
  const derivedYears = yearsData.map((y, index) => {
    const prevY = index > 0 ? yearsData[index - 1] : null;

    // Income Statement
    const grossProfit = y.revenue - y.cogs;
    const ebitda = grossProfit - y.operatingExpenses;
    const ebit = ebitda - y.depreciation;
    const ebt = ebit - y.interestExpense;
    const netIncome = ebt - y.taxes;

    // Balance Sheet
    const currentAssets = y.cash + y.accountsReceivable + y.inventory;
    const totalAssets = currentAssets + y.propertyPlantEquipment;

    const currentLiabilities = y.accountsPayable + y.shortTermDebt;
    const totalLiabilities = currentLiabilities + y.longTermDebt;

    const startRetainedEarnings = prevY ? (prevY as any)._calculated.retainedEarnings : 0;
    const retainedEarnings = startRetainedEarnings + netIncome;
    const totalEquity = y.ownerCapital + retainedEarnings;

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = totalAssets === totalLiabilitiesAndEquity;

    // Cash Flow Statement (Simplified Indirect Method)
    let opsCF = 0, invCF = 0, finCF = 0, netCashFlow = 0;

    if (prevY) {
      const deltaAR = y.accountsReceivable - prevY.accountsReceivable;
      const deltaInv = y.inventory - prevY.inventory;
      const deltaAP = y.accountsPayable - prevY.accountsPayable;
      const deltaWC = deltaAR + deltaInv - deltaAP;

      opsCF = netIncome + y.depreciation - deltaWC;

      // CapEx = change in PPE + depreciation
      const capex = (y.propertyPlantEquipment - prevY.propertyPlantEquipment) + y.depreciation;
      invCF = -capex;

      const deltaDebt = (y.shortTermDebt - prevY.shortTermDebt) + (y.longTermDebt - prevY.longTermDebt);
      const deltaCapital = y.ownerCapital - prevY.ownerCapital;
      finCF = deltaDebt + deltaCapital;

      netCashFlow = opsCF + invCF + finCF;
    } else {
      // First year (assume starting from 0)
      opsCF = netIncome + y.depreciation - (y.accountsReceivable + y.inventory - y.accountsPayable);
      const capex = y.propertyPlantEquipment + y.depreciation;
      invCF = -capex;
      finCF = y.shortTermDebt + y.longTermDebt + y.ownerCapital;
      netCashFlow = opsCF + invCF + finCF;
    }

    return {
      ...y,
      _calculated: {
        grossProfit, ebitda, ebit, ebt, netIncome,
        currentAssets, totalAssets, currentLiabilities, totalLiabilities, retainedEarnings, totalEquity, totalLiabilitiesAndEquity, isBalanced,
        opsCF, invCF, finCF, netCashFlow
      }
    };
  });

  const currentYearData = derivedYears[derivedYears.length - 1];

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto pb-20">
      {/* ── KPI HIGHLIGHTS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Lợi nhuận ròng (Năm cuối)" value={formatVND(currentYearData._calculated.netIncome)} icon={<TrendingUp className="w-5 h-5" />} colorClass={currentYearData._calculated.netIncome >= 0 ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"} />
        <KPICard title="Tổng Tài sản" value={formatVND(currentYearData._calculated.totalAssets)} icon={<Building2 className="w-5 h-5" />} colorClass="text-blue-700 bg-blue-50 border-blue-200" />
        <KPICard title="Lưu chuyển tiền thuần" value={formatVND(currentYearData._calculated.netCashFlow)} icon={<Wallet className="w-5 h-5" />} colorClass="text-teal-700 bg-teal-50 border-teal-200" />
        <KPICard title="Tiền mặt hiện tại" value={formatVND(currentYearData.cash)} icon={<DollarSign className="w-5 h-5" />} colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
      </div>

      {/* BALANCE WARNING */}
      {!currentYearData._calculated.isBalanced && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <div className="text-sm font-medium">
            Cảnh báo: Bảng Cân đối Kế toán năm cuối không cân (Tổng TS = {formatVND(currentYearData._calculated.totalAssets)} khác Tổng Nguồn Vốn = {formatVND(currentYearData._calculated.totalLiabilitiesAndEquity)}). Chênh lệch: {formatVND(Math.abs(currentYearData._calculated.totalAssets - currentYearData._calculated.totalLiabilitiesAndEquity))}. Vui lòng kiểm tra lại số liệu Nhập.
          </div>
        </div>
      )}

      {/* ── 3 FINANCIAL STATEMENTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* 1. INCOME STATEMENT */}
        <div className="bg-white border md:col-span-1 xl:col-span-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-5 py-3 text-white font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Báo cáo Kết quả Kinh doanh (Income Statement)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 font-semibold text-slate-700 text-left w-64 border-r border-slate-200">Chỉ tiêu</th>
                  {derivedYears.map(y => <th key={y.id} className="px-4 py-2 text-right font-bold text-slate-900 min-w-[140px]">Năm {y.year}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <Row label="Doanh thu thuần" years={derivedYears} field="revenue" />
                <Row label="Giá vốn hàng bán (COGS)" years={derivedYears} field="cogs" negative />
                <Row label="Lợi nhuận gộp" years={derivedYears} field="grossProfit" calc bold standout="blue" />
                <Row label="Chi phí vận hành (OPEX)" years={derivedYears} field="operatingExpenses" negative />
                <Row label="EBITDA" years={derivedYears} field="ebitda" calc bold />
                <Row label="Khấu hao" years={derivedYears} field="depreciation" negative />
                <Row label="EBIT (Lợi nhuận HĐKD)" years={derivedYears} field="ebit" calc bold />
                <Row label="Chi phí lãi vay" years={derivedYears} field="interestExpense" negative />
                <Row label="EBT (LN trước thuế)" years={derivedYears} field="ebt" calc bold />
                <Row label="Thuế TNDN" years={derivedYears} field="taxes" negative />
                <Row label="Lợi nhuận ròng (Net Income)" years={derivedYears} field="netIncome" calc header standout="green" />
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. BALANCE SHEET */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-teal-600 px-5 py-3 text-white font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Cân đối Kế toán (Balance Sheet)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 font-semibold text-slate-700 text-left w-64 border-r border-slate-200">Tài sản & Nguồn vốn</th>
                  {derivedYears.map(y => <th key={y.id} className="px-4 py-2 text-right font-bold text-slate-900 min-w-[140px]">Năm {y.year}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <SectionTitle title="TÀI SẢN (ASSETS)" yearsCount={derivedYears.length} />
                <Row label="Tiền mặt" years={derivedYears} field="cash" />
                <Row label="Phải thu KH" years={derivedYears} field="accountsReceivable" />
                <Row label="Hàng tồn kho" years={derivedYears} field="inventory" />
                <Row label="TS Cố định (PPE)" years={derivedYears} field="propertyPlantEquipment" />
                <Row label="Tổng Tài sản" years={derivedYears} field="totalAssets" calc header standout="teal" />

                <SectionTitle title="NỢ PHẢI TRẢ (LIABILITIES)" yearsCount={derivedYears.length} />
                <Row label="Phải trả NCC" years={derivedYears} field="accountsPayable" />
                <Row label="Nợ vay ngắn hạn" years={derivedYears} field="shortTermDebt" />
                <Row label="Nợ vay dài hạn" years={derivedYears} field="longTermDebt" />
                <Row label="Tổng Nợ Phải trả" years={derivedYears} field="totalLiabilities" calc bold />

                <SectionTitle title="VỐN CHỦ SỞ HỮU (EQUITY)" yearsCount={derivedYears.length} />
                <Row label="Vốn góp" years={derivedYears} field="ownerCapital" />
                <Row label="Lợi nhuận chưa PP" years={derivedYears} field="retainedEarnings" calc />
                <Row label="Tổng Vốn CSH" years={derivedYears} field="totalEquity" calc bold />

                <Row label="Tổng Nguồn Vốn (NV = Nợ + Vốn)" years={derivedYears} field="totalLiabilitiesAndEquity" calc header standout="slate" />
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. CASH FLOW STATEMENT */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-full">
          <div className="bg-indigo-600 px-5 py-3 text-white font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Báo cáo LC Tiền tệ (Cash Flow)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm h-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 font-semibold text-slate-700 text-left w-64 border-r border-slate-200">Dòng Tiền</th>
                  {derivedYears.map(y => <th key={y.id} className="px-4 py-2 text-right font-bold text-slate-900 min-w-[140px]">Năm {y.year}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <Row label="Lưu chuyển từ Hoạt động KQKD" years={derivedYears} field="opsCF" calc bold />
                <Row label="Lưu chuyển từ HĐ Đầu tư (CapEx)" years={derivedYears} field="invCF" calc bold />
                <Row label="Lưu chuyển từ HĐ Tài chính" years={derivedYears} field="finCF" calc bold />
                <tr><td colSpan={derivedYears.length + 1} className="py-2"></td></tr>
                <Row label="Lưu chuyển tiền thuần trong kỳ" years={derivedYears} field="netCashFlow" calc header standout="indigo" />
                <Row label="Tiền mặt cuối kỳ (Balance Sheet)" years={derivedYears} field="cash" bold />
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Components ──────────────────────────────────────────

function KPICard({ title, value, icon, colorClass }: { title: string, value: string, icon: React.ReactNode, colorClass: string }) {
  return (
    <div className={`border rounded-2xl p-4 flex flex-col justify-center gap-2 ${colorClass}`}>
      <div className="flex items-center gap-2 opacity-80">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-2xl font-black tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function SectionTitle({ title, yearsCount }: { title: string, yearsCount: number }) {
  return (
    <tr className="bg-slate-100/50">
      <td colSpan={yearsCount + 1} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        {title}
      </td>
    </tr>
  );
}

function Row({ label, years, field, calc, negative, bold, header, standout }: { label: string, years: any[], field: string, calc?: boolean, negative?: boolean, bold?: boolean, header?: boolean, standout?: string }) {
  const fmt = (v: number) => {
    if (v === 0) return "-";
    return new Intl.NumberFormat("vi-VN").format(Math.abs(v));
  };

  const getStandoutClasses = () => {
    if (standout === "blue") return "bg-blue-50/50 border-y-2 border-blue-200 text-blue-900";
    if (standout === "green") return "bg-green-50/50 border-y-2 border-green-200 text-green-900";
    if (standout === "teal") return "bg-teal-50/50 border-y-2 border-teal-200 text-teal-900";
    if (standout === "slate") return "bg-slate-100 border-y-2 border-slate-300 text-slate-900";
    if (standout === "indigo") return "bg-indigo-50 border-y-2 border-indigo-200 text-indigo-900";
    return "";
  };

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${header ? "text-base uppercase tracking-wide" : ""} ${getStandoutClasses()}`}>
      <td className={`px-4 py-2.5 text-slate-700 border-r border-slate-100 ${bold || header ? "font-bold" : "font-medium"}`}>
        {label}
      </td>
      {years.map(y => {
        const val = calc ? y._calculated[field] : y[field];
        const isNegativeRender = negative ? val > 0 : val < 0;

        return (
          <td key={y.id} className={`px-4 py-2.5 text-right tabular-nums ${bold || header ? "font-bold" : ""} ${isNegativeRender ? "text-red-600" : "text-slate-900"}`}>
            {isNegativeRender && val !== 0 ? "- " : ""}{fmt(val as number)}
          </td>
        );
      })}
    </tr>
  );
}
