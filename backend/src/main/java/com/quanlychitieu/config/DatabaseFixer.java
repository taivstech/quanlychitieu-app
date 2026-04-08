package com.quanlychitieu.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseFixer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixNullVersions() {
        try {
            // Fix Hibernate NullPointerException: "Cannot invoke java.lang.Long.longValue() because current is null"
            jdbcTemplate.execute("UPDATE wallets SET version = 0 WHERE version IS NULL");
            jdbcTemplate.execute("UPDATE saving_goals SET version = 0 WHERE version IS NULL");
            jdbcTemplate.execute("UPDATE debts SET version = 0 WHERE version IS NULL");
            System.out.println("====== [DATABASE FIXER] Đã vá lỗi NULL version cho Hibernate thành công! ======");
        } catch (Exception e) {
            System.out.println("====== [DATABASE FIXER] Bỏ qua vá lỗi (Bảng chưa tồn tại hoặc lý do khác) ======");
        }
    }
}
