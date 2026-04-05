package com.quanlychitieu.service;

import com.quanlychitieu.dto.response.ReportResponse;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Tách riêng @Async methods ra class khác để Spring AOP proxy hoạt động đúng.
 *
 * VẤN ĐỀ: Khi class A gọi @Async method trong chính class A (self-invocation),
 * Spring proxy KHÔNG intercept → method chạy ĐỒNG BỘ như bình thường.
 *
 * FIX: Tách @Async methods ra class B, inject B vào A → proxy hoạt động → chạy bất đồng bộ thật.
 *
 * Đây là kiến thức quan trọng về Spring AOP Proxy mà nhiều developer bỏ qua.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportQueryService {

    private final TransactionRepository transactionRepository;

    @Async("taskExecutor")
    public CompletableFuture<BigDecimal> calculateTotalAsync(Long userId, TransactionType type,
                                                              LocalDate startDate, LocalDate endDate) {
        log.debug("Calculating total {} on thread: {}", type, Thread.currentThread().getName());
        BigDecimal total = transactionRepository.sumByTypeAndDateRange(userId, type, startDate, endDate);
        return CompletableFuture.completedFuture(total);
    }

    @Async("taskExecutor")
    public CompletableFuture<List<ReportResponse.CategoryBreakdown>> getCategoryBreakdownAsync(
            Long userId, TransactionType type, LocalDate startDate, LocalDate endDate) {
        log.debug("Getting category breakdown on thread: {}", Thread.currentThread().getName());

        List<Object[]> results = transactionRepository.sumByCategoryAndDateRange(userId, type, startDate, endDate);
        BigDecimal total = transactionRepository.sumByTypeAndDateRange(userId, type, startDate, endDate);

        List<ReportResponse.CategoryBreakdown> breakdowns = results.stream()
                .map(row -> ReportResponse.CategoryBreakdown.builder()
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

        return CompletableFuture.completedFuture(breakdowns);
    }

    @Async("taskExecutor")
    public CompletableFuture<List<ReportResponse.DailyAmount>> getDailyAmountsAsync(
            Long userId, TransactionType type, LocalDate startDate, LocalDate endDate) {
        log.debug("Getting daily amounts on thread: {}", Thread.currentThread().getName());

        List<Object[]> results = transactionRepository.sumByDayAndDateRange(userId, type, startDate, endDate);

        List<ReportResponse.DailyAmount> dailyAmounts = results.stream()
                .map(row -> ReportResponse.DailyAmount.builder()
                        .date(row[0].toString())
                        .amount((BigDecimal) row[1])
                        .build())
                .collect(Collectors.toList());

        return CompletableFuture.completedFuture(dailyAmounts);
    }
}
