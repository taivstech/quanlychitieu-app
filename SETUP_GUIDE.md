# 🚀 Hướng Dẫn Setup — Chạy Ứng Dụng Trên Laptop Mới

> Hướng dẫn cho bạn bè / giáo viên / người đánh giá để chạy ứng dụng **Quản Lý Chi Tiêu** trên máy tính của họ.

---

## 📋 Tổng quan

Ứng dụng gồm **3 thành phần** cần chạy:

| # | Thành phần | Port | Mô tả |
|---|-----------|------|--------|
| 1 | **MySQL 8.0** | 3306 | Database chính |
| 2 | **Redis 7** | 6379 | Cache (chạy qua Docker) |
| 3 | **Spring Boot Backend** | 8080 | REST API server |
| 4 | **React Native Frontend** | 8081 | Mobile app (Expo Go) |

---

## ✅ Bước 0: Cài đặt phần mềm yêu cầu

### Bắt buộc cài trước

| Phần mềm | Version | Link tải | Kiểm tra |
|-----------|---------|----------|----------|
| **Java JDK** | 17+ | [adoptium.net](https://adoptium.net/) | `java -version` |
| **Maven** | 3.8+ | [maven.apache.org](https://maven.apache.org/download.cgi) | `mvn -version` |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) | `node -v` |
| **MySQL** | 8.0 | [dev.mysql.com](https://dev.mysql.com/downloads/installer/) | `mysql --version` |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) | `docker --version` |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | `git --version` |

> [!IMPORTANT]
> **Java 17** là bắt buộc! Nếu dùng Java 21 cũng OK, nhưng **không dùng Java 8 hay 11** vì Spring Boot 3.x yêu cầu tối thiểu Java 17.

### Cài đặt từng phần mềm trên Windows

#### 1. Java 17 (Adoptium)
```powershell
# Tải từ: https://adoptium.net/
# Chọn: Temurin 17 → Windows → x64 → .msi
# Cài xong kiểm tra:
java -version
# Output: openjdk version "17.x.x"
```

#### 2. Maven
```powershell
# Tải từ: https://maven.apache.org/download.cgi
# Giải nén vào: C:\Program Files\Apache\maven
# Thêm vào PATH: C:\Program Files\Apache\maven\bin
# Kiểm tra:
mvn -version
```
> [!TIP]
> **Cách nhanh** (nếu có Chocolatey): `choco install maven`
> **Hoặc** dùng SDKMAN (Linux/Mac): `sdk install maven`

#### 3. Node.js 18+
```powershell
# Tải từ: https://nodejs.org/
# Chọn LTS version
node -v    # → v18.x.x hoặc v20.x.x
npm -v     # → 9.x.x hoặc 10.x.x
```

#### 4. MySQL 8.0
```powershell
# Tải từ: https://dev.mysql.com/downloads/installer/
# Chọn: MySQL Installer for Windows
# Khi cài:
#   - Root password đặt: taiteasicale  (hoặc password khác, sẽ config sau)
#   - Port: 3306 (default)
#   - Character Set: UTF-8 (utf8mb4)
```

#### 5. Docker Desktop
```powershell
# Tải từ: https://www.docker.com/products/docker-desktop/
# Cài và khởi động Docker Desktop
# Kiểm tra:
docker --version
docker-compose --version
```

---

## ✅ Bước 1: Clone dự án

```powershell
git clone <URL-repo-của-bạn>
cd QuanLyChiTieu
```

---

## ✅ Bước 2: Khởi động Redis (Docker)

```powershell
# Ở thư mục gốc của dự án
docker-compose up -d
```

Kiểm tra Redis đã chạy:
```powershell
docker ps
# Phải thấy container: qlct-redis
```

> [!NOTE]
> Redis password đã được config sẵn là `taiteasicale` trong `docker-compose.yml`

---

## ✅ Bước 3: Tạo Database MySQL

Mở MySQL client (MySQL Workbench, terminal, hoặc DBeaver):

```sql
-- Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS quanlychitieu
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

> [!IMPORTANT]  
> Nếu password MySQL của bạn **KHÔNG phải** `taiteasicale`, cần sửa file config.
> Mở file `backend/src/main/resources/application.yml` và sửa dòng 9:
> ```yaml
> password: ${DB_PASSWORD:your_mysql_password_here}
> ```
> Hoặc dùng biến môi trường khi chạy (xem Bước 4).

---

## ✅ Bước 4: Chạy Backend

### Cách 1: Dùng Maven (khuyến nghị)

```powershell
cd backend
mvn spring-boot:run
```

### Cách 2: Nếu password MySQL khác, truyền biến môi trường

```powershell
cd backend
$env:DB_PASSWORD="your_password_here"
mvn spring-boot:run
```

### Cách 3: Build JAR rồi chạy

```powershell
cd backend
mvn clean package -DskipTests
java -jar target/quan-ly-chi-tieu-1.0.0.jar
```

### Kiểm tra Backend đã chạy thành công

Mở trình duyệt:
- **Health check**: http://localhost:8080/api/actuator/health → phải thấy `{"status":"UP"}`
- **Swagger UI**: http://localhost:8080/api/swagger-ui.html → giao diện API docs

> [!WARNING]
> Nếu gặp lỗi **"Cannot connect to MySQL"**:
> - Kiểm tra MySQL đang chạy: `mysql -u root -p`
> - Kiểm tra port 3306 không bị chiếm: `netstat -an | findstr 3306`
> - Kiểm tra password trong `application.yml`
>
> Nếu gặp lỗi **"Cannot connect to Redis"**:
> - Kiểm tra Docker Desktop đang chạy
> - Chạy lại: `docker-compose up -d`

---

## ✅ Bước 5: Seed dữ liệu mẫu (Lần đầu tiên)

### Cách A: Dùng tính năng auto-seed của Spring Boot

1. Mở file `backend/src/main/resources/application.yml`
2. Sửa dòng 28:
```yaml
sql:
  init:
    mode: always    # ← đổi từ 'never' sang 'always'
```
3. **Restart** backend (`Ctrl+C` rồi `mvn spring-boot:run` lại)
4. Sau khi chạy xong, **đổi lại** `mode: never` để tránh lỗi duplicate khi restart tiếp

### Cách B: Chạy SQL thủ công

Nếu muốn seed riêng cho tài khoản `taivs93`:
```powershell
mysql -u root -p quanlychitieu < seed_taivs93.sql
```

### Tài khoản demo

| Username | Password | Mô tả |
|----------|----------|-------|
| `demo` | `password123` | Tài khoản mặc định (từ data.sql) |

> [!NOTE]
> Hoặc có thể tự đăng ký tài khoản mới qua API hoặc app.

---

## ✅ Bước 6: Chạy Frontend (Mobile App)

### 6a. Cài dependencies

```powershell
cd frontend
npm install
```

### 6b. Chạy Expo

```powershell
npx expo start
```

### 6c. Mở app trên điện thoại

1. Cài app **Expo Go** trên điện thoại (iOS App Store / Google Play)
2. **Đảm bảo điện thoại và laptop cùng mạng WiFi**
3. Quét **QR code** hiện trên terminal bằng:
   - **Android**: Mở Expo Go → quét QR
   - **iPhone**: Mở Camera → quét QR → mở link Expo Go

### 6d. Chạy trên Web (thay thế)

```powershell
npx expo start --web
```
Mở trình duyệt tại: http://localhost:8081

> [!IMPORTANT]
> **Frontend tự động phát hiện IP của backend!**
> File `frontend/src/api/axiosClient.js` sử dụng `Constants.expoConfig.hostUri` để lấy IP laptop chạy Metro bundler, rồi trỏ tới port 8080 của backend.
> 
> → Nếu backend và Expo chạy **cùng laptop**, không cần config gì thêm!

---

## 🔧 Xử lý lỗi thường gặp

### ❌ Lỗi: "Network Error" trên điện thoại

**Nguyên nhân**: Điện thoại không kết nối được tới backend trên laptop.

**Giải pháp**:
1. Kiểm tra **cùng mạng WiFi**
2. Tắt **Windows Firewall** tạm thời:
```powershell
# Mở PowerShell (Admin)
# Cho phép port 8080 qua firewall
netsh advfirewall firewall add rule name="Spring Boot" dir=in action=allow protocol=TCP localport=8080
```
3. Kiểm tra IP laptop:
```powershell
ipconfig
# Tìm dòng: IPv4 Address → ví dụ: 192.168.1.100
```
4. Thử truy cập từ trình duyệt điện thoại: `http://192.168.1.100:8080/api/actuator/health`

### ❌ Lỗi: Maven không tìm thấy (`mvn not recognized`)

```powershell
# Kiểm tra JAVA_HOME
echo $env:JAVA_HOME
# Nếu trống, set:
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot"

# Kiểm tra Maven PATH
$env:PATH += ";C:\Program Files\Apache\maven\bin"
```

### ❌ Lỗi: MySQL charset (tiếng Việt lỗi font)

```sql
ALTER DATABASE quanlychitieu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hoặc thêm vào `my.ini` / `my.cnf`:
```ini
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

### ❌ Lỗi: Port đã bị chiếm

```powershell
# Xem port 8080 ai đang dùng
netstat -ano | findstr :8080
# Kill process đó
taskkill /PID <PID> /F
```

### ❌ Lỗi: Docker Desktop chưa chạy

```
error during connect: This error may indicate that the docker daemon is not running.
```
→ Mở **Docker Desktop** app và đợi nó khởi động xong.

---

## 📊 Tóm tắt — Thứ tự chạy

```
┌──────────────────────────────────────────────┐
│  1. Mở Docker Desktop                       │
│  2. docker-compose up -d         (Redis)     │
│  3. Kiểm tra MySQL đang chạy                │
│  4. cd backend && mvn spring-boot:run        │
│  5. Chờ backend start xong (~30s)            │
│  6. cd frontend && npm install               │
│  7. npx expo start                           │
│  8. Quét QR trên điện thoại                  │
└──────────────────────────────────────────────┘
```

### Checklist nhanh

- [ ] Java 17+ đã cài? → `java -version`
- [ ] Maven đã cài? → `mvn -version`
- [ ] Node.js 18+ đã cài? → `node -v`
- [ ] Docker Desktop đang chạy?
- [ ] MySQL đang chạy trên port 3306?
- [ ] Redis container đang chạy? → `docker ps`
- [ ] Backend health OK? → http://localhost:8080/api/actuator/health
- [ ] Frontend Metro bundler đang chạy?
- [ ] Điện thoại cùng WiFi với laptop?

---

## 🔐 Thông tin mặc định

| Config | Giá trị |
|--------|--------|
| MySQL username | `root` |
| MySQL password | `taiteasicale` |
| MySQL database | `quanlychitieu` |
| MySQL port | `3306` |
| Redis password | `taiteasicale` |
| Redis port | `6379` |
| Backend port | `8080` |
| Backend API base | `http://localhost:8080/api` |
| Swagger UI | `http://localhost:8080/api/swagger-ui.html` |
| Demo account | `demo` / `password123` |
