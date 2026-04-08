package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.BillRequest;
import com.quanlychitieu.dto.request.TransactionRequest;
import com.quanlychitieu.dto.response.BillResponse;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.model.entity.Bill;
import com.quanlychitieu.model.entity.Category;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.entity.Wallet;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.repository.BillRepository;
import com.quanlychitieu.repository.CategoryRepository;
import com.quanlychitieu.repository.WalletRepository;
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
public class BillService {

    private final BillRepository billRepository;
    private final CategoryRepository categoryRepository;
    private final WalletRepository walletRepository;
    private final TransactionService transactionService;
    private final SecurityUtils securityUtils;

    public List<BillResponse> getAllBills() {
        Long userId = securityUtils.getCurrentUserId();
        return billRepository.findByUserIdOrderByDueDateAsc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BillResponse> getActiveBills() {
        Long userId = securityUtils.getCurrentUserId();
        return billRepository.findByUserIdAndActiveTrueOrderByDueDateAsc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<BillResponse> getUpcomingBills() {
        Long userId = securityUtils.getCurrentUserId();
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        return billRepository.findUpcomingBills(userId, today, nextWeek).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillResponse createBill(BillRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        Bill.BillBuilder builder = Bill.builder()
                .name(request.getName())
                .amount(request.getAmount())
                .dueDate(request.getDueDate())
                .frequency(request.getFrequency())
                .note(request.getNote())
                .user(currentUser);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
            builder.category(category);
        }
        if (request.getWalletId() != null) {
            Wallet wallet = walletRepository.findByIdAndUserId(request.getWalletId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
            builder.wallet(wallet);
        }

        return toResponse(billRepository.save(builder.build()));
    }

    @Transactional
    public BillResponse updateBill(Long id, BillRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Bill bill = billRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));

        bill.setName(request.getName());
        bill.setAmount(request.getAmount());
        bill.setDueDate(request.getDueDate());
        bill.setFrequency(request.getFrequency());
        bill.setNote(request.getNote());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));
            bill.setCategory(category);
        } else {
            bill.setCategory(null);
        }
        if (request.getWalletId() != null) {
            Wallet wallet = walletRepository.findByIdAndUserId(request.getWalletId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
            bill.setWallet(wallet);
        } else {
            bill.setWallet(null);
        }

        return toResponse(billRepository.save(bill));
    }

    @Transactional
    public BillResponse markPaid(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Bill bill = billRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));

        if (bill.getWallet() == null || bill.getCategory() == null) {
            throw new BadRequestException("Hóa đơn cần phải liên kết với Ví và Danh mục để thanh toán tự động.");
        }

        // Tạo giao dịch chi tiêu tương ứng
        TransactionRequest transactionRequest = new TransactionRequest();
        transactionRequest.setAmount(bill.getAmount());
        transactionRequest.setType(TransactionType.EXPENSE);
        transactionRequest.setNote("[Thanh toán hóa đơn] " + bill.getName());
        transactionRequest.setTransactionDate(LocalDate.now());
        transactionRequest.setCategoryId(bill.getCategory().getId());
        transactionRequest.setWalletId(bill.getWallet().getId());
        transactionRequest.setExcludeFromReport(false);
        
        transactionService.createTransaction(transactionRequest);

        // Chuyển due date sang chu kỳ tiếp theo
        bill.setDueDate(bill.getNextDueDate());
        
        log.info("Bill marked as paid and transaction created for bill id: {}", id);
        return toResponse(billRepository.save(bill));
    }

    @Transactional
    public void toggleActive(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Bill bill = billRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));
        bill.setActive(!Boolean.TRUE.equals(bill.getActive()));
        billRepository.save(bill);
    }

    @Transactional
    public void deleteBill(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Bill bill = billRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn"));
        billRepository.delete(bill);
    }

    private BillResponse toResponse(Bill bill) {
        BillResponse.BillResponseBuilder builder = BillResponse.builder()
                .id(bill.getId())
                .name(bill.getName())
                .amount(bill.getAmount())
                .dueDate(bill.getDueDate())
                .nextDueDate(bill.getNextDueDate())
                .frequency(bill.getFrequency())
                .note(bill.getNote())
                .active(bill.getActive())
                .overdue(bill.isOverdue())
                .createdAt(bill.getCreatedAt());

        if (bill.getCategory() != null) {
            builder.categoryId(bill.getCategory().getId())
                    .categoryName(bill.getCategory().getName())
                    .categoryIcon(bill.getCategory().getIcon())
                    .categoryColor(bill.getCategory().getColor());
        }
        if (bill.getWallet() != null) {
            builder.walletId(bill.getWallet().getId())
                    .walletName(bill.getWallet().getName());
        }

        return builder.build();
    }
}
