import { storage } from './storage';
import { SendEmailPayload, EmailConfig } from '@/types/email';
import { RepairProposal } from '@/types/repair';
import { StationeryProposal, GeneralProposal } from '@/types/proposal';
import { formatDateTime } from './utils';

export function generateMailtoUrl(payload: SendEmailPayload, baseUrl: string): string {
  const typeTitle =
    payload.type === 'leave'
      ? 'ĐƠN XIN NGHỈ PHÉP'
      : payload.type === 'attendance'
      ? 'PHIẾU XÁC NHẬN CÔNG'
      : payload.type === 'gate_pass'
      ? 'PHIẾU RA - VÀO CỔNG'
      : payload.type === 'stationery'
      ? 'PHIẾU ĐỀ XUẤT VĂN PHÒNG PHẨM'
      : payload.type === 'general'
      ? 'PHIẾU ĐỀ XUẤT KHÁC'
      : 'PHIẾU ĐỀ XUẤT SỬA CHỮA';
  const subject = `[Long Khải Portal] Yêu cầu duyệt ${typeTitle}: ${payload.employeeName} (${payload.employeeId}) - Mã: ${payload.docId}`;

  const approveUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=approve`;
  const rejectUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=reject`;

  const detailsText = payload.details.items.map((i) => {
    if (typeof i.value === 'string' && i.value.includes('<table')) {
      const stripped = i.value
        .replace(/<thead[\s\S]*?<\/thead>/gi, '')
        .replace(/<tr[\s\S]*?>/gi, '\n  - ')
        .replace(/<td[\s\S]*?>/gi, ' ')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return `• ${i.label}:\n${stripped}`;
    }
    return `• ${i.label}: ${i.value}`;
  }).join('\n');

  const body = `Kính gửi ${payload.managerName || 'Trưởng bộ phận'},

Nhân viên ${payload.employeeName} (Mã NV: ${payload.employeeId}) thuộc ${payload.department} vừa gửi yêu cầu: ${typeTitle} (Mã: ${payload.docId}).

CHI TIẾT YÊU CẦU:
${detailsText}

--------------------------------------------------
👉 BẤM VÀO ĐÂY ĐỂ PHÊ DUYỆT ĐƠN:
${approveUrl}

👉 BẤM VÀO ĐÂY ĐỂ TỪ CHỐI ĐƠN:
${rejectUrl}
--------------------------------------------------

Trân trọng,
Cổng Thông Tin Long Khải Portal
${baseUrl}`;

  return `mailto:${payload.toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function generateApprovalEmailHtml(payload: SendEmailPayload, baseUrl: string): {
  subject: string;
  html: string;
  text: string;
  approveUrl: string;
  rejectUrl: string;
} {
  const typeTitle =
    payload.type === 'leave'
      ? 'ĐƠN XIN NGHỈ PHÉP'
      : payload.type === 'attendance'
      ? 'PHIẾU XÁC NHẬN CÔNG'
      : payload.type === 'gate_pass'
      ? 'PHIẾU RA - VÀO CỔNG'
      : payload.type === 'stationery'
      ? 'PHIẾU ĐỀ XUẤT VĂN PHÒNG PHẨM'
      : payload.type === 'general'
      ? 'PHIẾU ĐỀ XUẤT KHÁC'
      : 'PHIẾU ĐỀ XUẤT SỬA CHỮA';
  const subject = `[Long Khải Portal] Yêu cầu duyệt ${typeTitle}: ${payload.employeeName} (${payload.employeeId}) - Mã: ${payload.docId}`;

  const approveUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=approve`;
  const rejectUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=reject`;

  // Deduplicate items to avoid repeating employeeName and department
  const filteredItems = (payload.details?.items || []).filter((item) => {
    const l = (item.label || '').toLowerCase().trim();
    if (
      l === 'họ và tên nhân viên' ||
      l === 'họ và tên' ||
      l === 'nhân viên' ||
      l === 'nhân viên giải trình' ||
      l === 'nhân viên mất thẻ' ||
      l === 'nhân viên nghỉ phép' ||
      l === 'nhân viên ra cổng' ||
      l === 'mã số nhân viên' ||
      l === 'mã nv' ||
      l === 'mã nhân viên'
    ) {
      return false;
    }
    if (
      l === 'phòng ban' ||
      l === 'phòng ban / xưởng' ||
      l === 'phòng ban/xưởng' ||
      l === 'bộ phận' ||
      l === 'bộ phận / xưởng' ||
      l === 'bộ phận/xưởng'
    ) {
      return false;
    }
    return true;
  });

  // Table rows with alternating zebra background
  const allRows = [
    { label: 'Họ và tên nhân viên', value: `${payload.employeeName} (${payload.employeeId})`, isPrimary: true },
    { label: 'Phòng ban / Xưởng', value: payload.department, isPrimary: false },
    ...filteredItems.map((item) => ({ label: item.label, value: item.value, isPrimary: false })),
  ];

  const rowsHtml = allRows
    .map((item, idx) => {
      const isProposedSolution = item.label === 'Đề xuất hướng khắc phục';
      const displayVal = isProposedSolution
        ? `<span style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #b45309; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px;">👇 Trưởng bộ phận nhập vào ô bên dưới khi duyệt</span>`
        : (item.value || '-');

      return `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 36%; font-size: 13px; vertical-align: top;">
          ${item.label}
        </td>
        <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: ${item.isPrimary ? '#0284c7' : '#1e293b'}; font-weight: ${item.isPrimary ? '700' : '500'}; font-size: 13px;">
          ${displayVal}
        </td>
      </tr>
    `;
    })
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; width: 100%; margin: 0; padding: 24px 0;">
    <tr>
      <td align="center" style="padding: 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 26px 20px; text-align: center; color: #ffffff; border-bottom: 3px solid #10b981;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <img src="${baseUrl}/logo.png" alt="Long Khải Corporation Logo" width="56" height="56" style="display: block; margin: 0 auto 10px auto; width: 56px; height: 56px; border: 0;" />
                    <div style="font-size: 12px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;">
                      CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
                    </div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">
                      YÊU CẦU PHÊ DUYỆT ${typeTitle}
                    </h1>
                    <div style="display: inline-block; margin-top: 10px; background-color: #1e293b; border: 1px solid #334155; padding: 4px 16px; border-radius: 14px; font-size: 12px; font-family: monospace; font-weight: 700; color: #38bdf8;">
                      MÃ HỒ SƠ: ${payload.docId}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 26px 24px;">
              <p style="margin-top: 0; margin-bottom: 8px; font-size: 15px; color: #1e293b;">
                Kính gửi <strong>${payload.managerName || 'Quý cấp Quản lý'}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin-top: 0; margin-bottom: 20px; line-height: 1.5;">
                Nhân viên <strong>${payload.employeeName}</strong> (Mã NV: <strong>${payload.employeeId}</strong>) thuộc <strong>${payload.department}</strong> vừa tạo yêu cầu cần được xem xét và phê duyệt:
              </p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <!-- Action Buttons Card -->
              ${payload.type === 'repair' ? `
              <!-- DÀNH RIÊNG CHO ĐỀ XUẤT SỬA CHỮA: Form nhập đề xuất hướng khắc phục trực tiếp từ email -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 22px 18px;">
                    <div style="font-size: 14px; font-weight: 800; color: #92400e; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
                      📝 DÀNH CHO TRƯỞNG BỘ PHẬN PHÊ DUYỆT:
                    </div>
                    <div style="font-size: 12.5px; color: #78350f; margin-bottom: 14px; line-height: 1.5;">
                      Quý Trưởng bộ phận nhập <b>Đề xuất hướng khắc phục</b> (chỉ đạo cho Cơ điện) trực tiếp vào ô bên dưới rồi bấm <b>PHÊ DUYỆT & GỬI CƠ ĐIỆN</b>:
                    </div>

                    <!-- HTML Form cho ứng dụng email hỗ trợ form gõ trực tiếp -->
                    <form action="${approveUrl}" method="GET" target="_blank" style="margin: 0; padding: 0;">
                      <input type="hidden" name="type" value="repair" />
                      <input type="hidden" name="id" value="${payload.docId}" />
                      <input type="hidden" name="action" value="approve" />
                      <textarea name="proposedSolution" rows="3" placeholder="Nhập ý kiến đề xuất hướng khắc phục, chỉ đạo kiểm tra hoặc thay thế linh kiện cho Bộ phận Cơ điện..." style="width: 100%; box-sizing: border-box; border: 1.5px solid #d97706; border-radius: 8px; padding: 10px; font-size: 13px; font-family: inherit; resize: vertical; margin-bottom: 14px; background-color: #ffffff; color: #1e293b;"></textarea>
                      
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center">
                            <button type="submit" style="background-color: #d97706; color: #ffffff; padding: 13px 30px; border-radius: 8px; font-size: 13px; font-weight: 800; border: none; cursor: pointer; display: inline-block; letter-spacing: 0.5px;">
                              ✓ PHÊ DUYỆT & GỬI BỘ PHẬN CƠ ĐIỆN
                            </button>
                          </td>
                        </tr>
                      </table>
                    </form>

                    <!-- Nút mở link trực tiếp cho Outlook hoặc ứng dụng email chặn gõ trong mail -->
                    <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #cbd5e1; text-align: center;">
                      <div style="font-size: 11.5px; color: #64748b; margin-bottom: 10px; font-style: italic;">
                        * Nếu ứng dụng email của bạn (như Outlook) không cho phép gõ trực tiếp trong ô trên, vui lòng bấm nút dưới đây để mở trang duyệt và nhập nội dung:
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 440px; margin: 0 auto;">
                        <tr>
                          <td align="center" style="padding: 4px;">
                            <a href="${approveUrl}" target="_blank" style="display: block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 800; text-align: center;">
                              👉 MỞ TRANG NHẬP HƯỚNG KHẮC PHỤC & DUYỆT
                            </a>
                          </td>
                          <td align="center" style="padding: 4px; width: 120px;">
                            <a href="${rejectUrl}" target="_blank" style="display: block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 800; text-align: center;">
                              ✕ TỪ CHỐI
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
              ` : `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 22px 18px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px;">
                      BẤM NÚT ĐỂ DUYỆT HOẶC TỪ CHỐI TRỰC TIẾP:
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 440px; margin: 0 auto;">
                      <tr>
                        <td align="center" style="padding: 6px;">
                          <!-- Approve Button -->
                          <a href="${approveUrl}" target="_blank" style="display: block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-align: center;">
                            &#10003; PHÊ DUYỆT ĐƠN
                          </a>
                        </td>
                        <td align="center" style="padding: 6px;">
                          <!-- Reject Button -->
                          <a href="${rejectUrl}" target="_blank" style="display: block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-align: center;">
                            &#10005; TỪ CHỐI ĐƠN
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size: 11px; color: #64748b; margin-top: 14px; font-style: italic;">
                      * Khi bấm phê duyệt hoặc từ chối, hệ thống sẽ tự động ghi nhận kết quả và cập nhật ngay cho người lao động.
                    </div>
                  </td>
                </tr>
              </table>
              `}


              <div style="text-align: center; font-size: 12px; color: #94a3b8;">
                Hoặc đăng nhập vào Cổng Thông Tin: <a href="${baseUrl}" style="color: #0284c7; text-decoration: underline;">${baseUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; font-size: 11px; color: #94a3b8;">
              Email này được gửi tự động từ Hệ thống Cổng Thông Tin Long Khải Portal. Vui lòng không trả lời trực tiếp email này.
            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const plainText = `CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
YÊU CẦU PHÊ DUYỆT ${typeTitle}
MÃ HỒ SƠ: ${payload.docId}

Kính gửi ${payload.managerName || 'Quý cấp Quản lý'},

Nhân viên ${payload.employeeName} (Mã NV: ${payload.employeeId}) thuộc ${payload.department} vừa tạo yêu cầu cần được xem xét và phê duyệt:

CHI TIẾT YÊU CẦU:
- Họ và tên nhân viên: ${payload.employeeName} (${payload.employeeId})
- Phòng ban / Xưởng: ${payload.department}
${filteredItems.map((i) => {
  if (typeof i.value === 'string' && i.value.includes('<table')) {
    const stripped = i.value
      .replace(/<thead[\s\S]*?<\/thead>/gi, '')
      .replace(/<tr[\s\S]*?>/gi, '\n  - ')
      .replace(/<td[\s\S]*?>/gi, ' ')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `- ${i.label}:\n${stripped}`;
  }
  return `- ${i.label}: ${i.value || '-'}`;
}).join('\n')}

BẤM ĐƯỜNG LINK ĐỂ DUYỆT HOẶC TỪ CHỐI TRỰC TIẾP:
✓ PHÊ DUYỆT ĐƠN: ${approveUrl}
✕ TỪ CHỐI ĐƠN: ${rejectUrl}

* Khi bấm phê duyệt hoặc từ chối, hệ thống sẽ tự động ghi nhận kết quả và cập nhật ngay cho người lao động.
Hoặc đăng nhập vào Cổng Thông Tin: ${baseUrl}
Email này được gửi tự động từ Hệ thống Cổng Thông Tin Long Khải Portal. Vui lòng không trả lời trực tiếp email này.`;

  return { subject, html, text: plainText, approveUrl, rejectUrl };
}

