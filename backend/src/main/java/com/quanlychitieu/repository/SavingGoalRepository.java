package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.SavingGoal;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingGoalRepository extends JpaRepository<SavingGoal, Long> {
    List<SavingGoal> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<SavingGoal> findByUserIdAndCompletedFalseOrderByTargetDateAsc(Long userId);
    Optional<SavingGoal> findByIdAndUserId(Long id, Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sg FROM SavingGoal sg WHERE sg.id = :id AND sg.user.id = :userId")
    Optional<SavingGoal> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    long countByUserIdAndCompletedFalse(Long userId);

    // Mục tiêu tiết kiệm sắp hết hạn (cho scheduler)
    List<SavingGoal> findByCompletedFalseAndTargetDateBetween(
            java.time.LocalDate start, java.time.LocalDate end);
}
