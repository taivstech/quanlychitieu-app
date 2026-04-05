package com.quanlychitieu.event;

import com.quanlychitieu.model.enums.TransactionType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Spring Application Event: phát ra khi tạo/xóa giao dịch
 * - Decoupling: TransactionService không cần biết ai xử lý event
 * - Observer Pattern thông qua Spring Event mechanism
 */
@Getter
public class TransactionCreatedEvent extends ApplicationEvent {

    private final Long transactionId;
    private final Long userId;
    private final Long walletId;
    private final Long categoryId;
    private final BigDecimal amount;
    private final TransactionType type;
    private final LocalDate transactionDate;

    public TransactionCreatedEvent(Object source, Long transactionId, Long userId,
                                    Long walletId, Long categoryId, BigDecimal amount,
                                    TransactionType type, LocalDate transactionDate) {
        super(source);
        this.transactionId = transactionId;
        this.userId = userId;
        this.walletId = walletId;
        this.categoryId = categoryId;
        this.amount = amount;
        this.type = type;
        this.transactionDate = transactionDate;
    }
}
