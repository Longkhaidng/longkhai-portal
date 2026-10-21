export type UserRole =
  | 'admin'
  | 'hr'
  | 'ehs'
  | 'security'
  | 'manager'
  | 'employee'
  | 'accountant'
  | 'it'
  | 'team_leader';

export type CategoryPermission =
  | 'dashboard'
  | 'departments'
  | 'leave'
  | 'attendance'
  | 'gate_pass'
  | 'announcements'
  | 'forms'
  | 'reports'
  | 'users'
  | 'web_integrations'
  | 'plugins'
  | 'settings';

export interface CategoryInfo {
  id: CategoryPermission;
  name: string;
  description: string;
  iconName: string;
}

export const CATEGORY_DEFINITIONS: CategoryInfo[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Xem tổng quan và thống kê nhà máy', iconName: 'LayoutDashboard' },
  { id: 'departments', name: 'Quản lý phòng ban', description: 'Thêm, sửa, xóa phòng ban nhà máy', iconName: 'Building2' },
  { id: 'leave', name: 'Đơn xin nghỉ phép', description: 'Tạo và phê duyệt đơn nghỉ phép', iconName: 'CalendarDays' },
  { id: 'attendance', name: 'Xác nhận công', description: 'Xác nhận công vào - ra do quên/mất thẻ', iconName: 'Clock' },
  { id: 'gate_pass', name: 'Ra vào cổng', description: 'Phiếu ra cổng, tài sản & quét mã QR bảo vệ', iconName: 'QrCode' },
  { id: 'announcements', name: 'Thông báo', description: 'Thông báo công ty, nội quy, chính sách', iconName: 'Bell' },
  { id: 'forms', name: 'Biểu mẫu động', description: 'Tạo và sử dụng các biểu mẫu điện tử', iconName: 'FileSpreadsheet' },
  { id: 'reports', name: 'Báo cáo', description: 'Báo cáo tổng hợp và xuất Excel, PDF', iconName: 'BarChart3' },
  { id: 'users', name: 'Quản lý nhân viên', description: 'Tải Excel nhân viên, thêm mới và phân quyền', iconName: 'Users' },
  { id: 'web_integrations', name: 'Tích hợp Website', description: 'Quản lý các trang web tích hợp vào hệ thống', iconName: 'Globe' },
  { id: 'plugins', name: 'Mở rộng (Plugins)', description: '5S, ISO, An toàn, Kaizen, Đánh giá...', iconName: 'Boxes' },
  { id: 'settings', name: 'Cài đặt hệ thống', description: 'Cấu hình GitHub, sao lưu và thông tin công ty', iconName: 'Settings' },
];

export interface Position {
  id: string; // POS-001...
  name: string; // Tên chức vụ
  code?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string; // PB-SX, PB-CD...
  name: string;
  code: string;
  description?: string;
  managerId?: string; // Mã NV Trưởng bộ phận
  managerName?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebIntegration {
  id: string; // WEB-001
  title: string;
  url: string;
  description?: string;
  iconName: string; // Globe, ExternalLink, Monitor, BarChart, Camera, Database, FileText, LayoutGrid
  displayMode: 'embed' | 'new_tab'; // Nhúng iframe hoặc mở tab mới
  allowedRoles?: string[]; // 'all' hoặc mảng role
  allowedDepartments?: string[]; // 'all' hoặc mảng phòng ban
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string; // Mã nhân viên, ví dụ LK-001 (Dùng làm Tên đăng nhập)
  name: string;
  email?: string;
  phone?: string;
  department: string; // Phòng ban / Xưởng
  position: string; // Chức vụ
  role: UserRole;
  permissions: CategoryPermission[]; // Danh mục được phép truy cập
  allowedWebIntegrations?: string[]; // Danh sách ID các trang web tích hợp nhân viên được phép truy cập
  teamLeaderId?: string; // Mã NV Tổ trưởng (nếu có)
  departmentHeadId?: string; // Mã NV Trưởng bộ phận
  departmentHeadEmail?: string; // Email Trưởng bộ phận (nhận thông báo & duyệt đơn)
  economicStaffId?: string; // Mã NV kinh tế (cắt cơm)
  isActive: boolean;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserExcelRow {
  employeeId: string; // Mã NV (Bắt buộc)
  name: string; // Họ tên (Bắt buộc)
  department: string; // Phòng ban (Bắt buộc)
  position: string; // Chức vụ
  role?: string; // admin, manager, employee...
  email?: string;
  phone?: string;
  teamLeaderId?: string; // Mã Tổ trưởng
  departmentHeadId?: string; // Mã Trưởng BP
  departmentHeadEmail?: string; // Email Trưởng BP
  economicStaffId?: string; // Mã NV kinh tế (cắt cơm)
  password?: string; // Mật khẩu ban đầu
  permissions?: string; // Chuỗi phân quyền, ví dụ: "dashboard,leave,attendance" hoặc "all"
}
