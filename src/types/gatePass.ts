export type GatePassStatus =
  | 'pending' // Chờ quản lý duyệt
  | 'approved' // Quản lý đã duyệt, phiếu có hiệu lực
  | 'departed' // Bảo vệ đã xác nhận ra cổng
  | 'completed' // Đã về lại công ty (hoặc phiếu đi một chiều hoàn tất)
  | 'rejected' // Bị từ chối
  | 'expired'; // Quá hạn mà không sử dụng

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
  purpose: string; // Mục đích: Đi công tác ngoài xưởng, chuyển mẫu giao hàng, việc riêng...
  passType: 'business' | 'personal'; // Công tác hoặc Việc riêng
  hasAssets: boolean;
  assets: GatePassAsset[];
  estimatedDepartureTime: string; // ISO datetime
  estimatedReturnTime?: string; // ISO datetime (nếu có quay về)
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
