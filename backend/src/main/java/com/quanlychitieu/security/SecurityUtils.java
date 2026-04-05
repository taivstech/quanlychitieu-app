package com.quanlychitieu.security;

import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Lấy userId từ CustomUserDetails (đã load sẵn khi authenticate)
     * → KHÔNG query DB thêm lần nào
     * Trước đây: getCurrentUserId() → findByUsername() → query DB mỗi request (N+1)
     * Bây giờ: lấy trực tiếp từ SecurityContext, zero DB call
     */
    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userDetails.getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    /**
     * Chỉ gọi DB khi thật sự cần full User entity (ví dụ: createWallet cần set user)
     * Hầu hết các method chỉ cần userId → dùng getCurrentUserId() thay vì method này
     */
    public User getCurrentUser() {
        Long userId = getCurrentUserId();
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
}
