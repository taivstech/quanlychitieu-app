package com.quanlychitieu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SavingGoalRequest {
    @NotBlank(message = "Tên mục tiêu không được để trống")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Số tiền mục tiêu không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal targetAmount;

    private String icon;
    private String color;
    private LocalDate targetDate;
}
