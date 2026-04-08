package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.TransferRequest;
import com.quanlychitieu.dto.request.WalletInviteRequest;
import com.quanlychitieu.dto.request.WalletRequest;
import com.quanlychitieu.dto.response.WalletMemberResponse;
import com.quanlychitieu.dto.response.WalletResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.entity.Wallet;
import com.quanlychitieu.model.entity.WalletMember;
import com.quanlychitieu.model.enums.WalletMemberStatus;
import com.quanlychitieu.model.enums.WalletRole;
import com.quanlychitieu.repository.UserRepository;
import com.quanlychitieu.repository.WalletMemberRepository;
import com.quanlychitieu.repository.WalletRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletMemberRepository walletMemberRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    public List<WalletResponse> getAllWallets() {
        Long userId = securityUtils.getCurrentUserId();
        
        // Lấy ví cá nhân (nơi user là chủ sở hữu)
        List<Wallet> personalWallets = walletRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        // Lấy ví dùng chung (nơi user là thành viên và đã chấp nhận)
        List<Wallet> sharedWallets = walletMemberRepository.findByUserIdAndStatus(userId, WalletMemberStatus.ACCEPTED)
                .stream()
                .map(WalletMember::getWallet)
                .collect(Collectors.toList());
        
        personalWallets.addAll(sharedWallets);
        
        return personalWallets.stream()
                .distinct()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WalletResponse getWallet(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
        
        // Kiểm tra quyền: là chủ sở hữu HOẶC là thành viên đã chấp nhận
        boolean isOwner = wallet.getUser().getId().equals(userId);
        boolean isMember = walletMemberRepository.existsByWalletIdAndUserIdAndStatus(id, userId, WalletMemberStatus.ACCEPTED);
        
        if (!isOwner && !isMember) {
            throw new BadRequestException("Bạn không có quyền truy cập ví này");
        }
        
        return toResponse(wallet);
    }

    @Transactional
    public WalletResponse createWallet(WalletRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Wallet wallet = Wallet.builder()
                .name(request.getName())
                .type(request.getType())
                .balance(request.getBalance())
                .icon(request.getIcon())
                .color(request.getColor())
                .includeInTotal(request.getIncludeInTotal())
                .currency(currentUser.getCurrency())
                .user(currentUser)
                .build();

        return toResponse(walletRepository.save(wallet));
    }

    @Transactional
    public WalletResponse updateWallet(Long id, WalletRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        wallet.setName(request.getName());
        wallet.setType(request.getType());
        wallet.setIcon(request.getIcon());
        wallet.setColor(request.getColor());
        wallet.setIncludeInTotal(request.getIncludeInTotal());

        return toResponse(walletRepository.save(wallet));
    }

    @Transactional
    public void deleteWallet(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        if (!wallet.getTransactions().isEmpty()) {
            throw new BadRequestException(
                    "Không thể xóa ví có giao dịch. Vui lòng chuyển hoặc xóa giao dịch trước.");
        }

        walletRepository.delete(wallet);
    }

    public BigDecimal getTotalBalance() {
        Long userId = securityUtils.getCurrentUserId();
        return walletRepository.getTotalBalance(userId);
    }

    @Transactional
    public void updateBalance(Long walletId, BigDecimal amount, boolean isExpense) {
        Long userId = securityUtils.getCurrentUserId();
        // Pessimistic lock: SELECT ... FOR UPDATE
        Wallet wallet = walletRepository.findByIdAndUserIdForUpdate(walletId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        applyBalanceChange(wallet, amount, isExpense);
        walletRepository.save(wallet);
    }

    /**
     * Cập nhật số dư không cần auth context - dùng cho scheduler/background tasks.
     */
    @Transactional
    public void updateBalanceInternal(Long walletId, BigDecimal amount, boolean isExpense) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví: " + walletId));

        applyBalanceChange(wallet, amount, isExpense);
        walletRepository.save(wallet);
    }

    private void applyBalanceChange(Wallet wallet, BigDecimal amount, boolean isExpense) {
        if (isExpense) {
            BigDecimal newBalance = wallet.getBalance().subtract(amount);
            if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException(
                        String.format("Số dư không đủ. Hiện tại: %s, Cần: %s",
                                wallet.getBalance(), amount));
            }
            wallet.setBalance(newBalance);
        } else {
            wallet.setBalance(wallet.getBalance().add(amount));
        }
    }

    @Transactional
    public void transfer(TransferRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        if (request.getFromWalletId().equals(request.getToWalletId())) {
            throw new BadRequestException("Không thể chuyển tiền vào cùng một ví");
        }

        // Lock theo thứ tự ID nhỏ → lớn để tránh DEADLOCK
        Long firstId = Math.min(request.getFromWalletId(), request.getToWalletId());
        Long secondId = Math.max(request.getFromWalletId(), request.getToWalletId());

        walletRepository.findByIdAndUserIdForUpdate(firstId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));
        walletRepository.findByIdAndUserIdForUpdate(secondId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        // Re-fetch sau lock
        Wallet fromWallet = walletRepository.findByIdAndUserId(request.getFromWalletId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví nguồn"));
        Wallet toWallet = walletRepository.findByIdAndUserId(request.getToWalletId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví đích"));

        // Edge case: kiểm tra đủ tiền
        if (fromWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BadRequestException(
                        String.format("Số dư không đủ. Hiện tại: %s, Cần: %s",
                            fromWallet.getBalance(), request.getAmount()));
        }

        fromWallet.setBalance(fromWallet.getBalance().subtract(request.getAmount()));
        toWallet.setBalance(toWallet.getBalance().add(request.getAmount()));

        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        log.info("Transfer {} from wallet {} to wallet {} completed",
                request.getAmount(), fromWallet.getName(), toWallet.getName());
    }

    @Transactional
    public void inviteMember(Long walletId, WalletInviteRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findByIdAndUserId(walletId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chỉ chủ ví mới có quyền mời thành viên"));

        User invitee = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + request.getUsername()));

        if (invitee.getId().equals(userId)) {
            throw new BadRequestException("Bạn không thể tự mời chính mình");
        }

        if (walletMemberRepository.findByWalletIdAndUserId(walletId, invitee.getId()).isPresent()) {
            throw new BadRequestException("Người dùng này đã là thành viên hoặc đã được mời");
        }

        WalletMember member = WalletMember.builder()
                .wallet(wallet)
                .user(invitee)
                .role(request.getRole())
                .status(WalletMemberStatus.PENDING)
                .build();

        walletMemberRepository.save(member);
        wallet.setIsShared(true);
        walletRepository.save(wallet);
        
        log.info("User {} invited to wallet {}", invitee.getUsername(), wallet.getName());
    }

    @Transactional
    public void respondToInvite(Long memberId, boolean accept) {
        Long userId = securityUtils.getCurrentUserId();
        WalletMember member = walletMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời"));

        if (!member.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền phản hồi lời mời này");
        }

        if (accept) {
            member.setStatus(WalletMemberStatus.ACCEPTED);
            walletMemberRepository.save(member);
        } else {
            walletMemberRepository.delete(member);
        }
    }

    public List<WalletMemberResponse> getWalletMembers(Long walletId) {
        Long userId = securityUtils.getCurrentUserId();
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ví"));

        boolean isOwner = wallet.getUser().getId().equals(userId);
        boolean isMember = walletMemberRepository.existsByWalletIdAndUserIdAndStatus(walletId, userId, WalletMemberStatus.ACCEPTED);
        
        if (!isOwner && !isMember) {
            throw new BadRequestException("Bạn không có quyền truy cập thông tin ví này");
        }

        return walletMemberRepository.findByWalletId(walletId).stream()
                .map(m -> WalletMemberResponse.builder()
                        .id(m.getId())
                        .userId(m.getUser().getId())
                        .username(m.getUser().getUsername())
                        .fullName(m.getUser().getFullName())
                        .role(m.getRole())
                        .status(m.getStatus())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<WalletMemberResponse> getPendingInvites() {
        Long userId = securityUtils.getCurrentUserId();
        return walletMemberRepository.findByUserIdAndStatus(userId, WalletMemberStatus.PENDING).stream()
                .map(m -> WalletMemberResponse.builder()
                        .id(m.getId())
                        .userId(m.getWallet().getUser().getId())
                        .username(m.getWallet().getName())
                        .fullName(m.getWallet().getUser().getFullName())
                        .role(m.getRole())
                        .status(m.getStatus())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .name(wallet.getName())
                .type(wallet.getType())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .icon(wallet.getIcon())
                .color(wallet.getColor())
                .includeInTotal(wallet.getIncludeInTotal())
                .isShared(wallet.getIsShared())
                .build();
    }
}
