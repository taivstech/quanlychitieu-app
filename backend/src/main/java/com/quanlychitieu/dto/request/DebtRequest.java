package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.DebtType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DebtRequest {
    @NotNull(message = "Loại khoản nợ không được để trống")
    private DebtType type;

    @NotBlank(message = "Tên người không được để trống")
    @Size(max = 100)
    private String personName;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private String note;
    private LocalDate dueDate;
}
