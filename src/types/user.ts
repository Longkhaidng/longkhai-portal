export type UserRole =
  | 'admin'
  | 'hr'
  | 'cb'
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
  | 'overtime'
  | 'food_registration'
  | 'camera'
  | 'gate_pass'
  | 'repair'
  | 'pccc'
  | 'periodic_inspection'
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
  { id: 'dashboard', name: 'Dashboard Tổng quan', description: 'Xem tổng quan và thống kê nhà máy', iconName: 'LayoutDashboard' },
  { id: 'departments', name: 'Quản lý phòng ban', description: 'Cơ cấu và sơ đồ tổ chức phòng ban', iconName: 'Building2' },
  { id: 'leave', name: 'Đơn xin nghỉ phép', description: 'Đăng ký và phê duyệt nghỉ phép', iconName: 'CalendarDays' },
  { id: 'attendance', name: 'Phiếu xác nhận công', description: 'Xác nhận công vào - ra do quên/mất thẻ', iconName: 'Clock' },
  { id: 'gate_pass', name: 'Phiếu ra - vào cổng', description: 'Đăng ký ra cổng, tài sản & mã QR bảo vệ', iconName: 'QrCode' },
  { id: 'overtime', name: 'Đăng ký làm thêm giờ', description: 'Đăng ký tăng ca, ăn giữa ca & phê duyệt', iconName: 'Timer' },
  { id: 'food_registration', name: 'Thực phẩm mang vào', description: 'Đăng ký mang thực phẩm, cam kết ATVSTP & cấp mã QR', iconName: 'UtensilsCrossed' },
  { id: 'camera', name: 'Đăng ký xem Camera', description: 'Đăng ký và duyệt phiếu xem dữ liệu camera an ninh', iconName: 'Camera' },
  { id: 'repair', name: 'Phiếu đề xuất', description: 'Đề xuất sửa chữa, văn phòng phẩm & đề xuất khác', iconName: 'ClipboardList' },
  { id: 'pccc', name: 'Kiểm tra PCCC', description: 'Quản lý thiết bị PCCC và biên bản kiểm định', iconName: 'Flame' },
  { id: 'periodic_inspection', name: 'Kiểm tra định kỳ', description: 'Tủ SCC, máy rửa mắt, nước mưa, nước ngầm & đất', iconName: 'ClipboardCheck' },
  { id: 'announcements', name: 'Thông báo & Nội quy', description: 'Thông báo, nội quy và chính sách nhà máy', iconName: 'Bell' },
  { id: 'forms', name: 'Quản lý biểu mẫu động', description: 'Biểu mẫu điện tử và khảo sát nội bộ', iconName: 'FileSpreadsheet' },
  { id: 'reports', name: 'Báo cáo & Thống kê', description: 'Tra cứu dữ liệu và xuất báo cáo Excel/PDF', iconName: 'BarChart3' },
  { id: 'users', name: 'Quản lý NV & Phân quyền', description: 'Quản lý danh sách nhân sự và phân quyền sử dụng', iconName: 'Users' },
  { id: 'web_integrations', name: 'Tích hợp Website (Cài đặt)', description: 'Cài đặt liên kết website nội bộ nhà máy', iconName: 'Globe' },
  { id: 'settings', name: 'Cài đặt hệ thống', description: 'Cấu hình hệ thống, sao lưu dữ liệu', iconName: 'Settings' },
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
