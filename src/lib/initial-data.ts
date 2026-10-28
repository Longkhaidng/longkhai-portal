import { User, CATEGORY_DEFINITIONS, Department, WebIntegration, Position } from '@/types/user';
import { Announcement } from '@/types/announcement';
import { DynamicFormSchema } from '@/types/dynamicForm';
import { INITIAL_PLUGINS } from '@/types/plugin';

/**
 * ROOT ADMINISTRATOR ACCOUNT
 * Duy nhất một tài khoản khởi tạo để Quản trị viên đăng nhập lần đầu,
 * sau đó tải toàn bộ nhân viên công ty bằng file Excel hoặc tạo thủ công.
 */
export const INITIAL_ROOT_ADMIN: User = {
  id: '2265',
  name: 'Trần Lê Hữu Lực',
  email: 'it@longkhai.com.vn',
  phone: '0935198776',
  department: 'Bộ Phận Công Nghệ Thông Tin (IT)',
  position: 'Quản trị viên Cổng thông tin',
  role: 'admin',
  permissions: CATEGORY_DEFINITIONS.map((c) => c.id),
  allowedWebIntegrations: ['WEB-001', 'WEB-002', 'WEB-003'],
  isActive: true,
  password: 'admin@123',
  createdAt: '2026-01-01T08:00:00.000Z',
  updatedAt: '2026-01-01T08:00:00.000Z',
};

/**
 * Danh sách Phòng Ban ban đầu của nhà máy Long Khải
 */
export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'PB-BGD',
    code: 'BGD',
    name: 'Ban Giám Đốc',
    description: 'Hội đồng quản trị và Ban tổng giám đốc điều hành nhà máy',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-HCNS',
    code: 'HCNS',
    name: 'Phòng Hành Chính Nhân Sự',
    description: 'Quản lý nhân sự, tiền lương, tuyển dụng và đời sống công nhân viên',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-SX1',
    code: 'SX1',
    name: 'Xưởng Sản Xuất 1 (Cơ Khí & CNC)',
    description: 'Xưởng gia công cắt gọt kim loại, tiện phay CNC, khuôn mẫu',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-SX2',
    code: 'SX2',
    name: 'Xưởng Sản Xuất 2 (Lắp Ráp & Sơn)',
    description: 'Chuyền lắp ráp hoàn thiện, sơn tĩnh điện và đóng gói thành phẩm',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-CD',
    code: 'CD',
    name: 'Phòng Cơ Điện & Bảo Trì',
    description: 'Bảo trì máy móc thiết bị, hệ thống trạm điện, khí nén và phụ trợ',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-QA',
    code: 'QA',
    name: 'Phòng Quản Lý Chất Lượng (QA/QC)',
    description: 'Kiểm soát chất lượng đầu vào IQC, trên chuyền PQC và xuất xưởng OQC',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-KT',
    code: 'KT',
    name: 'Phòng Kế Toán Tài Chính',
    description: 'Kế toán giá thành, thanh toán công nợ, hóa đơn chứng từ',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-KHO',
    code: 'KHO',
    name: 'Phòng Kho Vận & Vật Tư',
    description: 'Kho nguyên vật liệu, kho thành phẩm và điều vận xe giao nhận hàng',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-BV',
    code: 'BV',
    name: 'Đội Bảo Vệ & An Ninh',
    description: 'Kiểm soát an ninh cổng ra vào, tài sản và trật tự toàn nhà máy',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'PB-IT',
    code: 'IT',
    name: 'Bộ Phận Công Nghệ Thông Tin (IT)',
    description: 'Quản trị mạng, máy tính, hệ thống camera và Cổng thông tin nội bộ',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

/**
 * Danh sách Trang Website Tích Hợp sẵn có mẫu
 */
