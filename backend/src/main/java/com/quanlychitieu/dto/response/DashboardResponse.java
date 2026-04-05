package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Dashboard API response — giống Money Lover:
 * - Chọn tháng (vuốt trái/phải)
 * - Tổng thu/chi/net của tháng đó
 * - Giao dịch group theo ngày (mỗi ngày: date, tổng thu, tổng chi, danh sách)
 * - Top category, budget alerts, nợ sắp đến hạn
 * - Daily flow (cho biểu đồ)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // Tháng đang xem
    private int month;
    private int year;

    // Tổng số dư tất cả ví (real-time, không phụ thuộc tháng)
    private BigDecimal totalBalance;

    // Thu chi tháng đang xem
    private BigDecimal monthIncome;
    private BigDecimal monthExpense;
    private BigDecimal monthNet;

    // So sánh với tháng trước (%)
    private double incomeChangePercent;
    private double expenseChangePercent;

    // Giao dịch group theo ngày (giống Money Lover: mỗi ngày 1 section)
    private List<DailyGroup> dailyTransactions;

    // Daily flow data (cho biểu đồ đường/bar chart)
    private List<DailyAmount> dailyFlow;

    // Top 5 danh mục chi nhiều nhất tháng
    private List<TopCategory> topExpenseCategories;

    // Top 5 danh mục thu nhiều nhất
    private List<TopCategory> topIncomeCategories;

    // Cảnh báo ngân sách
    private List<BudgetAlert> budgetAlerts;

    // Nợ sắp đến hạn (trong 7 ngày tới)
    private List<UpcomingDebt> upcomingDebts;

    // Counts
    private int activeSavingGoals;
    private int activeDebts;
    private int transactionCount;

    // === Inner DTOs ===

    /**
     * 1 ngày = 1 section: ngày, thu/chi trong ngày, danh sách giao dịch
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyGroup {
        private LocalDate date;
        private String dayOfWeek;    // "Thứ 2", "Chủ nhật", ...
        private BigDecimal dayIncome;
        private BigDecimal dayExpense;
        private BigDecimal dayNet;
        private List<TransactionItem> transactions;
    }

    /**
     * 1 giao dịch trong daily group
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionItem {
        private Long id;
        private BigDecimal amount;
        private TransactionType type;
        private String note;
        private Long categoryId;
        private String categoryName;
        private String categoryIcon;
        private String categoryColor;
        private Long walletId;
        private String walletName;
    }

    /**
     * Thu/chi theo ngày (cho biểu đồ)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAmount {
        private LocalDate date;
        private BigDecimal income;
        private BigDecimal expense;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCategory {
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
    public static class BudgetAlert {
        private Long budgetId;
        private String categoryName;
        private String categoryIcon;
        private String categoryColor;
        private BigDecimal limit;
        private BigDecimal spent;
        private double usagePercent;
        private String status; // SAFE, WARNING, DANGER, EXCEEDED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingDebt {
        private Long debtId;
        private String personName;
        private String type;
        private BigDecimal remainingAmount;
        private String dueDate;
        private int daysLeft;
    }
}
