package com.quanlychitieu.service;

import com.quanlychitieu.dto.request.CategoryRequest;
import com.quanlychitieu.dto.response.CategoryResponse;
import com.quanlychitieu.exception.BadRequestException;
import com.quanlychitieu.exception.ResourceNotFoundException;
import com.quanlychitieu.model.entity.Category;
import com.quanlychitieu.model.entity.User;
import com.quanlychitieu.model.enums.CategoryType;
import com.quanlychitieu.repository.CategoryRepository;
import com.quanlychitieu.repository.UserRepository;
import com.quanlychitieu.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;

    @Cacheable(value = "categories", key = "'user_' + #userId")
    public List<CategoryResponse> getAllCategories(Long userId) {
        return categoryRepository.findRootCategoriesByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CategoryResponse> getCategoriesByType(CategoryType type) {
        Long userId = securityUtils.getCurrentUserId();
        return categoryRepository.findByUserIdAndType(userId, type).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CategoryRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Category category = Category.builder()
                .name(request.getName())
                .icon(request.getIcon())
                .color(request.getColor())
                .type(request.getType())
                .user(currentUser)
                .isDefault(false)
                .build();

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục cha"));
            category.setParent(parent);
        }

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (!category.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không sở hữu danh mục này");
        }

        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setType(request.getType());

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục cha"));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        Long userId = securityUtils.getCurrentUserId();
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (!category.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không sở hữu danh mục này");
        }
        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new BadRequestException("Không thể xóa danh mục mặc định");
        }

        categoryRepository.delete(category);
    }

    @Transactional
    public void initDefaultCategories(User user) {
        // Expense categories
        createDefaultCategory("Ăn uống", "restaurant", "#FF6B6B", CategoryType.EXPENSE, user);
        createDefaultCategory("Di chuyển", "car", "#4ECDC4", CategoryType.EXPENSE, user);
        createDefaultCategory("Giải trí", "film", "#45B7D1", CategoryType.EXPENSE, user);
        createDefaultCategory("Mua sắm", "cart", "#96CEB4", CategoryType.EXPENSE, user);
        createDefaultCategory("Hóa đơn & Tiện ích", "receipt", "#FFEAA7", CategoryType.EXPENSE, user);
        createDefaultCategory("Sức khỏe", "medkit", "#DDA0DD", CategoryType.EXPENSE, user);
        createDefaultCategory("Giáo dục", "school", "#98D8C8", CategoryType.EXPENSE, user);
        createDefaultCategory("Khác", "ellipsis-horizontal", "#B8B8B8", CategoryType.EXPENSE, user);

        // Income categories
        createDefaultCategory("Lương", "wallet", "#2ECC71", CategoryType.INCOME, user);
        createDefaultCategory("Thưởng", "gift", "#F39C12", CategoryType.INCOME, user);
        createDefaultCategory("Đầu tư", "trending-up", "#3498DB", CategoryType.INCOME, user);
        createDefaultCategory("Bán hàng", "storefront", "#E74C3C", CategoryType.INCOME, user);
        createDefaultCategory("Thu nhập khác", "cash", "#9B59B6", CategoryType.INCOME, user);

        // Loan categories
        createDefaultCategory("Vay", "remove-circle", "#FF6B9D", CategoryType.LOAN, user);
        createDefaultCategory("Cho vay", "add-circle", "#00D4FF", CategoryType.LOAN, user);

        log.info("Initialized default categories for user: {}", user.getUsername());
    }

    /**
     * Seed LOAN categories for users that don't have them yet (migration helper)
     */
    @Transactional
    public void seedLoanCategoriesForAllUsers() {
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            boolean hasVay = categoryRepository.findByUserIdAndType(user.getId(), CategoryType.LOAN)
                    .stream().anyMatch(c -> "Vay".equals(c.getName()));
            if (!hasVay) {
                createDefaultCategory("Vay", "remove-circle", "#FF6B9D", CategoryType.LOAN, user);
                createDefaultCategory("Cho vay", "add-circle", "#00D4FF", CategoryType.LOAN, user);
                log.info("Seeded LOAN categories for user: {}", user.getUsername());
            }
        }
    }

    private void createDefaultCategory(String name, String icon, String color,
                                        CategoryType type, User user) {
        Category category = Category.builder()
                .name(name)
                .icon(icon)
                .color(color)
                .type(type)
                .user(user)
                .isDefault(true)
                .build();
        categoryRepository.save(category);
    }

    private CategoryResponse toResponse(Category category) {
        List<CategoryResponse> subCategories = null;
        if (category.getSubCategories() != null && !category.getSubCategories().isEmpty()) {
            subCategories = category.getSubCategories().stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }

        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .icon(category.getIcon())
                .color(category.getColor())
                .type(category.getType())
                .isDefault(category.getIsDefault())
                .subCategories(subCategories)
                .build();
    }
}
