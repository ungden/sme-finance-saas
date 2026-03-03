import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://realprofit.vn'),
  title: {
    default: 'RealProfit — Quản trị Tài chính & ERP cho SME',
    template: '%s | RealProfit',
  },
  description: 'Phần mềm Quản trị Nguồn lực & Tài chính Doanh nghiệp (Mini-ERP). Tự động lập 3 Báo cáo Kế toán, chẩn đoán sức khỏe dòng tiền bằng AI.',
  keywords: ['quản trị tài chính', 'báo cáo kế toán', 'ERP', 'SME', 'startup', 'dòng tiền', 'AI CFO'],
  openGraph: {
    title: 'RealProfit — Dashboard Chuẩn IPO Cho SME',
    description: 'Tự động lập 3 Báo cáo Kế toán, chẩn đoán sức khỏe dòng tiền bằng AI chỉ trong 5 phút.',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'RealProfit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RealProfit — Dashboard Chuẩn IPO Cho SME',
    description: 'Phần mềm Mini-ERP cho SME Việt Nam. AI CFO, Biểu đồ Đa năm, Xuất PDF Investor.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
