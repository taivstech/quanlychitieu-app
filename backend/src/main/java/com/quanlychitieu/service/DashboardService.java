package com.quanlychitieu.service;

import com.quanlychitieu.dto.response.*;
import com.quanlychitieu.model.entity.Budget;
import com.quanlychitieu.model.entity.Debt;
import com.quanlychitieu.model.entity.Transaction;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final DebtRepository debtRepository;
    private final SavingGoalRepository savingGoalRepository;

    private static final Map<DayOfWeek, String> DAY_NAMES = Map.of(
            DayOfWeek.MONDAY, "Thứ 2",
            DayOfWeek.TUESDAY, "Thứ 3",
            DayOfWeek.WEDNESDAY, "Thứ 4",
            DayOfWeek.THURSDAY, "Thứ 5",
            DayOfWeek.FRIDAY, "Thứ 6",
            DayOfWeek.SATURDAY, "Thứ 7",
            DayOfWeek.SUNDAY, "Chủ nhật"
    );

    /**
     * Dashboard theo tháng — giống Money Lover:
     * Vuốt trái/phải chọn tháng, hiển thị giao dịch group theo ngày
     */
    public DashboardResponse getDashboard(Long userId, int month, int year) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        LocalDate today = LocalDate.now();

        // Tháng trước (để so sánh %)
        LocalDate prevMonthStart = monthStart.minusMonths(1);
        LocalDate prevMonthEnd = prevMonthStart.withDayOfMonth(prevMonthStart.lengthOfMonth());

        // Tổng balance (real-time, không phụ thuộc tháng)
        BigDecimal totalBalance = walletRepository.getTotalBalance(userId);

        // Thu chi tháng đang xem
        BigDecimal monthIncome = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.INCOME, monthStart, monthEnd);
        BigDecimal monthExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);

        // Thu chi tháng trước
        BigDecimal prevIncome = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.INCOME, prevMonthStart, prevMonthEnd);
        BigDecimal prevExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, prevMonthStart, prevMonthEnd);

        // === Giao dịch group theo ngày (giống Money Lover) ===
        List<Transaction> transactions = transactionRepository.findByUserIdAndDateRange(
                userId, monthStart, monthEnd);

        // Group by date, sorted desc (ngày mới nhất trước)
        Map<LocalDate, List<Transaction>> grouped = transactions.stream()
                .collect(Collectors.groupingBy(Transaction::getTransactionDate,
                        TreeMap::new, Collectors.toList()));

        List<DashboardResponse.DailyGroup> dailyGroups = new ArrayList<>();
        // Duyệt ngược (ngày mới nhất trước, giống Money Lover)
        List<LocalDate> sortedDates = new ArrayList<>(grouped.keySet());
        Collections.reverse(sortedDates);

        for (LocalDate date : sortedDates) {
            List<Transaction> dayTxns = grouped.get(date);
            BigDecimal dayIncome = BigDecimal.ZERO;
            BigDecimal dayExpense = BigDecimal.ZERO;

            List<DashboardResponse.TransactionItem> items = new ArrayList<>();
            for (Transaction t : dayTxns) {
                if (t.getType() == TransactionType.INCOME) {
                    dayIncome = dayIncome.add(t.getAmount());
                } else {
                    dayExpense = dayExpense.add(t.getAmount());
                }
                items.add(DashboardResponse.TransactionItem.builder()
                        .id(t.getId())
                        .amount(t.getAmount())
                        .type(t.getType())
                        .note(t.getNote())
                        .categoryId(t.getCategory().getId())
                        .categoryName(t.getCategory().getName())
                        .categoryIcon(t.getCategory().getIcon())
                        .categoryColor(t.getCategory().getColor())
                        .walletId(t.getWallet().getId())
                        .walletName(t.getWallet().getName())
                        .build());
            }

            dailyGroups.add(DashboardResponse.DailyGroup.builder()
                    .date(date)
                    .dayOfWeek(DAY_NAMES.get(date.getDayOfWeek()))
                    .dayIncome(dayIncome)
                    .dayExpense(dayExpense)
                    .dayNet(dayIncome.subtract(dayExpense))
                    .transactions(items)
                    .build());
        }

        // === Daily flow (cho biểu đồ) ===
        List<Object[]> incomeByDay = transactionRepository.sumByDayAndDateRange(
                userId, TransactionType.INCOME, monthStart, monthEnd);
        List<Object[]> expenseByDay = transactionRepository.sumByDayAndDateRange(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);

        Map<LocalDate, BigDecimal> incomeMap = new LinkedHashMap<>();
        Map<LocalDate, BigDecimal> expenseMap = new LinkedHashMap<>();
        for (Object[] row : incomeByDay) {
            incomeMap.put(toLocalDate(row[0]), (BigDecimal) row[1]);
        }
        for (Object[] row : expenseByDay) {
            expenseMap.put(toLocalDate(row[0]), (BigDecimal) row[1]);
        }

        // Merge tất cả ngày có data
        Set<LocalDate> allDates = new TreeSet<>();
        allDates.addAll(incomeMap.keySet());
        allDates.addAll(expenseMap.keySet());

        List<DashboardResponse.DailyAmount> dailyFlow = allDates.stream()
                .map(d -> DashboardResponse.DailyAmount.builder()
                        .date(d)
                        .income(incomeMap.getOrDefault(d, BigDecimal.ZERO))
                        .expense(expenseMap.getOrDefault(d, BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        // === Top categories (cả chi lẫn thu) ===
        List<Object[]> topExpCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);
        List<DashboardResponse.TopCategory> topExpenseCategories = buildTopCategories(topExpCats, monthExpense, 5);

        List<Object[]> topIncCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.INCOME, monthStart, monthEnd);
        List<DashboardResponse.TopCategory> topIncomeCategories = buildTopCategories(topIncCats, monthIncome, 5);

        // === Budget alerts (chỉ cho tháng đang xem) ===
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);
        List<DashboardResponse.BudgetAlert> alerts = budgets.stream()
                .map(b -> {
                    double usage = b.getUsagePercentage();
                    String status = usage >= 100 ? "EXCEEDED"
                            : usage >= 80 ? "DANGER"
                            : usage >= 60 ? "WARNING"
                            : "SAFE";
                    return DashboardResponse.BudgetAlert.builder()
                            .budgetId(b.getId())
                            .categoryName(b.getCategory().getName())
                            .categoryIcon(b.getCategory().getIcon())
                            .categoryColor(b.getCategory().getColor())
                            .limit(b.getAmountLimit())
                            .spent(b.getSpentAmount())
                            .usagePercent(usage)
                            .status(status)
                            .build();
                })
                .filter(a -> !a.getStatus().equals("SAFE"))
                .collect(Collectors.toList());

        // === Nợ sắp đến hạn (7 ngày tới - real-time) ===
        List<Debt> upcoming = debtRepository.findUpcomingDebts(userId, today, today.plusDays(7));
        List<DashboardResponse.UpcomingDebt> upcomingDebts = upcoming.stream()
                .map(d -> DashboardResponse.UpcomingDebt.builder()
                        .debtId(d.getId())
                        .personName(d.getPersonName())
                        .type(d.getType().name())
                        .remainingAmount(d.getRemainingAmount())
                        .dueDate(d.getDueDate().toString())
                        .daysLeft((int) ChronoUnit.DAYS.between(today, d.getDueDate()))
                        .build())
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .month(month)
                .year(year)
                .totalBalance(totalBalance)
                .monthIncome(monthIncome)
                .monthExpense(monthExpense)
                .monthNet(monthIncome.subtract(monthExpense))
                .incomeChangePercent(calcChangePercent(prevIncome, monthIncome))
                .expenseChangePercent(calcChangePercent(prevExpense, monthExpense))
                .dailyTransactions(dailyGroups)
                .dailyFlow(dailyFlow)
                .topExpenseCategories(topExpenseCategories)
                .topIncomeCategories(topIncomeCategories)
                .budgetAlerts(alerts)
                .upcomingDebts(upcomingDebts)
                .activeSavingGoals((int) savingGoalRepository.countByUserIdAndCompletedFalse(userId))
                .activeDebts((int) debtRepository.countByUserIdAndCompletedFalse(userId))
                .transactionCount(transactions.size())
                .build();
    }

    /**
     * So sánh chi tiêu tháng này vs tháng trước, breakdown theo từng category
     */
    public MonthlyComparisonResponse getMonthlyComparison(Long userId, int month, int year) {
        LocalDate currentStart = LocalDate.of(year, month, 1);
        LocalDate currentEnd = currentStart.withDayOfMonth(currentStart.lengthOfMonth());
        LocalDate prevStart = currentStart.minusMonths(1);
        LocalDate prevEnd = prevStart.withDayOfMonth(prevStart.lengthOfMonth());

        BigDecimal currentIncome = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.INCOME, currentStart, currentEnd);
        BigDecimal currentExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, currentStart, currentEnd);
        BigDecimal prevIncome = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.INCOME, prevStart, prevEnd);
        BigDecimal prevExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, prevStart, prevEnd);

        // Category breakdown comparison
        List<Object[]> currentCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, currentStart, currentEnd);
        List<Object[]> prevCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, prevStart, prevEnd);

        // Map previous amounts by categoryId
        var prevMap = prevCats.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (BigDecimal) row[4]
                ));

        List<MonthlyComparisonResponse.CategoryComparison> comparisons = currentCats.stream()
                .map(row -> {
                    Long catId = (Long) row[0];
                    BigDecimal currentAmt = (BigDecimal) row[4];
                    BigDecimal prevAmt = prevMap.getOrDefault(catId, BigDecimal.ZERO);
                    double change = calcChangePercent(prevAmt, currentAmt);
                    String trend = change > 5 ? "UP" : change < -5 ? "DOWN" : "STABLE";

                    return MonthlyComparisonResponse.CategoryComparison.builder()
                            .categoryId(catId)
                            .categoryName((String) row[1])
                            .categoryIcon((String) row[2])
                            .categoryColor((String) row[3])
                            .currentAmount(currentAmt)
                            .previousAmount(prevAmt)
                            .changePercent(change)
                            .trend(trend)
                            .build();
                })
                .collect(Collectors.toList());

        return MonthlyComparisonResponse.builder()
                .currentMonth(month)
                .currentYear(year)
                .previousMonth(prevStart.getMonthValue())
                .previousYear(prevStart.getYear())
                .currentIncome(currentIncome)
                .currentExpense(currentExpense)
                .previousIncome(prevIncome)
                .previousExpense(prevExpense)
                .incomeChangePercent(calcChangePercent(prevIncome, currentIncome))
                .expenseChangePercent(calcChangePercent(prevExpense, currentExpense))
                .categoryComparisons(comparisons)
                .build();
    }

    /**
     * Spending insights: phân tích thông minh và tạo gợi ý cho user
     */
    public SpendingInsightResponse getSpendingInsights(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate prevMonthStart = monthStart.minusMonths(1);
        LocalDate prevMonthEnd = prevMonthStart.withDayOfMonth(prevMonthStart.lengthOfMonth());

        List<SpendingInsightResponse.Insight> insights = new ArrayList<>();

        // 1. So sánh tổng chi tháng này vs tháng trước
        BigDecimal currentExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);
        BigDecimal prevExpense = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.EXPENSE, prevMonthStart, prevMonthEnd);
        BigDecimal currentIncome = transactionRepository.sumByTypeAndDateRange(
                userId, TransactionType.INCOME, monthStart, monthEnd);

        double expenseChange = calcChangePercent(prevExpense, currentExpense);
        if (expenseChange > 20) {
            insights.add(SpendingInsightResponse.Insight.builder()
                    .type("WARNING")
                    .icon("trending-up")
                    .color("#FF6B6B")
                    .message(String.format("Chi tiêu tăng %.0f%% so với tháng trước", expenseChange))
                    .detail(String.format("Tháng này: %s | Tháng trước: %s",
                            formatAmount(currentExpense), formatAmount(prevExpense)))
                    .build());
        } else if (expenseChange < -10) {
            insights.add(SpendingInsightResponse.Insight.builder()
                    .type("DECREASE")
                    .icon("trending-down")
                    .color("#2ECC71")
                    .message(String.format("Tuyệt vời! Chi tiêu giảm %.0f%% so với tháng trước", Math.abs(expenseChange)))
                    .detail("Tiếp tục duy trì thói quen tốt này nhé!")
                    .build());
        }

        // 2. Tỷ lệ tiết kiệm
        if (currentIncome.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal savingRate = currentIncome.subtract(currentExpense)
                    .divide(currentIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            if (savingRate.doubleValue() > 30) {
                insights.add(SpendingInsightResponse.Insight.builder()
                        .type("ACHIEVEMENT")
                        .icon("emoji-events")
                        .color("#F39C12")
                        .message(String.format("Tỷ lệ tiết kiệm: %.0f%%", savingRate.doubleValue()))
                        .detail("Xuất sắc! Bạn tiết kiệm được hơn 30% thu nhập")
                        .build());
            } else if (savingRate.doubleValue() < 0) {
                insights.add(SpendingInsightResponse.Insight.builder()
                        .type("WARNING")
                        .icon("warning")
                        .color("#E74C3C")
                        .message("Chi tiêu vượt quá thu nhập!")
                        .detail(String.format("Bạn đang chi nhiều hơn thu nhập %s",
                                formatAmount(currentExpense.subtract(currentIncome))))
                        .build());
            }
        }

        // 3. Category tăng mạnh nhất
        List<Object[]> currentCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, monthStart, monthEnd);
        List<Object[]> prevCats = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, prevMonthStart, prevMonthEnd);

        var prevMap = prevCats.stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (BigDecimal) row[4]));

        for (Object[] row : currentCats) {
            Long catId = (Long) row[0];
            String catName = (String) row[1];
            BigDecimal currentAmt = (BigDecimal) row[4];
            BigDecimal prevAmt = prevMap.getOrDefault(catId, BigDecimal.ZERO);
            double change = calcChangePercent(prevAmt, currentAmt);

            if (change > 50 && prevAmt.compareTo(BigDecimal.ZERO) > 0) {
                insights.add(SpendingInsightResponse.Insight.builder()
                        .type("INCREASE")
                        .icon("arrow-upward")
                        .color("#FF9800")
                        .message(String.format("%s tăng %.0f%% so với tháng trước", catName, change))
                        .detail(String.format("%s → %s", formatAmount(prevAmt), formatAmount(currentAmt)))
                        .build());
            }
        }

        // 4. Budget cảnh báo
        List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(
                userId, today.getMonthValue(), today.getYear());
        for (Budget b : budgets) {
            double usage = b.getUsagePercentage();
            if (usage >= 90 && usage < 100) {
                insights.add(SpendingInsightResponse.Insight.builder()
                        .type("WARNING")
                        .icon("notifications")
                        .color("#E67E22")
                        .message(String.format("Ngân sách %s sắp hết (%.0f%%)", b.getCategory().getName(), usage))
                        .detail(String.format("Còn lại: %s", formatAmount(b.getRemainingAmount())))
                        .build());
            } else if (usage >= 100) {
                insights.add(SpendingInsightResponse.Insight.builder()
                        .type("WARNING")
                        .icon("error")
                        .color("#E74C3C")
                        .message(String.format("Đã VƯỢT ngân sách %s!", b.getCategory().getName()))
                        .detail(String.format("Vượt: %s",
                                formatAmount(b.getSpentAmount().subtract(b.getAmountLimit()))))
                        .build());
            }
        }

        // 5. Nợ sắp đến hạn
        List<Debt> upcomingDebts = debtRepository.findUpcomingDebts(userId, today, today.plusDays(3));
        for (Debt d : upcomingDebts) {
            long daysLeft = ChronoUnit.DAYS.between(today, d.getDueDate());
            insights.add(SpendingInsightResponse.Insight.builder()
                    .type("WARNING")
                    .icon("schedule")
                    .color("#9B59B6")
                    .message(String.format("Nợ %s còn %d ngày đến hạn", d.getPersonName(), daysLeft))
                    .detail(String.format("Còn phải trả: %s", formatAmount(d.getRemainingAmount())))
                    .build());
        }

        // 6. Tip nếu không có cảnh báo
        if (insights.isEmpty()) {
            insights.add(SpendingInsightResponse.Insight.builder()
                    .type("TIP")
                    .icon("lightbulb")
                    .color("#3498DB")
                    .message("Tài chính ổn định!")
                    .detail("Hãy đặt mục tiêu tiết kiệm để tích lũy hiệu quả hơn")
                    .build());
        }

        return SpendingInsightResponse.builder().insights(insights).build();
    }

    /**
     * Trending Report — signature Money Lover feature:
     * So sánh chi tiêu/thu nhập tích lũy tháng hiện tại vs trung bình 3 tháng trước.
     * Client vẽ 2 đường: đỏ = tháng hiện tại, xám = trung bình 3 tháng.
     */
    public TrendingReportResponse getTrendingReport(Long userId, int month, int year) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        LocalDate today = LocalDate.now();

        // Nếu xem tháng hiện tại → chỉ đến hôm nay
        LocalDate effectiveEnd = (month == today.getMonthValue() && year == today.getYear())
                ? today : monthEnd;

        // Data tháng hiện tại
        Map<LocalDate, BigDecimal> currentExpDaily = getDailyMap(userId, TransactionType.EXPENSE, monthStart, effectiveEnd);
        Map<LocalDate, BigDecimal> currentIncDaily = getDailyMap(userId, TransactionType.INCOME, monthStart, effectiveEnd);

        // Data 3 tháng trước
        Map<Integer, BigDecimal> avgExpByDay = new HashMap<>();
        Map<Integer, BigDecimal> avgIncByDay = new HashMap<>();
        int monthsWithData = 0;

        for (int i = 1; i <= 3; i++) {
            LocalDate prevStart = monthStart.minusMonths(i);
            LocalDate prevEnd = prevStart.withDayOfMonth(prevStart.lengthOfMonth());
            Map<LocalDate, BigDecimal> prevExp = getDailyMap(userId, TransactionType.EXPENSE, prevStart, prevEnd);
            Map<LocalDate, BigDecimal> prevInc = getDailyMap(userId, TransactionType.INCOME, prevStart, prevEnd);

            if (!prevExp.isEmpty() || !prevInc.isEmpty()) {
                monthsWithData++;
            }

            // Tích lũy theo dayOfMonth
            BigDecimal cumExp = BigDecimal.ZERO;
            BigDecimal cumInc = BigDecimal.ZERO;
            for (int d = 1; d <= prevEnd.getDayOfMonth(); d++) {
                LocalDate date = prevStart.withDayOfMonth(d);
                cumExp = cumExp.add(prevExp.getOrDefault(date, BigDecimal.ZERO));
                cumInc = cumInc.add(prevInc.getOrDefault(date, BigDecimal.ZERO));
                avgExpByDay.merge(d, cumExp, BigDecimal::add);
                avgIncByDay.merge(d, cumInc, BigDecimal::add);
            }
        }

        // Chia để lấy trung bình
        int divisor = Math.max(monthsWithData, 1);

        // Build trend points
        List<TrendingReportResponse.TrendPoint> expenseTrend = new ArrayList<>();
        List<TrendingReportResponse.TrendPoint> incomeTrend = new ArrayList<>();

        BigDecimal cumCurrentExp = BigDecimal.ZERO;
        BigDecimal cumCurrentInc = BigDecimal.ZERO;

        for (int d = 1; d <= effectiveEnd.getDayOfMonth(); d++) {
            LocalDate date = monthStart.withDayOfMonth(d);
            cumCurrentExp = cumCurrentExp.add(currentExpDaily.getOrDefault(date, BigDecimal.ZERO));
            cumCurrentInc = cumCurrentInc.add(currentIncDaily.getOrDefault(date, BigDecimal.ZERO));

            BigDecimal avgExp = avgExpByDay.getOrDefault(d, BigDecimal.ZERO)
                    .divide(BigDecimal.valueOf(divisor), 0, RoundingMode.HALF_UP);
            BigDecimal avgInc = avgIncByDay.getOrDefault(d, BigDecimal.ZERO)
                    .divide(BigDecimal.valueOf(divisor), 0, RoundingMode.HALF_UP);

            expenseTrend.add(TrendingReportResponse.TrendPoint.builder()
                    .date(date).dayOfMonth(d)
                    .currentCumulative(cumCurrentExp)
                    .avgCumulative(avgExp)
                    .build());

            incomeTrend.add(TrendingReportResponse.TrendPoint.builder()
                    .date(date).dayOfMonth(d)
                    .currentCumulative(cumCurrentInc)
                    .avgCumulative(avgInc)
                    .build());
        }

        BigDecimal currentExpTotal = cumCurrentExp;
        BigDecimal currentIncTotal = cumCurrentInc;
        BigDecimal avgExpTotal = avgExpByDay.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(divisor), 0, RoundingMode.HALF_UP);
        BigDecimal avgIncTotal = avgIncByDay.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(divisor), 0, RoundingMode.HALF_UP);

        return TrendingReportResponse.builder()
                .month(month).year(year)
                .currentExpenseTotal(currentExpTotal)
                .currentIncomeTotal(currentIncTotal)
                .avgExpenseTotal(avgExpTotal)
                .avgIncomeTotal(avgIncTotal)
                .expenseTrend(expenseTrend)
                .incomeTrend(incomeTrend)
                .build();
    }

    /**
     * Category Report — báo cáo cho 1 category cụ thể theo thời gian
     */
    public CategoryReportResponse getCategoryReport(Long userId, Long categoryId,
                                                     LocalDate startDate, LocalDate endDate) {
        List<Object[]> dailyData = transactionRepository.sumByCategoryAndDay(
                userId, categoryId, startDate, endDate);

        BigDecimal total = BigDecimal.ZERO;
        int txCount = 0;
        List<ReportResponse.DailyAmount> dailyAmounts = new ArrayList<>();

        for (Object[] row : dailyData) {
            BigDecimal amt = (BigDecimal) row[1];
            total = total.add(amt);
            txCount++;
            dailyAmounts.add(ReportResponse.DailyAmount.builder()
                    .date(toLocalDate(row[0]).toString())
                    .amount(amt)
                    .build());
        }

        long daysBetween = Math.max(ChronoUnit.DAYS.between(startDate, endDate) + 1, 1);
        BigDecimal dailyAvg = total.divide(BigDecimal.valueOf(daysBetween), 0, RoundingMode.HALF_UP);

        // Get category info from any of the query results or fetch separately
        List<Object[]> catInfo = transactionRepository.sumByCategoryAndDateRange(
                userId, TransactionType.EXPENSE, startDate, endDate);
        String catName = "", catIcon = "", catColor = "";
        for (Object[] row : catInfo) {
            if (((Long) row[0]).equals(categoryId)) {
                catName = (String) row[1];
                catIcon = (String) row[2];
                catColor = (String) row[3];
                break;
            }
        }
        // Fallback: also check income categories
        if (catName.isEmpty()) {
            catInfo = transactionRepository.sumByCategoryAndDateRange(
                    userId, TransactionType.INCOME, startDate, endDate);
            for (Object[] row : catInfo) {
                if (((Long) row[0]).equals(categoryId)) {
                    catName = (String) row[1];
                    catIcon = (String) row[2];
                    catColor = (String) row[3];
                    break;
                }
            }
        }

        return CategoryReportResponse.builder()
                .categoryId(categoryId)
                .categoryName(catName)
                .categoryIcon(catIcon)
                .categoryColor(catColor)
                .totalAmount(total)
                .dailyAverage(dailyAvg)
                .transactionCount(txCount)
                .dailyAmounts(dailyAmounts)
                .build();
    }

    private Map<LocalDate, BigDecimal> getDailyMap(Long userId, TransactionType type,
                                                    LocalDate start, LocalDate end) {
        List<Object[]> rows = transactionRepository.sumByDayForReport(userId, type, start, end);
        Map<LocalDate, BigDecimal> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            map.put(toLocalDate(row[0]), (BigDecimal) row[1]);
        }
        return map;
    }

    private List<DashboardResponse.TopCategory> buildTopCategories(
            List<Object[]> cats, BigDecimal total, int limit) {
        return cats.stream()
                .limit(limit)
                .map(row -> DashboardResponse.TopCategory.builder()
                        .categoryId((Long) row[0])
                        .categoryName((String) row[1])
                        .categoryIcon((String) row[2])
                        .categoryColor((String) row[3])
                        .amount((BigDecimal) row[4])
                        .percentage(total.compareTo(BigDecimal.ZERO) > 0
                                ? ((BigDecimal) row[4]).divide(total, 4, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(100)).doubleValue()
                                : 0)
                        .build())
                .collect(Collectors.toList());
    }

    private LocalDate toLocalDate(Object dateObj) {
        if (dateObj instanceof LocalDate) return (LocalDate) dateObj;
        if (dateObj instanceof java.sql.Date) return ((java.sql.Date) dateObj).toLocalDate();
        return LocalDate.parse(dateObj.toString());
    }

    private double calcChangePercent(BigDecimal previous, BigDecimal current) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
    }

    private String formatAmount(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.valueOf(1_000_000)) >= 0) {
            return String.format("%.1ftr", amount.doubleValue() / 1_000_000);
        } else if (amount.compareTo(BigDecimal.valueOf(1_000)) >= 0) {
            return String.format("%.0fk", amount.doubleValue() / 1_000);
        }
        return amount.toPlainString();
    }
}
