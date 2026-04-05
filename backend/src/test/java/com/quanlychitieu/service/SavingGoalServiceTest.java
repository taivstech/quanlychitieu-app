package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.SavingGoalRequest;
import com.quanlychitieu.dto.response.SavingGoalResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.model.entity.SavingGoal;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.repository.SavingGoalRepository;
import com.quanlychitieu.security.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Test cho SavingGoalService
 * - Test addMoney: cộng tiền, tự động completed khi đạt target
 * - Test withdrawMoney: rút tiền, edge case rút quá số dư
 * - Test edge case: amount <= 0, goal đã completed
 */
@ExtendWith(MockitoExtension.class)
class SavingGoalServiceTest {

    @Mock private SavingGoalRepository savingGoalRepository;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks
    private SavingGoalService savingGoalService;

    private SavingGoal testGoal;

    @BeforeEach
    void setUp() {
        testGoal = SavingGoal.builder()
                .id(1L)
                .name("Mua iPhone")
                .targetAmount(new BigDecimal("20000000"))
                .currentAmount(new BigDecimal("5000000"))
                .targetDate(LocalDate.of(2026, 12, 31))
                .completed(false)
                .user(User.builder().id(1L).build())
                .build();
    }

    @Nested
    @DisplayName("addMoney()")
    class AddMoneyTests {

        @Test
        @DisplayName("Thêm tiền thành công → cộng vào currentAmount")
        void addMoney_Success() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(savingGoalRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testGoal));
            when(savingGoalRepository.save(any())).thenReturn(testGoal);

            savingGoalService.addMoney(1L, new BigDecimal("3000000"));

            assertThat(testGoal.getCurrentAmount()).isEqualByComparingTo("8000000");
            assertThat(testGoal.getCompleted()).isFalse();
        }

        @Test
        @DisplayName("Thêm đủ tiền → tự động đánh dấu completed")
        void addMoney_ReachTarget_AutoCompleted() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(savingGoalRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testGoal));
            when(savingGoalRepository.save(any())).thenReturn(testGoal);

            savingGoalService.addMoney(1L, new BigDecimal("15000000"));

            assertThat(testGoal.getCurrentAmount()).isEqualByComparingTo("20000000");
            assertThat(testGoal.getCompleted()).isTrue();
        }

        @Test
        @DisplayName("Thêm số âm → BadRequestException")
        void addMoney_NegativeAmount_ThrowsException() {
            assertThatThrownBy(() ->
                    savingGoalService.addMoney(1L, new BigDecimal("-100")))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("lớn hơn 0");
        }

        @Test
        @DisplayName("Thêm vào goal đã completed → BadRequestException")
        void addMoney_AlreadyCompleted_ThrowsException() {
            testGoal.setCompleted(true);
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(savingGoalRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testGoal));

            assertThatThrownBy(() ->
                    savingGoalService.addMoney(1L, new BigDecimal("1000")))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("đã hoàn thành");
        }
    }

    @Nested
    @DisplayName("withdrawMoney()")
    class WithdrawMoneyTests {

        @Test
        @DisplayName("Rút tiền thành công")
        void withdrawMoney_Success() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(savingGoalRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testGoal));
            when(savingGoalRepository.save(any())).thenReturn(testGoal);

            savingGoalService.withdrawMoney(1L, new BigDecimal("2000000"));

            assertThat(testGoal.getCurrentAmount()).isEqualByComparingTo("3000000");
        }

        @Test
        @DisplayName("Rút vượt quá currentAmount → BadRequestException")
        void withdrawMoney_ExceedsBalance_ThrowsException() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(savingGoalRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testGoal));

            assertThatThrownBy(() ->
                    savingGoalService.withdrawMoney(1L, new BigDecimal("10000000")))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("vượt quá");
        }

        @Test
        @DisplayName("Rút số 0 → BadRequestException")
        void withdrawMoney_ZeroAmount_ThrowsException() {
            assertThatThrownBy(() ->
                    savingGoalService.withdrawMoney(1L, BigDecimal.ZERO))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("lớn hơn 0");
        }
    }
}
