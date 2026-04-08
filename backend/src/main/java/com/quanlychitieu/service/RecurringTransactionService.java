package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.RecurringTransactionRequest;
import com.quanlychitieu.dto.response.RecurringTransactionResponse;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.*;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.*;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepo;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final SecurityUtils securityUtils;

    public List<RecurringTransactionResponse> getActiveRecurring() {
        Long userId = securityUtils.getCurrentUserId();
        return recurringRepo.findByUserIdAndActiveTrue(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecurringTransactionResponse createRecurring(RecurringTransactionRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
        Wallet wallet = walletRepository.findByIdAndUserId(request.getWalletId(), currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        RecurringTransaction recurring = RecurringTransaction.builder()
                .amount(request.getAmount())
                .type(request.getType())
                .note(request.getNote())
                .frequency(request.getFrequency())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .nextExecutionDate(request.getStartDate())
                .category(category)
                .wallet(wallet)
                .user(currentUser)
                .active(true)
                .build();

        return toResponse(recurringRepo.save(recurring));
    }

    @Transactional
    public void deactivateRecurring(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        RecurringTransaction recurring = recurringRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch định kỳ"));
        recurring.setActive(false);
        recurringRepo.save(recurring);
    }

    /**
     * Process all due recurring transactions - called by scheduler.
     * Catch-up logic: nếu server bị down vài ngày, sẽ tạo bù tất cả các giao dịch
     * bị miss bằng while loop (nextExecutionDate <= today).
     * Mỗi recurring record được xử lý trong transaction riêng để 1 lỗi không ảnh hưởng record khác.
     */
    public int processDueTransactions() {
        List<RecurringTransaction> dueTransactions =
                recurringRepo.findDueRecurringTransactions(LocalDate.now());

        int processedCount = 0;
        for (RecurringTransaction recurring : dueTransactions) {
            try {
                processedCount += processSingleRecurring(recurring.getId());
            } catch (Exception e) {
                log.error("Failed to process recurring transaction {}: {}",
                        recurring.getId(), e.getMessage());
            }
        }

        return processedCount;
    }

    /**
     * Xử lý 1 recurring transaction, tạo bù tất cả ngày bị miss (catch-up).
     * VD: server down 3 ngày → DAILY recurring sẽ tạo 3 transaction bù.
     */
    @Transactional
    public int processSingleRecurring(Long recurringId) {
        RecurringTransaction recurring = recurringRepo.findById(recurringId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch định kỳ"));

        LocalDate today = LocalDate.now();
        int count = 0;

        // While loop: catch-up missed executions (e.g., server was down for 3 days)
        while (recurring.getActive() && !recurring.getNextExecutionDate().isAfter(today)) {
            Transaction transaction = Transaction.builder()
                    .amount(recurring.getAmount())
                    .type(recurring.getType())
                    .note("[Auto] " + (recurring.getNote() != null ? recurring.getNote() : ""))
                    .transactionDate(recurring.getNextExecutionDate())
                    .category(recurring.getCategory())
                    .wallet(recurring.getWallet())
                    .user(recurring.getUser())
                    .build();

            transactionRepository.save(transaction);

            // Update wallet balance (dùng internal để tránh lỗi auth trong scheduler)
            walletService.updateBalanceInternal(recurring.getWallet().getId(),
                    recurring.getAmount(),
                    recurring.getType() == TransactionType.EXPENSE);

            // Advance to next execution date
            recurring.setLastExecutedDate(recurring.getNextExecutionDate());
            recurring.setNextExecutionDate(recurring.calculateNextDate());

            // Check if recurring should end
            if (recurring.getEndDate() != null &&
                    recurring.getNextExecutionDate().isAfter(recurring.getEndDate())) {
                recurring.setActive(false);
            }

            count++;
            log.info("Processed recurring transaction: {} - {} for user {} (date: {})",
                    recurring.getType(), recurring.getAmount(),
                    recurring.getUser().getUsername(), recurring.getLastExecutedDate());
        }

        recurringRepo.save(recurring);
        return count;
    }

    private RecurringTransactionResponse toResponse(RecurringTransaction r) {
        return RecurringTransactionResponse.builder()
                .id(r.getId())
                .amount(r.getAmount())
                .type(r.getType())
                .note(r.getNote())
                .frequency(r.getFrequency())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .nextExecutionDate(r.getNextExecutionDate())
                .lastExecutedDate(r.getLastExecutedDate())
                .active(r.getActive())
                .categoryName(r.getCategory().getName())
                .categoryId(r.getCategory().getId())
                .walletName(r.getWallet().getName())
                .walletId(r.getWallet().getId())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
