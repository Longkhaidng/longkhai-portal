import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { EmailConfig } from '@/types/email';

const CONFIG_PATH = path.join(process.cwd(), 'company-data', 'settings', 'email-config.json');

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      // Mask password for safety on GET
      const safeConfig: EmailConfig = {
        ...parsed,
        smtpPassword: parsed.smtpPassword ? '********' : '',
      };
      return NextResponse.json({ success: true, config: safeConfig });
    }
  } catch (err: any) {
    console.warn('Lỗi đọc email-config.json:', err.message);
  }

  return NextResponse.json({
    success: true,
    config: {
      provider: 'smtp',
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      senderName: 'Cổng Thông Tin Long Khai',
      senderEmail: '',
      isEnabled: true,
      portalBaseUrl: 'https://longkhai-portal.vercel.app',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const config = (await req.json()) as EmailConfig;
    if (!config) {
      return NextResponse.json({ success: false, message: 'Dữ liệu cấu hình không hợp lệ' }, { status: 400 });
    }

    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // If password was sent as masked '********', keep existing password
    if (config.smtpPassword === '********' && fs.existsSync(CONFIG_PATH)) {
      try {
        const existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        config.smtpPassword = existing.smtpPassword || '';
      } catch {}
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình Email thành công trên máy chủ!',
    });
  } catch (err: any) {
    console.error('Lỗi lưu email-config:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