export interface DispatchEmailResult {
  success: boolean;
  notConfigured?: boolean;
  message: string;
  approveUrl: string;
  rejectUrl: string;
  mailtoUrl: string;
}

/**
 * Dispatch email via Next.js API route /api/send-email
 */
export async function dispatchApprovalEmail(payload: SendEmailPayload): Promise<DispatchEmailResult> {
  const config = storage.getEmailConfig();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = config.portalBaseUrl || origin || 'https://longkhai-portal.vercel.app';

  const { subject, html, text, approveUrl, rejectUrl } = generateApprovalEmailHtml(payload, baseUrl);
  const mailtoUrl = generateMailtoUrl(payload, baseUrl);

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: payload.toEmail,
        subject,
        html,
        text,
        type: payload.type,
        docId: payload.docId,
        employeeName: payload.employeeName,
        emailConfig: config,
      }),
    });

    const data = await res.json();
    return {
      success: data.success === true,
      notConfigured: data.notConfigured,
      message: data.message || (data.success ? 'Đã gửi email thành công' : 'Không thể gửi email'),
      approveUrl,
      rejectUrl,
      mailtoUrl,
    };
  } catch (err: any) {
    console.error('Lỗi dispatch email:', err);
    return {
      success: false,
      notConfigured: false,
      message: err.message || 'Không thể kết nối đến máy chủ gửi email',
      approveUrl,
      rejectUrl,
      mailtoUrl,
    };
  }
}

