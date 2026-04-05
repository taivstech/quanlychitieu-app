package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    List<Wallet> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Wallet> findByIdAndUserId(Long id, Long userId);

    /**
     * Pessimistic Write Lock: lock row khi đọc để tránh race condition
     * Dùng cho operations cần update balance (transfer, create transaction)
     * SELECT ... FOR UPDATE → thread khác phải đợi
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM Wallet w WHERE w.id = :id AND w.user.id = :userId")
    Optional<Wallet> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(w.balance), 0) FROM Wallet w WHERE w.user.id = :userId AND w.includeInTotal = true")
    BigDecimal getTotalBalance(@Param("userId") Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
