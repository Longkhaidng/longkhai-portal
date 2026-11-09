export type FoodCategory =
  | 'pregnant'        // Thức ăn cho người mang thai
  | 'medicine_drink'  // Nước thuốc
  | 'vegetarian';     // Thực phẩm chay

export type FoodMainGroup = 'pregnant_medicine' | 'vegetarian';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  pregnant: 'Thực phẩm cho người mang thai',
  medicine_drink: 'Nước thuốc',
  vegetarian: 'Thực phẩm chay',
};

export const FOOD_CATEGORY_ICONS: Record<FoodCategory, string> = {
  pregnant: '🤰',
  medicine_drink: '🍵',
  vegetarian: '🥗',
};

export type FoodRegistrationStatus =
  | 'pending_dept'     // Chờ Trưởng bộ phận duyệt
  | 'pending_hr'       // Chờ Trưởng phòng HCNS duyệt
  | 'approved'         // Đã duyệt (Được cấp mã QR có hiệu lực)
  | 'rejected'         // Bị từ chối duyệt
  | 'confirmed'        // Bảo vệ đã xác nhận vào cổng
  | 'guard_rejected'   // Bảo vệ từ chối tại cổng
  | 'cancelled';       // Đã hủy

export const FOOD_STATUS_LABELS: Record<FoodRegistrationStatus, string> = {
  pending_dept: 'Chờ Trưởng BP duyệt',
  pending_hr: 'Chờ Trưởng phòng HCNS duyệt',
  approved: 'Đã duyệt (Có mã QR)',
  rejected: 'Từ chối phê duyệt',
  confirmed: 'Bảo vệ đã xác nhận',
  guard_rejected: 'Bảo vệ từ chối tại cổng',
  cancelled: 'Đã hủy',
};

