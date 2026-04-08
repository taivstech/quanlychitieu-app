package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUserIdOrderByDueDateAsc(Long userId);

    List<Bill> findByUserIdAndActiveTrueOrderByDueDateAsc(Long userId);
    
    List<Bill> findByActiveTrue();

    Optional<Bill> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT b FROM Bill b WHERE b.user.id = :userId AND b.active = true " +
            "AND b.dueDate BETWEEN :start AND :end ORDER BY b.dueDate ASC")
    List<Bill> findUpcomingBills(
            @Param("userId") Long userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    long countByUserIdAndActiveTrueAndDueDateBefore(Long userId, LocalDate date);
}
