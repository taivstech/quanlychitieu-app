# 💰 Quản Lý Chi Tiêu — Money Lover Clone

> Ứng dụng quản lý chi tiêu cá nhân full-stack — Đồ án sinh viên

---

## 📋 Mô tả

Ứng dụng giúp người dùng **theo dõi thu chi, quản lý ví tiền, đặt ngân sách, theo dõi nợ/cho vay và mục tiêu tiết kiệm**. Được xây dựng tham khảo theo ứng dụng **Money Lover** (10M+ lượt tải trên Google Play).

### Tại sao chọn đề tài này?

- **Tính thiết thực**: Quản lý chi tiêu là nhu cầu hàng ngày, ứng dụng có thể sử dụng ngay trong thực tế
- **Tham khảo thị trường**: Money Lover, Misa, Sổ thu chi đã chứng minh nhu cầu thị trường lớn
- **Phạm vi phù hợp**: Đủ phức tạp để áp dụng kiến thức nâng cao (concurrency, caching, event-driven) nhưng không quá rộng
- **Giá trị học tập**: Bao gồm đầy đủ các thành phần của hệ thống phần mềm hoàn chỉnh — backend API, frontend mobile, database, authentication, caching

### Tại sao chọn Mobile App?

| Tiêu chí | Mobile App ✅ | Web App ❌ |
|----------|-------------|----------|
| **Ghi chép nhanh** | Mở app → ghi 5 giây | Mở browser → URL → login |
| **Tính tiện lợi** | Luôn trong túi, dùng mọi lúc | Cần ngồi trước máy tính |
| **Push Notification** | ✅ Nhắc bill, nợ, tiết kiệm | ❌ Hạn chế |
| **Thị trường** | Tất cả app finance đều mobile-first | Không có web-only thành công |
| **Đối tượng** | Sinh viên, người đi làm trẻ → dùng điện thoại là chính | — |

> 💡 **Lưu ý**: Backend được thiết kế theo kiến trúc **REST API**, nên hoàn toàn có thể phát triển thêm giao diện Web (React/Next.js) trong tương lai mà **không cần thay đổi backend**.

---

## 🏗️ Kiến trúc hệ thống

```
                          ┌──────────────────────────────────────────────────────┐
                          │              SPRING BOOT 3.2.5 (Java 17)            │
┌─────────────────┐       │                                                      │
│  📱 React Native │──────▶│  ┌──────────┐   ┌──────────┐   ┌──────────────┐    │
│     (Expo)      │◀──────│  │ Rate     │──▶│ JWT      │──▶│  Controller  │    │
│                 │       │  │ Limiter  │   │ Filter   │   │  (13 files)  │    │
└─────────────────┘       │  └──────────┘   └──────────┘   └──────┬───────┘    │
                          │                                        │             │
                          │  ┌──────────┐   ┌───────────────┐  ┌──▼──────────┐  │
                          │  │ Logging  │──▶│   Service      │──│ Repository  │  │
                          │  │ Aspect   │   │   (16 files)   │  │ (13 files)  │  │
                          │  └──────────┘   └───────┬───────┘  └──────┬──────┘  │
                          │                         │                  │         │
                          │  ┌──────────┐   ┌───────▼───────┐  ┌──────▼──────┐  │
                          │  │ Audit    │   │  Event System │  │  MySQL 8.0  │  │
                          │  │ Aspect   │   │  (Observer)   │  │  (InnoDB)   │  │
                          │  └──────────┘   └───────────────┘  └─────────────┘  │
                          │                                                      │
                          │  ┌──────────┐   ┌───────────────┐  ┌─────────────┐  │
                          │  │ Perf     │   │  3 Schedulers │  │  Redis 7    │  │
                          │  │ Aspect   │   │  (Cron Jobs)  │  │  (Cache)    │  │
                          │  └──────────┘   └───────────────┘  └─────────────┘  │
                          └──────────────────────────────────────────────────────┘
```

### Request Flow (Luồng xử lý 1 request)

