# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG LONG KHAI PORTAL LÊN GITHUB VÀ VERCEL

Tài liệu này hướng dẫn chi tiết từng bước cho Quản trị viên và Bộ phận CNTT để:
1. Đẩy toàn bộ mã nguồn website lên GitHub Repository.
2. Tạo GitHub Personal Access Token (PAT) để hệ thống đọc & ghi dữ liệu JSON.
3. Triển khai (Deploy) website chạy online trên Vercel hoàn toàn miễn phí.
4. Quản lý phòng ban, thêm nhân viên mới và tích hợp các trang website vào menu.

---

## 1. CÀI ĐẶT GIT VÀ ĐẨY MÃ NGUỒN LÊN GITHUB

### Bước 1.1: Cài đặt Git (nếu máy tính chưa có Git)
1. Tải bộ cài Git cho Windows tại: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Cài đặt với các tùy chọn mặc định (Next -> Next -> Finish).
3. Đóng và mở lại cửa sổ PowerShell.

*(Cách thay thế nhanh nếu không muốn cài Git bằng dòng lệnh: Tải phần mềm giao diện đồ họa **GitHub Desktop** tại [https://desktop.github.com](https://desktop.github.com), chọn `Add Existing Repository` và trỏ vào thư mục `D:\CONG VIEC\LONGKHAI_PORTAL`)*

---

### Bước 1.2: Tạo Repository trên GitHub
1. Đăng nhập vào [https://github.com](https://github.com).
2. Nhấp vào dấu **+** ở góc trên cùng bên phải -> chọn **New repository**.
3. Điền thông tin:
   - **Repository name**: `longkhai-portal` (hoặc tên tùy chọn của công ty).
   - **Visibility**: Chọn **Private** (khuyên dùng để bảo mật nội bộ) hoặc **Public**.
   - **Lưu ý quan trọng**: Không tích chọn *"Add a README file"*, *"Add .gitignore"* vì dự án đã có sẵn.
4. Nhấp nút **Create repository**.

---

### Bước 1.3: Chạy lệnh đẩy code từ máy lên GitHub
Mở cửa sổ **PowerShell** tại thư mục `D:\CONG VIEC\LONGKHAI_PORTAL` và chạy lần lượt các lệnh sau:

```bash
# 1. Khởi tạo Git
git init

# 2. Thêm toàn bộ mã nguồn
git add .

# 3. Tạo commit đầu tiên
git commit -m "Khoi tao he thong Long Khai Portal Next.js 15"

# 4. Đặt tên nhánh chính là main
git branch -M main

# 5. Liên kết tới GitHub Repo của bạn (thay thế YOUR_USERNAME bằng tên tài khoản GitHub của bạn)
git remote add origin https://github.com/YOUR_USERNAME/longkhai-portal.git

# 6. Đẩy mã nguồn lên
git push -u origin main
```

---

## 2. TẠO GITHUB PERSONAL ACCESS TOKEN (PAT) ĐỂ LƯU DỮ LIỆU JSON

Hệ thống **LONG KHAI PORTAL** không sử dụng cơ sở dữ liệu riêng mà lưu trữ toàn bộ hồ sơ biểu mẫu dưới dạng file JSON trực tiếp trên GitHub Repository (`/company-data/...`). Vì vậy, bạn cần cấp một Token để website có quyền đọc và ghi dữ liệu:

1. Đăng nhập GitHub, vào đường dẫn: **[https://github.com/settings/tokens](https://github.com/settings/tokens)**
2. Nhấp nút **Generate new token** -> chọn **Generate new token (classic)**.
3. Điền thông tin:
   - **Note**: `Long Khai Portal Storage Token`
   - **Expiration**: Chọn `No expiration` (hoặc thời hạn theo chính sách bảo mật nội bộ).
   - **Select scopes**: Tích chọn quyền:
     - `[x] repo` (Full control of private repositories)
4. Kéo xuống cuối trang và nhấp **Generate token**.
5. **Sao chép mã Token** (dạng `ghp_xxxxxxxxxxxxxxxxxxxx`). *Lưu ý: Bạn chỉ nhìn thấy token này một lần duy nhất, hãy lưu lại cẩn thận.*

---

## 3. TRIỂN KHAI (DEPLOY) LÊN VERCEL MIỄN PHÍ

1. Truy cập [https://vercel.com](https://vercel.com) và chọn **Sign Up** hoặc **Log In** bằng tài khoản **GitHub**.
2. Nhấp nút **Add New...** -> chọn **Project**.
3. Trong danh sách repositories hiện ra, tìm repo `longkhai-portal` và nhấp nút **Import**.
4. Tại mục **Environment Variables** (Biến môi trường), thêm các biến sau:
   - `NEXT_PUBLIC_GITHUB_OWNER`: Tên tài khoản GitHub của bạn (ví dụ: `congtylongkhai`)
   - `NEXT_PUBLIC_GITHUB_REPO`: Tên repository (ví dụ: `longkhai-portal`)
   - `NEXT_PUBLIC_GITHUB_BRANCH`: `main`
   - `NEXT_PUBLIC_GITHUB_TOKEN`: Mã token `ghp_...` vừa tạo ở Bước 2
5. Nhấp nút **Deploy**.
6. Sau khoảng 1-2 phút, Vercel sẽ thông báo thành công và cấp cho bạn đường link website trực tuyến (ví dụ: `https://longkhai-portal.vercel.app`).

---

## 4. KHỞI TẠO TÀI KHOẢN VÀ CẤU HÌNH HỆ THỐNG

Sau khi truy cập vào website:

1. **Đăng nhập với tư cách Quản trị viên khởi tạo:**
   - **Tên đăng nhập (Mã số NV)**: `ADMIN01`
   - **Mật khẩu**: `admin@123`

2. **Quản lý phòng ban nhà máy:**
   - Vào menu **Quản lý phòng ban**.
   - Admin có thể Thêm phòng ban mới, sửa tên/mã/mô tả và chỉ định Trưởng bộ phận phụ trách.

3. **Thêm nhân viên mới & Tải file Excel:**
   - Vào menu **Quản lý nhân viên & Phân quyền**.
   - Bấm nút **"+ Thêm nhân viên mới"** để tạo trực tiếp từng tài khoản nhân viên.
   - Hoặc bấm **"Tải lên danh sách Excel (.xlsx)"** để nạp danh sách toàn thể cán bộ công nhân viên cùng lúc.
   - Bấm nút **"Phân quyền"** tại từng nhân viên để bật/tắt quyền truy cập danh mục.

4. **Tích hợp các trang web đã có sẵn vào menu:**
   - Vào menu **Tích hợp Website**.
   - Bấm **"Thêm website mới vào menu"**: điền tên chức năng, link URL, chọn kiểu hiển thị (Nhúng trực tiếp iframe hoặc mở tab mới).
   - Website sẽ tự động xuất hiện ngay trên thanh menu Sidebar để nhân viên sử dụng!

5. **Sao lưu toàn bộ dữ liệu lên GitHub:**
   - Vào menu **Cài đặt & GitHub Data**.
   - Bấm nút **"Đẩy toàn bộ dữ liệu lên GitHub (Push)"**. Toàn bộ cấu trúc thư mục `/company-data/...` sẽ được tự động tạo và lưu trữ trên GitHub Repository của công ty!

---

## 5. CẤU TRÚC DỮ LIỆU TRÊN GITHUB REPOSITORY

Dữ liệu của toàn bộ nhà máy được quản lý tập trung và an toàn trong thư mục `/company-data`:

```text
/company-data
│
├── leave-request/
│   └── 2026/
│       ├── LR26-000001.json            # Hồ sơ đơn nghỉ phép & chữ ký duyệt đa cấp
│       └── ...
├── attendance/
│   └── 2026/
│       ├── ATT26-000001.json           # Hồ sơ xác nhận công (quên/mất thẻ)
│       └── ...
├── gate-pass/
│   └── 2026/
│       ├── GP26-000001.json            # Phiếu ra cổng, tài sản & mã QR code bảo vệ
│       └── ...
├── announcements/
│   └── announcements.json              # Thông báo công ty, nội quy, chính sách
├── forms/
│   ├── forms.json                      # Cấu trúc các biểu mẫu động không cần sửa code
│   └── submissions/
│       └── 2026/                       # Dữ liệu nhân viên nộp biểu mẫu
└── settings/
    ├── users.json                      # Toàn bộ danh sách tài khoản & ma trận phân quyền
    ├── departments.json                # Danh mục các phòng ban, xưởng sản xuất
    ├── web_integrations.json           # Danh sách các trang web tích hợp vào menu
    ├── plugins.json                    # Cấu hình trạng thái các module mở rộng (5S, ISO...)
    └── audit_logs.json                 # Nhật ký kiểm toán truy vết mọi thao tác
```

---
*Chúc mừng bạn đã triển khai thành công Cổng Thông Tin Nội Bộ LONG KHAI PORTAL!*
