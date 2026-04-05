package com.quanlychitieu.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect: đo performance của các service method
 * - Cảnh báo nếu method chạy quá 500ms (slow query)
 */
@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    private static final long SLOW_THRESHOLD_MS = 500;

    @Around("within(com.quanlychitieu.service..*)")
    public Object measurePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String method = joinPoint.getSignature().getName();

        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;

        if (duration > SLOW_THRESHOLD_MS) {
            log.warn("🐢 SLOW METHOD: {}.{}() took {}ms (threshold: {}ms)",
                    className, method, duration, SLOW_THRESHOLD_MS);
        }

        return result;
    }
}
