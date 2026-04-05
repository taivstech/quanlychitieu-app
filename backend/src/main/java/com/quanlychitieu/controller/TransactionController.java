package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.TransactionRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.TransactionResponse;
import com.quanlychitieu.security.SecurityUtils;
import com.quanlychitieu.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactions(userId, page, size)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactionsByDateRange(startDate, endDate)));
    }

    @GetMapping("/wallet/{walletId}")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getByWallet(
            @PathVariable Long walletId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactionsByWallet(walletId, page, size)));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getByCategoryAndDateRange(
            @PathVariable Long categoryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTransactionsByCategoryAndDateRange(categoryId, startDate, endDate)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> searchTransactions(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.searchTransactions(userId, keyword, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(
            @Valid @RequestBody TransactionRequest request) {
        TransactionResponse response = transactionService.createTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Transaction updated", transactionService.updateTransaction(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted", null));
    }

    /**
     * Top spending — giao dịch chi lớn nhất trong khoảng thời gian
     */
    @GetMapping("/top-spending")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTopSpending(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                transactionService.getTopSpending(userId, startDate, endDate, limit)));
    }

    /**
     * Duplicate transaction — nhân bản giao dịch (ngày = hôm nay)
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<TransactionResponse>> duplicateTransaction(
            @PathVariable Long id) {
        TransactionResponse response = transactionService.duplicateTransaction(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Transaction duplicated", response));
    }
}
