// ==========================================
// Gas System Inspection Types (Kiểm tra hệ thống Gas)
// Công ty Cổ phần Long Khải tại Đà Nẵng
// ==========================================

export type GasCylinderStatus =
  | 'good' // Tốt, đạt chuẩn an toàn
  | 'rusty' // Rỉ sét vỏ bình
  | 'dented' // Móp méo, biến dạng
  | 'expired' // Hết hạn kiểm định vỏ bình
  | 'leaking'; // Nghi ngờ rò rỉ khí

export interface GasCylinderItem {
  id: string;
  serialNumber: string; // Mã số bình gas (ví dụ: VT-09281, GAS-45-01)
  weightKg?: string | number; // Loại bình (ví dụ: 45kg, 12kg)
  expiryDate?: string; // Hạn kiểm định vỏ bình (ví dụ: 12/2028)
  status: GasCylinderStatus;
  notes?: string;
}

export type InspectionCheckStatus = 'pass' | 'fail';

export interface ValvesHosesRegulatorsCheck {
  valvesStatus: InspectionCheckStatus; // Van khóa tổng và các van nhánh
  hosesStatus: InspectionCheckStatus; // Dây dẫn cao áp / dây mềm chịu nhiệt
  regulatorStatus: InspectionCheckStatus; // Bộ điều áp (Regulator) & đồng hồ áp kế
  status: InspectionCheckStatus; // Đánh giá chung cụm van - dây - bộ điều áp
  notes?: string;
}

export interface LeakageCheck {
  status: InspectionCheckStatus; // 'pass': Kín tuyệt đối, không rò rỉ; 'fail': Phát hiện rò rỉ
  method: 'soap_bubble' | 'detector' | 'pressure_drop' | 'other'; // Bọt xà phòng / Máy đo khí / Đồng hồ tụt áp
  leakLocation?: string; // Vị trí rò rỉ (nếu có)
  notes?: string;
}

export interface DetectorSensitivityCheck {
  status: InspectionCheckStatus; // 'pass': Đầu dò nhạy tốt; 'fail': Kém nhạy / hỏng cảm biến
  responseTimeSeconds?: number; // Thời gian phản ứng (giây)
  notes?: string;
}

export interface AlarmAndAutoValveCheck {
  alarmHornStatus: InspectionCheckStatus; // Còi báo động (Hú rõ / hỏng)
  alarmStrobeStatus: InspectionCheckStatus; // Đèn chớp cảnh báo (Sáng chớp rõ / hỏng)
  autoShutoffValveStatus: InspectionCheckStatus; // Van ngắt tự động (Solenoid valve)
  status: InspectionCheckStatus; // Đánh giá chung hệ thống cảnh báo & ngắt an toàn
  notes?: string;
}

export interface GasInspectionChecklist {
  valvesHosesRegulators: ValvesHosesRegulatorsCheck;
  leakageCheck: LeakageCheck;
  detectorSensitivity: DetectorSensitivityCheck;
  alarmAndAutoValve: AlarmAndAutoValveCheck;
}

export interface GasInspectorInfo {
  id: string; // MSNV người kiểm tra
  name: string; // Họ và tên đầy đủ
  department: string; // Phòng ban / Đơn vị
  phone?: string; // Số điện thoại liên hệ
  signature?: string; // Chữ ký tay (Base64) hoặc chữ ký điện tử xác thực
  signedAt: string; // Thời điểm ký xác nhận
}

export interface GasOperatorConfirmation {
  name: string; // Họ tên người vận hành gas của Công ty
  empId?: string; // Mã nhân viên
  department?: string; // Phòng ban (ví dụ: Cơ điện / Bảo trì)
  phone?: string;
  confirmed: boolean; // Đã xác nhận nghiệm thu
  confirmedAt?: string; // Thời gian xác nhận
  signature?: string;
  notes?: string;
}

export interface GasSupplierRepresentative {
  company: string; // Tên đơn vị thay gas / bảo trì
  representativeName: string; // Đại diện đơn vị thay gas
  phone?: string;
  confirmed: boolean;
  confirmedAt?: string;
  signature?: string;
  notes?: string;
}

