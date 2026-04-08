package com.quanlychitieu.scheduler;

import com.quanlychitieu.model.entity.Bill;
import com.quanlychitieu.repository.BillRepository;
import com.quanlychitieu.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillScheduler {

    private final BillRepository billRepository;
    private final NotificationService notificationService;

    /**
     * Chạy mỗi ngày lúc 8:00 AM để kiểm tra và nhắc nhở hóa đơn.
     * Quét các hóa đơn chưa thanh toán, sắp đến hạn hoặc đã quá hạn.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void processBillReminders() {
        log.info("=== Bắt đầu quét nhắc nhở Hóa đơn ===");
        long startTime = System.currentTimeMillis();

        LocalDate today = LocalDate.now();
        LocalDate in3Days = today.plusDays(3);

        // Lấy danh sách hóa đơn đang active
        List<Bill> activeBills = billRepository.findByActiveTrue();

        int overdueCount = 0;
        int upcomingCount = 0;

        for (Bill bill : activeBills) {
            if (bill.getDueDate() == null) continue;

            if (bill.getDueDate().isBefore(today)) {
                log.warn("[⚠️ QUÁ HẠN] Hóa đơn '{}' của user '{}' đã quá hạn từ ngày: {} (Số tiền: {})",
                        bill.getName(), bill.getUser().getUsername(), bill.getDueDate(), bill.getAmount());
                
                String message = String.format("Hóa đơn '%s' trị giá %s đã quá hạn từ ngày %s. Vui lòng kiểm tra và thanh toán.",
                        bill.getName(), bill.getAmount(), bill.getDueDate());
                notificationService.createNotification(bill.getUser(), "Hóa đơn quá hạn", message, "BILL_OVERDUE");
                
                overdueCount++;
            } else if (!bill.getDueDate().isAfter(in3Days)) {
                log.info("[📅 NHẮC NHỞ] Hóa đơn '{}' của user '{}' sắp đến hạn vào ngày: {} (Số tiền: {})",
                        bill.getName(), bill.getUser().getUsername(), bill.getDueDate(), bill.getAmount());
                
                String message = String.format("Bạn có hóa đơn '%s' trị giá %s sắp đến hạn vào ngày %s. Đừng quên thanh toán nhé!",
                        bill.getName(), bill.getAmount(), bill.getDueDate());
                notificationService.createNotification(bill.getUser(), "Nhắc nhở hóa đơn", message, "BILL_UPCOMING");
                
                upcomingCount++;
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("=== Hoàn thành quét nhắc nhở Hóa đơn trong {}ms. Quá hạn: {}, Sắp đến hạn: {} ===", 
                  duration, overdueCount, upcomingCount);
    }
}
