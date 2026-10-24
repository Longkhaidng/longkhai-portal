export * from './repair';
import { RepairProposal, RepairProposalStatus } from './repair';

export interface StationeryItem {
  id: string; // Mã VPP, e.g. 'VPP-001', 'GIAY-A4-70', 'BUT-BI-XANH'
  name: string; // Tên văn phòng phẩm
  unit: string; // Đơn vị tính: Cây, Ram, Hộp, Cuộn, Cái...
  category?: string; // Nhóm VPP
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StationeryProposalItem {
  itemId: string; // Mã VPP
  itemName: string; // Tên VPP
  unit: string; // ĐVT
  quantity: number; // Số lượng đặt hàng
  notes?: string; // Ghi chú riêng từng món
}

export type StationeryProposalStatus =
  | 'pending_hr' // Bước 2: Chờ nhân viên HCNS (1139) duyệt
  | 'pending_manager' // Bước 3: Chờ Trưởng phòng HCNS (1867) duyệt
  | 'completed' // Đã hoàn thành cấp phát
  | 'rejected'; // Bị từ chối

export interface StationeryStep {
  step: 1 | 2 | 3;
  title: string;
  subTitle?: string;
  roleRequired: 'employee' | 'hr' | 'manager';
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  updatedAt?: string;
  comment?: string;
}

export interface StationeryProposal {
  id: string; // VPP26-0001
  employeeId: string;
  employeeName: string;
  department: string;
  items: StationeryProposalItem[];
  notes?: string;

  // Bước 2: Người nhận mặc định (Nhân viên HCNS 1139 - Võ Thị Tuyết)
  receiverStaffId: string; // '1139'
  receiverStaffName: string; // 'Võ Thị Tuyết'
  receiverStaffEmail?: string;
  receiverApprovedAt?: string;
  receiverComment?: string;

  // Bước 3: Trưởng phòng HCNS (1867 - Trương Anh Như Quỳnh)
  managerId?: string; // '1867'
  managerName?: string; // 'Trương Anh Như Quỳnh'
  managerEmail?: string;
  managerApprovedAt?: string;
  managerComment?: string;

  // Từ chối (nếu có)
  status: StationeryProposalStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;

  steps: StationeryStep[];
  currentStepIndex: number;

  createdAt: string;
  updatedAt: string;

  emailRelayUrl?: string;
  emailConfig?: any;
}

export const STATIONERY_STATUS_LABELS: Record<StationeryProposalStatus, string> = {
  pending_hr: 'Chờ NV HCNS (1139) duyệt',
  pending_manager: 'Chờ Trưởng phòng HCNS duyệt',
  completed: 'Đã hoàn tất',
  rejected: 'Bị từ chối',
};

export const STATIONERY_STATUS_BADGES: Record<
  StationeryProposalStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  pending_hr: {
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Chờ NV HCNS (1139) duyệt',
  },
  pending_manager: {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Chờ TP HCNS duyệt',
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

// --- GENERAL PROPOSAL (ĐỀ XUẤT KHÁC) ---
export type GeneralProposalStatus =
  | 'pending_receiver' // Bước 2: Chờ bộ phận tiếp nhận xử lý
  | 'pending_manager' // Bước 3: Chờ trưởng bộ phận tiếp nhận duyệt
  | 'completed' // Đã hoàn tất
  | 'rejected'; // Bị từ chối

export interface GeneralStep {
  step: 1 | 2 | 3;
  title: string;
  subTitle?: string;
  roleRequired: 'employee' | 'receiver' | 'manager';
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  updatedAt?: string;
  comment?: string;
}

export interface GeneralProposal {
  id: string; // DK26-0001
  employeeId: string;
  employeeName: string;
  department: string;
  title: string; // Tiêu đề yêu cầu đề xuất
  content: string; // Nội dung chi tiết đề xuất

  // Người / Bộ phận tiếp nhận được chọn
  receiverDepartment: string; // e.g. "Bộ Phận CNTT", "Phòng HCNS", "Cơ điện"...
  receiverUserId?: string; // e.g. "2265", "1867"...
  receiverUserName?: string;
  receiverUserEmail?: string;
  receiverNotes?: string;
  receiverProcessedAt?: string;

  // Trưởng bộ phận của bộ phận tiếp nhận
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  managerApprovedAt?: string;
  managerComment?: string;

  status: GeneralProposalStatus;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;

  steps: GeneralStep[];
  currentStepIndex: number;

  createdAt: string;
  updatedAt: string;

  emailRelayUrl?: string;
  emailConfig?: any;
}

export const GENERAL_STATUS_LABELS: Record<GeneralProposalStatus, string> = {
  pending_receiver: 'Chờ bộ phận tiếp nhận',
  pending_manager: 'Chờ Trưởng BP duyệt',
  completed: 'Đã hoàn tất',
  rejected: 'Bị từ chối',
};

export const GENERAL_STATUS_BADGES: Record<
  GeneralProposalStatus,
  { bg: string; text: string; border: string; label: string }
> = {
  pending_receiver: {
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Chờ tiếp nhận xử lý',
  },
  pending_manager: {
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Chờ Trưởng BP duyệt',
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
