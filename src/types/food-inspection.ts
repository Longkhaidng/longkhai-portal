export type FoodInspectionStepKey =
  | 'STEP1_FRESH'
  | 'STEP1_DRY'
  | 'STEP2_COOKING'
  | 'STEP3_SERVING'
  | 'STEP4_SAMPLE';

export type FoodReportFormKey = 'ALL' | 'M1_1' | 'M1_2' | 'M2' | 'M3' | 'M4';

export interface FoodInspectionSettings {
  companyName: string;
  inspector: string;
  location: string;
}

export interface FoodInspectionRecord {
  id: string;
  rowIndex?: number;
  date: string;
  col_0?: string;
  col_1?: string;
  col_2?: string;
  col_3?: string;
  col_4?: string;
  col_5?: string;
  col_6?: string;
  col_7?: string;
  col_8?: string;
  col_9?: string;
  col_10?: string;
  col_11?: string;
  col_12?: string;
  col_13?: string;
  col_14?: string;
  col_15?: string;
  col_16?: string;
  col_17?: string;
  col_18?: string;
  col_19?: string;
  [key: string]: any;
}

export interface FreshTemplateItem {
  stt?: number;
  name: string;
  time?: string;
  qty?: string;
  unit?: string;
  supplier?: string;
  addr?: string;
  deliverer?: string;
  doc?: string;
  vet?: string;
  quar?: string;
  sense?: string;
  test?: string;
  handle?: string;
  note?: string;
}

