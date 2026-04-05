package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Report cho 1 danh mục cụ thể — xem chi tiêu category đó theo thời gian.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryReportResponse {

    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    private BigDecimal totalAmount;
    private BigDecimal dailyAverage;
    private int transactionCount;

    // Data theo ngày (cho bar chart)
    private List<ReportResponse.DailyAmount> dailyAmounts;

    // Data theo tháng (cho trend chart, nếu xem theo quarter/year)
    private List<MonthlyAmount> monthlyAmounts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyAmount {
        private int month;
        private int year;
        private BigDecimal amount;
    }
}
