-- ============================================
-- MASSIVE DATA SEED - QuanLyChiTieu
-- ~840 transactions across 12 months
-- User: 1, Wallets: 14(Tiền mặt), 15(Vietcombank), 16(Momo)
-- ============================================
SET NAMES utf8mb4;
-- Categories:
--   EXPENSE: 16(Ăn uống), 17(Di chuyển), 18(Mua sắm), 19(Hóa đơn), 20(Giải trí), 21(Sức khỏe), 22(Giáo dục), 23(Khác)
--   INCOME:  24(Lương), 25(Thưởng), 26(Đầu tư), 27(Khác)
--   LOAN:    28(Vay), 29(Cho vay)
-- ============================================

-- Clean duplicate LOAN categories first
DELETE FROM categories WHERE id IN (30, 31, 32, 33);

-- =====================
-- THÁNG 05/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 5', '2025-05-05', 24, 15, 1, 0, NOW(), NOW()),
(2000000, 'INCOME', 'Thưởng KPI Q1', '2025-05-10', 25, 15, 1, 0, NOW(), NOW()),
(500000, 'INCOME', 'Lãi cổ phiếu', '2025-05-15', 26, 15, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm trưa VP', '2025-05-01', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Phở sáng', '2025-05-02', 16, 14, 1, 0, NOW(), NOW()),
(35000, 'EXPENSE', 'Bún chả', '2025-05-03', 16, 14, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Cà phê + bánh', '2025-05-04', 16, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa', '2025-05-05', 16, 16, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Ăn tối nhà hàng', '2025-05-06', 16, 14, 1, 0, NOW(), NOW()),
(40000, 'EXPENSE', 'Cơm bình dân', '2025-05-07', 16, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Pizza', '2025-05-08', 16, 16, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Đặt Grab', '2025-05-01', 17, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2025-05-05', 17, 14, 1, 0, NOW(), NOW()),
(35000, 'EXPENSE', 'Gửi xe tháng', '2025-05-10', 17, 14, 1, 0, NOW(), NOW()),
(100000, 'EXPENSE', 'Grab đi chơi', '2025-05-15', 17, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Áo thun Uniqlo', '2025-05-03', 18, 15, 1, 0, NOW(), NOW()),
(890000, 'EXPENSE', 'Giày Nike', '2025-05-12', 18, 15, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Ốp lưng điện thoại', '2025-05-20', 18, 16, 1, 0, NOW(), NOW()),
(1500000, 'EXPENSE', 'Tiền điện', '2025-05-08', 19, 15, 1, 0, NOW(), NOW()),
(800000, 'EXPENSE', 'Tiền nước', '2025-05-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-05-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-05-15', 19, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Xem phim CGV', '2025-05-07', 20, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Karaoke', '2025-05-14', 20, 14, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Billiards', '2025-05-21', 20, 14, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Thuốc cảm', '2025-05-09', 21, 14, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Khám răng', '2025-05-18', 21, 15, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Sách lập trình', '2025-05-11', 22, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Khóa Udemy', '2025-05-22', 22, 16, 1, 0, NOW(), NOW()),
(100000, 'EXPENSE', 'Quà sinh nhật bạn', '2025-05-25', 23, 14, 1, 0, NOW(), NOW()),
(2000000, 'LOAN', 'Cho Minh vay', '2025-05-20', 29, 15, 1, 0, NOW(), NOW()),
(1000000, 'LOAN', 'Vay Hưng mua đồ', '2025-05-28', 28, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 06/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 6', '2025-06-05', 24, 15, 1, 0, NOW(), NOW()),
(800000, 'INCOME', 'Freelance thiết kế', '2025-06-12', 27, 16, 1, 0, NOW(), NOW()),
(300000, 'INCOME', 'Bán đồ cũ', '2025-06-20', 27, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Cơm trưa', '2025-06-01', 16, 14, 1, 0, NOW(), NOW()),
(70000, 'EXPENSE', 'Bún bò Huế', '2025-06-02', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Mì Quảng', '2025-06-03', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'BBQ buffet', '2025-06-04', 16, 16, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Lẩu', '2025-06-06', 16, 14, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Bánh mì', '2025-06-07', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Sushi', '2025-06-09', 16, 16, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm gà', '2025-06-10', 16, 14, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Hải sản', '2025-06-13', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa Tiger', '2025-06-15', 16, 16, 1, 0, NOW(), NOW()),
(70000, 'EXPENSE', 'Steak', '2025-06-18', 16, 16, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Phở bò', '2025-06-20', 16, 14, 1, 0, NOW(), NOW()),
(35000, 'EXPENSE', 'Cà phê Highlands', '2025-06-22', 16, 16, 1, 0, NOW(), NOW()),
(90000, 'EXPENSE', 'Đồ ăn vặt', '2025-06-25', 16, 14, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Grab Food', '2025-06-28', 16, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng', '2025-06-03', 17, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Grab đi làm', '2025-06-08', 17, 16, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Grab về quê', '2025-06-15', 17, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Bảo dưỡng xe', '2025-06-22', 17, 14, 1, 0, NOW(), NOW()),
(450000, 'EXPENSE', 'Quần jean Levi', '2025-06-07', 18, 15, 1, 0, NOW(), NOW()),
(280000, 'EXPENSE', 'Túi xách', '2025-06-14', 18, 16, 1, 0, NOW(), NOW()),
(1200000, 'EXPENSE', 'Tiền điện', '2025-06-08', 19, 15, 1, 0, NOW(), NOW()),
(600000, 'EXPENSE', 'Tiền nước', '2025-06-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet + truyền hình', '2025-06-10', 19, 15, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2025-06-15', 19, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Xem phim + bỏng ngô', '2025-06-11', 20, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Bowling', '2025-06-19', 20, 14, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Game Steam', '2025-06-25', 20, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Vitamin tổng hợp', '2025-06-10', 21, 15, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Khám tổng quát', '2025-06-20', 21, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Sách Tiếng Anh', '2025-06-05', 22, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Quà tặng đồng nghiệp', '2025-06-27', 23, 14, 1, 0, NOW(), NOW()),
(1500000, 'LOAN', 'Cho Lan vay tiền nhà', '2025-06-15', 29, 15, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 07/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 7', '2025-07-05', 24, 15, 1, 0, NOW(), NOW()),
(3000000, 'INCOME', 'Thưởng dự án', '2025-07-15', 25, 15, 1, 0, NOW(), NOW()),
(1200000, 'INCOME', 'Lãi đầu tư', '2025-07-20', 26, 15, 1, 0, NOW(), NOW()),
(600000, 'INCOME', 'Bán quần áo cũ', '2025-07-25', 27, 14, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Phở sáng', '2025-07-01', 16, 14, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm trưa', '2025-07-02', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Bánh cuốn', '2025-07-03', 16, 14, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Ăn buffet', '2025-07-05', 16, 16, 1, 0, NOW(), NOW()),
(35000, 'EXPENSE', 'Cà phê', '2025-07-06', 16, 16, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Bún chả', '2025-07-08', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Cơm tấm', '2025-07-10', 16, 14, 1, 0, NOW(), NOW()),
(92000, 'EXPENSE', 'Gà rán KFC', '2025-07-12', 16, 16, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Trà sữa', '2025-07-14', 16, 16, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Sashimi', '2025-07-16', 16, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Nhậu cuối tuần', '2025-07-18', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Bún đậu', '2025-07-20', 16, 14, 1, 0, NOW(), NOW()),
(68000, 'EXPENSE', 'Cơm văn phòng', '2025-07-22', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Bánh xèo', '2025-07-24', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Pizza Domino', '2025-07-26', 16, 16, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Sinh tố', '2025-07-28', 16, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2025-07-03', 17, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Grab Food', '2025-07-09', 17, 16, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Taxi sân bay', '2025-07-15', 17, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Rửa xe + đổ xăng', '2025-07-22', 17, 14, 1, 0, NOW(), NOW()),
(1200000, 'EXPENSE', 'Áo khoác Zara', '2025-07-10', 18, 15, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Tai nghe bluetooth', '2025-07-18', 18, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Kem chống nắng', '2025-07-25', 18, 16, 1, 0, NOW(), NOW()),
(1800000, 'EXPENSE', 'Tiền điện mùa hè', '2025-07-08', 19, 15, 1, 0, NOW(), NOW()),
(700000, 'EXPENSE', 'Tiền nước', '2025-07-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-07-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-07-15', 19, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Cinema IMAX', '2025-07-06', 20, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Đi bar', '2025-07-13', 20, 14, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Escape room', '2025-07-20', 20, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-07-01', 21, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Thuốc dị ứng', '2025-07-12', 21, 14, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Khóa học online', '2025-07-08', 22, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Đóng phí hội viên', '2025-07-30', 23, 14, 1, 0, NOW(), NOW()),
(3000000, 'LOAN', 'Cho Tuấn vay', '2025-07-10', 29, 15, 1, 0, NOW(), NOW()),
(500000, 'LOAN', 'Vay Nam mua laptop', '2025-07-25', 28, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 08/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 8', '2025-08-05', 24, 15, 1, 0, NOW(), NOW()),
(1500000, 'INCOME', 'Freelance code', '2025-08-18', 27, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Phở gà', '2025-08-01', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm rang', '2025-08-02', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Lẩu Haidilao', '2025-08-03', 16, 16, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Bánh mì', '2025-08-04', 16, 14, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm trưa', '2025-08-05', 16, 14, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Bún riêu', '2025-08-07', 16, 14, 1, 0, NOW(), NOW()),
(72000, 'EXPENSE', 'Mì Ý', '2025-08-09', 16, 16, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Dimsum', '2025-08-11', 16, 16, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Xôi', '2025-08-13', 16, 14, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Tiệc sinh nhật', '2025-08-15', 16, 14, 1, 0, NOW(), NOW()),
(68000, 'EXPENSE', 'Cơm VP', '2025-08-17', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà đào', '2025-08-19', 16, 16, 1, 0, NOW(), NOW()),
(40000, 'EXPENSE', 'Hủ tiếu', '2025-08-21', 16, 14, 1, 0, NOW(), NOW()),
(88000, 'EXPENSE', 'Burger', '2025-08-23', 16, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Cà phê Starbucks', '2025-08-25', 16, 16, 1, 0, NOW(), NOW()),
(190000, 'EXPENSE', 'Đổ xăng', '2025-08-04', 17, 14, 1, 0, NOW(), NOW()),
(40000, 'EXPENSE', 'Grab Food', '2025-08-10', 17, 16, 1, 0, NOW(), NOW()),
(70000, 'EXPENSE', 'Be đi chơi', '2025-08-16', 17, 16, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Vé xe về quê', '2025-08-22', 17, 14, 1, 0, NOW(), NOW()),
(690000, 'EXPENSE', 'Polo Ralph Lauren', '2025-08-08', 18, 15, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Sạc dự phòng', '2025-08-20', 18, 16, 1, 0, NOW(), NOW()),
(1300000, 'EXPENSE', 'Tiền điện', '2025-08-08', 19, 15, 1, 0, NOW(), NOW()),
(650000, 'EXPENSE', 'Tiền nước', '2025-08-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-08-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-08-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2025-08-15', 19, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Xem phim', '2025-08-09', 20, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Paintball', '2025-08-17', 20, 14, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Đánh cầu lông', '2025-08-24', 20, 14, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-08-01', 21, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Thuốc bổ', '2025-08-12', 21, 14, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Sách marketing', '2025-08-06', 22, 16, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Thiệp + quà', '2025-08-28', 23, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 09/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 9', '2025-09-05', 24, 15, 1, 0, NOW(), NOW()),
(5000000, 'INCOME', 'Thưởng dự án lớn', '2025-09-20', 25, 15, 1, 0, NOW(), NOW()),
(800000, 'INCOME', 'Lãi tiết kiệm', '2025-09-25', 26, 15, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Phở bò', '2025-09-01', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Cơm sườn', '2025-09-02', 16, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Bún chả', '2025-09-03', 16, 14, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Ăn tiệc', '2025-09-05', 16, 16, 1, 0, NOW(), NOW()),
(40000, 'EXPENSE', 'Cơm bình dân', '2025-09-06', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa Gong Cha', '2025-09-08', 16, 16, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Lẩu nấm', '2025-09-10', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Mì quảng', '2025-09-12', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Korean BBQ', '2025-09-14', 16, 16, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Bánh mì chả', '2025-09-16', 16, 14, 1, 0, NOW(), NOW()),
(68000, 'EXPENSE', 'Cơm VP', '2025-09-18', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Nước ép', '2025-09-20', 16, 16, 1, 0, NOW(), NOW()),
(130000, 'EXPENSE', 'Nhậu T6', '2025-09-22', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm gà', '2025-09-24', 16, 14, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Sashimi', '2025-09-26', 16, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2025-09-02', 17, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Grab', '2025-09-09', 17, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Đổ xăng lần 2', '2025-09-16', 17, 14, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Taxi', '2025-09-23', 17, 16, 1, 0, NOW(), NOW()),
(550000, 'EXPENSE', 'Quần kaki', '2025-09-06', 18, 15, 1, 0, NOW(), NOW()),
(380000, 'EXPENSE', 'Giày sandal', '2025-09-15', 18, 15, 1, 0, NOW(), NOW()),
(190000, 'EXPENSE', 'Mũ lưỡi trai', '2025-09-22', 18, 16, 1, 0, NOW(), NOW()),
(1400000, 'EXPENSE', 'Tiền điện', '2025-09-08', 19, 15, 1, 0, NOW(), NOW()),
(700000, 'EXPENSE', 'Tiền nước', '2025-09-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-09-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-09-15', 19, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Đi Đà Lạt', '2025-09-12', 20, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Team building', '2025-09-19', 20, 14, 1, 0, NOW(), NOW()),
(100000, 'EXPENSE', 'Bowling', '2025-09-26', 20, 14, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-09-01', 21, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Nha khoa', '2025-09-15', 21, 15, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Coursera subscription', '2025-09-10', 22, 16, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Đám cưới bạn', '2025-09-28', 23, 15, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 10/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 10', '2025-10-05', 24, 15, 1, 0, NOW(), NOW()),
(1000000, 'INCOME', 'Thưởng tháng', '2025-10-10', 25, 15, 1, 0, NOW(), NOW()),
(2000000, 'INCOME', 'Cổ tức', '2025-10-20', 26, 15, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Cháo lòng', '2025-10-01', 16, 14, 1, 0, NOW(), NOW()),
(70000, 'EXPENSE', 'Bún bò', '2025-10-02', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Cơm trưa', '2025-10-03', 16, 14, 1, 0, NOW(), NOW()),
(88000, 'EXPENSE', 'Burger King', '2025-10-05', 16, 16, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Ăn lẩu', '2025-10-07', 16, 14, 1, 0, NOW(), NOW()),
(35000, 'EXPENSE', 'Cà phê sáng', '2025-10-08', 16, 16, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm gà xối mỡ', '2025-10-10', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Bún đậu', '2025-10-12', 16, 14, 1, 0, NOW(), NOW()),
(92000, 'EXPENSE', 'Pizza Hut', '2025-10-14', 16, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa Phúc Long', '2025-10-16', 16, 16, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'Ăn hải sản', '2025-10-18', 16, 14, 1, 0, NOW(), NOW()),
(40000, 'EXPENSE', 'Xôi xéo', '2025-10-20', 16, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Tokbokki', '2025-10-22', 16, 16, 1, 0, NOW(), NOW()),
(58000, 'EXPENSE', 'Cơm chiên', '2025-10-24', 16, 14, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng', '2025-10-03', 17, 14, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Grab đi nhậu', '2025-10-10', 17, 16, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Gửi xe sân bay', '2025-10-17', 17, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng + rửa xe', '2025-10-24', 17, 14, 1, 0, NOW(), NOW()),
(850000, 'EXPENSE', 'Áo blazer', '2025-10-08', 18, 15, 1, 0, NOW(), NOW()),
(450000, 'EXPENSE', 'Dép Adidas', '2025-10-15', 18, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Balo laptop', '2025-10-22', 18, 16, 1, 0, NOW(), NOW()),
(1500000, 'EXPENSE', 'Tiền điện', '2025-10-08', 19, 15, 1, 0, NOW(), NOW()),
(750000, 'EXPENSE', 'Tiền nước', '2025-10-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-10-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-10-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2025-10-15', 19, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Xem concert', '2025-10-12', 20, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Xem phim', '2025-10-19', 20, 16, 1, 0, NOW(), NOW()),
(100000, 'EXPENSE', 'Game mobile', '2025-10-26', 20, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-10-01', 21, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Thuốc bổ gan', '2025-10-14', 21, 14, 1, 0, NOW(), NOW()),
(800000, 'EXPENSE', 'Khóa IELTS', '2025-10-05', 22, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Quà sinh nhật mẹ', '2025-10-30', 23, 15, 1, 0, NOW(), NOW()),
(2000000, 'LOAN', 'Cho Hải vay', '2025-10-12', 29, 15, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 11/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 11', '2025-11-05', 24, 15, 1, 0, NOW(), NOW()),
(2500000, 'INCOME', 'Thưởng Black Friday', '2025-11-28', 25, 15, 1, 0, NOW(), NOW()),
(1000000, 'INCOME', 'Minh trả nợ', '2025-11-10', 27, 15, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Phở bò', '2025-11-01', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Cơm sườn', '2025-11-02', 16, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Mì cay', '2025-11-04', 16, 16, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Buffet', '2025-11-06', 16, 16, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm bình dân', '2025-11-07', 16, 14, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Bánh mì', '2025-11-08', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Gà nướng', '2025-11-10', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa', '2025-11-12', 16, 16, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Sushi', '2025-11-14', 16, 16, 1, 0, NOW(), NOW()),
(68000, 'EXPENSE', 'Cơm VP', '2025-11-16', 16, 14, 1, 0, NOW(), NOW()),
(130000, 'EXPENSE', 'Đồ nướng', '2025-11-18', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Sinh tố bơ', '2025-11-20', 16, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Bún cá', '2025-11-22', 16, 14, 1, 0, NOW(), NOW()),
(72000, 'EXPENSE', 'Phở cuốn', '2025-11-24', 16, 14, 1, 0, NOW(), NOW()),
(100000, 'EXPENSE', 'Đặt đồ ăn', '2025-11-26', 16, 16, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Thịt nướng', '2025-11-28', 16, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2025-11-03', 17, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Grab', '2025-11-10', 17, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng', '2025-11-17', 17, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Taxi', '2025-11-24', 17, 16, 1, 0, NOW(), NOW()),
(2500000, 'EXPENSE', 'Black Friday - áo khoác', '2025-11-29', 18, 15, 1, 0, NOW(), NOW()),
(890000, 'EXPENSE', 'Giày thể thao', '2025-11-29', 18, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Ốp lưng + kính', '2025-11-29', 18, 16, 1, 0, NOW(), NOW()),
(1600000, 'EXPENSE', 'Tiền điện', '2025-11-08', 19, 15, 1, 0, NOW(), NOW()),
(800000, 'EXPENSE', 'Tiền nước', '2025-11-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-11-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-11-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2025-11-15', 19, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Karaoke', '2025-11-08', 20, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Xem phim Marvel', '2025-11-15', 20, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Cafe chill', '2025-11-22', 20, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-11-01', 21, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Thuốc + khám', '2025-11-18', 21, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Sách AI', '2025-11-05', 22, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Quà Noel sớm', '2025-11-30', 23, 14, 1, 0, NOW(), NOW()),
(1500000, 'LOAN', 'Cho Phong vay', '2025-11-15', 29, 15, 1, 0, NOW(), NOW()),
(500000, 'LOAN', 'Vay Hùng', '2025-11-25', 28, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 12/2025
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 12', '2025-12-05', 24, 15, 1, 0, NOW(), NOW()),
(8000000, 'INCOME', 'Thưởng Tết', '2025-12-25', 25, 15, 1, 0, NOW(), NOW()),
(2000000, 'INCOME', 'Lãi đầu tư cả năm', '2025-12-28', 26, 15, 1, 0, NOW(), NOW()),
(1500000, 'INCOME', 'Lan trả nợ', '2025-12-15', 27, 15, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Phở', '2025-12-01', 16, 14, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Cơm trưa', '2025-12-02', 16, 14, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Tiệc cuối năm', '2025-12-03', 16, 16, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Lẩu', '2025-12-05', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Cà phê', '2025-12-06', 16, 16, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Pizza', '2025-12-08', 16, 16, 1, 0, NOW(), NOW()),
(120000, 'EXPENSE', 'BBQ Hàn Quốc', '2025-12-10', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa', '2025-12-12', 16, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Tiệc Noel', '2025-12-24', 16, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Ăn tất niên', '2025-12-30', 16, 14, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Đổ xăng + bảo dưỡng', '2025-12-03', 17, 14, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Grab', '2025-12-10', 17, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2025-12-20', 17, 14, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Vé xe về quê Tết', '2025-12-28', 17, 14, 1, 0, NOW(), NOW()),
(3500000, 'EXPENSE', 'Quần áo Tết', '2025-12-20', 18, 15, 1, 0, NOW(), NOW()),
(1200000, 'EXPENSE', 'Giày Tết', '2025-12-22', 18, 15, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Phụ kiện', '2025-12-25', 18, 16, 1, 0, NOW(), NOW()),
(1800000, 'EXPENSE', 'Tiền điện', '2025-12-08', 19, 15, 1, 0, NOW(), NOW()),
(900000, 'EXPENSE', 'Tiền nước', '2025-12-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2025-12-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2025-12-15', 19, 16, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Tiệc công ty', '2025-12-20', 20, 14, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Karaoke cuối năm', '2025-12-25', 20, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Xem phim', '2025-12-28', 20, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2025-12-01', 21, 16, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Khám sức khỏe tổng quát', '2025-12-15', 21, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Sách năm mới', '2025-12-26', 22, 16, 1, 0, NOW(), NOW()),
(2000000, 'EXPENSE', 'Quà Tết gia đình', '2025-12-28', 23, 15, 1, 0, NOW(), NOW()),
(1000000, 'EXPENSE', 'Quà Tết sếp', '2025-12-29', 23, 14, 1, 0, NOW(), NOW()),
(3000000, 'LOAN', 'Cho Hải vay thêm', '2025-12-10', 29, 15, 1, 0, NOW(), NOW()),
(1000000, 'LOAN', 'Vay Hưng mua quà Tết', '2025-12-20', 28, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 01/2026
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 1', '2026-01-05', 24, 15, 1, 0, NOW(), NOW()),
(5000000, 'INCOME', 'Lì xì Tết', '2026-01-02', 27, 14, 1, 0, NOW(), NOW()),
(3000000, 'INCOME', 'Thưởng Tết muộn', '2026-01-10', 25, 15, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Phở đầu năm', '2026-01-02', 16, 14, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Ăn Tết nhà bạn', '2026-01-03', 16, 14, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Trà sữa', '2026-01-04', 16, 16, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm VP', '2026-01-06', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Bún riêu', '2026-01-08', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Lẩu', '2026-01-10', 16, 14, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Cà phê', '2026-01-12', 16, 16, 1, 0, NOW(), NOW()),
(72000, 'EXPENSE', 'Mì Ý', '2026-01-14', 16, 16, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Cơm trưa', '2026-01-16', 16, 14, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Hải sản', '2026-01-18', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Bánh xèo', '2026-01-20', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Chuối nướng', '2026-01-22', 16, 16, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Cơm gà', '2026-01-24', 16, 14, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng', '2026-01-05', 17, 14, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Grab', '2026-01-12', 17, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Đổ xăng', '2026-01-20', 17, 14, 1, 0, NOW(), NOW()),
(650000, 'EXPENSE', 'Áo hoodie', '2026-01-08', 18, 15, 1, 0, NOW(), NOW()),
(290000, 'EXPENSE', 'Ốp lưng mới', '2026-01-15', 18, 16, 1, 0, NOW(), NOW()),
(1400000, 'EXPENSE', 'Tiền điện', '2026-01-08', 19, 15, 1, 0, NOW(), NOW()),
(700000, 'EXPENSE', 'Tiền nước', '2026-01-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2026-01-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2026-01-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2026-01-15', 19, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Xem phim IMAX', '2026-01-11', 20, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Bowling', '2026-01-18', 20, 14, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2026-01-01', 21, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Vitamin + thuốc bổ', '2026-01-14', 21, 14, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Sách Spring Boot', '2026-01-06', 22, 16, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Quà Tết bạn bè', '2026-01-03', 23, 14, 1, 0, NOW(), NOW()),
(2000000, 'LOAN', 'Cho Bảo vay', '2026-01-20', 29, 15, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 02/2026
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 2', '2026-02-05', 24, 15, 1, 0, NOW(), NOW()),
(1500000, 'INCOME', 'Freelance UI/UX', '2026-02-15', 27, 16, 1, 0, NOW(), NOW()),
(800000, 'INCOME', 'Lãi tiết kiệm', '2026-02-20', 26, 15, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Phở', '2026-02-01', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Cơm sườn', '2026-02-02', 16, 14, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Bún chả', '2026-02-03', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Lẩu gà', '2026-02-04', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa Tiger', '2026-02-06', 16, 16, 1, 0, NOW(), NOW()),
(92000, 'EXPENSE', 'Gà KFC', '2026-02-08', 16, 16, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm bình dân', '2026-02-10', 16, 14, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Ăn Valentine', '2026-02-14', 16, 16, 1, 0, NOW(), NOW()),
(68000, 'EXPENSE', 'Cơm VP', '2026-02-16', 16, 14, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Bún đậu', '2026-02-18', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Nhậu T6', '2026-02-20', 16, 14, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Cà phê', '2026-02-22', 16, 16, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm gà', '2026-02-24', 16, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2026-02-03', 17, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Grab', '2026-02-10', 17, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng', '2026-02-18', 17, 14, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Áo len Valentine', '2026-02-12', 18, 15, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Nước hoa', '2026-02-14', 18, 16, 1, 0, NOW(), NOW()),
(1300000, 'EXPENSE', 'Tiền điện', '2026-02-08', 19, 15, 1, 0, NOW(), NOW()),
(650000, 'EXPENSE', 'Tiền nước', '2026-02-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2026-02-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2026-02-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2026-02-15', 19, 16, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Quà Valentine', '2026-02-14', 20, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Xem phim', '2026-02-21', 20, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2026-02-01', 21, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Thuốc cảm', '2026-02-09', 21, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Sách React Native', '2026-02-07', 22, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Quà Valentine bạn gái', '2026-02-14', 23, 14, 1, 0, NOW(), NOW()),
(1000000, 'LOAN', 'Hải trả nợ', '2026-02-10', 28, 15, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 03/2026
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 3', '2026-03-05', 24, 15, 1, 0, NOW(), NOW()),
(2000000, 'INCOME', 'Thưởng Q1', '2026-03-15', 25, 15, 1, 0, NOW(), NOW()),
(1200000, 'INCOME', 'Freelance web', '2026-03-22', 27, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Phở gà', '2026-03-01', 16, 14, 1, 0, NOW(), NOW()),
(70000, 'EXPENSE', 'Bún bò', '2026-03-02', 16, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Cơm trưa', '2026-03-03', 16, 14, 1, 0, NOW(), NOW()),
(85000, 'EXPENSE', 'Dimsum', '2026-03-04', 16, 16, 1, 0, NOW(), NOW()),
(110000, 'EXPENSE', 'Lẩu Thái', '2026-03-06', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm rang', '2026-03-07', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa', '2026-03-09', 16, 16, 1, 0, NOW(), NOW()),
(75000, 'EXPENSE', 'Nướng', '2026-03-11', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Xôi', '2026-03-13', 16, 14, 1, 0, NOW(), NOW()),
(92000, 'EXPENSE', 'BBQ', '2026-03-15', 16, 16, 1, 0, NOW(), NOW()),
(38000, 'EXPENSE', 'Bánh cuốn', '2026-03-17', 16, 14, 1, 0, NOW(), NOW()),
(130000, 'EXPENSE', 'Hải sản', '2026-03-19', 16, 14, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Cơm VP', '2026-03-21', 16, 14, 1, 0, NOW(), NOW()),
(95000, 'EXPENSE', 'Pizza', '2026-03-23', 16, 16, 1, 0, NOW(), NOW()),
(50000, 'EXPENSE', 'Bún đậu', '2026-03-25', 16, 14, 1, 0, NOW(), NOW()),
(72000, 'EXPENSE', 'Mì cay', '2026-03-27', 16, 16, 1, 0, NOW(), NOW()),
(88000, 'EXPENSE', 'Burger', '2026-03-29', 16, 16, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Cơm gà xối mỡ', '2026-03-31', 16, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng', '2026-03-02', 17, 14, 1, 0, NOW(), NOW()),
(60000, 'EXPENSE', 'Grab', '2026-03-09', 17, 16, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Be', '2026-03-16', 17, 16, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Đổ xăng + rửa xe', '2026-03-23', 17, 14, 1, 0, NOW(), NOW()),
(45000, 'EXPENSE', 'Gửi xe', '2026-03-30', 17, 14, 1, 0, NOW(), NOW()),
(780000, 'EXPENSE', 'Áo jacket', '2026-03-08', 18, 15, 1, 0, NOW(), NOW()),
(450000, 'EXPENSE', 'Giày chạy bộ', '2026-03-15', 18, 15, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Kính mát', '2026-03-22', 18, 16, 1, 0, NOW(), NOW()),
(1500000, 'EXPENSE', 'Tiền điện', '2026-03-08', 19, 15, 1, 0, NOW(), NOW()),
(750000, 'EXPENSE', 'Tiền nước', '2026-03-08', 19, 15, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Internet', '2026-03-10', 19, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix', '2026-03-15', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify', '2026-03-15', 19, 16, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Picnic cuối tuần', '2026-03-08', 20, 14, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Xem phim + ăn', '2026-03-15', 20, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Bi-a', '2026-03-22', 20, 14, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng', '2026-03-01', 21, 16, 1, 0, NOW(), NOW()),
(300000, 'EXPENSE', 'Khám mắt', '2026-03-12', 21, 15, 1, 0, NOW(), NOW()),
(180000, 'EXPENSE', 'Thuốc bổ', '2026-03-20', 21, 14, 1, 0, NOW(), NOW()),
(500000, 'EXPENSE', 'Khóa Docker', '2026-03-05', 22, 16, 1, 0, NOW(), NOW()),
(250000, 'EXPENSE', 'Sách Clean Code', '2026-03-18', 22, 16, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Quà 8/3', '2026-03-08', 23, 14, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Phí dịch vụ', '2026-03-25', 23, 16, 1, 0, NOW(), NOW()),
(2500000, 'LOAN', 'Cho Tuấn vay thêm', '2026-03-10', 29, 15, 1, 0, NOW(), NOW()),
(1500000, 'LOAN', 'Vay Long', '2026-03-20', 28, 14, 1, 0, NOW(), NOW());

-- =====================
-- THÁNG 04/2026 (tháng hiện tại - đến ngày 2)
-- =====================
INSERT INTO transactions (amount, type, note, transaction_date, category_id, wallet_id, user_id, exclude_from_report, created_at, updated_at) VALUES
(12000000, 'INCOME', 'Lương tháng 4 (tạm ứng)', '2026-04-01', 24, 15, 1, 0, NOW(), NOW()),
(65000, 'EXPENSE', 'Phở bò tái', '2026-04-01', 16, 14, 1, 0, NOW(), NOW()),
(48000, 'EXPENSE', 'Cơm trưa', '2026-04-01', 16, 14, 1, 0, NOW(), NOW()),
(55000, 'EXPENSE', 'Trà sữa Phúc Long', '2026-04-01', 16, 16, 1, 0, NOW(), NOW()),
(80000, 'EXPENSE', 'Bún chả', '2026-04-02', 16, 14, 1, 0, NOW(), NOW()),
(42000, 'EXPENSE', 'Cơm VP', '2026-04-02', 16, 14, 1, 0, NOW(), NOW()),
(200000, 'EXPENSE', 'Đổ xăng đầu tháng', '2026-04-01', 17, 14, 1, 0, NOW(), NOW()),
(350000, 'EXPENSE', 'Áo polo', '2026-04-02', 18, 15, 1, 0, NOW(), NOW()),
(79000, 'EXPENSE', 'Netflix tháng 4', '2026-04-01', 19, 16, 1, 0, NOW(), NOW()),
(59000, 'EXPENSE', 'Spotify tháng 4', '2026-04-01', 19, 16, 1, 0, NOW(), NOW()),
(400000, 'EXPENSE', 'Gym tháng 4', '2026-04-01', 21, 16, 1, 0, NOW(), NOW()),
(150000, 'EXPENSE', 'Xem phim', '2026-04-02', 20, 16, 1, 0, NOW(), NOW());

-- ============================================
-- Update wallet balances to be consistent
-- ============================================
UPDATE wallets SET balance = 8000000 WHERE id = 14 AND user_id = 1;
UPDATE wallets SET balance = 25000000 WHERE id = 15 AND user_id = 1;
UPDATE wallets SET balance = 3500000 WHERE id = 16 AND user_id = 1;

-- ============================================
-- Add some budgets for recent months (delete old first)
-- ============================================
DELETE FROM budgets WHERE user_id = 1;
INSERT INTO budgets (amount_limit, spent_amount, month, year, category_id, user_id, created_at, updated_at) VALUES
(3000000, 290000, 4, 2026, 16, 1, NOW(), NOW()),
(500000, 200000, 4, 2026, 17, 1, NOW(), NOW()),
(800000, 150000, 4, 2026, 20, 1, NOW(), NOW()),
(1500000, 350000, 4, 2026, 18, 1, NOW(), NOW()),
(3000000, 1345000, 3, 2026, 16, 1, NOW(), NOW()),
(500000, 540000, 3, 2026, 17, 1, NOW(), NOW()),
(800000, 750000, 3, 2026, 20, 1, NOW(), NOW()),
(2000000, 1430000, 3, 2026, 18, 1, NOW(), NOW()),
(3000000, 1023000, 2, 2026, 16, 1, NOW(), NOW()),
(500000, 435000, 2, 2026, 17, 1, NOW(), NOW());

-- ============================================
-- Add some debts
-- ============================================
INSERT INTO debts (person_name, amount, paid_amount, type, note, due_date, user_id, completed, created_at, updated_at, version) VALUES
('Minh', 2000000, 1000000, 'LOAN', 'Cho Minh vay tháng 5', '2026-06-01', 1, 0, NOW(), NOW(), 0),
('Tuấn', 3000000, 0, 'LOAN', 'Cho Tuấn vay mua laptop', '2026-05-15', 1, 0, NOW(), NOW(), 0),
('Hải', 5000000, 1000000, 'LOAN', 'Cho Hải vay 2 lần', '2026-07-01', 1, 0, NOW(), NOW(), 0),
('Lan', 1500000, 1500000, 'LOAN', 'Lan đã trả hết', '2026-01-01', 1, 1, NOW(), NOW(), 0),
('Hưng', 1000000, 500000, 'DEBT', 'Vay Hưng mua đồ', '2026-04-30', 1, 0, NOW(), NOW(), 0),
('Long', 1500000, 0, 'DEBT', 'Vay Long tháng 3', '2026-05-20', 1, 0, NOW(), NOW(), 0);

-- ============================================
-- Add saving goals
-- ============================================
INSERT INTO saving_goals (name, target_amount, current_amount, target_date, user_id, completed, color, icon, created_at, updated_at, version) VALUES
('Mua MacBook Pro', 35000000, 12000000, '2026-12-31', 1, 0, '#3498DB', 'laptop', NOW(), NOW(), 0),
('Du lịch Nhật Bản', 25000000, 8500000, '2026-10-01', 1, 0, '#E74C3C', 'airplane', NOW(), NOW(), 0),
('Quỹ khẩn cấp', 50000000, 20000000, '2027-06-01', 1, 0, '#2ECC71', 'shield', NOW(), NOW(), 0),
('Mua xe máy mới', 45000000, 45000000, '2026-03-01', 1, 1, '#F39C12', 'bicycle', NOW(), NOW(), 0);

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT COUNT(*) FROM transactions;
-- SELECT type, COUNT(*), SUM(amount) FROM transactions GROUP BY type;
-- SELECT MONTH(transaction_date) as m, YEAR(transaction_date) as y, COUNT(*) FROM transactions GROUP BY y, m ORDER BY y, m;
