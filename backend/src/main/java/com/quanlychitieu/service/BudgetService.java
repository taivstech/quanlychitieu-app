package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.BudgetRequest;
import com.quanlychitieu.dto.response.BudgetResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.Budget;
import com.quanlychitieu.model.entity.Category;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.repository.BudgetRepository;
import com.quanlychitieu.repository.CategoryRepository;
import com.quanlychitieu.repository.TransactionRepository;
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
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final SecurityUtils securityUtils;

    public List<BudgetResponse> getBudgets(Integer month, Integer year) {
        Long userId = securityUtils.getCurrentUserId();
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BudgetResponse createBudget(BudgetRequest request) {
        User currentUser = securityUtils.getCurrentUser();
        Long userId = currentUser.getId();

        // Check if budget already exists for this category/month/year
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.getCategoryId(), request.getMonth(), request.getYear())
                .ifPresent(b -> { throw new BadRequestException("Ngân sách cho danh mục và chu kỳ này đã tồn tại"); });

        Category category = categoryRepository.findByIdAndUserIdOrDefault(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        // Calculate current spent amount
        BigDecimal spentAmount = transactionRepository.sumExpenseByCategoryAndMonth(
                userId, request.getCategoryId(), request.getMonth(), request.getYear());

        // Tính rollover từ tháng trước (nếu bật)
        BigDecimal rolloverAmount = BigDecimal.ZERO;
        boolean rolloverEnabled = Boolean.TRUE.equals(request.getRolloverEnabled());
        if (rolloverEnabled) {
            rolloverAmount = calculateRollover(userId, request.getCategoryId(),
                    request.getMonth(), request.getYear());
        }

        Budget budget = Budget.builder()
                .amountLimit(request.getAmountLimit())
                .spentAmount(spentAmount)
                .month(request.getMonth())
                .year(request.getYear())
                .rolloverEnabled(rolloverEnabled)
                .rolloverAmount(rolloverAmount)
                .category(category)
                .user(currentUser)
                .build();

        return toResponse(budgetRepository.save(budget));
    }

    @Transactional
    public BudgetResponse updateBudget(Long id, BudgetRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngân sách"));

        budget.setAmountLimit(request.getAmountLimit());
        if (request.getRolloverEnabled() != null) {
            budget.setRolloverEnabled(request.getRolloverEnabled());
            if (Boolean.TRUE.equals(request.getRolloverEnabled())) {
                budget.setRolloverAmount(calculateRollover(userId,
                        budget.getCategory().getId(), budget.getMonth(), budget.getYear()));
            } else {
                budget.setRolloverAmount(BigDecimal.ZERO);
            }
        }
        return toResponse(budgetRepository.save(budget));
    }

    @Transactional
    public void deleteBudget(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ngân sách"));
        budgetRepository.delete(budget);
    }

    @Transactional
    public void updateSpentAmount(Long userId, Long categoryId, int month, int year) {
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, categoryId, month, year)
                .ifPresent(budget -> {
                    BigDecimal spent = transactionRepository.sumExpenseByCategoryAndMonth(
                            userId, categoryId, month, year);
                    budget.setSpentAmount(spent);
                    budgetRepository.save(budget);

                    if (budget.isOverBudget()) {
                        log.warn("Budget exceeded for category {} in {}/{}: {}% used",
                                budget.getCategory().getName(), month, year,
                                String.format("%.1f", budget.getUsagePercentage()));
                    }
                });
    }

    /**
     * Tính rollover: dư ngân sách tháng trước chuyển sang tháng này.
     * Nếu tháng trước không có budget hoặc đã chi vượt → rollover = 0
     */
    private BigDecimal calculateRollover(Long userId, Long categoryId, int month, int year) {
        // Tính tháng trước
        int prevMonth = month == 1 ? 12 : month - 1;
        int prevYear = month == 1 ? year - 1 : year;

        return budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(
                        userId, categoryId, prevMonth, prevYear)
                .map(prevBudget -> {
                    BigDecimal remaining = prevBudget.getRemainingAmount();
                    // Chỉ rollover nếu dư (remaining > 0)
                    return remaining.compareTo(BigDecimal.ZERO) > 0 ? remaining : BigDecimal.ZERO;
                })
                .orElse(BigDecimal.ZERO);
    }

    private BudgetResponse toResponse(Budget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .amountLimit(budget.getAmountLimit())
                .spentAmount(budget.getSpentAmount())
                .remainingAmount(budget.getRemainingAmount())
                .usagePercentage(budget.getUsagePercentage())
                .overBudget(budget.isOverBudget())
                .month(budget.getMonth())
                .year(budget.getYear())
                .categoryName(budget.getCategory().getName())
                .categoryId(budget.getCategory().getId())
                .categoryIcon(budget.getCategory().getIcon())
                .categoryColor(budget.getCategory().getColor())
                .rolloverEnabled(Boolean.TRUE.equals(budget.getRolloverEnabled()))
                .rolloverAmount(budget.getRolloverAmount())
                .effectiveLimit(budget.getEffectiveLimit())
                .build();
    }
}
