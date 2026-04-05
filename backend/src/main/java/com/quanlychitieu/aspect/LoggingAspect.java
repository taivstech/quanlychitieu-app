package com.quanlychitieu.aspect;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

/**
 * AOP Aspect: tự động log mọi request vào Controller
 * - Log method, URI, params, execution time
 * - Cross-cutting concern: không cần sửa code trong controller
 */
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // Pointcut: tất cả method trong package controller
    @Pointcut("within(com.quanlychitieu.controller..*)")
    public void controllerMethods() {}

    // Pointcut: tất cả method trong package service
    @Pointcut("within(com.quanlychitieu.service..*)")
    public void serviceMethods() {}

    /**
     * Around advice: đo thời gian thực thi của mỗi controller method
     */
    @Around("controllerMethods()")
    public Object logControllerExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = getCurrentRequest();
        String method = request != null ? request.getMethod() : "UNKNOWN";
        String uri = request != null ? request.getRequestURI() : "UNKNOWN";
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        log.info("▶ [{}] {} - {}.{}()", method, uri, className, methodName);

        long startTime = System.currentTimeMillis();
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            log.info("◀ [{}] {} - {}ms - SUCCESS", method, uri, duration);
            return result;
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("✖ [{}] {} - {}ms - ERROR: {}", method, uri, duration, ex.getMessage());
            throw ex;
        }
    }

    /**
     * AfterThrowing: log chi tiết khi service throw exception
     */
    @AfterThrowing(pointcut = "serviceMethods()", throwing = "ex")
    public void logServiceException(JoinPoint joinPoint, Exception ex) {
        String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        log.error("⚠ Service Exception: {}.{}() - {} - Args: {}",
                className, methodName, ex.getMessage(),
                Arrays.toString(joinPoint.getArgs()));
    }

    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