export const INITIAL_WEB_INTEGRATIONS: WebIntegration[] = [
  {
    id: 'WEB-001',
    title: 'Kiểm tra thực phẩm 3 bước',
    url: 'https://script.google.com/macros/s/AKfycbzKZiFvK7KB',
    description: 'Quy trình kiểm thực 3 bước và vệ sinh an toàn thực phẩm bếp ăn / nhà xưởng',
    iconName: 'Globe',
    displayMode: 'new_tab',
    order: 1,
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'WEB-002',
    title: 'Kiểm tra PCCC định kỳ',
    url: 'https://script.google.com/macros/s/AKfycbzPCCCExample',
    description: 'Trang web biểu mẫu kiểm tra bình chữa cháy và phương tiện PCCC định kỳ',
    iconName: 'Globe',
    displayMode: 'new_tab',
    order: 2,
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'WEB-003',
    title: 'Hệ Thống Báo Cáo Sản Xuất PowerBI',
    url: 'https://app.powerbi.com',
    description: 'Báo cáo năng suất chuyền, OEE máy móc và chỉ số sản lượng theo ca',
    iconName: 'BarChart',
    displayMode: 'embed',
    order: 3,
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

/**
 * Thông báo nội bộ nhà máy mẫu (Markdown)
 */
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ANN-001',
    title: 'Nội quy An toàn Lao động Nhà máy Năm 2026',
    category: 'noi_quy',
    summary: 'Tất cả cán bộ công nhân viên bắt buộc tuân thủ trang bị BHLĐ khi vào khu vực sản xuất.',
    contentMarkdown: `### 1. NGUYÊN TẮC AN TOÀN CHUNG
1. 100% cán bộ công nhân viên khi bước vào xưởng sản xuất phải mang đầy đủ **Trang thiết bị bảo hộ lao động (BHLĐ)**:
   - Giày bảo hộ mũi thép chống đinh và dập ngón.
   - Quần áo đồng phục đúng quy cách, cài gọn gàng.
   - Nón bảo hộ tại các khu vực cẩu trục, kho kệ cao.
   - Kính bảo hộ khi thao tác máy hàn, cắt, mài, gia công cơ khí.

### 2. AN TOÀN VẬN HÀNH THIẾT BỊ
- Tuyệt đối không tự ý bật máy móc khi chưa được đào tạo vận hành.
- Kiểm tra nút dừng khẩn cấp (Emergency Stop) trước khi khởi động chuyền.
- Không để vật tư, hàng hóa cản trở lối đi và cửa thoát nạn.`,
    authorName: 'Ban An Toàn EHS',
    authorId: '2265',
    isPinned: true,
    publishedAt: '2026-01-05T08:00:00.000Z',
    updatedAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'ANN-002',
    title: 'Quy trình Xác nhận Công và Quản lý Ra Vào Cổng Điện tử',
    category: 'chinh_sach',
    summary: 'Áp dụng quy trình số hóa phiếu xác nhận công và phiếu ra vào cổng có gắn mã QR code từ tháng này.',
    contentMarkdown: `### THÔNG BÁO VỀ VIỆC SỐ HÓA QUY TRÌNH HÀNH CHÍNH NHÀ MÁY

Kính gửi: Toàn thể Cán bộ Công nhân viên Công ty,

Nhằm hiện đại hóa công tác quản trị và giảm thiểu thủ tục giấy tờ, Ban Giám Đốc ban hành quy định:
1. **Quên thẻ / Hỏng thẻ**: Nhân viên làm Phiếu Xác nhận công trên **LONG KHẢI PORTAL**, hệ thống tự động chuyển duyệt đến Bảo vệ, Trưởng bộ phận và Phòng IT/Kế toán.
2. **Mất thẻ**: Bắt buộc giải trình trên portal, chuyển qua Bảo vệ, Trưởng BP, Kế toán và IT để tiến hành cấp phôi thẻ mới.
3. **Ra vào cổng trong giờ làm việc**:
   - Điền phiếu xin ra cổng trước ít nhất 30 phút.
   - Khi được Quản lý duyệt, hệ thống tự động sinh **Mã QR Code**.
   - Nhân viên xuất trình QR Code tại bốt bảo vệ để quét máy ghi nhận giờ ra và giờ vào thực tế.`,
    authorName: 'Phòng Hành Chính Nhân Sự',
    authorId: '2265',
    isPinned: true,
    publishedAt: '2026-02-01T08:00:00.000Z',
    updatedAt: '2026-02-01T08:00:00.000Z',
  },
];

/**
 * Biểu mẫu động có sẵn không cần sửa code
 */
