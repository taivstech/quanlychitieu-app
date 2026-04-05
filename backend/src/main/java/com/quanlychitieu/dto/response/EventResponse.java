package com.quanlychitieu.dto.response;

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
public class EventResponse {
    private Long id;
    private String name;
    private String icon;
    private LocalDate startDate;
    private LocalDate endDate;
    private String note;
    private boolean completed;

    // Aggregated info
    private BigDecimal totalExpense;
    private BigDecimal totalIncome;
    private BigDecimal netAmount;
    private long transactionCount;

    private LocalDateTime createdAt;
}
