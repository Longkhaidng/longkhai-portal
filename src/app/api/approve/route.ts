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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, action } = body as {
      type: 'leave' | 'gate_pass' | 'attendance' | 'repair';
      id: string;
      action: 'approve' | 'reject';
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
      if (Array.isArray(doc.steps) && doc.steps[stepIndex]) {
        doc.steps[stepIndex].status = isApprove ? 'approved' : 'rejected';
        doc.steps[stepIndex].approverName = 'Trưởng bộ phận (Email)';
        doc.steps[stepIndex].comment = isApprove ? 'Đồng ý phê duyệt (qua Email)' : 'Từ chối (qua Email)';
        doc.steps[stepIndex].updatedAt = now;
      }
      doc.managerApprovedAt = now;
      doc.managerName = 'Trưởng bộ phận (Email)';
      if (isApprove) {
        doc.status = 'maintenance_pending';
        doc.currentStepIndex = 2; // Step 3: Cơ điện sửa chữa
      } else {
        doc.status = 'rejected';
        doc.rejectionReason = 'Từ chối qua Email';
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
