package com.quanlychitieu.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequest {
    @NotNull(message = "Ví nguồn không được để trống")
    private Long fromWalletId;

    @NotNull(message = "Ví đích không được để trống")
    private Long toWalletId;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    private String note;
}
