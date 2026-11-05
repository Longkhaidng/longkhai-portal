export type OvertimeDayType = 'ngay_thuong' | 'ngay_nghi' | 'ngay_le';

export const OVERTIME_DAY_TYPE_LABELS: Record<OvertimeDayType, string> = {
  ngay_thuong: 'Ngày thường',
  ngay_nghi: 'Ngày nghỉ',
  ngay_le: 'Ngày lễ',
};

export type OvertimeCategory = 'sau_ca' | 'truoc_ca' | 'khong_theo_ca';

export const OVERTIME_CATEGORY_LABELS: Record<OvertimeCategory, string> = {
  sau_ca: 'Sau ca làm việc',
  truoc_ca: 'Trước ca làm việc',
  khong_theo_ca: 'Không theo ca',
};

export type OvertimeCompensation = 'tinh_luong' | 'nghi_bu';

export const OVERTIME_COMPENSATION_LABELS: Record<OvertimeCompensation, string> = {
  tinh_luong: 'Tính lương',
  nghi_bu: 'Nghỉ bù',
};

export type OvertimeReasonType = 'ke_hoach_sx' | 'khac';

export const OVERTIME_REASON_LABELS: Record<OvertimeReasonType, string> = {
  ke_hoach_sx: 'TC theo kế hoạch sản xuất',
  khac: 'Khác',
};

export type OvertimeConfirmStatus = 'pending' | 'confirmed' | 'rejected';

export const OVERTIME_CONFIRM_STATUS_LABELS: Record<OvertimeConfirmStatus, string> = {
  pending: 'Chờ NV xác nhận',
  confirmed: 'Đã xác nhận',
  rejected: 'Từ chối',
};

export const OVERTIME_CONFIRM_STATUS_BADGES: Record<OvertimeConfirmStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
};

export type OvertimeApprovalStatus = 'pending' | 'approved' | 'rejected';

export const OVERTIME_APPROVAL_STATUS_LABELS: Record<OvertimeApprovalStatus, string> = {
  pending: 'Chờ TBP duyệt',
  approved: 'Đã phê duyệt',
  rejected: 'Từ chối',
};

export const OVERTIME_APPROVAL_STATUS_BADGES: Record<OvertimeApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  approved: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
};

export const OVERTIME_SHIFTS = [
  'Ca HC (08:00 - 16:30)',
  'Ca 1 (06:00 - 14:00)',
  'Ca 2 (14:00 - 22:00)',
  'Ca 3 (22:00 - 06:00)',
  'Ca HC_V (07:00 - 15:30)',
  'Ca HC_V1 (06:30 - 15:00)',
  'Ca HC_KT (07:30 - 16:00)',
  'Ca LH (12:00 - 20:00)',
  'Ca BK1 (07:00 - 15:00)',
  'Ca BK2 (08:00 - 16:00)',
  'Ca BK3 (18:00 - 02:00)',
  'Ca BK4 (10:00 - 18:00)',
  'Ca BK5 (07:30 - 15:30)',
] as const;

export interface ShiftTimeDef {
  name: string;
  start: string; // HH:mm
  end: string;   // HH:mm
}

export const SHIFT_TIME_DEFS: Record<string, ShiftTimeDef> = {
  'Ca HC (08:00 - 16:30)': { name: 'Ca HC', start: '08:00', end: '16:30' },
  'Ca 1 (06:00 - 14:00)': { name: 'Ca 1', start: '06:00', end: '14:00' },
  'Ca 2 (14:00 - 22:00)': { name: 'Ca 2', start: '14:00', end: '22:00' },
  'Ca 3 (22:00 - 06:00)': { name: 'Ca 3', start: '22:00', end: '06:00' },
  'Ca HC_V (07:00 - 15:30)': { name: 'Ca HC_V', start: '07:00', end: '15:30' },
  'Ca HC_V1 (06:30 - 15:00)': { name: 'Ca HC_V1', start: '06:30', end: '15:00' },
  'Ca HC_KT (07:30 - 16:00)': { name: 'Ca HC_KT', start: '07:30', end: '16:00' },
  'Ca LH (12:00 - 20:00)': { name: 'Ca LH', start: '12:00', end: '20:00' },
  'Ca BK1 (07:00 - 15:00)': { name: 'Ca BK1', start: '07:00', end: '15:00' },
  'Ca BK2 (08:00 - 16:00)': { name: 'Ca BK2', start: '08:00', end: '16:00' },
  'Ca BK3 (18:00 - 02:00)': { name: 'Ca BK3', start: '18:00', end: '02:00' },
  'Ca BK4 (10:00 - 18:00)': { name: 'Ca BK4', start: '10:00', end: '18:00' },
  'Ca BK5 (07:30 - 15:30)': { name: 'Ca BK5', start: '07:30', end: '15:30' },
};

export interface OvertimeMealMenu {
  id: string; // e.g. MENU-20261105-01
  date: string; // YYYY-MM-DD
  shiftTime: string; // e.g. "Sau ca chiều (16:30 - 18:30)", "Ca ngày", "Ca đêm", "Tất cả các ca"
  dishName: string; // Tên món ăn
  notes?: string; // Ghi chú
  createdAt: string;
  updatedAt?: string;
}

