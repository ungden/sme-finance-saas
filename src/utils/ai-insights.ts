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

// ══════════════════════════════════════════════════
// AI FORECAST — Linear Regression + Moving Average
// ══════════════════════════════════════════════════

interface ForecastPoint {
    year: number;
    actual?: number;
    forecast: number;
    lower: number;
    upper: number;
}

export interface ForecastResult {
    revenue: ForecastPoint[];
    cogs: ForecastPoint[];
    opex: ForecastPoint[];
    netIncome: ForecastPoint[];
    insights: InsightItem[];
}

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

    const sumX = points.reduce((s, p) => s + p.x, 0);
    const sumY = points.reduce((s, p) => s + p.y, 0);
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const meanY = sumY / n;
    const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return { slope, intercept, r2 };
}

function forecastSeries(years: any[], field: string, periodsAhead: number = 3): ForecastPoint[] {
    const points = years.map((y, i) => ({ x: i, y: y[field] || 0 }));
    const { slope, intercept, r2 } = linearRegression(points);

    // Standard error for confidence interval
    const residuals = points.map(p => p.y - (slope * p.x + intercept));
    const se = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, points.length - 2));
    const confidenceMultiplier = 1.96; // 95% CI

    const result: ForecastPoint[] = [];

    // Actual + fitted
    years.forEach((y, i) => {
        const fitted = slope * i + intercept;
        result.push({
            year: y.year,
            actual: y[field] || 0,
            forecast: Math.max(0, fitted),
            lower: Math.max(0, fitted - confidenceMultiplier * se),
            upper: fitted + confidenceMultiplier * se,
        });
    });

    // Future forecasts
    const lastYear = years[years.length - 1].year;
    for (let j = 1; j <= periodsAhead; j++) {
        const idx = points.length - 1 + j;
        const predicted = slope * idx + intercept;
        const uncertaintyGrowth = 1 + j * 0.3; // Wider CI for further out
        result.push({
            year: lastYear + j,
            forecast: Math.max(0, predicted),
            lower: Math.max(0, predicted - confidenceMultiplier * se * uncertaintyGrowth),
            upper: predicted + confidenceMultiplier * se * uncertaintyGrowth,
        });
    }

    return result;
}

export function generateForecast(years: any[]): ForecastResult {
    if (!years || years.length < 2) {
        return {
            revenue: [], cogs: [], opex: [], netIncome: [],
            insights: [{ type: 'neutral', title: 'Chưa đủ dữ liệu', message: 'Cần tối thiểu 2 năm dữ liệu để AI có thể dự báo xu hướng.' }],
        };
    }

    // Compute net income for each year
    const enriched = years.map(y => ({
        ...y,
        _netIncome: y.revenue - y.cogs - y.operatingExpenses - y.depreciation - y.interestExpense - y.taxes,
    }));

    const revenue = forecastSeries(years, 'revenue');
    const cogs = forecastSeries(years, 'cogs');
    const opex = forecastSeries(years, 'operatingExpenses');
    const netIncome = forecastSeries(enriched, '_netIncome');

    // Generate forecast insights
    const insights: InsightItem[] = [];
    const lastActualRevenue = years[years.length - 1].revenue;
    const nextForecastRevenue = revenue.find(r => !r.actual)?.forecast || 0;

    if (lastActualRevenue > 0 && nextForecastRevenue > 0) {
        const growthPct = ((nextForecastRevenue - lastActualRevenue) / lastActualRevenue) * 100;
        if (growthPct > 0) {
            insights.push({
                type: 'positive',
                title: `📈 Dự báo Doanh thu tăng ${growthPct.toFixed(1)}%`,
                message: `Xu hướng tuyến tính cho thấy doanh thu năm tới dự kiến đạt ~${new Intl.NumberFormat('vi-VN').format(Math.round(nextForecastRevenue))} VNĐ, tăng ${growthPct.toFixed(1)}% so với năm hiện tại.`,
            });
        } else {
            insights.push({
                type: 'warning',
                title: `📉 Doanh thu dự kiến giảm ${Math.abs(growthPct).toFixed(1)}%`,
                message: `Nếu xu hướng hiện tại tiếp diễn, doanh thu năm tới có thể giảm còn ~${new Intl.NumberFormat('vi-VN').format(Math.round(nextForecastRevenue))} VNĐ. Cần hành động ngay để đảo chiều.`,
            });
        }
    }

    const lastNetIncome = enriched[enriched.length - 1]._netIncome;
    const nextNetIncome = netIncome.find(r => !r.actual)?.forecast || 0;
    if (lastNetIncome > 0 && nextNetIncome <= 0) {
        insights.push({
            type: 'negative',
            title: '🚨 Cảnh báo: Có thể lỗ năm tới',
            message: 'Mô hình dự báo lợi nhuận ròng có thể chuyển sang âm. Chi phí đang tăng nhanh hơn doanh thu. Cần review cấu trúc chi phí ngay.',
        });
    }

    // Burn rate projection
    const lastCash = years[years.length - 1].cash;
    if (lastCash > 0 && nextNetIncome < 0) {
        const monthsRunway = (lastCash / Math.abs(nextNetIncome)) * 12;
        insights.push({
            type: 'warning',
            title: `⏳ Cash Runway: ~${monthsRunway.toFixed(0)} tháng`,
            message: `Với dự trữ tiền mặt hiện tại và tốc độ "đốt" tiền dự kiến, vốn sẽ cạn kiệt trong khoảng ${monthsRunway.toFixed(0)} tháng nếu không có thay đổi.`,
        });
    }

    return { revenue, cogs, opex, netIncome, insights };
}