export const FOOD_STATUS_BADGES: Record<FoodRegistrationStatus, string> = {
  pending_dept: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  pending_hr: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
  confirmed: 'bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
  guard_rejected: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
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
  'Cao lầu chay',
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

export interface FoodApprovalStep {
  stepName: 'Trưởng bộ phận' | 'Trưởng phòng HCNS';
  roleRequired: 'manager' | 'hr';
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string;
  actionAt?: string;
}

export interface FoodEntryLog {
  id: string;
  guardId?: string;
  guardName: string;
  action: 'confirmed' | 'rejected';
  reason?: string;
  note?: string;
  timestamp: string;
}

export interface FoodRegistration {
  id: string; // e.g. TP26-0001
  employeeId: string; // MSNV
  employeeName: string; // Họ và tên
  department: string; // Bộ phận / Phân xưởng / Chuyền sản xuất
  entryDate: string; // Ngày mang vào (YYYY-MM-DD) hoặc Từ ngày
  toDate?: string; // Đến ngày (YYYY-MM-DD) cho mang thai / nước thuốc
  shift?: string; // Ca làm việc (cho thực phẩm chay)
  timeFrame?: string;
  category: FoodCategory;
  mainGroup?: FoodMainGroup;
  customCategory?: string;
  foodDetails: string; // Chi tiết món ăn
  customFoodDetails?: string; // Chi tiết nếu chọn Khác trong món chay
  complianceCommitment: boolean; // Cam kết ATVSTP (bắt buộc true)
  status: FoodRegistrationStatus;

  // Luồng duyệt 2 cấp: Trưởng BP -> Trưởng phòng HCNS (cho mang thai, nước thuốc)
  steps?: FoodApprovalStep[];
  currentStepIndex?: number;
  rejectedReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;

  // Thời hạn QR code
  expiresAt?: string; // ISO datetime

  // Bảo vệ xác nhận tại cổng
  guardId?: string;
  guardName?: string;
  guardNote?: string;
  confirmedAt?: string;
  entryLogs?: FoodEntryLog[];

  // QR code
  qrCodeUrl?: string;
  qrDataUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export interface FoodQrValidity {
  isValid: boolean;
  isExpired: boolean;
  message?: string;
  remainingText?: string;
}

/**
 * Kiểm tra hiệu lực của mã QR Thực phẩm mang vào theo quy tắc:
 * 1. Mang thai & Nước thuốc: Phải được Trưởng BP & Trưởng phòng HCNS phê duyệt hoàn tất.
 *    Mã QR có hiệu lực trong khoảng thời gian đã phê duyệt (Từ ngày -> Đến ngày).
 * 2. Thực phẩm chay: Có thời hạn trong vòng 12h kể từ lúc đăng ký.
 * 3. Khi hết hiệu lực: Thông báo "Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực."
 */
export function checkFoodQrValidity(registration: FoodRegistration): FoodQrValidity {
  const now = new Date();

  if (registration.status === 'rejected') {
    return {
      isValid: false,
      isExpired: false,
      message: registration.rejectedReason
        ? `Đơn bị từ chối phê duyệt: ${registration.rejectedReason}`
        : 'Đơn đăng ký thực phẩm này đã bị từ chối phê duyệt.',
    };
  }

  if (registration.status === 'cancelled') {
    return {
      isValid: false,
      isExpired: false,
      message: 'Đơn đăng ký thực phẩm này đã bị hủy.',
    };
  }

  // 1. Chế độ mang thai & Nước thuốc (Duyệt 2 cấp)
  if (registration.category === 'pregnant' || registration.category === 'medicine_drink') {
    // Chưa được duyệt hoàn tất
    if (registration.status === 'pending_dept') {
      return {
        isValid: false,
        isExpired: false,
        message: 'Đơn đang chờ Trưởng bộ phận phê duyệt. Mã QR sẽ được kích hoạt sau khi duyệt.',
      };
    }

    if (registration.status === 'pending_hr') {
      return {
        isValid: false,
        isExpired: false,
        message: 'Đơn đã qua Trưởng BP duyệt, đang chờ Trưởng phòng HCNS phê duyệt.',
      };
    }

    // Đã duyệt (approved, confirmed, guard_rejected) -> Kiểm tra hạn khoảng ngày
    const toDateStr = registration.toDate || registration.entryDate;
    const endOfDay = new Date(`${toDateStr}T23:59:59.999`);
    const startOfDay = new Date(`${registration.entryDate}T00:00:00.000`);

    if (now > endOfDay) {
      return {
        isValid: false,
        isExpired: true,
        message: 'Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực.',
      };
    }

    if (now < startOfDay) {
      return {
        isValid: false,
        isExpired: false,
        message: `Mã QR chưa đến ngày hiệu lực (Bắt đầu từ ${registration.entryDate}).`,
      };
    }

    return {
      isValid: true,
      isExpired: false,
      remainingText: `Có hiệu lực đến hết ngày ${toDateStr}`,
    };
  }

  // 2. Chế độ Thực phẩm chay: Hạn trong 12h
  if (registration.category === 'vegetarian') {
    const createdTime = new Date(registration.createdAt).getTime();
    const expiresTime = registration.expiresAt
      ? new Date(registration.expiresAt).getTime()
      : createdTime + 12 * 60 * 60 * 1000;

    if (now.getTime() > expiresTime) {
      return {
        isValid: false,
        isExpired: true,
        message: 'Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực.',
      };
    }

    const diffMs = expiresTime - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isValid: true,
      isExpired: false,
      remainingText: `Còn hiệu lực trong ${diffHours > 0 ? `${diffHours} giờ ` : ''}${diffMins} phút (Thời hạn 12h)`,
    };
  }

  return { isValid: true, isExpired: false };
}

export const INITIAL_FOOD_REGISTRATIONS: FoodRegistration[] = [
  {
    id: 'TP26-0001',
    employeeId: '1008',
    employeeName: 'Đoàn Thị Thanh Xuân',
    department: 'Phòng Kế Toán',
    entryDate: '2026-11-09',
    toDate: '2026-11-20',
    category: 'pregnant',
    mainGroup: 'pregnant_medicine',
    foodDetails: 'Bánh + Sữa, Trái cây + Sữa',
    complianceCommitment: true,
    status: 'approved',
    steps: [
      {
        stepName: 'Trưởng bộ phận',
        roleRequired: 'manager',
        approverId: 'LK-010',
        approverName: 'Lê Hoàng Cường',
        status: 'approved',
        comment: 'Đồng ý duyệt chế độ mang thai',
        actionAt: '2026-11-09T01:00:00.000Z',
      },
      {
        stepName: 'Trưởng phòng HCNS',
        roleRequired: 'hr',
        approverId: '1867',
        approverName: 'Trương Anh Như Quỳnh',
        status: 'approved',
        comment: 'Đã xác nhận hồ sơ thai sản, cấp phép mang thực phẩm bổ sung',
        actionAt: '2026-11-09T01:30:00.000Z',
      },
    ],
    currentStepIndex: 2,
    guardId: '101',
    guardName: 'Nguyễn Hữu Lập',
    guardNote: 'Đã kiểm tra bao bì sạch sẽ, đóng hộp kín đảm bảo vệ sinh.',
    confirmedAt: '2026-11-09T07:15:00.000Z',
    createdAt: '2026-11-09T00:15:00.000Z',
    updatedAt: '2026-11-09T07:15:00.000Z',
  },
  {
    id: 'TP26-0002',
    employeeId: '1010',
    employeeName: 'Nguyễn Thị Thanh Hiền',
    department: 'Phân xưởng dệt',
    entryDate: '2026-11-09',
    shift: 'Ca 1 (06:00 - 14:00)',
    category: 'vegetarian',
    mainGroup: 'vegetarian',
    foodDetails: 'Mì quảng chay',
    complianceCommitment: true,
    status: 'approved',
    expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'TP26-0003',
    employeeId: '1002',
    employeeName: 'Trần Thị Kim Loan',
    department: 'Phòng HCNS',
    entryDate: '2026-11-09',
    toDate: '2026-11-16',
    category: 'medicine_drink',
    mainGroup: 'pregnant_medicine',
    foodDetails: 'Nước thuốc',
    complianceCommitment: true,
    status: 'pending_dept',
    steps: [
      {
        stepName: 'Trưởng bộ phận',
        roleRequired: 'manager',
        status: 'pending',
      },
      {
        stepName: 'Trưởng phòng HCNS',
        roleRequired: 'hr',
        status: 'pending',
      },
    ],
    currentStepIndex: 0,
    createdAt: '2026-11-09T02:00:00.000Z',
    updatedAt: '2026-11-09T02:00:00.000Z',
  },
  {
    id: 'TP26-0004',
    employeeId: '1015',
    employeeName: 'Lê Thị Mai',
    department: 'Xưởng May 1',
    entryDate: '2026-11-08',
    shift: 'Ca 1 (06:00 - 14:00)',
    category: 'vegetarian',
    mainGroup: 'vegetarian',
    foodDetails: 'Cao lầu chay',
    complianceCommitment: true,
    status: 'approved',
    expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Đã hết hạn (14 tiếng trước)
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
];
