import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveServerGitHubConfig } from '@/app/api/github-config/route';
import { GitHubService } from '@/lib/github-api';

const BASE_DIR = path.join(process.cwd(), 'company-data');
const TMP_DIR = path.join('/tmp', 'company-data');

function deleteFilesRecursive(dirPath: string): number {
  let count = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        count += deleteFilesRecursive(full);
        try {
          fs.rmdirSync(full);
        } catch {}
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          fs.unlinkSync(full);
          count++;
        } catch {}
      }
    }
  } catch (e: any) {
    console.warn(`Lỗi xóa thư mục ${dirPath}:`, e.message);
  }
  return count;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targets, deleteAll } = body as {
      targets?: ('gate_pass' | 'leave_request' | 'attendance')[];
      deleteAll?: boolean;
    };

    const targetList = deleteAll
      ? ['gate_pass', 'leave_request', 'attendance']
      : targets || [];

    if (targetList.length === 0) {
      return NextResponse.json({ success: false, message: 'Chưa chọn loại dữ liệu cần xóa' }, { status: 400 });
    }

    const deletedCounts: Record<string, number> = {
      gate_pass: 0,
      leave_request: 0,
      attendance: 0,
    };

    // 1. Delete Gate Passes
    if (targetList.includes('gate_pass')) {
      deletedCounts.gate_pass += deleteFilesRecursive(path.join(BASE_DIR, 'gate-pass'));
      deletedCounts.gate_pass += deleteFilesRecursive(path.join(TMP_DIR, 'gate-pass'));
    }

    // 2. Delete Leave Requests
    if (targetList.includes('leave_request')) {
      deletedCounts.leave_request += deleteFilesRecursive(path.join(BASE_DIR, 'leave-request'));
      deletedCounts.leave_request += deleteFilesRecursive(path.join(TMP_DIR, 'leave-request'));
    }

    // 3. Delete Attendance Confirms
    if (targetList.includes('attendance')) {
      deletedCounts.attendance += deleteFilesRecursive(path.join(BASE_DIR, 'attendance'));
      deletedCounts.attendance += deleteFilesRecursive(path.join(TMP_DIR, 'attendance'));
    }

    // 4. Optionally clean on GitHub if token configured
    const gitConfig = resolveServerGitHubConfig();
    if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
      try {
        const gh = new GitHubService(gitConfig);
        const basePath = gitConfig.basePath || 'company-data';

        const cleanGitHubDir = async (subDir: string) => {
          const years = [new Date().getFullYear(), new Date().getFullYear() - 1];
          for (const yr of years) {
            const list = await gh.listFiles(`${basePath}/${subDir}/${yr}`);
            for (const item of list) {
              if (item.type === 'file' && item.name.endsWith('.json')) {
                await gh.deleteFile(item.path, `Clean ${item.name} via Data Management`, item.sha);
              }
            }
          }
        };

        if (targetList.includes('gate_pass')) {
          cleanGitHubDir('gate-pass').catch(() => {});
        }
        if (targetList.includes('leave_request')) {
          cleanGitHubDir('leave-request').catch(() => {});
        }
        if (targetList.includes('attendance')) {
          cleanGitHubDir('attendance').catch(() => {});
        }
      } catch (ghErr) {
        console.warn('Lỗi dọn dẹp trên GitHub:', ghErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp sạch sẽ dữ liệu trên máy chủ thành công!`,
      deletedCounts,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Lỗi khi xóa dữ liệu' }, { status: 500 });
  }
}