export const INITIAL_DYNAMIC_FORMS: DynamicFormSchema[] = [
  {
    id: 'FORM-5S-AUDIT',
    title: 'Biên bản Kiểm tra & Đánh giá 5S Nhà máy',
    description: 'Phiếu kiểm tra Sàng lọc, Sắp xếp, Sạch sẽ, Săn sóc, Sẵn sàng tại chuyền sản xuất.',
    category: 'Chất lượng & 5S',
    icon: 'Sparkles',
    allowedDepartments: ['all'],
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    workflow: [
      { stepOrder: 1, stepName: 'Tổ trưởng sản xuất xác nhận', approverRole: 'team_leader', canReject: true },
      { stepOrder: 2, stepName: 'Trưởng ban 5S / QA duyệt', approverRole: 'manager', canReject: true },
    ],
    fields: [
      { id: 'area_checked', label: 'Khu vực / Chuyền kiểm tra', fieldType: 'select', required: true, options: [
        { label: 'Chuyền sản xuất 1 - Cơ khí', value: 'chuyen_1' },
        { label: 'Chuyền sản xuất 2 - Lắp ráp', value: 'chuyen_2' },
        { label: 'Kho Nguyên vật liệu', value: 'kho_nvl' },
        { label: 'Kho Thành phẩm', value: 'kho_tp' },
        { label: 'Khu vực Bảo trì Cơ điện', value: 'bao_tri' },
      ]},
      { id: 'seiri_score', label: '1. Sàng lọc (Loại bỏ vật dụng không cần thiết)', fieldType: 'select', required: true, options: [
        { label: 'Tốt (5 điểm) - Không có đồ thừa, rác thải', value: '5' },
        { label: 'Khá (4 điểm) - Còn 1 vài chi tiết nhỏ', value: '4' },
        { label: 'Trung bình (3 điểm)', value: '3' },
        { label: 'Kém (1-2 điểm) - Bừa bộn đồ hỏng', value: '2' },
      ]},
      { id: 'seiton_score', label: '2. Sắp xếp (Dễ tìm, dễ thấy, dễ lấy, có vạch kẻ)', fieldType: 'select', required: true, options: [
        { label: 'Tốt (5 điểm) - Vị trí định danh rõ ràng', value: '5' },
        { label: 'Khá (4 điểm)', value: '4' },
        { label: 'Kém (1-2 điểm) - Để sai vị trí quy định', value: '2' },
      ]},
      { id: 'defect_notes', label: 'Chi tiết điểm chưa đạt cần khắc phục', fieldType: 'textarea', required: false, placeholder: 'Ghi rõ vị trí cần khắc phục và thời hạn hoàn thành...' },
    ],
  },
  {
    id: 'FORM-KAIZEN-PROPOSAL',
    title: 'Phiếu Đề xuất Sáng kiến Cải tiến Kaizen',
    description: 'Dành cho mọi cán bộ nhân viên đóng góp ý kiến cải tiến năng suất, tiết kiệm nguyên liệu, an toàn lao động.',
    category: 'Cải tiến Kaizen',
    icon: 'Lightbulb',
    allowedDepartments: ['all'],
    isActive: true,
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    workflow: [
      { stepOrder: 1, stepName: 'Quản lý trực tiếp thẩm định', approverRole: 'manager', canReject: true },
      { stepOrder: 2, stepName: 'Ban Kaizen & Giám đốc phê duyệt', approverRole: 'admin', canReject: true },
    ],
    fields: [
      { id: 'idea_title', label: 'Tên đề tài cải tiến', fieldType: 'text', required: true, placeholder: 'VD: Cải tiến đồ gá gia công chi tiết trục' },
      { id: 'current_state', label: 'Hiện trạng khó khăn / lãng phí hiện nay', fieldType: 'textarea', required: true, placeholder: 'Thao tác mất nhiều thời gian, nguy cơ kẹp tay, tốn phôi...' },
      { id: 'solution', label: 'Giải pháp cải tiến đề xuất', fieldType: 'textarea', required: true, placeholder: 'Mô tả chi tiết giải pháp mới...' },
      { id: 'expected_benefit', label: 'Hiệu quả ước tính (Thời gian / Chi phí / An toàn)', fieldType: 'text', required: true, placeholder: 'VD: Giảm 15 giây/sản phẩm, tiết kiệm 20 triệu/tháng' },
    ],
  },
];

/**
 * Danh sách Chức vụ cài đặt ban đầu của nhà máy Long Khải
 */
