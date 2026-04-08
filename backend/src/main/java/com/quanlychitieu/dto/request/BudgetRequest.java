package com.quanlychitieu.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {
    @NotNull(message = "Hạn mức không được để trống")
    @DecimalMin(value = "0.01", message = "Số tiền phải lớn hơn 0")
    private BigDecimal amountLimit;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Tháng không được để trống")
    private Integer month;

    @NotNull(message = "Năm không được để trống")
    private Integer year;

    /** Cho phép dư ngân sách chuyển sang tháng sau */
    private Boolean rolloverEnabled;
}
