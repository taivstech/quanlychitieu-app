package com.quanlychitieu.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavingGoalResponse {
    private Long id;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private BigDecimal remainingAmount;
    private double progressPercentage;
    private String icon;
    private String color;
    private LocalDate targetDate;
    private Boolean completed;
    private boolean achieved;
    private LocalDateTime createdAt;
}