export interface KitchenConfirmation {
  staffName: string; // Tên người đại diện Bếp xác nhận
  empId?: string; // MSNV Bếp
  department?: string; // Thường là 'Nhà Bếp' / 'Bếp ăn'
  confirmed: boolean; // Bếp xác nhận tình trạng người kiểm tra đã thực hiện đầy đủ
  confirmedAt?: string;
  signature?: string;
  notes?: string;
}

export interface GasInspectionRecord {
  id: string; // Mã phiếu: GAS26-0001
  stationId: string; // Trạm gas (ví dụ: GAS-STATION-BEP)
  stationName: string; // Tên trạm gas (ví dụ: Trạm Gas Nhà Bếp)
  
  // 1. Ngày, giờ kiểm tra (Ghi nhận thực tế khi quét mã QR để kiểm tra)
  scanTimestamp: string; // ISO string thời điểm quét mã QR
  isQrScanned: boolean; // true nếu mở bằng cách quét mã QR thực tế
  
  // 2. Tên đơn vị thay gas/bảo trì
  supplierName: string;
  
  // 3. Người vận hành gas của Công ty
  companyOperatorName: string;
  companyOperatorCode?: string;

  // 4. Mã số bình gas, tình trạng bình
  cylinders: GasCylinderItem[];

  // 5, 6, 7, 8. Checklist kiểm tra van, dây dẫn, bộ điều áp, độ kín, đầu dò, còi đèn van ngắt
  checklist: GasInspectionChecklist;

  // 9. Hình ảnh trước và sau kiểm tra
  photosBefore: string[]; // Base64 data URLs
  photosAfter: string[]; // Base64 data URLs

  // 10. Các lỗi phát hiện và biện pháp khắc phục
  issuesFound?: string; // Lỗi phát hiện
  remedialActions?: string; // Biện pháp khắc phục

  // Đánh giá chung
  overallResult: 'pass' | 'warning' | 'fail';

  // 11. Xác nhận của người vận hành và đại diện đơn vị thay gas
  operatorConfirmation: GasOperatorConfirmation;
  supplierRepresentative: GasSupplierRepresentative;

  // 12. Người kiểm tra - thông tin đầy đủ
  inspector: GasInspectorInfo;

  // 13. Bếp xác nhận tình trạng người kiểm tra đã thực hiện đầy đủ
  kitchenConfirmation: KitchenConfirmation;

  // Trạng thái phiếu
  status: 'completed' | 'pending_kitchen' | 'draft';
  
  createdAt: string;
  updatedAt: string;
}

export interface GasStation {
  id: string;
  code: string;
  name: string;
  location: string;
  description: string;
  activeCylindersCount: number;
  qrPayload: string;
}

export const DEFAULT_GAS_STATIONS: GasStation[] = [
  {
    id: 'GAS-STATION-01',
    code: 'TRAM-GAS-BEP',
    name: 'Trạm Gas Nhà Bếp (Khu Vực Nấu Ăn)',
    location: 'Khu vực bếp ăn tập thể - Cụm cấp gas công nghiệp',
    description: 'Trạm cấp khí gas hóa lỏng LPG phục vụ bếp nấu công nhân viên',
    activeCylindersCount: 8,
    qrPayload: 'https://longkhai-portal.vercel.app/?tab=gas_inspection&scan=true&stationId=GAS-STATION-01',
  },
  {
    id: 'GAS-STATION-02',
    code: 'KHO-GAS-TRUNG-TAM',
    name: 'Kho Chứa Bình Gas Dự Phòng & Vỏ Bình',
    location: 'Khu vực kho ngoài trời có mái che thông thoáng - Cổng phụ',
    description: 'Khu lưu trữ bình gas đầy và vỏ bình chờ đơn vị cung cấp đổi',
    activeCylindersCount: 12,
    qrPayload: 'https://longkhai-portal.vercel.app/?tab=gas_inspection&scan=true&stationId=GAS-STATION-02',
  },
  {
    id: 'GAS-STATION-03',
    code: 'CUM-DIEU-AP-GAS',
    name: 'Cụm Van Phân Phối & Bộ Điều Áp Trung Tâm',
    location: 'Tủ kỹ thuật gas trung tâm',
    description: 'Bộ giảm áp 2 cấp, hệ thống van an toàn và tủ điều khiển báo rò rỉ gas',
    activeCylindersCount: 4,
    qrPayload: 'https://longkhai-portal.vercel.app/?tab=gas_inspection&scan=true&stationId=GAS-STATION-03',
  },
];
