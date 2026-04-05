-- ============================================
-- MIGRATION SCRIPT - QuanLyChiTieu
-- Tổng hợp tất cả thay đổi DB
-- ============================================
-- LƯU Ý: Với ddl-auto=update + LoanCategorySeeder,
-- Hibernate + Spring Boot tự xử lý tất cả.
-- Script này chỉ dùng nếu cần chạy thủ công.
-- ============================================

-- ============================================
-- 1. SCHEMA: Đảm bảo cột type đủ rộng cho LOAN
-- (Hibernate ddl-auto=update tự làm vì @Column(length=10))
-- ============================================
ALTER TABLE categories MODIFY COLUMN type VARCHAR(10) NOT NULL;
ALTER TABLE transactions MODIFY COLUMN type VARCHAR(10) NOT NULL;

-- ============================================
-- 2. DATA: Seed LOAN categories cho TẤT CẢ users
-- (LoanCategorySeeder ApplicationRunner tự chạy khi khởi động)
-- ============================================
-- Chạy cho từng user_id (thay [USER_ID]):
INSERT INTO categories (name, type, icon, color, is_default, user_id)
SELECT 'Vay', 'LOAN', 'money-off', '#FF6B9D', true, u.id
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = u.id AND c.type = 'LOAN' AND c.name = 'Vay'
);

INSERT INTO categories (name, type, icon, color, is_default, user_id)
SELECT 'Cho vay', 'LOAN', 'money', '#00D4FF', true, u.id
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = u.id AND c.type = 'LOAN' AND c.name = 'Cho vay'
);

-- ============================================
-- 3. VERIFICATION
-- ============================================
-- Kiểm tra LOAN categories:
-- SELECT id, name, type, user_id, color FROM categories WHERE type = 'LOAN' ORDER BY user_id, name;
--
-- Kiểm tra schema:
-- DESCRIBE categories;
-- DESCRIBE transactions;
