// ==========================================
// Master Data & Initial Seeds for Periodic Inspection
// Extracted from Google Apps Script System
// ==========================================

import {
  FirstAidItemStandard,
  FirstAidInspection,
  EyewashInspection,
  StormwaterInspection,
  GroundwaterSoilInspection,
  StormwaterQuestionConfig,
  GroundwaterSoilCriteria,
} from '@/types/periodic-inspection';

// --- 1. TỦ SƠ CẤP CỨU ---
export const FIRST_AID_LOCATIONS: string[] = [
  "Bếp",
  "Kho 1",
  "Kho 2",
  "Bảo vệ 1",
  "Bảo vệ 2",
  "Cơ điện",
  "Văn phòng"
];

export const FIRST_AID_ITEMS_BY_LOCATION: Record<string, FirstAidItemStandard[]> = {
  "Bếp": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Kho 1": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Kho 2": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Bảo vệ 1": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Bảo vệ 2": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Cơ điện": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ],
  "Văn phòng": [
      {
          "name": "Băng dính (cuộn)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng thun kích thước 5 x 200 cm",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng chun",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng cuộn vải (gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Băng dính cá nhân",
          "chuan": 5,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Gạc thấm nước (10 miếng/gói)",
          "chuan": 1,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Bông hút nước (gói)",
          "chuan": 2,
          "group": "Băng, Gạc Y Tế"
      },
      {
          "name": "Garo cao su",
          "chuan": 2,
          "group": "Dụng Cụ"
      },
      {
          "name": "Kéo cắt băng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu thẳng",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Panh không mấu cong",
          "chuan": 1,
          "group": "Dụng Cụ"
      },
      {
          "name": "Găng tay khám bệnh (đôi)",
          "chuan": 3,
          "group": "Dụng Cụ"
      },
      {
          "name": "Nước muối sinh lý NaCl 9 ‰",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Cồn 70°",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Dung dịch Povidine",
          "chuan": 1,
          "group": "Dung Dịch Sát Khuẩn"
      },
      {
          "name": "Kim băng an toàn (các cỡ)",
          "chuan": 5,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Tấm lót nilon không thấm nước",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Phác đồ sơ cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Danh mục vật tư sơ cấp cứu",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Mặt nạ phòng độc thích hợp",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Kính bảo vệ mắt",
          "chuan": 1,
          "group": "Vật Tư Khác"
      },
      {
          "name": "Nẹp cổ (cái)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cánh tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng tay (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp đùi (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      },
      {
          "name": "Nẹp cẳng chân (bộ)",
          "chuan": 1,
          "group": "Nẹp Cố Định"
      }
  ]
};

export const INITIAL_FIRST_AID_INSPECTIONS: FirstAidInspection[] = [
  {
    "id": "SCC-0001",
    "diaDiem": "Kho 2",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/8/2026",
    "createdAt": "2026-10-30T05:09:12.783Z",
    "items": {
      "Kim băng an toàn (các cỡ)": 5,
      "Garo cao su": 2,
      "Băng dính cá nhân": 5,
      "Cồn 70°": 1,
      "Băng cuộn vải (gói)": 2,
      "Kính bảo vệ mắt": 1,
      "Panh không mấu thẳng": 2,
      "Nẹp cánh tay (bộ)": 1,
      "Băng thun kích thước 5 x 200 cm": 4,
      "Tấm lót nilon không thấm nước": 1,
      "Nẹp cẳng tay (bộ)": 1,
      "Danh mục vật tư sơ cấp cứu": 1,
      "Kéo cắt băng": 1,
      "Nẹp cổ (cái)": 1,
      "Gạc thấm nước (10 miếng/gói)": 1,
      "Mặt nạ phòng độc thích hợp": 1,
      "Panh không mấu cong": 2,
      "Băng chun": 4,
      "Găng tay khám bệnh (đôi)": 5,
      "Nẹp cẳng chân (bộ)": 1,
      "Nước muối sinh lý NaCl 9 ‰": 1,
      "Phác đồ sơ cứu": 1,
      "Băng dính (cuộn)": 2,
      "Dung dịch Povidine": 1,
      "Nẹp đùi (bộ)": 1,
      "Bông hút nước (gói)": 5
    },
    "summaryStatus": "Đầy đủ"
  },
  {
    "id": "SCC-0002",
    "diaDiem": "Bếp",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Kim băng an toàn (các cỡ)": 0,
      "Garo cao su": 0,
      "Cồn 70°": 0,
      "Băng dính cá nhân": 0,
      "Băng cuộn vải (gói)": 0,
      "Kính bảo vệ mắt": 0,
      "Panh không mấu thẳng": 0,
      "Nẹp cánh tay (bộ)": 0,
      "Băng thun kích thước 5 x 200 cm": 0,
      "Tấm lót nilon không thấm nước": 0,
      "Nẹp cẳng tay (bộ)": 0,
      "Danh mục vật tư sơ cấp cứu": 0,
      "Kéo cắt băng": 0,
      "Nẹp cổ (cái)": 0,
      "Gạc thấm nước (10 miếng/gói)": 0,
      "Mặt nạ phòng độc thích hợp": 0,
      "Panh không mấu cong": 0,
      "Băng chun": 0,
      "Găng tay khám bệnh (đôi)": 0,
      "Nước muối sinh lý NaCl 9 ‰": 0,
      "Phác đồ sơ cứu": 0,
      "Nẹp cẳng chân (bộ)": 0,
      "Băng dính (cuộn)": 0,
      "Dung dịch Povidine": 0,
      "Nẹp đùi (bộ)": 0,
      "Bông hút nước (gói)": 0
    },
    "summaryStatus": "Đầy đủ"
  },
  {
    "id": "SCC-0003",
    "diaDiem": "Bếp",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Kim băng an toàn (các cỡ)": 5,
      "Garo cao su": 2,
      "Cồn 70°": 1,
      "Băng dính cá nhân": 5,
      "Băng cuộn vải (gói)": 2,
      "Kính bảo vệ mắt": 1,
      "Panh không mấu thẳng": 2,
      "Nẹp cánh tay (bộ)": 1,
      "Băng thun kích thước 5 x 200 cm": 4,
      "Tấm lót nilon không thấm nước": 1,
      "Nẹp cẳng tay (bộ)": 1,
      "Danh mục vật tư sơ cấp cứu": 1,
      "Kéo cắt băng": 1,
      "Nẹp cổ (cái)": 1,
      "Gạc thấm nước (10 miếng/gói)": 1,
      "Mặt nạ phòng độc thích hợp": 1,
      "Panh không mấu cong": 2,
      "Băng chun": 4,
      "Găng tay khám bệnh (đôi)": 5,
      "Phác đồ sơ cứu": 1,
      "Nước muối sinh lý NaCl 9 ‰": 1,
      "Nẹp cẳng chân (bộ)": 1,
      "Băng dính (cuộn)": 2,
      "Nẹp đùi (bộ)": 1,
      "Dung dịch Povidine": 1,
      "Bông hút nước (gói)": 5
    },
    "summaryStatus": "Đầy đủ"
  },
  {
    "id": "SCC-0004",
    "diaDiem": "KHO1",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Kim băng an toàn (các cỡ)": 5,
      "Garo cao su": 2,
      "Cồn 70°": 1,
      "Băng dính cá nhân": 5,
      "Băng cuộn vải (gói)": 2,
      "Kính bảo vệ mắt": 1,
      "Panh không mấu thẳng": 2,
      "Nẹp cánh tay (bộ)": 1,
      "Băng thun kích thước 5 x 200 cm": 4,
      "Tấm lót nilon không thấm nước": 1,
      "Nẹp cẳng tay (bộ)": 1,
      "Danh mục vật tư sơ cấp cứu": 1,
      "Kéo cắt băng": 1,
      "Nẹp cổ (cái)": 1,
      "Gạc thấm nước (10 miếng/gói)": 1,
      "Mặt nạ phòng độc thích hợp": 1,
      "Panh không mấu cong": 2,
      "Băng chun": 4,
      "Găng tay khám bệnh (đôi)": 5,
      "Phác đồ sơ cứu": 1,
      "Nẹp cẳng chân (bộ)": 1,
      "Nước muối sinh lý NaCl 9 ‰": 1,
      "Băng dính (cuộn)": 2,
      "Nẹp đùi (bộ)": 1,
      "Dung dịch Povidine": 1,
      "Bông hút nước (gói)": 5
    },
    "summaryStatus": "Đầy đủ"
  }
];

