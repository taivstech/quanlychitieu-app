package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.TransferRequest;
import com.quanlychitieu.dto.request.WalletRequest;
import com.quanlychitieu.dto.response.WalletResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.entity.Wallet;
import com.quanlychitieu.model.enums.WalletType;
import com.quanlychitieu.repository.WalletRepository;
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
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit Test cho WalletService
 * - Dùng Mockito mock dependencies (Repository, SecurityUtils)
 * - Test các edge case: số dư không đủ, transfer cùng ví, xóa ví có giao dịch
 */
@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;

    @Mock
    private SecurityUtils securityUtils;

    @InjectMocks
    private WalletService walletService;

    private User testUser;
    private Wallet testWallet;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .currency("VND")
                .build();

        testWallet = Wallet.builder()
                .id(1L)
                .name("Tiền mặt")
                .type(WalletType.CASH)
                .balance(new BigDecimal("1000000"))
                .currency("VND")
                .user(testUser)
                .transactions(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("createWallet()")
    class CreateWalletTests {

        @Test
        @DisplayName("Tạo ví mới thành công")
        void createWallet_Success() {
            WalletRequest request = new WalletRequest();
            request.setName("Tiền mặt");
            request.setType(WalletType.CASH);
            request.setBalance(new BigDecimal("500000"));

            when(securityUtils.getCurrentUser()).thenReturn(testUser);
            when(walletRepository.save(any(Wallet.class))).thenReturn(testWallet);

            WalletResponse response = walletService.createWallet(request);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Tiền mặt");
            verify(walletRepository).save(any(Wallet.class));
        }
    }

    @Nested
    @DisplayName("updateBalance()")
    class UpdateBalanceTests {

        @Test
        @DisplayName("Thu nhập → cộng balance thành công")
        void updateBalance_Income_AddsToBalance() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testWallet));

            walletService.updateBalance(1L, new BigDecimal("200000"), false);

            assertThat(testWallet.getBalance()).isEqualByComparingTo("1200000");
            verify(walletRepository).save(testWallet);
        }

        @Test
        @DisplayName("Chi tiêu → trừ balance thành công khi đủ tiền")
        void updateBalance_Expense_SubtractsBalance() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testWallet));

            walletService.updateBalance(1L, new BigDecimal("300000"), true);

            assertThat(testWallet.getBalance()).isEqualByComparingTo("700000");
        }

        @Test
        @DisplayName("Chi tiêu vượt quá số dư → ném BadRequestException")
        void updateBalance_InsufficientBalance_ThrowsException() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testWallet));

            assertThatThrownBy(() ->
                    walletService.updateBalance(1L, new BigDecimal("2000000"), true))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Số dư không đủ");
        }

        @Test
        @DisplayName("Ví không tồn tại → ném ResourceNotFoundException")
        void updateBalance_WalletNotFound_ThrowsException() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    walletService.updateBalance(1L, new BigDecimal("100"), true))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("transfer()")
    class TransferTests {

        private Wallet walletB;

        @BeforeEach
        void setUp() {
            walletB = Wallet.builder()
                    .id(2L)
                    .name("Ngân hàng")
                    .type(WalletType.BANK_ACCOUNT)
                    .balance(new BigDecimal("500000"))
                    .currency("VND")
                    .user(testUser)
                    .build();
        }

        @Test
        @DisplayName("Transfer thành công → ví nguồn trừ, ví đích cộng")
        void transfer_Success() {
            TransferRequest request = new TransferRequest();
            request.setFromWalletId(1L);
            request.setToWalletId(2L);
            request.setAmount(new BigDecimal("300000"));

            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testWallet));
            when(walletRepository.findByIdAndUserIdForUpdate(2L, 1L))
                    .thenReturn(Optional.of(walletB));
            when(walletRepository.findByIdAndUserId(1L, 1L))
                    .thenReturn(Optional.of(testWallet));
            when(walletRepository.findByIdAndUserId(2L, 1L))
                    .thenReturn(Optional.of(walletB));

            walletService.transfer(request);

            assertThat(testWallet.getBalance()).isEqualByComparingTo("700000");
            assertThat(walletB.getBalance()).isEqualByComparingTo("800000");
        }

        @Test
        @DisplayName("Transfer cùng ví → ném BadRequestException")
        void transfer_SameWallet_ThrowsException() {
            TransferRequest request = new TransferRequest();
            request.setFromWalletId(1L);
            request.setToWalletId(1L);
            request.setAmount(new BigDecimal("100000"));

            when(securityUtils.getCurrentUserId()).thenReturn(1L);

            assertThatThrownBy(() -> walletService.transfer(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("cùng một ví");
        }

        @Test
        @DisplayName("Transfer vượt quá số dư ví nguồn → ném BadRequestException")
        void transfer_InsufficientBalance_ThrowsException() {
            TransferRequest request = new TransferRequest();
            request.setFromWalletId(1L);
            request.setToWalletId(2L);
            request.setAmount(new BigDecimal("5000000"));

            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserIdForUpdate(1L, 1L))
                    .thenReturn(Optional.of(testWallet));
            when(walletRepository.findByIdAndUserIdForUpdate(2L, 1L))
                    .thenReturn(Optional.of(walletB));
            when(walletRepository.findByIdAndUserId(1L, 1L))
                    .thenReturn(Optional.of(testWallet));
            when(walletRepository.findByIdAndUserId(2L, 1L))
                    .thenReturn(Optional.of(walletB));

            assertThatThrownBy(() -> walletService.transfer(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Số dư không đủ");
        }
    }

    @Nested
    @DisplayName("deleteWallet()")
    class DeleteWalletTests {

        @Test
        @DisplayName("Xóa ví trống → thành công")
        void deleteWallet_EmptyWallet_Success() {
            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserId(1L, 1L))
                    .thenReturn(Optional.of(testWallet));

            walletService.deleteWallet(1L);

            verify(walletRepository).delete(testWallet);
        }

        @Test
        @DisplayName("Xóa ví có transactions → ném BadRequestException")
        void deleteWallet_HasTransactions_ThrowsException() {
            testWallet.getTransactions().add(new com.quanlychitieu.model.entity.Transaction());

            when(securityUtils.getCurrentUserId()).thenReturn(1L);
            when(walletRepository.findByIdAndUserId(1L, 1L))
                    .thenReturn(Optional.of(testWallet));

            assertThatThrownBy(() -> walletService.deleteWallet(1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("có giao dịch");
        }
    }
}