export const INITIAL_POSITIONS: Position[] = [
  {
    "id": "POS-001",
    "name": "Bảo vệ",
    "code": "CV-001",
    "description": "Chức vụ / Vị trí Bảo vệ",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-002",
    "name": "Bếp chính",
    "code": "CV-002",
    "description": "Chức vụ / Vị trí Bếp chính",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-003",
    "name": "Chuyên viên hành chính nhân sự",
    "code": "CV-003",
    "description": "Chức vụ / Vị trí Chuyên viên hành chính nhân sự",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-004",
    "name": "Chuyên viên kế hoạch HT",
    "code": "CV-004",
    "description": "Chức vụ / Vị trí Chuyên viên kế hoạch HT",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-005",
    "name": "Chuyên viên kế hoạch dệt",
    "code": "CV-005",
    "description": "Chức vụ / Vị trí Chuyên viên kế hoạch dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-006",
    "name": "Chuyên viên kỹ thuật cơ điện",
    "code": "CV-006",
    "description": "Chức vụ / Vị trí Chuyên viên kỹ thuật cơ điện",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-007",
    "name": "Công nhân tổ 1 - K",
    "code": "CV-007",
    "description": "Chức vụ / Vị trí Công nhân tổ 1 - K",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-008",
    "name": "Công nhân tổ 1 - L",
    "code": "CV-008",
    "description": "Chức vụ / Vị trí Công nhân tổ 1 - L",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-009",
    "name": "Công nhân tổ 2 - CĐS",
    "code": "CV-009",
    "description": "Chức vụ / Vị trí Công nhân tổ 2 - CĐS",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-010",
    "name": "Công nhân tổ 2 - GS",
    "code": "CV-010",
    "description": "Chức vụ / Vị trí Công nhân tổ 2 - GS",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-011",
    "name": "Công nhân tổ 2 - KTTH",
    "code": "CV-011",
    "description": "Chức vụ / Vị trí Công nhân tổ 2 - KTTH",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-012",
    "name": "Công nhân tổ 4 - GBG",
    "code": "CV-012",
    "description": "Chức vụ / Vị trí Công nhân tổ 4 - GBG",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-013",
    "name": "Công nhân tổ 4 - TN-GBG",
    "code": "CV-013",
    "description": "Chức vụ / Vị trí Công nhân tổ 4 - TN-GBG",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-014",
    "name": "Công nhân tổ 5 - ĐK",
    "code": "CV-014",
    "description": "Chức vụ / Vị trí Công nhân tổ 5 - ĐK",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-015",
    "name": "Công nhân vận hành máy dệt kim tròn -KTD",
    "code": "CV-015",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy dệt kim tròn -KTD",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-016",
    "name": "Công nhân vận hành máy dệt kim tròn -TD",
    "code": "CV-016",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy dệt kim tròn -TD",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-017",
    "name": "Công nhân vận hành máy dệt kim tròn -TD+BTD",
    "code": "CV-017",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy dệt kim tròn -TD+BTD",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-018",
    "name": "Công nhân vận hành máy in trên trục - Máy trưởng",
    "code": "CV-018",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy in trên trục - Máy trưởng",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-019",
    "name": "Công nhân vận hành máy in trên trục - Tổ 6 - In",
    "code": "CV-019",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy in trên trục - Tổ 6 - In",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-020",
    "name": "Công nhân vận hành máy sấy văng - Tổ 3 - S",
    "code": "CV-020",
    "description": "Chức vụ / Vị trí Công nhân vận hành máy sấy văng - Tổ 3 - S",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-021",
    "name": "Giám sát nhà máy",
    "code": "CV-021",
    "description": "Chức vụ / Vị trí Giám sát nhà máy",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-022",
    "name": "Kế toán tổng hợp",
    "code": "CV-022",
    "description": "Chức vụ / Vị trí Kế toán tổng hợp",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-023",
    "name": "Nhân viên KCS Hoàn Thành",
    "code": "CV-023",
    "description": "Chức vụ / Vị trí Nhân viên KCS Hoàn Thành",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-024",
    "name": "Nhân viên KCS dệt",
    "code": "CV-024",
    "description": "Chức vụ / Vị trí Nhân viên KCS dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-025",
    "name": "Nhân viên Kỹ thuật",
    "code": "CV-025",
    "description": "Chức vụ / Vị trí Nhân viên Kỹ thuật",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-026",
    "name": "Nhân viên công nghệ dệt",
    "code": "CV-026",
    "description": "Chức vụ / Vị trí Nhân viên công nghệ dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-027",
    "name": "Nhân viên công nghệ mẫu",
    "code": "CV-027",
    "description": "Chức vụ / Vị trí Nhân viên công nghệ mẫu",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-028",
    "name": "Nhân viên cơ điện",
    "code": "CV-028",
    "description": "Chức vụ / Vị trí Nhân viên cơ điện",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-029",
    "name": "Nhân viên dọn dẹp",
    "code": "CV-029",
    "description": "Chức vụ / Vị trí Nhân viên dọn dẹp",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-030",
    "name": "Nhân viên kinh tế",
    "code": "CV-030",
    "description": "Chức vụ / Vị trí Nhân viên kinh tế",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-031",
    "name": "Nhân viên kinh tế - kế hoạch Dệt",
    "code": "CV-031",
    "description": "Chức vụ / Vị trí Nhân viên kinh tế - kế hoạch Dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-032",
    "name": "Nhân viên kinh tế - kế hoạch HT",
    "code": "CV-032",
    "description": "Chức vụ / Vị trí Nhân viên kinh tế - kế hoạch HT",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-033",
    "name": "Nhân viên kế hoạch dệt",
    "code": "CV-033",
    "description": "Chức vụ / Vị trí Nhân viên kế hoạch dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-034",
    "name": "Nhân viên kế toán",
    "code": "CV-034",
    "description": "Chức vụ / Vị trí Nhân viên kế toán",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-035",
    "name": "Nhân viên phục vụ - kho PL",
    "code": "CV-035",
    "description": "Chức vụ / Vị trí Nhân viên phục vụ - kho PL",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-036",
    "name": "Nhân viên phục vụ HT",
    "code": "CV-036",
    "description": "Chức vụ / Vị trí Nhân viên phục vụ HT",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-037",
    "name": "Nhân viên phục vụ dệt",
    "code": "CV-037",
    "description": "Chức vụ / Vị trí Nhân viên phục vụ dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-038",
    "name": "Nhân viên phục vụ kiểm hàng",
    "code": "CV-038",
    "description": "Chức vụ / Vị trí Nhân viên phục vụ kiểm hàng",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-039",
    "name": "Nhân viên tưới cây",
    "code": "CV-039",
    "description": "Chức vụ / Vị trí Nhân viên tưới cây",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-040",
    "name": "Nhân viên vận hành lò hơi",
    "code": "CV-040",
    "description": "Chức vụ / Vị trí Nhân viên vận hành lò hơi",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-041",
    "name": "Phó giám đốc HCNS",
    "code": "CV-041",
    "description": "Chức vụ / Vị trí Phó giám đốc HCNS",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-042",
    "name": "Phụ bếp",
    "code": "CV-042",
    "description": "Chức vụ / Vị trí Phụ bếp",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-043",
    "name": "Phụ kho",
    "code": "CV-043",
    "description": "Chức vụ / Vị trí Phụ kho",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-044",
    "name": "Phụ trách KCS",
    "code": "CV-044",
    "description": "Chức vụ / Vị trí Phụ trách KCS",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-045",
    "name": "Phụ trách PX Dệt + PXHT",
    "code": "CV-045",
    "description": "Chức vụ / Vị trí Phụ trách PX Dệt + PXHT",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-046",
    "name": "Phụ trách PX Hoàn thành",
    "code": "CV-046",
    "description": "Chức vụ / Vị trí Phụ trách PX Hoàn thành",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-047",
    "name": "Phụ trách kho",
    "code": "CV-047",
    "description": "Chức vụ / Vị trí Phụ trách kho",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-048",
    "name": "Phụ trách kỹ thuật - PX Dệt",
    "code": "CV-048",
    "description": "Chức vụ / Vị trí Phụ trách kỹ thuật - PX Dệt",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-049",
    "name": "Phụ trách sản xuất",
    "code": "CV-049",
    "description": "Chức vụ / Vị trí Phụ trách sản xuất",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-050",
    "name": "Quản trị viên CNTT (Admin)",
    "code": "CV-050",
    "description": "Chức vụ / Vị trí Quản trị viên CNTT (Admin)",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-051",
    "name": "Thủ kho phụ liệu",
    "code": "CV-051",
    "description": "Chức vụ / Vị trí Thủ kho phụ liệu",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-052",
    "name": "Thủ kho thành phẩm",
    "code": "CV-052",
    "description": "Chức vụ / Vị trí Thủ kho thành phẩm",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-053",
    "name": "Trưởng phòng Cơ điện",
    "code": "CV-053",
    "description": "Chức vụ / Vị trí Trưởng phòng Cơ điện",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-054",
    "name": "Tổ trưởng",
    "code": "CV-054",
    "description": "Chức vụ / Vị trí Tổ trưởng",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  },
  {
    "id": "POS-055",
    "name": "Tổ trưởng kiêm kỹ thuật in",
    "code": "CV-055",
    "description": "Chức vụ / Vị trí Tổ trưởng kiêm kỹ thuật in",
    "createdAt": "2026-10-21T04:42:40.629Z",
    "updatedAt": "2026-10-21T04:42:40.629Z"
  }
];


