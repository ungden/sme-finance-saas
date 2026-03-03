"use client";

import React, { useState, useMemo } from "react";
import {
    TrendingUp, DollarSign, Users, Building2, Gauge, ArrowUpRight,
    BarChart3, Target, Clock, Percent, Coffee, ShoppingBag, Store,
    Scissors, GraduationCap, Truck, Plus
} from "lucide-react";
import { useFinance, YearData } from "@/context/FinanceContext";

// ── Exchange rate ──────────────────────────────────────

// ── Ramp-up presets (Month -5 to Month 12) ────────────
const RAMP_UP = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
const MONTH_LABELS = [
    "T-5", "T-4", "T-3", "T-2", "T-1",
    "T01", "T02", "T03", "T04", "T05", "T06",
    "T07", "T08", "T09", "T10", "T11", "T12",
];

// ── Industry Template System ──────────────────────────
interface BOETemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    tc: number;
    ac: number;
    sizeSqm: number;
    rent: number;
    cogsPercent: number;
    utilitiesPercent: number;
    marketingPercent: number;
    otherOpexPercent: number;
    maintenancePercent: number;
    reinvestmentPercent: number;
    smCount: number;
    smSalary: number;
    staffCount: number;
    staffSalary: number;
    capexSqm: number;
    equipment: number;
    depreciationYears: number;
    // Labels customization
    tcLabel: string;
    acLabel: string;
}

const TEMPLATES: BOETemplate[] = [
    {
        id: "fnb",
        name: "F&B / Quán Cà phê",
        description: "Dựa theo BOE Nam Long — Quán cà phê & nhà hàng 500m²",
        icon: <Coffee className="w-5 h-5" />,
        gradient: "from-amber-500 to-orange-600",
        tc: 189, ac: 71000, sizeSqm: 500, rent: 180960,
        cogsPercent: 31, utilitiesPercent: 6, marketingPercent: 3,
        otherOpexPercent: 1, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 8, staffSalary: 5500000,
        capexSqm: 14300000, equipment: 520000000, depreciationYears: 5,
        tcLabel: "TC (Giao dịch/ngày)", acLabel: "AC (Đơn giá TB, VNĐ)",
    },
    {
        id: "retail",
        name: "Bán lẻ / Cửa hàng",
        description: "Cửa hàng thời trang, mỹ phẩm, tiện lợi — 80-200m²",
        icon: <Store className="w-5 h-5" />,
        gradient: "from-blue-500 to-indigo-600",
        tc: 80, ac: 350000, sizeSqm: 120, rent: 390000,
        cogsPercent: 55, utilitiesPercent: 3, marketingPercent: 5,
        otherOpexPercent: 2, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 10000000, staffCount: 3, staffSalary: 6000000,
        capexSqm: 7800000, equipment: 390000000, depreciationYears: 5,
        tcLabel: "Khách/ngày", acLabel: "Giá trị đơn TB (VNĐ)",
    },
    {
        id: "ecommerce",
        name: "Thương mại Điện tử",
        description: "Shop online Shopee/TikTok/Lazada — Kho hàng + nhân sự",
        icon: <ShoppingBag className="w-5 h-5" />,
        gradient: "from-rose-500 to-pink-600",
        tc: 150, ac: 250000, sizeSqm: 80, rent: 104000,
        cogsPercent: 50, utilitiesPercent: 1, marketingPercent: 15,
        otherOpexPercent: 5, maintenancePercent: 0, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 5, staffSalary: 6500000,
        capexSqm: 1300000, equipment: 260000000, depreciationYears: 3,
        tcLabel: "Đơn hàng/ngày", acLabel: "AOV (Giá trị đơn TB, VNĐ)",
    },
    {
        id: "salon",
        name: "Salon / Spa / Làm đẹp",
        description: "Tiệm tóc, spa, nail — 60-150m², dịch vụ cao cấp",
        icon: <Scissors className="w-5 h-5" />,
        gradient: "from-purple-500 to-fuchsia-600",
        tc: 25, ac: 450000, sizeSqm: 100, rent: 260000,
        cogsPercent: 15, utilitiesPercent: 5, marketingPercent: 8,
        otherOpexPercent: 2, maintenancePercent: 2, reinvestmentPercent: 1,
        smCount: 1, smSalary: 12000000, staffCount: 6, staffSalary: 8000000,
        capexSqm: 10400000, equipment: 650000000, depreciationYears: 5,
        tcLabel: "Khách/ngày", acLabel: "Đơn giá dịch vụ TB (VNĐ)",
    },
    {
        id: "education",
        name: "Giáo dục / Trung tâm dạy học",
        description: "Trung tâm ngoại ngữ, luyện thi, kỹ năng — 150-300m²",
        icon: <GraduationCap className="w-5 h-5" />,
        gradient: "from-emerald-500 to-teal-600",
        tc: 60, ac: 200000, sizeSqm: 200, rent: 208000,
        cogsPercent: 5, utilitiesPercent: 4, marketingPercent: 10,
        otherOpexPercent: 3, maintenancePercent: 1, reinvestmentPercent: 1,
        smCount: 1, smSalary: 15000000, staffCount: 8, staffSalary: 10000000,
        capexSqm: 5200000, equipment: 390000000, depreciationYears: 5,
        tcLabel: "Học viên/ngày", acLabel: "Học phí TB/buổi (VNĐ)",
    },
    {
        id: "logistics",
        name: "Vận chuyển / Giao hàng",
        description: "Đội xe giao hàng, kho bãi, last-mile delivery",
        icon: <Truck className="w-5 h-5" />,
        gradient: "from-sky-500 to-cyan-600",
        tc: 200, ac: 35000, sizeSqm: 150, rent: 78000,
        cogsPercent: 40, utilitiesPercent: 8, marketingPercent: 3,
        otherOpexPercent: 5, maintenancePercent: 5, reinvestmentPercent: 2,
        smCount: 1, smSalary: 12000000, staffCount: 10, staffSalary: 7000000,
        capexSqm: 1300000, equipment: 1300000000, depreciationYears: 4,
        tcLabel: "Đơn giao/ngày", acLabel: "Phí giao hàng TB (VNĐ)",
    },
];

