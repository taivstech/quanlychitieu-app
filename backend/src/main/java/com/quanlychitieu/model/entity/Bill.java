package com.quanlychitieu.model.entity;

import com.quanlychitieu.model.enums.RecurringFrequency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RecurringFrequency frequency;

    @Column(length = 255)
    private String note;

    @Builder.Default
    private Boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Version
    private Long version = 0L;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isOverdue() {
        return dueDate != null && LocalDate.now().isAfter(dueDate) && Boolean.TRUE.equals(active);
    }

    public LocalDate getNextDueDate() {
        if (dueDate == null) return null;
        LocalDate today = LocalDate.now();
        LocalDate next = dueDate;
        while (!next.isAfter(today)) {
            switch (frequency) {
                case DAILY -> next = next.plusDays(1);
                case WEEKLY -> next = next.plusWeeks(1);
                case MONTHLY -> next = next.plusMonths(1);
                case YEARLY -> next = next.plusYears(1);
            }
        }
        return next;
    }
}