export interface DispatchCBPayload {
  type: 'attendance' | 'gate_pass';
  docId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  summary: string;
  details: { label: string; value: string }[];
  itApproverName?: string;
}

/**
 * Dispatch completion notification email to C&B department
 */
export async function dispatchCBNotificationEmail(payload: DispatchCBPayload): Promise<{ success: boolean; count: number }> {
  const config = storage.getEmailConfig();
  const allUsers = storage.getUsers();

  // Find C&B / HR staff members
  const cbUsers = allUsers.filter(
    (u) =>
      u.role === 'cb' ||
      u.role === 'hr' ||
      (u.position && /c&b|tiền lương|chấm công|hành chính nhân sự/i.test(u.position)) ||
      (u.department && /nhân sự/i.test(u.department))
  );

  const targetEmails = Array.from(
    new Set(
      cbUsers
        .map((u) => (u.email || '').trim().toLowerCase())
        .filter((em) => em.includes('@'))
    )
  );

  // Fallback if no specific emails set
  if (targetEmails.length === 0) {
    targetEmails.push('tuyet.vo@longkhai.com.vn');
  }

  const subject = `[Long Khải Portal] Thông báo C&B: Hoàn tất phê duyệt ${payload.title} - ${payload.employeeName} (${payload.employeeId}) - Vui lòng cập nhật dữ liệu chấm công`;

  const rowsHtml = payload.details
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 35%; background-color: #f8fafc;">
          ${item.label}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">
          ${item.value}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0; margin-bottom: 6px;">
        CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
      </div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #ffffff;">
        THÔNG BÁO BỘ PHẬN C&B / TIỀN LƯƠNG & CHẤM CÔNG
      </h1>
      <div style="display: inline-block; margin-top: 10px; background-color: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); padding: 4px 14px; border-radius: 16px; font-size: 12px; font-family: monospace; font-weight: bold;">
        MÃ HỒ SƠ: ${payload.docId}
      </div>
    </div>

    <div style="padding: 24px;">
      <p style="margin-top: 0; font-size: 14px; color: #1e293b;">
        Kính gửi <strong>Bộ phận C&B / Quản lý Tiền lương & Chấm công</strong>,
      </p>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px; margin-bottom: 18px; color: #065f46; font-size: 13px;">
        <b>✓ Đơn đã được phê duyệt và hoàn tất xử lý IT:</b>
        <p style="margin: 6px 0 0 0;">
          Nhân viên CNTT (${payload.itApproverName || 'Bảo trợ IT'}) đã xác nhận hoàn thành hồ sơ <b>${payload.title}</b> của nhân viên <b>${payload.employeeName}</b>. Kính đề nghị Bộ phận C&B kiểm tra và cập nhật dữ liệu chấm công / giải trình công tương ứng.
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
        Hệ thống Quản trị & Điều hành Nội bộ Long Khải Portal &bull; Tự động thông báo
      </div>
    </div>
  </div>
</body>
</html>
`;

  let successCount = 0;
  for (const toEmail of targetEmails) {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          subject,
          html,
          type: payload.type,
          docId: payload.docId,
          employeeName: payload.employeeName,
          emailConfig: config,
        }),
      });
      successCount++;
    } catch (e) {
      console.error('Lỗi gửi email C&B:', e);
    }
  }

  return { success: successCount > 0, count: successCount };
}

/**
 * Dispatch notification email to Head of Maintenance (Cơ điện & Bảo trì)
 * when Department Head has approved the repair proposal.
 */
export async function dispatchMaintenanceNotificationEmail(
  proposal: RepairProposal
): Promise<{ success: boolean; toEmail: string }> {
  const config = {
    ...storage.getEmailConfig(),
    googleScriptUrl: proposal.emailRelayUrl || proposal.emailConfig?.googleScriptUrl || storage.getEmailConfig().googleScriptUrl,
  };
  const allUsers = storage.getUsers();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = config.portalBaseUrl || origin || 'https://longkhai-portal.vercel.app';

  // Find Maintenance Manager (Trưởng phòng Cơ điện / Cơ điện & Bảo trì)
  const maintenanceManager =
    allUsers.find(
      (u) =>
        (u.position && /trưởng phòng cơ điện|truong phong co dien/i.test(u.position)) ||
        (u.department && /cơ điện|co dien|bảo trì/i.test(u.department) && (u.role === 'manager' || u.role === 'admin'))
    ) || allUsers.find((u) => u.id === '2409');

  const toEmail = maintenanceManager?.email || 'tai.trinh@longkhai.com.vn';
  const managerName = maintenanceManager?.name || 'Trưởng phòng Cơ điện';

  const subject = `[Long Khải Portal] Yêu cầu sửa chữa thiết bị: Mã ${proposal.id} - ${proposal.location} (${proposal.department})`;

  const viewUrl = `${baseUrl}`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
        YÊU CẦU SỬA CHỮA THIẾT BỊ
      </h1>
      <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.95;">
        Mã phiếu: <b>${proposal.id}</b> &bull; Đã được Trưởng bộ phận phê duyệt
      </p>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 14px; margin-top: 0;">
        Kính gửi <b>${managerName}</b>,
      </p>
      <p style="font-size: 13px; color: #475569;">
        Đề xuất sửa chữa từ nhân viên <b>${proposal.employeeName}</b> (${proposal.employeeId}) thuộc <b>${proposal.department}</b> đã được Trưởng bộ phận <b>${proposal.managerName || 'phê duyệt'}</b> vào lúc <b>${formatDateTime(proposal.managerApprovedAt)}</b>.
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tbody>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 38%;">Mã phiếu</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #d97706; font-family: monospace;">${proposal.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Người đề xuất</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0284c7;">${proposal.employeeName} (${proposal.employeeId})</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Tổ / Bộ phận</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${proposal.department}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Khu vực thiết bị hỏng</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #e11d48;">${proposal.location}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Tình trạng sự việc</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #1e293b; white-space: pre-line;">${proposal.issueDescription}</td>
          </tr>
          <tr style="background-color: #fef3c7;">
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #92400e;">Đề xuất hướng khắc phục (Trưởng BP đã duyệt)</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #92400e; white-space: pre-line;">${proposal.proposedSolution || proposal.managerComment || 'Chưa có ghi chú'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: 600; color: #475569;">Thời gian gửi</td>
            <td style="padding: 10px 14px; color: #64748b;">${formatDateTime(proposal.createdAt)}</td>
          </tr>
        </tbody>
      </table>

      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${viewUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);">
          TIẾP NHẬN & CẬP NHẬT KẾT QUẢ SỬA CHỮA
        </a>
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #64748b;">
        Hệ thống Quản trị & Điều hành Nội bộ Long Khải Portal &bull; Tự động thông báo
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail,
        subject,
        html,
        type: 'repair',
        docId: proposal.id,
        employeeName: proposal.employeeName,
        emailConfig: config,
      }),
    });
    return { success: true, toEmail };
  } catch (err: any) {
    console.warn('Lỗi dispatchMaintenanceNotificationEmail:', err);
    return { success: false, toEmail };
  }
}


/**
 * Dispatch informational notification email to Ban Giám Đốc (BOD)
 * when Department Head has approved the repair proposal.
 * NOTE: This email contains NO approve or reject buttons!
 */
export async function dispatchBODNotificationEmail(
  proposal: RepairProposal
): Promise<{ success: boolean; count: number }> {
  const config = {
    ...storage.getEmailConfig(),
    googleScriptUrl: proposal.emailRelayUrl || proposal.emailConfig?.googleScriptUrl || storage.getEmailConfig().googleScriptUrl,
  };
  const allUsers = storage.getUsers();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = config.portalBaseUrl || origin || 'https://longkhai-portal.vercel.app';

  // Default BOD emails according to company governance
  const defaultBODEmails = [
    'tu.pham@vitex.com.vn',
    'tu.pham@longkhai.com.vn',
    'buithuanh@vitex.com.vn',
  ];

  // Also include any users with role bod or director
  const bodUsers = allUsers.filter(
    (u) =>
      u.role === 'admin' ||
      (u.role as string) === 'bod' ||
      (u.position && /giám đốc|giam doc/i.test(u.position)) ||
      (u.department && /ban giám đốc|ban giam doc/i.test(u.department))
  );

  const targetEmails = Array.from(
    new Set([
      ...defaultBODEmails,
      ...bodUsers.map((u) => u.email).filter(Boolean) as string[],
      ...(config.bodEmails || []),
    ])
  );

  const subject = `[THÔNG BÁO TIẾN ĐỘ] Đề xuất sửa chữa đã được Trưởng BP duyệt: Mã ${proposal.id} - ${proposal.location} (${proposal.department})`;
  const solutionText = proposal.proposedSolution || proposal.managerComment || 'Đồng ý phê duyệt sửa chữa';

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 26px 20px; text-align: center; color: #ffffff; border-bottom: 3px solid #38bdf8;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">BÁO CÁO TIẾN ĐỘ SỬA CHỮA THIẾT BỊ</h1>
      <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.9;">Kính gửi Ban Giám Đốc (Báo cáo thông tin &bull; Không cần phê duyệt)</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; margin-top: 0; color: #1e293b;">Kính gửi <b>Quý Ban Giám Đốc</b>,</p>
      <p style="font-size: 13px; color: #475569;">
        Hệ thống xin trân trọng thông báo: Phiếu đề xuất sửa chữa thiết bị <b>${proposal.id}</b> từ nhân viên <b>${proposal.employeeName}</b> (${proposal.employeeId}) thuộc <b>${proposal.department}</b> đã được Trưởng bộ phận <b>${proposal.managerName || 'phê duyệt'}</b> chấp thuận và chuyển giao cho Bộ phận Cơ điện xử lý.
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tbody>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; width: 38%; border-bottom: 1px solid #e2e8f0;">Mã phiếu</td><td style="padding: 10px 14px; font-weight: bold; color: #d97706; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${proposal.id}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Người đề xuất</td><td style="padding: 10px 14px; font-weight: bold; color: #0284c7; border-bottom: 1px solid #e2e8f0;">${proposal.employeeName} (${proposal.employeeId})</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Tổ / Bộ phận</td><td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">${proposal.department}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Khu vực thiết bị hỏng</td><td style="padding: 10px 14px; font-weight: 600; color: #e11d48; border-bottom: 1px solid #e2e8f0;">${proposal.location}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Tình trạng sự việc</td><td style="padding: 10px 14px; white-space: pre-line; border-bottom: 1px solid #e2e8f0;">${proposal.issueDescription}</td></tr>
          <tr style="background-color: #fef3c7;"><td style="padding: 10px 14px; font-weight: 700; color: #92400e; border-bottom: 1px solid #e2e8f0;">Đề xuất hướng khắc phục (Trưởng BP đã duyệt)</td><td style="padding: 10px 14px; font-weight: 600; color: #92400e; white-space: pre-line; border-bottom: 1px solid #e2e8f0;">${solutionText}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Trưởng bộ phận phê duyệt</td><td style="padding: 10px 14px; color: #059669; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${proposal.managerName || 'Trưởng bộ phận'} (${formatDateTime(proposal.managerApprovedAt || new Date().toISOString())})</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600;">Bộ phận tiếp nhận sửa chữa</td><td style="padding: 10px 14px; color: #0284c7; font-weight: 600;">Phòng Cơ Điện (Trịnh Anh Tài - tai.trinh@longkhai.com.vn)</td></tr>
        </tbody>
      </table>

      <!-- Note for BOD: NO action buttons needed -->
      <div style="background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 12px 16px; margin: 20px 0; font-size: 12px; color: #166534; text-align: center;">
        ℹ️ <b>Báo cáo nắm tình hình:</b> Email này được gửi tự động để Quý Ban Giám Đốc theo dõi tiến độ sản xuất. <b>Không yêu cầu thao tác phê duyệt trên email này.</b>
      </div>

      <div style="text-align: center; margin: 20px 0 10px 0;">
        <a href="${baseUrl}" style="display: inline-block; background-color: #1e3a8a; color: #ffffff; text-decoration: none; padding: 11px 24px; font-size: 12.5px; font-weight: 700; border-radius: 10px; box-shadow: 0 2px 8px rgba(30, 58, 138, 0.25);">
          XEM TRÊN CỔNG THÔNG TIN LONG KHẢI
        </a>
      </div>

      <div style="text-align: center; margin-top: 24px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 11.5px; color: #64748b;">
        Hệ thống Quản trị & Điều hành Nội bộ Long Khải Portal &bull; Tự động thông báo Ban Giám Đốc
      </div>
    </div>
  </div>
</body>
</html>
`;

  let sentCount = 0;
  for (const toEmail of targetEmails) {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail,
          subject,
          html,
          type: 'repair',
          docId: proposal.id,
          employeeName: proposal.employeeName,
          emailConfig: config,
        }),
      });
      sentCount++;
    } catch (e) {
      console.warn('Lỗi gửi email BOD:', toEmail, e);
    }
  }

  return { success: sentCount > 0, count: sentCount };
}

