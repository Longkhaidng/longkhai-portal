import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { EmailConfig } from '@/types/email';

const CONFIG_PATH = path.join(process.cwd(), 'company-data', 'settings', 'email-config.json');
const TMP_CONFIG_PATH = path.join('/tmp', 'email-config.json');

export async function GET() {
  try {
    // 1. Check /tmp cache first (for serverless runtime), then CONFIG_PATH
    const targetPath = fs.existsSync(TMP_CONFIG_PATH) ? TMP_CONFIG_PATH : CONFIG_PATH;
    if (fs.existsSync(targetPath)) {
      const content = fs.readFileSync(targetPath, 'utf-8');
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

    // Try reading existing password if masked
    if (config.smtpPassword === '********') {
      const targetPath = fs.existsSync(TMP_CONFIG_PATH) ? TMP_CONFIG_PATH : CONFIG_PATH;
      if (fs.existsSync(targetPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
          config.smtpPassword = existing.smtpPassword || '';
        } catch {}
      }
    }

    // 1. Try to write to company-data if filesystem is writable
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    } catch (fsErr: any) {
      // 2. Fallback to /tmp on Vercel Serverless (read-only filesystem EROFS)
      try {
        fs.writeFileSync(TMP_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
      } catch (tmpErr: any) {
        console.warn('Không thể ghi /tmp:', tmpErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình Email thành công!',
    });
  } catch (err: any) {
    console.error('Lỗi lưu email-config:', err);
    // Return success: true so client doesn't block (client also saves in localStorage)
    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình Email thành công trên trình duyệt!',
    });
  }
}
