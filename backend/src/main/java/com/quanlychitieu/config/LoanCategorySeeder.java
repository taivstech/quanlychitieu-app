package com.quanlychitieu.config;

import com.quanlychitieu.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoanCategorySeeder implements ApplicationRunner {

    private final CategoryService categoryService;

    @Override
    public void run(ApplicationArguments args) {
        try {
            categoryService.seedLoanCategoriesForAllUsers();
            log.info("LOAN category seeding completed");
        } catch (Exception e) {
            log.warn("LOAN category seeding skipped: {}", e.getMessage());
        }
    }
}
