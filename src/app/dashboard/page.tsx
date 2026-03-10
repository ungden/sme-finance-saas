"use client";

import React, { useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  DollarSign, Landmark, TrendingUp, AlertTriangle, Building2, Wallet,
  Download, CheckCircle2, Info, Lightbulb, BookOpen, Users, Building,
  BrainCircuit, BarChart3, Coffee, Store, ShoppingBag, Scissors,
  GraduationCap, Truck, ArrowRight, Target, Layers,
} from "lucide-react";
import { useFinance } from "@/context/FinanceContext";
import { useFinanceOS } from "@/context/FinanceOSContext";
import { generateInsights, InsightItem } from "@/utils/ai-insights";
import { INDUSTRY_TEMPLATES, getTemplateYearData } from "@/lib/templates";
import type { YearData } from "@/lib/types";

const DashboardCharts = dynamic(() => import("@/components/charts/DashboardCharts"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />,
});

// ── Icons for industry templates ──
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  fnb: <Coffee className="w-5 h-5" />,
  retail: <Store className="w-5 h-5" />,
  ecommerce: <ShoppingBag className="w-5 h-5" />,
  salon: <Scissors className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  logistics: <Truck className="w-5 h-5" />,
};

// ── Derive calculated fields from a single YearData ──
function deriveFromYearData(y: YearData, prevRaw?: YearData | null, prevRetainedEarnings?: number) {
  const grossProfit = y.revenue - y.cogs;
  const ebitda = grossProfit - y.operatingExpenses;
  const ebit = ebitda - y.depreciation;
  const ebt = ebit - y.interestExpense;
  const netIncome = ebt - y.taxes;

  const currentAssets = y.cash + y.accountsReceivable + y.inventory;
  const totalAssets = currentAssets + y.propertyPlantEquipment;
  const currentLiabilities = y.accountsPayable + y.shortTermDebt;
  const totalLiabilities = currentLiabilities + y.longTermDebt;

  const retainedEarnings = (prevRetainedEarnings || 0) + netIncome;
  const totalEquity = y.ownerCapital + retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const isBalanced = totalAssets === totalLiabilitiesAndEquity;

  let opsCF = 0, invCF = 0, finCF = 0, netCashFlow = 0;
  if (prevRaw) {
    const deltaWC = (y.accountsReceivable - prevRaw.accountsReceivable) + (y.inventory - prevRaw.inventory) - (y.accountsPayable - prevRaw.accountsPayable);
    opsCF = netIncome + y.depreciation - deltaWC;
    invCF = -((y.propertyPlantEquipment - prevRaw.propertyPlantEquipment) + y.depreciation);
    finCF = (y.shortTermDebt - prevRaw.shortTermDebt) + (y.longTermDebt - prevRaw.longTermDebt) + (y.ownerCapital - prevRaw.ownerCapital);
    netCashFlow = opsCF + invCF + finCF;
  } else {
    opsCF = netIncome + y.depreciation - (y.accountsReceivable + y.inventory - y.accountsPayable);
    invCF = -(y.propertyPlantEquipment + y.depreciation);
    finCF = y.shortTermDebt + y.longTermDebt + y.ownerCapital;
    netCashFlow = opsCF + invCF + finCF;
  }

  return {
    ...y,
    _calculated: {
      grossProfit, ebitda, ebit, ebt, netIncome,
      currentAssets, totalAssets, currentLiabilities, totalLiabilities,
      retainedEarnings, totalEquity, totalLiabilitiesAndEquity, isBalanced,
      opsCF, invCF, finCF, netCashFlow,
    },
  };
}

export default function DashboardPage() {
  const { yearsData, isLoaded, formatVND, planYearData, setPlanYearData, createProject, switchProject } = useFinance();
  const fos = useFinanceOS();

  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isLoaded) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full border-b-2 border-blue-600 h-8 w-8"></div></div>;

  // Check if data is "empty" (all zeros or no data)
  const isDataEmpty = yearsData.length === 0 || yearsData.every(y =>
    y.revenue === 0 && y.cogs === 0 && y.operatingExpenses === 0 && y.cash === 0 && y.ownerCapital === 0
  );

  // If no plan and no real data → show onboarding
  const showOnboarding = isDataEmpty && !planYearData;

  return (
    <DashboardContent
      yearsData={yearsData}
      planYearData={planYearData}
      setPlanYearData={setPlanYearData}
      actualYearData={fos.actualYearData}
      formatVND={formatVND}
      showOnboarding={showOnboarding}
      isExporting={isExporting}
      setIsExporting={setIsExporting}
      dashboardRef={dashboardRef}
      createProject={createProject}
      switchProject={switchProject}
      activePlan={fos.activePlan}
    />
  );
}

