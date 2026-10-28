import { PCCCDevice, PCCCInspection } from '@/types/pccc';

// Generate exactly 111 PCCC Devices matching Master Data
export const INITIAL_PCCC_DEVICES: PCCCDevice[] = (() => {
  const devices: PCCCDevice[] = [];

  // 1. 33 Bình Bột Chữa Cháy (HT-BOT-01 -> HT-BOT-33)
  const botLocations = [
    'Xưởng may 1 - Cột A1',
    'Xưởng may 1 - Cột A3',
    'Xưởng may 1 - Cột B2',
    'Xưởng may 1 - Cột B5',
    'Xưởng may 1 - Cửa thoát hiểm 1',
    'Xưởng may 1 - Cửa thoát hiểm 2',
    'Xưởng may 2 - Cột C1',
    'Xưởng may 2 - Cột C4',
    'Xưởng may 2 - Cột D2',
    'Xưởng may 2 - Cột D5',
    'Xưởng may 2 - Cửa thoát hiểm',
    'Xưởng cắt - Bàn trải vải số 1',
    'Xưởng cắt - Bàn trải vải số 2',
    'Xưởng cắt - Khu vực máy cắt rập',
    'Xưởng cắt - Cửa ra vào chính',
    'Kho nguyên liệu - Cột K1',
    'Kho nguyên liệu - Cột K3',
    'Kho nguyên liệu - Khu chứa chỉ may',
    'Kho phụ liệu - Cửa nhập hàng',
    'Kho phụ liệu - Khu vực kệ hàng A',
    'Kho thành phẩm - Lối đi chính',
    'Kho thành phẩm - Khu vực bốc xếp',
    'Khu vực lò hơi - Cửa vào',
    'Khu vực trạm biến áp',
    'Phòng kỹ thuật cơ điện',
    'Khu vực máy nén khí',
    'Nhà ăn cán bộ CNV - Cửa trước',
    'Nhà ăn cán bộ CNV - Cửa sau',
    'Khu nhà xe công nhân',
    'Văn phòng điều hành - Tầng 1',
    'Văn phòng điều hành - Tầng 2',
    'Cổng bảo vệ chính',
    'Khu xử lý nước thải',
  ];

  for (let i = 1; i <= 33; i++) {
    const id = `HT-BOT-${String(i).padStart(2, '0')}`;
    const name = `Bình chữa cháy bột MFZ4 số ${String(i).padStart(2, '0')}`;
    const location = botLocations[i - 1] || `Khu vực sản xuất - Vị trí ${i}`;
    devices.push({
      id,
      name,
      category: 'binh_bot',
      location,
      specs: '4.0 kg',
      inspectionExpiry: '20/12/2026',
      lastInspection: {
        status: 'pass',
        date: `2026-09-30 08:${String(30 + Math.floor(i / 2)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
        inspectorId: '2265',
        inspectorName: 'Trần Lê Hữu Lực',
      },
    });
  }

  // 2. 45 Bình Khí CO2 (HT-CO2-01 -> HT-CO2-45)
  const co2Locations = [
    'PXHT - Khu vực đóng kiện', // HT-CO2-01
    'PXHT - Khu vực dò kim loại', // HT-CO2-02
    'PXHT - Kho bán thành phẩm', // HT-CO2-03
    'PXHT - Khu vực lộn', // HT-CO2-04
    'PXHT - Khu vực lộn', // HT-CO2-05
    'PXHT - Khu vực mạng', // HT-CO2-06
    'PXHT - Bàn kiểm phẩm 1',
    'PXHT - Bàn kiểm phẩm 2',
    'PXHT - Khu vực ủi hoàn tất 1',
    'PXHT - Khu vực ủi hoàn tất 2',
    'PXHT - Khu vực ép keo',
    'Xưởng may 1 - Tủ điện tổng số 1',
    'Xưởng may 1 - Tủ điện tổng số 2',
    'Xưởng may 1 - Phòng máy tính điều khiển chuyền',
    'Xưởng may 1 - Khu vực máy may mẫu',
    'Xưởng may 2 - Tủ điện tổng số 1',
    'Xưởng may 2 - Tủ điện tổng số 2',
    'Xưởng may 2 - Bàn bảo trì máy may',
    'Xưởng may 2 - Khu vực đóng gói lẻ',
    'Xưởng cắt - Tủ điện máy cắt tự động',
    'Xưởng cắt - Phòng thiết kế CAD',
    'Kho nguyên liệu - Phòng mẫu vải',
    'Kho thành phẩm - Phòng làm việc thủ kho',
    'Khu vực cơ điện - Bàn làm việc thợ điện',
    'Khu vực máy phát điện dự phòng',
    'Phòng máy chủ IT Server',
    'Phòng giám sát an ninh camera',
    'Văn phòng Ban Giám Đốc',
    'Phòng Kế toán & Tài chính',
    'Phòng Hành chính Nhân sự',
    'Phòng Kế hoạch & Quản lý đơn hàng',
    'Phòng Thiết kế mẫu & Rập',
    'Phòng QA/QC kiểm định',
    'Khu vực trạm nạp bình điện xe nâng',
    'Nhà xe cán bộ quản lý',
    'Hành lang tầng 1 văn phòng',
    'Hành lang tầng 2 văn phòng',
    'Cổng phụ bảo vệ số 2',
    'Khu vực máy giặt mẫu',
    'Khu vực sấy mẫu',
    'Kho hóa chất & dung môi tẩy điểm',
    'Khu vực xử lý rác công nghiệp',
    'Trạm bơm nước sinh hoạt',
    'Khu vực cân xe tải xuất nhập khẩu',
    'Phòng tiếp khách khách hàng',
  ];

  for (let i = 1; i <= 45; i++) {
    const id = `HT-CO2-${String(i).padStart(2, '0')}`;
    const name = `Bình chữa cháy CO2 MT3 số ${String(i).padStart(2, '0')}`;
    const location = co2Locations[i - 1] || `Khu vực xưởng - Vị trí CO2 số ${i}`;
    devices.push({
      id,
      name,
      category: 'binh_co2',
      location,
      specs: '10 kg',
      inspectionExpiry: '20/12/2026',
      lastInspection: {
        status: 'pass',
        date:
          i === 1
            ? '2026-09-30 09:09:46'
            : i === 2
            ? '2026-09-30 09:11:05'
            : i === 3
            ? '2026-09-30 09:11:20'
            : i === 4
            ? '2026-09-30 09:11:33'
            : i === 5
            ? '2026-09-30 09:11:46'
            : i === 6
            ? '2026-09-30 09:11:56'
            : `2026-09-30 09:${String(12 + Math.floor(i / 3)).padStart(2, '0')}:${String((i * 11) % 60).padStart(2, '0')}`,
        inspectorId: '2265',
        inspectorName: 'Trần Lê Hữu Lực',
      },
    });
  }

  // 3. 12 Báo Cháy: Tổ Hợp Chuông Đèn Nút Nhấn (HT-BC-01 -> HT-BC-12)
  const bcLocations = [
    'Xưởng may 1 - Cửa thoát hiểm phía Đông',
    'Xưởng may 1 - Cửa thoát hiểm phía Tây',
    'Xưởng may 2 - Cửa thoát hiểm phía Đông',
    'Xưởng may 2 - Cửa thoát hiểm phía Tây',
    'Xưởng cắt - Cửa chính ra vào',
    'Xưởng cắt - Cửa thoát hiểm phía sau',
    'Kho nguyên liệu - Cửa xuất hàng',
    'Kho thành phẩm - Cửa xuất hàng container',
    'Khu vực lò hơi & trạm điện',
    'Khu nhà ăn công nhân - Cửa chính',
    'Văn phòng điều hành - Sảnh tầng 1',
    'Văn phòng điều hành - Hành lang tầng 2',
  ];

  for (let i = 1; i <= 12; i++) {
    const id = `HT-BC-${String(i).padStart(2, '0')}`;
    const name = `Tổ hợp chuông đèn nút nhấn số ${String(i).padStart(2, '0')}`;
    const location = bcLocations[i - 1] || `Khu vực báo cháy số ${i}`;
    devices.push({
      id,
      name,
      category: 'nut_chuong',
      location,
      specs: '24VDC Hệ quy ước',
      inspectionExpiry: '20/12/2026',
      lastInspection: {
        status: 'pass',
        date: `2026-09-30 10:${String(10 + i * 2).padStart(2, '0')}:15`,
        inspectorId: '2265',
        inspectorName: 'Trần Lê Hữu Lực',
      },
    });
  }

  // 4. 19 Tủ Vòi Vách Tường & Ngoài Trời (HT-TV-01 -> HT-TV-19)
  const tvLocations = [
    'Vách tường xưởng may 1 - Cột A2',
    'Vách tường xưởng may 1 - Cột A6',
    'Vách tường xưởng may 1 - Cột B4',
    'Vách tường xưởng may 2 - Cột C3',
    'Vách tường xưởng may 2 - Cột C7',
    'Vách tường xưởng may 2 - Cột D4',
    'Vách tường xưởng cắt - Cửa số 1',
    'Vách tường xưởng cắt - Cuối xưởng',
    'Vách tường kho nguyên liệu - Cửa số 1',
    'Vách tường kho nguyên liệu - Vách hông',
    'Vách tường kho thành phẩm - Cổng số 1',
    'Vách tường kho thành phẩm - Cổng số 2',
    'Khu vực lò hơi công nghiệp',
    'Hành lang nhà ăn cán bộ CNV',
    'Sảnh tầng 1 khối văn phòng',
    'Hành lang tầng 2 khối văn phòng',
    'Trụ chữa cháy ngoài trời - Cổng chính',
    'Trụ chữa cháy ngoài trời - Sau xưởng 2',
    'Trụ chữa cháy ngoài trời - Khu bồn chứa nhiên liệu',
  ];

  for (let i = 1; i <= 19; i++) {
    const id = `HT-TV-${String(i).padStart(2, '0')}`;
    const name = `Tủ vòi chữa cháy vách tường số ${String(i).padStart(2, '0')}`;
    const location = tvLocations[i - 1] || `Tủ chữa cháy vách tường số ${i}`;
    devices.push({
      id,
      name,
      category: 'tu_voi_vach',
      location,
      specs: 'D50 - 20m',
      inspectionExpiry: '20/12/2026',
      lastInspection: {
        status: 'pass',
        date: `2026-09-30 14:${String(10 + i * 2).padStart(2, '0')}:30`,
        inspectorId: '2265',
        inspectorName: 'Trần Lê Hữu Lực',
      },
    });
  }

  // 5. 1 Trạm Bơm PCCC Định Kỳ (HT-TB-01)
  devices.push({
    id: 'HT-TB-01',
    name: 'Trạm bơm PCCC trung tâm nhà máy',
    category: 'tram_bom',
    location: 'Khu bể ngầm PCCC phía sau xưởng may 2',
    specs: '3 máy bơm (2 điện + 1 bù áp) 7 - 9 bar',
    inspectionExpiry: '20/12/2026',
    lastInspection: {
      status: 'pass',
      date: '2026-09-30 16:00:00',
      inspectorId: '2265',
      inspectorName: 'Trần Lê Hữu Lực',
    },
  });

  // 6. 1 Tủ Điều Khiển Báo Cháy Trung Tâm (HT-TT-01)
  devices.push({
    id: 'HT-TT-01',
    name: 'Tủ điều khiển báo cháy trung tâm YunYang',
    category: 'tu_trung_tam',
    location: 'Phòng trực bảo vệ cổng chính',
    specs: '24VDC 10 Zone',
    inspectionExpiry: '20/12/2026',
    lastInspection: {
      status: 'pass',
      date: '2026-09-30 16:30:00',
      inspectorId: '2265',
      inspectorName: 'Trần Lê Hữu Lực',
    },
  });

  return devices;
})();

// Sample initial inspection records matching the devices
export const INITIAL_PCCC_INSPECTIONS: PCCCInspection[] = [
  {
    id: 'INSP-20260930-001',
    deviceId: 'HT-CO2-01',
    deviceName: 'Bình chữa cháy CO2 MT3 số 01',
    category: 'binh_co2',
    location: 'PXHT - Khu vực đóng kiện',
    inspectorId: '2265',
    inspectorName: 'Trần Lê Hữu Lực',
    inspectedAt: '2026-09-30 09:09:46',
    overallResult: 'pass',
    notes: 'Bình đầy đủ áp lực, tem kiểm định còn hiệu lực tốt.',
    checklist: {
      type: 'binh_co2',
      data: {
        standardGrossWeight: 10,
        actualWeight: 10,
        gasLossPercent: 0,
        isLossAcceptable: true,
        co2Nozzle: 'pass',
        safetyPinSeal: 'pass',
      },
    },
    createdAt: '2026-09-30T09:09:46.000Z',
  },
  {
    id: 'INSP-20260930-002',
    deviceId: 'HT-CO2-02',
    deviceName: 'Bình chữa cháy CO2 MT3 số 02',
    category: 'binh_co2',
    location: 'PXHT - Khu vực dò kim loại',
    inspectorId: '2265',
    inspectorName: 'Trần Lê Hữu Lực',
    inspectedAt: '2026-09-30 09:11:05',
    overallResult: 'pass',
    notes: 'Loa phun nguyên vẹn, niêm phong mỏ vịt tốt.',
    checklist: {
      type: 'binh_co2',
      data: {
        standardGrossWeight: 10,
        actualWeight: 9.9,
        gasLossPercent: 3.3,
        isLossAcceptable: true,
        co2Nozzle: 'pass',
        safetyPinSeal: 'pass',
      },
    },
    createdAt: '2026-09-30T09:11:05.000Z',
  },
  {
    id: 'INSP-20260930-003',
    deviceId: 'HT-CO2-03',
    deviceName: 'Bình chữa cháy CO2 MT3 số 03',
    category: 'binh_co2',
    location: 'PXHT - Kho bán thành phẩm',
    inspectorId: '2265',
    inspectorName: 'Trần Lê Hữu Lực',
    inspectedAt: '2026-09-30 09:11:20',
    overallResult: 'pass',
    notes: 'Đạt tiêu chuẩn.',
    checklist: {
      type: 'binh_co2',
      data: {
        standardGrossWeight: 10,
        actualWeight: 10,
        gasLossPercent: 0,
        isLossAcceptable: true,
        co2Nozzle: 'pass',
        safetyPinSeal: 'pass',
      },
    },
    createdAt: '2026-09-30T09:11:20.000Z',
  },
];
