package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Event> findByIdAndUserId(Long id, Long userId);

    List<Event> findByUserIdAndCompletedFalseOrderByStartDateAsc(Long userId);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.event.id = :eventId")
    long countTransactionsByEventId(@Param("eventId") Long eventId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.event.id = :eventId AND t.type = 'EXPENSE'")
    java.math.BigDecimal sumExpenseByEventId(@Param("eventId") Long eventId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.event.id = :eventId AND t.type = 'INCOME'")
    java.math.BigDecimal sumIncomeByEventId(@Param("eventId") Long eventId);
}
