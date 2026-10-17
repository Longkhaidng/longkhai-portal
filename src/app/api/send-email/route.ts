import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { EmailConfig } from '@/types/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { toEmail, subject, html, emailConfig } = body as {
      toEmail: string;
      subject: string;
      html: string;
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

    // Determine SMTP configuration (From payload, or from environment variables)
    const host = emailConfig?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(emailConfig?.smtpPort || process.env.SMTP_PORT || 465);
    const user = emailConfig?.smtpUser || process.env.SMTP_USER || '';
    const pass = emailConfig?.smtpPassword || process.env.SMTP_PASSWORD || '';
    const senderName = emailConfig?.senderName || 'Cổng Thông Tin Long Khai';
    const senderEmail = emailConfig?.senderEmail || user || 'no-reply@longkhai.vn';

    // If SMTP credentials are provided, send through nodemailer
    if (user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toEmail,
        subject,
        html,
      });

      return NextResponse.json({
        success: true,
        message: `Đã gửi email thông báo phê duyệt thành công tới ${toEmail} (MessageId: ${info.messageId})`,
      });
    }

    // If Resend API Key is provided
    const resendKey = emailConfig?.resendApiKey || process.env.RESEND_API_KEY;
    if (resendKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${senderName} <onboarding@resend.dev>`,
          to: [toEmail],
          subject,
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

    // If no credentials configured yet -> simulated success with note
    console.log(`[SIMULATED EMAIL] To: ${toEmail} | Subject: ${subject}`);
    return NextResponse.json({
      success: true,
      simulated: true,
      message: `Đã ghi nhận yêu cầu gửi email tới Trưởng BP (${toEmail}). (Ghi chú: Cần nhập tài khoản & mật khẩu ứng dụng Gmail / SMTP trong mục 'Cài đặt hệ thống' để hệ thống gửi thư thực tế ra hòm thư Internet).`,
    });
  } catch (error: any) {
    console.error('Lỗi API send-email:', error);
    return NextResponse.json(
      {
        success: false,
        message: `Lỗi máy chủ gửi email: ${error.message || 'Không xác định'}`,
      },
      { status: 500 }
    );
  }
}