// --- 2. MÁY RỬA MẮT ---
export const EYEWASH_LOCATIONS: string[] = [
  "Kho Hóa chất",
  "Khu Phụ trợ",
  "Khu vực Sấy"
];

export const EYEWASH_CRITERIA: string[] = [
  "Nguồn nước",
  "Vòi phun",
  "Nước chảy liên tục 10-15 phút",
  "Nước chảy cao 15cm",
  "Máy sạch sẽ"
];

export const INITIAL_EYEWASH_INSPECTIONS: EyewashInspection[] = [
  {
    "id": "MRM-0088",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/5/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0089",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/5/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0090",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/5/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0094",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0095",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0096",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0091",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0092",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0093",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "9/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0085",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/22/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0086",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/22/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0087",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/22/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0082",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/15/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0083",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/15/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0084",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "8/15/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0070",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/3/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0071",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/3/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0072",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/3/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0079",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/25/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0080",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/25/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0081",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/25/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0067",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/2/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0068",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/2/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0069",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/2/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0076",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0077",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0078",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0073",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/11/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0074",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/11/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0075",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "7/11/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0055",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/6/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0056",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/6/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0057",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/6/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0064",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/27/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0065",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/27/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0066",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/27/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0061",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/20/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0062",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/20/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0063",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/20/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0058",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/13/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0059",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/13/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0060",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "6/13/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0040",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0041",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0042",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0052",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/30/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0053",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/30/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0054",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/30/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0049",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/23/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0050",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/23/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0051",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/23/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0046",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/16/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0047",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/16/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0048",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/16/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0043",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0044",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0045",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "5/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0034",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0035",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0036",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0031",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0032",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0033",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0037",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0038",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0039",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "4/18/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0028",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0029",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0030",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0025",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0026",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0027",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0022",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0023",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0024",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0019",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0020",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0021",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0016",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0017",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0018",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "3/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0013",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "2/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0014",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "2/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0015",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "2/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0127",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0128",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0129",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/9/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0136",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0137",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0138",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/26/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0133",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0134",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0135",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/19/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0130",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0131",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0132",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/12/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0115",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0116",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0117",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/7/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0112",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0113",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0114",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/4/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0124",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0125",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0126",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/28/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0121",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0122",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0123",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/21/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0118",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0119",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0120",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/14/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0109",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0110",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0111",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0106",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0107",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0108",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0103",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0104",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0105",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0100",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0101",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0102",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/10/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0097",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0098",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0099",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/1/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0001",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0002",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0003",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/8/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0010",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0011",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0012",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/31/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0007",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0008",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0009",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/24/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0004",
    "diaDiem": "Khu vực Sấy",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0005",
    "diaDiem": "Khu Phụ trợ",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "MRM-0006",
    "diaDiem": "Khu Hóa chất",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "1/17/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "items": {
      "Nguồn nước": "Đạt",
      "Vòi phun": "Đạt",
      "Nước chảy cao 15cm": "Đạt",
      "Nước chảy liên tục 10-15 phút": "Đạt",
      "Máy sạch sẽ": "Đạt"
    },
    "deXuat": "",
    "danhGiaTongQuat": "Đạt"
  }
];

