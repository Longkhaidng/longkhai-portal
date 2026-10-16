# 🏭 LONG KHAI PORTAL - CỔNG THÔNG TIN NỘI BỘ NHÀ MÁY SẢN XUẤT

**LONG KHAI PORTAL** là hệ thống cổng thông tin và điều hành nội bộ tập trung dành riêng cho các doanh nghiệp sản xuất, chế tạo. Hệ thống được thiết kế theo kiến trúc module hóa (Plugin Architecture), cho phép mở rộng không giới hạn các quy trình quản lý ISO, 5S, Kaizen, biểu mẫu mới mà không cần sửa đổi mã nguồn cốt lõi.

---

## 🌟 TÍNH NĂNG NỔI BẬT

1. **Dashboard Điều Hành Sản Xuất**:
   - Thống kê thời gian thực số lượng biểu mẫu phát sinh theo tháng và theo phòng ban.
   - Theo dõi trạng thái đơn nghỉ phép chờ duyệt, xác nhận công chờ xử lý.
   - Cảnh báo thiết bị PCCC quá hạn kiểm tra hoặc cần bảo trì khẩn cấp.
   - Thống kê phiếu ra cổng đang có hiệu lực.

2. **Kiểm Tra Thiết Bị PCCC Định Kỳ**:
   - Giám sát toàn bộ thiết bị: Bình chữa cháy (bột MFZ, khí CO2), họng nước vách tường, tủ PCCC, đèn EXIT, đèn sự cố, chuông báo cháy, trạm bơm.
   - Checklist điện tử theo tiêu chuẩn PCCC Việt Nam.
   - Đính kèm ảnh chụp hiện trường bằng camera thiết bị di động.
   - Tự động tính hạn kiểm tra và cảnh báo theo màu sắc (Đạt / Không đạt / Cần sửa chữa).

3. **Đơn Xin Nghỉ Phép & Phê Duyệt Đa Cấp**:
   - Tự động tính toán số ngày nghỉ giữa ngày bắt đầu và kết thúc.
   - **Luồng phê duyệt thông minh**: Nhân viên → Tổ trưởng (nếu có) → Trưởng bộ phận → Hoàn thành. Tự động chuyển thẳng tới Trưởng bộ phận nếu tổ/phòng không có tổ trưởng.
   - Ký duyệt điện tử, từ chối kèm lý do và xem tiến trình xử lý trực quan.

4. **Phiếu Xác Nhận Công Vào - Ra**:
   - Dành cho các trường hợp: Mất thẻ, Quên thẻ, Thẻ hỏng.
   - **Luồng duyệt đặc biệt**:
     - *Mất thẻ*: Nhân viên → Bảo vệ → Trưởng bộ phận → Kế toán → IT → Hoàn thành.
     - *Quên thẻ / Thẻ hỏng*: Nhân viên → Bảo vệ → Trưởng bộ phận → IT → Hoàn thành.

5. **Phiếu Ra - Vào Cổng & Mã QR Code An Ninh (Gate Pass)**:
   - Khai báo người ra, mục đích và danh mục tài sản/máy móc mang theo ra ngoài.
   - Quản lý duyệt tự động sinh **Mã QR Code**.
   - **Giao diện Bảo vệ cổng (Security Gate)**: Quét mã QR hoặc nhập mã phiếu để bấm nút **"Xác nhận RA CỔNG"** và **"Xác nhận VÀO CỔNG"** (ghi nhận thời gian thực tế).

6. **Thông Báo & Nội Quy Nhà Máy**:
   - Đọc và hiển thị nội dung định dạng Markdown.
   - Phân loại: Thông báo công ty, Nội quy lao động, Chính sách phúc lợi, Tin tức.
   - Ghim các thông báo quan trọng lên đầu trang.

7. **Quản Lý Biểu Mẫu Động (Zero-Code Dynamic Form Builder)**:
   - Admin có thể tạo biểu mẫu mới với các trường: Chữ, Số, Ngày giờ, Chọn thả xuống, Đính kèm tệp, Chữ ký số...
   - Phân quyền biểu mẫu theo từng phòng ban và quy trình duyệt mà không cần viết code.

8. **Báo Cáo & Xuất Dữ Liệu**:
   - Bộ lọc đa chiều theo ngày tháng, phòng ban, loại phiếu.
   - Xuất dữ liệu ra file **Excel (.xlsx)** định dạng chuẩn.
   - In ấn văn bản định dạng chuẩn công ty có Quốc hiệu, Tiêu ngữ và khung chữ ký các bên.

9. **Quản Lý Nhân Viên & Ma Trận Phân Quyền (RBAC)**:
   - **Không tạo đăng nhập mẫu giả tạo**: Tên đăng nhập là **Mã số nhân viên** do công ty cấp.
   - **Tải lên danh sách nhân viên bằng file Excel (.xlsx)** kèm bản xem trước (preview) dữ liệu.
   - Tải file Excel mẫu chuẩn có sẵn hướng dẫn.
   - Phân quyền chi tiết cho từng nhân viên theo từng danh mục chức năng.

10. **Trung Tâm Tiện Ích Mở Rộng (Plugins)**:
    - Sẵn sàng tích hợp: An toàn lao động (EHS), 5S, Ý tưởng Kaizen, Báo cáo sự cố, ISO 9001, ISO 14001, ISO 45001, BRC, HACCP...

11. **Kiến Trúc Cơ Sở Dữ Liệu GitHub (GitHub JSON Data Layer)**:
    - Dữ liệu lưu dưới dạng JSON trực tiếp trên GitHub Repository (`/company-data/...`).
    - Lưu vết nhật ký kiểm toán (Audit Log) theo dõi mọi thao tác tạo, sửa, duyệt.
    - Hỗ trợ bộ nhớ đệm cục bộ (LocalStorage cache) giúp website hoạt động mượt mà ngay cả khi offline hoặc chưa nhập token.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY TẠI MÁY (LOCAL DEVELOPMENT)

### Yêu cầu môi trường
- Node.js version 18 trở lên (đã kiểm tra tương thích tốt với Node v24).
- npm hoặc yarn.

### Các bước khởi chạy
```bash
# Cài đặt dependencies (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:3000`**

---

## 🔑 TÀI KHOẢN QUẢN TRỊ VIÊN KHỞI TẠO (ROOT ADMIN)

Khi khởi động lần đầu, hệ thống cung cấp tài khoản Quản trị viên để đăng nhập và tải file Excel:
- **Tên đăng nhập (Mã NV)**: `ADMIN01`
- **Mật khẩu**: `admin@123`

*(Sau khi đăng nhập, hãy vào mục **Quản lý nhân viên & Phân quyền** để tải file Excel danh sách toàn bộ cán bộ công nhân viên công ty)*

---

## 📦 HƯỚNG DẪN TRIỂN KHAI LÊN GITHUB VÀ VERCEL

Xem tài liệu hướng dẫn chi tiết từng bước tại file:
👉 **[HUONG_DAN_TRIEN_KHAI_GITHUB.md](./HUONG_DAN_TRIEN_KHAI_GITHUB.md)** hoặc vào menu **"Hướng dẫn triển khai GitHub"** ngay trên giao diện website.
