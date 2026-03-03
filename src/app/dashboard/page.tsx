"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { TrendingUp, TrendingDown, Layers, Wallet, CheckCircle, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function DashboardPage() {
  const { financialData: d, formatVND, transactions } = useFinance();

  const isBalanced =
    d.balanceSheet.assets.totalAssets ===
    d.balanceSheet.liabilities.totalLiabilities + d.balanceSheet.equity.totalEquity;

  const profitMargin = d.incomeStatement.revenue > 0
    ? ((d.incomeStatement.netIncome / d.incomeStatement.revenue) * 100).toFixed(1)
    : "0.0";

  // Aggregate data for chart
  const monthlyData = React.useMemo(() => {
    const agg = transactions.reduce((acc, tx) => {
      let mYear = "Unknown";
      if (tx.date.includes("/")) {
        const parts = tx.date.split("/");
        // Handle both D/M/YYYY and DD/MM/YYYY
        mYear = `${parts[1]}/${parts[2]}`;
      }
      if (!acc[mYear]) acc[mYear] = { name: mYear, DoanhThu: 0, ChiPhi: 0 };

      if (tx.type.startsWith("SALE_")) acc[mYear].DoanhThu += tx.amount;
      if (tx.type.startsWith("EXPENSE_") || tx.type === "DEPRECIATION") acc[mYear].ChiPhi += tx.amount;

      return acc;
    }, {} as Record<string, { name: string; DoanhThu: number; ChiPhi: number }>);

    return Object.values(agg).reverse(); // Chronological order
  }, [transactions]);

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-md rounded-xl text-sm">
          <p className="font-bold text-slate-800 mb-2">Tháng {label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 font-semibold">Doanh thu: {formatVND(payload[0].value)}</p>
            <p className="text-red-500 font-semibold">Chi phí: {formatVND(payload[1].value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng Quan Tài Chính</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng hợp từ <span className="font-semibold text-slate-700">{transactions.length}</span> giao dịch đã ghi nhận</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Doanh Thu" value={formatVND(d.incomeStatement.revenue)} icon={<DollarSign className="w-5 h-5" />} colorClass="bg-blue-50 text-blue-600 border-blue-100" />
        <KPICard label="Lợi Nhuận Ròng" value={formatVND(d.incomeStatement.netIncome)} icon={d.incomeStatement.netIncome >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          colorClass={d.incomeStatement.netIncome >= 0 ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"} subtitle={`Biên LN: ${profitMargin}%`} />
        <KPICard label="Tiền Mặt" value={formatVND(d.balanceSheet.assets.cash)} icon={<Wallet className="w-5 h-5" />} colorClass="bg-indigo-50 text-indigo-600 border-indigo-100" />
        <KPICard label="Tổng Tài Sản" value={formatVND(d.balanceSheet.assets.totalAssets)} icon={<Layers className="w-5 h-5" />} colorClass="bg-slate-50 text-slate-600 border-slate-200" />
      </div>

      {/* Balance Check */}
      <div className={`p-3 rounded-xl flex items-center space-x-2 text-sm font-medium border ${isBalanced ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
        {isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        <span>{isBalanced ? "Phương trình Kế Toán cân bằng" : "Phương trình Kế Toán chưa cân"}</span>
        <span className="font-mono text-xs ml-auto bg-white/60 px-2 py-1 rounded-md">
          TÀI SẢN = NỢ + VỐN CSH → {formatVND(d.balanceSheet.assets.totalAssets)} = {formatVND(d.balanceSheet.liabilities.totalLiabilities + d.balanceSheet.equity.totalEquity)}
        </span>
      </div>

      {/* ── Visual Chart ─────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
        <div className="flex items-center space-x-2 text-slate-800 font-bold mb-4">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          <h2>Tương quan Doanh thu & Chi phí</h2>
        </div>
        <div style={{ height: 350, width: '100%', minHeight: 350 }} className="text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `${(val / 1e6).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="ChiPhi" name="Chi Phí" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3 Statements Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ▶ Income Statement */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <h2 className="font-bold text-base">Kết Quả Kinh Doanh</h2>
          </div>
          <div className="p-5 space-y-3 flex-1 text-sm">
            <Row label="Doanh thu bán hàng" val={formatVND(d.incomeStatement.revenue)} />
            <Row label="Giá vốn hàng bán" val={`- ${formatVND(d.incomeStatement.cogs)}`} negative />
            <Divider />
            <Row label="Lợi nhuận gộp" val={formatVND(d.incomeStatement.grossProfit)} bold />
            <Row label="Chi phí vận hành" val={`- ${formatVND(d.incomeStatement.operatingExpenses)}`} negative />
            <Row label="Khấu hao" val={`- ${formatVND(d.incomeStatement.depreciation)}`} negative />
            <div className="mt-4 pt-3 border-t-2 border-slate-800 bg-slate-900 text-white px-4 py-3 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider">Lợi Nhuận Ròng</span>
              <span className={`text-lg font-black ${d.incomeStatement.netIncome >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatVND(d.incomeStatement.netIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* ▶ Balance Sheet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-white flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <h2 className="font-bold text-base">Cân Đối Kế Toán</h2>
          </div>
          <div className="p-5 space-y-4 flex-1 text-sm">
            {/* Assets */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tài Sản</h3>
              <Row label="Tiền mặt" val={formatVND(d.balanceSheet.assets.cash)} />
              <Row label="Phải thu khách hàng" val={formatVND(d.balanceSheet.assets.accountsReceivable)} />
              <Row label="Tài sản cố định" val={formatVND(d.balanceSheet.assets.propertyPlantEquipment)} />
              <div className="bg-blue-50 px-3 py-2 rounded-lg flex justify-between mt-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Tổng Tài Sản</span>
                <span className="font-bold text-blue-700">{formatVND(d.balanceSheet.assets.totalAssets)}</span>
              </div>
            </div>
            <hr className="border-slate-100" />
            {/* Liabilities */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Nợ Phải Trả</h3>
              <Row label="Phải trả người bán" val={formatVND(d.balanceSheet.liabilities.accountsPayable)} />
              <div className="bg-orange-50 px-3 py-2 rounded-lg flex justify-between mt-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Tổng Nợ</span>
                <span className="font-bold text-orange-700">{formatVND(d.balanceSheet.liabilities.totalLiabilities)}</span>
              </div>
            </div>
            <hr className="border-slate-100" />
            {/* Equity */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider">Vốn Chủ Sở Hữu</h3>
              <Row label="Vốn góp" val={formatVND(d.balanceSheet.equity.ownerCapital)} />
              <Row label="Lợi nhuận giữ lại" val={formatVND(d.balanceSheet.equity.retainedEarnings)} />
              <div className="bg-purple-50 px-3 py-2 rounded-lg flex justify-between mt-2">
                <span className="text-xs font-bold text-slate-800 uppercase">Tổng Vốn CSH</span>
                <span className="font-bold text-purple-700">{formatVND(d.balanceSheet.equity.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ▶ Cash Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <h2 className="font-bold text-base">Lưu Chuyển Tiền Tệ</h2>
          </div>
          <div className="p-5 space-y-3 flex-1 text-sm">
            <CashRow label="Hoạt động Kinh doanh" val={d.cashFlow.operations} format={formatVND} hint="Thu bán hàng − Chi phí tiền mặt" />
            <CashRow label="Hoạt động Đầu tư" val={d.cashFlow.investing} format={formatVND} hint="Chi mua tài sản / máy móc" />
            <CashRow label="Hoạt động Tài chính" val={d.cashFlow.financing} format={formatVND} hint="Tiền góp vốn / vay" />
            <div className="mt-4 pt-3 border-t-2 border-slate-800 bg-emerald-50 px-4 py-3 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Lưu chuyển tiền thuần</span>
              <span className={`text-lg font-black ${d.cashFlow.netCashFlow >= 0 ? "text-green-700" : "text-red-600"}`}>
                {d.cashFlow.netCashFlow > 0 ? "+" : ""}{formatVND(d.cashFlow.netCashFlow)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────
function KPICard({ label, value, icon, colorClass, subtitle }: { label: string; value: string; icon: React.ReactNode; colorClass: string; subtitle?: string }) {
  return (
    <div className={`${colorClass} border rounded-2xl p-4 flex flex-col space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
        {icon}
      </div>
      <span className="text-xl font-bold">{value}</span>
      {subtitle && <span className="text-xs opacity-70">{subtitle}</span>}
    </div>
  );
}

function Row({ label, val, bold, negative }: { label: string; val: string; bold?: boolean; negative?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-slate-600 ${bold ? "font-semibold text-slate-800" : ""}`}>{label}</span>
      <span className={`font-medium tabular-nums ${negative ? "text-red-600" : (bold ? "font-bold text-blue-700" : "text-slate-800")}`}>{val}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-slate-100 my-1" />;
}

function CashRow({ label, val, format, hint }: { label: string; val: number; format: (n: number) => string; hint: string }) {
  return (
    <div className="py-2 border-b border-slate-100">
      <div className="flex justify-between items-center">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className={`font-semibold tabular-nums ${val >= 0 ? "text-green-600" : "text-red-600"}`}>
          {val > 0 ? "+" : ""}{format(val)}
        </span>
      </div>
      <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}
