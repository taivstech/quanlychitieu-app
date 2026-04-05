package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.RecurringFrequency;
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
public class RecurringTransactionResponse {
    private Long id;
    private BigDecimal amount;
    private TransactionType type;
    private String note;
    private RecurringFrequency frequency;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextExecutionDate;
    private LocalDate lastExecutedDate;
    private Boolean active;
    private String categoryName;
    private Long categoryId;
    private String walletName;
    private Long walletId;
    private LocalDateTime createdAt;
}
