export type GatePassStatus =
  | 'pending' // Chờ quản lý duyệt
  | 'approved' // Quản lý đã duyệt, phiếu có hiệu lực
  | 'departed' // Bảo vệ đã xác nhận ra cổng
  | 'completed' // Đã về lại công ty (hoặc phiếu đi một chiều hoàn tất)
  | 'rejected' // Bị từ chối
  | 'expired'; // Quá hạn mà không sử dụng

export type GatePassTimeType = 'nghi_dau_gio' | 'nghi_giua_gio' | 'nghi_cuoi_gio';
export type GatePassReasonCategory = 'ca_nhan' | 'cong_ty' | 'khac';

export const PERSONAL_REASONS = [
  'CN - Đi trễ/Về sớm',
  'CN - Ra vào trong giờ làm việc',
  'CN - Ra vào trong giờ nghỉ trưa',
  'CN - Vào làm và Ra dưới 2 tiếng',
  'CN - Nghỉ 1/2 ngày - đầu/sau',
  'CN - Nghỉ bù - trong giờ làm việc',
  'CN - Nghỉ bù 1/2 ngày đầu/sau',
  'CN - Ra & vào lại trong giờ tăng ca (NT)',
  'CN - Trễ/sớm & ra vào tăng ca (CN)',
] as const;

export interface GatePassAsset {
  id: string;
  name: string; // Tên thiết bị, mẫu hàng mang ra
  quantity: number;
  unit: string; // cái, bộ, kiện...
  serialNumber?: string;
  note?: string;
}

export interface GatePass {
  id: string; // GP000001
  employeeId: string;
  employeeName: string;
  department: string;
  purpose: string; // Lý do ra - vào cổng
  passType: 'business' | 'personal'; // Công tác hoặc Việc riêng
  timeType?: GatePassTimeType; // Nghỉ đầu giờ, nghỉ giữa giờ, nghỉ cuối giờ
  reasonCategory?: GatePassReasonCategory; // 'ca_nhan' | 'cong_ty' | 'khac'
  specificReason?: string; // Tên lý do cụ thể khi chọn Cá nhân
  customReason?: string; // Nội dung nhập khi chọn Lý do khác hoặc Công ty
  hasAssets: boolean;
  assets: GatePassAsset[];
  estimatedDepartureTime?: string; // ISO datetime (có khi nghỉ giữa giờ, nghỉ cuối giờ)
  estimatedReturnTime?: string; // ISO datetime (có khi nghỉ đầu giờ, nghỉ giữa giờ)
  actualDepartureTime?: string; // Giờ bảo vệ bấm xác nhận ra
  actualReturnTime?: string; // Giờ bảo vệ bấm xác nhận vào
  managerApproverId?: string;
  managerApproverName?: string;
  managerApprovedAt?: string;
  securityDepartureGuardId?: string;
  securityReturnGuardId?: string;
  status: GatePassStatus;
  rejectionReason?: string;
  qrCodeData: string; // Chuỗi token xác thực mã QR
  createdAt: string;
  updatedAt: string;
}
