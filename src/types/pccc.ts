export type PCCCCategory =
  | 'binh_bot' // 1. Bình Bột (33 thiết bị)
  | 'binh_co2' // 2. Bình CO2 (45 thiết bị)
  | 'nut_chuong' // 3. Nút & Chuông (12 thiết bị)
  | 'tu_voi_vach' // 4. Tủ Vòi Vách (19 thiết bị)
  | 'tram_bom' // 5. Trạm Bơm (1 thiết bị)
  | 'tu_trung_tam'; // 6. Tủ Trung Tâm (1 thiết bị)

export interface PCCCCategoryInfo {
  id: PCCCCategory;
  index: number;
  name: string;
  badgeTitle: string;
  shortName: string;
  count: number;
  iconName: string; // 'FireExtinguisher' | 'Snowflake' | 'Bell' | 'Truck' | 'Cog' | 'Monitor'
  color: string;
}

export const PCCC_CATEGORIES: Record<PCCCCategory, PCCCCategoryInfo> = {
  binh_bot: {
    id: 'binh_bot',
    index: 1,
    name: 'Bình Bột',
    badgeTitle: 'Bình Bột Chữa Cháy',
    shortName: 'Bình Bột',
    count: 33,
    iconName: 'Flame',
    color: 'text-rose-600',
  },
  binh_co2: {
    id: 'binh_co2',
    index: 2,
    name: 'Bình CO2',
    badgeTitle: 'Bình Khí CO2',
    shortName: 'Bình CO2',
    count: 45,
    iconName: 'Snowflake',
    color: 'text-sky-600',
  },
  nut_chuong: {
    id: 'nut_chuong',
    index: 3,
    name: 'Báo Cháy',
    badgeTitle: 'Tổ Hợp Nút & Chuông Báo Cháy',
    shortName: 'Nút & Chuông',
    count: 12,
    iconName: 'Bell',
    color: 'text-amber-500',
  },
  tu_voi_vach: {
    id: 'tu_voi_vach',
    index: 4,
    name: 'Tủ Vách Tường',
    badgeTitle: 'Tủ Vòi Chữa Cháy Vách Tường',
    shortName: 'Tủ Vòi Vách',
    count: 19,
    iconName: 'Box',
    color: 'text-red-500',
  },
  tram_bom: {
    id: 'tram_bom',
    index: 5,
    name: 'Trạm Bơm',
    badgeTitle: 'Trạm Bơm PCCC Định Kỳ',
    shortName: 'Trạm Bơm',
    count: 1,
    iconName: 'Cog',
    color: 'text-slate-700',
  },
  tu_trung_tam: {
    id: 'tu_trung_tam',
    index: 6,
    name: 'Tủ Trung Tâm',
    badgeTitle: 'Tủ Điều Khiển Báo Cháy Trung Tâm',
    shortName: 'Tủ Trung Tâm',
    count: 1,
    iconName: 'Monitor',
    color: 'text-blue-700',
  },
};

export interface PCCCDevice {
  id: string; // e.g. 'HT-CO2-01', 'HT-BOT-01'
  name: string; // e.g. 'Bình chữa cháy CO2 MT3 số 01'
  category: PCCCCategory;
  location: string; // e.g. 'PXHT - Khu vực đóng kiện'
  specs: string; // Chuẩn kỹ thuật, e.g. '10 kg', '4.0 kg'
  inspectionExpiry: string; // e.g. '2026-12-20' or '20/12/2026'
  qrCode?: string;
  notes?: string;
  lastInspection?: {
    status: 'pass' | 'fail';
    date: string; // '2026-09-30 09:09:46'
    inspectorId: string;
    inspectorName: string;
    lossPercent?: number;
    notes?: string;
  };
}

// 1. Checklist Bình Bột
export interface BinhBotChecklist {
  standardWeight: number; // default 4.0 kg
  pressureGauge: 'normal' | 'low' | 'high'; // Xanh: Đủ áp | Đỏ: Tụt áp | Vàng: Quá áp
  nozzleHose: 'pass' | 'fail'; // ĐẠT | HỎNG (Không nứt vỡ, không biến dạng)
  safetyPinSeal: 'pass' | 'fail'; // ĐẠT | HỎNG (Còn nguyên niêm phong, chưa bị giật)
}

// 2. Checklist Bình CO2
export interface BinhCO2Checklist {
  standardGrossWeight: number; // Cả vỏ chuẩn, e.g. 10 kg
  actualWeight: number; // Cân thực tế
  gasLossPercent: number; // Tỷ lệ hao hụt (%)
  isLossAcceptable: boolean; // Quy chuẩn HSE <= 10%
  co2Nozzle: 'pass' | 'fail'; // Loa to chịu lạnh, không nứt vỡ
  safetyPinSeal: 'pass' | 'fail'; // Cụm mỏ vịt nguyên vẹn
}

