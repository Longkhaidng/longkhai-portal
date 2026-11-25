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

export interface ProposalAttachment {
  id: string;
  name: string;
  size: number; // bytes
  type: string; // 'image/png' | 'image/jpeg' | 'application/pdf' ...
  data: string; // Base64 data URL string (trống nếu đã quá hạn 7 ngày và bị xóa)
  uploadedAt: string; // ISO date string
  expiresAt: string; // ISO date string (tự động xóa sau 7 ngày)
  isExpired?: boolean;
}

export const ATTACHMENT_MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
export const ATTACHMENT_EXPIRY_DAYS = 7;
export const ATTACHMENT_EXPIRY_MS = ATTACHMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export function isProposalAttachmentExpired(att: { uploadedAt?: string; expiresAt?: string; isExpired?: boolean }): boolean {
  if (!att) return true;
  if (att.isExpired) return true;
  const now = Date.now();
  if (att.expiresAt) {
    return now >= new Date(att.expiresAt).getTime();
  }
  if (att.uploadedAt) {
    return now >= new Date(att.uploadedAt).getTime() + ATTACHMENT_EXPIRY_MS;
  }
  return false;
}

export function getProposalAttachmentRemainingText(att: { uploadedAt?: string; expiresAt?: string }): string {
  if (!att.uploadedAt && !att.expiresAt) return 'Đã hết hạn';
  const expiresAt = att.expiresAt
    ? new Date(att.expiresAt).getTime()
    : new Date(att.uploadedAt!).getTime() + ATTACHMENT_EXPIRY_MS;
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Đã tự động xóa sau 7 ngày';
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày (tự xóa)`;
}

export interface RepairProposal {
  id: string; // SC26-0001
  employeeId: string;
  employeeName: string;
  department: string; // Vị trí công tác thực tế của nhân viên trên hệ thống (Tổ / Bộ phận)
  location: string; // Khu vực: vị trí thiết bị bị hỏng (bắt buộc)
  issueDescription: string; // Tình trạng sự việc (bắt buộc)
  proposedSolution?: string; // Đề xuất hướng khắc phục (không bắt buộc)
  attachments?: ProposalAttachment[]; // Tệp đính kèm (ảnh, PDF < 1MB, tự xóa sau 7 ngày)

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
