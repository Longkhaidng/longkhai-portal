export type LeaveType =
  | 'phep_nam'
  | 'phep_om'
  | 'viec_rieng'
  | 'khong_luong'
  | 'thai_san'
  | 'nghi_bu'
  | 'khac';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApprovalStep {
  stepName: string; // "Tổ trưởng" | "Trưởng bộ phận" | "Bảo vệ" | "Kế toán" | "IT" ...
  roleRequired: string;
  approverId?: string; // Mã NV người duyệt
  approverName?: string; // Tên người duyệt
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string;
  signature?: string; // Tên / Chữ ký điện tử
  actionAt?: string; // ISO datetime
}

export interface LeaveRequest {
  id: string; // LR000001
  employeeId: string; // Mã NV
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  shift?: string; // Ca làm việc
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  fromTime?: string; // HH:mm
  toTime?: string; // HH:mm
  totalDays: number;
  reason: string;
  handoverPerson?: string; // Người nhận bàn giao công việc
  emergencyContact?: string; // Số điện thoại liên hệ
  cutMeal?: boolean; // Cắt cơm (không dùng cơm công ty trong thời gian nghỉ)
  status: LeaveStatus;
  currentStepIndex: number;
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

export const LEAVE_SHIFTS = [
  'Ca HC (08:00 - 16:30)',
  'Ca 1 (06:00 - 14:00)',
  'Ca 2 (14:00 - 22:00)',
  'Ca 3 (22:00 - 06:00)',
  'Ca HC_V (07:00 - 15:30)',
  'Ca HC_KT (07:30 - 16:00)',
  'Ca khác',
] as const;

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  phep_nam: 'Nghỉ phép năm',
  phep_om: 'Nghỉ ốm đau / Khám bệnh',
  viec_rieng: 'Nghỉ việc riêng (Hiếu, Hỷ...)',
  khong_luong: 'Nghỉ không hưởng lương',
  thai_san: 'Nghỉ thai sản / Khám thai',
  nghi_bu: 'Nghỉ bù tăng ca / Lễ',
  khac: 'Nghỉ lý do khác',
};