export interface OvertimeItem {
  id: string;
  employeeId: string; // MSNV
  employeeName: string; // Họ tên
  position: string; // Chức vụ
  team?: string; // Tổ
  department?: string; // Phòng ban / Xưởng
  shift: string; // Ca làm việc
  dayType: OvertimeDayType; // Ngày thường / Ngày nghỉ / Ngày lễ
  overtimeType: OvertimeCategory; // Sau ca / Trước ca / Không theo ca
  compensationType: OvertimeCompensation; // Tính lương / Nghỉ bù
  reasonType: OvertimeReasonType; // TC theo kế hoạch sản xuất / Khác
  customReason?: string; // Lý do khác tự nhập
  hours: number; // Số giờ thỏa thuận ban đầu
  fromTime: string; // Từ giờ (HH:mm)
  toTime: string; // Đến giờ (HH:mm)
  mealOption?: string; // Tên món ăn đã chọn hoặc 'Không áp dụng (< 2h)' hoặc 'Tự túc / Không ăn'
  
  // Xác nhận của người lao động
  employeeConfirmTime?: string; // Giờ xác nhận của NLĐ (e.g. '16:30 - 18:00')
  employeeConfirmHours?: number; // Số giờ thực tế NLĐ xác nhận
  employeeConfirmStatus: OvertimeConfirmStatus; // 'pending' | 'confirmed' | 'rejected'
  employeeConfirmNote?: string; // Ghi chú của NLĐ khi xác nhận/điều chỉnh
  employeeConfirmedAt?: string; // Thời gian bấm xác nhận

  // Duyệt của Trưởng bộ phận
  approvalStatus: OvertimeApprovalStatus; // 'pending' | 'approved' | 'rejected'
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNote?: string;
}

export interface OvertimeRegistration {
  id: string; // e.g. OT-20261105-001
  registrationDate: string; // Ngày đăng ký tăng ca (YYYY-MM-DD)
  createdDate: string; // Ngày gửi đơn (ISO string)
  createdById: string; // MSNV người tạo đơn
  createdByName: string; // Họ tên người tạo đơn
  createdRole: string; // Role / Chức vụ người tạo
  teamLeaderId?: string; // MSNV Tổ trưởng (nếu đăng ký theo tổ)
  teamLeaderName?: string; // Tên Tổ trưởng
  department: string; // Phòng ban / Xưởng
  notes?: string; // Ghi chú chung
  items: OvertimeItem[]; // Danh sách nhân viên trong đơn
  status: OvertimeApprovalStatus; // Trạng thái tổng quát của đơn
  createdAt: string;
  updatedAt: string;
}

// Helper: Calculate default From and To times based on shift, overtime type and hours
export function calculateOvertimeTimes(
  shift: string,
  overtimeType: OvertimeCategory,
  hours: number
): { fromTime: string; toTime: string } {
  const def = SHIFT_TIME_DEFS[shift] || { name: 'Ca HC', start: '08:00', end: '16:30' };
  const safeHours = Math.max(0.5, hours || 1.5);
  const hourMinutes = Math.round(safeHours * 60);

  if (overtimeType === 'sau_ca') {
    // Overtime begins at shift end
    const fromTime = def.end;
    const toTime = addMinutesToTimeString(def.end, hourMinutes);
    return { fromTime, toTime };
  } else if (overtimeType === 'truoc_ca') {
    // Overtime finishes at shift start
    const toTime = def.start;
    const fromTime = subtractMinutesFromTimeString(def.start, hourMinutes);
    return { fromTime, toTime };
  } else {
    // Không theo ca: default start at shift end or 08:00
    const fromTime = def.end || '16:30';
    const toTime = addMinutesToTimeString(fromTime, hourMinutes);
    return { fromTime, toTime };
  }
}

// Helper: Add minutes to HH:mm string
export function addMinutesToTimeString(timeStr: string, minutes: number): string {
  const [h, m] = (timeStr || '16:30').split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  const finalMinutes = total < 0 ? total + 24 * 60 : total;
  const newH = Math.floor(finalMinutes / 60);
  const newM = finalMinutes % 60;
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

// Helper: Subtract minutes from HH:mm string
export function subtractMinutesFromTimeString(timeStr: string, minutes: number): string {
  return addMinutesToTimeString(timeStr, -minutes);
}

// Helper: Calculate hours between fromTime and toTime
export function computeHoursBetween(fromTime: string, toTime: string): number {
  if (!fromTime || !toTime) return 0;
  const [h1, m1] = fromTime.split(':').map(Number);
  const [h2, m2] = toTime.split(':').map(Number);
  let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Overnight
  }
  const hours = Math.round((diffMinutes / 60) * 10) / 10;
  return hours;
}

// Helper: Check if current time is before 15h00 on the registered overtime date
export function checkEmployeeEditDeadline(registrationDate: string): {
  isEditable: boolean;
  deadlineText: string;
  reason?: string;
} {
  if (!registrationDate) {
    return { isEditable: false, deadlineText: '' };
  }

  // registrationDate is YYYY-MM-DD
  const parts = registrationDate.split('-');
  if (parts.length !== 3) {
    return { isEditable: true, deadlineText: '15:00' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  // Deadline: 15:00:00 of registrationDate
  const deadline = new Date(year, month, day, 15, 0, 0, 0);
  const now = new Date();

  const isEditable = now.getTime() < deadline.getTime();
  const deadlineText = `15:00 ngày ${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}/${year}`;

  return {
    isEditable,
    deadlineText,
    reason: isEditable ? undefined : `Đã quá thời hạn chỉnh sửa (${deadlineText})`,
  };
}
