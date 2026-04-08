package com.quanlychitieu.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Audit Log — ghi lại lịch sử thay đổi dữ liệu quan trọng.
 * Dùng để truy vết: ai sửa gì, khi nào, giá trị cũ/mới.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user", columnList = "user_id"),
        @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_audit_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID của user thực hiện hành động */
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 100)
    private String username;

    /** Loại hành động: CREATE, UPDATE, DELETE */
    @Column(nullable = false, length = 20)
    private String action;

    /** Loại entity bị ảnh hưởng: Transaction, Wallet, Budget... */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** ID của entity bị ảnh hưởng */
    @Column(name = "entity_id")
    private Long entityId;

    /** Giá trị cũ (JSON) — chỉ cho UPDATE và DELETE */
    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    /** Giá trị mới (JSON) — chỉ cho CREATE và UPDATE */
    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    /** IP address của client */
    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
