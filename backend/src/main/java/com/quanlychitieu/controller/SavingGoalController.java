package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.AmountRequest;
import com.quanlychitieu.dto.request.SavingGoalRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.SavingGoalResponse;
import com.quanlychitieu.service.SavingGoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/saving-goals")
@RequiredArgsConstructor
public class SavingGoalController {

    private final SavingGoalService savingGoalService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SavingGoalResponse>>> getAllGoals() {
        return ResponseEntity.ok(ApiResponse.success(savingGoalService.getAllGoals()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SavingGoalResponse>>> getActiveGoals() {
        return ResponseEntity.ok(ApiResponse.success(savingGoalService.getActiveGoals()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SavingGoalResponse>> createGoal(
            @Valid @RequestBody SavingGoalRequest request) {
        SavingGoalResponse response = savingGoalService.createGoal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Saving goal created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> updateGoal(
            @PathVariable Long id,
            @Valid @RequestBody SavingGoalRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Goal updated", savingGoalService.updateGoal(id, request)));
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> addMoney(
            @PathVariable Long id,
            @Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Money added", savingGoalService.addMoney(id, request.getAmount())));
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<SavingGoalResponse>> withdrawMoney(
            @PathVariable Long id,
            @Valid @RequestBody AmountRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Money withdrawn", savingGoalService.withdrawMoney(id, request.getAmount())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(@PathVariable Long id) {
        savingGoalService.deleteGoal(id);
        return ResponseEntity.ok(ApiResponse.success("Goal deleted", null));
    }
}
