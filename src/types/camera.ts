export interface CameraItem {
  id: string; // e.g. 'CAM_KNL_01'
  code: string; // e.g. 'CAM_KNL_01'
  name: string; // e.g. 'Cam Cửa nhập A1'
  zone: string; // e.g. 'Kho nguyên liệu'
  description?: string;
  ipAddress?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type CameraPurpose =
  | 'kiem_tra_su_viec'
  | 'dieu_tra_su_co'
  | 'mat_tai_san'
  | 'khac';

export const CAMERA_PURPOSE_LABELS: Record<CameraPurpose, string> = {
  kiem_tra_su_viec: 'Kiểm tra sự việc',
  dieu_tra_su_co: 'Điều tra sự cố',
  mat_tai_san: 'Mất tài sản',
  khac: 'Khác',
};

export type CameraRequestStatus =
  | 'pending_it' // Chờ IT duyệt (Bước 1)
  | 'pending_hr' // Chờ Trưởng phòng HCNS duyệt (Bước 2)
  | 'approved'   // Đã duyệt hoàn tất
  | 'rejected'   // Từ chối
  | 'cancelled'; // Đã hủy

export const CAMERA_STATUS_LABELS: Record<CameraRequestStatus, string> = {
  pending_it: 'Chờ IT duyệt',
  pending_hr: 'Chờ HCNS duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
};

export const CAMERA_STATUS_BADGES: Record<CameraRequestStatus, { bg: string; text: string; border: string }> = {
  pending_it: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
  },
  pending_hr: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
  },
  approved: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800/60',
  },
  rejected: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
  },
  cancelled: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export interface CameraApprovalStep {
  stepIndex: number;
  stepName: string; // '1. Bộ phận IT kiểm tra & duyệt' | '2. Trưởng phòng HCNS phê duyệt'
  roleRequired: 'it' | 'hr';
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  comment?: string;
  actionAt?: string;
}

