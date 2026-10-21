import { storage } from './storage';
import { SendEmailPayload, EmailConfig } from '@/types/email';

export function generateMailtoUrl(payload: SendEmailPayload, baseUrl: string): string {
  const typeTitle =
    payload.type === 'leave'
      ? 'ĐƠN XIN NGHỈ PHÉP'
      : payload.type === 'attendance'
      ? 'PHIẾU XÁC NHẬN CÔNG'
      : 'PHIẾU RA - VÀO CỔNG';
  const subject = `[Long Khai Portal] Yêu cầu duyệt ${typeTitle}: ${payload.employeeName} (${payload.employeeId}) - Mã: ${payload.docId}`;

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
Cổng Thông Tin Long Khai Portal
${baseUrl}`;

  return `mailto:${payload.toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function generateApprovalEmailHtml(payload: SendEmailPayload, baseUrl: string): { subject: string; html: string; approveUrl: string; rejectUrl: string } {
  const typeTitle =
    payload.type === 'leave'
      ? 'ĐƠN XIN NGHỈ PHÉP'
      : payload.type === 'attendance'
      ? 'PHIẾU XÁC NHẬN CÔNG'
      : 'PHIẾU RA - VÀO CỔNG';
  const subject = `[Long Khai Portal] Yêu cầu duyệt ${typeTitle}: ${payload.employeeName} (${payload.employeeId}) - Mã: ${payload.docId}`;

  const approveUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=approve`;
  const rejectUrl = `${baseUrl}/approve?type=${payload.type}&id=${payload.docId}&action=reject`;

  const rowsHtml = payload.details.items
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #090e1f 0%, #1e3a8a 100%); padding: 30px 24px; text-align: center; color: #ffffff; border-bottom: 2px solid #3b82f6;">
      <div style="font-size: 13px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #ffffff; margin-bottom: 8px;">
        CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #f8fafc; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
        YÊU CẦU PHÊ DUYỆT ${typeTitle}
      </h1>
      <div style="display: inline-block; margin-top: 12px; background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); padding: 4px 16px; border-radius: 20px; font-size: 12px; font-family: monospace; font-weight: 700; color: #ffffff;">
        MÃ HỒ SƠ: ${payload.docId}
      </div>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 24px;">
      <p style="margin-top: 0; font-size: 15px; color: #1e293b;">
        Kính gửi <strong>${payload.managerName || 'Quý Trưởng bộ phận'}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
        Nhân viên <strong>${payload.employeeName}</strong> (Mã NV: <strong>${payload.employeeId}</strong>) thuộc <strong>${payload.department}</strong> vừa tạo yêu cầu cần Trưởng bộ phận xem xét và phê duyệt:
      </p>

      <!-- Details Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 26px;">
        <tbody>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 35%; background-color: #f8fafc;">
              Họ và tên nhân viên
            </td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0369a1; font-weight: 700;">
              ${payload.employeeName} (${payload.employeeId})
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; background-color: #f8fafc;">
              Phòng ban / Xưởng
            </td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 500;">
              ${payload.department}
            </td>
          </tr>
          ${rowsHtml}
        </tbody>
      </table>

      <!-- Action Buttons Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 14px;">
          BẤM NÚT ĐỂ DUYỆT HOẶC TỪ CHỐI TRỰC TIẾP:
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; padding: 4px;">
              <!-- Approve Button -->
              <a href="${approveUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
                ✓ PHÊ DUYỆT ĐƠN
              </a>
            </td>
            <td style="text-align: center; padding: 4px;">
              <!-- Reject Button -->
              <a href="${rejectUrl}" target="_blank" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.3);">
                ✕ TỪ CHỐI ĐƠN
              </a>
            </td>
          </tr>
        </table>

        <div style="font-size: 11px; color: #64748b; margin-top: 14px; line-height: 1.5;">
          * Khi bấm phê duyệt hoặc từ chối, hệ thống sẽ tự động ghi nhận kết quả và cập nhật ngay cho người lao động.
        </div>
      </div>

      <div style="text-align: center; font-size: 12px; color: #94a3b8;">
        Hoặc đăng nhập vào Cổng Thông Tin: <a href="${baseUrl}" style="color: #0284c7; text-decoration: underline;">${baseUrl}</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
      Email này được gửi tự động từ Hệ thống Cổng Thông Tin Long Khai Portal. Vui lòng không trả lời trực tiếp email này.
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html, approveUrl, rejectUrl };
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

  const { subject, html, approveUrl, rejectUrl } = generateApprovalEmailHtml(payload, baseUrl);
  const mailtoUrl = generateMailtoUrl(payload, baseUrl);

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: payload.toEmail,
        subject,
        html,
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

  const subject = `[Long Khai Portal] Thông báo C&B: Hoàn tất phê duyệt ${payload.title} - ${payload.employeeName} (${payload.employeeId}) - Vui lòng cập nhật dữ liệu chấm công`;

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
        Hệ thống Quản trị & Điều hành Nội bộ Long Khai Portal &bull; Tự động thông báo
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
