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
  approved: 'Đã duyệt',
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

export const VEGETARIAN_UNITS = [
  'Kg',
  'Lon',
  'Tô/Hộp',
  'Gói(bịch)',
  'Khác',
] as const;

export type VegetarianUnit = typeof VEGETARIAN_UNITS[number] | string;

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
  toDate?: string; // Đến ngày (YYYY-MM-DD) hoặc Ngày kết thúc cho mang thai / nước thuốc
  durationDays?: number; // Số ngày cần mang vào
  shift?: string; // Ca làm việc (cho thực phẩm chay)
  timeFrame?: string;
  category: FoodCategory;
  mainGroup?: FoodMainGroup;
  customCategory?: string;
  foodDetails: string; // Chi tiết món ăn
  customFoodDetails?: string; // Chi tiết nếu chọn Khác trong món chay
  quantity?: number; // Số lượng (cho thực phẩm chay)
  unit?: string; // Đơn vị tính: Kg, Lon, Tô/Hộp, Gói(bịch), Khác
  customUnit?: string; // Đơn vị tự nhập nếu chọn Khác
  notes?: string; // Ghi chú thêm
  medicineReason?: string; // Lý do mang nước thuốc vào (bắt buộc với nước thuốc)
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
      const isDirect = registration.steps?.length === 1;
      return {
        isValid: false,
        isExpired: false,
        message: isDirect
          ? 'Đơn đang chờ Trưởng phòng HCNS phê duyệt. Mã QR sẽ được kích hoạt sau khi duyệt.'
          : 'Đơn đã qua Trưởng BP duyệt, đang chờ Trưởng phòng HCNS phê duyệt.',
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

export const INITIAL_FOOD_REGISTRATIONS: FoodRegistration[] = [];

// ==========================================
// CẤU TRÚC DỮ LIỆU BÁO CÁO TỔNG HỢP THỰC PHẨM
// ==========================================
export interface FoodReportRow {
  rowId: string;
  registration: FoodRegistration;
  id: string; // Mã phiếu: TP26-0001
  employeeId: string;
  employeeName: string;
  department: string;
  entryDate: string; // YYYY-MM-DD của ngày mang vào thực tế (hoặc ngày đăng ký)
  displayDate: string; // Định dạng dd/mm/yyyy
  isRange: boolean;
  dateRangeText?: string; // (Đợt: dd/mm/yyyy – dd/mm/yyyy)
  shift: string;
  timeFrame?: string;
  category: FoodCategory;
  mainGroup?: FoodMainGroup;
  foodDetails: string;
  complianceCommitment: boolean;
  status: 'confirmed' | 'guard_rejected' | FoodRegistrationStatus;
  statusLabel: string;
  statusBadge: string;
  guardName?: string;
  guardTime?: string;
  sortTime: number;
  note?: string;
  isScanLog: boolean;
  logIndex?: number;
}

function formatDateStr(isoOrDate?: string): string {
  if (!isoOrDate) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(isoOrDate)) {
    const [y, m, d] = isoOrDate.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(isoOrDate);
  if (isNaN(dt.getTime())) return isoOrDate;
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Trích xuất số sequence từ mã phiếu để so sánh thứ tự đăng ký (ví dụ: TP26-0009 -> 26000009).
 */
export function extractRegistrationSequence(id?: string): number {
  if (!id) return 0;
  const match = id.match(/^[A-Za-z]+(\d{2})-(\d+)$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const seq = parseInt(match[2], 10);
    return year * 1000000 + seq;
  }
  const matchNum = id.match(/-(\d+)$/);
  if (matchNum) {
    return parseInt(matchNum[1], 10);
  }
  return 0;
}

/**
 * So sánh 2 đơn đăng ký thực phẩm để đơn mới nhất luôn xếp trên cùng.
 * Ưu tiên: Mã phiếu sequence mới hơn (TP26-0009 > TP26-0008 ...) -> Thời gian tạo đơn (createdAt) mới hơn.
 */
export function compareFoodRegistrationsNewestFirst(a: FoodRegistration, b: FoodRegistration): number {
  const seqA = extractRegistrationSequence(a.id);
  const seqB = extractRegistrationSequence(b.id);
  if (seqA > 0 && seqB > 0 && seqA !== seqB) {
    return seqB - seqA;
  }

  const timeA = new Date(a.createdAt || a.entryDate || 0).getTime();
  const timeB = new Date(b.createdAt || b.entryDate || 0).getTime();
  if (timeB !== timeA) {
    return timeB - timeA;
  }

  return (b.id || '').localeCompare(a.id || '');
}

/**
 * So sánh 2 dòng báo cáo thực phẩm để dữ liệu đăng ký mới nhất hiển thị trên cùng.
 * 1. Khác đơn đăng ký: Đơn nào đăng ký mới nhất thì hiển thị trước (trên cùng).
 * 2. Cùng một đơn đăng ký: Lần bảo vệ quét xác nhận mới nhất hiển thị trước lần quét cũ hơn.
 */
export function compareFoodReportRowsNewestFirst(a: FoodReportRow, b: FoodReportRow): number {
  if (a.id !== b.id) {
    const seqA = extractRegistrationSequence(a.id);
    const seqB = extractRegistrationSequence(b.id);
    if (seqA > 0 && seqB > 0 && seqA !== seqB) {
      return seqB - seqA;
    }

    const regTimeA = new Date(a.registration?.createdAt || 0).getTime();
    const regTimeB = new Date(b.registration?.createdAt || 0).getTime();
    if (regTimeB !== regTimeA) {
      return regTimeB - regTimeA;
    }

    return (b.id || '').localeCompare(a.id || '');
  }

  // Cùng 1 mã phiếu: xếp theo lần quét bảo vệ mới nhất lên trước
  const logTimeA = a.guardTime ? new Date(a.guardTime).getTime() : 0;
  const logTimeB = b.guardTime ? new Date(b.guardTime).getTime() : 0;
  if (logTimeB !== logTimeA) {
    return logTimeB - logTimeA;
  }

  return (b.logIndex ?? 0) - (a.logIndex ?? 0);
}

/**
 * Trải phẳng danh sách đăng ký thực phẩm thành các dòng báo cáo chi tiết.
 * Mỗi lần bảo vệ quét mã xác nhận hoặc từ chối (trong entryLogs) sẽ hiển thị thành 1 dòng riêng biệt
 * kèm đúng ngày mang vào thực tế, giờ xác nhận và ghi chú của bảo vệ.
 * Dữ liệu đăng ký mới nhất luôn được hiển thị trên cùng.
 */
export function flattenFoodRegistrationsToReportRows(registrations: FoodRegistration[]): FoodReportRow[] {
  // Sắp xếp đơn đăng ký mới nhất lên trên
  const sortedRegs = [...registrations].sort(compareFoodRegistrationsNewestFirst);
  const rows: FoodReportRow[] = [];

  for (const reg of sortedRegs) {
    const rawLogs = Array.isArray(reg.entryLogs) && reg.entryLogs.length > 0 ? reg.entryLogs : [];
    // Sắp xếp các lần quét bảo vệ của đơn từ mới nhất đến cũ nhất
    const logs = [...rawLogs].sort((l1, l2) => {
      const t1 = l1.timestamp ? new Date(l1.timestamp).getTime() : 0;
      const t2 = l2.timestamp ? new Date(l2.timestamp).getTime() : 0;
      return t2 - t1;
    });

    // Trường hợp 1: Có danh sách nhật ký quét của bảo vệ (entryLogs)
    if (logs.length > 0) {
      logs.forEach((log, logIdx) => {
        let entryDate = reg.entryDate;
        if (log.timestamp) {
          const parsed = new Date(log.timestamp);
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            entryDate = `${y}-${m}-${d}`;
          }
        }

        const isConfirmed = log.action === 'confirmed';
        const status: 'confirmed' | 'guard_rejected' = isConfirmed ? 'confirmed' : 'guard_rejected';
        const statusLabel = isConfirmed ? 'Bảo vệ đã xác nhận' : 'Bảo vệ từ chối';
        const statusBadge = isConfirmed
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
          : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';

        const hasRange = !!(reg.toDate && reg.toDate !== reg.entryDate);
        const dateRangeText = hasRange
          ? `(Đợt: ${formatDateStr(reg.entryDate)} – ${formatDateStr(reg.toDate)})`
          : undefined;

        rows.push({
          rowId: `${reg.id}-log-${log.id || logIdx}`,
          registration: reg,
          id: reg.id,
          employeeId: reg.employeeId,
          employeeName: reg.employeeName,
          department: reg.department,
          entryDate,
          displayDate: formatDateStr(entryDate),
          isRange: hasRange,
          dateRangeText,
          shift: reg.shift || (hasRange ? 'Theo đợt' : '-'),
          timeFrame: reg.timeFrame,
          category: reg.category,
          mainGroup: reg.mainGroup || (reg.category === 'vegetarian' ? 'vegetarian' : 'pregnant_medicine'),
          foodDetails: reg.foodDetails,
          complianceCommitment: reg.complianceCommitment,
          status,
          statusLabel,
          statusBadge,
          guardName: log.guardName,
          guardTime: log.timestamp,
          sortTime: new Date(reg.createdAt).getTime(),
          note: log.action === 'rejected' ? (log.reason || log.note || '-') : (log.note || '-'),
          isScanLog: true,
          logIndex: logIdx,
        });
      });
    // Trường hợp 2: Dữ liệu cũ đã có guardName/confirmedAt nhưng chưa lưu vào mảng entryLogs
    } else if (reg.confirmedAt || reg.guardName) {
      let entryDate = reg.entryDate;
      if (reg.confirmedAt) {
        const parsed = new Date(reg.confirmedAt);
        if (!isNaN(parsed.getTime())) {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, '0');
          const d = String(parsed.getDate()).padStart(2, '0');
          entryDate = `${y}-${m}-${d}`;
        }
      }
      const isRejected = reg.status === 'guard_rejected';
      const status: 'confirmed' | 'guard_rejected' = isRejected ? 'guard_rejected' : 'confirmed';
      const statusLabel = isRejected ? 'Bảo vệ từ chối' : 'Bảo vệ đã xác nhận';
      const statusBadge = isRejected
        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
        : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';

      const hasRange = !!(reg.toDate && reg.toDate !== reg.entryDate);
      const dateRangeText = hasRange
        ? `(Đợt: ${formatDateStr(reg.entryDate)} – ${formatDateStr(reg.toDate)})`
        : undefined;

      rows.push({
        rowId: `${reg.id}-legacy`,
        registration: reg,
        id: reg.id,
        employeeId: reg.employeeId,
        employeeName: reg.employeeName,
        department: reg.department,
        entryDate,
        displayDate: formatDateStr(entryDate),
        isRange: hasRange,
        dateRangeText,
        shift: reg.shift || (hasRange ? 'Theo đợt' : '-'),
        timeFrame: reg.timeFrame,
        category: reg.category,
        mainGroup: reg.mainGroup || (reg.category === 'vegetarian' ? 'vegetarian' : 'pregnant_medicine'),
        foodDetails: reg.foodDetails,
        complianceCommitment: reg.complianceCommitment,
        status,
        statusLabel,
        statusBadge,
        guardName: reg.guardName,
        guardTime: reg.confirmedAt,
        sortTime: new Date(reg.createdAt).getTime(),
        note: reg.guardNote || reg.rejectedReason || '-',
        isScanLog: true,
      });
    // Trường hợp 3: Đơn mới tạo/chờ duyệt, chưa qua cổng bảo vệ lần nào
    } else {
      const hasRange = !!(reg.toDate && reg.toDate !== reg.entryDate);
      rows.push({
        rowId: `${reg.id}-reg`,
        registration: reg,
        id: reg.id,
        employeeId: reg.employeeId,
        employeeName: reg.employeeName,
        department: reg.department,
        entryDate: reg.entryDate,
        displayDate: hasRange
          ? `${formatDateStr(reg.entryDate)} – ${formatDateStr(reg.toDate)}`
          : formatDateStr(reg.entryDate),
        isRange: hasRange,
        dateRangeText: undefined,
        shift: reg.shift || (hasRange ? 'Theo đợt' : '-'),
        timeFrame: reg.timeFrame,
        category: reg.category,
        mainGroup: reg.mainGroup || (reg.category === 'vegetarian' ? 'vegetarian' : 'pregnant_medicine'),
        foodDetails: reg.foodDetails,
        complianceCommitment: reg.complianceCommitment,
        status: reg.status,
        statusLabel: FOOD_STATUS_LABELS[reg.status] || reg.status,
        statusBadge: FOOD_STATUS_BADGES[reg.status] || '',
        guardName: undefined,
        guardTime: undefined,
        sortTime: new Date(reg.createdAt).getTime(),
        note: reg.status === 'rejected' ? (reg.rejectedReason || '-') : (reg.guardNote || '-'),
        isScanLog: false,
      });
    }
  }

  return rows.sort(compareFoodReportRowsNewestFirst);
}
