import type { Metadata } from "next";
import LandingHero from "@/components/LandingHero";

export const metadata: Metadata = {
    title: "RealProfit — Từ Mù Số Liệu Đến Dashboard Chuẩn IPO",
    description: "Phần mềm Quản trị Nguồn lực & Tài chính Doanh nghiệp (Mini-ERP). Tự động lập 3 Báo cáo Kế toán, chẩn đoán sức khỏe dòng tiền bằng AI chỉ trong 5 phút.",
    openGraph: {
        title: "RealProfit — Từ Mù Số Liệu Đến Dashboard Chuẩn IPO",
        description: "Phần mềm Mini-ERP cho SME Việt Nam. AI CFO, Biểu đồ Đa năm, Xuất PDF Investor.",
    },
};

export default function HomePage() {
    return <LandingHero />;
}
