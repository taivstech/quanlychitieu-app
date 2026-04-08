package com.quanlychitieu.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private boolean isRead;
    private String type;
    private LocalDateTime createdAt;
}