/**
 * Dispatch Stationery Proposal Approval Email
 * Step 'hr': to Chuyên viên HCNS (1139 - Võ Thị Tuyết)
 * Step 'manager': to Trưởng phòng HCNS (1867 - Trương Anh Như Quỳnh)
 */
export async function dispatchStationeryApprovalEmail(
  proposal: StationeryProposal,
  targetStep: 'hr' | 'manager'
): Promise<DispatchEmailResult> {
  const config = {
    ...storage.getEmailConfig(),
    googleScriptUrl: proposal.emailRelayUrl || proposal.emailConfig?.googleScriptUrl || storage.getEmailConfig().googleScriptUrl,
  };
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = config.portalBaseUrl || origin || 'https://longkhai-portal.vercel.app';

  const toEmail = targetStep === 'hr' ? 'tuyet.vo@longkhai.com.vn' : 'Quynh.truong@longkhai.com.vn';
  const managerName = targetStep === 'hr' ? 'Chị Võ Thị Tuyết (HCNS)' : 'Chị Trương Anh Như Quỳnh (Trưởng phòng HCNS)';

  // Lấy số lượng nhân viên hiện tại tại nhà máy (từ danh sách nhân sự thực tế)
  const allUsers = storage.getUsers();
  const currentTotalEmployees = allUsers && allUsers.length > 1 ? allUsers.length : 265;

  // Bảng 2 cột: "Tên mặt hàng" và "Số lượng" đề xuất
  const itemsTableHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-top: 2px;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; text-align: left;">Tên mặt hàng</th>
          <th style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e293b; text-align: center; width: 35%;">Số lượng</th>
        </tr>
      </thead>
      <tbody>
        ${proposal.items
          .map(
            (item, idx) => `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">
              ${item.itemId ? `<span style="color: #64748b; font-weight: 700; font-family: monospace;">[${item.itemId}]</span> ` : ''}${item.itemName}
            </td>
            <td style="padding: 8px 12px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #0284c7;">
              ${item.quantity} ${item.unit || ''}
            </td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `.trim();

  const payload: SendEmailPayload = {
    toEmail,
    managerName,
    type: 'stationery',
    docId: proposal.id,
    employeeId: proposal.employeeId,
    employeeName: proposal.employeeName,
    department: proposal.department,
    details: {
      title: 'Chi tiết đề xuất văn phòng phẩm',
      items: [
        { label: 'Danh mục mặt hàng đề xuất', value: itemsTableHtml },
        { label: 'Ghi chú đề xuất', value: proposal.notes || 'Không có ghi chú' },
        { label: 'Số lượng nhân viên hiện tại', value: `${currentTotalEmployees} người` },
        { label: 'Thời gian gửi', value: formatDateTime(proposal.createdAt) },
      ],
    },
  };

  return dispatchApprovalEmail(payload);
}

/**
 * Dispatch General Proposal Approval Email
 */
export async function dispatchGeneralApprovalEmail(
  proposal: GeneralProposal,
  targetStep: 'receiver' | 'manager'
): Promise<DispatchEmailResult> {
  const config = {
    ...storage.getEmailConfig(),
    googleScriptUrl: proposal.emailRelayUrl || proposal.emailConfig?.googleScriptUrl || storage.getEmailConfig().googleScriptUrl,
  };
  const toEmail = targetStep === 'receiver' ? (proposal.receiverUserEmail || 'it@longkhai.com.vn') : (proposal.managerEmail || 'it@longkhai.com.vn');
  const managerName = targetStep === 'receiver' ? (proposal.receiverUserName || proposal.receiverDepartment) : (proposal.managerName || 'Trưởng bộ phận');

  const payload: SendEmailPayload = {
    toEmail,
    managerName,
    type: 'general',
    docId: proposal.id,
    employeeId: proposal.employeeId,
    employeeName: proposal.employeeName,
    department: proposal.department,
    details: {
      title: 'Chi tiết phiếu đề xuất',
      items: [
        { label: 'Tổ / Bộ phận', value: proposal.department },
        { label: 'Bộ phận tiếp nhận', value: proposal.receiverDepartment },
        { label: 'Tiêu đề đề xuất', value: proposal.title },
        { label: 'Nội dung chi tiết', value: proposal.content },
        { label: 'Thời gian gửi', value: formatDateTime(proposal.createdAt) },
      ],
    },
  };

  return dispatchApprovalEmail(payload);
}
