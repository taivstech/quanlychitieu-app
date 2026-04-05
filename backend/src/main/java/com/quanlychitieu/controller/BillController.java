package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.BillRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.BillResponse;
import com.quanlychitieu.service.BillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BillResponse>>> getAllBills() {
        return ResponseEntity.ok(ApiResponse.success(billService.getAllBills()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getActiveBills() {
        return ResponseEntity.ok(ApiResponse.success(billService.getActiveBills()));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<BillResponse>>> getUpcomingBills() {
        return ResponseEntity.ok(ApiResponse.success(billService.getUpcomingBills()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BillResponse>> createBill(@Valid @RequestBody BillRequest request) {
        BillResponse response = billService.createBill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Bill created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BillResponse>> updateBill(
            @PathVariable Long id,
            @Valid @RequestBody BillRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Bill updated", billService.updateBill(id, request)));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<ApiResponse<BillResponse>> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Bill marked as paid", billService.markPaid(id)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleActive(@PathVariable Long id) {
        billService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success("Bill toggled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return ResponseEntity.ok(ApiResponse.success("Bill deleted", null));
    }
}
