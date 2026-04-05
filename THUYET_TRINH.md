# THUYẾT TRÌNH ĐỒ ÁN: ỨNG DỤNG QUẢN LÝ CHI TIÊU

---

## 1. Lý do chọn đề tài "Quản lý chi tiêu"

### Thực trạng
- Theo khảo sát của Ngân hàng Thế giới, **hơn 60% người Việt Nam** không có thói quen ghi chép và theo dõi chi tiêu cá nhân.
- Nhiều người gặp tình trạng "cuối tháng không biết tiền đi đâu", chi tiêu vượt quá thu nhập mà không nhận ra.
- Sinh viên và người đi làm trẻ thường gặp khó khăn trong việc quản lý tài chính cá nhân.

### Tại sao chọn đề tài này?
- **Tính thiết thực**: Quản lý chi tiêu là nhu cầu hàng ngày của mọi người, ứng dụng có thể sử dụng ngay trong thực tế.
- **Tham khảo thị trường**: Các ứng dụng như **Money Lover**, Misa, Sổ thu chi đã chứng minh nhu cầu thị trường lớn. Money Lover có hơn **10 triệu lượt tải** trên Google Play.
- **Phạm vi phù hợp**: Đề tài đủ phức tạp để áp dụng các kiến thức đã học (CRUD, authentication, báo cáo, biểu đồ) nhưng không quá rộng để hoàn thành trong thời gian đồ án.
- **Giá trị học tập**: Bao gồm đầy đủ các thành phần của một hệ thống phần mềm hoàn chỉnh — backend API, frontend mobile, database, authentication, caching.

---

## 2. Sử dụng ngôn ngữ và công nghệ gì?

### Backend
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **Java** | 17 | Ngôn ngữ lập trình chính |
| **Spring Boot** | 3.2.5 | Framework backend, xây dựng REST API |
| **Spring Security + JWT** | — | Xác thực và phân quyền người dùng |
| **Hibernate / JPA** | 6.4.4 | ORM, tương tác cơ sở dữ liệu |
| **MySQL** | 8.0 | Cơ sở dữ liệu quan hệ |
| **Redis** | 7.0 | Cache dữ liệu, tăng hiệu suất |
| **Docker** | — | Container hóa, triển khai dễ dàng |

### Frontend (Mobile)
| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| **JavaScript** | ES2022 | Ngôn ngữ lập trình |
| **React Native** | 0.83.4 | Framework xây dựng ứng dụng di động |
| **Expo** | SDK 55 | Bộ công cụ phát triển React Native |
| **React Navigation** | 7.x | Điều hướng màn hình |
| **Axios** | 1.14 | Gọi API từ frontend |
| **AsyncStorage** | — | Lưu trữ cục bộ trên thiết bị |

### Tại sao chọn các công nghệ này?
- **Java + Spring Boot**: Là framework phổ biến nhất cho backend enterprise, có hệ sinh thái lớn, tài liệu phong phú, dễ bảo trì và mở rộng.
- **React Native + Expo**: Viết một lần, chạy trên cả **Android và iOS**, tiết kiệm thời gian phát triển so với viết native riêng cho từng nền tảng.
- **MySQL**: Hệ quản trị CSDL quan hệ phổ biến, miễn phí, phù hợp với dữ liệu có cấu trúc như giao dịch tài chính.
- **Redis**: Giảm tải database, tăng tốc truy vấn báo cáo được gọi thường xuyên.

---

## 3. Tại sao chọn App mà không phải Web?

### So sánh App vs Web cho bài toán quản lý chi tiêu

| Tiêu chí | Mobile App | Web App |
|---|---|---|
| **Ghi chép nhanh** | ✅ Mở app → ghi ngay trong 5 giây | ❌ Mở trình duyệt → vào URL → đăng nhập |
| **Tính tiện lợi** | ✅ Luôn trong túi, dùng mọi lúc mọi nơi | ❌ Cần ngồi trước máy tính |
| **Thói quen người dùng** | ✅ Người dùng quen thao tác trên điện thoại | ❌ Ít ai mở laptop chỉ để ghi 1 khoản chi |
| **Thông báo** | ✅ Push notification nhắc nhở | ❌ Không có hoặc hạn chế |
| **Trải nghiệm UI/UX** | ✅ Animation mượt, gesture tự nhiên | ⚠️ Khó đạt được trải nghiệm tương đương |
| **Offline** | ✅ Có thể lưu local, đồng bộ sau | ❌ Phụ thuộc internet |

### Lý do chính chọn Mobile App

1. **Đặc thù bài toán**: Quản lý chi tiêu yêu cầu ghi chép **ngay tại thời điểm phát sinh** (vừa mua cà phê xong → ghi ngay). Điện thoại luôn có sẵn trong tay, còn web thì không.

2. **Xu hướng thị trường**: Tất cả các ứng dụng quản lý chi tiêu thành công (Money Lover, Misa, Wallet) đều là **mobile-first**. Không có ứng dụng web-only nào thành công trong lĩnh vực này.

3. **Tần suất sử dụng cao**: Người dùng có thể ghi 5-10 giao dịch/ngày. Việc mở app trên điện thoại nhanh hơn nhiều so với mở trình duyệt web.

4. **Cross-platform với React Native**: Nhờ sử dụng React Native, ứng dụng chạy được trên cả Android và iOS với **cùng một codebase**, giảm chi phí phát triển mà vẫn đảm bảo trải nghiệm native.

5. **Phù hợp đối tượng**: Đối tượng sử dụng chính (sinh viên, người đi làm trẻ) dùng điện thoại là chủ yếu.

> 💡 **Lưu ý**: Backend được thiết kế theo kiến trúc **REST API**, nên hoàn toàn có thể phát triển thêm giao diện Web trong tương lai mà không cần thay đổi backend.

---

## Tổng kết

| | |
|---|---|
| **Đề tài** | Ứng dụng Quản lý Chi tiêu Cá nhân |
| **Backend** | Java 17 + Spring Boot 3.2.5 + MySQL 8 + Redis 7 |
| **Frontend** | React Native 0.83.4 + Expo SDK 55 |
| **Nền tảng** | Mobile App (Android & iOS) |
| **Tham khảo** | Money Lover |
| **Kiến trúc** | REST API (client–server), JWT Authentication |