export interface DryTemplateItem {
  stt?: number;
  name: string;
  producer?: string;
  prod_addr?: string;
  time?: string;
  qty?: string;
  unit?: string;
  supplier?: string;
  deliverer?: string;
  addr?: string;
  phone?: string;
  exp?: string;
  storage?: string;
  doc?: string;
  cert?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface CookingTemplateItem {
  stt?: number;
  meal?: string;
  dishName: string;
  name?: string;
  ingName?: string;
  ingredients?: string;
  ingQty?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  hygienePerson?: string;
  hygieneEquipment?: string;
  hygieneArea?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface ServingTemplateItem {
  stt?: number;
  meal?: string;
  dishName: string;
  name?: string;
  servings?: string;
  finishTime?: string;
  startEatTime?: string;
  container?: string;
  sense?: string;
  handle?: string;
  note?: string;
}

export interface SampleFoodTemplateItem {
  stt?: number;
  dishName: string;
  name?: string;
  meal?: string;
  servings?: string;
  weight?: string;
  box?: string;
  temp?: string;
  takeTime?: string;
  destroyTime?: string;
  note?: string;
}

export interface FoodInspectionStore {
  settings: FoodInspectionSettings;
  STEP1_FRESH: FoodInspectionRecord[];
  STEP1_DRY: FoodInspectionRecord[];
  STEP2_COOKING: FoodInspectionRecord[];
  STEP3_SERVING: FoodInspectionRecord[];
  STEP4_SAMPLE: FoodInspectionRecord[];
  freshTemplates: FreshTemplateItem[];
  dryTemplates: DryTemplateItem[];
  cookingTemplates: CookingTemplateItem[];
  servingTemplates: ServingTemplateItem[];
  sampleFoodTemplates: SampleFoodTemplateItem[];
  updatedAt?: string;
}

export const DEFAULT_FRESH_TEMPLATES: FreshTemplateItem[] = [
  {
    stt: 1,
    name: 'Cá ngừ đông lạnh fillet',
    time: '06:00',
    qty: '20.5',
    unit: 'kg',
    supplier: 'Công ty TNHH Thủy sản Miền Trung',
    addr: 'Lô 12 KCN Thủy sản Sơn Trà, Đà Nẵng',
    deliverer: 'Nguyễn Văn Nam (0905123456)',
    doc: 'HĐ số 0124',
    vet: 'ĐKTY số 12/ĐK',
    quar: 'Giấy KD số 89/KD',
    sense: 'Đạt',
    test: 'Âm tính (Histamin, Formol)',
    handle: 'Nhập kho bảo quản đông lạnh',
  },
  {
    stt: 2,
    name: 'Thịt heo xay tươi',
    time: '06:15',
    qty: '17.0',
    unit: 'kg',
    supplier: 'DNTN Thực phẩm Sạch An Tâm',
    addr: '25 Lê Duẩn, Hải Châu, Đà Nẵng',
    deliverer: 'Trần Đình Quân (0913888999)',
    doc: 'HĐ 4512',
    vet: 'GCN Thú y số 22/TY',
    quar: 'GKD số 45/KD',
    sense: 'Đạt',
    test: 'Âm tính (Hàn the, tạo nạc)',
    handle: 'Chuyển sơ chế ngay',
  },
  {
    stt: 3,
    name: 'Bí đỏ',
    time: '06:30',
    qty: '11.0',
    unit: 'kg',
    supplier: 'HTX Rau an toàn Hòa Vang',
    addr: 'Xã Hòa Vang, Đà Nẵng',
    deliverer: 'Lê Văn Tuấn (0905666777)',
    doc: 'HĐ 332',
    vet: 'Đầy đủ',
    quar: 'Có xác nhận',
    sense: 'Đạt',
    test: 'Âm tính (Dư lượng BVTV)',
    handle: 'Chuyển khu sơ chế rau',
  },
  {
    stt: 4,
    name: 'Rau muống',
    time: '06:35',
    qty: '8.0',
    unit: 'kg',
    supplier: 'HTX Rau an toàn Hòa Vang',
    addr: 'Xã Hòa Vang, Đà Nẵng',
    deliverer: 'Lê Văn Tuấn (0905666777)',
    doc: 'HĐ 332',
    vet: 'Đầy đủ',
    quar: 'Có xác nhận',
    sense: 'Đạt',
    test: 'Âm tính (Thuốc BVTV)',
    handle: 'Ngâm rửa theo quy trình',
  },
  {
    stt: 5,
    name: 'Hành lá, ngò rí',
    time: '06:40',
    qty: '0.5',
    unit: 'kg',
    supplier: 'HTX Rau an toàn Hòa Vang',
    addr: 'Xã Hòa Vang, Đà Nẵng',
    deliverer: 'Lê Văn Tuấn (0905666777)',
    doc: 'HĐ 332',
    vet: 'Đầy đủ',
    quar: 'Có xác nhận',
    sense: 'Đạt',
    test: 'Âm tính',
    handle: 'Sơ chế rau củ',
  },
];

export const DEFAULT_DRY_TEMPLATES: DryTemplateItem[] = [
  {
    stt: 1,
    name: 'Nước mắm Nam Ngư Đệ Nhị',
    producer: 'Công ty CP Hàng tiêu dùng Masan',
    prod_addr: 'KCN Tân Đông Hiệp A, Dĩ An, Bình Dương',
    time: '07:00',
    qty: '5',
    unit: 'Chai',
    supplier: 'Đại lý phân phối Thực phẩm Miền Trung',
    deliverer: 'Nguyễn Văn Hùng',
    addr: '45 Nguyễn Tri Phương, Đà Nẵng',
    phone: '0905123456',
    exp: 'NSX: 01/2026 - HSD: 01/2027',
    storage: 'Nhiệt độ thường',
    doc: 'HĐ 8891',
    cert: 'Đầy đủ công bố',
    sense: 'Đạt',
    handle: 'Lưu kho gia vị khô',
    note: '',
  },
  {
    stt: 2,
    name: 'Dầu ăn Neptune Gold',
    producer: 'Công ty TNHH Dầu thực vật Cái Lân',
    prod_addr: 'KCN Cái Lân, TP. Hạ Long, Quảng Ninh',
    time: '07:05',
    qty: '10',
    unit: 'Lít',
    supplier: 'Công ty TNHH Phân Phối An Bình',
    deliverer: 'Lê Quốc Trọng',
    addr: '120 Điện Biên Phủ, Đà Nẵng',
    phone: '0914222333',
    exp: 'NSX: 01/2026 - HSD: 01/2028',
    storage: 'Nhiệt độ thường',
    doc: 'HĐ 8891',
    cert: 'Đầy đủ công bố',
    sense: 'Đạt',
    handle: 'Lưu kho khô',
    note: '',
  },
  {
    stt: 3,
    name: 'Hạt nêm Knorr',
    producer: 'Công ty TNHH Quốc tế Unilever VN',
    prod_addr: 'KCN Tây Bắc Củ Chi, TP. Hồ Chí Minh',
    time: '07:10',
    qty: '2',
    unit: 'Gói (kg)',
    supplier: 'Nhà phân phối Hưng Phát',
    deliverer: 'Phạm Thanh Bình',
    addr: '78 Trường Chinh, Đà Nẵng',
    phone: '0935888999',
    exp: 'NSX: 02/2026 - HSD: 02/2027',
    storage: 'Nhiệt độ thường',
    doc: 'HĐ 8891',
    cert: 'Đầy đủ công bố',
    sense: 'Đạt',
    handle: 'Lưu kho khô',
    note: '',
  },
  {
    stt: 4,
    name: 'Bơ lạt Anchor',
    producer: 'Fonterra Co-operative Group',
    prod_addr: 'New Zealand',
    time: '07:20',
    qty: '5',
    unit: 'Khối (kg)',
    supplier: 'Cty TNHH TM Thực phẩm Đại Phát',
    deliverer: 'Đặng Hoàng Nam',
    addr: '34 Hùng Vương, Đà Nẵng',
    phone: '0905777888',
    exp: 'NSX: 03/2026 - HSD: 03/2027',
    storage: 'Lạnh',
    doc: 'HĐ 9021',
    cert: 'Giấy kiểm dịch NK',
    sense: 'Đạt',
    handle: 'Lưu tủ đông/mát chuyên dụng',
    note: '',
  },
  {
    stt: 5,
    name: 'Muối ăn I-ốt',
    producer: 'Công ty Muối Miền Trung',
    prod_addr: 'Quảng Nam',
    time: '07:00',
    qty: '10',
    unit: 'Kg',
    supplier: 'Đại lý An Hòa',
    deliverer: 'Nguyễn Văn A',
    addr: 'Đà Nẵng',
    phone: '0905111222',
    exp: 'NSX: 01/2026 - HSD: 01/2028',
    storage: 'Nhiệt độ thường',
    doc: 'HĐ 204',
    cert: 'Đầy đủ công bố',
    sense: 'Đạt',
    handle: 'Lưu kho khô',
    note: '',
  },
];

export const DEFAULT_COOKING_TEMPLATES: CookingTemplateItem[] = [
  { stt: 1, meal: 'HC 11h30', dishName: 'Thịt vịt kho đậu', ingName: 'Thịt vịt', ingQty: '25 kg', servings: '220', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
  { stt: 2, meal: 'HC 11h30', dishName: 'Khoai tây xào', ingName: 'Đậu phộng sống', ingQty: '4 kg', servings: '220', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
  { stt: 3, meal: 'HC 11h30', dishName: 'Canh rau má nấu tôm', ingName: 'Khoai tây', ingQty: '25 kg', servings: '220', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
  { stt: 4, meal: 'HC 11h30', dishName: 'Cơm trắng', ingName: 'Tôm bạc', ingQty: '0.6 kg', servings: '220', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
  { stt: 5, meal: 'HC 11h30', dishName: '', ingName: 'Rau má', ingQty: '3.5kg', servings: '', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
  { stt: 6, meal: 'HC 11h30', dishName: '', ingName: 'Gạo', ingQty: '30 kg', servings: '', prepTime: '', cookTime: '', hygienePerson: 'Đạt', hygieneEquipment: 'Đạt', hygieneArea: 'Đạt', sense: 'Đạt', handle: '', note: '' },
];

export const DEFAULT_SERVING_TEMPLATES: ServingTemplateItem[] = [
  { stt: 1, meal: 'Trưa (11:30)', dishName: 'Cá ngừ kho thơm', servings: '220', container: 'Khay inox chia suất có nắp đậy, nhiệt độ > 60°C', handle: 'Đưa vào phục vụ suất ăn', note: '' },
  { stt: 2, meal: 'Trưa (11:30)', dishName: 'Cải thìa xào tỏi', servings: '220', container: 'Khay inox có nắp đậy giữ ấm', handle: 'Đưa vào phục vụ suất ăn', note: '' },
  { stt: 3, meal: 'Trưa (11:30)', dishName: 'Canh bí đỏ nấu tôm', servings: '220', container: 'Nồi giữ nhiệt có nắp đậy kín, nhiệt độ > 70°C', handle: 'Đưa vào phục vụ suất ăn', note: '' },
  { stt: 4, meal: 'Trưa (11:30)', dishName: 'Cơm trắng', servings: '220', container: 'Tủ giữ ấm cơm, nhiệt độ giữ nóng > 65°C', handle: 'Đưa vào phục vụ suất ăn', note: '' },
];

export const DEFAULT_SAMPLE_FOOD_TEMPLATES: SampleFoodTemplateItem[] = [
  { stt: 1, dishName: 'Cá ngừ kho thơm', meal: 'Trưa (11:30)', servings: '220', weight: '150 gam', box: 'Hộp Inox chuyên dụng có niêm phong', temp: '4°C (tủ lưu mẫu)', takeTime: '', destroyTime: '', note: 'Mẫu lưu an toàn' },
  { stt: 2, dishName: 'Cải thìa xào tỏi', meal: 'Trưa (11:30)', servings: '220', weight: '120 gam', box: 'Hộp inox chuyên dụng có niêm phong', temp: '4°C (tủ lưu mẫu)', takeTime: '', destroyTime: '', note: 'Mẫu lưu an toàn' },
  { stt: 3, dishName: 'Canh bí đỏ nấu tôm', meal: 'Trưa (11:30)', servings: '220', weight: '200 ml', box: 'Hộp inox chuyên dụng có niêm phong', temp: '4°C (tủ lưu mẫu)', takeTime: '', destroyTime: '', note: 'Mẫu lưu an toàn' },
  { stt: 4, dishName: 'Cơm trắng', meal: 'Trưa (11:30)', servings: '220', weight: '150 gam', box: 'Hộp inox chuyên dụng có niêm phong', temp: '4°C (tủ lưu mẫu)', takeTime: '', destroyTime: '', note: 'Mẫu lưu an toàn' },
];

export function createInitialFoodInspectionStore(): FoodInspectionStore {
  const t = new Date().toISOString().slice(0, 10);
  return {
    settings: {
      companyName: 'Công ty CP Long Khải tại Đà Nẵng',
      inspector: 'Võ Thị Tuyết',
      location: 'Nhà ăn',
    },
    STEP1_FRESH: [
      { rowIndex: 3, id: 'TS_001', date: t, col_0: 'TS_001', col_1: t, col_2: 'Cá ngừ đông lạnh fillet', col_3: '06:00', col_4: '20.5', col_5: 'kg', col_6: 'Công ty TNHH Thủy sản Miền Trung', col_7: 'Lô 12 KCN Sơn Trà, Đà Nẵng', col_8: 'Nguyễn Văn Nam (0905123456)', col_9: 'HĐ số 0124', col_10: 'ĐKTY số 12/ĐK', col_11: 'Giấy KD số 89/KD', col_12: 'Đạt', col_13: 'Âm tính (Histamin, Formol)', col_14: 'Nhập kho đông lạnh', col_15: 'Võ Thị Tuyết', col_16: '' },
      { rowIndex: 4, id: 'TS_002', date: t, col_0: 'TS_002', col_1: t, col_2: 'Thịt heo xay tươi', col_3: '06:15', col_4: '17.0', col_5: 'kg', col_6: 'DNTN Thực phẩm Sạch An Tâm', col_7: '25 Lê Duẩn, Hải Châu, Đà Nẵng', col_8: 'Trần Đình Quân (0913888999)', col_9: 'HĐ 4512', col_10: 'GCN Thú y số 22/TY', col_11: 'GKD số 45/KD', col_12: 'Đạt', col_13: 'Âm tính (Hàn the, tạo nạc)', col_14: 'Chuyển sơ chế ngay', col_15: 'Võ Thị Tuyết', col_16: '' },
      { rowIndex: 5, id: 'TS_003', date: t, col_0: 'TS_003', col_1: t, col_2: 'Bí đỏ', col_3: '06:30', col_4: '11.0', col_5: 'kg', col_6: 'HTX Rau an toàn Hòa Vang', col_7: 'Xã Hòa Vang, Đà Nẵng', col_8: 'Lê Văn Tuấn (0905666777)', col_9: 'HĐ 332', col_10: 'Đầy đủ', col_11: 'Có xác nhận', col_12: 'Đạt', col_13: 'Âm tính (Dư lượng BVTV)', col_14: 'Chuyển khu sơ chế rau', col_15: 'Võ Thị Tuyết', col_16: '' },
      { rowIndex: 6, id: 'TS_004', date: t, col_0: 'TS_004', col_1: t, col_2: 'Rau muống', col_3: '06:35', col_4: '8.0', col_5: 'kg', col_6: 'HTX Rau an toàn Hòa Vang', col_7: 'Xã Hòa Vang, Đà Nẵng', col_8: 'Lê Văn Tuấn (0905666777)', col_9: 'HĐ 332', col_10: 'Đầy đủ', col_11: 'Có xác nhận', col_12: 'Đạt', col_13: 'Âm tính (Thuốc BVTV)', col_14: 'Ngâm rửa theo quy trình', col_15: 'Võ Thị Tuyết', col_16: '' },
      { rowIndex: 7, id: 'TS_005', date: t, col_0: 'TS_005', col_1: t, col_2: 'Hành lá, ngò', col_3: '06:40', col_4: '0.5', col_5: 'kg', col_6: 'HTX Rau an toàn Hòa Vang', col_7: 'Xã Hòa Vang, Đà Nẵng', col_8: 'Lê Văn Tuấn (0905666777)', col_9: 'HĐ 332', col_10: 'Đầy đủ', col_11: 'Có xác nhận', col_12: 'Đạt', col_13: 'Âm tính', col_14: 'Sơ chế rau củ', col_15: 'Võ Thị Tuyết', col_16: '' },
    ],
    STEP1_DRY: [
      { rowIndex: 2, id: 'KG_001', date: t, col_0: 'KG_001', col_1: t, col_2: '07:00', col_3: 'Nước mắm Nam Ngư Đệ Nhị', col_4: 'Công ty CP Hàng tiêu dùng Masan', col_5: 'KCN Tân Đông Hiệp A, Dĩ An, Bình Dương', col_6: 'Đại lý phân phối Thực phẩm Miền Trung', col_7: 'Nguyễn Văn Hùng', col_8: '45 Nguyễn Tri Phương, Đà Nẵng', col_9: '0905123789', col_10: 'Chai', col_11: '5', col_12: 'NSX: 01/2026 - HSD: 01/2027', col_13: 'Nhiệt độ thường', col_14: 'HĐ 8891', col_15: 'Đầy đủ công bố', col_16: 'Đạt', col_17: 'Lưu kho gia vị khô', col_18: 'Võ Thị Tuyết', col_19: '' },
      { rowIndex: 3, id: 'KG_002', date: t, col_0: 'KG_002', col_1: t, col_2: '07:05', col_3: 'Dầu ăn Neptune Gold', col_4: 'Công ty TNHH Dầu thực vật Cái Lân', col_5: 'KCN Cái Lân, TP. Hạ Long, Quảng Ninh', col_6: 'Công ty TNHH Phân Phối An Bình', col_7: 'Lê Quốc Trọng', col_8: '120 Điện Biên Phủ, Đà Nẵng', col_9: '0914222333', col_10: 'Lít', col_11: '10', col_12: 'NSX: 01/2026 - HSD: 01/2028', col_13: 'Nhiệt độ thường', col_14: 'HĐ 8891', col_15: 'Đầy đủ công bố', col_16: 'Đạt', col_17: 'Lưu kho khô', col_18: 'Võ Thị Tuyết', col_19: '' },
      { rowIndex: 4, id: 'KG_003', date: t, col_0: 'KG_003', col_1: t, col_2: '07:10', col_3: 'Hạt nêm Knorr', col_4: 'Công ty TNHH Quốc tế Unilever VN', col_5: 'KCN Tây Bắc Củ Chi, TP. Hồ Chí Minh', col_6: 'Nhà phân phối Hưng Phát', col_7: 'Phạm Thanh Bình', col_8: '78 Trường Chinh, Đà Nẵng', col_9: '0935888999', col_10: 'Gói (kg)', col_11: '2', col_12: 'NSX: 02/2026 - HSD: 02/2027', col_13: 'Nhiệt độ thường', col_14: 'HĐ 8891', col_15: 'Đầy đủ công bố', col_16: 'Đạt', col_17: 'Lưu kho khô', col_18: 'Võ Thị Tuyết', col_19: '' },
      { rowIndex: 5, id: 'KG_004', date: t, col_0: 'KG_004', col_1: t, col_2: '07:20', col_3: 'Bơ lạt Anchor', col_4: 'Fonterra Co-operative Group', col_5: 'New Zealand', col_6: 'Cty TNHH TM Thực phẩm Đại Phát', col_7: 'Đặng Hoàng Nam', col_8: '34 Hùng Vương, Đà Nẵng', col_9: '0905777888', col_10: 'Khối (kg)', col_11: '5', col_12: 'NSX: 03/2026 - HSD: 03/2027', col_13: 'Lạnh', col_14: 'HĐ 9021', col_15: 'Giấy kiểm dịch NK', col_16: 'Đạt', col_17: 'Lưu tủ đông/mát chuyên dụng', col_18: 'Võ Thị Tuyết', col_19: '' },
    ],
    STEP2_COOKING: [
      { rowIndex: 3, id: 'CB_001', date: t, col_0: 'CB_001', col_1: t, col_2: 'HC 11h30', col_3: 'Thịt vịt kho đậu', col_4: 'Thịt vịt', col_5: '25 kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Cho phép tiếp tục chế biến', col_14: 'Võ Thị Tuyết', col_15: 'Đầu bếp đeo găng tay, tạp dề đầy đủ' },
      { rowIndex: 4, id: 'CB_002', date: t, col_0: 'CB_002', col_1: t, col_2: 'HC 11h30', col_3: 'Khoai tây xào', col_4: 'Đậu phộng sống', col_5: '4 kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Đun sôi kỹ, chín đều', col_14: 'Võ Thị Tuyết', col_15: 'Nồi nấu inox chuyên dụng sạch sẽ' },
      { rowIndex: 5, id: 'CB_003', date: t, col_0: 'CB_003', col_1: t, col_2: 'HC 11h30', col_3: 'Canh rau má nấu tôm', col_4: 'Khoai tây', col_5: '25 kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Đảm bảo độ sôi', col_14: 'Võ Thị Tuyết', col_15: '' },
      { rowIndex: 6, id: 'CB_004', date: t, col_0: 'CB_004', col_1: t, col_2: 'HC 11h30', col_3: 'Cơm trắng', col_4: 'Tôm bạc', col_5: '0.6 kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Cơm chín tơi ngon', col_14: 'Võ Thị Tuyết', col_15: 'Tủ nấu cơm đạt nhiệt độ' },
      { rowIndex: 7, id: 'CB_005', date: t, col_0: 'CB_005', col_1: t, col_2: 'HC 11h30', col_3: '', col_4: 'Rau má', col_5: '3.5kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Đảm bảo độ sôi', col_14: 'Võ Thị Tuyết', col_15: '' },
      { rowIndex: 8, id: 'CB_006', date: t, col_0: 'CB_006', col_1: t, col_2: 'HC 11h30', col_3: '', col_4: 'Gạo', col_5: '30 kg', col_6: '220', col_7: '08:30', col_8: '09:20', col_9: 'Đạt', col_10: 'Đạt', col_11: 'Đạt', col_12: 'Đạt', col_13: 'Cơm chín tơi ngon', col_14: 'Võ Thị Tuyết', col_15: 'Tủ nấu cơm đạt nhiệt độ' },
    ],
    STEP3_SERVING: [
      { rowIndex: 2, id: 'KA_001', date: t, col_0: 'KA_001', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cá ngừ kho thơm', col_4: '220', col_5: '11:00', col_6: '11:30', col_7: 'Khay inox chia suất có nắp đậy, nhiệt độ > 60°C', col_8: 'Đạt', col_9: 'Đưa vào phục vụ suất ăn', col_10: 'Võ Thị Tuyết', col_11: '' },
      { rowIndex: 3, id: 'KA_002', date: t, col_0: 'KA_002', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cải thìa xào tỏi', col_4: '220', col_5: '11:05', col_6: '11:30', col_7: 'Khay inox có nắp đậy giữ ấm', col_8: 'Đạt', col_9: 'Đưa vào phục vụ suất ăn', col_10: 'Võ Thị Tuyết', col_11: '' },
      { rowIndex: 4, id: 'KA_003', date: t, col_0: 'KA_003', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Canh bí đỏ nấu tôm', col_4: '220', col_5: '11:10', col_6: '11:30', col_7: 'Nồi giữ nhiệt có nắp, > 70°C', col_8: 'Đạt', col_9: 'Đưa vào phục vụ suất ăn', col_10: 'Võ Thị Tuyết', col_11: '' },
      { rowIndex: 5, id: 'KA_004', date: t, col_0: 'KA_004', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cơm trắng', col_4: '220', col_5: '11:15', col_6: '11:30', col_7: 'Tủ giữ ấm cơm > 65°C', col_8: 'Đạt', col_9: 'Đưa vào phục vụ suất ăn', col_10: 'Võ Thị Tuyết', col_11: '' },
    ],
    STEP4_SAMPLE: [
      { rowIndex: 2, id: 'LM_001', date: t, col_0: 'LM_001', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cá ngừ kho thơm', col_4: '220', col_5: '150 gam', col_6: 'Hộp inox có niêm phong', col_7: '4°C (tủ lưu mẫu)', col_8: '10:45 ' + t, col_9: '10:45 (hủy sau 24h)', col_10: 'Mẫu lưu an toàn', col_11: 'Võ Thị Tuyết', col_12: 'Võ Thị Tuyết' },
      { rowIndex: 3, id: 'LM_002', date: t, col_0: 'LM_002', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cải thìa xào tỏi', col_4: '220', col_5: '120 gam', col_6: 'Hộp inox có niêm phong', col_7: '4°C (tủ lưu mẫu)', col_8: '10:45 ' + t, col_9: '10:45 (hủy sau 24h)', col_10: 'Mẫu lưu an toàn', col_11: 'Võ Thị Tuyết', col_12: 'Võ Thị Tuyết' },
      { rowIndex: 4, id: 'LM_003', date: t, col_0: 'LM_003', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Canh bí đỏ nấu tôm', col_4: '220', col_5: '200 ml', col_6: 'Hộp inox có niêm phong', col_7: '4°C (tủ lưu mẫu)', col_8: '10:45 ' + t, col_9: '10:45 (hủy sau 24h)', col_10: 'Mẫu lưu an toàn', col_11: 'Võ Thị Tuyết', col_12: 'Võ Thị Tuyết' },
      { rowIndex: 5, id: 'LM_004', date: t, col_0: 'LM_004', col_1: t, col_2: 'Trưa (11:30)', col_3: 'Cơm trắng', col_4: '220', col_5: '150 gam', col_6: 'Hộp inox có niêm phong', col_7: '4°C (tủ lưu mẫu)', col_8: '10:45 ' + t, col_9: '10:45 (hủy sau 24h)', col_10: 'Mẫu lưu an toàn', col_11: 'Võ Thị Tuyết', col_12: 'Võ Thị Tuyết' },
    ],
    freshTemplates: DEFAULT_FRESH_TEMPLATES,
    dryTemplates: DEFAULT_DRY_TEMPLATES,
    cookingTemplates: DEFAULT_COOKING_TEMPLATES,
    servingTemplates: DEFAULT_SERVING_TEMPLATES,
    sampleFoodTemplates: DEFAULT_SAMPLE_FOOD_TEMPLATES,
    updatedAt: new Date().toISOString(),
  };
}
