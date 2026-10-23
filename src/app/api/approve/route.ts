import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveServerGitHubConfig } from '@/app/api/github-config/route';
import { GitHubService } from '@/lib/github-api';

const BASE_DIR = path.join(process.cwd(), 'company-data');
const TMP_DIR = path.join('/tmp', 'company-data');

function ensureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {}
}

function findAndLoadDoc(type: 'leave' | 'gate_pass' | 'attendance' | 'repair', docId: string): { doc: any; relPath: string } | null {
  const cleanId = docId.toUpperCase();
  const subDir =
    type === 'leave'
      ? 'leave-request'
      : type === 'gate_pass'
      ? 'gate-pass'
      : type === 'attendance'
      ? 'attendance'
      : 'repair-proposal';

  // Helper search in a root directory
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

  // 1. Check /tmp first (has latest runtime updates)
  const tmpRes = searchInDir(TMP_DIR);
  if (tmpRes) return tmpRes;

  // 2. Check process.cwd()/company-data
  const baseRes = searchInDir(BASE_DIR);
  if (baseRes) return baseRes;

  return null;
}

// Background email sender to Head of Maintenance
async function sendMaintenanceEmailServer(doc: any, clientEmailConfig?: any) {
  try {
    let emailConfig: any = clientEmailConfig || null;
    const cfgPath = fs.existsSync(path.join('/tmp', 'email-config.json'))
      ? path.join('/tmp', 'email-config.json')
      : path.join(BASE_DIR, 'settings', 'email-config.json');
    if (fs.existsSync(cfgPath)) {
      try {
        const fileCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
        emailConfig = { ...fileCfg, ...(clientEmailConfig || {}) };
      } catch {}
    }

    let toEmail = 'tai.trinh@longkhai.com.vn';
    let managerName = 'Trưởng phòng Cơ điện';

    // Find maintenance manager from users.json
    const usersPath = fs.existsSync(path.join(TMP_DIR, 'settings', 'users.json'))
      ? path.join(TMP_DIR, 'settings', 'users.json')
      : path.join(BASE_DIR, 'settings', 'users.json');
    if (fs.existsSync(usersPath)) {
      try {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        if (Array.isArray(users)) {
          const foundM =
            users.find((u) => u.position && /trưởng phòng cơ điện|truong phong co dien/i.test(u.position)) ||
            users.find((u) => u.department && /cơ điện|co dien|bảo trì/i.test(u.department) && u.role === 'manager') ||
            users.find((u) => u.id === '2409');
          if (foundM?.email) {
            toEmail = foundM.email;
            managerName = foundM.name || managerName;
          }
        }
      } catch {}
    }

    const subject = `[Long Khải Portal] Yêu cầu sửa chữa thiết bị: Mã ${doc.id} - ${doc.location} (${doc.department})`;
    const baseUrl = emailConfig?.portalBaseUrl || 'https://longkhai-portal.vercel.app';
    const solutionText = doc.proposedSolution || doc.managerComment || 'Đồng ý phê duyệt sửa chữa';

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
    <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">YÊU CẦU SỬA CHỮA THIẾT BỊ</h1>
      <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.95;">Mã phiếu: <b>${doc.id}</b> &bull; Đã được Trưởng bộ phận phê duyệt</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 14px; margin-top: 0;">Kính gửi <b>${managerName}</b>,</p>
      <p style="font-size: 13px; color: #475569;">
        Đề xuất sửa chữa từ nhân viên <b>${doc.employeeName}</b> (${doc.employeeId}) thuộc <b>${doc.department}</b> đã được Trưởng bộ phận <b>${doc.managerName || 'phê duyệt'}</b>.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 18px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <tbody>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600; width: 38%;">Mã phiếu</td><td style="padding: 10px 14px; font-weight: bold; color: #d97706;">${doc.id}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: 600;">Người đề xuất</td><td style="padding: 10px 14px; font-weight: bold; color: #0284c7;">${doc.employeeName} (${doc.employeeId})</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600;">Tổ / Bộ phận</td><td style="padding: 10px 14px;">${doc.department}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: 600;">Khu vực thiết bị hỏng</td><td style="padding: 10px 14px; font-weight: bold; color: #e11d48;">${doc.location}</td></tr>
          <tr style="background-color: #f8fafc;"><td style="padding: 10px 14px; font-weight: 600;">Tình trạng sự việc</td><td style="padding: 10px 14px; white-space: pre-line;">${doc.issueDescription}</td></tr>
          <tr style="background-color: #fef3c7;"><td style="padding: 10px 14px; font-weight: 700; color: #92400e;">Đề xuất hướng khắc phục (Trưởng BP đã duyệt)</td><td style="padding: 10px 14px; font-weight: bold; color: #92400e; white-space: pre-line; background-color: #fffbeb;">${solutionText}</td></tr>
        </tbody>
      </table>
      <div style="text-align: center; margin: 24px 0 10px 0;">
        <a href="${baseUrl}" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 700; border-radius: 12px;">
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

    const plainText = `CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
YÊU CẦU SỬA CHỮA THIẾT BỊ
Mã phiếu: ${doc.id}
Người đề xuất: ${doc.employeeName} (${doc.employeeId})
Tổ / Bộ phận: ${doc.department}
Khu vực: ${doc.location}
Tình trạng: ${doc.issueDescription}
Đề xuất hướng khắc phục (Trưởng BP duyệt): ${solutionText}
Vui lòng truy cập ${baseUrl} để tiếp nhận và cập nhật kết quả sửa chữa.`;

    // 1. Determine Google Apps Script Relay URL
    const googleScriptUrl =
      clientEmailConfig?.googleScriptUrl ||
      doc.emailRelayUrl ||
      doc.emailConfig?.googleScriptUrl ||
      emailConfig?.googleScriptUrl ||
      process.env.GOOGLE_SCRIPT_URL;

    if (googleScriptUrl && googleScriptUrl.trim()) {
      try {
        console.log('[sendMaintenanceEmailServer] Sending via Google Script Relay to:', toEmail);
        const scriptRes = await fetch(googleScriptUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            toEmail,
            subject,
            html,
            text: plainText,
            senderName: emailConfig?.senderName || 'Cổng Thông Tin Long Khải',
          }),
          redirect: 'follow',
        });
        const respText = await scriptRes.text();
        console.log('[sendMaintenanceEmailServer] Google Script response:', respText);
        return { success: true, toEmail };
      } catch (err: any) {
        console.error('[sendMaintenanceEmailServer] Google Script error:', err.message);
      }
    }

    // 2. SMTP fallback
    if (emailConfig?.smtpUser && emailConfig?.smtpPassword && emailConfig.smtpPassword !== '********') {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
          host: emailConfig.smtpHost || 'smtp.office365.com',
          port: Number(emailConfig.smtpPort || 587),
          secure: Number(emailConfig.smtpPort) === 465,
          auth: { user: emailConfig.smtpUser, pass: emailConfig.smtpPassword },
          tls: { rejectUnauthorized: false },
        });
        await transporter.sendMail({
          from: `"${emailConfig.senderName || 'Cổng Thông Tin Long Khải'}" <${emailConfig.senderEmail || emailConfig.smtpUser}>`,
          to: toEmail,
          subject,
          html,
          text: plainText,
        });
        console.log('[sendMaintenanceEmailServer] SMTP email sent successfully to:', toEmail);
        return { success: true, toEmail };
      } catch (smtpErr: any) {
        console.warn('[sendMaintenanceEmailServer] SMTP failed:', smtpErr.message);
      }
    }

    // 3. Direct MX fallback
    try {
      const nodemailer = (await import('nodemailer')).default;
      const directTransporter = nodemailer.createTransport({
        host: 'longkhai-com-vn.mail.protection.outlook.com',
        port: 25,
        secure: false,
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
        tls: { rejectUnauthorized: false },
      });
      await directTransporter.sendMail({
        from: `"${emailConfig?.senderName || 'Cổng Thông Tin Long Khải'}" <no-reply@longkhai.com.vn>`,
        to: toEmail,
        subject,
        html,
        text: plainText,
      });
      console.log('[sendMaintenanceEmailServer] Direct MX email sent to:', toEmail);
      return { success: true, toEmail };
    } catch (mxErr: any) {
      console.warn('[sendMaintenanceEmailServer] Direct MX delivery failed:', mxErr.message);
    }
  } catch (err: any) {
    console.error('Lỗi sendMaintenanceEmailServer:', err);
  }
  return { success: false };
}
// GET: Fetch document details for online approval page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as 'leave' | 'gate_pass' | 'attendance' | 'repair' | null;
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ success: false, message: 'Thiếu tham số' }, { status: 400 });
    }

    const docId = id.trim().toUpperCase();
    const found = findAndLoadDoc(type, docId);

    if (found?.doc) {
      return NextResponse.json({ success: true, doc: found.doc });
    }

    // Try GitHub API or raw github content
    const subDir =
      type === 'leave'
        ? 'leave-request'
        : type === 'gate_pass'
        ? 'gate-pass'
        : type === 'attendance'
        ? 'attendance'
        : 'repair-proposal';
    const currentYear = new Date().getFullYear();
    const candidateYears = [currentYear, currentYear - 1];

    const gitConfig = resolveServerGitHubConfig();
    if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
      const ghService = new GitHubService(gitConfig);
      for (const y of candidateYears) {
        const possibleRelPath = `${subDir}/${y}/${docId}.json`;
        const ghFile = await ghService.getFile(`${gitConfig.basePath || 'company-data'}/${possibleRelPath}`);
        if (ghFile?.content) {
          try {
            return NextResponse.json({ success: true, doc: JSON.parse(ghFile.content) });
          } catch {}
        }
      }
    }

    // Direct public GitHub raw fetch fallback
    for (const y of candidateYears) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${gitConfig.owner || 'Longkhaidng'}/${gitConfig.repo || 'longkhai-portal'}/${gitConfig.branch || 'main'}/company-data/${subDir}/${y}/${docId}.json`;
        const rawRes = await fetch(rawUrl, { cache: 'no-store' });
        if (rawRes.ok) {
          const rawDoc = await rawRes.json();
          if (rawDoc && rawDoc.id) {
            return NextResponse.json({ success: true, doc: rawDoc });
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: false, message: `Không tìm thấy hồ sơ ${docId}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, action, proposedSolution, comment, emailConfig, githubToken } = body as {
      type: 'leave' | 'gate_pass' | 'attendance' | 'repair';
      id: string;
      action: 'approve' | 'reject';
      proposedSolution?: string;
      comment?: string;
      emailConfig?: any;
      githubToken?: string;
    };

    if (!type || !id || !action) {
      return NextResponse.json({ success: false, message: 'Thiếu thông số xét duyệt' }, { status: 400 });
    }

    const docId = id.trim().toUpperCase();
    let found = findAndLoadDoc(type, docId);

    // If not found locally, try fetching from GitHub if configured
    const gitConfig = resolveServerGitHubConfig();
    let ghService: GitHubService | null = null;
    if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
      ghService = new GitHubService(gitConfig);
    }

    let doc: any = found?.doc;
    let relPath: string = found?.relPath || '';

    if (!doc && ghService) {
      const subDir =
        type === 'leave'
          ? 'leave-request'
          : type === 'gate_pass'
          ? 'gate-pass'
          : type === 'attendance'
          ? 'attendance'
          : 'repair-proposal';
      const year = new Date().getFullYear();
      const possibleRelPath = `${subDir}/${year}/${docId}.json`;
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
        message: `Không tìm thấy hồ sơ ${docId} trên hệ thống. Có thể đơn đã bị xóa hoặc chưa được đẩy lên máy chủ.`,
      }, { status: 404 });
    }

    const now = new Date().toISOString();
    const isApprove = action === 'approve';

    // Check if already finalized
    if (doc.status === 'approved' && isApprove) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: `Đơn ${doc.id} đã được phê duyệt trước đó!`,
        record: doc,
      });
    }

    if (doc.status === 'rejected' && !isApprove) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        message: `Đơn ${doc.id} đã được từ chối trước đó!`,
        record: doc,
      });
    }

    // Apply Approval / Rejection logic based on type
    if (type === 'leave') {
      const stepIndex = doc.currentStepIndex ?? 0;
      if (Array.isArray(doc.steps) && doc.steps[stepIndex]) {
        doc.steps[stepIndex].status = isApprove ? 'approved' : 'rejected';
        doc.steps[stepIndex].approverName = 'Trưởng bộ phận (Email)';
        doc.steps[stepIndex].comment = isApprove ? 'Đồng ý phê duyệt (qua Email)' : 'Từ chối (qua Email)';
        doc.steps[stepIndex].actionAt = now;
        doc.steps[stepIndex].signature = 'Trưởng bộ phận';
      }

      if (isApprove) {
        if (doc.currentStepIndex + 1 < doc.steps.length) {
          doc.currentStepIndex += 1;
        } else {
          doc.status = 'approved';
        }
      } else {
        doc.status = 'rejected';
      }
      doc.updatedAt = now;

    } else if (type === 'gate_pass') {
      const stepIndex = doc.currentStepIndex ?? 0;
      if (Array.isArray(doc.steps) && doc.steps[stepIndex]) {
        const curStep = doc.steps[stepIndex];
        curStep.status = isApprove ? 'approved' : 'rejected';
        const roleLabel = curStep.roleRequired === 'team_leader' ? 'Tổ trưởng (Email)' : 'Trưởng bộ phận (Email)';
        curStep.approverName = roleLabel;
        curStep.comment = isApprove ? 'Đồng ý phê duyệt (qua Email)' : 'Từ chối (qua Email)';
        curStep.actionAt = now;

        if (curStep.roleRequired === 'team_leader') {
          doc.teamLeaderApproverName = roleLabel;
          doc.teamLeaderApprovedAt = now;
        } else {
          doc.managerApproverName = roleLabel;
          doc.managerApprovedAt = now;
        }

        if (isApprove) {
          if (doc.currentStepIndex + 1 < doc.steps.length) {
            const nextRole = doc.steps[doc.currentStepIndex + 1].roleRequired;
            if (nextRole === 'security') {
              // Management approval completed, pass is approved for security to scan
              doc.currentStepIndex += 1;
              doc.status = 'approved';
            } else {
              // Advance to next management step (e.g. manager)
              doc.currentStepIndex += 1;
              doc.status = 'pending';
            }
          } else {
            doc.status = 'approved';
          }
        } else {
          doc.status = 'rejected';
          doc.rejectionReason = 'Từ chối qua Email';
        }
      } else {
        doc.status = isApprove ? 'approved' : 'rejected';
        doc.managerApproverName = 'Trưởng bộ phận (Email)';
        doc.managerApprovedAt = now;
        if (!isApprove) {
          doc.rejectionReason = 'Từ chối qua Email';
        }
      }
      doc.updatedAt = now;

    } else if (type === 'attendance') {
      const stepIndex = doc.currentStepIndex ?? 0;
      if (Array.isArray(doc.steps) && doc.steps[stepIndex]) {
        doc.steps[stepIndex].status = isApprove ? 'approved' : 'rejected';
        doc.steps[stepIndex].approverName = 'Trưởng bộ phận (Email)';
        doc.steps[stepIndex].comment = isApprove ? 'Đồng ý phê duyệt (qua Email)' : 'Từ chối (qua Email)';
        doc.steps[stepIndex].actionAt = now;
      }

      if (isApprove) {
        if (doc.currentStepIndex + 1 < doc.steps.length) {
          doc.currentStepIndex += 1;
        } else {
          doc.status = 'approved';
        }
      } else {
        doc.status = 'rejected';
      }
      doc.updatedAt = now;
    } else if (type === 'repair') {
      const stepIndex = 1; // Step 2: Trưởng bộ phận duyệt (0-indexed: index 1)
      const finalProposal = (proposedSolution || comment || '').trim();
      if (Array.isArray(doc.steps) && doc.steps[stepIndex]) {
        doc.steps[stepIndex].status = isApprove ? 'approved' : 'rejected';
        doc.steps[stepIndex].approverName = 'Trưởng bộ phận';
        doc.steps[stepIndex].comment = isApprove
          ? finalProposal || 'Đồng ý phê duyệt đề xuất sửa chữa'
          : finalProposal || 'Từ chối (qua Email)';
        doc.steps[stepIndex].updatedAt = now;
      }
      doc.managerApprovedAt = now;
      doc.managerName = doc.managerName || 'Trưởng bộ phận';
      if (finalProposal) {
        doc.proposedSolution = finalProposal;
        doc.managerComment = finalProposal;
      }
      if (isApprove) {
        doc.status = 'maintenance_pending';
        doc.currentStepIndex = 2; // Step 3: Cơ điện sửa chữa
      } else {
        doc.status = 'rejected';
        doc.rejectionReason = finalProposal || 'Từ chối qua Email';
      }
      doc.updatedAt = now;
    }

    // Determine target save path if relPath was not found
    if (!relPath) {
      const subDir =
        type === 'leave'
          ? 'leave-request'
          : type === 'gate_pass'
          ? 'gate-pass'
          : type === 'attendance'
          ? 'attendance'
          : 'repair-proposal';
      const year = new Date().getFullYear();
      relPath = `${subDir}/${year}/${doc.id}.json`;
    }

    const jsonString = JSON.stringify(doc, null, 2);

    // 1. Save to /tmp
    try {
      const tmpFile = path.join(TMP_DIR, relPath);
      ensureDir(path.dirname(tmpFile));
      fs.writeFileSync(tmpFile, jsonString, 'utf-8');
    } catch (e: any) {
      console.warn('Không thể ghi /tmp:', e.message);
    }

    // 2. Save to local disk if writable
    try {
      const localFile = path.join(BASE_DIR, relPath);
      ensureDir(path.dirname(localFile));
      fs.writeFileSync(localFile, jsonString, 'utf-8');
    } catch {}

    // 3. Commit to GitHub in background
    if (ghService) {
      const ghPath = `${gitConfig.basePath || 'company-data'}/${relPath}`;
      const commitMsg = isApprove
        ? `Approve ${doc.id} via Email Relay`
        : `Reject ${doc.id} via Email Relay`;

      ghService.saveFile(ghPath, jsonString, commitMsg).catch((err) => {
        console.warn('[Approve API] GitHub commit error:', err.message);
      });
    }

    // 4. If repair proposal approved, dispatch email to Head of Maintenance
    if (type === 'repair' && isApprove) {
      await sendMaintenanceEmailServer(doc, emailConfig);
    }

    return NextResponse.json({
      success: true,
      action,
      message: isApprove
        ? `Phê duyệt ${doc.id} thành công!`
        : `Từ chối ${doc.id} thành công!`,
      record: doc,
    });
  } catch (err: any) {
    console.error('Lỗi API /api/approve:', err);
    return NextResponse.json({ success: false, message: err.message || 'Lỗi xử lý phê duyệt' }, { status: 500 });
  }
}
