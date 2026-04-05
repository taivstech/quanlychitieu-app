package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.DebtPaymentRequest;
import com.quanlychitieu.dto.request.DebtRequest;
import com.quanlychitieu.dto.response.DebtResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.Debt;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.enums.DebtType;
import com.quanlychitieu.repository.DebtRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DebtService {

    private final DebtRepository debtRepository;
    private final WalletService walletService;
    private final SecurityUtils securityUtils;

    public List<DebtResponse> getAllDebts() {
        Long userId = securityUtils.getCurrentUserId();
        return debtRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DebtResponse> getActiveDebts() {
        Long userId = securityUtils.getCurrentUserId();
        return debtRepository.findByUserIdAndCompletedFalseOrderByDueDateAsc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DebtResponse> getDebtsByType(DebtType type) {
        Long userId = securityUtils.getCurrentUserId();
        return debtRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Map<String, BigDecimal> getSummary() {
        Long userId = securityUtils.getCurrentUserId();
        BigDecimal totalDebt = debtRepository.getTotalOutstanding(userId, DebtType.DEBT);
        BigDecimal totalLoan = debtRepository.getTotalOutstanding(userId, DebtType.LOAN);
        return Map.of(
                "totalDebt", totalDebt,
                "totalLoan", totalLoan,
                "net", totalLoan.subtract(totalDebt)
        );
    }

    @Transactional
    public DebtResponse createDebt(DebtRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Debt debt = Debt.builder()
                .type(request.getType())
                .personName(request.getPersonName())
                .amount(request.getAmount())
                .note(request.getNote())
                .dueDate(request.getDueDate())
                .user(currentUser)
                .build();

        return toResponse(debtRepository.save(debt));
    }

    @Transactional
    public DebtResponse makePayment(Long debtId, DebtPaymentRequest request) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
        }

        Long userId = securityUtils.getCurrentUserId();
        Debt debt = debtRepository.findByIdAndUserIdForUpdate(debtId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản nợ"));

        if (debt.getCompleted()) {
            throw new BadRequestException("Khoản nợ đã hoàn thành");
        }

        BigDecimal newPaid = debt.getPaidAmount().add(request.getAmount());
        if (newPaid.compareTo(debt.getAmount()) > 0) {
            throw new BadRequestException("Số tiền thanh toán vượt quá số còn lại");
        }

        debt.setPaidAmount(newPaid);
        if (newPaid.compareTo(debt.getAmount()) == 0) {
            debt.setCompleted(true);
        }

        // Update wallet balance if walletId provided
        if (request.getWalletId() != null) {
            boolean isExpense = debt.getType() == DebtType.DEBT; // paying off my debt = expense
            walletService.updateBalance(request.getWalletId(), request.getAmount(), isExpense);
        }

        log.info("Payment made for debt {}: {} to {}", debtId, request.getAmount(), debt.getPersonName());
        return toResponse(debtRepository.save(debt));
    }

    @Transactional
    public void deleteDebt(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Debt debt = debtRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản nợ"));
        debtRepository.delete(debt);
    }

    private DebtResponse toResponse(Debt debt) {
        return DebtResponse.builder()
                .id(debt.getId())
                .type(debt.getType())
                .personName(debt.getPersonName())
                .amount(debt.getAmount())
                .paidAmount(debt.getPaidAmount())
                .remainingAmount(debt.getRemainingAmount())
                .paidPercentage(debt.getPaidPercentage())
                .note(debt.getNote())
                .dueDate(debt.getDueDate())
                .completed(debt.getCompleted())
                .overdue(debt.isOverdue())
                .createdAt(debt.getCreatedAt())
                .build();
    }
}
