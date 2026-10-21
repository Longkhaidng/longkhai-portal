import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveServerGitHubConfig } from '@/app/api/github-config/route';
import { GitHubService } from '@/lib/github-api';
import nodemailer from 'nodemailer';

const BASE_DIR = path.join(process.cwd(), 'company-data');
const TMP_DIR = path.join('/tmp', 'company-data');

function ensureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {}
}

function findAndLoadDoc(type: 'gate_pass' | 'attendance', docId: string): { doc: any; relPath: string } | null {
  const cleanId = docId.toUpperCase();
  const subDir = type === 'gate_pass' ? 'gate-pass' : 'attendance';

  const searchInDir = (rootDir: string): { doc: any; relPath: string } | null => {
    const targetDir = path.join(rootDir, subDir);
    if (!fs.existsSync(targetDir)) return null;

    const findRecursive = (dir: string): { doc: any; relPath: string } | null => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const res = findRecursive(full);
          if (res) return res;
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          if (entry.name.toUpperCase().includes(cleanId)) {
            try {
              const content = fs.readFileSync(full, 'utf-8');
              const parsed = JSON.parse(content);
              if (parsed.id?.toUpperCase() === cleanId) {
                const rel = path.relative(rootDir, full).replace(/\\/g, '/');
                return { doc: parsed, relPath: rel };
              }
            } catch {}
          }
        }
      }
      return null;
    };

    return findRecursive(targetDir);
  };

  // Check /tmp first, then base directory
  const tmpRes = searchInDir(TMP_DIR);
  if (tmpRes) return tmpRes;

  const baseRes = searchInDir(BASE_DIR);
  if (baseRes) return baseRes;

  return null;
}

function loadAllUsers(): any[] {
  const tmpUsers = path.join(TMP_DIR, 'settings', 'users.json');
  const baseUsers = path.join(BASE_DIR, 'settings', 'users.json');
  try {
    if (fs.existsSync(tmpUsers)) return JSON.parse(fs.readFileSync(tmpUsers, 'utf-8'));
  } catch {}
  try {
    if (fs.existsSync(baseUsers)) return JSON.parse(fs.readFileSync(baseUsers, 'utf-8'));
  } catch {}
  return [];
}

function sendEmailBackground(toEmail: string, subject: string, html: string, baseUrl: string) {
  try {
    const tmpCfg = path.join(TMP_DIR, 'settings', 'email-config.json');
    const baseCfg = path.join(BASE_DIR, 'settings', 'email-config.json');
    let emailConfig: any = null;
    try {
      if (fs.existsSync(tmpCfg)) {
        emailConfig = JSON.parse(fs.readFileSync(tmpCfg, 'utf-8'));
      } else if (fs.existsSync(baseCfg)) {
        emailConfig = JSON.parse(fs.readFileSync(baseCfg, 'utf-8'));
      }
    } catch {}

    if (emailConfig?.googleScriptUrl) {
      fetch(emailConfig.googleScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          html,
          fromName: emailConfig.senderName || 'Cổng Thông Tin Long Khai',
        }),
      }).catch(console.error);
    } else if (emailConfig?.smtpUser && emailConfig?.smtpPassword) {
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtpHost || 'smtp.gmail.com',
        port: emailConfig.smtpPort || 587,
        secure: emailConfig.smtpSecure || false,
        auth: {
          user: emailConfig.smtpUser,
          pass: emailConfig.smtpPassword,
        },
      });

      transporter.sendMail({
        from: `"${emailConfig.senderName || 'Cổng Thông Tin Long Khai'}" <${emailConfig.senderEmail || emailConfig.smtpUser}>`,
        to: toEmail,
        subject,
        html,
      }).catch(console.error);
    }
  } catch (err: any) {
    console.warn('sendEmailBackground error:', err.message);
  }
}

