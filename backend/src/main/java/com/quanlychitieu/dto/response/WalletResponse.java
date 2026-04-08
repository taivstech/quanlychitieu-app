package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.WalletType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {
    private Long id;
    private String name;
    private WalletType type;
    private BigDecimal balance;
    private String currency;
    private String icon;
    private String color;
    private Boolean includeInTotal;
    private Boolean isShared;
}
