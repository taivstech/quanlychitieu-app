-- ============================================
-- DỮ LIỆU MẪU cho demo ứng dụng Quản Lý Chi Tiêu
-- Chạy sau khi Hibernate tự tạo bảng (ddl-auto: update)
-- Password: "password123" → BCrypt encoded
-- ============================================SET NAMES utf8mb4;
-- Tạo user demo (password: password123)
INSERT INTO users (username, email, password, full_name, currency, enabled, created_at, updated_at) VALUES
    ('demo', 'demo@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyen Van Demo', 'VND', true, NOW(), NOW()),
    ('student', 'student@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tran Thi Student', 'VND', true, NOW(), NOW());

-- Danh mục CHI TIÊU (user demo - id=1)
INSERT INTO categories (name, type, icon, color, is_default, user_id) VALUES
    ('Ăn uống', 'EXPENSE', 'restaurant', '#FF6B6B', true, 1),
    ('Di chuyển', 'EXPENSE', 'car', '#4ECDC4', true, 1),
    ('Mua sắm', 'EXPENSE', 'cart', '#45B7D1', true, 1),
    ('Hóa đơn', 'EXPENSE', 'receipt', '#96CEB4', true, 1),
    ('Giải trí', 'EXPENSE', 'film', '#FFEAA7', true, 1),
    ('Sức khỏe', 'EXPENSE', 'medkit', '#DDA0DD', true, 1),
    ('Giáo dục', 'EXPENSE', 'school', '#98D8C8', true, 1),
    ('Khác', 'EXPENSE', 'ellipsis-horizontal', '#BDC3C7', true, 1);

-- Danh mục THU NHẬP (user demo - id=1)
INSERT INTO categories (name, type, icon, color, is_default, user_id) VALUES
    ('Lương', 'INCOME', 'wallet', '#2ECC71', true, 1),
    ('Thưởng', 'INCOME', 'gift', '#F39C12', true, 1),
    ('Đầu tư', 'INCOME', 'trending-up', '#3498DB', true, 1),
    ('Khác', 'INCOME', 'cash', '#1ABC9C', true, 1);

-- Ví tiền (user demo)
INSERT INTO wallets (name, type, balance, currency, icon, color, include_in_total, user_id, created_at, updated_at) VALUES
    ('Tiền mặt', 'CASH', 2500000.00, 'VND', 'wallet', '#4CAF50', true, 1, NOW(), NOW()),
    ('Vietcombank', 'BANK', 15000000.00, 'VND', 'business', '#1565C0', true, 1, NOW(), NOW()),
    ('Momo', 'E_WALLET', 500000.00, 'VND', 'phone-portrait', '#A50064', true, 1, NOW(), NOW());

-- Giao dịch mẫu (tháng hiện tại - user demo)
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at) VALUES
    (50000, 'EXPENSE', 'Cơm trưa', CURDATE(), 1, 1, 1, false, NOW()),
    (35000, 'EXPENSE', 'Grab đi học', CURDATE(), 2, 3, 1, false, NOW()),
    (150000, 'EXPENSE', 'Áo mới', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 3, 2, 1, false, NOW()),
    (200000, 'EXPENSE', 'Tiền điện', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 4, 2, 1, false, NOW()),
    (80000, 'EXPENSE', 'Xem phim', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 5, 1, 1, false, NOW()),
    (8000000, 'INCOME', 'Lương tháng 3', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 9, 2, 1, false, NOW()),
    (500000, 'INCOME', 'Thưởng KPI', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 10, 2, 1, false, NOW()),
    (45000, 'EXPENSE', 'Phở sáng', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 1, 1, false, NOW()),
    (120000, 'EXPENSE', 'Thuốc cảm', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 6, 1, 1, false, NOW()),
    (300000, 'EXPENSE', 'Sách Java', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 7, 2, 1, false, NOW());

-- Ngân sách tháng hiện tại (user demo)
INSERT INTO budgets (amount, spent_amount, month, year, category_id, user_id, created_at, updated_at) VALUES
    (2000000, 545000, MONTH(CURDATE()), YEAR(CURDATE()), 1, 1, NOW(), NOW()),
    (500000, 35000, MONTH(CURDATE()), YEAR(CURDATE()), 2, 1, NOW(), NOW()),
    (1000000, 150000, MONTH(CURDATE()), YEAR(CURDATE()), 3, 1, NOW(), NOW());