// 3. Checklist Nút & Chuông
export interface NutChuongChecklist {
  subType: string; // 'Tổ hợp Chuông/Đèn/Nút'
  emergencyButton: 'pass' | 'fail'; // Kính/màng bảo vệ, nút ấn nhạy (Đạt / K.Đạt)
  bellSiren: 'pass' | 'fail'; // Âm lượng to rõ, không rè tiếng (Đạt / K.Đạt)
  locationLight: 'pass' | 'fail'; // Đèn LED đỏ sáng bình thường (Đạt / K.Đạt)
  resetSwitch: 'pass' | 'fail'; // Phục hồi trạng thái bình thường tốt (Đạt / K.Đạt)
}

// 4. Checklist Tủ Vòi Vách
export interface TuVoiVachChecklist {
  angleValve: 'pass' | 'fail'; // Có nước, van đóng mở trơn tru (Đạt / K.Đạt)
  hoseLeak: 'pass' | 'fail'; // Vải bạt không rách, không mục (Đạt / Rò rỉ)
  hoseCoupling: 'pass' | 'fail'; // Ron cao su kín, ngàm không móp (Đạt / Hỏng)
  nozzleAvailability: 'pass' | 'fail'; // Đầy đủ số lượng trong tủ (Đạt / Thiếu)
  nozzleCoupling: 'pass' | 'fail'; // Khớp nối lắp vừa khít cuộn vòi (Đạt / K.Đạt)
}

// 5. Checklist Trạm Bơm
export interface TramBomChecklist {
  electricalControl: 'pass' | 'fail'; // Đủ 3 pha, chế độ Auto sẵn sàng (Đạt / Lỗi)
  mainPump1: 'pass' | 'fail'; // Khởi động êm, không quá nhiệt (Đạt / Lỗi)
  mainPump2: 'pass' | 'fail'; // Khởi động êm, không quá nhiệt (Đạt / Lỗi)
  jockeyPump: 'pass' | 'fail'; // Tự ngắt khi đủ áp lực cài đặt (Đạt / Lỗi)
  pressureGauge: 'pass' | 'fail'; // Duy trì đủ áp lực (7 - 9 bar) (Đạt / Tụt áp)
  waterLevel: 'pass' | 'fail'; // Đầy bể (>90% dung tích) (Đạt / Cạn)
}

// 6. Checklist Tủ Trung Tâm
export interface TuTrungTamChecklist {
  // Trạng thái đèn báo & nguồn
  acPowerLight: 'pass' | 'fail'; // 1. Đèn nguồn AC (Xanh) (Đạt / Lỗi)
  zoneDisplayLight: 'pass' | 'fail'; // 2. Đèn hiển thị Zone (Đạt / Lỗi)
  alarmLight: 'pass' | 'fail'; // 3. Đèn báo cháy tổng (Đạt / Lỗi)
  faultLight: 'pass' | 'fail'; // 4. Đèn báo lỗi hệ thống (B.Thường / Báo Lỗi)
  // Công tắc vận hành & ắc quy
  batterySwitch: 'pass' | 'fail'; // 5. Công tắc bình điện (Đạt / Lỗi)
  alarmSwitch: 'pass' | 'fail'; // 6. Công tắc còi báo động (Đạt / Lỗi)
  testSwitch: 'pass' | 'fail'; // 7. Công tắc Test cháy (Đạt / Lỗi)
  backupBattery: 'pass' | 'fail'; // 8. Ắc quy dự phòng (24VDC) (Đạt / Yếu)
}

export type PCCCChecklistDetails =
  | { type: 'binh_bot'; data: BinhBotChecklist }
  | { type: 'binh_co2'; data: BinhCO2Checklist }
  | { type: 'nut_chuong'; data: NutChuongChecklist }
  | { type: 'tu_voi_vach'; data: TuVoiVachChecklist }
  | { type: 'tram_bom'; data: TramBomChecklist }
  | { type: 'tu_trung_tam'; data: TuTrungTamChecklist };

export interface PCCCInspection {
  id: string; // e.g. 'INSP-20261028-001'
  deviceId: string; // 'HT-CO2-01'
  deviceName: string; // 'Bình chữa cháy CO2 MT3 số 01'
  category: PCCCCategory;
  location: string;
  inspectorId: string;
  inspectorName: string;
  inspectedAt: string; // '2026-09-30 09:09:46'
  overallResult: 'pass' | 'fail'; // ĐẠT TIÊU CHUẨN | KHÔNG ĐẠT / HỎNG
  notes?: string; // Ghi Chú / Đề Xuất Khắc Phục
  checklist: PCCCChecklistDetails;
  createdAt: string;
}
