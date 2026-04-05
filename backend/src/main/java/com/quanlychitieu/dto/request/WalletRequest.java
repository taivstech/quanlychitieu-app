package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.WalletType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class WalletRequest {
    @NotBlank(message = "Tên ví không được để trống")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Loại ví không được để trống")
    private WalletType type;

    @NotNull(message = "Số dư ban đầu không được để trống")
    @DecimalMin(value = "0", message = "Số dư không được âm")
    private BigDecimal balance;

    private String icon;
    private String color;
    private Boolean includeInTotal = true;
}
