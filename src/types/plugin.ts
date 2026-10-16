export interface PluginModule {
  id: string;
  name: string;
  code: string; // EHS, 5S, ISO_9001, KAIZEN...
  category: 'safety' | 'quality' | 'operations' | 'management';
  description: string;
  version: string;
  isEnabled: boolean;
  iconName: string;
  author: string;
  associatedForms?: string[]; // Gắn liền với biểu mẫu nào
  settings?: Record<string, any>;
}

export const INITIAL_PLUGINS: PluginModule[] = [
  {
    id: 'plugin-safety',
    name: 'An toàn lao động & Sức khỏe nghề nghiệp',
    code: 'EHS_SAFETY',
    category: 'safety',
    description: 'Theo dõi sự cố an toàn, thống kê tai nạn lao động, cấp phát bảo hộ lao động (BHLĐ).',
    version: '1.2.0',
    isEnabled: true,
    iconName: 'ShieldAlert',
    author: 'Long Khai Engineering',
  },
  {
    id: 'plugin-5s',
    name: 'Kiểm tra & Đánh giá 5S Nhà máy',
    code: '5S_AUDIT',
    category: 'quality',
    description: 'Checklist đánh giá Sàng lọc, Sắp xếp, Sạch sẽ, Săn sóc, Sẵn sàng theo từng chuyền sản xuất.',
    version: '1.0.4',
    isEnabled: true,
    iconName: 'Sparkles',
    author: 'Long Khai QA/QC',
  },
  {
    id: 'plugin-kaizen',
    name: 'Ý tưởng Kaizen & Cải tiến liên tục',
    code: 'KAIZEN_CAPA',
    category: 'operations',
    description: 'Hòm thư điện tử ghi nhận sáng kiến cải tiến năng suất, tiết kiệm chi phí và theo dõi hành động khắc phục CAPA.',
    version: '2.0.0',
    isEnabled: true,
    iconName: 'Lightbulb',
    author: 'Ban Cải tiến Kaizen',
  },
  {
    id: 'plugin-incident',
    name: 'Báo cáo sự cố thiết bị & dừng chuyền',
    code: 'INCIDENT_REPORT',
    category: 'operations',
    description: 'Ghi nhận sự cố hư hỏng máy móc, dừng chuyền sản xuất, tính toán thời gian MTTR, MTBF.',
    version: '1.1.0',
    isEnabled: true,
    iconName: 'AlertTriangle',
    author: 'Bộ phận Cơ Điện',
  },
  {
    id: 'plugin-supplier',
    name: 'Đánh giá nhà cung cấp',
    code: 'SUPPLIER_EVAL',
    category: 'management',
    description: 'Đánh giá định kỳ chất lượng nguyên vật liệu, tiến độ giao hàng và dịch vụ nhà cung cấp.',
    version: '1.0.0',
    isEnabled: false,
    iconName: 'Truck',
    author: 'Phòng Mua hàng & Cung ứng',
  },
  {
    id: 'plugin-iso9001',
    name: 'Hệ thống Quản lý Chất lượng ISO 9001:2015',
    code: 'ISO_9001',
    category: 'quality',
    description: 'Theo dõi đánh giá nội bộ, tài liệu quy trình tác nghiệp chuẩn SOP và quản lý rủi ro chất lượng.',
    version: '1.0.0',
    isEnabled: false,
    iconName: 'Award',
    author: 'Ban ISO',
  },
  {
    id: 'plugin-iso14001',
    name: 'Hệ thống Quản lý Môi trường ISO 14001:2015',
    code: 'ISO_14001',
    category: 'safety',
    description: 'Kiểm soát khói thải, nước thải sản xuất, chất thải nguy hại và tiêu thụ năng lượng.',
    version: '1.0.0',
    isEnabled: false,
    iconName: 'Leaf',
    author: 'Ban Môi trường EHS',
  },
  {
    id: 'plugin-iso45001',
    name: 'Hệ thống An toàn & Sức khỏe Nghề nghiệp ISO 45001:2018',
    code: 'ISO_45001',
    category: 'safety',
    description: 'Đánh giá mối nguy và quản trị rủi ro tai nạn trong môi trường chế tạo & sản xuất.',
    version: '1.0.0',
    isEnabled: false,
    iconName: 'HeartHandshake',
    author: 'Ban An toàn',
  },
  {
    id: 'plugin-haccp',
    name: 'Tiêu chuẩn Thực phẩm HACCP & BRC',
    code: 'HACCP_BRC',
    category: 'quality',
    description: 'Giám sát điểm kiểm soát tới hạn CCP, hồ sơ vệ sinh an toàn thực phẩm trong nhà xưởng.',
    version: '1.0.0',
    isEnabled: false,
    iconName: 'CheckCircle2',
    author: 'Bộ phận An toàn Thực phẩm',
  },
];
