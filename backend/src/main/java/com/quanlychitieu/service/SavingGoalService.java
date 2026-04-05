package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.SavingGoalRequest;
import com.quanlychitieu.dto.response.SavingGoalResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.SavingGoal;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.repository.SavingGoalRepository;
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
public class SavingGoalService {

    private final SavingGoalRepository savingGoalRepository;
    private final SecurityUtils securityUtils;

    public List<SavingGoalResponse> getAllGoals() {
        Long userId = securityUtils.getCurrentUserId();
        return savingGoalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SavingGoalResponse> getActiveGoals() {
        Long userId = securityUtils.getCurrentUserId();
        return savingGoalRepository.findByUserIdAndCompletedFalseOrderByTargetDateAsc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SavingGoalResponse createGoal(SavingGoalRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        SavingGoal goal = SavingGoal.builder()
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .icon(request.getIcon())
                .color(request.getColor())
                .targetDate(request.getTargetDate())
                .user(currentUser)
                .build();

        return toResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public SavingGoalResponse updateGoal(Long id, SavingGoalRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục tiêu tiết kiệm"));

        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setIcon(request.getIcon());
        goal.setColor(request.getColor());
        goal.setTargetDate(request.getTargetDate());

        return toResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public SavingGoalResponse addMoney(Long id, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }

        Long userId = securityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserIdForUpdate(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục tiêu tiết kiệm"));

        if (goal.getCompleted()) {
            throw new BadRequestException("Mục tiêu đã hoàn thành");
        }

        BigDecimal newAmount = goal.getCurrentAmount().add(amount);
        goal.setCurrentAmount(newAmount);

        if (goal.isAchieved()) {
            goal.setCompleted(true);
            log.info("Saving goal '{}' achieved! Target: {}", goal.getName(), goal.getTargetAmount());
        }

        return toResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public SavingGoalResponse withdrawMoney(Long id, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }

        Long userId = securityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserIdForUpdate(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục tiêu tiết kiệm"));

        if (amount.compareTo(goal.getCurrentAmount()) > 0) {
            throw new BadRequestException("Số tiền rút vượt quá số hiện có");
        }

        goal.setCurrentAmount(goal.getCurrentAmount().subtract(amount));
        goal.setCompleted(false);

        return toResponse(savingGoalRepository.save(goal));
    }

    @Transactional
    public void deleteGoal(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        SavingGoal goal = savingGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục tiêu tiết kiệm"));
        savingGoalRepository.delete(goal);
    }

    private SavingGoalResponse toResponse(SavingGoal goal) {
        return SavingGoalResponse.builder()
                .id(goal.getId())
                .name(goal.getName())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .remainingAmount(goal.getRemainingAmount())
                .progressPercentage(goal.getProgressPercentage())
                .icon(goal.getIcon())
                .color(goal.getColor())
                .targetDate(goal.getTargetDate())
                .completed(goal.getCompleted())
                .achieved(goal.isAchieved())
                .createdAt(goal.getCreatedAt())
                .build();
    }
}
