package com.quanlychitieu.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private BigDecimal amountLimit;
    private BigDecimal spentAmount;
    private BigDecimal remainingAmount;
    private double usagePercentage;
    private boolean overBudget;
    private Integer month;
    private Integer year;
    private String categoryName;
    private Long categoryId;
    private String categoryIcon;
    private String categoryColor;
}