interface MonthlyPL {
    label: string;
    ramp: number;
    revenue: number;
    cogs: number;
    grossProfit: number;
    labor: number;
    rent: number;
    utilities: number;
    otherOpex: number;
    marketing: number;
    maintenance: number;
    reinvestment: number;
    depreciation: number;
    ebitda: number;
    noi: number;
}

export default function BOEPage() {
    const { createProject, switchProject } = useFinance();
    const [selectedId, setSelectedId] = useState("fnb");

    // ── Inputs (initialized from the first template) ──────
    const [tc, setTc] = useState(TEMPLATES[0].tc);
    const [ac, setAc] = useState(TEMPLATES[0].ac);
    const [sizeSqm, setSizeSqm] = useState(TEMPLATES[0].sizeSqm);
    const [rent, setRent] = useState(TEMPLATES[0].rent);
    const [cogsPercent, setCogsPercent] = useState(TEMPLATES[0].cogsPercent);
    const [utilitiesPercent, setUtilitiesPercent] = useState(TEMPLATES[0].utilitiesPercent);
    const [marketingPercent, setMarketingPercent] = useState(TEMPLATES[0].marketingPercent);
    const [otherOpexPercent, setOtherOpexPercent] = useState(TEMPLATES[0].otherOpexPercent);
    const [maintenancePercent, setMaintenancePercent] = useState(TEMPLATES[0].maintenancePercent);
    const [reinvestmentPercent, setReinvestmentPercent] = useState(TEMPLATES[0].reinvestmentPercent);
    const [smCount, setSmCount] = useState(TEMPLATES[0].smCount);
    const [smSalary, setSmSalary] = useState(TEMPLATES[0].smSalary);
    const [staffCount, setStaffCount] = useState(TEMPLATES[0].staffCount);
    const [staffSalary, setStaffSalary] = useState(TEMPLATES[0].staffSalary);
    const [capexSqm, setCapexSqm] = useState(TEMPLATES[0].capexSqm);
    const [equipment, setEquipment] = useState(TEMPLATES[0].equipment);
    const [depreciationYears, setDepreciationYears] = useState(TEMPLATES[0].depreciationYears);

    const selectedTemplate = TEMPLATES.find(t => t.id === selectedId) || TEMPLATES[0];

    const applyTemplate = (tmpl: BOETemplate) => {
        setSelectedId(tmpl.id);
        setTc(tmpl.tc); setAc(tmpl.ac); setSizeSqm(tmpl.sizeSqm); setRent(tmpl.rent);
        setCogsPercent(tmpl.cogsPercent); setUtilitiesPercent(tmpl.utilitiesPercent);
        setMarketingPercent(tmpl.marketingPercent); setOtherOpexPercent(tmpl.otherOpexPercent);
        setMaintenancePercent(tmpl.maintenancePercent); setReinvestmentPercent(tmpl.reinvestmentPercent);
        setSmCount(tmpl.smCount); setSmSalary(tmpl.smSalary);
        setStaffCount(tmpl.staffCount); setStaffSalary(tmpl.staffSalary);
        setCapexSqm(tmpl.capexSqm); setEquipment(tmpl.equipment);
        setDepreciationYears(tmpl.depreciationYears);
    };

    const formatVND = (val: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(val);
    const formatPercent = (val: number) => (val * 100).toFixed(1) + "%";

    // ── Calculation Engine ──────────────────────────────
    const results = useMemo(() => {
        const daysPerMonth = 30;
        const monthlyRent = sizeSqm * rent;
        const monthlyLabor = smCount * smSalary + staffCount * staffSalary;
        const totalCapex = (sizeSqm * capexSqm + equipment);
        const monthlyDepreciation = totalCapex / (depreciationYears * 12);
        const stabilizedADS = tc * ac;
        const stabilizedRevenue = stabilizedADS * daysPerMonth;

        const months: MonthlyPL[] = RAMP_UP.map((ramp, i) => {
            const revenue = tc * ramp * ac * daysPerMonth;
            const cogs = revenue * (cogsPercent / 100);
            const grossProfit = revenue - cogs;
            const labor = monthlyLabor;
            const rent = monthlyRent;
            const utilities = revenue * (utilitiesPercent / 100);
            const otherOpex = revenue * (otherOpexPercent / 100);
            const marketing = revenue * (marketingPercent / 100);
            const maintenance = revenue * (maintenancePercent / 100);
            const reinvestment = revenue * (reinvestmentPercent / 100);
            const depreciation = monthlyDepreciation;
            const totalOpex = labor + rent + utilities + otherOpex + marketing + maintenance + reinvestment;
            const ebitda = grossProfit - totalOpex + depreciation;
            const noi = ebitda - depreciation;
            return { label: MONTH_LABELS[i], ramp, revenue, cogs, grossProfit, labor, rent, utilities, otherOpex, marketing, maintenance, reinvestment, depreciation, ebitda, noi };
        });

        const year1Months = months.slice(5);
        const year1: Record<string, number> = {};
        const keys = ["revenue", "cogs", "grossProfit", "labor", "rent", "utilities", "otherOpex", "marketing", "maintenance", "reinvestment", "depreciation", "ebitda", "noi"] as const;
        for (const key of keys) { year1[key] = year1Months.reduce((sum, m) => sum + m[key], 0); }

        const stabilized = months[5];
        const fixedCosts = stabilized.labor + stabilized.rent + stabilized.depreciation;
        const variableRatio = (cogsPercent + utilitiesPercent + otherOpexPercent + marketingPercent + maintenancePercent + reinvestmentPercent) / 100;
        const breakEvenRevenue = fixedCosts / (1 - variableRatio);
        const breakEvenTC = breakEvenRevenue / (ac * daysPerMonth);
        const paybackMonths = stabilized.noi > 0 ? totalCapex / stabilized.noi : Infinity;

        return { months, year1, stabilized, totalCapex, breakEvenRevenue, breakEvenTC, paybackMonths, stabilizedRevenue };
    }, [tc, ac, sizeSqm, rent, cogsPercent, utilitiesPercent, marketingPercent, otherOpexPercent, maintenancePercent, reinvestmentPercent, smCount, smSalary, staffCount, staffSalary, capexSqm, equipment, depreciationYears]);

    return (
        <div className="space-y-6 max-w-screen-2xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">BOE Simulator</h1>
                <p className="text-sm text-slate-500 mt-1">Chọn ngành → hệ thống tự nạp thông số chuẩn → tùy chỉnh → xem P&L projection ngay lập tức</p>
            </div>

            {/* ── Industry Template Selector ────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {TEMPLATES.map(tmpl => (
                    <div
                        key={tmpl.id}
                        className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 group flex flex-col items-start ${selectedId === tmpl.id
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                    >
                        <button onClick={() => applyTemplate(tmpl)} className="w-full text-left flex-1" title="Xem trước Template này">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tmpl.gradient} flex items-center justify-center text-white mb-3 shadow-sm`}>
                                {tmpl.icon}
                            </div>
                            <h3 className={`text-sm font-bold mb-1 ${selectedId === tmpl.id ? "text-blue-800" : "text-slate-900"}`}>
                                {tmpl.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 leading-relaxed min-h-[48px]">{tmpl.description}</p>
                        </button>

                        <button
                            onClick={() => {
                                const startYear = new Date().getFullYear();
                                const initialYears: YearData[] = [
                                    {
                                        id: startYear.toString(),
                                        year: startYear,
                                        revenue: results.year1["revenue"],
                                        cogs: results.year1["cogs"],
                                        operatingExpenses: results.year1["labor"] + results.year1["rent"] + results.year1["utilities"] + results.year1["otherOpex"] + results.year1["marketing"] + results.year1["maintenance"] + results.year1["reinvestment"],
                                        depreciation: results.year1["depreciation"],
                                        interestExpense: 0, taxes: 0,
                                        cash: results.year1["revenue"] * 0.1,
                                        accountsReceivable: 0, inventory: 0,
                                        propertyPlantEquipment: results.totalCapex - results.year1["depreciation"],
                                        accountsPayable: 0, shortTermDebt: 0, longTermDebt: 0,
                                        ownerCapital: results.totalCapex,
                                    },
                                    ...[1, 2].map(offset => ({
                                        id: (startYear + offset).toString(),
                                        year: startYear + offset,
                                        revenue: results.stabilized.revenue * 12,
                                        cogs: results.stabilized.cogs * 12,
                                        operatingExpenses: (results.stabilized.labor + results.stabilized.rent + results.stabilized.utilities + results.stabilized.otherOpex + results.stabilized.marketing + results.stabilized.maintenance + results.stabilized.reinvestment) * 12,
                                        depreciation: results.stabilized.depreciation * 12,
                                        interestExpense: 0, taxes: 0,
                                        cash: results.stabilized.revenue * 1.2,
                                        accountsReceivable: 0, inventory: 0,
                                        propertyPlantEquipment: Math.max(0, results.totalCapex - results.year1["depreciation"] - (results.stabilized.depreciation * 12 * offset)),
                                        accountsPayable: 0, shortTermDebt: 0, longTermDebt: 0,
                                        ownerCapital: results.totalCapex,
                                    }))
                                ];
                                const newId = createProject(`Kế hoạch: ${tmpl.name}`, initialYears);
                                switchProject(newId);
                                applyTemplate(tmpl);
                                alert(`Đã tạo Kế hoạch mới: "${tmpl.name}" với dữ liệu dự phóng 3 năm!`);
                            }}
                            className="mt-3 w-full py-1.5 bg-white border border-slate-200 text-blue-600 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Tạo Kế hoạch mới</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* ── KPI Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KPI icon={<DollarSign className="w-4 h-4" />} label="Doanh thu/tháng" value={formatVND(results.stabilizedRevenue)} color="blue" />
                <KPI icon={<Percent className="w-4 h-4" />} label="EBITDA %" value={results.stabilized.revenue > 0 ? formatPercent(results.stabilized.ebitda / results.stabilized.revenue) : "N/A"} color={results.stabilized.ebitda >= 0 ? "green" : "red"} />
                <KPI icon={<Target className="w-4 h-4" />} label={`Break-even ${selectedTemplate.tcLabel.split(" ")[0]}`} value={`${results.breakEvenTC.toFixed(0)}/ngày`} color="amber" />
                <KPI icon={<Clock className="w-4 h-4" />} label="Payback" value={results.paybackMonths === Infinity ? "N/A" : `${results.paybackMonths.toFixed(1)} tháng`} color="indigo" />
                <KPI icon={<Building2 className="w-4 h-4" />} label="Tổng CAPEX" value={formatVND(results.totalCapex)} color="slate" />
            </div>

            {/* ── Main Grid: Inputs + P&L ──────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* ▶ INPUT FORM */}
                <div className="xl:col-span-4 space-y-4">
                    <FormSection title="Động lực Doanh thu" icon={<BarChart3 className="w-4 h-4" />} color="blue">
                        <Field label={selectedTemplate.tcLabel} value={tc} onChange={setTc} />
                        <Field label={selectedTemplate.acLabel} value={ac} onChange={setAc} step={1000} />
                    </FormSection>

                    <FormSection title="Mặt bằng / Kho" icon={<Building2 className="w-4 h-4" />} color="orange">
                        <Field label="Diện tích (m²)" value={sizeSqm} onChange={setSizeSqm} />
                        <Field label="Giá thuê (VNĐ/m²/tháng)" value={rent} onChange={setRent} step={100000} />
                    </FormSection>

                    <FormSection title="Nhân sự" icon={<Users className="w-4 h-4" />} color="purple">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="SL Quản lý" value={smCount} onChange={setSmCount} />
                            <Field label="Lương QL" value={smSalary} onChange={setSmSalary} step={500000} />
                            <Field label="SL Nhân viên" value={staffCount} onChange={setStaffCount} />
                            <Field label="Lương NV" value={staffSalary} onChange={setStaffSalary} step={500000} />
                        </div>
                    </FormSection>

                    <FormSection title="Tỷ lệ Chi phí (% Doanh thu)" icon={<Gauge className="w-4 h-4" />} color="red">
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="COGS %" value={cogsPercent} onChange={setCogsPercent} />
                            <Field label="Utilities %" value={utilitiesPercent} onChange={setUtilitiesPercent} />
                            <Field label="Marketing %" value={marketingPercent} onChange={setMarketingPercent} />
                            <Field label="Opex khác %" value={otherOpexPercent} onChange={setOtherOpexPercent} />
                            <Field label="Bảo trì %" value={maintenancePercent} onChange={setMaintenancePercent} />
                            <Field label="Tái đầu tư %" value={reinvestmentPercent} onChange={setReinvestmentPercent} />
                        </div>
                    </FormSection>

                    <FormSection title="Đầu tư CAPEX" icon={<ArrowUpRight className="w-4 h-4" />} color="indigo">
                        <Field label="Đầu tư/m² (VNĐ)" value={capexSqm} onChange={setCapexSqm} step={100000} />
                        <Field label="Thiết bị (VNĐ)" value={equipment} onChange={setEquipment} step={1000000} />
                        <Field label="Khấu hao (năm)" value={depreciationYears} onChange={setDepreciationYears} min={1} max={10} />
                    </FormSection>
                </div>

                {/* ▶ OUTPUT  */}
                <div className="xl:col-span-8 space-y-6">
                    {/* P&L Stabilized */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className={`bg-gradient-to-r ${selectedTemplate.gradient} px-6 py-4 text-white flex items-center space-x-2`}>
                            <TrendingUp className="w-5 h-5" />
                            <h2 className="font-bold">P&L tháng ổn định — {selectedTemplate.name}</h2>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-12 gap-x-4 text-sm">
                                <div className="col-span-5 font-semibold text-slate-500 text-xs uppercase tracking-wider pb-2 border-b">Khoản mục</div>
                                <div className="col-span-4 font-semibold text-slate-500 text-xs uppercase tracking-wider pb-2 border-b text-right">Số tiền</div>
                                <div className="col-span-3 font-semibold text-slate-500 text-xs uppercase tracking-wider pb-2 border-b text-right">% DT</div>

                                <PLRow label="Doanh thu" val={results.stabilized.revenue} total={results.stabilized.revenue} bold />
                                <PLRow label="Giá vốn (COGS)" val={-results.stabilized.cogs} total={results.stabilized.revenue} negative />
                                <PLRow label="Lợi nhuận gộp" val={results.stabilized.grossProfit} total={results.stabilized.revenue} bold highlight="blue" />
                                <div className="col-span-12 border-t my-1" />
                                <PLRow label="Nhân sự" val={-results.stabilized.labor} total={results.stabilized.revenue} negative />
                                <PLRow label="Thuê mặt bằng" val={-results.stabilized.rent} total={results.stabilized.revenue} negative />
                                <PLRow label="Điện nước gas" val={-results.stabilized.utilities} total={results.stabilized.revenue} negative />
                                <PLRow label="Marketing" val={-results.stabilized.marketing} total={results.stabilized.revenue} negative />
                                <PLRow label="Opex khác" val={-results.stabilized.otherOpex} total={results.stabilized.revenue} negative />
                                <PLRow label="Bảo trì" val={-results.stabilized.maintenance} total={results.stabilized.revenue} negative />
                                <PLRow label="Tái đầu tư" val={-results.stabilized.reinvestment} total={results.stabilized.revenue} negative />
                                <div className="col-span-12 border-t my-1" />
                                <PLRow label="EBITDA" val={results.stabilized.ebitda} total={results.stabilized.revenue} bold highlight="green" />
                                <PLRow label="Khấu hao" val={-results.stabilized.depreciation} total={results.stabilized.revenue} negative />
                                <div className="col-span-12 border-t-2 border-slate-800 my-2" />
                                <PLRow label="NOI (Lợi nhuận ròng)" val={results.stabilized.noi} total={results.stabilized.revenue} bold highlight={results.stabilized.noi >= 0 ? "green" : "red"} />
                            </div>
                        </div>
                    </div>

                    {/* Monthly Projection */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <h2 className="font-bold">Bảng dự phóng theo tháng (Ramp-up → Ổn định)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600 min-w-[140px]">Khoản mục</th>
                                        {results.months.map(m => (
                                            <th key={m.label} className={`px-2 py-2 text-right font-semibold min-w-[95px] ${m.ramp < 1 ? "text-orange-600" : "text-slate-600"}`}>
                                                {m.label}
                                                <div className="text-[10px] font-normal text-slate-400">{(m.ramp * 100).toFixed(0)}%</div>
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-right font-bold text-slate-800 bg-blue-50 min-w-[110px]">Năm 1</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <TRow label="Doanh thu" months={results.months} field="revenue" year1={results.year1["revenue"]} bold />
                                    <TRow label="COGS" months={results.months} field="cogs" year1={results.year1["cogs"]} negative />
                                    <TRow label="Lợi nhuận gộp" months={results.months} field="grossProfit" year1={results.year1["grossProfit"]} bold highlight />
                                    <TRow label="Nhân sự" months={results.months} field="labor" year1={results.year1["labor"]} negative />
                                    <TRow label="Mặt bằng" months={results.months} field="rent" year1={results.year1["rent"]} negative />
                                    <TRow label="Utilities" months={results.months} field="utilities" year1={results.year1["utilities"]} negative />
                                    <TRow label="Marketing" months={results.months} field="marketing" year1={results.year1["marketing"]} negative />
                                    <TRow label="Opex khác" months={results.months} field="otherOpex" year1={results.year1["otherOpex"]} negative />
                                    <TRow label="Bảo trì" months={results.months} field="maintenance" year1={results.year1["maintenance"]} negative />
                                    <TRow label="Tái đầu tư" months={results.months} field="reinvestment" year1={results.year1["reinvestment"]} negative />
                                    <TRow label="Khấu hao" months={results.months} field="depreciation" year1={results.year1["depreciation"]} negative />
                                    <TRow label="EBITDA" months={results.months} field="ebitda" year1={results.year1["ebitda"]} bold highlight />
                                    <TRow label="NOI" months={results.months} field="noi" year1={results.year1["noi"]} bold highlight />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────
function KPI({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        green: "bg-green-50 text-green-700 border-green-100",
        amber: "bg-amber-50 text-amber-700 border-amber-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
        red: "bg-red-50 text-red-700 border-red-100",
    };
    return (
        <div className={`${colors[color]} border rounded-2xl p-3.5 flex flex-col space-y-1.5`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
                {icon}
            </div>
            <span className="text-base font-bold">{value}</span>
        </div>
    );
}

function FormSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
    const colors: Record<string, string> = {
        blue: "text-blue-700 border-blue-200",
        orange: "text-orange-700 border-orange-200",
        purple: "text-purple-700 border-purple-200",
        red: "text-red-700 border-red-200",
        indigo: "text-indigo-700 border-indigo-200",
    };
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className={`flex items-center space-x-2 text-sm font-bold ${colors[color]} border-b pb-2`}>
                {icon}
                <span>{title}</span>
            </div>
            {children}
        </div>
    );
}

function Field({ label, value, onChange, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
    // Format the numerical value with thousands separators (dot for VND standard)
    const displayValue = value === 0 ? "" : new Intl.NumberFormat("vi-VN").format(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip everything except digits
        const rawValue = e.target.value.replace(/[^\d]/g, "");
        if (rawValue === "") {
            onChange(0);
            return;
        }
        const numValue = parseInt(rawValue, 10);
        // Respect max if provided
        if (max !== undefined && numValue > max) return;
        onChange(numValue);
    };

    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 tabular-nums"
            />
        </div>
    );
}

function PLRow({ label, val, total, bold, negative, highlight }: { label: string; val: number; total: number; bold?: boolean; negative?: boolean; highlight?: string }) {
    const fmt = (v: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.abs(v));
    const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0.0";
    const hl: Record<string, string> = { blue: "bg-blue-50 text-blue-700", green: "bg-green-50 text-green-700", red: "bg-red-50 text-red-700" };
    const cls = highlight ? `${hl[highlight]} rounded-lg px-2 py-1.5` : "py-1.5";
    return (
        <>
            <div className={`col-span-5 ${cls} ${bold ? "font-bold text-slate-900" : "text-slate-600"}`}>{label}</div>
            <div className={`col-span-4 text-right tabular-nums ${cls} ${negative ? "text-red-600" : ""} ${bold ? "font-bold" : "font-medium"}`}>
                {negative && val !== 0 ? "- " : ""}{fmt(val)}
            </div>
            <div className={`col-span-3 text-right tabular-nums ${cls} text-slate-500 text-xs`}>{pct}%</div>
        </>
    );
}

function TRow({ label, months, field, year1, bold, negative, highlight }: { label: string; months: MonthlyPL[]; field: keyof MonthlyPL; year1: number; bold?: boolean; negative?: boolean; highlight?: boolean }) {
    const fmt = (v: number) => {
        const a = Math.abs(v);
        if (a >= 1e9) return (v / 1e9).toFixed(1) + "B";
        if (a >= 1e6) return (v / 1e6).toFixed(1) + "M";
        if (a >= 1e3) return (v / 1e3).toFixed(0) + "K";
        return v.toFixed(0);
    };
    return (
        <tr className={highlight ? "bg-blue-50/50" : ""}>
            <td className={`sticky left-0 ${highlight ? "bg-blue-50/80" : "bg-white"} px-3 py-1.5 ${bold ? "font-bold text-slate-900" : "text-slate-600"}`}>{label}</td>
            {months.map(m => {
                const v = m[field] as number;
                return <td key={m.label} className={`px-2 py-1.5 text-right tabular-nums ${v < 0 ? "text-red-600" : ""} ${bold ? "font-semibold" : ""}`}>{fmt(v)}</td>;
            })}
            <td className={`px-3 py-1.5 text-right tabular-nums bg-blue-50 ${bold ? "font-bold text-slate-900" : "font-medium"} ${year1 < 0 ? "text-red-600" : ""}`}>{fmt(year1)}</td>
        </tr>
    );
}
