package com.quanlychitieu.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate Limiting Filter — chống spam API calls.
 *
 * Thuật toán: Fixed Window Counter
 * - Mỗi IP được phép tối đa MAX_REQUESTS request trong TIME_WINDOW_MS
 * - Nếu vượt → trả về 429 Too Many Requests
 * - Window reset sau mỗi TIME_WINDOW_MS
 *
 * Tại sao dùng ConcurrentHashMap?
 * - Thread-safe: nhiều request đồng thời từ cùng IP
 * - AtomicInteger: increment không cần synchronized
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 100;         // 100 requests
    private static final long TIME_WINDOW_MS = 60_000;   // per 1 phút

    // Map<IP, RequestInfo> — lưu số lượng request theo IP
    private final Map<String, RequestInfo> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        // Bỏ qua Swagger + Actuator
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/swagger") || uri.startsWith("/api/v3/api-docs")
                || uri.startsWith("/api/actuator")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIP(request);
        long now = System.currentTimeMillis();

        RequestInfo info = requestCounts.compute(clientIp, (ip, existing) -> {
            if (existing == null || now - existing.windowStart > TIME_WINDOW_MS) {
                // Window mới hoặc window cũ hết hạn → reset
                return new RequestInfo(now, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });

        if (info.count.get() > MAX_REQUESTS) {
            log.warn("🚫 Rate limit exceeded for IP: {} ({} requests in {}s)",
                    clientIp, info.count.get(), TIME_WINDOW_MS / 1000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Lưu thông tin window: thời điểm bắt đầu + số request count
     */
    private static class RequestInfo {
        final long windowStart;
        final AtomicInteger count;

        RequestInfo(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
