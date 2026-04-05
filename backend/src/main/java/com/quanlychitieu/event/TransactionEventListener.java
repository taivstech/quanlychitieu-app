package com.quanlychitieu.event;

import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.service.BudgetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Observer Pattern: lắng nghe TransactionCreatedEvent
 * - Decoupling: TransactionService không cần biết ai xử lý event after create
 * - @Async + @EventListener: xử lý bất đồng bộ, không block main thread
 * - Dễ mở rộng: thêm listener mới mà không sửa TransactionService
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TransactionEventListener {

    private final BudgetService budgetService;

    /**
     * Khi tạo giao dịch chi tiêu → tự động cập nhật Budget spent amount
     * Chạy async trên thread pool riêng → không block response trả về client
     */
    @Async("taskExecutor")
    @EventListener
    public void handleTransactionCreated(TransactionCreatedEvent event) {
        log.info("[Event] Transaction created: id={}, type={}, amount={}, userId={}",
                event.getTransactionId(), event.getType(), event.getAmount(), event.getUserId());

        try {
            if (event.getType() == TransactionType.EXPENSE) {
                budgetService.updateSpentAmount(
                        event.getUserId(),
                        event.getCategoryId(),
                        event.getTransactionDate().getMonthValue(),
                        event.getTransactionDate().getYear()
                );
                log.info("[Event] Budget updated for category {} month {}/{}",
                        event.getCategoryId(),
                        event.getTransactionDate().getMonthValue(),
                        event.getTransactionDate().getYear());
            }
        } catch (Exception e) {
            log.error("[Event] Failed to handle transaction event: {}", e.getMessage(), e);
        }
    }
}
