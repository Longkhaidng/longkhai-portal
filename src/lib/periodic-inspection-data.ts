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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng chun",
      "chuan": 4,
      "group": "Băng, Gạc Y Tế"
    },
    {
      "name": "Băng cuộn vải (gói)",
      "chuan": 2,
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
      "chuan": 5,
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
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Panh không mấu cong",
      "chuan": 2,
      "group": "Dụng Cụ"
    },
    {
      "name": "Găng tay khám bệnh (đôi)",
      "chuan": 5,
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
    "id": "SCC-1788856795276",
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
    "id": "SCC-1788856736519",
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
    "id": "SCC-1788855597628",
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
    "id": "SCC-1788849546050",
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
    "id": "MRM-1788942652399",
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
    "id": "MRM-1788942652398",
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
    "id": "MRM-1788942652397",
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
    "id": "MRM-1788942652453",
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
    "id": "MRM-1788942652452",
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
    "id": "MRM-1788942652451",
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
    "id": "MRM-1788942652450",
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
    "id": "MRM-1788942652449",
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
    "id": "MRM-1788942652448",
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
    "id": "MRM-1788942652441",
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
    "id": "MRM-1788942652440",
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
    "id": "MRM-1788942652439",
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
    "id": "MRM-1788942652438",
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
    "id": "MRM-1788942652437",
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
    "id": "MRM-1788942652436",
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
    "id": "MRM-1788942652378",
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
    "id": "MRM-1788942652377",
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
    "id": "MRM-1788942652376",
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
    "id": "MRM-1788942652432",
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
    "id": "MRM-1788942652431",
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
    "id": "MRM-1788942652430",
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
    "id": "MRM-1788942652372",
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
    "id": "MRM-1788942652371",
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
    "id": "MRM-1788942652370",
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
    "id": "MRM-1788942652429",
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
    "id": "MRM-1788942652428",
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
    "id": "MRM-1788942652427",
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
    "id": "MRM-1788942652471",
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
    "id": "MRM-1788942652470",
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
    "id": "MRM-1788942652469",
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
    "id": "MRM-1788942652411",
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
    "id": "MRM-1788942652410",
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
    "id": "MRM-1788942652409",
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
    "id": "MRM-1788942652420",
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
    "id": "MRM-1788942652419",
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
    "id": "MRM-1788942652418",
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
    "id": "MRM-1788942652417",
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
    "id": "MRM-1788942652416",
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
    "id": "MRM-1788942652415",
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
    "id": "MRM-1788942652414",
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
    "id": "MRM-1788942652413",
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
    "id": "MRM-1788942652412",
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
    "id": "MRM-1788942652444",
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
    "id": "MRM-1788942652443",
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
    "id": "MRM-1788942652442",
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
    "id": "MRM-1788942652408",
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
    "id": "MRM-1788942652407",
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
    "id": "MRM-1788942652406",
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
    "id": "MRM-1788942652405",
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
    "id": "MRM-1788942652404",
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
    "id": "MRM-1788942652403",
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
    "id": "MRM-1788942652402",
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
    "id": "MRM-1788942652401",
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
    "id": "MRM-1788942652400",
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
    "id": "MRM-1788942652483",
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
    "id": "MRM-1788942652482",
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
    "id": "MRM-1788942652481",
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
    "id": "MRM-1788942652423",
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
    "id": "MRM-1788942652422",
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
    "id": "MRM-1788942652421",
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
    "id": "MRM-1788942652390",
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
    "id": "MRM-1788942652389",
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
    "id": "MRM-1788942652388",
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
    "id": "MRM-1788942652396",
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
    "id": "MRM-1788942652395",
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
    "id": "MRM-1788942652394",
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
    "id": "MRM-1788942652387",
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
    "id": "MRM-1788942652386",
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
    "id": "MRM-1788942652385",
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
    "id": "MRM-1788942652384",
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
    "id": "MRM-1788942652383",
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
    "id": "MRM-1788942652382",
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
    "id": "MRM-1788942652381",
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
    "id": "MRM-1788942652380",
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
    "id": "MRM-1788942652379",
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
    "id": "MRM-1788942652456",
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
    "id": "MRM-1788942652455",
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
    "id": "MRM-1788942652454",
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
    "id": "MRM-1788942652357",
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
    "id": "MRM-1788942652356",
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
    "id": "MRM-1788942652355",
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
    "id": "MRM-1788942652375",
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
    "id": "MRM-1788942652374",
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
    "id": "MRM-1788942652373",
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
    "id": "MRM-1788942652447",
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
    "id": "MRM-1788942652446",
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
    "id": "MRM-1788942652445",
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
    "id": "MRM-1788942652492",
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
    "id": "MRM-1788942652491",
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
    "id": "MRM-1788942652490",
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
    "id": "MRM-1788942652489",
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
    "id": "MRM-1788942652488",
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
    "id": "MRM-1788942652487",
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
    "id": "MRM-1788942652486",
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
    "id": "MRM-1788942652485",
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
    "id": "MRM-1788942652484",
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
    "id": "MRM-1788942652426",
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
    "id": "MRM-1788942652425",
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
    "id": "MRM-1788942652424",
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
    "id": "MRM-1788942652393",
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
    "id": "MRM-1788942652392",
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
    "id": "MRM-1788942652391",
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
    "id": "MRM-1788942652480",
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
    "id": "MRM-1788942652479",
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
    "id": "MRM-1788942652478",
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
    "id": "MRM-1788942652477",
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
    "id": "MRM-1788942652476",
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
    "id": "MRM-1788942652475",
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
    "id": "MRM-1788942652474",
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
    "id": "MRM-1788942652473",
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
    "id": "MRM-1788942652472",
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
    "id": "MRM-1788942652468",
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
    "id": "MRM-1788942652467",
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
    "id": "MRM-1788942652466",
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
    "id": "MRM-1788942652465",
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
    "id": "MRM-1788942652464",
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
    "id": "MRM-1788942652463",
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
    "id": "MRM-1788942652462",
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
    "id": "MRM-1788942652461",
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
    "id": "MRM-1788942652460",
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
    "id": "MRM-1788942652459",
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
    "id": "MRM-1788942652458",
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
    "id": "MRM-1788942652457",
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
    "id": "MRM-1788942652360",
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
    "id": "MRM-1788942652359",
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
    "id": "MRM-1788942652358",
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
    "id": "MRM-1788942652435",
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
    "id": "MRM-1788942652434",
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
    "id": "MRM-1788942652433",
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
    "id": "MRM-1788942652369",
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
    "id": "MRM-1788942652368",
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
    "id": "MRM-1788942652367",
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
    "id": "MRM-1788942652366",
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
    "id": "MRM-1788942652365",
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
    "id": "MRM-1788942652364",
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
    "id": "MRM-1788942652363",
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
    "id": "MRM-1788942652362",
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
    "id": "MRM-1788942652361",
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
    "id": "HTNM-1790305150560",
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
    "id": "HTNM-1790305150563",
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
    "id": "HTNM-1790305150562",
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
    "id": "HTNM-1790305150561",
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
    "id": "HTNM-1790305150556",
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
    "id": "HTNM-1790305150559",
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
    "id": "HTNM-1790305150558",
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
    "id": "HTNM-1790305150557",
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
    "id": "HTNM-1790305150555",
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
    "id": "HTNM-1790305150551",
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
    "id": "HTNM-1790305150554",
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
    "id": "HTNM-1790305150553",
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
    "id": "HTNM-1790305150552",
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
    "id": "HTNM-1790911289270",
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
    "id": "NGD-1790316618658",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "9/25/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
    "id": "NGD-1790316618657",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "8/20/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
    "id": "NGD-1790316618656",
    "nguoiKT": "Nguyễn Thị Hậu (2840)",
    "maNV": "2840",
    "hoTen": "Nguyễn Thị Hậu",
    "boPhan": "HCNS",
    "thoiGian": "7/29/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
    "id": "NGD-1790316618661",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "12/14/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
    "id": "NGD-1790316618660",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "11/17/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
    "id": "NGD-1790316618659",
    "nguoiKT": "Võ Thị Tuyết (1139)",
    "maNV": "1139",
    "hoTen": "Võ Thị Tuyết",
    "boPhan": "HCNS",
    "thoiGian": "10/13/2026",
    "createdAt": "2026-10-30T05:09:12.791Z",
    "answers": {
      "1": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "2": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "3": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "4": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "5": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "6": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "7": {
        "ketQua": "Đạt",
        "lyDo": ""
      },
      "8": {
        "ketQua": "Đạt",
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
