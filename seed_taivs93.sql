SET NAMES utf8mb4;
SET @uid = (SELECT id FROM users WHERE username = 'taivs93');

-- Clean old data
DELETE FROM transactions WHERE user_id = @uid;
DELETE FROM wallets WHERE user_id = @uid;

-- Wallets
INSERT INTO wallets (name, type, balance, currency, icon, color, include_in_total, user_id, created_at, updated_at) VALUES
('Tiền mặt', 'CASH', 2500000, 'VND', 'wallet', '#4CAF50', 1, @uid, NOW(), NOW()),
('Vietcombank', 'BANK_ACCOUNT', 15000000, 'VND', 'business', '#1565C0', 1, @uid, NOW(), NOW()),
('Momo', 'E_WALLET', 500000, 'VND', 'phone-portrait', '#A50064', 1, @uid, NOW(), NOW());

SET @aw = (SELECT id FROM wallets WHERE user_id = @uid AND name = 'Tiền mặt');
SET @bw = (SELECT id FROM wallets WHERE user_id = @uid AND name = 'Vietcombank');
SET @mw = (SELECT id FROM wallets WHERE user_id = @uid AND name = 'Momo');

SET @c1 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Ăn uống' AND type = 'EXPENSE');
SET @c2 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Di chuyển' AND type = 'EXPENSE');
SET @c3 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Mua sắm' AND type = 'EXPENSE');
SET @c4 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Hóa đơn' AND type = 'EXPENSE');
SET @c5 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Giải trí' AND type = 'EXPENSE');
SET @c6 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Sức khỏe' AND type = 'EXPENSE');
SET @c7 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Giáo dục' AND type = 'EXPENSE');
SET @c9 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Lương' AND type = 'INCOME');
SET @c10 = (SELECT id FROM categories WHERE user_id = @uid AND name = 'Thưởng' AND type = 'INCOME');

-- Transactions
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at) VALUES
(50000, 'EXPENSE', 'Cơm trưa', CURDATE(), @c1, @aw, @uid, 0, NOW()),
(35000, 'EXPENSE', 'Grab đi học', CURDATE(), @c2, @mw, @uid, 0, NOW()),
(150000, 'EXPENSE', 'Áo mới', DATE_SUB(CURDATE(), INTERVAL 1 DAY), @c3, @bw, @uid, 0, NOW()),
(200000, 'EXPENSE', 'Tiền điện', DATE_SUB(CURDATE(), INTERVAL 2 DAY), @c4, @bw, @uid, 0, NOW()),
(80000, 'EXPENSE', 'Xem phim', DATE_SUB(CURDATE(), INTERVAL 3 DAY), @c5, @aw, @uid, 0, NOW()),
(8000000, 'INCOME', 'Lương tháng 3', DATE_SUB(CURDATE(), INTERVAL 5 DAY), @c9, @bw, @uid, 0, NOW()),
(500000, 'INCOME', 'Thưởng KPI', DATE_SUB(CURDATE(), INTERVAL 7 DAY), @c10, @bw, @uid, 0, NOW()),
(45000, 'EXPENSE', 'Phở sáng', DATE_SUB(CURDATE(), INTERVAL 1 DAY), @c1, @aw, @uid, 0, NOW()),
(120000, 'EXPENSE', 'Thuốc cảm', DATE_SUB(CURDATE(), INTERVAL 4 DAY), @c6, @aw, @uid, 0, NOW()),
(300000, 'EXPENSE', 'Sách Java', DATE_SUB(CURDATE(), INTERVAL 6 DAY), @c7, @bw, @uid, 0, NOW());

-- Budgets
INSERT INTO budgets (amount_limit, spent_amount, month, year, category_id, user_id, created_at, updated_at) VALUES
(2000000, 545000, MONTH(CURDATE()), YEAR(CURDATE()), @c1, @uid, NOW(), NOW()),
(500000, 35000, MONTH(CURDATE()), YEAR(CURDATE()), @c2, @uid, NOW(), NOW()),
(1000000, 150000, MONTH(CURDATE()), YEAR(CURDATE()), @c3, @uid, NOW(), NOW());

-- Saving Goals
INSERT INTO saving_goals (name, target_amount, current_amount, icon, color, target_date, completed, user_id, created_at, updated_at) VALUES
('Mua iPhone 16', 25000000, 8000000, 'phone-portrait', '#333333', '2026-06-30', false, @uid, NOW(), NOW()),
('Du lịch Đà Lạt', 5000000, 3200000, 'airplane', '#FF9800', '2026-08-15', false, @uid, NOW(), NOW());

-- Debts
INSERT INTO debts (type, person_name, amount, paid_amount, note, due_date, completed, user_id, created_at, updated_at) VALUES
('DEBT', 'Anh Minh', 1000000, 400000, 'Mượn tiền mua laptop', '2026-05-01', false, @uid, NOW(), NOW()),
('LOAN', 'Chị Hương', 500000, 0, 'Cho mượn tiền ăn', '2026-04-15', false, @uid, NOW(), NOW());

-- Recurring
INSERT INTO recurring_transactions (amount, type, note, frequency, start_date, next_execution_date, active, category_id, wallet_id, user_id, created_at) VALUES
(1500000, 'EXPENSE', 'Tiền nhà trọ', 'MONTHLY', '2026-01-05', '2026-04-05', true, @c4, @bw, @uid, NOW()),
(50000, 'EXPENSE', 'Cơm trưa hàng ngày', 'DAILY', '2026-03-01', CURDATE(), true, @c1, @aw, @uid, NOW());

SELECT 'Done seeding taivs93!' AS result;
