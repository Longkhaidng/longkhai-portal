export type RepairProposalStatus =
  | 'pending_manager' // Bước 2: Chờ Trưởng bộ phận duyệt
  | 'maintenance_pending' // Bước 3: Trưởng BP đã duyệt, Chờ Cơ điện sửa chữa
  | 'pending_confirmation' // Bước 4: Cơ điện đã sửa xong, Chờ người đề xuất xác nhận hoàn tất
  | 'completed' // Bước 4 hoàn tất: Người đề xuất đã xác nhận xong
  | 'rejected'; // Bị từ chối

export interface RepairStep {
  step: 1 | 2 | 3 | 4;
  title: string;
  subTitle?: string;
  roleRequired: 'employee' | 'manager' | 'maintenance' | 'creator';
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  updatedAt?: string;
  comment?: string;
}

export interface RepairProposal {
  id: string; // SC26-0001
  employeeId: string;
  employeeName: string;
  department: string; // Vị trí công tác thực tế của nhân viên trên hệ thống (Tổ / Bộ phận)
  location: string; // Khu vực: vị trí thiết bị bị hỏng (bắt buộc)
  issueDescription: string; // Tình trạng sự việc (bắt buộc)
  proposedSolution?: string; // Đề xuất hướng khắc phục (không bắt buộc)

  // Trưởng bộ phận duyệt (Bước 2)
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerApprovedAt?: string;
  managerComment?: string;

  // Cơ điện sửa chữa (Bước 3)
  maintenanceStaffId?: string;
  maintenanceStaffName?: string;
  maintenanceStartedAt?: string;
  maintenanceCompletedAt?: string;
  maintenanceNotes?: string;

  // Người đề xuất xác nhận hoàn tất (Bước 4)
  creatorConfirmedAt?: string;
  creatorFeedback?: string;

  // Từ chối (nếu có)
  status: RepairProposalStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;

  // Trình tự 4 bước
  steps: RepairStep[];
  currentStepIndex: number;

  createdAt: string;
  updatedAt: string;

  // Email Relay & Forwarding metadata
  emailRelayUrl?: string;
  emailConfig?: {
    googleScriptUrl?: string;
    senderName?: string;
    portalBaseUrl?: string;
  };
}

export const REPAIR_STATUS_LABELS: Record<RepairProposalStatus, string> = {
  pending_manager: 'Chờ Trưởng BP duyệt',
  maintenance_pending: 'Chờ Cơ điện sửa chữa',
  pending_confirmation: 'Chờ bạn xác nhận hoàn tất',
  completed: 'Đã hoàn tất',
  rejected: 'Bị từ chối',
};

export const REPAIR_STATUS_BADGES: Record<
  RepairProposalStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  pending_manager: {
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Chờ Trưởng BP duyệt',
  },
  maintenance_pending: {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Chờ Cơ điện sửa chữa',
  },
  pending_confirmation: {
    bg: 'bg-purple-500/10 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    label: 'Chờ bạn xác nhận hoàn tất',
  },
  completed: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    label: 'Đã hoàn tất',
  },
  rejected: {
    bg: 'bg-rose-500/10 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    label: 'Bị từ chối',
  },
};
