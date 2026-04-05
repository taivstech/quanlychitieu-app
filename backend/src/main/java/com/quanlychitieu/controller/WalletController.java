package com.quanlychitieu.controller;

import com.quanlychitieu.dto.request.TransferRequest;
import com.quanlychitieu.dto.request.WalletRequest;
import com.quanlychitieu.dto.response.ApiResponse;
import com.quanlychitieu.dto.response.WalletResponse;
import com.quanlychitieu.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WalletResponse>>> getAllWallets() {
        return ResponseEntity.ok(ApiResponse.success(walletService.getAllWallets()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWallet(id)));
    }

    @GetMapping("/total-balance")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getTotalBalance() {
        BigDecimal total = walletService.getTotalBalance();
        return ResponseEntity.ok(ApiResponse.success(Map.of("totalBalance", total)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WalletResponse>> createWallet(
            @Valid @RequestBody WalletRequest request) {
        WalletResponse response = walletService.createWallet(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Wallet created", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WalletResponse>> updateWallet(
            @PathVariable Long id,
            @Valid @RequestBody WalletRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Wallet updated", walletService.updateWallet(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWallet(@PathVariable Long id) {
        walletService.deleteWallet(id);
        return ResponseEntity.ok(ApiResponse.success("Wallet deleted", null));
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Void>> transfer(@Valid @RequestBody TransferRequest request) {
        walletService.transfer(request);
        return ResponseEntity.ok(ApiResponse.success("Transfer successful", null));
    }
}
