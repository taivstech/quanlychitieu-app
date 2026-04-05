package com.quanlychitieu.controller;

import com.quanlychitieu.dto.response.*;
import com.quanlychitieu.security.SecurityUtils;
import com.quanlychitieu.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    /**
     * Dashboard theo tháng — giống Money Lover
     * GET /dashboard              → tháng hiện tại
     * GET /dashboard?month=1&year=2026 → tháng 1/2026
     */
    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        Long userId = securityUtils.getCurrentUserId();
        LocalDate now = LocalDate.now();
        int m = (month != null) ? month : now.getMonthValue();
        int y = (year != null) ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard(userId, m, y)));
    }

    @GetMapping("/comparison")
    public ResponseEntity<ApiResponse<MonthlyComparisonResponse>> getMonthlyComparison(
            @RequestParam Integer month,
            @RequestParam Integer year) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getMonthlyComparison(userId, month, year)));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<SpendingInsightResponse>> getSpendingInsights() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getSpendingInsights(userId)));
    }

    /**
     * Trending Report — signature Money Lover:
     * So sánh chi tiêu tích lũy tháng hiện tại vs trung bình 3 tháng trước
     */
    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<TrendingReportResponse>> getTrendingReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        Long userId = securityUtils.getCurrentUserId();
        LocalDate now = LocalDate.now();
        int m = (month != null) ? month : now.getMonthValue();
        int y = (year != null) ? year : now.getYear();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getTrendingReport(userId, m, y)));
    }

    /**
     * Category Report — báo cáo chi tiết cho 1 danh mục
     */
    @GetMapping("/category-report/{categoryId}")
    public ResponseEntity<ApiResponse<CategoryReportResponse>> getCategoryReport(
            @PathVariable Long categoryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                dashboardService.getCategoryReport(userId, categoryId, startDate, endDate)));
    }
}
