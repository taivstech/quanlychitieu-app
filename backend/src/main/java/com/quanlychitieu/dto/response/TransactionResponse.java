package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private BigDecimal amount;
    private TransactionType type;
    private String note;
    private LocalDate transactionDate;
    private String categoryName;
    private Long categoryId;
    private String categoryIcon;
    private String categoryColor;
    private String walletName;
    private Long walletId;
    private Long eventId;
    private String eventName;
    private boolean excludeFromReport;
    private LocalDateTime createdAt;
}