export const INITIAL_STATIONERY_ITEMS = [
  {
    "id": "VPP-001",
    "name": "Bút bi Thiên Long TL-027 (Xanh)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 20
  },
  {
    "id": "VPP-002",
    "name": "Bút bi Thiên Long TL-027 (Đỏ)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-003",
    "name": "Bút bi Thiên Long TL-027 (Đen)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-004",
    "name": "Bút bi bấm xóa được Frixion Pilot (Xanh)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-005",
    "name": "Bút dạ quang HL-03 (Vàng chanh)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-006",
    "name": "Bút dạ quang HL-03 (Cam)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-007",
    "name": "Bút lông bảng trắng Thiên Long WB-03 (Xanh)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-008",
    "name": "Bút lông dầu Thiên Long PM-09 (2 đầu)",
    "unit": "Cây",
    "category": "Bút viết",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-009",
    "name": "Giấy in A4 Double A 70gsm (500 tờ/ram)",
    "unit": "Ram",
    "category": "Giấy in",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-010",
    "name": "Giấy in A4 Double A 80gsm (500 tờ/ram)",
    "unit": "Ram",
    "category": "Giấy in",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-011",
    "name": "Giấy in A3 Double A 70gsm",
    "unit": "Ram",
    "category": "Giấy in",
    "isActive": true,
    "monthlyQuota": 3
  },
  {
    "id": "VPP-012",
    "name": "Giấy ghi chú Post-it 3x3 (76x76mm)",
    "unit": "Xấp",
    "category": "Giấy in",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-013",
    "name": "Băng keo trong 5cm (100 yard)",
    "unit": "Cuộn",
    "category": "Băng keo",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-014",
    "name": "Băng keo 2 mặt 2.4cm",
    "unit": "Cuộn",
    "category": "Băng keo",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-015",
    "name": "Bìa còng KingJim 7cm A4",
    "unit": "Cái",
    "category": "File hồ sơ",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-016",
    "name": "Bìa nút My Clear A4",
    "unit": "Cái",
    "category": "File hồ sơ",
    "isActive": true,
    "monthlyQuota": 20
  },
  {
    "id": "VPP-017",
    "name": "Bìa lỗ A4 (Xấp 100 cái)",
    "unit": "Xấp",
    "category": "File hồ sơ",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-018",
    "name": "Bấm kim số 10 Plus",
    "unit": "Cái",
    "category": "Dụng cụ văn phòng",
    "isActive": true,
    "monthlyQuota": 3
  },
  {
    "id": "VPP-019",
    "name": "Kim bấm số 10 Plus",
    "unit": "Hộp",
    "category": "Dụng cụ văn phòng",
    "isActive": true,
    "monthlyQuota": 10
  },
  {
    "id": "VPP-020",
    "name": "Kẹp bướm 19mm (Hộp 12 cái)",
    "unit": "Hộp",
    "category": "Dụng cụ văn phòng",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-021",
    "name": "Kẹp bướm 25mm (Hộp 12 cái)",
    "unit": "Hộp",
    "category": "Dụng cụ văn phòng",
    "isActive": true,
    "monthlyQuota": 5
  },
  {
    "id": "VPP-022",
    "name": "Kéo văn phòng Deli 17.5cm",
    "unit": "Cái",
    "category": "Dụng cụ văn phòng",
    "isActive": true,
    "monthlyQuota": 3
  },
  {
    "id": "VPP-023",
    "name": "Sổ tay ghi chép A5 (200 trang)",
    "unit": "Cuốn",
    "category": "Sổ sách",
    "isActive": true,
    "monthlyQuota": 5
  }
]
;
