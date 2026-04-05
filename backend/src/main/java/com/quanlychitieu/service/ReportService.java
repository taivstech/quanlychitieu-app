package com.quanlychitieu.service;

import com.quanlychitieu.dto.response.ReportResponse;
import com.quanlychitieu.dto.response.TrendResponse;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * ReportService: orchestrate báo cáo, delegate @Async queries sang ReportQueryService.
 *
 * TẠI SAO tách ra 2 class?
 * Spring AOP Proxy chỉ intercept khi gọi qua proxy (từ class khác).
 * Nếu gọi @Async method trong cùng class (self-invocation) → @Async bị bỏ qua → chạy đồng bộ.
 * → Tách @Async sang ReportQueryService → proxy hoạt động → 6 queries chạy song song thật sự.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportQueryService reportQueryService;
    private final TransactionRepository transactionRepository;

    @Cacheable(value = "reports", key = "'user_' + #userId + '_' + #startDate + '_' + #endDate")
    public ReportResponse generateReport(Long userId, LocalDate startDate, LocalDate endDate) {
        // 6 queries chạy SONG SONG trên thread pool (qua proxy → @Async hoạt động đúng)
        CompletableFuture<BigDecimal> totalIncomeFuture =
                reportQueryService.calculateTotalAsync(userId, TransactionType.INCOME, startDate, endDate);
        CompletableFuture<BigDecimal> totalExpenseFuture =
                reportQueryService.calculateTotalAsync(userId, TransactionType.EXPENSE, startDate, endDate);
        CompletableFuture<List<ReportResponse.CategoryBreakdown>> expenseByCatFuture =
                reportQueryService.getCategoryBreakdownAsync(userId, TransactionType.EXPENSE, startDate, endDate);
        CompletableFuture<List<ReportResponse.CategoryBreakdown>> incomeByCatFuture =
                reportQueryService.getCategoryBreakdownAsync(userId, TransactionType.INCOME, startDate, endDate);
        CompletableFuture<List<ReportResponse.DailyAmount>> dailyExpenseFuture =
                reportQueryService.getDailyAmountsAsync(userId, TransactionType.EXPENSE, startDate, endDate);
        CompletableFuture<List<ReportResponse.DailyAmount>> dailyIncomeFuture =
                reportQueryService.getDailyAmountsAsync(userId, TransactionType.INCOME, startDate, endDate);

        // Chờ tất cả hoàn thành
        CompletableFuture.allOf(
                totalIncomeFuture, totalExpenseFuture,
                expenseByCatFuture, incomeByCatFuture,
                dailyExpenseFuture, dailyIncomeFuture
        ).join();

        BigDecimal totalIncome = totalIncomeFuture.join();
        BigDecimal totalExpense = totalExpenseFuture.join();

        // Opening balance = (tổng thu - tổng chi) TRƯỚC startDate
        BigDecimal incomeBeforeStart = transactionRepository.sumByTypeAndDateRangeForReport(
                userId, TransactionType.INCOME, LocalDate.of(2000, 1, 1), startDate.minusDays(1));
        BigDecimal expenseBeforeStart = transactionRepository.sumByTypeAndDateRangeForReport(
                userId, TransactionType.EXPENSE, LocalDate.of(2000, 1, 1), startDate.minusDays(1));
        BigDecimal openingBalance = incomeBeforeStart.subtract(expenseBeforeStart);
        BigDecimal endingBalance = openingBalance.add(totalIncome).subtract(totalExpense);

        // Daily average expense
        long days = Math.max(ChronoUnit.DAYS.between(startDate, endDate) + 1, 1);
        BigDecimal dailyAvgExpense = totalExpense.divide(BigDecimal.valueOf(days), 0, RoundingMode.HALF_UP);

        return ReportResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netAmount(totalIncome.subtract(totalExpense))
                .openingBalance(openingBalance)
                .endingBalance(endingBalance)
                .dailyAverageExpense(dailyAvgExpense)
                .expenseByCategory(expenseByCatFuture.join())
                .incomeByCategory(incomeByCatFuture.join())
                .dailyExpenses(dailyExpenseFuture.join())
                .dailyIncomes(dailyIncomeFuture.join())
                .build();
    }

    @Cacheable(value = "trends", key = "'user_' + #userId + '_' + #startDate + '_' + #endDate")
    public TrendResponse generateTrend(Long userId, LocalDate startDate, LocalDate endDate) {
        List<Object[]> weeklyRaw = transactionRepository.sumByWeekAndType(userId, startDate, endDate);

        // Build a map: (year, week) -> {INCOME: x, EXPENSE: y}
        Map<String, BigDecimal[]> weekMap = new LinkedHashMap<>();
        for (Object[] row : weeklyRaw) {
            int year = ((Number) row[0]).intValue();
            int week = ((Number) row[1]).intValue();
            String key = year + "-W" + week;
            String typeStr = row[2].toString();
            BigDecimal amount = (row[3] instanceof BigDecimal) ? (BigDecimal) row[3] : new BigDecimal(row[3].toString());

            weekMap.computeIfAbsent(key, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if ("INCOME".equals(typeStr)) {
                weekMap.get(key)[0] = weekMap.get(key)[0].add(amount);
            } else if ("EXPENSE".equals(typeStr)) {
                weekMap.get(key)[1] = weekMap.get(key)[1].add(amount);
            }
        }

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        List<TrendResponse.WeeklyData> weeklyData = new ArrayList<>();

        for (Map.Entry<String, BigDecimal[]> entry : weekMap.entrySet()) {
            String key = entry.getKey();
            BigDecimal inc = entry.getValue()[0];
            BigDecimal exp = entry.getValue()[1];
            String[] parts = key.split("-W");
            int year = Integer.parseInt(parts[0]);
            int week = Integer.parseInt(parts[1]);
            totalIncome = totalIncome.add(inc);
            totalExpense = totalExpense.add(exp);

            weeklyData.add(TrendResponse.WeeklyData.builder()
                    .year(year)
                    .week(week)
                    .label("T" + week)
                    .income(inc)
                    .expense(exp)
                    .net(inc.subtract(exp))
                    .build());
        }

        return TrendResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netAmount(totalIncome.subtract(totalExpense))
                .weeklyData(weeklyData)
                .build();
    }
}
