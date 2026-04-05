# Thêm tính năng "Vay nợ" - Hướng dẫn cài đặt

## Đã thay đổi

### 1. Backend - TransactionType Enum
**File:** `backend/src/main/java/com/quanlychitieu/model/enums/TransactionType.java`

- Thêm giá trị `LOAN` vào enum
- Giờ đây transaction có 3 loại: INCOME, EXPENSE, LOAN

### 2. Frontend - TransactionScreen
**File:** `frontend/src/screens/transactions/TransactionScreen.js`

- Thêm tab "Vay nợ" vào form thêm giao dịch
- Xử lý hiển thị LOAN transactions với ký hiệu:
  - `→` cho "Cho vay" (lend)
  - `←` cho "Vay" (borrow)
  - Màu sắc: `#FF6B9D` (hồng)

### 3. Database Migration Script
**File:** `backend/src/main/resources/migration_add_loan_categories.sql`

## Hướng dẫn cài đặt

### Step 1: Build backend with LOAN enum
```bash
cd backend
mvn clean package -DskipTests
```

### Step 2: Chạy Migration SQL
**Kết nối MySQL và chạy:**

```sql
-- Add LOAN categories for demo user (id=1)
INSERT INTO categories (name, type, icon, color, is_default, user_id, created_at, updated_at) 
VALUES 
  ('Vay', 'LOAN', 'money-off', '#FF6B9D', true, 1, NOW(), NOW()),
  ('Cho vay', 'LOAN', 'money', '#00D4FF', true, 1, NOW(), NOW());

-- Verify categories were added
SELECT id, name, type, color FROM categories WHERE type = 'LOAN' ORDER BY user_id, name;
```

**Hoặc chạy file script:**
```bash
mysql -u root -p quanlychitieu < backend/src/main/resources/migration_add_loan_categories.sql
```

### Step 3: Restart services
```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npx expo start --android
```

## Kiểm tra tính năng

1. **Mở app** → Chuyển sang tab "Giao dịch"
2. **Nhấn dấu +** (FAB button hoặc center tab) → Form "Thêm giao dịch"
3. **Ba tab nên có:**
   - Chi tiêu (đỏ)
   - Thu nhập (xanh)
   - Vay nợ (hồng) ← **MỚI**
4. **Nhấn "Vay nợ"**
   - Danh mục sẽ hiển thị: "Vay" + "Cho vay"
   - Chọn danh mục, nhập số tiền
   - Giao dịch sẽ hiển thị với `←` hoặc `→`

## Chi tiết Danh mục Vay nợ

| Danh mục | Ký hiệu | Ý nghĩa |
|---------|---------|---------|
| Vay | ← | Người dùng vay tiền từ ai đó |
| Cho vay | → | Người dùng cho vay tiền cho ai đó |

## Lưu ý

1. **LOAN types** sử dụng category name để phân biệt hướng tiền tệ
2. **Không ảnh hưởng** đến tính năng "Nợ & Vay" (Debt) - đó là module riêng
3. **LOAN transactions** là ghi chép tài chính, khác với **Debts** (quản lý người nợ)

## Troubleshooting

**Q: Tab "Vay nợ" không xuất hiện?**
- A: Kiểm tra backend đã build với LOAN enum chưa
- Restart app (Ctrl+C / Cmd+C → chạy lại)

**Q: Danh mục "Vay" / "Cho vay" không có?**
- A: Chạy SQL migration script
- Verify: `SELECT * FROM categories WHERE type = 'LOAN' AND user_id = 1;`

**Q: Transaction vẫn hiển thị sai ký hiệu?**
- A: Xóa app cache hoặc reinstall: `npx expo prebuild --clean`
