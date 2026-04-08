package com.quanlychitieu.dto.response;

import com.quanlychitieu.model.enums.WalletMemberStatus;
import com.quanlychitieu.model.enums.WalletRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class WalletMemberResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private WalletRole role;
    private WalletMemberStatus status;
    private LocalDateTime joinedAt;
}
