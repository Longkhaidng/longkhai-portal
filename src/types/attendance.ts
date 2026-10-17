import { ApprovalStep } from './leave';

export type AttendanceIssueType = 'mat_the' | 'quen_the' | 'the_hong';

export type AttendanceStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceConfirm {
  id: string; // ATT000001
  employeeId: string;
  employeeName: string;
  department: string;
  issueType: AttendanceIssueType;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime: string; // HH:mm
  shift: string; // Ca 1 (06:00 - 14:00), Ca 2 (14:00 - 22:00), Ca HC (07:30 - 16:30)...
  reason: string;
  status: AttendanceStatus;
  currentStepIndex: number;
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

export const ISSUE_TYPE_LABELS: Record<AttendanceIssueType, { text: string; badge: string }> = {
  mat_the: { text: 'Mất thẻ', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  quen_the: { text: 'Quên mang thẻ', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  the_hong: { text: 'Thẻ hỏng / lỗi', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
};
