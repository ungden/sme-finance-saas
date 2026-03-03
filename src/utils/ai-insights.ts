export interface InsightItem {
    type: "positive" | "negative" | "warning" | "neutral";
    title: string;
    message: string;
}

export function generateInsights(years: any[]): InsightItem[] {
    const insights: InsightItem[] = [];

    if (!years || years.length === 0) {
        insights.push({
            type: "neutral",
            title: "Chưa có dữ liệu",
            message: "Vui lòng nhập liệu Báo cáo Tài chính để AI có thể phân tích."
        });
        return insights;
    }

    const currentYear = years[years.length - 1];
    const prevYear = years.length > 1 ? years[years.length - 2] : null;

    // ── 1. Phân tích Biên Lợi Nhuận (Margins) ──
    if (currentYear.revenue > 0) {
        const grossMargin = currentYear._calculated.grossProfit / currentYear.revenue;
        const netMargin = currentYear._calculated.netIncome / currentYear.revenue;

        if (grossMargin < 0.2) {
            insights.push({
                type: "warning",
                title: "Biên lợi nhuận gộp thấp",
                message: `Biên lợi nhuận gộp hiện tại chỉ đạt ${(grossMargin * 100).toFixed(1)}%. Cần kiểm soát chặt chẽ Giá vốn hàng bán (COGS) hoặc tối ưu giá bán.`
            });
        } else if (grossMargin > 0.5) {
            insights.push({
                type: "positive",
                title: "Biên lợi nhuận gộp rất tốt",
                message: `Khả năng sinh lời gộp tuyệt vời (hơn ${(grossMargin * 100).toFixed(1)}%), cho phép doanh nghiệp có nhiều dư địa chi tiêu cho Marketing và Vận hành.`
            });
        }

        if (netMargin < 0) {
            insights.push({
                type: "negative",
                title: "Hoạt động cốt lõi đang lỗ",
                message: `Lợi nhuận ròng đang âm. Doanh thu không bù đắp nổi chi phí vận hành (${(currentYear.operatingExpenses / currentYear.revenue * 100).toFixed(1)}% doanh thu).`
            });
        } else if (netMargin > 0.15) {
            insights.push({
                type: "positive",
                title: "Lợi nhuận ròng ấn tượng",
                message: `Biên lãi ròng đạt ${(netMargin * 100).toFixed(1)}%, doanh nghiệp đang kinh doanh rất hiệu quả và có khả năng tích lũy vốn tốt.`
            });
        }
    }

    // ── 2. So sánh Tăng trưởng (Year-over-Year Growth) ──
    if (prevYear && prevYear.revenue > 0) {
        const revGrowth = (currentYear.revenue - prevYear.revenue) / prevYear.revenue;
        const netGrowth = prevYear._calculated.netIncome > 0
            ? (currentYear._calculated.netIncome - prevYear._calculated.netIncome) / prevYear._calculated.netIncome
            : 0;

        if (revGrowth > 0.2) {
            insights.push({
                type: "positive",
                title: "Tăng trưởng Doanh thu mạnh mẽ",
                message: `Doanh thu tăng trưởng ${(revGrowth * 100).toFixed(1)}% so với năm trước. Cho thấy mô hình đang mở rộng và có product-market fit tốt.`
            });
        } else if (revGrowth < -0.1) {
            insights.push({
                type: "negative",
                title: "Sụt giảm Doanh thu",
                message: `Doanh thu giảm ${Math.abs(revGrowth * 100).toFixed(1)}% YoY. Cần rà soát lại biến động vĩ mô, đối thủ cạnh tranh hoặc hiệu quả sales.`
            });
        }

        // Cảnh báo: Tăng trưởng ảo (Doanh thu tăng nhưng LN giảm)
        if (revGrowth > 0.1 && netGrowth < -0.1) {
            insights.push({
                type: "negative",
                title: "Cảnh báo Tăng trưởng Ảo",
                message: `Báo động đỏ: Mặc dù doanh thu tăng ${(revGrowth * 100).toFixed(1)}%, nhưng lợi nhuận lại sụt giảm ${Math.abs(netGrowth * 100).toFixed(1)}%. Chi phí đang phình to nhanh hơn tốc độ tăng trưởng quy mô (Diseconomies of scale).`
            });
        }
    }

    // ── 3. Phân tích Dòng tiền & Thanh khoản (Liquidity & Cash Flow) ──
    const currentAssets = currentYear._calculated.currentAssets;
    const currentLiabilities = currentYear._calculated.currentLiabilities;

    if (currentLiabilities > 0) {
        const currentRatio = currentAssets / currentLiabilities;
        if (currentRatio < 1) {
            insights.push({
                type: "negative",
                title: "Rủi ro Thanh khoản (Current Ratio < 1)",
                message: `Tài sản ngắn hạn không đủ bù đắp Nợ ngắn hạn. Doanh nghiệp đang đối diện nguy cơ hụt dòng tiền thanh toán (Insolvency risk).`
            });
        } else if (currentRatio > 2) {
            insights.push({
                type: "neutral",
                title: "Tiền mặt dư thừa nhiều",
                message: `Tỷ số thanh toán hiện hành rất cao (${currentRatio.toFixed(1)}). Bạn có khả năng thanh toán dễ dàng những nợ đáo hạn, nhưng có thể đang lãng phí vốn thay vì mang đi tái đầu tư sinh lời.`
            });
        }
    }

    if (currentYear._calculated.netCashFlow < 0) {
        const runway = currentYear.cash / Math.abs(currentYear._calculated.netCashFlow);
        insights.push({
            type: "warning",
            title: "Dòng tiền thuần đang Âm",
            message: `Tiền đang chảy ra khỏi doanh nghiệp. Với dự trữ tiền mặt hiện tại, nếu tiếp tục "đốt" tiền (burn rate) ở tốc độ này, vốn sẽ cạn kiệt trong khoảng ${(runway * 12).toFixed(1)} tháng tới.`
        });
    } else if (currentYear._calculated.opsCF > 0 && currentYear._calculated.netIncome > 0 && currentYear._calculated.opsCF > currentYear._calculated.netIncome) {
        insights.push({
            type: "positive",
            title: "Chất lượng Dòng tiền (QoE) Cao",
            message: `Dòng tiền hoạt động kinh doanh (OpsCF) lớn hơn Lợi nhuận ròng. Lợi nhuận của bạn là "tiền thật" mang về két, chứ không phải nằm trên công nợ phải thu.`
        });
    }

    // ── 4. Phân tích Chi phí (Cost Structure) ──
    if (currentYear.revenue > 0) {
        const opexRatio = currentYear.operatingExpenses / currentYear.revenue;
        if (opexRatio > 0.6) {
            insights.push({
                type: "warning",
                title: "Gánh nặng Chi phí Vận hành (OPEX)",
                message: `OPEX chiếm tới ${(opexRatio * 100).toFixed(1)}% tổng doanh thu. Cấu trúc chi phí quá nặng nề, khó có thể chống chọi nếu doanh thu đột ngột suy giảm.`
            });
        }
    }

    // Fallback nếu data quá ít/chưa có insight nào nổi bật
    if (insights.length === 0) {
        insights.push({
            type: "neutral",
            title: "Thông số ổn định",
            message: "Hệ thống chưa phát hiện dấu hiệu rủi ro nghiêm trọng hay tăng trưởng đột biến nào trong cấu trúc tài chính của doanh nghiệp."
        });
    }

    // Sort: Negative/Warning lên trước để User chú ý
    return insights.sort((a, b) => {
        const order = { negative: 0, warning: 1, positive: 2, neutral: 3 };
        return order[a.type] - order[b.type];
    });
}
