package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * So sánh chi tiêu tháng này vs tháng trước.
 * Demo: "Tháng này bạn chi nhiều hơn 23% so với tháng trước"
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyComparisonResponse {
    private int currentMonth;
    private int currentYear;
    private int previousMonth;
    private int previousYear;

    // Tổng thu chi 2 tháng
    private BigDecimal currentIncome;
    private BigDecimal currentExpense;
    private BigDecimal previousIncome;
    private BigDecimal previousExpense;

    // Phần trăm thay đổi
    private double incomeChangePercent;
    private double expenseChangePercent;

    // So sánh theo từng category
    private List<CategoryComparison> categoryComparisons;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryComparison {
        private Long categoryId;
        private String categoryName;
        private String categoryIcon;
        private String categoryColor;
        private BigDecimal currentAmount;
        private BigDecimal previousAmount;
        private double changePercent;
        private String trend; // UP, DOWN, STABLE
    }
}