// GET: Load document details for scanning confirmation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id') || searchParams.get('code') || '';
    let type = (searchParams.get('type') as 'gate_pass' | 'attendance' | null) || null;

    // Handle token format LONGKHAI_GATEPASS:ID:USER:TIME
    if (id.includes('LONGKHAI_GATEPASS:')) {
      const parts = id.split(':');
      if (parts[1]) id = parts[1];
      type = 'gate_pass';
    }

    id = id.trim().toUpperCase();
    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu mã phiếu cần tra cứu' }, { status: 400 });
    }

    if (!type) {
      if (id.startsWith('GP')) type = 'gate_pass';
      else if (id.startsWith('ATT')) type = 'attendance';
      else type = 'gate_pass';
    }

    let found = findAndLoadDoc(type, id);

    // If not found in primary type, check the other type
    if (!found) {
      const altType = type === 'gate_pass' ? 'attendance' : 'gate_pass';
      const altFound = findAndLoadDoc(altType, id);
      if (altFound) {
        found = altFound;
        type = altType;
      }
    }

    // Fallback: check GitHub
    let doc = found?.doc;
    if (!doc) {
      const gitConfig = resolveServerGitHubConfig();
      if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
        const ghService = new GitHubService(gitConfig);
        const subDir = type === 'gate_pass' ? 'gate-pass' : 'attendance';
        const year = new Date().getFullYear();
        const possibleRelPath = `${subDir}/${year}/${id}.json`;
        const ghFile = await ghService.getFile(`${gitConfig.basePath || 'company-data'}/${possibleRelPath}`);
        if (ghFile?.content) {
          try {
            doc = JSON.parse(ghFile.content);
          } catch {}
        }
      }
    }

    if (!doc) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy phiếu "${id}" trên hệ thống Cổng Portal. Vui lòng kiểm tra lại mã QR.`,
      }, { status: 404 });
    }

    // Attach fresh user and manager info
    const users = loadAllUsers();
    const empUser = users.find((u) => u.id?.toLowerCase() === doc.employeeId?.toLowerCase());
    const managerId = doc.managerApproverId || empUser?.departmentHeadId;
    const managerUser = managerId ? users.find((u) => u.id?.toLowerCase() === managerId.toLowerCase()) : null;

    return NextResponse.json({
      success: true,
      type,
      record: doc,
      employee: empUser
        ? { id: empUser.id, name: empUser.name, department: empUser.department, position: empUser.position }
        : null,
      manager: managerUser
        ? { id: managerUser.id, name: managerUser.name, email: managerUser.email, department: managerUser.department }
        : null,
    });
  } catch (err: any) {
    console.error('Lỗi GET /api/scan-confirm:', err);
    return NextResponse.json({ success: false, message: err.message || 'Lỗi tra cứu thông tin phiếu' }, { status: 500 });
  }
}

// POST: Execute Security Guard confirmation without logging in
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      type,
      id,
      action,
      actualTime,
      actualCheckIn,
      actualCheckOut,
      guardName,
      note,
    } = body as {
      type: 'gate_pass' | 'attendance';
      id: string;
      action: 'depart' | 'return' | 'confirm_security' | 'confirm_check_in' | 'confirm_check_out' | 'check_in' | 'check_out';
      actualTime?: string;
      actualCheckIn?: string;
      actualCheckOut?: string;
      guardName?: string;
      note?: string;
      time?: string;
    };

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu mã phiếu cần xác nhận' }, { status: 400 });
    }

    id = id.trim().toUpperCase();
    if (!type) {
      type = id.startsWith('GP') ? 'gate_pass' : 'attendance';
    }

    let found = findAndLoadDoc(type, id);
    if (!found) {
      const altType = type === 'gate_pass' ? 'attendance' : 'gate_pass';
      const altFound = findAndLoadDoc(altType, id);
      if (altFound) {
        found = altFound;
        type = altType;
      }
    }

    const gitConfig = resolveServerGitHubConfig();
    let ghService: GitHubService | null = null;
    if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
      ghService = new GitHubService(gitConfig);
    }

    let doc = found?.doc;
    let relPath = found?.relPath || '';

    if (!doc && ghService) {
      const subDir = type === 'gate_pass' ? 'gate-pass' : 'attendance';
      const year = new Date().getFullYear();
      const possibleRelPath = `${subDir}/${year}/${id}.json`;
      const ghFile = await ghService.getFile(`${gitConfig.basePath || 'company-data'}/${possibleRelPath}`);
      if (ghFile?.content) {
        try {
          doc = JSON.parse(ghFile.content);
          relPath = possibleRelPath;
        } catch {}
      }
    }

    if (!doc) {
      return NextResponse.json({
        success: false,
        message: `Không tìm thấy phiếu "${id}" trên hệ thống để cập nhật.`,
      }, { status: 404 });
    }

    const now = new Date().toISOString();
    const finalGuard = (guardName || '').trim() || 'Bảo vệ cổng (Quét QR)';
    let resultMessage = '';

    // ==========================================
    // 1. GATE PASS (PHIẾU RA - VÀO CỔNG)
    // ==========================================
    if (type === 'gate_pass') {
      if (doc.status === 'pending') {
        return NextResponse.json({
          success: false,
          message: 'Phiếu này CHƯA ĐƯỢC TRƯỞNG BỘ PHẬN PHÊ DUYỆT! Bảo vệ không thể xác nhận cho ra cổng.',
          record: doc,
        }, { status: 400 });
      }

      if (doc.status === 'rejected') {
        return NextResponse.json({
          success: false,
          message: 'Phiếu này ĐÃ BỊ TRƯỞNG BỘ PHẬN TỪ CHỐI!',
          record: doc,
        }, { status: 400 });
      }

      if (action === 'depart') {
        const newStatus = doc.timeType === 'nghi_cuoi_gio' ? 'completed' : 'departed';
        doc.status = newStatus;
        doc.actualDepartureTime = actualTime || now;
        doc.securityDepartureGuardId = finalGuard;
        doc.updatedAt = now;

        resultMessage = doc.timeType === 'nghi_cuoi_gio'
          ? `✓ Bảo vệ đã xác nhận giờ RA CỔNG (Nghỉ cuối giờ) cho nhân viên ${doc.employeeName} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Phiếu đã hoàn tất!`
          : `✓ Bảo vệ đã xác nhận giờ RA CỔNG cho nhân viên ${doc.employeeName} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} thành công!`;

      } else if (action === 'return') {
        doc.status = 'completed';
        doc.actualReturnTime = actualTime || now;
        doc.securityReturnGuardId = finalGuard;
        doc.updatedAt = now;

        resultMessage = `✓ Bảo vệ đã xác nhận giờ VÀO CỔNG LẠI cho nhân viên ${doc.employeeName} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Phiếu đã hoàn tất!`;
      } else {
        return NextResponse.json({ success: false, message: 'Thao tác không hợp lệ đối với phiếu ra vào cổng' }, { status: 400 });
      }

    // ==========================================
    // 2. ATTENDANCE CONFIRM (XÁC NHẬN CÔNG)
    // ==========================================
    } else if (type === 'attendance') {
      if (!Array.isArray(doc.steps) || doc.steps.length === 0) {
        return NextResponse.json({ success: false, message: 'Cấu trúc tiến trình phiếu không hợp lệ' }, { status: 400 });
      }

      const step0 = doc.steps[0];

      if (step0.status === 'rejected' || doc.status === 'rejected') {
        return NextResponse.json({
          success: false,
          message: 'Phiếu xác nhận công này đã bị từ chối!',
          record: doc,
        }, { status: 400 });
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const dNow = new Date();
      const currentHHmm = `${pad(dNow.getHours())}:${pad(dNow.getMinutes())}`;

      // Case A: Confirm Time In (Xác nhận thời gian vào)
      if (action === 'confirm_check_in' || action === 'check_in') {
        const inTime = (body.time || actualTime || actualCheckIn || '').trim() || currentHHmm;
        doc.actualCheckIn = inTime;
        doc.actualCheckInGuard = finalGuard;
        doc.actualCheckInAt = now;

        step0.status = 'approved';
        step0.approverName = finalGuard;
        step0.actionAt = now;
        step0.comment = (note || '').trim() || `Bảo vệ đã xác nhận giờ vào thực tế: ${inTime}`;

        if (doc.currentStepIndex === 0) {
          doc.currentStepIndex = 1; // Advance to Step 2: Manager approval
        }
        doc.updatedAt = now;
        resultMessage = `✓ Bảo vệ ${finalGuard} đã xác nhận THỜI GIAN VÀO thực tế (${inTime}) cho nhân viên ${doc.employeeName} thành công!`;

      // Case B: Confirm Time Out (Xác nhận thời gian ra)
      } else if (action === 'confirm_check_out' || action === 'check_out') {
        const outTime = (body.time || actualTime || actualCheckOut || '').trim() || currentHHmm;
        doc.actualCheckOut = outTime;
        doc.actualCheckOutGuard = finalGuard;
        doc.actualCheckOutAt = now;

        step0.status = 'approved';
        step0.approverName = finalGuard;
        step0.actionAt = now;
        step0.comment = (note || '').trim() || (doc.actualCheckIn ? `Bảo vệ đã xác nhận giờ vào (${doc.actualCheckIn}) & giờ ra (${outTime}) thực tế` : `Bảo vệ đã xác nhận giờ ra thực tế: ${outTime}`);

        if (doc.currentStepIndex === 0) {
          doc.currentStepIndex = 1; // Advance to Step 2: Manager approval
        }
        doc.updatedAt = now;
        resultMessage = `✓ Bảo vệ ${finalGuard} đã xác nhận THỜI GIAN RA thực tế (${outTime}) cho nhân viên ${doc.employeeName} thành công!`;

      // Case C: Legacy full confirmation
      } else {
        if (actualCheckIn) doc.actualCheckIn = actualCheckIn;
        if (actualCheckOut) doc.actualCheckOut = actualCheckOut;
        doc.actualCheckInGuard = finalGuard;
        doc.actualCheckOutGuard = finalGuard;
        step0.status = 'approved';
        step0.approverName = finalGuard;
        step0.comment = (note || '').trim() || 'Đã xác nhận kiểm tra vào/ra thực tế tại cổng qua quét mã QR';
        step0.actionAt = now;
        if (doc.currentStepIndex === 0) {
          doc.currentStepIndex = 1;
        }
        doc.updatedAt = now;
        resultMessage = `✓ Bảo vệ cổng đã xác nhận thời gian vào - ra thực tế cho nhân viên ${doc.employeeName} thành công!`;
      }

      // Dispatch email notification to Manager for Step 2 (only once)
      const users = loadAllUsers();
      const empUser = users.find((u) => u.id?.toLowerCase() === doc.employeeId?.toLowerCase());
      const nextStep = doc.steps[1];
      const managerId = nextStep?.approverId || empUser?.departmentHeadId;
      const managerUser = managerId ? users.find((u) => u.id?.toLowerCase() === managerId.toLowerCase()) : null;
      const managerEmail = (managerUser?.email || empUser?.departmentHeadEmail || '').trim();

      if (managerEmail && !doc.managerNotified) {
        doc.managerNotified = true;
        const origin = req.nextUrl.origin || 'https://longkhai-portal.vercel.app';
        const approveUrl = `${origin}/approve?type=attendance&id=${doc.id}&action=approve`;
        const rejectUrl = `${origin}/approve?type=attendance&id=${doc.id}&action=reject`;

        const subject = `[Long Khai Portal] Yêu cầu duyệt PHIẾU XÁC NHẬN CÔNG: ${doc.employeeName} (${doc.employeeId}) - Mã: ${doc.id}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG</h2>
            <h3 style="color: #b45309; margin-top: 0;">THÔNG BÁO DUYỆT PHIẾU XÁC NHẬN CÔNG VÀO - RA</h3>
            <p>Kính gửi <strong>${managerUser?.name || nextStep?.approverName || 'Trưởng bộ phận'}</strong>,</p>
            <p>Bảo vệ cổng đã quét mã QR và xác nhận giờ vào/ra thực tế cho nhân viên <strong>${doc.employeeName}</strong> (Mã NV: <strong>${doc.employeeId}</strong>) thuộc <strong>${doc.department}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%;">Mã hồ sơ:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${doc.id}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Lý do phát sinh:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${doc.issueType === 'mat_the' ? 'Mất thẻ' : doc.issueType === 'quen_the' ? 'Quên mang thẻ' : 'Thẻ hỏng / lỗi'}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Ngày & Ca:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${doc.date} (${doc.shift})</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Giờ vào - ra thực tế:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">Vào: <strong>${doc.actualCheckIn || 'Chưa ghi nhận'}</strong> &bull; Ra: <strong>${doc.actualCheckOut || 'Chưa ghi nhận'}</strong></td></tr>
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Bảo vệ xác nhận:</td><td style="padding: 8px; border: 1px solid #cbd5e1; color: #15803d; font-weight: bold;">${finalGuard} (Đã xác nhận thực tế)</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">Lý do giải trình:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${doc.reason}</td></tr>
            </table>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${approveUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px; display: inline-block;">✓ Phê Duyệt Đơn</a>
              <a href="${rejectUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">✕ Từ Chối</a>
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center;">Hoặc đăng nhập vào Cổng Portal: <a href="${origin}">${origin}</a></p>
          </div>
        `;
        sendEmailBackground(managerEmail, subject, emailHtml, origin);
      }
    }

    // Determine target file path
    if (!relPath) {
      const subDir = type === 'gate_pass' ? 'gate-pass' : 'attendance';
      const year = new Date().getFullYear();
      relPath = `${subDir}/${year}/${doc.id}.json`;
    }

    const jsonString = JSON.stringify(doc, null, 2);

    // 1. Write /tmp
    try {
      const tmpFile = path.join(TMP_DIR, relPath);
      ensureDir(path.dirname(tmpFile));
      fs.writeFileSync(tmpFile, jsonString, 'utf-8');
    } catch (e: any) {
      console.warn('Không thể ghi /tmp:', e.message);
    }

    // 2. Write local
    try {
      const localFile = path.join(BASE_DIR, relPath);
      ensureDir(path.dirname(localFile));
      fs.writeFileSync(localFile, jsonString, 'utf-8');
    } catch {}

    // 3. Commit to GitHub in background
    if (ghService) {
      const ghPath = `${gitConfig.basePath || 'company-data'}/${relPath}`;
      const commitMsg = `Security Guard Scan Confirm ${doc.id} (${action})`;
      ghService.saveFile(ghPath, jsonString, commitMsg).catch((err) => {
        console.warn('[Scan Confirm API] GitHub commit error:', err.message);
      });
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      record: doc,
    });
  } catch (err: any) {
    console.error('Lỗi POST /api/scan-confirm:', err);
    return NextResponse.json({ success: false, message: err.message || 'Lỗi xử lý xác nhận của bảo vệ' }, { status: 500 });
  }
}