// --- 3. HỆ THỐNG NƯỚC MƯA ---
export const STORMWATER_QUESTIONS: StormwaterQuestionConfig[] = [
  {
    "id": 1,
    "text": "Trời có mưa những ngày gần đây không?\nTrả lời tiếp câu 2 hoặc 3 bên dưới"
  },
  {
    "dependsOn": {
      "value": "Không",
      "qid": 1
    },
    "text": "Nếu không, có nước trong đường cống nước mưa không?",
    "id": 2
  },
  {
    "dependsOn": {
      "qid": 1,
      "value": "Có"
    },
    "text": "Nếu trời có mưa, có nước trong cống nước mưa không, nếu có thì nước có màu hoặc mùi bất thường không?",
    "id": 3
  },
  {
    "id": 4,
    "text": "Khu vực kho rác có dấu hiệu tràn đổ rác không?"
  },
  {
    "id": 5,
    "text": "Khu vực kho hóa chất có dấu hiệu tràn đổ không?"
  },
  {
    "text": "Khu vực nhà vệ sinh có bị tràn nước ra ngoài không?",
    "id": 6
  },
  {
    "text": "Khu vực nén khí, lò hơi có dầu hoặc nước tràn ra ngoài không?",
    "id": 7
  },
  {
    "text": "Khu vực trạm bơm chữa cháy có dầu chảy ra ngoài không?",
    "id": 8
  },
  {
    "id": 9,
    "text": "Khu vực nhà xe có xăng chảy ra ngoài không?"
  },
  {
    "text": "Xung quanh khu vực đường ống cống nước mưa đi qua có dòng nước hoặc hóa chất hoặc rác thải đổ vào không?",
    "id": 10
  },
  {
    "id": 11,
    "text": "Đường cống nước thải có bị tràn hoặc rò rỉ không?"
  },
  {
    "text": "Nguồn nước mưa có bị ô nhiễm không?",
    "id": 12,
    "group": "Kết luận"
  }
];

