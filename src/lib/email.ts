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
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #bae6fd; margin-bottom: 6px;">
        CÔNG TY CỔ PHẦN CÔNG NGHIỆP LONG KHAI
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        YÊU CẦU PHÊ DUYỆT ${typeTitle}
      </h1>
      <div style="display: inline-block; margin-top: 10px; background-color: rgba(255, 255, 255, 0.2); padding: 4px 14px; border-radius: 20px; font-size: 12px; font-family: monospace; font-weight: 700;">
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
          * Nếu chọn <strong>"Từ chối đơn"</strong>, hệ thống sẽ mở trang để Quý Trưởng bộ phận nhập <strong>Lý do từ chối</strong> thông báo lại cho nhân viên.
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
