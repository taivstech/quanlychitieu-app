package com.quanlychitieu.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Custom Validator: kiểm tra endDate phải sau startDate.
 * Dùng ở class-level trên DTO có startDate/endDate.
 *
 * Ví dụ: @ValidDateRange(startField = "startDate", endField = "endDate")
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DateRangeValidator.class)
@Documented
public @interface ValidDateRange {
    String message() default "End date must be after start date";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    String startField();
    String endField();
}