export const INITIAL_STORMWATER_INSPECTIONS: StormwaterInspection[] = [
  {
    "id": "HTNM-0010",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/5/2026",
    "createdAt": "2026-10-30T05:09:12.790Z",
    "answers": {
      "1": {
        "ketQua": "Có",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0013",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/26/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Có",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0012",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/19/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Có",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0011",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/12/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Có",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0006",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/8/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0009",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/29/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0008",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/22/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0007",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/15/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0005",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/1/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0001",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/4/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0004",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/25/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0003",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/18/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0002",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/11/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  },
  {
    "id": "HTNM-0014",
    "nguoiKT": "Trần Lê Hữu Lực (2265)",
    "maNV": "2265",
    "hoTen": "Trần Lê Hữu Lực",
    "boPhan": "HCNS",
    "thoiGian": "10/2/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "2": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "3": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "4": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "5": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "6": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "7": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "8": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "9": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "10": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "11": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      },
      "12": {
        "ketQua": "Không",
        "chiTiet": "",
        "ghiChu": ""
      }
    },
    "danhGiaTongQuat": "Đạt"
  }
];

// --- 4. NƯỚC NGẦM VÀ ĐẤT ---
export const GROUNDWATER_SOIL_CRITERIA: GroundwaterSoilCriteria[] = [
  {
    "id": 1,
    "text": "Đất xung quanh khu vực nhà máy có mùi bất thường (hóa chất, dầu, thối...) không?"
  },
  {
    "text": "Đất có dấu hiệu đổi màu bất thường (loang dầu, ố vàng, đen bất thường...) không?",
    "id": 2
  },
  {
    "id": 3,
    "text": "Thực vật xung quanh khu vực có dấu hiệu héo úa, chết bất thường không?"
  },
  {
    "id": 4,
    "text": "Khu vực lưu trữ hóa chất có dấu hiệu rò rỉ, thấm xuống nền đất không?"
  },
  {
    "id": 5,
    "text": "Khu vực bồn chứa nhiên liệu/dầu có dấu hiệu rò rỉ ra ngoài không?"
  },
  {
    "id": 6,
    "text": "Hệ thống cống rãnh, hố ga có dấu hiệu nứt vỡ, rò rỉ ngấm xuống đất không?"
  },
  {
    "id": 7,
    "text": "Khu vực chứa/xử lý chất thải có dấu hiệu tràn đổ, thấm xuống đất không?"
  },
  {
    "id": 8,
    "text": "Bề mặt đất tại khu vực khảo sát có dấu hiệu sụt lún, nứt nẻ bất thường không?"
  }
];

export const INITIAL_GROUNDWATER_SOIL_INSPECTIONS: GroundwaterSoilInspection[] = [
  {
    "id": "NGD-0003",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/25/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  },
  {
    "id": "NGD-0002",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/20/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  },
  {
    "id": "NGD-0001",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/29/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  },
  {
    "id": "NGD-0006",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/14/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  },
  {
    "id": "NGD-0005",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/17/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  },
  {
    "id": "NGD-0004",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/13/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Không có",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Không có",
        "lyDo": ""
      }
    },
    "tongHop": {
      "ketQuaSoBo": "Đạt",
      "khuVucNghiNgo": "",
      "canLayMau": "Không",
      "khuyenNghi": ""
    }
  }
];