-- Mục tiêu tiết kiệm (user demo)
INSERT INTO saving_goals (name, target_amount, current_amount, icon, color, target_date, completed, user_id, created_at, updated_at) VALUES
    ('Mua iPhone 16', 25000000, 8000000, 'phone-portrait', '#333333', '2026-06-30', false, 1, NOW(), NOW()),
    ('Du lịch Đà Lạt', 5000000, 3200000, 'airplane', '#FF9800', '2026-08-15', false, 1, NOW(), NOW());

-- Nợ / Cho vay (user demo)
INSERT INTO debts (type, person_name, amount, paid_amount, note, due_date, completed, user_id, created_at, updated_at) VALUES
    ('DEBT', 'Anh Minh', 1000000, 400000, 'Mượn tiền mua laptop', '2026-05-01', false, 1, NOW(), NOW()),
    ('LOAN', 'Chị Hương', 500000, 0, 'Cho mượn tiền ăn', '2026-04-15', false, 1, NOW(), NOW());

-- Giao dịch định kỳ (user demo)
INSERT INTO recurring_transactions (amount, type, note, frequency, start_date, next_execution_date, active, category_id, wallet_id, user_id, created_at) VALUES
    (1500000, 'EXPENSE', 'Tiền nhà trọ', 'MONTHLY', '2026-01-05', '2026-04-05', true, 4, 2, 1, NOW()),
    (50000, 'EXPENSE', 'Cơm trưa hàng ngày', 'DAILY', '2026-03-01', CURDATE(), true, 1, 1, 1, NOW());

-- ============================================
-- Bổ sung dữ liệu cho user: taivs93 (idempotent)
-- ============================================

INSERT INTO categories (name, type, icon, color, is_default, user_id)
SELECT 'Ăn uống', 'EXPENSE', 'restaurant', '#FF6B6B', true, u.id
FROM users u
WHERE u.username = 'taivs93'
    AND NOT EXISTS (
        SELECT 1 FROM categories c
        WHERE c.user_id = u.id AND c.name = 'Ăn uống' AND c.type = 'EXPENSE'
    );

INSERT INTO categories (name, type, icon, color, is_default, user_id)
SELECT 'Lương', 'INCOME', 'wallet', '#2ECC71', true, u.id
FROM users u
WHERE u.username = 'taivs93'
    AND NOT EXISTS (
        SELECT 1 FROM categories c
        WHERE c.user_id = u.id AND c.name = 'Lương' AND c.type = 'INCOME'
    );

INSERT INTO wallets (name, type, balance, currency, icon, color, include_in_total, user_id, created_at, updated_at)
SELECT 'Ví chính', 'CASH', 1500000.00, 'VND', 'wallet', '#4CAF50', true, u.id, NOW(), NOW()
FROM users u
WHERE u.username = 'taivs93'
    AND NOT EXISTS (
        SELECT 1 FROM wallets w
        WHERE w.user_id = u.id AND w.name = 'Ví chính'
    );

INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at)
SELECT 120000, 'EXPENSE', 'Ăn trưa văn phòng', CURDATE(), c.id, w.id, u.id, false, NOW()
FROM users u
JOIN categories c ON c.user_id = u.id AND c.name = 'Ăn uống' AND c.type = 'EXPENSE'
JOIN wallets w ON w.user_id = u.id AND w.name = 'Ví chính'
WHERE u.username = 'taivs93'
    AND NOT EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.user_id = u.id AND t.note = 'Ăn trưa văn phòng' AND t.transaction_date = CURDATE()
    );

INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at)
SELECT 8500000, 'INCOME', 'Lương tháng này', DATE_SUB(CURDATE(), INTERVAL 3 DAY), c.id, w.id, u.id, false, NOW()
FROM users u
JOIN categories c ON c.user_id = u.id AND c.name = 'Lương' AND c.type = 'INCOME'
JOIN wallets w ON w.user_id = u.id AND w.name = 'Ví chính'
WHERE u.username = 'taivs93'
    AND NOT EXISTS (
        SELECT 1 FROM transactions t
        WHERE t.user_id = u.id AND t.note = 'Lương tháng này'
    );
