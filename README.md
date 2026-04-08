# 💰 Quản Lý Chi Tiêu - Money Lover Clone

> Ứng dụng quản lý chi tiêu cá nhân - Đồ án sinh viên

## 📋 Mô tả

Ứng dụng giúp người dùng theo dõi thu chi, quản lý ví tiền, đặt ngân sách, theo dõi nợ/cho vay và mục tiêu tiết kiệm. Được xây dựng tham khảo theo ứng dụng **Money Lover**.

## 🏗️ Kiến trúc

```
┌─────────────────┐     ┌─────────────────────────────────────────┐
│  React Native   │────▶│  Spring Boot REST API                   │
│  (Expo)         │◀────│                                         │
│  Mobile App     │     │  ┌─────────┐  ┌────────┐  ┌─────────┐  │
└─────────────────┘     │  │Controller│─▶│Service │─▶│Repository│  │
                        │  └─────────┘  └────────┘  └─────────┘  │
                        │       │            │            │        │
                        │  ┌────▼──┐   ┌────▼───┐  ┌────▼────┐   │
                        │  │Swagger│   │ AOP    │  │  MySQL   │   │
                        │  │  UI   │   │Logging │  │    8     │   │
                        │  └───────┘   └────────┘  └─────────┘   │
                        │                    │                     │
                        │              ┌─────▼────┐               │
                        │              │  Redis 7  │               │
                        │              │  Cache    │               │
                        │              └──────────┘               │
                        └─────────────────────────────────────────┘
```

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Java | 17 | Ngôn ngữ chính |
| Spring Boot | 3.2.5 | Framework |
| Spring Security + JWT | jjwt 0.12.5 | Xác thực / Phân quyền |
| Spring Data JPA | - | ORM, truy vấn database |
| Spring Data Redis | - | Caching để tăng tốc API |
| MySQL | 8.0 | Database chính |
| Redis | 7 | Cache layer |
| Docker | - | Container hóa |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| React Native | Framework mobile |
| Expo | Build tool |
| React Navigation | Điều hướng màn hình |
| Axios | HTTP client |
| AsyncStorage | Lưu token local |

## ✨ Tính năng

### Chức năng chính
- **Quản lý ví tiền**: Tạo, sửa, xóa ví (tiền mặt, ngân hàng, ví điện tử)
- **Giao dịch thu/chi**: Thêm, sửa, xóa giao dịch với danh mục
- **Chuyển tiền giữa các ví**: Transfer an toàn với kiểm tra số dư
- **Ngân sách hàng tháng**: Đặt giới hạn chi tiêu theo danh mục
- **Báo cáo thống kê**: Tổng hợp thu chi theo ngày/tuần/tháng
- **Xuất Excel**: Export báo cáo ra file Excel (@Async)
- **Nợ / Cho vay**: Theo dõi nợ với tiến độ trả
- **Mục tiêu tiết kiệm**: Đặt mục tiêu và theo dõi tiến độ
- **Giao dịch định kỳ**: Tự động tạo giao dịch theo lịch (hàng ngày/tuần/tháng)
- **Danh mục tùy chỉnh**: CRUD danh mục thu chi

### Kỹ thuật nâng cao
| Kỹ thuật | Mô tả |
|---------|-------|
| **JWT + Refresh Token** | Access token 24h, refresh token 7 ngày, tự động refresh |
| **Redis Caching** | Cache transactions (10 phút), reports (1 giờ), categories (24 giờ) |
| **@Async + ThreadPool** | Export Excel chạy bất đồng bộ trên thread pool riêng |
| **@Scheduled + Cron** | Tự động xử lý giao dịch định kỳ mỗi ngày 00:05 |
| **AOP (@Aspect)** | Tự động ghi log tất cả API call + cảnh báo method chậm >500ms |
| **Spring Events** | Observer Pattern - decouple transaction → budget update |
| **Pessimistic Locking** | `SELECT FOR UPDATE` khi update balance tránh race condition |
| **Optimistic Locking** | `@Version` trên entity phòng trường hợp concurrent update |
| **Custom Validator** | `@ValidDateRange` annotation validate startDate < endDate |
| **Swagger/OpenAPI** | Tự động tạo API documentation |
| **Actuator** | Health check, metrics monitoring |
| **Docker** | Multi-stage build, docker-compose cho toàn bộ hệ thống |
| **Soft Delete** | `@SQLDelete` + `@SQLRestriction` — xóa mềm, giữ lịch sử dữ liệu |
| **Rate Limiting** | Fixed Window Counter — chống spam API (100 req/phút/IP) |
| **Audit Log (AOP)** | Tự động ghi lại mọi thao tác CREATE/UPDATE/DELETE |
| **Budget Rollover** | Dư ngân sách tháng trước chuyển sang tháng sau |

