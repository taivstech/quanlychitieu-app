package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.TransactionRequest;
import com.quanlychitieu.dto.response.TransactionResponse;
import com.quanlychitieu.event.TransactionCreatedEvent;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.*;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.model.enums.WalletMemberStatus;
import com.quanlychitieu.model.enums.WalletRole;
import com.quanlychitieu.repository.*;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final WalletRepository walletRepository;
    private final WalletMemberRepository walletMemberRepository;
    private final EventRepository eventRepository;
    private final WalletService walletService;
    private final ApplicationEventPublisher eventPublisher;
    private final SecurityUtils securityUtils;

    public Page<TransactionResponse> getTransactions(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId, pageable)
                .map(this::toResponse);
    }

    public List<TransactionResponse> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        return transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getTransactionsByCategoryAndDateRange(
            Long categoryId, LocalDate startDate, LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        return transactionRepository.findByUserIdAndCategoryIdAndDateRange(userId, categoryId, startDate, endDate)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<TransactionResponse> getTransactionsByWallet(Long walletId, int page, int size) {
        Long userId = securityUtils.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByUserIdAndWalletId(userId, walletId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    @CacheEvict(value = {"transactions", "reports"}, allEntries = true)
    public TransactionResponse createTransaction(TransactionRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
        
        Wallet wallet = walletRepository.findById(request.getWalletId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        // Kiểm tra quyền trên ví: Chủ ví HOẶC Editor
        boolean isOwner = wallet.getUser().getId().equals(userId);
        boolean canEdit = isOwner || walletMemberRepository.findByWalletIdAndUserId(wallet.getId(), userId)
                .map(m -> m.getStatus() == WalletMemberStatus.ACCEPTED && m.getRole() != WalletRole.VIEWER)
                .orElse(false);

        if (!canEdit) {
            throw new com.quanlychitieu.exception.BadRequestException("Bạn không có quyền thêm giao dịch vào ví này");
        }

        Transaction transaction = Transaction.builder()
                .amount(request.getAmount())
                .type(request.getType())
                .note(request.getNote())
                .transactionDate(request.getTransactionDate())
                .category(category)
                .wallet(wallet)
                .user(currentUser)
                .excludeFromReport(request.getExcludeFromReport() != null && request.getExcludeFromReport())
                .build();

        // Gắn event nếu có
        if (request.getEventId() != null) {
            Event event = eventRepository.findByIdAndUserId(request.getEventId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
            transaction.setEvent(event);
        }

        transaction = transactionRepository.save(transaction);

        // Update wallet balance
        // EXPENSE → subtract, INCOME → add
        // LOAN: "Cho vay" → subtract (lend out), "Vay" → add (borrow in)
        boolean isSubtract = request.getType() == TransactionType.EXPENSE
                || (request.getType() == TransactionType.LOAN && "Cho vay".equals(category.getName()));
        walletService.updateBalance(wallet.getId(), request.getAmount(), isSubtract);

        // Publish event → TransactionEventListener sẽ xử lý async (Observer Pattern)
        eventPublisher.publishEvent(new TransactionCreatedEvent(
                this, transaction.getId(), userId,
                wallet.getId(), category.getId(),
                request.getAmount(), request.getType(),
                request.getTransactionDate()
        ));

        log.info("Created transaction: {} - {} - {}", request.getType(), request.getAmount(), category.getName());
        return toResponse(transaction);
    }

    @Transactional
    @CacheEvict(value = {"transactions", "reports"}, allEntries = true)
    public TransactionResponse updateTransaction(Long id, TransactionRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        // Reverse old wallet balance
        boolean wasSubtract = transaction.getType() == TransactionType.EXPENSE
                || (transaction.getType() == TransactionType.LOAN && "Cho vay".equals(transaction.getCategory().getName()));
        walletService.updateBalance(transaction.getWallet().getId(), transaction.getAmount(), !wasSubtract);

        Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
        Wallet wallet = walletRepository.findByIdAndUserId(request.getWalletId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setNote(request.getNote());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setCategory(category);
        transaction.setWallet(wallet);
        transaction.setExcludeFromReport(request.getExcludeFromReport() != null && request.getExcludeFromReport());

        // Update event
        if (request.getEventId() != null) {
            Event event = eventRepository.findByIdAndUserId(request.getEventId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sự kiện"));
            transaction.setEvent(event);
        } else {
            transaction.setEvent(null);
        }

        transaction = transactionRepository.save(transaction);

        // Apply new wallet balance
        boolean isSubtractNew = request.getType() == TransactionType.EXPENSE
                || (request.getType() == TransactionType.LOAN && "Cho vay".equals(category.getName()));
        walletService.updateBalance(wallet.getId(), request.getAmount(), isSubtractNew);

        return toResponse(transaction);
    }

    @Transactional
    @CacheEvict(value = {"transactions", "reports"}, allEntries = true)
    public void deleteTransaction(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Transaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        // Reverse wallet balance
        boolean wasSubtractDel = transaction.getType() == TransactionType.EXPENSE
                || (transaction.getType() == TransactionType.LOAN && "Cho vay".equals(transaction.getCategory().getName()));
        walletService.updateBalance(transaction.getWallet().getId(), transaction.getAmount(), !wasSubtractDel);

        transactionRepository.delete(transaction);
    }

    public Page<TransactionResponse> searchTransactions(Long userId, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.searchByKeyword(userId, keyword, pageable)
                .map(this::toResponse);
    }

    /**
     * Top spending — giao dịch chi lớn nhất (giống Money Lover Home Screen)
     */
    public List<TransactionResponse> getTopSpending(Long userId, LocalDate startDate,
                                                     LocalDate endDate, int limit) {
        return transactionRepository.findTopSpending(userId, startDate, endDate).stream()
                .limit(limit)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Duplicate transaction — nhân bản giao dịch với ngày = hôm nay
     */
    @Transactional
    @CacheEvict(value = {"transactions", "reports"}, allEntries = true)
    public TransactionResponse duplicateTransaction(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Transaction original = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch"));

        Transaction duplicate = Transaction.builder()
                .amount(original.getAmount())
                .type(original.getType())
                .note(original.getNote())
                .transactionDate(LocalDate.now())
                .category(original.getCategory())
                .wallet(original.getWallet())
                .user(original.getUser())
                .event(original.getEvent())
                .excludeFromReport(original.isExcludeFromReport())
                .build();

        duplicate = transactionRepository.save(duplicate);

        // Update wallet balance (EXPENSE → subtract, LOAN "Cho vay" → subtract)
        boolean isSubtractDup = duplicate.getType() == TransactionType.EXPENSE
                || (duplicate.getType() == TransactionType.LOAN && "Cho vay".equals(duplicate.getCategory().getName()));
        walletService.updateBalance(duplicate.getWallet().getId(), duplicate.getAmount(), isSubtractDup);

        // Publish event
        eventPublisher.publishEvent(new TransactionCreatedEvent(
                this, duplicate.getId(), userId,
                duplicate.getWallet().getId(), duplicate.getCategory().getId(),
                duplicate.getAmount(), duplicate.getType(),
                duplicate.getTransactionDate()
        ));

        log.info("Duplicated transaction {} → {}", id, duplicate.getId());
        return toResponse(duplicate);
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .amount(t.getAmount())
                .type(t.getType())
                .note(t.getNote())
                .transactionDate(t.getTransactionDate())
                .categoryName(t.getCategory().getName())
                .categoryId(t.getCategory().getId())
                .categoryIcon(t.getCategory().getIcon())
                .categoryColor(t.getCategory().getColor())
                .walletName(t.getWallet().getName())
                .walletId(t.getWallet().getId())
                .eventId(t.getEvent() != null ? t.getEvent().getId() : null)
                .eventName(t.getEvent() != null ? t.getEvent().getName() : null)
                .excludeFromReport(t.isExcludeFromReport())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
