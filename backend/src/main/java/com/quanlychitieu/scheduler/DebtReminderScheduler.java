package com.quanlychitieu.scheduler;

import com.quanlychitieu.model.entity.Debt;
import com.quanlychitieu.model.entity.SavingGoal;
import com.quanlychitieu.repository.DebtRepository;
import com.quanlychitieu.repository.SavingGoalRepository;
import com.quanlychitieu.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduler nhắc nhở Nợ sắp đến hạn + Mục tiêu tiết kiệm sắp hết hạn.
 * Chạy mỗi ngày lúc 9:00 AM.
 *
 * Tại sao tách riêng khỏi BillScheduler?
 * - Single Responsibility: mỗi scheduler quản lý 1 domain riêng
 * - Dễ bật/tắt hoặc thay đổi schedule riêng biệt
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DebtReminderScheduler {

    private final DebtRepository debtRepository;
    private final SavingGoalRepository savingGoalRepository;
    private final NotificationService notificationService;

    /**
     * Chạy mỗi ngày lúc 9:00 AM
     * - Nhắc nợ sắp đến hạn (trong 3 ngày)
     * - Nhắc nợ đã quá hạn
     * - Nhắc mục tiêu tiết kiệm sắp hết hạn
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void processDebtReminders() {
        log.info("=== Bắt đầu quét nhắc nhở Nợ & Tiết kiệm ===");
        long startTime = System.currentTimeMillis();

        LocalDate today = LocalDate.now();
        int debtCount = 0;
        int savingCount = 0;

        // === 1. Nợ sắp đến hạn (3 ngày) ===
        List<Debt> upcomingDebts = debtRepository.findUpcomingDebts(today, today.plusDays(3));
        for (Debt debt : upcomingDebts) {
            long daysLeft = ChronoUnit.DAYS.between(today, debt.getDueDate());
            String message = String.format(
                    "Khoản %s với %s (%s) sẽ đến hạn trong %d ngày. Còn phải trả: %s",
                    debt.getType().name().equals("DEBT") ? "nợ" : "cho vay",
                    debt.getPersonName(),
                    formatAmount(debt.getAmount()),
                    daysLeft,
                    formatAmount(debt.getRemainingAmount()));

            notificationService.createNotification(
                    debt.getUser(),
                    "Nợ sắp đến hạn",
                    message,
                    "DEBT_UPCOMING");
            debtCount++;
        }

        // === 2. Nợ đã quá hạn ===
        List<Debt> overdueDebts = debtRepository.findOverdueDebts(today);
        for (Debt debt : overdueDebts) {
            long daysOverdue = ChronoUnit.DAYS.between(debt.getDueDate(), today);
            String message = String.format(
                    "Khoản %s với %s đã quá hạn %d ngày! Số tiền còn lại: %s",
                    debt.getType().name().equals("DEBT") ? "nợ" : "cho vay",
                    debt.getPersonName(),
                    daysOverdue,
                    formatAmount(debt.getRemainingAmount()));

            notificationService.createNotification(
                    debt.getUser(),
                    "⚠️ Nợ quá hạn",
                    message,
                    "DEBT_OVERDUE");
            debtCount++;
        }

        // === 3. Mục tiêu tiết kiệm sắp hết hạn (7 ngày) ===
        List<SavingGoal> goals = savingGoalRepository.findByCompletedFalseAndTargetDateBetween(
                today, today.plusDays(7));
        for (SavingGoal goal : goals) {
            long daysLeft = ChronoUnit.DAYS.between(today, goal.getTargetDate());
            double progress = goal.getProgressPercentage();
            String message = String.format(
                    "Mục tiêu '%s' còn %d ngày. Tiến độ: %.0f%% (%s / %s)",
                    goal.getName(), daysLeft, progress,
                    formatAmount(goal.getCurrentAmount()),
                    formatAmount(goal.getTargetAmount()));

            notificationService.createNotification(
                    goal.getUser(),
                    "Mục tiêu sắp hết hạn",
                    message,
                    "SAVING_DEADLINE");
            savingCount++;
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("=== Hoàn thành nhắc nhở trong {}ms. Nợ: {}, Tiết kiệm: {} ===",
                duration, debtCount, savingCount);
    }

    private String formatAmount(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.valueOf(1_000_000)) >= 0) {
            return String.format("%.1f triệu", amount.doubleValue() / 1_000_000);
        } else if (amount.compareTo(BigDecimal.valueOf(1_000)) >= 0) {
            return String.format("%.0fk", amount.doubleValue() / 1_000);
        }
        return amount.toPlainString() + "đ";
    }
}