```
📱 App  →  🚫 RateLimitFilter (check 100 req/min/IP)
        →  🔐 JwtFilter (validate token)
        →  🎮 Controller
        →  📝 LoggingAspect (log: ▶ [POST] /api/transactions)
        →  ⚙️ Service (business logic)
        →  ⚡ Redis (check cache → hit? return : query DB)
        →  💾 MySQL (SELECT FOR UPDATE nếu cần lock)
        →  📋 AuditAspect (ghi audit log)
        →  📝 LoggingAspect (log: ◀ 150ms SUCCESS)
        →  📱 JSON Response
```

---

## 🛠️ Công nghệ sử dụng

### Backend

| Công nghệ | Phiên bản | Mục đích | Tại sao chọn? |
|-----------|-----------|----------|---------------|
| **Java** | 17 | Ngôn ngữ chính | Type-safe, thread pool native, phổ biến trong CNTT VN |
| **Spring Boot** | 3.2.5 | Framework backend | Enterprise-grade, ecosystem lớn (Security, AOP, Data, Events) |
| **Spring Security** | — | Xác thực / Phân quyền | JWT + BCrypt, stateless session |
| **Spring Data JPA** | Hibernate 6.4 | ORM, truy vấn DB | Standard JPA, auto DDL, rich query methods |
| **Spring Data Redis** | — | Cache layer | Sub-ms latency, TTL linh hoạt |
| **Spring AOP** | — | Cross-cutting concerns | Log, Performance monitoring, Audit trail |
| **Spring Events** | — | Event-driven decoupling | Observer Pattern không cần sửa service gốc |
| **MySQL** | 8.0 | Database chính | ACID cho tài chính, FK constraints, `SELECT FOR UPDATE` |
| **Redis** | 7.0 | Cache tăng tốc | Giảm tải DB, TTL theo tier, distributed cache |
| **Docker** | — | Container hóa | Portable, reproducible environment |
| **Swagger/OpenAPI** | 3.0 | API documentation | Tự động tạo docs từ annotations |
| **Apache POI** | — | Export Excel | Xuất báo cáo file .xlsx |
| **Lombok** | — | Giảm boilerplate | Auto-generate getter/setter/builder |

### Frontend

| Công nghệ | Phiên bản | Mục đích | Tại sao chọn? |
|-----------|-----------|----------|---------------|
| **React Native** | 0.83.4 | Framework mobile | 1 codebase → Android + iOS + Web |
| **Expo** | SDK 55 | Build tool | Zero config, QR test, OTA updates |
| **React Navigation** | 7.x | Điều hướng | Bottom tabs + Native stack |
| **Axios** | 1.14 | HTTP client | Interceptors cho JWT auto-refresh |
| **AsyncStorage** | — | Token storage | Lưu JWT local trên device |
| **Chart Kit** | — | Biểu đồ | Pie chart, Line chart cho reports |
| **Expo Notifications** | — | Push notification | Nhắc bill, nợ, tiết kiệm |

### So sánh với alternatives

| Lựa chọn | Ứng dụng này | Alternative | Lý do chọn |
|----------|-------------|-------------|-----------|
| Backend | **Java + Spring Boot** | Node.js/Express | Type safety, thread pool, AOP, Security built-in |
| Database | **MySQL** | MongoDB | ACID cho tài chính, FK constraints |
| Cache | **Redis** | Caffeine | Distributed, TTL flexible, persistent option |
| Frontend | **React Native** | Flutter | JS ecosystem, Expo tooling, cross-platform |
| Auth | **JWT** | Session/OAuth2 | Stateless, mobile-friendly |

---

## ✨ Chức năng — 13 Modules

### Core Features

