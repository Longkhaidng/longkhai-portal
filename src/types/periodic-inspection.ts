// ==========================================
// Periodic Inspection Types (Kiểm Tra Định Kỳ)
// Modules:
// 1. Tủ sơ cấp cứu (First Aid Kit)
// 2. Máy rửa mắt (Emergency Eyewash)
// 3. Hệ thống nước mưa (Stormwater System)
// 4. Nước ngầm và đất (Groundwater & Soil)
// ==========================================

export type PeriodicModuleType =
  | 'first_aid'
  | 'eyewash'
  | 'stormwater'
  | 'groundwater_soil';

// ------------------------------------------
// 1. Tủ sơ cấp cứu (First Aid Kit)
// ------------------------------------------
export interface FirstAidItemStandard {
  name: string;
  chuan: number;
  group: string;
}

export interface FirstAidInspection {
  id: string; // SCC-timestamp
  diaDiem: string; // 'Bếp' | 'Kho 1' | 'Kho 2' | 'Bảo vệ 1' | 'Bảo vệ 2' | 'Cơ điện' | 'Văn phòng'
  nguoiKT: string; // Họ tên (Mã NV)
  maNV: string;
  hoTen: string;
  boPhan: string;
  thoiGian: string; // Formatted date string (e.g. 2026-10-30 09:15)
  createdAt: string; // ISO string
  items: Record<string, number>; // { [itemName]: quantity }
  summaryStatus?: 'Đầy đủ' | 'Dư vật tư' | 'Thiếu vật tư';
  ghiChu?: string;
}

// ------------------------------------------
// 2. Máy rửa mắt (Emergency Eyewash)
// ------------------------------------------
export interface EyewashInspection {
  id: string; // MRM-timestamp
  diaDiem: string; // 'Kho Hóa chất' | 'Khu Phụ trợ' | 'Khu vực Sấy'
  nguoiKT: string;
  maNV: string;
  hoTen: string;
  boPhan: string;
  thoiGian: string;
  createdAt: string;
  items: Record<string, 'Đạt' | 'Không đạt'>;
  deXuat?: string;
  danhGiaTongQuat: 'Đạt' | 'Không đạt';
}

// ------------------------------------------
// 3. Hệ thống nước mưa (Stormwater System)
// ------------------------------------------
export interface StormwaterQuestionConfig {
  id: number;
  text: string;
  group?: string;
  dependsOn?: {
    qid: number;
    value: 'Có' | 'Không';
  };
}

export interface StormwaterAnswer {
  ketQua: 'Có' | 'Không';
  chiTiet?: string;
  ghiChu?: string;
}

export interface StormwaterInspection {
  id: string; // HTNM-timestamp
  nguoiKT: string;
  maNV: string;
  hoTen: string;
  boPhan: string;
  thoiGian: string;
  createdAt: string;
  answers: Record<string, StormwaterAnswer>; // id 1..12
  danhGiaTongQuat: 'Đạt' | 'Cần xử lý';
  ghiChuTongQuat?: string;
}

// ------------------------------------------
// 4. Nước ngầm và đất (Groundwater & Soil)
// ------------------------------------------
export interface GroundwaterSoilCriteria {
  id: number;
  text: string;
  group?: string;
}

export interface GroundwaterSoilAnswer {
  ketQua: 'Đạt' | 'Không đạt';
  lyDo?: string;
}

export interface GroundwaterSoilInspection {
  id: string; // NGD-timestamp
  nguoiKT: string;
  maNV: string;
  hoTen: string;
  boPhan: string;
  thoiGian: string;
  createdAt: string;
  answers: Record<string, GroundwaterSoilAnswer>; // id 1..8
  tongHop: {
    ketQuaSoBo: 'Đạt' | 'Không đạt';
    khuVucNghiNgo?: string;
    canLayMau: 'Có' | 'Không';
    khuyenNghi?: string;
  };
}
