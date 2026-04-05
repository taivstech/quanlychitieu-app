package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Trending Report — giống Money Lover Home Screen:
 * So sánh chi tiêu tích lũy tháng hiện tại vs trung bình 3 tháng trước.
 * X = ngày trong tháng, Y = tổng chi/thu tích lũy từ đầu tháng đến ngày đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingReportResponse {

    private int month;
    private int year;

    // Tổng chi/thu tháng đang xem
    private BigDecimal currentExpenseTotal;
    private BigDecimal currentIncomeTotal;

    // Trung bình 3 tháng trước
    private BigDecimal avgExpenseTotal;
    private BigDecimal avgIncomeTotal;

    // Điểm dữ liệu cho biểu đồ đường
    private List<TrendPoint> expenseTrend;
    private List<TrendPoint> incomeTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPoint {
        private LocalDate date;
        private int dayOfMonth;
        private BigDecimal currentCumulative;   // Tích lũy tháng hiện tại đến ngày này
        private BigDecimal avgCumulative;        // Trung bình 3 tháng trước tích lũy đến ngày này
    }
}
