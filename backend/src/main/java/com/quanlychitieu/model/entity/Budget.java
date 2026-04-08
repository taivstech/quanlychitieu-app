package com.quanlychitieu.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budgets", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "category_id", "month", "year"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "amount_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal amountLimit;

    @Column(name = "spent_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal spentAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    /** Cho phép dư ngân sách tháng trước chuyển sang tháng sau */
    @Builder.Default
    @Column(name = "rollover_enabled", nullable = false)
    private Boolean rolloverEnabled = false;

    /** Số tiền dư từ tháng trước chuyển sang (nếu rollover enabled) */
    @Builder.Default
    @Column(name = "rollover_amount", precision = 15, scale = 2)
    private BigDecimal rolloverAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public BigDecimal getRemainingAmount() {
        return getEffectiveLimit().subtract(spentAmount);
    }

    /** Hạn mức thực tế = hạn mức gốc + dư tháng trước (nếu rollover) */
    public BigDecimal getEffectiveLimit() {
        if (Boolean.TRUE.equals(rolloverEnabled) && rolloverAmount != null) {
            return amountLimit.add(rolloverAmount);
        }
        return amountLimit;
    }

    public double getUsagePercentage() {
        BigDecimal limit = getEffectiveLimit();
        if (limit.compareTo(BigDecimal.ZERO) == 0) return 0;
        return spentAmount.doubleValue() / limit.doubleValue() * 100;
    }

    public boolean isOverBudget() {
        return spentAmount.compareTo(getEffectiveLimit()) > 0;
    }
}
