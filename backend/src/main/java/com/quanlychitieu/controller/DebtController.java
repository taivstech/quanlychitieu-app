package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.DebtPaymentRequest;
import com.quanlychitieu.dto.request.DebtRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.DebtResponse;
import com.quanlychitieu.model.enums.DebtType;
import com.quanlychitieu.service.DebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/debts")
@RequiredArgsConstructor
public class DebtController {

    private final DebtService debtService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getAllDebts() {
        return ResponseEntity.ok(ApiResponse.success(debtService.getAllDebts()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getActiveDebts() {
        return ResponseEntity.ok(ApiResponse.success(debtService.getActiveDebts()));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<ApiResponse<List<DebtResponse>>> getDebtsByType(@PathVariable DebtType type) {
        return ResponseEntity.ok(ApiResponse.success(debtService.getDebtsByType(type)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(debtService.getSummary()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DebtResponse>> createDebt(@Valid @RequestBody DebtRequest request) {
        DebtResponse response = debtService.createDebt(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Debt created", response));
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<DebtResponse>> makePayment(
            @PathVariable Long id,
            @Valid @RequestBody DebtPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment recorded", debtService.makePayment(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDebt(@PathVariable Long id) {
        debtService.deleteDebt(id);
        return ResponseEntity.ok(ApiResponse.success("Debt deleted", null));
    }
}
