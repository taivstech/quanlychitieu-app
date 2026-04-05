package com.quanlychitieu.dto.request;

import com.quanlychitieu.model.enums.RecurringFrequency;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BillRequest {
    @NotBlank(message = "Tên hóa đơn không được để trống")
    @Size(max = 100)
    private String name;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotNull(message = "Ngày đến hạn không được để trống")
    private LocalDate dueDate;

    @NotNull(message = "Tần suất không được để trống")
    private RecurringFrequency frequency;

    private String note;
    private Long categoryId;
    private Long walletId;
}