export interface CameraRequest {
  id: string; // CAM_001, CAM_002...
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  purpose: CameraPurpose;
  purposeDetail?: string;
  cameraIds: string[];
  cameraNames: string[];
  targetDate: string; // YYYY-MM-DD
  fromTime: string; // HH:mm
  toTime: string; // HH:mm
  reason: string;
  status: CameraRequestStatus;
  currentStepIndex: number;
  steps: CameraApprovalStep[];
  rejectionReason?: string;
  rejectedBy?: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_CAMERAS: CameraItem[] = [
  {
    id: 'CAM_KNL_01',
    code: 'CAM_KNL_01',
    name: 'Cam Cửa nhập A1',
    zone: 'Kho nguyên liệu',
    description: 'Khu vực cửa bốc dỡ hàng nguyên vật liệu A1',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_KNL_02',
    code: 'CAM_KNL_02',
    name: 'Cam Kệ hàng Pallet A',
    zone: 'Kho nguyên liệu',
    description: 'Dãy pallet hàng A1 - A12',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_KNL_03',
    code: 'CAM_KNL_03',
    name: 'Cam Khu vực Cân tải',
    zone: 'Kho nguyên liệu',
    description: 'Bàn cân điện tử 5 tấn kho nguyên liệu',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_KTP_01',
    code: 'CAM_KTP_01',
    name: 'Cam Cửa xuất hàng B1',
    zone: 'Kho thành phẩm',
    description: 'Cửa bốc dỡ xe container B1 kho thành phẩm',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_KTP_02',
    code: 'CAM_KTP_02',
    name: 'Cam Khu quấn màng Pallet',
    zone: 'Kho thành phẩm',
    description: 'Khu máy quấn màng tự động thành phẩm',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_SX_01',
    code: 'CAM_SX_01',
    name: 'Cam Xưởng Ép - Line 1',
    zone: 'Khu vực sản xuất',
    description: 'Dây chuyền máy ép hạt số 1 xưởng sản xuất',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_SX_02',
    code: 'CAM_SX_02',
    name: 'Cam Xưởng Ép - Line 2',
    zone: 'Khu vực sản xuất',
    description: 'Dây chuyền máy ép hạt số 2 xưởng sản xuất',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_AN_01',
    code: 'CAM_AN_01',
    name: 'Cam Bãi giữ xe máy NV',
    zone: 'Khu vực an ninh / Nhà xe',
    description: 'Toàn cảnh bãi xe máy nhân viên',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_AN_02',
    code: 'CAM_AN_02',
    name: 'Cam Cổng chính & Chốt bảo vệ',
    zone: 'Khu vực an ninh / Nhà xe',
    description: 'Cổng ra vào kiểm soát bảo vệ nhà máy',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_HC_01',
    code: 'CAM_HC_01',
    name: 'Cam Nhà ăn công nhân',
    zone: 'Hành chính - Đời sống',
    description: 'Khu vực phòng ăn và phân phát suất ăn',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'CAM_HC_02',
    code: 'CAM_HC_02',
    name: 'Cam Sảnh lễ tân & Văn phòng',
    zone: 'Hành chính - Đời sống',
    description: 'Sảnh chính đón tiếp khách và khối văn phòng',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

export const INITIAL_CAMERA_REQUESTS: CameraRequest[] = [
  {
    id: 'CAM_002',
    employeeId: 'TBP_SX',
    employeeName: 'Phạm Văn Thắng',
    department: 'Bộ phận Sản xuất',
    position: 'Trưởng phòng Sản xuất',
    purpose: 'dieu_tra_su_co',
    cameraIds: ['CAM_SX_01'],
    cameraNames: ['Cam Xưởng Ép - Line 1'],
    targetDate: '2026-09-09',
    fromTime: '14:00',
    toTime: '15:30',
    reason: 'Điều tra sự cố kẹt băng tải máy ép line 1 trong ca làm việc chiều ngày 09/09/2026.',
    status: 'approved',
    currentStepIndex: 2,
    createdAt: '2026-09-09T08:30:00.000Z',
    updatedAt: '2026-09-09T10:00:00.000Z',
    steps: [
      {
        stepIndex: 0,
        stepName: 'Bộ phận IT kiểm tra & duyệt',
        roleRequired: 'it',
        status: 'approved',
        approverId: '2265',
        approverName: 'Trần Lê Hữu Lực',
        comment: 'Dữ liệu camera line 1 ghi hình sắc nét, đã trích xuất sẵn sàng.',
        actionAt: '2026-09-09T09:15:00.000Z',
      },
      {
        stepIndex: 1,
        stepName: 'Trưởng phòng HCNS phê duyệt',
        roleRequired: 'hr',
        status: 'approved',
        approverId: '1867',
        approverName: 'Trần Thị Kim Loan',
        comment: 'Đồng ý cho xem dữ liệu tại phòng IT.',
        actionAt: '2026-09-09T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'CAM_004',
    employeeId: '1008',
    employeeName: 'Đoàn Thị Thanh Xuân',
    department: 'Phòng Kế Toán',
    position: 'Nhân viên',
    purpose: 'kiem_tra_su_viec',
    cameraIds: ['CAM_AN_01'],
    cameraNames: ['Cam Bãi giữ xe máy NV'],
    targetDate: '2026-09-10',
    fromTime: '07:00',
    toTime: '07:45',
    reason: 'Kiểm tra va quẹt xe máy tại vị trí dãy số 3 bãi xe sáng 10/09/2026.',
    status: 'pending_it',
    currentStepIndex: 0,
    createdAt: '2026-09-10T08:00:00.000Z',
    updatedAt: '2026-09-10T08:00:00.000Z',
    steps: [
      {
        stepIndex: 0,
        stepName: 'Bộ phận IT kiểm tra & duyệt',
        roleRequired: 'it',
        status: 'pending',
      },
      {
        stepIndex: 1,
        stepName: 'Trưởng phòng HCNS phê duyệt',
        roleRequired: 'hr',
        status: 'pending',
      },
    ],
  },
];
