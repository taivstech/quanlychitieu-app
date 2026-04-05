package com.quanlychitieu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DebtPaymentRequest {
    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private Long walletId;
}
