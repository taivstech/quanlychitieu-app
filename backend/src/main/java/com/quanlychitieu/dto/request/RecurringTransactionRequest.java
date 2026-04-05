package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.RecurringFrequency;
import com.quanlychitieu.model.enums.TransactionType;
import com.quanlychitieu.validation.ValidDateRange;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@ValidDateRange(startField = "startDate", endField = "endDate")
public class RecurringTransactionRequest {
    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotNull(message = "Loại giao dịch không được để trống")
    private TransactionType type;

    private String note;

    @NotNull(message = "Tần suất không được để trống")
    private RecurringFrequency frequency;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Ví không được để trống")
    private Long walletId;
}
