export type FoodCategory =
  | 'pregnant'
  | 'vegetarian'
  | 'medicine_drink'
  | 'other';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  pregnant: 'Thức ăn cho người mang thai',
  vegetarian: 'Thực phẩm chay',
  medicine_drink: 'Nước thuốc',
  other: 'Khác',
};

export const FOOD_CATEGORY_ICONS: Record<FoodCategory, string> = {
  pregnant: '🤰',
  vegetarian: '🥗',
  medicine_drink: '🍵',
  other: '🍱',
};

export type FoodRegistrationStatus =
  | 'pending'   // Đã gửi / Chờ bảo vệ xác nhận
  | 'confirmed' // Bảo vệ xác nhận
  | 'rejected'  // Không xác nhận (Từ chối)
  | 'cancelled'; // Đã hủy

export const FOOD_STATUS_LABELS: Record<FoodRegistrationStatus, string> = {
  pending: 'Đã gửi (Chờ bảo vệ xác nhận)',
  confirmed: 'Bảo vệ xác nhận',
  rejected: 'Không xác nhận',
  cancelled: 'Đã hủy',
};

export const FOOD_STATUS_BADGES: Record<FoodRegistrationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

export const FOOD_ENTRY_SHIFTS = [
  'Ca HC (08:00 - 16:30)',
  'Ca 1 (06:00 - 14:00)',
  'Ca 2 (14:00 - 22:00)',
  'Ca 3 (22:00 - 06:00)',
  'Ca HC_V (07:00 - 15:30)',
  'Ca HC_KT (07:30 - 16:00)',
  'Ca khác (Ghi rõ ở ghi chú)',
] as const;

export const PREGNANT_FOOD_OPTIONS = [
  'Bánh + Sữa',
  'Trái cây + Sữa',
] as const;

export const VEGETARIAN_FOOD_OPTIONS = [
  'Bún chay',
  'Mì quảng chay',
  'Bánh canh chay',
  'Khác',
] as const;

export const QUICK_STORAGE_TAGS = [
  'Đồ khô đóng kín',
  'Đồ ăn tươi chín trong ngày',
  'Cần bảo quản tủ lạnh',
  'Cần hâm nóng trước khi ăn',
  'Nước thuốc uống theo toa',
  'Trái cây tươi đóng hộp',
];

export interface FoodRegistration {
  id: string; // e.g. TP26-0001
  employeeId: string; // MSNV
  employeeName: string; // Họ và tên
  department: string; // Bộ phận / Phân xưởng / Chuyền sản xuất
  entryDate: string; // Ngày mang vào (YYYY-MM-DD)
  toDate?: string; // Đến ngày (YYYY-MM-DD) khi đăng ký khoảng ngày cho người mang thai / nước thuốc
  shift?: string; // Ca làm việc (cho thực phẩm chay, khác)
  timeFrame?: string; // Khung giờ mang vào (ví dụ: Đầu ca, 07:30 - 07:55)
  category: FoodCategory; // Phân loại thực phẩm
  customCategory?: string; // Chi tiết loại khác nếu chọn 'other'
  foodDetails: string; // Chi tiết món ăn
  customFoodDetails?: string; // Chi tiết nếu chọn Khác trong món chay
  complianceCommitment: boolean; // Cam kết ATVSTP (bắt buộc true)
  status: FoodRegistrationStatus; // Trạng thái đơn

  // Bảo vệ xác nhận tại cổng
  guardId?: string; // MSNV bảo vệ
  guardName?: string; // Tên nhân viên bảo vệ
  guardNote?: string; // Ghi chú của bảo vệ khi kiểm tra
  confirmedAt?: string; // Thời gian bảo vệ quét/xác nhận
  rejectedReason?: string; // Lý do nếu không xác nhận

  // QR code
  qrCodeUrl?: string; // Đường dẫn web xác nhận (dành cho quét QR)
  qrDataUrl?: string; // Dữ liệu ảnh QR (data:image/png;base64,...)

  createdAt: string;
  updatedAt: string;
}

export const INITIAL_FOOD_REGISTRATIONS: FoodRegistration[] = [
  {
    id: 'TP26-0001',
    employeeId: '1008',
    employeeName: 'Đoàn Thị Thanh Xuân',
    department: 'Phòng Kế Toán',
    entryDate: '2026-11-09',
    toDate: '2026-11-14',
    timeFrame: '07:30 - 07:50',
    category: 'pregnant',
    foodDetails: 'Bánh + Sữa',
    complianceCommitment: true,
    status: 'confirmed',
    guardId: '101',
    guardName: 'Nguyễn Hữu Lập',
    guardNote: 'Đã kiểm tra bao bì sạch sẽ, đóng hộp kín đảm bảo vệ sinh.',
    confirmedAt: '2026-11-09T00:45:00.000Z',
    createdAt: '2026-11-09T00:15:00.000Z',
    updatedAt: '2026-11-09T00:45:00.000Z',
  },
  {
    id: 'TP26-0002',
    employeeId: '1010',
    employeeName: 'Nguyễn Thị Thanh Hiền',
    department: 'Phân xưởng dệt',
    entryDate: '2026-11-09',
    shift: 'Ca 1 (06:00 - 14:00)',
    timeFrame: '05:35 - 05:50',
    category: 'vegetarian',
    foodDetails: 'Mì quảng chay',
    complianceCommitment: true,
    status: 'pending',
    createdAt: '2026-11-09T00:20:00.000Z',
    updatedAt: '2026-11-09T00:20:00.000Z',
  },
  {
    id: 'TP26-0003',
    employeeId: '1002',
    employeeName: 'Trần Thị Kim Loan',
    department: 'Phòng HCNS',
    entryDate: '2026-11-09',
    toDate: '2026-11-14',
    timeFrame: '07:40 - 08:00',
    category: 'medicine_drink',
    foodDetails: 'Nước thuốc',
    complianceCommitment: true,
    status: 'confirmed',
    guardId: '104',
    guardName: 'Lương Văn Vĩnh',
    guardNote: 'Đã kiểm tra bình nước cá nhân đạt chuẩn, đồng ý cho mang vào.',
    confirmedAt: '2026-11-09T00:50:00.000Z',
    createdAt: '2026-11-09T00:25:00.000Z',
    updatedAt: '2026-11-09T00:50:00.000Z',
  },
];