| # | Module | Chức năng chi tiết | Kỹ thuật nổi bật |
|---|--------|-------------------|-------------------|
| 1 | **🔐 Authentication** | Register, Login, Refresh Token, Change Password, Push Token | JWT Access (24h) + Refresh (7d), BCrypt |
| 2 | **💰 Wallet** | CRUD ví, Transfer giữa ví, Shared wallet, Invite/Accept members | Pessimistic Lock, Deadlock Prevention, Owner/Editor/Viewer roles |
| 3 | **📝 Transaction** | Create, Delete, Duplicate, Filter by date/category/wallet, Gắn event | LOAN logic, Balance reverse khi xóa, Soft Delete |
| 4 | **🏷️ Category** | CRUD danh mục, Default categories cho user mới | INCOME/EXPENSE types, Auto-init |
| 5 | **📊 Budget** | CRUD ngân sách, Auto-update spent qua Event, Warning vượt limit | **Rollover** dư tháng trước, Observer Pattern |
| 6 | **💳 Debt/Loan** | Create, Pay, Summary (totalDebt/totalLoan/net) | Pessimistic Lock, Auto-complete khi trả đủ |
| 7 | **🎯 Saving Goal** | CRUD, Deposit/Withdraw, Progress tracking | Pessimistic Lock, Auto-mark achieved |
| 8 | **🔄 Recurring** | Create, Deactivate, Cron scheduler | **Catch-up logic** bù giao dịch miss |
| 9 | **🧾 Bill** | CRUD, Mark paid → auto tạo transaction, Next due date | Scheduler nhắc nhở 8AM daily |
| 10 | **✈️ Event (Trip)** | CRUD, Track transactions per event | Total expense/income per event |
| 11 | **📈 Report** | Date range, Monthly, Trend analysis | **6 async parallel queries**, Redis cache 1h |
| 12 | **🏠 Dashboard** | Monthly overview, Comparison, Insights, Trending, Category drill-down | Spending Insights (AI-like analysis) |
| 13 | **🔔 Notification** | In-app + Expo Push, Mark read, Unread count | Bill/Debt/Saving reminders |

### Feature Details

#### 💰 Quản lý Ví (Wallet)
- Tạo nhiều loại ví: tiền mặt, ngân hàng, ví điện tử
- **Chuyển tiền an toàn**: Lock 2 ví theo thứ tự ID (`MIN → MAX`) tránh deadlock
- **Chia sẻ ví**: Mời thành viên với roles (Owner/Editor/Viewer), pending/accepted status
- Kiểm tra số dư trước khi chi tiêu

#### 📊 Ngân sách thông minh (Budget)
- Đặt hạn mức chi tiêu theo danh mục mỗi tháng
- **Auto-update**: Khi tạo giao dịch → publish event → listener async update spent
- **Rollover**: Dư ngân sách tháng trước tự động cộng vào tháng sau
  - VD: Budget tháng 3 = 5tr, chi 3tr → dư 2tr → Tháng 4: effectiveLimit = 5tr + 2tr = **7tr**
- Cảnh báo khi vượt 80%, 100% ngân sách

#### 📈 Báo cáo & Phân tích (Report + Dashboard)
- **6 queries chạy song song**: Tách `ReportQueryService` để Spring AOP proxy hoạt động đúng
- **Trend Analysis**: So sánh chi tiêu tháng hiện tại vs trung bình 3 tháng trước
- **Spending Insights**: Phân tích tự động: saving rate, category spikes, budget alerts
- **Monthly Comparison**: So sánh chi tiêu theo category giữa 2 tháng
- Opening/Ending balance, Daily average expense

#### 🔄 Giao dịch định kỳ (Recurring)
- Tạo giao dịch tự động: hàng ngày/tuần/tháng
- **Catch-up logic**: Nếu server down 3 ngày → tự tạo bù 3 transactions khi restart
- Prefix `[Auto]` cho giao dịch tự tạo
- Auto-deactivate khi qua endDate

---

## 🔧 Kỹ thuật nâng cao — 16 Patterns

### Concurrency Control (3)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 1 | **Pessimistic Locking** | Wallet, Debt, SavingGoal | `SELECT FOR UPDATE` — lock row khi update balance |
| 2 | **Optimistic Locking** | Wallet, Debt, SavingGoal | `@Version` — Hibernate check version trước UPDATE |
| 3 | **Deadlock Prevention** | WalletService.transfer() | Lock theo thứ tự `MIN(id) → MAX(id)` |

