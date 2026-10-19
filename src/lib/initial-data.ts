import { User, CATEGORY_DEFINITIONS, Department, WebIntegration } from '@/types/user';
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
 * Danh sách Phòng Ban ban đầu của nhà máy Long Khai
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
1. **Quên thẻ / Hỏng thẻ**: Nhân viên làm Phiếu Xác nhận công trên **LONG KHAI PORTAL**, hệ thống tự động chuyển duyệt đến Bảo vệ, Trưởng bộ phận và Phòng IT/Kế toán.
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
