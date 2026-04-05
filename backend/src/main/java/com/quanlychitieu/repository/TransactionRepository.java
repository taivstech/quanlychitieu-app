package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.Transaction;
import com.quanlychitieu.model.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Page<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
            "AND t.category.id = :categoryId " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findByUserIdAndCategoryIdAndDateRange(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
            "AND t.wallet.id = :walletId " +
            "ORDER BY t.transactionDate DESC")
    Page<Transaction> findByUserIdAndWalletId(
            @Param("userId") Long userId,
            @Param("walletId") Long walletId,
            Pageable pageable);

    // Report queries
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumByTypeAndDateRange(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category.id, t.category.name, t.category.icon, t.category.color, " +
            "SUM(t.amount) as total FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "GROUP BY t.category.id, t.category.name, t.category.icon, t.category.color " +
            "ORDER BY total DESC")
    List<Object[]> sumByCategoryAndDateRange(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT FUNCTION('DATE', t.transactionDate) as date, SUM(t.amount) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "GROUP BY FUNCTION('DATE', t.transactionDate) " +
            "ORDER BY date ASC")
    List<Object[]> sumByDayAndDateRange(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // For budget tracking
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.category.id = :categoryId " +
            "AND t.type = 'EXPENSE' " +
            "AND MONTH(t.transactionDate) = :month AND YEAR(t.transactionDate) = :year")
    BigDecimal sumExpenseByCategoryAndMonth(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("month") int month,
            @Param("year") int year);

    // Search by note or category name
    @Query("SELECT t FROM Transaction t JOIN t.category c " +
            "WHERE t.user.id = :userId " +
            "AND (LOWER(t.note) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "ORDER BY t.transactionDate DESC")
    Page<Transaction> searchByKeyword(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            Pageable pageable);

    // Count transactions in date range
    @Query("SELECT COUNT(t) FROM Transaction t " +
            "WHERE t.user.id = :userId " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate")
    long countByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Transactions by event
    List<Transaction> findByEventIdOrderByTransactionDateDesc(Long eventId);

    // Top spending: highest amount individual transactions
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId " +
            "AND t.type = 'EXPENSE' " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY t.amount DESC")
    List<Transaction> findTopSpending(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Report queries excluding flagged transactions
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "AND t.excludeFromReport = false")
    BigDecimal sumByTypeAndDateRangeForReport(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Category report: single category over time
    @Query("SELECT FUNCTION('DATE', t.transactionDate) as date, SUM(t.amount) FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.category.id = :categoryId " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "GROUP BY FUNCTION('DATE', t.transactionDate) " +
            "ORDER BY date ASC")
    List<Object[]> sumByCategoryAndDay(
            @Param("userId") Long userId,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Cumulative daily expense (for trending report)
    @Query("SELECT FUNCTION('DATE', t.transactionDate) as date, COALESCE(SUM(t.amount), 0) " +
            "FROM Transaction t " +
            "WHERE t.user.id = :userId AND t.type = :type " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "AND t.excludeFromReport = false " +
            "GROUP BY FUNCTION('DATE', t.transactionDate) " +
            "ORDER BY date ASC")
    List<Object[]> sumByDayForReport(
            @Param("userId") Long userId,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // Weekly aggregation for trend view (native query — WEEK(date,1) is MySQL-specific)
    @Query(value = "SELECT YEAR(t.transaction_date), WEEK(t.transaction_date, 1), t.type, COALESCE(SUM(t.amount), 0) " +
            "FROM transactions t " +
            "WHERE t.user_id = :userId " +
            "AND t.transaction_date BETWEEN :startDate AND :endDate " +
            "AND t.exclude_from_report = false " +
            "GROUP BY YEAR(t.transaction_date), WEEK(t.transaction_date, 1), t.type " +
            "ORDER BY YEAR(t.transaction_date) ASC, WEEK(t.transaction_date, 1) ASC",
            nativeQuery = true)
    List<Object[]> sumByWeekAndType(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
