package com.quanlychitieu.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;

import java.time.LocalDate;

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {

    private String startField;
    private String endField;

    @Override
    public void initialize(ValidDateRange annotation) {
        this.startField = annotation.startField();
        this.endField = annotation.endField();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) return true;

        BeanWrapperImpl wrapper = new BeanWrapperImpl(value);
        Object startValue = wrapper.getPropertyValue(startField);
        Object endValue = wrapper.getPropertyValue(endField);

        if (startValue == null || endValue == null) return true;

        if (startValue instanceof LocalDate startDate && endValue instanceof LocalDate endDate) {
            if (endDate.isBefore(startDate)) {
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                        .addPropertyNode(endField)
                        .addConstraintViolation();
                return false;
            }
        }

        return true;
    }
}
