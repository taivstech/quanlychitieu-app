package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.DebtType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtResponse {
    private Long id;
    private DebtType type;
    private String personName;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private double paidPercentage;
    private String note;
    private LocalDate dueDate;
    private Boolean completed;
    private boolean overdue;
    private LocalDateTime createdAt;
}
