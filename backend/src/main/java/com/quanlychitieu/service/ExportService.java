package com.quanlychitieu.service;

import com.quanlychitieu.model.entity.Transaction;
import com.quanlychitieu.repository.TransactionRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final TransactionRepository transactionRepository;
    private final SecurityUtils securityUtils;

    /**
     * Export transactions to Excel asynchronously (demonstrates @Async + multithread)
     */
    @Async("taskExecutor")
    public CompletableFuture<byte[]> exportToExcel(LocalDate startDate, LocalDate endDate) {
        Long userId = securityUtils.getCurrentUserId();
        log.info("Starting Excel export on thread: {}", Thread.currentThread().getName());

        List<Transaction> transactions = transactionRepository
                .findByUserIdAndDateRange(userId, startDate, endDate);

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Transactions");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Date", "Type", "Category", "Amount", "Wallet", "Note"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            int rowNum = 1;
            for (Transaction t : transactions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(t.getTransactionDate().toString());
                row.createCell(1).setCellValue(t.getType().name());
                row.createCell(2).setCellValue(t.getCategory().getName());
                row.createCell(3).setCellValue(t.getAmount().doubleValue());
                row.createCell(4).setCellValue(t.getWallet().getName());
                row.createCell(5).setCellValue(t.getNote() != null ? t.getNote() : "");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);

            log.info("Excel export completed: {} transactions", transactions.size());
            return CompletableFuture.completedFuture(outputStream.toByteArray());

        } catch (Exception e) {
            log.error("Failed to export Excel: {}", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
}
