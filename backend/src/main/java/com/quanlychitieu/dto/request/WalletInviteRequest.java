package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.WalletRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WalletInviteRequest {
    @NotBlank(message = "Username người nhận không được để trống")
    private String username;

    @NotNull(message = "Vai trò không được để trống")
    private WalletRole role;
}
