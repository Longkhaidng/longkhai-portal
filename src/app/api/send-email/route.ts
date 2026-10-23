import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { EmailConfig } from '@/types/email';

const CONFIG_PATH = path.join(process.cwd(), 'company-data', 'settings', 'email-config.json');
const TMP_CONFIG_PATH = path.join('/tmp', 'email-config.json');

function resolveServerEmailConfig(clientConfig?: EmailConfig): EmailConfig {
  const envConfig: EmailConfig = {
    provider: 'google_relay',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    smtpSecure: process.env.SMTP_PORT === '465',
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    senderName: process.env.SMTP_FROM_NAME || 'Cổng Thông Tin Long Khải',
    senderEmail: process.env.SMTP_FROM_EMAIL || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    googleScriptUrl: process.env.GOOGLE_SCRIPT_URL || '',
    isEnabled: true,
  };

  // 1. If payload provides credentials or Resend API key or Google Script URL directly from client, prioritize it!
  if (clientConfig?.googleScriptUrl || clientConfig?.resendApiKey || (clientConfig?.smtpUser && clientConfig?.smtpPassword)) {
    return { ...envConfig, ...clientConfig };
  }

  // 2. Read from /tmp or company-data/settings/email-config.json on disk
  try {
    const targetFile = fs.existsSync(TMP_CONFIG_PATH) ? TMP_CONFIG_PATH : CONFIG_PATH;
    if (fs.existsSync(targetFile)) {
      const fileData = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(fileData);
      return {
        ...envConfig,
        ...parsed,
        ...(clientConfig || {}),
        smtpPassword:
          clientConfig?.smtpPassword && clientConfig.smtpPassword !== '********'
            ? clientConfig.smtpPassword
            : parsed.smtpPassword || '',
      };
    }
  } catch (err: any) {
    console.warn('Lỗi đọc email-config.json trên máy chủ:', err.message);
  }

  return { ...envConfig, ...(clientConfig || {}) };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toEmail, subject, html, text, emailConfig } = body as {
      toEmail: string;
      subject: string;
      html: string;
      text?: string;
      type?: string;
      docId?: string;
      employeeName?: string;
      emailConfig?: EmailConfig;
    };

    if (!toEmail || !toEmail.trim()) {
      return NextResponse.json(
        { success: false, message: 'Thiếu địa chỉ email người nhận (Trưởng bộ phận)' },
        { status: 400 }
      );
    }

    const activeConfig = resolveServerEmailConfig(emailConfig);
    // Persist activeConfig to /tmp/email-config.json for serverless cross-endpoint availability
    if (activeConfig.googleScriptUrl) {
      try {
        fs.writeFileSync(TMP_CONFIG_PATH, JSON.stringify(activeConfig, null, 2), 'utf-8');
      } catch {}
    }
    const host = activeConfig.smtpHost || 'smtp.office365.com';
    const port = Number(activeConfig.smtpPort || 587);
    const user = activeConfig.smtpUser?.trim();
    const pass = activeConfig.smtpPassword?.trim();
    const senderName = activeConfig.senderName || 'Cổng Thông Tin Long Khải';
    const senderEmail = activeConfig.senderEmail || user || 'no-reply@longkhai.vn';

    // 1. If Google Apps Script Relay is provided (Phương án 1 - Khuyên dùng)
    const googleScriptUrl = activeConfig.googleScriptUrl || process.env.GOOGLE_SCRIPT_URL;
    if (googleScriptUrl && googleScriptUrl.trim()) {
      try {
        const scriptRes = await fetch(googleScriptUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            toEmail,
            subject,
            html,
            text: text || '',
            senderName,
          }),
          redirect: 'follow',
        });

        const scriptText = await scriptRes.text();
        let scriptData: any = null;
        try {
          scriptData = JSON.parse(scriptText);
        } catch {}

        if (scriptRes.ok && (!scriptData || scriptData.success !== false)) {
          return NextResponse.json({
            success: true,
            message: scriptData?.message || `Đã chuyển tiếp và gửi email thành công tới ${toEmail} qua Google Apps Script Relay!`,
          });
        } else if (scriptData?.message) {
          throw new Error(scriptData.message);
        }
      } catch (scriptErr: any) {
        console.error('Lỗi gửi qua Google Script:', scriptErr);
        throw new Error(`Lỗi kết nối Google Apps Script Relay: ${scriptErr.message || 'Không thể gửi'}`);
      }
    }

    // 2. If SMTP credentials (user and password) are provided
    if (user && pass && pass !== '********') {
      const isPort465 = port === 465;

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: isPort465, // true for 465, false for 587
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toEmail,
        subject,
        text: text || '',
        html,
      });

      return NextResponse.json({
        success: true,
        message: `Đã gửi email thông báo phê duyệt thành công tới ${toEmail} (MessageId: ${info.messageId})`,
      });
    }

    // 2. If Resend API Key is provided
    const resendKey = activeConfig.resendApiKey || process.env.RESEND_API_KEY;
    if (resendKey) {
      const fromAddress = activeConfig.senderEmail && activeConfig.senderEmail.includes('@')
        ? `"${senderName}" <${activeConfig.senderEmail}>`
        : `"${senderName}" <onboarding@resend.dev>`;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          text: text || '',
          html,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(resendData.message || 'Lỗi gửi email qua Resend API');
      }

      return NextResponse.json({
        success: true,
        message: `Đã gửi email thành công tới ${toEmail} qua Resend API`,
      });
    }

    // 3. Direct Zero-Config Delivery via Recipient MX Server (e.g. Microsoft 365 Exchange for @longkhai.com.vn)
    try {
      const domain = toEmail.split('@')[1]?.toLowerCase();
      let mxHost = '';
      if (domain === 'longkhai.com.vn') {
        mxHost = 'longkhai-com-vn.mail.protection.outlook.com';
      } else if (domain) {
        const { promises: dnsPromises } = await import('dns');
        const mxList = await dnsPromises.resolveMx(domain).catch(() => []);
        if (mxList && mxList.length > 0) {
          mxList.sort((a, b) => a.priority - b.priority);
          mxHost = mxList[0].exchange;
        }
      }

      if (mxHost) {
        const directTransporter = nodemailer.createTransport({
          host: mxHost,
          port: 25,
          secure: false,
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 4000,
          tls: { rejectUnauthorized: false },
        });

        const info = await directTransporter.sendMail({
          from: `"${senderName}" <no-reply@longkhai.com.vn>`,
          to: toEmail,
          subject,
          html,
        });

        console.log(`[DIRECT MX EMAIL SENT] To: ${toEmail} via ${mxHost} (Id: ${info.messageId})`);
        return NextResponse.json({
          success: true,
          message: `Đã tự động gửi email thành công tới ${toEmail}`,
        });
      }
    } catch (mxErr: any) {
      console.warn(`[DIRECT MX FAILED] To: ${toEmail} - ${mxErr.message}`);
    }

    // 4. If neither SMTP, Resend, nor MX succeeded: notify client accurately
    return NextResponse.json({
      success: false,
      notConfigured: true,
      message: `Chưa cấu hình tài khoản gửi Email (SMTP/Resend) trong Cài đặt hệ thống, hoặc máy chủ không thể gửi trực tiếp qua cổng 25 (môi trường máy chủ Vercel chặn cổng 25). Vui lòng cấu hình tài khoản gửi email trong mục Cài Đặt.`,
    });
  } catch (error: any) {
    console.error('Lỗi API send-email:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Lỗi kết nối máy chủ gửi mail: ${error.message || 'Không xác định'}`,
      },
      { status: 500 }
    );
  }
}
