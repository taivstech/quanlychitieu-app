package com.quanlychitieu.repository;

import com.quanlychitieu.model.entity.WalletMember;
import com.quanlychitieu.model.enums.WalletMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WalletMemberRepository extends JpaRepository<WalletMember, Long> {
    
    List<WalletMember> findByWalletId(Long walletId);
    
    List<WalletMember> findByUserIdAndStatus(Long userId, WalletMemberStatus status);
    
    Optional<WalletMember> findByWalletIdAndUserId(Long walletId, Long userId);
    
    boolean existsByWalletIdAndUserIdAndStatus(Long walletId, Long userId, WalletMemberStatus status);
}