## 🚀 Hướng dẫn chạy

### Yêu cầu
- Java 17+
- Node.js 18+
- Docker Desktop

### 1. Chạy Database (MySQL + Redis)
```bash
docker-compose up -d mysql redis
```

### 2. Chạy Backend
```bash
cd backend
mvn spring-boot:run
```
API chạy tại: http://localhost:8080/api

Swagger UI: http://localhost:8080/api/swagger-ui.html

### 3. Seed dữ liệu mẫu (lần đầu)
Trong `application.yml`, đổi:
```yaml
sql:
  init:
    mode: always    # đổi từ 'never' sang 'always'
```
Restart server, sau đó đổi lại `never`.

**Tài khoản demo**: `demo` / `password123`

### 4. Chạy Frontend (Mobile)
```bash
cd frontend
npm install
npx expo start
```
Quét QR code bằng Expo Go app trên điện thoại.

### 5. Chạy toàn bộ bằng Docker
```bash
docker-compose up --build
```

## 🧪 Chạy Unit Test
```bash
cd backend
mvn test
```

## 📁 Cấu trúc project

```
QuanLyChiTieu/
├── backend/
│   └── src/main/java/com/quanlychitieu/
│       ├── config/          # Cấu hình (Security, Redis, Async, Swagger)
│       ├── controller/      # 9 REST Controllers
│       ├── service/         # 10 Business Services
│       ├── repository/      # 8 JPA Repositories
│       ├── model/
│       │   ├── entity/      # 8 JPA Entities
│       │   └── enums/       # 5 Enums
│       ├── dto/
│       │   ├── request/     # 11 Request DTOs
│       │   └── response/    # 10 Response DTOs
│       ├── security/        # JWT Filter, Provider, Utils
│       ├── exception/       # Global Exception Handler
│       ├── aspect/          # AOP Logging + Performance + Audit
│       ├── event/           # Spring Application Events
│       ├── validation/      # Custom Validator
│       └── scheduler/       # Cron Jobs (Recurring, Bill, Debt Reminder)
│
├── frontend/
│   └── src/
│       ├── api/             # Axios client + API modules
│       ├── screens/         # 11 màn hình
│       ├── navigation/      # Bottom Tab + Stack navigation
│       ├── contexts/        # Auth Context (React Context API)
│       ├── constants/       # Theme colors
│       └── utils/           # Helper functions
│
├── docker-compose.yml       # MySQL + Redis + Backend
├── Dockerfile               # Multi-stage build
└── README.md
```

## 📊 Database Schema

| Entity | Mô tả |
|--------|-------|
| User | Người dùng |
| Wallet | Ví tiền (tiền mặt, ngân hàng, e-wallet) |
| Transaction | Giao dịch thu/chi |
| Category | Danh mục (ăn uống, di chuyển, lương...) |
| Budget | Ngân sách tháng theo danh mục |
| Debt | Nợ / Cho vay |
| SavingGoal | Mục tiêu tiết kiệm |
| RecurringTransaction | Giao dịch định kỳ |

## 📝 API Endpoints chính

| Method | Endpoint | Mô tả |
|--------|---------|-------|
| POST | /auth/register | Đăng ký |
| POST | /auth/login | Đăng nhập |
| POST | /auth/refresh | Refresh token |
| GET/POST | /wallets | CRUD ví |
| POST | /wallets/transfer | Chuyển tiền |
| GET/POST | /transactions | CRUD giao dịch |
| GET/POST | /budgets | CRUD ngân sách |
| GET | /reports/monthly | Báo cáo tháng |
| GET | /reports/export | Xuất Excel |
| GET/POST | /debts | CRUD nợ |
| POST | /debts/{id}/payment | Trả nợ |
| GET/POST | /saving-goals | CRUD mục tiêu |
| POST | /saving-goals/{id}/add | Thêm tiền tiết kiệm |
| GET/POST | /recurring | CRUD giao dịch định kỳ |

---

**Sinh viên thực hiện**: [Tên sinh viên]  
**MSSV**: [Mã số sinh viên]  
**Môn học**: [Tên môn học]  
**Giáo viên HD**: [Tên giáo viên]
