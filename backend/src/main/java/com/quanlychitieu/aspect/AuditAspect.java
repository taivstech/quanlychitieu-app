package com.quanlychitieu.aspect;

import com.quanlychitieu.model.entity.AuditLog;
import com.quanlychitieu.repository.AuditLogRepository;
import com.quanlychitieu.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * AOP Aspect: tự động ghi Audit Log khi tạo/sửa/xóa dữ liệu.
 *
 * Intercept các method create*, update*, delete* trong Service layer.
 * Cross-cutting concern: không cần sửa code trong service — chỉ thêm Aspect.
 *
 * Ghi nhận: user, action, entity type, IP address
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final SecurityUtils securityUtils;

    /**
     * Pointcut: bắt tất cả method bắt đầu bằng create/update/delete trong service
     */
    @Pointcut("execution(* com.quanlychitieu.service..create*(..))")
    public void createMethods() {}

    @Pointcut("execution(* com.quanlychitieu.service..update*(..))")
    public void updateMethods() {}

    @Pointcut("execution(* com.quanlychitieu.service..delete*(..))")
    public void deleteMethods() {}

    @Pointcut("execution(* com.quanlychitieu.service..make*(..))")
    public void makeMethods() {}

    @AfterReturning(pointcut = "createMethods()", returning = "result")
    public void auditCreate(JoinPoint joinPoint, Object result) {
        saveAuditLog(joinPoint, "CREATE", result);
    }

    @AfterReturning(pointcut = "updateMethods()", returning = "result")
    public void auditUpdate(JoinPoint joinPoint, Object result) {
        saveAuditLog(joinPoint, "UPDATE", result);
    }

    @AfterReturning(pointcut = "deleteMethods()")
    public void auditDelete(JoinPoint joinPoint) {
        saveAuditLog(joinPoint, "DELETE", null);
    }

    @AfterReturning(pointcut = "makeMethods()", returning = "result")
    public void auditMake(JoinPoint joinPoint, Object result) {
        saveAuditLog(joinPoint, "UPDATE", result);
    }

    private void saveAuditLog(JoinPoint joinPoint, String action, Object result) {
        try {
            String className = joinPoint.getSignature().getDeclaringType().getSimpleName();
            String methodName = joinPoint.getSignature().getName();

            // Xác định entity type từ tên class service
            String entityType = className.replace("Service", "");

            // Lấy entity ID từ arguments (nếu có)
            Long entityId = extractEntityId(joinPoint.getArgs());

            // Lấy user info (có thể null nếu là system call)
            Long userId = null;
            String username = "SYSTEM";
            try {
                userId = securityUtils.getCurrentUserId();
                username = securityUtils.getCurrentUser().getUsername();
            } catch (Exception ignored) {
                // Scheduler hoặc system call → không có user context
            }

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .username(username)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .newValue(result != null ? result.toString() : null)
                    .ipAddress(getClientIP())
                    .build();

            auditLogRepository.save(auditLog);

            log.debug("[AUDIT] {} by {} on {}.{}() entityId={}",
                    action, username, className, methodName, entityId);

        } catch (Exception e) {
            // Audit log failure không nên ảnh hưởng business logic
            log.error("[AUDIT] Failed to save audit log: {}", e.getMessage());
        }
    }

    /**
     * Trích xuất entity ID từ method arguments.
     * Convention: ID thường là arg đầu tiên kiểu Long (cho update/delete).
     */
    private Long extractEntityId(Object[] args) {
        if (args != null) {
            for (Object arg : args) {
                if (arg instanceof Long) {
                    return (Long) arg;
                }
            }
        }
        return null;
    }

    private String getClientIP() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return null;
    }
}
