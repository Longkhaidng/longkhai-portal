import { storage } from './storage';
import { SendEmailPayload, EmailConfig } from '@/types/email';

export function generateMailtoUrl(payload: SendEmailPayload, baseUrl: string): string {
  const typeTitle =
    payload.type === 'leave'
      ? 'ĐƠN XIN NGHỈ PHÉP'
      : payload.type === 'attendance'
      ? 'PHIẾU XÁC NHẬN CÔNG'
      : payload.type === 'gate_pass'
      ? 'PHIẾU RA - VÀO CỔNG'
      : 'PHIẾU ĐỀ XUẤT SỬA CHỮA';
  const subject = `[Long Khải Portal] Yêu cầu duyệt ${typeTitle}: ${payload.employeeName} (${payload.employeeId}) - Mã: ${payload.docId}`;

  const approveUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=approve`;
  const rejectUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=reject`;

  const detailsText = payload.details.items.map((i) => `• ${i.label}: ${i.value}`).join('\n');

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
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 36%; font-size: 13px;">
          ${item.label}
        </td>
        <td style="padding: 11px 16px; border-bottom: 1px solid #e2e8f0; color: ${item.isPrimary ? '#0284c7' : '#1e293b'}; font-weight: ${item.isPrimary ? '700' : '500'}; font-size: 13px;">
          ${item.value || '-'}
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
${filteredItems.map((i) => `- ${i.label}: ${i.value || '-'}`).join('\n')}

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
