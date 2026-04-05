package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.TransferRequest;
import com.quanlychitieu.dto.request.WalletRequest;
import com.quanlychitieu.dto.response.WalletResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.entity.Wallet;
import com.quanlychitieu.repository.WalletRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final SecurityUtils securityUtils;

    public List<WalletResponse> getAllWallets() {
        Long userId = securityUtils.getCurrentUserId();
        return walletRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WalletResponse getWallet(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
        return toResponse(wallet);
    }

    @Transactional
    public WalletResponse createWallet(WalletRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Wallet wallet = Wallet.builder()
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance())
                .icon(request.getIcon())
                .color(request.getColor())
                .includeInTotal(request.getIncludeInTotal())
                .currency(currentUser.getCurrency())
                .user(currentUser)
                .build();

        return toResponse(walletRepository.save(wallet));
    }

    @Transactional
    public WalletResponse updateWallet(Long id, WalletRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        wallet.setName(request.getName());
        wallet.setType(request.getType());
        wallet.setIcon(request.getIcon());
        wallet.setColor(request.getColor());
        wallet.setIncludeInTotal(request.getIncludeInTotal());

        return toResponse(walletRepository.save(wallet));
    }

    /**
     * Edge case: xóa ví có transactions → chỉ cho xóa nếu ví trống
     * Nếu không, user phải chuyển tiền trước rồi mới xóa
     */
    @Transactional
    public void deleteWallet(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        if (!wallet.getTransactions().isEmpty()) {
            throw new BadRequestException(
                    "Không thể xóa ví có giao dịch. Vui lòng chuyển hoặc xóa giao dịch trước.");
        }

        walletRepository.delete(wallet);
    }

    public BigDecimal getTotalBalance() {
        Long userId = securityUtils.getCurrentUserId();
        return walletRepository.getTotalBalance(userId);
    }

    /**
     * Cập nhật balance với PESSIMISTIC_WRITE lock → tránh race condition
     * Edge case: kiểm tra đủ tiền trước khi chi
     */
    @Transactional
    public void updateBalance(Long walletId, BigDecimal amount, boolean isExpense) {
        Long userId = securityUtils.getCurrentUserId();
        // Pessimistic lock: SELECT ... FOR UPDATE
        Wallet wallet = walletRepository.findByIdAndUserIdForUpdate(walletId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        if (isExpense) {
            BigDecimal newBalance = wallet.getBalance().subtract(amount);
            if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException(
                        String.format("Số dư không đủ. Hiện tại: %s, Cần: %s",
                                wallet.getBalance(), amount));
            }
            wallet.setBalance(newBalance);
        } else {
            wallet.setBalance(wallet.getBalance().add(amount));
        }
        walletRepository.save(wallet);
    }

    /**
     * Transfer giữa 2 ví:
     * - Pessimistic lock cả 2 ví (lock theo thứ tự ID nhỏ → lớn → tránh deadlock)
     * - Check đủ tiền ở ví nguồn
     * - Atomic: cả 2 ví update trong 1 transaction
     */
    @Transactional
    public void transfer(TransferRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        if (request.getFromWalletId().equals(request.getToWalletId())) {
            throw new BadRequestException("Không thể chuyển tiền vào cùng một ví");
        }

        // Lock theo thứ tự ID nhỏ → lớn để tránh DEADLOCK
        Long firstId = Math.min(request.getFromWalletId(), request.getToWalletId());
        Long secondId = Math.max(request.getFromWalletId(), request.getToWalletId());

        walletRepository.findByIdAndUserIdForUpdate(firstId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
        walletRepository.findByIdAndUserIdForUpdate(secondId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        // Re-fetch sau lock
        Wallet fromWallet = walletRepository.findByIdAndUserId(request.getFromWalletId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví nguồn"));
        Wallet toWallet = walletRepository.findByIdAndUserId(request.getToWalletId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví đích"));

        // Edge case: kiểm tra đủ tiền
        if (fromWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BadRequestException(
                        String.format("Số dư không đủ. Hiện tại: %s, Cần: %s",
                            fromWallet.getBalance(), request.getAmount()));
        }

        fromWallet.setBalance(fromWallet.getBalance().subtract(request.getAmount()));
        toWallet.setBalance(toWallet.getBalance().add(request.getAmount()));

        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        log.info("Transfer {} from wallet {} to wallet {} completed",
                request.getAmount(), fromWallet.getName(), toWallet.getName());
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .type(wallet.getType())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .icon(wallet.getIcon())
                .color(wallet.getColor())
                .includeInTotal(wallet.getIncludeInTotal())
                .build();
    }
}
