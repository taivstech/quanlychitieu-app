package com.quanlychitieu.controller;

import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.ReportResponse;
import com.quanlychitieu.dto.response.TrendResponse;
import com.quanlychitieu.security.SecurityUtils;
import com.quanlychitieu.service.ExportService;
import com.quanlychitieu.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ExportService exportService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        ReportResponse report = reportService.generateReport(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<ReportResponse>> getMonthlyReport(
            @RequestParam Integer month,
            @RequestParam Integer year) {
        Long userId = securityUtils.getCurrentUserId();
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
        ReportResponse report = reportService.generateReport(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/export/excel")
    public CompletableFuture<ResponseEntity<byte[]>> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return exportService.exportToExcel(startDate, endDate)
                .thenApply(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=transactions_" + startDate + "_" + endDate + ".xlsx")
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .body(bytes));
    }

    @GetMapping("/trend")
    public ResponseEntity<ApiResponse<TrendResponse>> getTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        TrendResponse trend = reportService.generateTrend(userId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(trend));
    }
}