export const OLD_TO_NEW_PERIODIC_IDS: Record<string, string> = {
  "HTNM-1790305150551": "HTNM-0001",
  "HTNM-1790305150552": "HTNM-0002",
  "HTNM-1790305150553": "HTNM-0003",
  "HTNM-1790305150554": "HTNM-0004",
  "HTNM-1790305150555": "HTNM-0005",
  "HTNM-1790305150556": "HTNM-0006",
  "HTNM-1790305150557": "HTNM-0007",
  "HTNM-1790305150558": "HTNM-0008",
  "HTNM-1790305150559": "HTNM-0009",
  "HTNM-1790305150560": "HTNM-0010",
  "HTNM-1790305150561": "HTNM-0011",
  "HTNM-1790305150562": "HTNM-0012",
  "HTNM-1790305150563": "HTNM-0013",
  "HTNM-1790911289270": "HTNM-0014",
  "SCC-1788856795276": "SCC-0001",
  "SCC-1788856736519": "SCC-0002",
  "SCC-1788855597628": "SCC-0003",
  "SCC-1788849546050": "SCC-0004",
  "NGD-1790316618656": "NGD-0001",
  "NGD-1790316618657": "NGD-0002",
  "NGD-1790316618658": "NGD-0003",
  "NGD-1790316618659": "NGD-0004",
  "NGD-1790316618660": "NGD-0005",
  "NGD-1790316618661": "NGD-0006",
  "MRM-1788942652435": "MRM-0001",
  "MRM-1788942652434": "MRM-0002",
  "MRM-1788942652433": "MRM-0003",
  "MRM-1788942652363": "MRM-0004",
  "MRM-1788942652362": "MRM-0005",
  "MRM-1788942652361": "MRM-0006",
  "MRM-1788942652366": "MRM-0007",
  "MRM-1788942652365": "MRM-0008",
  "MRM-1788942652364": "MRM-0009",
  "MRM-1788942652369": "MRM-0010",
  "MRM-1788942652368": "MRM-0011",
  "MRM-1788942652367": "MRM-0012",
  "MRM-1788942652375": "MRM-0013",
  "MRM-1788942652374": "MRM-0014",
  "MRM-1788942652373": "MRM-0015",
  "MRM-1788942652357": "MRM-0016",
  "MRM-1788942652356": "MRM-0017",
  "MRM-1788942652355": "MRM-0018",
  "MRM-1788942652456": "MRM-0019",
  "MRM-1788942652455": "MRM-0020",
  "MRM-1788942652454": "MRM-0021",
  "MRM-1788942652381": "MRM-0022",
  "MRM-1788942652380": "MRM-0023",
  "MRM-1788942652379": "MRM-0024",
  "MRM-1788942652384": "MRM-0025",
  "MRM-1788942652383": "MRM-0026",
  "MRM-1788942652382": "MRM-0027",
  "MRM-1788942652387": "MRM-0028",
  "MRM-1788942652386": "MRM-0029",
  "MRM-1788942652385": "MRM-0030",
  "MRM-1788942652390": "MRM-0031",
  "MRM-1788942652389": "MRM-0032",
  "MRM-1788942652388": "MRM-0033",
  "MRM-1788942652423": "MRM-0034",
  "MRM-1788942652422": "MRM-0035",
  "MRM-1788942652421": "MRM-0036",
  "MRM-1788942652396": "MRM-0037",
  "MRM-1788942652395": "MRM-0038",
  "MRM-1788942652394": "MRM-0039",
  "MRM-1788942652444": "MRM-0040",
  "MRM-1788942652443": "MRM-0041",
  "MRM-1788942652442": "MRM-0042",
  "MRM-1788942652483": "MRM-0043",
  "MRM-1788942652482": "MRM-0044",
  "MRM-1788942652481": "MRM-0045",
  "MRM-1788942652402": "MRM-0046",
  "MRM-1788942652401": "MRM-0047",
  "MRM-1788942652400": "MRM-0048",
  "MRM-1788942652405": "MRM-0049",
  "MRM-1788942652404": "MRM-0050",
  "MRM-1788942652403": "MRM-0051",
  "MRM-1788942652408": "MRM-0052",
  "MRM-1788942652407": "MRM-0053",
  "MRM-1788942652406": "MRM-0054",
  "MRM-1788942652411": "MRM-0055",
  "MRM-1788942652410": "MRM-0056",
  "MRM-1788942652409": "MRM-0057",
  "MRM-1788942652414": "MRM-0058",
  "MRM-1788942652413": "MRM-0059",
  "MRM-1788942652412": "MRM-0060",
  "MRM-1788942652417": "MRM-0061",
  "MRM-1788942652416": "MRM-0062",
  "MRM-1788942652415": "MRM-0063",
  "MRM-1788942652420": "MRM-0064",
  "MRM-1788942652419": "MRM-0065",
  "MRM-1788942652418": "MRM-0066",
  "MRM-1788942652372": "MRM-0067",
  "MRM-1788942652371": "MRM-0068",
  "MRM-1788942652370": "MRM-0069",
  "MRM-1788942652378": "MRM-0070",
  "MRM-1788942652377": "MRM-0071",
  "MRM-1788942652376": "MRM-0072",
  "MRM-1788942652471": "MRM-0073",
  "MRM-1788942652470": "MRM-0074",
  "MRM-1788942652469": "MRM-0075",
  "MRM-1788942652429": "MRM-0076",
  "MRM-1788942652428": "MRM-0077",
  "MRM-1788942652427": "MRM-0078",
  "MRM-1788942652432": "MRM-0079",
  "MRM-1788942652431": "MRM-0080",
  "MRM-1788942652430": "MRM-0081",
  "MRM-1788942652438": "MRM-0082",
  "MRM-1788942652437": "MRM-0083",
  "MRM-1788942652436": "MRM-0084",
  "MRM-1788942652441": "MRM-0085",
  "MRM-1788942652440": "MRM-0086",
  "MRM-1788942652439": "MRM-0087",
  "MRM-1788942652399": "MRM-0088",
  "MRM-1788942652398": "MRM-0089",
  "MRM-1788942652397": "MRM-0090",
  "MRM-1788942652450": "MRM-0091",
  "MRM-1788942652449": "MRM-0092",
  "MRM-1788942652448": "MRM-0093",
  "MRM-1788942652453": "MRM-0094",
  "MRM-1788942652452": "MRM-0095",
  "MRM-1788942652451": "MRM-0096",
  "MRM-1788942652360": "MRM-0097",
  "MRM-1788942652359": "MRM-0098",
  "MRM-1788942652358": "MRM-0099",
  "MRM-1788942652459": "MRM-0100",
  "MRM-1788942652458": "MRM-0101",
  "MRM-1788942652457": "MRM-0102",
  "MRM-1788942652462": "MRM-0103",
  "MRM-1788942652461": "MRM-0104",
  "MRM-1788942652460": "MRM-0105",
  "MRM-1788942652465": "MRM-0106",
  "MRM-1788942652464": "MRM-0107",
  "MRM-1788942652463": "MRM-0108",
  "MRM-1788942652468": "MRM-0109",
  "MRM-1788942652467": "MRM-0110",
  "MRM-1788942652466": "MRM-0111",
  "MRM-1788942652393": "MRM-0112",
  "MRM-1788942652392": "MRM-0113",
  "MRM-1788942652391": "MRM-0114",
  "MRM-1788942652426": "MRM-0115",
  "MRM-1788942652425": "MRM-0116",
  "MRM-1788942652424": "MRM-0117",
  "MRM-1788942652474": "MRM-0118",
  "MRM-1788942652473": "MRM-0119",
  "MRM-1788942652472": "MRM-0120",
  "MRM-1788942652477": "MRM-0121",
  "MRM-1788942652476": "MRM-0122",
  "MRM-1788942652475": "MRM-0123",
  "MRM-1788942652480": "MRM-0124",
  "MRM-1788942652479": "MRM-0125",
  "MRM-1788942652478": "MRM-0126",
  "MRM-1788942652447": "MRM-0127",
  "MRM-1788942652446": "MRM-0128",
  "MRM-1788942652445": "MRM-0129",
  "MRM-1788942652486": "MRM-0130",
  "MRM-1788942652485": "MRM-0131",
  "MRM-1788942652484": "MRM-0132",
  "MRM-1788942652489": "MRM-0133",
  "MRM-1788942652488": "MRM-0134",
  "MRM-1788942652487": "MRM-0135",
  "MRM-1788942652492": "MRM-0136",
  "MRM-1788942652491": "MRM-0137",
  "MRM-1788942652490": "MRM-0138"
};