**Ví dụ Pessimistic Lock:**
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT w FROM Wallet w WHERE w.id = :id AND w.user.id = :userId")
Optional<Wallet> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);
```

**Ví dụ Deadlock Prevention:**
```java
// Lock 2 wallets theo thứ tự ID nhỏ → lớn
Long firstId = Math.min(fromWalletId, toWalletId);
Long secondId = Math.max(fromWalletId, toWalletId);
walletRepository.findByIdAndUserIdForUpdate(firstId, userId);
walletRepository.findByIdAndUserIdForUpdate(secondId, userId);
```

### Performance (3)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 4 | **Redis Caching** | Transactions (10m), Reports (1h), Categories (24h) | 3-tier TTL, `@CacheEvict` khi mutation |
| 5 | **@Async + Thread Pool** | ReportQueryService, ExportService, EventListener | 6 queries chạy song song, `CallerRunsPolicy` |
| 6 | **Performance Aspect** | Tất cả Service methods | Cảnh báo method > 500ms (slow query detection) |

**Ví dụ Async Parallel:**
```java
CompletableFuture<BigDecimal> totalIncome = reportQueryService.calculateTotalAsync(userId, INCOME, start, end);
CompletableFuture<BigDecimal> totalExpense = reportQueryService.calculateTotalAsync(userId, EXPENSE, start, end);
CompletableFuture<List<CategoryBreakdown>> expenseByCat = reportQueryService.getCategoryBreakdownAsync(...);
// ... 6 queries chạy đồng thời
CompletableFuture.allOf(totalIncome, totalExpense, expenseByCat, ...).join();
```

### Architecture (3)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 7 | **Observer Pattern** | TransactionCreatedEvent → BudgetService | Decouple tạo giao dịch khỏi update budget |
| 8 | **Soft Delete** | Transaction, Wallet, Debt, SavingGoal | `@SQLDelete + @SQLRestriction` — xóa mềm |
| 9 | **Custom Validator** | @ValidDateRange | Annotation tự tạo validate startDate < endDate |

**Ví dụ Observer Pattern:**
```
TransactionService.create() 
  → publish TransactionCreatedEvent 
  → TransactionEventListener (async) 
  → BudgetService.updateSpentAmount()
