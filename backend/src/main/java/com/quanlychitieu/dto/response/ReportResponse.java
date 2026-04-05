package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal netAmount;

    // Opening/Ending balance (giống Money Lover)
    private BigDecimal openingBalance;
    private BigDecimal endingBalance;

    // Daily average spending
    private BigDecimal dailyAverageExpense;

    private List<CategoryBreakdown> expenseByCategory;
    private List<CategoryBreakdown> incomeByCategory;
    private List<DailyAmount> dailyExpenses;
    private List<DailyAmount> dailyIncomes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryBreakdown {
        private Long categoryId;
        private String categoryName;
        private String categoryIcon;
        private String categoryColor;
        private BigDecimal amount;
        private double percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAmount {
        private String date;
        private BigDecimal amount;
    }
}
