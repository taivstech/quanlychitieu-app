package com.quanlychitieu.scheduler;

import com.quanlychitieu.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionScheduler {

    private final RecurringTransactionService recurringService;

    /**
     * Runs every day at 00:05 AM to process due recurring transactions.
     * Demonstrates Spring @Scheduled + background task processing.
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void processRecurringTransactions() {
        log.info("=== Starting recurring transaction processing ===");
        long startTime = System.currentTimeMillis();

        int processed = recurringService.processDueTransactions();

        long duration = System.currentTimeMillis() - startTime;
        log.info("=== Processed {} recurring transactions in {}ms ===", processed, duration);
    }
}