```

**Ví dụ Soft Delete:**
```java
@SQLDelete(sql = "UPDATE transactions SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Transaction { ... }
// Khi gọi delete() → thực tế chỉ SET deleted_at, không xóa row
```

### AOP — Cross-cutting Concerns (3)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 10 | **Logging Aspect** | Tất cả Controller | Log mọi API: method, URI, duration, success/error |
| 11 | **Performance Aspect** | Tất cả Service | Cảnh báo method > 500ms |
| 12 | **Audit Aspect** | Tất cả Service `create*/update*/delete*` | Auto ghi: user, action, entity, IP |

**Ví dụ AOP Audit:**
```
[AUDIT] CREATE by demo on TransactionService.createTransaction() entityId=15
[AUDIT] UPDATE by demo on BudgetService.updateBudget() entityId=3
[AUDIT] DELETE by demo on WalletService.deleteWallet() entityId=7
```

### Security (2)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 13 | **JWT Refresh Token** | AuthService | Access (24h) + Refresh (7d), stateless |
| 14 | **Rate Limiting** | RateLimitFilter | Fixed Window Counter, 100 req/min/IP |

**Rate Limiting Algorithm:**
```
ConcurrentHashMap<IP, {windowStart, AtomicInteger count}>
- Mỗi request → increment count
- count > 100 → return 429 Too Many Requests
- Window reset mỗi 60 giây
```

### Scheduling (2)

| # | Kỹ thuật | Vị trí | Giải thích |
|---|----------|--------|-----------|
| 15 | **@Scheduled + Cron** | 3 Schedulers | Recurring (00:05), Bill (08:00), Debt (09:00) |
| 16 | **Budget Rollover** | BudgetService | effectiveLimit = amountLimit + dư tháng trước |

**Scheduler Timeline:**
```
00:05 AM  ┃ RecurringTransactionScheduler — tạo giao dịch định kỳ + catch-up
08:00 AM  ┃ BillScheduler — nhắc hóa đơn quá hạn + sắp đến hạn (3 ngày)
09:00 AM  ┃ DebtReminderScheduler — nhắc nợ + mục tiêu tiết kiệm sắp hết hạn (7 ngày)
```

---

## 🛡️ Security — 6 Lớp Bảo Vệ

```
Request → [Layer 1] Rate Limiting (100 req/min/IP)
        → [Layer 2] JWT Authentication (Access + Refresh Token)
        → [Layer 3] Authorization (Owner / Editor / Viewer roles)
        → [Layer 4] Data Validation (@Valid + Custom Validators)
        → [Layer 5] Concurrency Control (Pessimistic + Optimistic Lock)
        → [Layer 6] Audit Trail (AOP ghi lại mọi thay đổi)
```

| Layer | Chống lại | Implementation |
|-------|-----------|----------------|
| Rate Limiting | DDoS, Brute force | `RateLimitFilter` — ConcurrentHashMap + AtomicInteger |
| JWT Auth | Unauthorized access | `JwtAuthenticationFilter` + BCrypt password hashing |
| Authorization | Privilege escalation | Wallet role check (Owner/Editor/Viewer) |
| Validation | Invalid data | `@Valid`, `@DecimalMin`, `@NotNull`, `@ValidDateRange` |
| Locking | Race condition | `SELECT FOR UPDATE` + `@Version` |
| Audit Trail | Untraceable changes | `AuditAspect` — ai sửa gì, khi nào, IP nào |

---

## ⚡ Caching Strategy — Redis 3-Tier

| Tier | Cache Name | TTL | Lý do |
|------|-----------|-----|-------|
| 🟢 Low frequency | `categories` | **24 giờ** | Danh mục ít thay đổi |
| 🟡 Medium frequency | `reports` | **1 giờ** | Báo cáo heavy query, kết quả ổn định |
| 🔴 High frequency | `transactions` | **10 phút** | Giao dịch thay đổi thường xuyên |

- **Cache Eviction**: `@CacheEvict` tự động xóa cache khi create/update/delete
- **Serialization**: `GenericJackson2JsonRedisSerializer` với `JavaTimeModule` cho date/time

---

## 🚀 Hướng dẫn chạy

> [!IMPORTANT]
> **Hướng dẫn chi tiết**: Để setup ứng dụng trên máy tính mới từ đầu (cài Java, Node, MySQL, Redis...), vui lòng xem file [**SETUP_GUIDE.md**](file:///d:/Projects/QuanLyChiTieu/SETUP_GUIDE.md).

### Yêu cầu
- Java 17+
- Node.js 18+
- Docker Desktop

### 1. Chạy Database (Redis)
```bash
docker-compose up -d
```

### 2. Cài MySQL (local hoặc Docker)
Cần MySQL 8.0 chạy trên port 3306. Xem config trong `application.yml`.

### 3. Chạy Backend
```bash
cd backend
mvn spring-boot:run
```
- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- Actuator: http://localhost:8080/api/actuator/health

### 4. Seed dữ liệu mẫu (lần đầu)
Trong `application.yml`, đổi:
```yaml
sql:
  init:
    mode: always    # đổi từ 'never' sang 'always'
```
Restart server, sau đó đổi lại `never`.

**Tài khoản demo**: `demo` / `password123`

### 5. Chạy Frontend (Mobile)
```bash
cd frontend
npm install
npx expo start
```
Quét QR code bằng **Expo Go** app trên điện thoại.

### 6. Chạy toàn bộ bằng Docker
```bash
docker-compose up --build
```

---

## 📁 Cấu trúc project

```
QuanLyChiTieu/
├── backend/
│   └── src/main/java/com/quanlychitieu/
│       ├── config/          # 6 configs (Security, Redis, Async, Swagger, WebConfig, RateLimitFilter)
│       ├── controller/      # 13 REST Controllers
│       ├── service/         # 16 Business Services (incl. ReportQueryService, ExpoPushService)
│       ├── repository/      # 13 JPA Repositories (incl. AuditLogRepository)
│       ├── model/
│       │   ├── entity/      # 13 Entities (incl. AuditLog)
│       │   └── enums/       # 5 Enums (TransactionType, DebtType, WalletType, WalletRole, WalletMemberStatus)
│       ├── dto/
│       │   ├── request/     # 11 Request DTOs
│       │   └── response/    # 10 Response DTOs
│       ├── security/        # 5 files (JwtFilter, JwtProvider, UserDetails, UserDetailsService, SecurityUtils)
│       ├── exception/       # 3 files (GlobalExceptionHandler, BadRequest, ResourceNotFound)
│       ├── aspect/          # 3 AOP Aspects (Logging, Performance, Audit)
│       ├── event/           # 2 files (TransactionCreatedEvent, TransactionEventListener)
│       ├── validation/      # Custom Validator (@ValidDateRange)
│       └── scheduler/       # 3 Cron Jobs (Recurring, Bill, DebtReminder)
│
├── frontend/
│   └── src/
│       ├── api/             # Axios client + 12 API modules + interceptors (JWT auto-refresh)
│       ├── screens/         # 14 screen modules (auth, home, transactions, wallets, budgets,
│       │                    #   debts, savings, bills, events, recurring, reports,
│       │                    #   notifications, categories, more)
│       ├── navigation/      # Bottom Tab + Stack navigation
│       ├── contexts/        # Auth Context (React Context API)
│       ├── constants/       # Theme colors
│       └── utils/           # Helper functions
│
├── docker-compose.yml       # Redis container
├── Dockerfile               # Multi-stage build
├── THUYET_TRINH.md          # Nội dung thuyết trình
└── README.md                # Tài liệu này
```

---

## 📊 Database Schema — 13 Tables

| Entity | Mô tả | Soft Delete | Locking |
|--------|-------|:-----------:|:-------:|
| **User** | Người dùng, BCrypt password, Expo push token | — | — |
| **Wallet** | Ví tiền (cash, bank, e-wallet), balance, currency | ✅ | Pessimistic + Optimistic |
| **Transaction** | Giao dịch thu/chi, amount, date, note, imageUrl | ✅ | — |
| **Category** | Danh mục (ăn uống, lương, di chuyển...), INCOME/EXPENSE | — | — |
| **Budget** | Ngân sách tháng, amountLimit, spentAmount, **rollover** | — | — |
| **Debt** | Nợ/Cho vay, personName, paidAmount, dueDate | ✅ | Pessimistic + Optimistic |
| **SavingGoal** | Mục tiêu tiết kiệm, targetAmount, currentAmount | ✅ | Pessimistic + Optimistic |
| **RecurringTransaction** | Giao dịch định kỳ, frequency, nextExecutionDate | — | — |
| **Bill** | Hóa đơn, dueDate, amount, active | — | — |
| **Event** | Sự kiện/Trip, track giao dịch theo event | — | — |
| **Notification** | Thông báo in-app, title, message, isRead | — | — |
| **WalletMember** | Thành viên ví chia sẻ, role, status | — | — |
| **AuditLog** | Lịch sử thay đổi, action, entityType, oldValue/newValue, IP | — | — |

### Indexes

```sql
-- Transaction: tối ưu query theo user + date, category, wallet
idx_transaction_user_date (user_id, transaction_date)
idx_transaction_category  (category_id)
idx_transaction_wallet    (wallet_id)

-- AuditLog: tối ưu tra cứu audit
idx_audit_user    (user_id)
idx_audit_entity  (entity_type, entity_id)
idx_audit_created (created_at)
```

---

## 📝 API Endpoints — 50+

### Authentication
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| POST | `/auth/register` | Đăng ký tài khoản |
| POST | `/auth/login` | Đăng nhập → JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| PUT | `/auth/push-token` | Cập nhật Expo push token |

### Wallets
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET | `/wallets` | Danh sách ví |
| POST | `/wallets` | Tạo ví mới |
| PUT | `/wallets/{id}` | Sửa ví |
| DELETE | `/wallets/{id}` | Xóa ví (soft delete) |
| POST | `/wallets/transfer` | Chuyển tiền (deadlock-safe) |
| GET | `/wallets/total-balance` | Tổng số dư |
| GET | `/wallets/{id}/members` | Danh sách thành viên |
| POST | `/wallets/{id}/invite` | Mời thành viên |
| POST | `/wallets/invites/{memberId}/respond` | Chấp nhận / từ chối lời mời |
| GET | `/wallets/pending-invites` | Lời mời đang chờ |

### Transactions
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET | `/transactions` | Danh sách (paginated) |
| GET | `/transactions/range` | Lọc theo khoảng ngày |
| GET | `/transactions/category/{id}` | Lọc theo danh mục |
| GET | `/transactions/wallet/{id}` | Lọc theo ví |
| POST | `/transactions` | Tạo giao dịch |
| DELETE | `/transactions/{id}` | Xóa giao dịch (soft delete + reverse balance) |

### Budgets
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET | `/budgets?month=&year=` | Ngân sách theo tháng |
| POST | `/budgets` | Tạo ngân sách (+ rollover option) |
| PUT | `/budgets/{id}` | Sửa ngân sách |
| DELETE | `/budgets/{id}` | Xóa ngân sách |

### Reports & Dashboard
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET | `/reports?startDate=&endDate=` | Báo cáo theo khoảng ngày (6 async queries) |
| GET | `/reports/monthly?month=&year=` | Báo cáo tháng |
| GET | `/reports/trend` | Trend analysis |
| GET | `/dashboard` | Dashboard tổng hợp |
| GET | `/dashboard/comparison` | So sánh 2 tháng |
| GET | `/dashboard/insights` | Spending insights (AI-like) |
| GET | `/dashboard/trending` | Biểu đồ trending |
| GET | `/dashboard/category-report/{id}` | Drill-down 1 category |

### Debts & Saving Goals
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET | `/debts` | Danh sách nợ |
| GET | `/debts/active` | Nợ đang active |
| GET | `/debts/summary` | Tổng hợp nợ/cho vay |
| POST | `/debts` | Tạo nợ |
| POST | `/debts/{id}/pay` | Trả nợ (pessimistic lock) |
| GET | `/saving-goals` | Danh sách mục tiêu |
| POST | `/saving-goals` | Tạo mục tiêu |
| POST | `/saving-goals/{id}/deposit` | Nạp tiền (pessimistic lock) |
| POST | `/saving-goals/{id}/withdraw` | Rút tiền |

### Bills, Events, Recurring, Notifications
| Method | Endpoint | Mô tả |
|--------|---------|-------|
| GET/POST | `/bills` | CRUD hóa đơn |
| POST | `/bills/{id}/mark-paid` | Đánh dấu đã thanh toán → tạo transaction |
| GET/POST | `/events` | CRUD sự kiện/trip |
| GET | `/events/{id}/transactions` | Giao dịch theo sự kiện |
| GET/POST | `/recurring` | CRUD giao dịch định kỳ |
| GET | `/notifications` | Danh sách thông báo |
| PUT | `/notifications/{id}/read` | Đánh dấu đã đọc |
| PUT | `/notifications/read-all` | Đọc tất cả |

---

## 📊 Thống kê dự án

| Metric | Con số |
|--------|--------|
| Entities | **13** |
| Services | **16** |
| Controllers | **13** |
| Repositories | **13** |
| Frontend Screens | **14 modules** |
| API Endpoints | **50+** |
| Kỹ thuật nâng cao | **16 patterns** |
| Schedulers | **3** |
| AOP Aspects | **3** |
| Security Layers | **6** |
| Backend Java files | **~80+** |

---

## 🎓 Giá trị học thuật

Dự án thể hiện kiến thức toàn diện về:

| Lĩnh vực | Áp dụng trong dự án |
|----------|---------------------|
| **OOP** | Entity, DTO, Service pattern, Builder pattern |
| **Design Patterns** | Observer, Builder, Strategy (caching) |
| **Concurrency** | Pessimistic/Optimistic Locking, Deadlock Prevention |
| **Distributed Systems** | Caching (Redis), Async processing, Event-driven |
| **Security** | JWT, BCrypt, Authorization, Rate Limiting, Audit |
| **AOP** | 3 Aspects: Logging, Performance, Audit |
| **Database** | Relational schema, Indexes, Soft Delete, Constraints |
| **DevOps** | Docker, Docker Compose |
| **Mobile Development** | React Native, Cross-platform, Push Notifications |
| **API Design** | RESTful, Pagination, Validation, Error Handling |

---

**Sinh viên thực hiện**: [Tên sinh viên]  
**MSSV**: [Mã số sinh viên]  
**Môn học**: [Tên môn học]  
**Giáo viên HD**: [Tên giáo viên]
