package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Debt;
import com.quanlychitieu.model.enums.DebtType;
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
public interface DebtRepository extends JpaRepository<Debt, Long> {
    List<Debt> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Debt> findByUserIdAndCompletedFalseOrderByDueDateAsc(Long userId);
    List<Debt> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, DebtType type);
    Optional<Debt> findByIdAndUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Debt d WHERE d.id = :id AND d.user.id = :userId")
    Optional<Debt> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(d.amount - d.paidAmount), 0) FROM Debt d WHERE d.user.id = :userId AND d.type = :type AND d.completed = false")
    BigDecimal getTotalOutstanding(@Param("userId") Long userId, @Param("type") DebtType type);

    // Nợ sắp đến hạn trong N ngày tới
    @Query("SELECT d FROM Debt d WHERE d.user.id = :userId AND d.completed = false " +
            "AND d.dueDate IS NOT NULL AND d.dueDate BETWEEN :today AND :deadline " +
            "ORDER BY d.dueDate ASC")
    List<Debt> findUpcomingDebts(
            @Param("userId") Long userId,
            @Param("today") java.time.LocalDate today,
            @Param("deadline") java.time.LocalDate deadline);

    long countByUserIdAndCompletedFalse(Long userId);

    // Tất cả nợ sắp đến hạn (cho scheduler — không filter userId)
    @Query("SELECT d FROM Debt d WHERE d.completed = false " +
            "AND d.dueDate IS NOT NULL AND d.dueDate BETWEEN :today AND :deadline " +
            "ORDER BY d.dueDate ASC")
    List<Debt> findUpcomingDebts(
            @Param("today") java.time.LocalDate today,
            @Param("deadline") java.time.LocalDate deadline);

    // Tất cả nợ đã quá hạn (cho scheduler)
    @Query("SELECT d FROM Debt d WHERE d.completed = false " +
            "AND d.dueDate IS NOT NULL AND d.dueDate < :today")
    List<Debt> findOverdueDebts(@Param("today") java.time.LocalDate today);
}
