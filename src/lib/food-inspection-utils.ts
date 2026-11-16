import * as XLSX from 'xlsx';
import {
  FoodInspectionRecord,
  FoodInspectionStepKey,
} from '@/types/food-inspection';

export function getNowTimeString(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function addMinutesToTime(timeStr: string, mins: number): string {
  if (!timeStr) return '';
  const parts = timeStr.includes(':') ? timeStr.split(':') : timeStr.split('h');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const totalMins = h * 60 + m + mins;
  const newH = Math.floor(totalMins / 60) % 24;
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function add24Hours(dtLocalStr: string): string {
  if (!dtLocalStr) return '';
  const d = new Date(dtLocalStr);
  if (isNaN(d.getTime())) return '';
  d.setHours(d.getHours() + 24);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function parseToDateTimeLocal(
  val?: string | null,
  fallbackDate?: string | null,
  fallbackTime?: string | null,
  baseTakeDt?: string | null
): string {
  if (!val) {
    if (baseTakeDt) return add24Hours(baseTakeDt);
    const d = fallbackDate || new Date().toISOString().slice(0, 10);
    const t = fallbackTime || new Date().toTimeString().slice(0, 5);
    return `${d}T${t}`;
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    return str.slice(0, 16);
  }
  let m = str.match(/^(\d{1,2}:\d{2})\s+(\d{4}-\d{2}-\d{2})/);
  if (m) return `${m[2]}T${m[1].padStart(5, '0')}`;
  m = str.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})/);
  if (m) return `${m[1]}T${m[2].padStart(5, '0')}`;
  m = str.match(/^(\d{1,2}:\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const time = m[1].padStart(5, '0');
    const day = m[2].padStart(2, '0');
    const month = m[3].padStart(2, '0');
    return `${m[4]}-${month}-${day}T${time}`;
  }
  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2})/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    const time = m[4].padStart(5, '0');
    return `${m[3]}-${month}-${day}T${time}`;
  }
  m = str.match(/(\d{1,2}:\d{2})/);
  if (m) {
    const time = m[1].padStart(5, '0');
    if (baseTakeDt) {
      const d = new Date(baseTakeDt);
      if (!isNaN(d.getTime())) {
        d.setHours(d.getHours() + 24);
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${mo}-${day}T${time}`;
      }
    }
    const date = fallbackDate || new Date().toISOString().slice(0, 10);
    return `${date}T${time}`;
  }
  if (baseTakeDt) return add24Hours(baseTakeDt);
  const d = fallbackDate || new Date().toISOString().slice(0, 10);
  const t = fallbackTime || '11:00';
  return `${d}T${t}`;
}

export function formatDateTimeDisplay(dtLocalStr?: string): string {
  if (!dtLocalStr) return '';
  if (dtLocalStr.includes('T')) {
    const parts = dtLocalStr.split('T');
    const time = parts[1];
    const dateParts = parts[0].split('-');
    if (dateParts.length === 3) {
      return `${time} ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
  }
  return dtLocalStr;
}

export function formatVNDate(dStr?: string): string {
  if (!dStr) return '';
  const str = String(dStr).trim();
  const parts = str.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

export function parseWeightUnit(raw?: string): { qty: string; unit: string } {
  if (!raw) return { qty: '', unit: '' };
  const str = String(raw).trim();
  if (!str) return { qty: '', unit: '' };
  const match = str.match(/^([\d.,]+)\s*(.*)$/);
  if (match) {
    const q = match[1].trim();
    const u = match[2].trim().replace(/^\((.*)\)$/, '$1').trim();
    return { qty: q, unit: u };
  }
  return { qty: str, unit: '' };
}

export function parseIngredient(raw?: string) {
  if (!raw) return { names: '', qtys: '', items: [] as { name: string; qty: string }[] };
  const str = String(raw).trim();
  if (!str) return { names: '', qtys: '', items: [] as { name: string; qty: string }[] };
  const parts = str.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  const items: { name: string; qty: string }[] = [];
  for (const part of parts) {
    if (part.includes(':')) {
      const idx = part.indexOf(':');
      const n = part.slice(0, idx).trim();
      const q = part.slice(idx + 1).trim();
      items.push({ name: n, qty: q });
    } else {
      const mParen = part.match(/^(.*?)\s*\((.*?)\)$/);
      if (mParen) {
        items.push({ name: mParen[1].trim(), qty: mParen[2].trim() });
      } else {
        const mNum = part.match(/^(.*?)\s+(\d+[.,]?\d*\s*(?:kg|g|gam|lít|lit|ml|hộp|gói|chai|suất)?)$/i);
        if (mNum) {
          items.push({ name: mNum[1].trim(), qty: mNum[2].trim() });
        } else {
          items.push({ name: part, qty: '' });
        }
      }
    }
  }
  const names = items.map((it) => it.name).filter(Boolean).join(', ') || str;
  const qtys = items.map((it) => it.qty).filter(Boolean).join(', ');
  return { names, qtys, items };
}

export function getFreshRowFields(r?: FoodInspectionRecord | null) {
  if (!r) {
    return {
      name: '',
      time: '',
      qty: '',
      unit: '',
      supplier: '',
      addr: '',
      deliverer: '',
      doc: '',
      vet: '',
      quar: '',
      sense: '',
      test: '',
      handle: '',
      inspector: '',
      note: '',
    };
  }
  const isLegacy =
    r.col_2 &&
    (r.col_2.includes(':') || /^\d{1,2}:\d{2}/.test(r.col_2)) &&
    r.col_3 &&
    !r.col_3.includes(':');
  if (isLegacy) {
    const wu = parseWeightUnit(r.col_4);
    return {
      name: r.col_3 || '',
      time: r.col_2 || '',
      qty: wu.qty || '',
      unit: wu.unit || '',
      supplier: r.col_5 || '',
      addr: r.col_6 || '',
      deliverer: r.col_7 || '',
      doc: r.col_8 || '',
      vet: r.col_10 || '',
      quar: r.col_9 || '',
      sense: r.col_11 || '',
      test: r.col_12 || '',
      handle: r.col_13 || '',
      inspector: r.col_14 || '',
      note: r.col_15 || '',
    };
  }
  return {
    name: r.col_2 || '',
    time: r.col_3 || '',
    qty: r.col_4 || '',
    unit: r.col_5 || '',
    supplier: r.col_6 || '',
    addr: r.col_7 || '',
    deliverer: r.col_8 || '',
    doc: r.col_9 || '',
    vet: r.col_10 || '',
    quar: r.col_11 || '',
    sense: r.col_12 || '',
    test: r.col_13 || '',
    handle: r.col_14 || '',
    inspector: r.col_15 || '',
    note: r.col_16 || '',
  };
}

export function getCookingRowFields(r?: FoodInspectionRecord | any) {
  if (!r) {
    return {
      meal: '',
      mealTime: '',
      rawMeal: '',
      dishName: '',
      ingName: '',
      ingQty: '',
      ingCombined: '',
      ingredients: '',
      servings: '',
      prepTime: '',
      cookTime: '',
      hygP: '',
      hygE: '',
      hygA: '',
      hygienePerson: '',
      hygieneEquipment: '',
      hygieneArea: '',
      sense: '',
      senseStatus: '',
      handle: '',
      inspector: '',
      note: '',
    };
  }
  const getVal = (idx: number): string => {
    if (r['col_' + idx] !== undefined) return String(r['col_' + idx] ?? '');
    if (r[idx] !== undefined) return String(r[idx] ?? '');
    return '';
  };
  const parseMealString = (rawMeal: string) => {
    let meal = '';
    let mealTime = '';
    const s = String(rawMeal || '').trim();
    if (s.includes('(') && s.includes(')')) {
      const m = s.match(/^(.*?)\s*\((.*?)\)$/);
      if (m) {
        meal = m[1].trim();
        if (m[2].trim()) mealTime = m[2].trim();
      }
    } else {
      const m = s.match(/^(.*?)\s*(\d{1,2}(?:h|:)\d{2})$/i);
      if (m) {
        meal = m[1].trim();
        mealTime = m[2].replace('h', ':').trim();
      } else {
        meal = s;
      }
    }
    return { meal, mealTime, rawMeal: s };
  };

  const c2 = getVal(2);
  const c3 = getVal(3);
  const c8 = getVal(8);

  const isLegacy16 =
    c3 &&
    /^\d{1,2}(?::|h)\d{2}$/i.test(String(c3).trim()) &&
    (!c2 || /^(?:sáng|trưa|chiều|tối|hc|ca\s*hc)$/i.test(String(c2).trim()));
  if (isLegacy16) {
    const ingCombined = getVal(5);
    let ingName = ingCombined;
    let ingQty = '';
    if (ingCombined.includes(':')) {
      const p = ingCombined.split(':');
      ingName = p[0].trim();
      ingQty = p.slice(1).join(':').trim();
    }
    return {
      meal: c2 || '',
      mealTime: c3 || '',
      rawMeal: `${c2 || ''} ${c3 || ''}`.trim(),
      dishName: getVal(4),
      ingName,
      ingQty,
      ingCombined,
      ingredients: ingCombined,
      prepTime: getVal(6),
      cookTime: getVal(7),
      servings: getVal(8),
      hygP: getVal(9) || '',
      hygE: getVal(10) || '',
      hygA: getVal(11) || '',
      hygienePerson: getVal(9) || '',
      hygieneEquipment: getVal(10) || '',
      hygieneArea: getVal(11) || '',
      sense: getVal(12) || '',
      senseStatus: getVal(12) || '',
      handle: getVal(13),
      inspector: getVal(14),
      note: getVal(15),
    };
  }

  const is15Col =
    /^(?:đạt|không đạt)$/i.test(String(c8).trim()) ||
    (/^\d{1,2}(?::|h)\d{2}$/i.test(String(getVal(5)).trim()) &&
      /^\d{1,2}(?::|h)\d{2}$/i.test(String(getVal(6)).trim()));
  if (is15Col) {
    const mealInfo = parseMealString(c2);
    const ingCombined = getVal(4);
    let ingName = ingCombined;
    let ingQty = '';
    if (ingCombined.includes(':')) {
      const p = ingCombined.split(':');
      ingName = p[0].trim();
      ingQty = p.slice(1).join(':').trim();
    }
    return {
      meal: mealInfo.meal,
      mealTime: mealInfo.mealTime,
      rawMeal: mealInfo.rawMeal,
      dishName: getVal(3),
      ingName,
      ingQty,
      ingCombined,
      ingredients: ingCombined,
      prepTime: getVal(5),
      cookTime: getVal(6),
      servings: getVal(7) || '',
      hygP: getVal(8) || '',
      hygE: getVal(9) || '',
      hygA: getVal(10) || '',
      hygienePerson: getVal(8) || '',
      hygieneEquipment: getVal(9) || '',
      hygieneArea: getVal(10) || '',
      sense: getVal(11) || '',
      senseStatus: getVal(11) || '',
      handle: getVal(12),
      inspector: getVal(13),
      note: getVal(14),
    };
  }

  const mealInfo = parseMealString(c2);
  const ingName = getVal(4);
  const ingQty = getVal(5);
  const ingCombined = ingQty ? `${ingName}: ${ingQty}` : ingName;
  return {
    meal: mealInfo.meal,
    mealTime: mealInfo.mealTime,
    rawMeal: mealInfo.rawMeal,
    dishName: getVal(3),
    ingName,
    ingQty,
    ingCombined,
    ingredients: ingCombined,
    servings: getVal(6) || '',
    prepTime: getVal(7),
    cookTime: getVal(8),
    hygP: getVal(9) || '',
    hygE: getVal(10) || '',
    hygA: getVal(11) || '',
    hygienePerson: getVal(9) || '',
    hygieneEquipment: getVal(10) || '',
    hygieneArea: getVal(11) || '',
    sense: getVal(12) || '',
    senseStatus: getVal(12) || '',
    handle: getVal(13),
    inspector: getVal(14),
    note: getVal(15),
  };
}

export function downloadFoodInspectionSampleExcel(step: FoodInspectionStepKey) {
  let headers: string[] = [];
  let sampleData: (string | number)[][] = [];
  let fileName = 'Mau_Kiem_Thuc.xlsx';

  if (step === 'STEP1_FRESH') {
    fileName = 'Mau_B1_Thuc_Pham_Tuoi_Song.xlsx';
    const headersRow1 = [
      'TT',
      'Tên thực phẩm',
      'Ngày giờ nhập (ngày, giờ)',
      'Khối lượng (kg/lít...)',
      '',
      'Nơi cung cấp',
      '',
      '',
      'Chứng từ, hóa đơn',
      'Giấy ĐK VS thú y',
      'Giấy kiểm dịch',
      'Kiểm tra cảm quan (màu, mùi vị, trạng thái...) (Đạt/Không đạt)',
      'Xét nghiệm nhanh (nếu có) (Vi Sinh, Hóa Lý) (Đạt/Không đạt)',
      'Biện pháp xử lý/ ghi chú',
    ];
    const headersRow2 = [
      '',
      '',
      '',
      'KL',
      'ĐVT',
      'Tên cơ sở',
      'Địa chỉ, điện thoại',
      'Tên người giao hàng',
      '',
      '',
      '',
      '',
      '',
      '',
    ];
    sampleData = [
      [1, 'Cá ngừ đông lạnh fillet', '06:00', 20.5, 'kg', 'Công ty TNHH Thủy sản Miền Trung', 'Lô 12 KCN Thủy sản Sơn Trà, Đà Nẵng', 'Nguyễn Văn Nam (0905123456)', 'HĐ số 0124', 'ĐKTY số 12/ĐK', 'Giấy KD số 89/KD', 'Đạt', 'Âm tính (Histamin, Formol)', 'Nhập kho bảo quản đông lạnh'],
      [2, 'Thịt heo xay tươi', '06:15', 17.0, 'kg', 'DNTN Thực phẩm Sạch An Tâm', '25 Lê Duẩn, Hải Châu, Đà Nẵng', 'Trần Đình Quân (0913888999)', 'HĐ 4512', 'GCN Thú y số 22/TY', 'GKD số 45/KD', 'Đạt', 'Âm tính (Hàn the, tạo nạc)', 'Chuyển sơ chế ngay'],
      [3, 'Rau mồng tơi', '06:30', 10.0, 'kg', 'HTX Rau Hòa Vang', 'Xã Hòa Vang, Đà Nẵng', 'Lê Văn Tuấn (0905666777)', 'HĐ 332', 'Đầy đủ', 'Có xác nhận', 'Đạt', 'Âm tính (Dư lượng BVTV)', 'Chuyển ngâm rửa'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headersRow1, headersRow2, ...sampleData]);
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
      { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },
      { s: { r: 0, c: 5 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
      { s: { r: 0, c: 10 }, e: { r: 1, c: 10 } },
      { s: { r: 0, c: 11 }, e: { r: 1, c: 11 } },
      { s: { r: 0, c: 12 }, e: { r: 1, c: 12 } },
      { s: { r: 0, c: 13 }, e: { r: 1, c: 13 } },
    ];
    ws['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 25 },
      { wch: 30 },
      { wch: 22 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 25 },
      { wch: 25 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'ThucPhamTuoiSong');
    XLSX.writeFile(wb, fileName);
    return;
  }

  if (step === 'STEP1_DRY') {
    fileName = 'Mau_B1_Thuc_Pham_Kho_Gia_Vi.xlsx';
    headers = [
      'Tên thực phẩm',
      'Tên cơ sở sản xuất',
      'Địa chỉ sản xuất',
      'Thời gian nhập (ngày/giờ)',
      'Khối lượng (KL)',
      'Đơn vị tính (ĐVT)',
      'Tên cơ sở (Nơi CC)',
      'Tên chủ giao hàng',
      'Địa chỉ, điện thoại',
      'Hạn sử dụng',
      'Điều kiện bảo quản (T⁰ thường/ lạnh...)',
      'Chứng từ, hóa đơn',
      'Kiểm tra cảm quan (nhãn, bao bì, bảo quản, HSD,...) (Đạt/Không đạt)',
      'Biện pháp xử lý/ghi chú',
    ];
    sampleData = [
      ['Nước mắm Nam Ngư Đệ Nhị', 'Công ty CP Hàng tiêu dùng Masan', 'KCN Tân Đông Hiệp A, Dĩ An, Bình Dương', '07:00', '5', 'Chai', 'Đại lý Phân Phối Miền Trung', 'Nguyễn Văn Hùng', '45 Nguyễn Tri Phương, Đà Nẵng (0905123789)', 'NSX: 01/2026 - HSD: 01/2027', 'Nhiệt độ thường', 'HĐ 8891', 'Đạt', 'Lưu kho gia vị khô'],
      ['Dầu ăn Neptune Gold', 'Công ty TNHH Dầu thực vật Cái Lân', 'KCN Cái Lân, TP. Hạ Long, Quảng Ninh', '07:05', '10', 'Lít', 'Công ty TNHH Phân Phối An Bình', 'Lê Quốc Trọng', '120 Điện Biên Phủ, Đà Nẵng (0914222333)', 'NSX: 01/2026 - HSD: 01/2028', 'Nhiệt độ thường', 'HĐ 8891', 'Đạt', 'Lưu kho khô'],
      ['Bơ lạt Anchor', 'Fonterra Co-operative Group', 'New Zealand', '07:20', '5', 'Khối (kg)', 'Cty TM Đại Phát', 'Đặng Hoàng Nam', '34 Hùng Vương, Đà Nẵng (0905777888)', 'NSX: 03/2026 - HSD: 03/2027', 'Lạnh', 'HĐ 9021', 'Đạt', 'Lưu tủ đông/mát chuyên dụng'],
    ];
  } else if (step === 'STEP2_COOKING') {
    fileName = 'Mau_B2_Khi_Che_Bien.xlsx';
    headers = [
      'TT',
      'Tên món ăn',
      'Ca/ bữa ăn (bữa ăn, giờ ăn)',
      'Tên nguyên liệu',
      'Số lượng',
      'Số lượng/ số suất ăn',
      'Biện pháp xử lý/ Ghi chú',
    ];
    sampleData = [
      [1, 'Thịt vịt kho đậu', 'HC 11h30', 'Thịt vịt', '25 kg', '220', ''],
      [2, 'Khoai tây xào', 'HC 11h30', 'Đậu phộng sống', '4 kg', '220', ''],
      [3, 'Canh rau má nấu tôm', 'HC 11h30', 'Khoai tây', '25 kg', '220', ''],
      [4, 'Cơm trắng', 'HC 11h30', 'Tôm bạc', '0.6 kg', '220', ''],
      [5, '', 'HC 11h30', 'Rau má', '3.5kg', '', ''],
      [6, '', 'HC 11h30', 'Gạo', '30 kg', '', ''],
    ];
  } else if (step === 'STEP3_SERVING') {
    fileName = 'Mau_B3_Truoc_Khi_An.xlsx';
    headers = [
      'Ca/ bữa ăn (bữa ăn, giờ ăn)',
      'Tên món ăn',
      'Số lượng suất ăn',
      'Thời gian chia món xong (ngày, giờ)',
      'Thời gian bắt đầu ăn (ngày, giờ)',
      'Dụng cụ chia, chứa đựng, che đậy, bảo quản thức ăn',
      'Kiểm tra cảm quan món ăn (Màu, mùi, vị, trạng thái, bảo quản...) (Đạt/Không đạt)',
      'Biện pháp xử lý/Ghi chú',
    ];
    sampleData = [
      ['Trưa (11:30)', 'Thịt bò xào rau củ', '220', '11:00', '11:30', 'Khay inox chia suất có nắp đậy, nhiệt độ > 60°C', 'Đạt', 'Phục vụ suất ăn'],
    ];
  } else if (step === 'STEP4_SAMPLE') {
    fileName = 'Mau_B4_Luu_Mau.xlsx';
    headers = [
      'Tên mẫu thức ăn',
      'Bữa ăn (giờ ăn...)',
      'Số lượng suất ăn',
      'Khối lượng/ thể tích mẫu (gam/ml)',
      'Dụng cụ chứa mẫu thức ăn lưu',
      'Nhiệt độ bảo quản mẫu (°C)',
      'Thời gian lấy mẫu (giờ, ngày, tháng, năm)',
      'Thời gian hủy mẫu (giờ, ngày, tháng, năm)',
      'Ghi chú (chất lượng mẫu thức ăn lưu...)',
    ];
    sampleData = [
      ['Cá ngừ kho thơm', 'Trưa (11:30)', '220', '150 gam', 'Hộp inox chuyên dụng có niêm phong', '4°C (tủ lưu mẫu)', '10:45 16/11/2026', '10:45 17/11/2026', 'Mẫu bình thường, không biến chất, hủy an toàn'],
    ];
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  XLSX.utils.book_append_sheet(wb, ws, 'DuLieuMau');
  XLSX.writeFile(wb, fileName);
}

function isDateValue(val: any): boolean {
  if (val === null || val === undefined || val === '') return false;
  if (val instanceof Date) return true;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
  if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}$/.test(s)) return true;
  const num = Number(s);
  if (!isNaN(num) && num >= 30000 && num <= 65000 && !s.includes(':')) {
    return true;
  }
  return false;
}

function isMealValue(val: any): boolean {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return (
    /^(?:ca\s*hc|hc|sáng|trưa|chiều|tối|bữa\s*sáng|bữa\s*trưa|bữa\s*chiều|bữa\s*tối)/i.test(s) ||
    /\b\d{1,2}(?:h|:)\d{2}\b/i.test(s)
  );
}

function normalizeExcelDate(dStr: any, fallbackDate: string): string {
  if (dStr === null || dStr === undefined || dStr === '') return fallbackDate;
  if (dStr instanceof Date) {
    const y = dStr.getFullYear();
    const m = String(dStr.getMonth() + 1).padStart(2, '0');
    const d = String(dStr.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(dStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    const year = m[3];
    return `${year}-${month}-${day}`;
  }
  const num = Number(s);
  if (!isNaN(num) && num >= 30000 && num <= 65000 && !s.includes(':')) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  return fallbackDate;
}

function getCellVal(row: any[], idx: number): string {
  if (!row || idx === undefined || idx === null) return '';
  const cell = row[idx];
  if (cell === undefined || cell === null) return '';
  return String(cell).trim();
}

export function processParsedInspectionRows(
  rawRows: any[][],
  step: FoodInspectionStepKey,
  targetDate: string,
  inspector: string
): string[][] {
  const formattedRows: string[][] = [];
  let lastMealState = {
    dateVal: targetDate,
    rawMeal: '',
    dishName: '',
  };
  let lastLayout: number | null = null;

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r.length) continue;
    const rowStr = r.join(' ').toLowerCase();
    if (
      rowStr.includes('tên thực phẩm') ||
      rowStr.includes('tên nguyên liệu') ||
      rowStr.includes('nơi cung cấp') ||
      rowStr.includes('khối lượng') ||
      rowStr.includes('nguyên liệu chính') ||
      rowStr.includes('kiểm tra điều kiện vệ sinh') ||
      rowStr.includes('người tham gia chế biến') ||
      rowStr.includes('trang thiết bị') ||
      rowStr.includes('khu vực chế biến') ||
      r[3] === 'KL' ||
      r[4] === 'ĐVT' ||
      r[4] === 'KL' ||
      r[5] === 'ĐVT' ||
      String(r[0]).trim().toLowerCase() === 'tt' ||
      String(r[0]).trim().toLowerCase() === 'stt'
    ) {
      continue;
    }
    if (!r.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '')) {
      continue;
    }

    if (step === 'STEP1_FRESH') {
      let f_name = '', f_time = '', f_qty = '', f_unit = '';
      let f_supplier = '', f_addr = '', f_deliverer = '', f_doc = '', f_vet = '', f_quar = '', f_sense = '', f_test = '', f_handle = '';
      const isCol0TT = !isNaN(parseInt(r[0], 10)) && r[1] && String(r[1]).length > 0 && !String(r[1]).includes(':');
      if (isCol0TT) {
        f_name = getCellVal(r, 1);
        f_time = getCellVal(r, 2);
        f_qty = getCellVal(r, 3);
        f_unit = getCellVal(r, 4);
        f_supplier = getCellVal(r, 5);
        f_addr = getCellVal(r, 6);
        f_deliverer = getCellVal(r, 7);
        f_doc = getCellVal(r, 8);
        f_vet = getCellVal(r, 9);
        f_quar = getCellVal(r, 10);
        f_sense = getCellVal(r, 11);
        f_test = getCellVal(r, 12);
        f_handle = getCellVal(r, 13);
      } else if (r.length >= 13) {
        f_name = getCellVal(r, 0);
        f_time = getCellVal(r, 1);
        f_qty = getCellVal(r, 2);
        f_unit = getCellVal(r, 3);
        f_supplier = getCellVal(r, 4);
        f_addr = getCellVal(r, 5);
        f_deliverer = getCellVal(r, 6);
        f_doc = getCellVal(r, 7);
        f_vet = getCellVal(r, 8);
        f_quar = getCellVal(r, 9);
        f_sense = getCellVal(r, 10);
        f_test = getCellVal(r, 11);
        f_handle = getCellVal(r, 12);
      } else {
        f_name = getCellVal(r, 0);
        f_time = getCellVal(r, 1);
        const wu = parseWeightUnit(r[2]);
        f_qty = wu.qty || '';
        f_unit = wu.unit || '';
        f_supplier = getCellVal(r, 3);
        f_addr = getCellVal(r, 4);
        f_deliverer = getCellVal(r, 5);
        f_doc = getCellVal(r, 6);
        f_vet = getCellVal(r, 7);
        f_quar = getCellVal(r, 8);
        f_sense = getCellVal(r, 9);
        f_test = getCellVal(r, 10);
        f_handle = getCellVal(r, 11);
      }
      formattedRows.push([
        '', targetDate, f_name, f_time, f_qty, f_unit, f_supplier, f_addr, f_deliverer, f_doc, f_vet, f_quar, f_sense, f_test, f_handle, inspector, '',
      ]);
    } else if (step === 'STEP1_DRY') {
      const isNewLayout =
        (r[3] && (String(r[3]).includes(':') || /^\d{1,2}:\d{2}/.test(String(r[3])))) ||
        (r[1] && String(r[1]).length > 8 && !String(r[1]).includes(':'));
      let f_time = '', f_name = '', f_producer = '', f_prod_addr = '', f_supplier = '', f_deliverer = '', f_addr = '', f_phone = '', f_unit = '', f_qty = '', f_exp = '', f_storage = '', f_doc = '', f_cert = '', f_sense = '', f_handle = '';

      if (isNewLayout) {
        f_name = getCellVal(r, 0);
        f_producer = getCellVal(r, 1);
        f_prod_addr = getCellVal(r, 2);
        f_time = getCellVal(r, 3);
        f_qty = getCellVal(r, 4);
        f_unit = getCellVal(r, 5);
        f_supplier = getCellVal(r, 6);
        f_deliverer = getCellVal(r, 7);
        f_addr = getCellVal(r, 8);
        f_exp = getCellVal(r, 9);
        f_storage = getCellVal(r, 10);
        f_doc = getCellVal(r, 11);
        f_sense = getCellVal(r, 12);
        f_handle = getCellVal(r, 13);
      } else {
        f_name = getCellVal(r, 0);
        f_time = getCellVal(r, 1);
        f_producer = getCellVal(r, 2);
        f_prod_addr = getCellVal(r, 3);
        f_supplier = getCellVal(r, 4);
        f_deliverer = getCellVal(r, 5);
        f_addr = getCellVal(r, 6);
        f_phone = getCellVal(r, 7);
        f_unit = getCellVal(r, 8);
        f_qty = getCellVal(r, 9);
        f_exp = getCellVal(r, 10);
        f_storage = getCellVal(r, 11);
        f_doc = getCellVal(r, 12);
        f_cert = getCellVal(r, 13);
        f_sense = getCellVal(r, 14);
        f_handle = getCellVal(r, 15);
      }
      formattedRows.push([
        '', targetDate, f_time, f_name, f_producer, f_prod_addr, f_supplier, f_deliverer, f_addr, f_phone, f_unit, f_qty, f_exp, f_storage, f_doc, f_cert, f_sense, f_handle, inspector, '',
      ]);
    } else if (step === 'STEP2_COOKING') {
      let dateVal = targetDate;
      let rawMeal = '';
      let dishName = '';
      let ingName = '';
      let ingQty = '';
      let ingCombined = '';
      let servings = '';
      let prepTime = '';
      let cookTime = '';
      let hygP = '';
      let hygE = '';
      let hygA = '';
      let sense = '';
      let handle = '';

      const isCol0Num = !isNaN(parseInt(r[0], 10)) && String(r[0]).trim().length <= 4;
      const isCol1Date = isDateValue(r[1]);
      const isCol0Date = isDateValue(r[0]);
      const isCol2Meal = isMealValue(r[2]);
      const isCol1Meal = isMealValue(r[1]);
      const isCol1Empty = !r[1] || String(r[1]).trim() === '';
      const isCol2Empty = !r[2] || String(r[2]).trim() === '';
      const hasCol3Or4 =
        Boolean(r[3] && String(r[3]).trim() !== '') ||
        Boolean(r[4] && String(r[4]).trim() !== '');
      const isMergedSubRow14 =
        isCol1Empty &&
        isCol2Empty &&
        hasCol3Or4 &&
        (lastLayout === 14 || r.length >= 13 || !r[0] || isCol0Num);
      const isMergedSubRow13NoTT =
        (!r[0] || String(r[0]).trim() === '') &&
        (!r[1] || String(r[1]).trim() === '') &&
        Boolean(r[2] && String(r[2]).trim() !== '') &&
        !isMealValue(r[2]);

      if (isCol0Num && r.length === 7 && isCol2Meal) {
        dishName = getCellVal(r, 1);
        rawMeal = getCellVal(r, 2);
        ingName = getCellVal(r, 3);
        ingQty = getCellVal(r, 4);
        servings = getCellVal(r, 5);
        handle = getCellVal(r, 6);
      } else if (isCol0Num && (isCol1Date || isCol2Meal || (r.length >= 14 && !isCol1Meal))) {
        lastLayout = 14;
        dateVal = normalizeExcelDate(r[1], lastMealState.dateVal || targetDate);
        rawMeal = getCellVal(r, 2) || lastMealState.rawMeal || '';
        dishName = getCellVal(r, 3);
        ingName = getCellVal(r, 4);
        ingQty = getCellVal(r, 5);
        servings = getCellVal(r, 6);
        prepTime = getCellVal(r, 7);
        cookTime = getCellVal(r, 8);
        hygP = getCellVal(r, 9);
        hygE = getCellVal(r, 10);
        hygA = getCellVal(r, 11);
        sense = getCellVal(r, 12);
        handle = getCellVal(r, 13);
        lastMealState = { dateVal, rawMeal, dishName };
      } else if (isMergedSubRow14 && (lastLayout === 14 || (!isCol1Meal && hasCol3Or4))) {
        dateVal = lastMealState.dateVal || targetDate;
        rawMeal = lastMealState.rawMeal || '';
        dishName = getCellVal(r, 3);
        if (dishName) lastMealState.dishName = dishName;
        ingName = getCellVal(r, 4);
        ingQty = getCellVal(r, 5);
        servings = getCellVal(r, 6);
        prepTime = getCellVal(r, 7);
        cookTime = getCellVal(r, 8);
        hygP = getCellVal(r, 9);
        hygE = getCellVal(r, 10);
        hygA = getCellVal(r, 11);
        sense = getCellVal(r, 12);
        handle = getCellVal(r, 13);
      } else if (isCol0Date && r.length >= 13) {
        lastLayout = 13;
        dateVal = normalizeExcelDate(r[0], targetDate);
        rawMeal = getCellVal(r, 1);
        dishName = getCellVal(r, 2);
        ingName = getCellVal(r, 3);
        ingQty = getCellVal(r, 4);
        servings = getCellVal(r, 5);
        prepTime = getCellVal(r, 6);
        cookTime = getCellVal(r, 7);
        hygP = getCellVal(r, 8);
        hygE = getCellVal(r, 9);
        hygA = getCellVal(r, 10);
        sense = getCellVal(r, 11);
        handle = getCellVal(r, 12);
        lastMealState = { dateVal, rawMeal, dishName };
      } else if (isMergedSubRow13NoTT) {
        dateVal = lastMealState.dateVal;
        rawMeal = lastMealState.rawMeal;
        dishName = getCellVal(r, 2);
        ingName = getCellVal(r, 3);
        ingQty = getCellVal(r, 4);
        servings = getCellVal(r, 5);
        prepTime = getCellVal(r, 6);
        cookTime = getCellVal(r, 7);
        hygP = getCellVal(r, 8);
        hygE = getCellVal(r, 9);
        hygA = getCellVal(r, 10);
        sense = getCellVal(r, 11);
        handle = getCellVal(r, 12);
      } else if (isCol0Num && r.length >= 13 && isCol1Meal) {
        lastLayout = 13;
        rawMeal = getCellVal(r, 1);
        dishName = getCellVal(r, 2);
        ingName = getCellVal(r, 3);
        ingQty = getCellVal(r, 4);
        servings = getCellVal(r, 5);
        prepTime = getCellVal(r, 6);
        cookTime = getCellVal(r, 7);
        hygP = getCellVal(r, 8);
        hygE = getCellVal(r, 9);
        hygA = getCellVal(r, 10);
        sense = getCellVal(r, 11);
        handle = getCellVal(r, 12);
        lastMealState = { dateVal: targetDate, rawMeal, dishName };
      } else if (r.length >= 12) {
        rawMeal = getCellVal(r, 0);
        dishName = getCellVal(r, 1);
        ingName = getCellVal(r, 2);
        ingQty = getCellVal(r, 3);
        servings = getCellVal(r, 4);
        prepTime = getCellVal(r, 5);
        cookTime = getCellVal(r, 6);
        hygP = getCellVal(r, 7);
        hygE = getCellVal(r, 8);
        hygA = getCellVal(r, 9);
        sense = getCellVal(r, 10);
        handle = getCellVal(r, 11);
        lastMealState = { dateVal: targetDate, rawMeal, dishName };
      } else {
        rawMeal = getCellVal(r, 0);
        dishName = getCellVal(r, 1);
        ingCombined = getCellVal(r, 2);
        servings = getCellVal(r, 3);
        prepTime = getCellVal(r, 4);
        cookTime = getCellVal(r, 5);
        hygP = getCellVal(r, 6);
        hygE = getCellVal(r, 7);
        hygA = getCellVal(r, 8);
        sense = getCellVal(r, 9);
        handle = getCellVal(r, 10);
        lastMealState = { dateVal: targetDate, rawMeal, dishName };
      }

      let meal = String(rawMeal || '').trim();
      let mealTime = '';
      if (meal.includes('(') && meal.includes(')')) {
        const m = meal.match(/^(.*?)\s*\((.*?)\)$/);
        if (m) {
          meal = m[1].trim();
          if (m[2].trim()) mealTime = m[2].trim();
        }
      } else {
        const m = meal.match(/^(.*?)\s*(\d{1,2}(?:h|:)\d{2})$/i);
        if (m) {
          meal = m[1].trim();
          mealTime = m[2].replace('h', ':').trim();
        }
      }

      if (!ingCombined) {
        if (ingName && ingQty) {
          ingCombined = `${ingName}: ${ingQty}`;
        } else if (ingName) {
          ingCombined = String(ingName).trim();
        } else if (ingQty) {
          ingCombined = String(ingQty).trim();
        }
      }
      if (!dishName && !ingName && !ingQty && !ingCombined) {
        continue;
      }
      const cleanServings = servings ? String(servings).replace(/\s*suất/i, '').trim() : '';
      const combinedMeal = meal && mealTime ? `${meal} ${mealTime}` : meal || mealTime || '';
      formattedRows.push([
        '',
        dateVal,
        combinedMeal,
        dishName,
        ingName || ingCombined,
        ingQty || '',
        cleanServings,
        prepTime,
        cookTime,
        hygP,
        hygE,
        hygA,
        sense,
        handle,
        inspector,
        '',
      ]);
    } else if (step === 'STEP3_SERVING') {
      formattedRows.push([
        '',
        targetDate,
        getCellVal(r, 0),
        getCellVal(r, 1),
        getCellVal(r, 2),
        getCellVal(r, 3),
        getCellVal(r, 4),
        getCellVal(r, 5),
        getCellVal(r, 6),
        getCellVal(r, 7),
        inspector,
        '',
      ]);
    } else if (step === 'STEP4_SAMPLE') {
      formattedRows.push([
        '',
        targetDate,
        getCellVal(r, 1),
        getCellVal(r, 0),
        getCellVal(r, 2),
        getCellVal(r, 3),
        getCellVal(r, 4),
        getCellVal(r, 5),
        getCellVal(r, 6),
        getCellVal(r, 7),
        getCellVal(r, 8),
        inspector,
        inspector,
      ]);
    }
  }
  return formattedRows;
}