// Separated to keep the hook calls at top level
function DashboardContent({
  yearsData, planYearData, setPlanYearData, actualYearData,
  formatVND, showOnboarding, isExporting, setIsExporting, dashboardRef,
  createProject, switchProject, activePlan,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yearsData: YearData[]; planYearData: YearData | null; setPlanYearData: (d: YearData | null) => void; actualYearData: YearData | null;
  formatVND: (v: number) => string; showOnboarding: boolean;
  isExporting: boolean; setIsExporting: (v: boolean) => void;
  dashboardRef: React.RefObject<HTMLDivElement | null>;
  createProject: (name: string, initialYears?: YearData[]) => string;
  switchProject: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activePlan: any;
}) {

  // ── Derive plan + actual single-year data ──
  const derivedPlan = useMemo(() => {
    if (!planYearData) return null;
    return deriveFromYearData(planYearData);
  }, [planYearData]);

  const derivedActual = useMemo(() => {
    if (!actualYearData) return null;
    return deriveFromYearData(actualYearData);
  }, [actualYearData]);

  // ── Legacy multi-year derivation (for charts + fallback) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const derivedYears: any[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];
    for (let index = 0; index < yearsData.length; index++) {
      const y = yearsData[index];
      const prevRaw = index > 0 ? yearsData[index - 1] : null;
      const prevRetained = index > 0 ? result[index - 1]._calculated.retainedEarnings : 0;
      result.push(deriveFromYearData(y, prevRaw, prevRetained));
    }
    return result;
  }, [yearsData]);

  const hasPlanActualMode = !!derivedPlan;
  const currentYearData = hasPlanActualMode
    ? derivedPlan
    : (derivedYears.length > 0 ? derivedYears[derivedYears.length - 1] : null);

  const aiInsights = useMemo(() => {
    if (derivedYears.length > 0) return generateInsights(derivedYears);
    if (derivedPlan) return generateInsights([derivedPlan]);
    return [];
  }, [derivedYears, derivedPlan]);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const exportBtn = document.getElementById('export-btn');
      if (exportBtn) exportBtn.style.display = 'none';
      const html2canvas = (await import("html2canvas")).default;
      const { default: jsPDF } = await import("jspdf");
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#f8fafc' });
      if (exportBtn) exportBtn.style.display = 'flex';
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const doc = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save(`RealProfit_Financial_Report.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
      alert("Đã xảy ra lỗi khi tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle template selection from onboarding
  const handleTemplateSelect = (templateId: string) => {
    const year = new Date().getFullYear();
    const yearData = getTemplateYearData(templateId, year);
    const template = INDUSTRY_TEMPLATES.find(t => t.id === templateId)!;

    // Create project with template data
    const newId = createProject(`Kế hoạch: ${template.name}`, [yearData]);
    switchProject(newId);

    // Also set as plan year data for Plan vs Actual view
    setPlanYearData(yearData);
  };

  // ── ONBOARDING VIEW ──
  if (showOnboarding) {
    return (
      <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
        {/* Header */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-4">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Chào mừng đến RealProfit</h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto">
            Chọn ngành nghề để xem ví dụ 3 Báo cáo Tài chính (BCTC) thực tế.
            Sau đó tạo Kế hoạch AI và bắt đầu theo dõi doanh thu hàng ngày.
          </p>
        </div>

        {/* Onboarding Steps */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
            <Target className="w-4 h-4" /> 1. Chọn ngành
          </span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-400 px-3 py-1.5">
            <BrainCircuit className="w-4 h-4" /> 2. Tạo Kế hoạch AI
          </span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-400 px-3 py-1.5">
            <Wallet className="w-4 h-4" /> 3. Nhập dữ liệu
          </span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
          <span className="flex items-center gap-1.5 text-slate-400 px-3 py-1.5">
            <Layers className="w-4 h-4" /> 4. Theo dõi
          </span>
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRY_TEMPLATES.map(tmpl => {
            const previewData = getTemplateYearData(tmpl.id, new Date().getFullYear());
            const netIncome = previewData.revenue - previewData.cogs - previewData.operatingExpenses - previewData.depreciation - previewData.interestExpense - previewData.taxes;

            return (
              <button
                key={tmpl.id}
                onClick={() => handleTemplateSelect(tmpl.id)}
                className="text-left bg-white rounded-2xl border-2 border-slate-200 p-5 hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tmpl.gradient} flex items-center justify-center text-white mb-3 shadow-sm`}>
                  {TEMPLATE_ICONS[tmpl.id]}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">{tmpl.description}</p>

                {/* Preview numbers */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doanh thu/năm</span>
                    <span className="font-semibold text-slate-800">{formatVND(previewData.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">COGS ({tmpl.cogsPercent}%)</span>
                    <span className="font-semibold text-red-600">-{formatVND(previewData.cogs)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5">
                    <span className="text-slate-500">Lợi nhuận ròng</span>
                    <span className={`font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {netIncome >= 0 ? "" : "-"}{formatVND(Math.abs(netIncome))}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs font-semibold text-blue-600 bg-blue-50 py-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                  Chọn & Xem BCTC mẫu
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── No data at all ──
  if (!currentYearData) {
    return <div className="p-8 text-slate-500">Chưa có dữ liệu dự án. Vui lòng tạo Kế hoạch mới.</div>;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">

      {/* ── HEADER & EXPORT ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-blue-600" />
            Báo cáo Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {hasPlanActualMode
              ? `Kế hoạch vs Thực tế — Năm ${planYearData?.year || new Date().getFullYear()}`
              : "Phân tích đa năm, tự động sinh BCTC và trí tuệ nhân tạo (AI CFO)."}
          </p>
        </div>
        <button
          id="export-btn"
          onClick={exportToPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isExporting ? <div className="animate-spin rounded-full border-b-2 border-white h-4 w-4"></div> : <Download className="w-4 h-4" />}
          <span>{isExporting ? "Đang tạo PDF..." : "Xuất Báo Cáo PDF"}</span>
        </button>
      </div>

      {/* ── QUICK TOOLS ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { href: "/dashboard/finance-os/cashflow", label: "Nhập Cashflow", icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
          { href: "/dashboard/finance-os/plan", label: "Kế Hoạch AI", icon: BrainCircuit, color: "bg-blue-50 text-blue-600" },
          { href: "/dashboard/input", label: "Nhập Liệu", icon: BookOpen, color: "bg-violet-50 text-violet-600" },
          { href: "/dashboard/hr", label: "Nhân Sự", icon: Users, color: "bg-amber-50 text-amber-600" },
          { href: "/dashboard/boe", label: "Hòa Vốn", icon: TrendingUp, color: "bg-cyan-50 text-cyan-600" },
          { href: "/dashboard/finance-os/reports", label: "Báo Cáo", icon: BarChart3, color: "bg-pink-50 text-pink-600" },
        ].map(t => (
          <Link key={t.href} href={t.href} className="flex flex-col items-center gap-1.5 bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow text-center">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.color}`}>
              <t.icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">{t.label}</span>
          </Link>
        ))}
      </div>

      {/* ── ONBOARDING PROGRESS (when plan exists but no actuals) ── */}
      {hasPlanActualMode && !derivedActual && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Tiến trình thiết lập</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Kế hoạch</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <Link href="/dashboard/finance-os/cashflow" className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-100 px-3 py-1 rounded-full hover:bg-blue-200 transition">
              <Wallet className="w-4 h-4" /> Nhập dữ liệu hàng ngày
            </Link>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-400">Theo dõi chênh lệch</span>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Bạn đã có Kế hoạch! Giờ hãy nhập doanh thu & chi phí hàng ngày tại trang Cashflow để Dashboard tự động tính Thực tế vs Kế hoạch.
          </p>
        </div>
      )}

      <div ref={dashboardRef} className="space-y-6 bg-slate-50 p-2 sm:p-6 rounded-2xl">

        {/* ── KPI HIGHLIGHTS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hasPlanActualMode ? (
            <>
              <KPICardVariance
                title="Doanh thu"
                plan={derivedPlan!.revenue}
                actual={derivedActual?.revenue || 0}
                formatVND={formatVND}
                icon={<DollarSign className="w-5 h-5" />}
                higherIsBetter
              />
              <KPICardVariance
                title="Lợi nhuận ròng"
                plan={derivedPlan!._calculated.netIncome}
                actual={derivedActual?._calculated.netIncome || 0}
                formatVND={formatVND}
                icon={<TrendingUp className="w-5 h-5" />}
                higherIsBetter
              />
              <KPICardVariance
                title="Chi phí (COGS+OPEX)"
                plan={derivedPlan!.cogs + derivedPlan!.operatingExpenses}
                actual={(derivedActual?.cogs || 0) + (derivedActual?.operatingExpenses || 0)}
                formatVND={formatVND}
                icon={<Building2 className="w-5 h-5" />}
                higherIsBetter={false}
              />
              <KPICard title="Tiền mặt (KH)" value={formatVND(derivedPlan!.cash)} icon={<Wallet className="w-5 h-5" />} colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
            </>
          ) : (
            <>
              <KPICard title="Lợi nhuận ròng" value={formatVND(currentYearData._calculated.netIncome)} icon={<TrendingUp className="w-5 h-5" />} colorClass={currentYearData._calculated.netIncome >= 0 ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"} />
              <KPICard title="Tổng Tài sản" value={formatVND(currentYearData._calculated.totalAssets)} icon={<Building2 className="w-5 h-5" />} colorClass="text-blue-700 bg-blue-50 border-blue-200" />
              <KPICard title="Lưu chuyển tiền thuần" value={formatVND(currentYearData._calculated.netCashFlow)} icon={<Wallet className="w-5 h-5" />} colorClass="text-teal-700 bg-teal-50 border-teal-200" />
              <KPICard title="Tiền mặt hiện tại" value={formatVND(currentYearData.cash)} icon={<DollarSign className="w-5 h-5" />} colorClass="text-indigo-700 bg-indigo-50 border-indigo-200" />
            </>
          )}
        </div>

        {/* BALANCE WARNING (legacy mode only) */}
        {!hasPlanActualMode && currentYearData._calculated && !currentYearData._calculated.isBalanced && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <div className="text-sm font-medium">
              Cảnh báo: Bảng Cân đối năm cuối không cân. Chênh lệch: {formatVND(Math.abs(currentYearData._calculated.totalAssets - currentYearData._calculated.totalLiabilitiesAndEquity))}
            </div>
          </div>
        )}

        {/* ── AI CFO INSIGHTS ── */}
        {aiInsights.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-white font-bold flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-300" /> Giám đốc Tài chính AI (CFO Insights)
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* ── CHARTS ── */}
        {derivedYears.length > 0 && <DashboardCharts yearsData={derivedYears} />}

        {/* ── 3 FINANCIAL STATEMENTS ── */}
        {hasPlanActualMode ? (
          // ═══════ PLAN VS ACTUAL MODE ═══════
          <div className="space-y-6">

            {/* Column Legend */}
            <div className="flex items-center gap-4 text-xs font-semibold px-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> Kế hoạch</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Thực tế</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Chênh lệch</span>
            </div>

            {/* 1. INCOME STATEMENT */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-5 py-3 text-white font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Báo cáo Kết quả Kinh doanh (Income Statement)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 font-semibold text-slate-700 text-left w-52 border-r border-slate-200">Chỉ tiêu</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-700 min-w-[120px]">Kế hoạch</th>
                      <th className="px-3 py-2 text-right font-semibold text-emerald-700 min-w-[120px]">Thực tế</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700 min-w-[100px]">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <PVARow label="Doanh thu thuần" plan={derivedPlan!} actual={derivedActual} field="revenue" formatVND={formatVND} />
                    <PVARow label="Giá vốn hàng bán (COGS)" plan={derivedPlan!} actual={derivedActual} field="cogs" formatVND={formatVND} negative />
                    <PVARow label="Lợi nhuận gộp" plan={derivedPlan!} actual={derivedActual} field="grossProfit" formatVND={formatVND} calc bold standout="blue" />
                    <PVARow label="Chi phí vận hành (OPEX)" plan={derivedPlan!} actual={derivedActual} field="operatingExpenses" formatVND={formatVND} negative />
                    <PVARow label="EBITDA" plan={derivedPlan!} actual={derivedActual} field="ebitda" formatVND={formatVND} calc bold />
                    <PVARow label="Khấu hao" plan={derivedPlan!} actual={derivedActual} field="depreciation" formatVND={formatVND} negative />
                    <PVARow label="EBIT" plan={derivedPlan!} actual={derivedActual} field="ebit" formatVND={formatVND} calc bold />
                    <PVARow label="Chi phí lãi vay" plan={derivedPlan!} actual={derivedActual} field="interestExpense" formatVND={formatVND} negative />
                    <PVARow label="EBT" plan={derivedPlan!} actual={derivedActual} field="ebt" formatVND={formatVND} calc bold />
                    <PVARow label="Thuế TNDN" plan={derivedPlan!} actual={derivedActual} field="taxes" formatVND={formatVND} negative />
                    <PVARow label="Lợi nhuận ròng" plan={derivedPlan!} actual={derivedActual} field="netIncome" formatVND={formatVND} calc bold standout="green" />
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
                      <th className="px-4 py-2 font-semibold text-slate-700 text-left w-52 border-r border-slate-200">Tài sản & Nguồn vốn</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-700 min-w-[120px]">Kế hoạch</th>
                      <th className="px-3 py-2 text-right font-semibold text-emerald-700 min-w-[120px]">Thực tế</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700 min-w-[100px]">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <PVASectionTitle title="TÀI SẢN (ASSETS)" />
                    <PVARow label="Tiền mặt" plan={derivedPlan!} actual={derivedActual} field="cash" formatVND={formatVND} />
                    <PVARow label="Phải thu KH" plan={derivedPlan!} actual={derivedActual} field="accountsReceivable" formatVND={formatVND} />
                    <PVARow label="Hàng tồn kho" plan={derivedPlan!} actual={derivedActual} field="inventory" formatVND={formatVND} />
                    <PVARow label="TS Cố định (PPE)" plan={derivedPlan!} actual={derivedActual} field="propertyPlantEquipment" formatVND={formatVND} />
                    <PVARow label="Tổng Tài sản" plan={derivedPlan!} actual={derivedActual} field="totalAssets" formatVND={formatVND} calc bold standout="teal" />

                    <PVASectionTitle title="NỢ PHẢI TRẢ (LIABILITIES)" />
                    <PVARow label="Phải trả NCC" plan={derivedPlan!} actual={derivedActual} field="accountsPayable" formatVND={formatVND} />
                    <PVARow label="Nợ vay ngắn hạn" plan={derivedPlan!} actual={derivedActual} field="shortTermDebt" formatVND={formatVND} />
                    <PVARow label="Nợ vay dài hạn" plan={derivedPlan!} actual={derivedActual} field="longTermDebt" formatVND={formatVND} />
                    <PVARow label="Tổng Nợ" plan={derivedPlan!} actual={derivedActual} field="totalLiabilities" formatVND={formatVND} calc bold />

                    <PVASectionTitle title="VỐN CHỦ SỞ HỮU (EQUITY)" />
                    <PVARow label="Vốn góp" plan={derivedPlan!} actual={derivedActual} field="ownerCapital" formatVND={formatVND} />
                    <PVARow label="Lợi nhuận chưa PP" plan={derivedPlan!} actual={derivedActual} field="retainedEarnings" formatVND={formatVND} calc />
                    <PVARow label="Tổng Vốn CSH" plan={derivedPlan!} actual={derivedActual} field="totalEquity" formatVND={formatVND} calc bold />
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. CASH FLOW */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-indigo-600 px-5 py-3 text-white font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5" /> Báo cáo LC Tiền tệ (Cash Flow)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-2 font-semibold text-slate-700 text-left w-52 border-r border-slate-200">Dòng Tiền</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-700 min-w-[120px]">Kế hoạch</th>
                      <th className="px-3 py-2 text-right font-semibold text-emerald-700 min-w-[120px]">Thực tế</th>
                      <th className="px-3 py-2 text-right font-semibold text-amber-700 min-w-[100px]">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <PVARow label="Lưu chuyển từ HĐ Kinh doanh" plan={derivedPlan!} actual={derivedActual} field="opsCF" formatVND={formatVND} calc bold />
                    <PVARow label="Lưu chuyển từ HĐ Đầu tư" plan={derivedPlan!} actual={derivedActual} field="invCF" formatVND={formatVND} calc bold />
                    <PVARow label="Lưu chuyển từ HĐ Tài chính" plan={derivedPlan!} actual={derivedActual} field="finCF" formatVND={formatVND} calc bold />
                    <PVARow label="Lưu chuyển tiền thuần" plan={derivedPlan!} actual={derivedActual} field="netCashFlow" formatVND={formatVND} calc bold standout="indigo" />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          // ═══════ LEGACY MULTI-YEAR MODE ═══════
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
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// COMPONENTS
// ══════════════════════════════════════════════════

function InsightCard({ insight }: { insight: InsightItem }) {
  const config = {
    negative: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-800", iconColor: "text-red-600" },
    warning: { icon: Info, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", iconColor: "text-orange-600" },
    positive: { icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", text: "text-green-800", iconColor: "text-green-600" },
    neutral: { icon: Info, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", iconColor: "text-slate-500" },
  }[insight.type];
  const Icon = config.icon;
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${config.bg} ${config.border}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <div>
        <h4 className={`text-sm font-bold mb-1 ${config.text}`}>{insight.title}</h4>
        <p className="text-xs text-slate-700 leading-relaxed">{insight.message}</p>
      </div>
    </div>
  );
}

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

function KPICardVariance({ title, plan, actual, formatVND, icon, higherIsBetter }: {
  title: string; plan: number; actual: number; formatVND: (v: number) => string; icon: React.ReactNode; higherIsBetter: boolean;
}) {
  const variance = actual - plan;
  const pct = plan !== 0 ? (variance / Math.abs(plan)) * 100 : 0;
  const isGood = higherIsBetter ? variance >= 0 : variance <= 0;
  const colorClass = actual === 0
    ? "text-slate-700 bg-slate-50 border-slate-200"
    : isGood
      ? "text-green-700 bg-green-50 border-green-200"
      : "text-red-700 bg-red-50 border-red-200";

  return (
    <div className={`border rounded-2xl p-4 flex flex-col justify-center gap-1.5 ${colorClass}`}>
      <div className="flex items-center gap-2 opacity-80">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <div className="text-lg font-black tabular-nums">{formatVND(actual || plan)}</div>
      {actual > 0 && (
        <div className="text-xs font-semibold">
          {variance >= 0 ? "+" : ""}{pct.toFixed(1)}% vs KH
        </div>
      )}
    </div>
  );
}

// ── Plan vs Actual Row ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PVARow({ label, plan, actual, field, formatVND, calc, negative, bold, standout }: { label: string; plan: any; actual: any; field: string; formatVND: (v: number) => string; calc?: boolean; negative?: boolean; bold?: boolean; standout?: string }) {
  const planVal = calc ? (plan._calculated?.[field] ?? 0) : (plan[field] ?? 0);
  const actualVal = actual ? (calc ? (actual._calculated?.[field] ?? 0) : (actual[field] ?? 0)) : 0;
  const variance = actualVal - planVal;
  const pct = planVal !== 0 ? (variance / Math.abs(planVal)) * 100 : 0;

  const fmt = (v: number) => {
    if (v === 0) return "-";
    return new Intl.NumberFormat("vi-VN").format(Math.abs(v));
  };

  const getStandoutClasses = () => {
    if (standout === "blue") return "bg-blue-50/50 border-y-2 border-blue-200";
    if (standout === "green") return "bg-green-50/50 border-y-2 border-green-200";
    if (standout === "teal") return "bg-teal-50/50 border-y-2 border-teal-200";
    if (standout === "indigo") return "bg-indigo-50 border-y-2 border-indigo-200";
    return "";
  };

  // For expense items, lower actual is better; for revenue/profit, higher is better
  const isExpenseItem = negative;
  const varianceColor = variance === 0 ? "text-slate-400"
    : isExpenseItem
      ? (variance < 0 ? "text-green-600" : "text-red-600")
      : (variance > 0 ? "text-green-600" : "text-red-600");

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${getStandoutClasses()}`}>
      <td className={`px-4 py-2.5 text-slate-700 border-r border-slate-100 ${bold ? "font-bold" : "font-medium"}`}>
        {label}
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${bold ? "font-bold" : ""} ${negative && planVal > 0 ? "text-red-600" : "text-slate-900"}`}>
        {negative && planVal !== 0 ? "- " : ""}{fmt(planVal)}
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums ${bold ? "font-bold" : ""} ${actualVal === 0 ? "text-slate-300" : negative && actualVal > 0 ? "text-red-600" : "text-slate-900"}`}>
        {actualVal === 0 ? "-" : <>{negative && actualVal !== 0 ? "- " : ""}{fmt(actualVal)}</>}
      </td>
      <td className={`px-3 py-2.5 text-right tabular-nums text-xs font-semibold ${varianceColor}`}>
        {actualVal === 0 ? "-" : `${variance >= 0 ? "+" : ""}${pct.toFixed(1)}%`}
      </td>
    </tr>
  );
}

function PVASectionTitle({ title }: { title: string }) {
  return (
    <tr className="bg-slate-100/50">
      <td colSpan={4} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
        {title}
      </td>
    </tr>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
