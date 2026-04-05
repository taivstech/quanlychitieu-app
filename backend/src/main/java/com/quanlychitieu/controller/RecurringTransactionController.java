package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.RecurringTransactionRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.RecurringTransactionResponse;
import com.quanlychitieu.service.RecurringTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recurring")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService recurringService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RecurringTransactionResponse>>> getActiveRecurring() {
        return ResponseEntity.ok(ApiResponse.success(recurringService.getActiveRecurring()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RecurringTransactionResponse>> createRecurring(
            @Valid @RequestBody RecurringTransactionRequest request) {
        RecurringTransactionResponse result = recurringService.createRecurring(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Recurring transaction created", result));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        recurringService.deactivateRecurring(id);
        return ResponseEntity.ok(ApiResponse.success("Recurring transaction deactivated", null));
    }
}
