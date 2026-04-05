package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.RecurringFrequency;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillResponse {
    private Long id;
    private String name;
    private BigDecimal amount;
    private LocalDate dueDate;
    private LocalDate nextDueDate;
    private RecurringFrequency frequency;
    private String note;
    private Boolean active;
    private boolean overdue;

    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;

    private Long walletId;
    private String walletName;

    private LocalDateTime createdAt;
}
