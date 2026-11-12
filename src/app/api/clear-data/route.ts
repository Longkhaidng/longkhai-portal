import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveServerGitHubConfig } from '@/lib/server-github';
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

export type ClearTargetType =
  | 'gate_pass'
  | 'leave_request'
  | 'attendance'
  | 'food_registration'
  | 'camera_request'
  | 'overtime'
  | 'repair'
  | 'stationery'
  | 'general_proposal'
  | 'pccc_inspections';

const ALL_TARGETS: ClearTargetType[] = [
  'gate_pass',
  'leave_request',
  'attendance',
  'food_registration',
  'camera_request',
  'overtime',
  'repair',
  'stationery',
  'general_proposal',
  'pccc_inspections',
];

const TARGET_DIR_MAP: Record<ClearTargetType, string> = {
  gate_pass: 'gate-pass',
  leave_request: 'leave-request',
  attendance: 'attendance',
  food_registration: 'food-registration',
  camera_request: 'camera-request',
  overtime: 'overtime',
  repair: 'repair-proposal',
  stationery: 'stationery-proposal',
  general_proposal: 'general-proposal',
  pccc_inspections: path.join('pccc', 'inspections'),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targets, deleteAll } = body as {
      targets?: ClearTargetType[];
      deleteAll?: boolean;
    };

    const targetList: ClearTargetType[] = deleteAll
      ? ALL_TARGETS
      : (targets || []).filter((t): t is ClearTargetType => ALL_TARGETS.includes(t));

    if (targetList.length === 0) {
      return NextResponse.json({ success: false, message: 'Chưa chọn loại dữ liệu cần xóa' }, { status: 400 });
    }

    const deletedCounts: Record<string, number> = {};
    const now = Date.now();

    // Read and update cleared collections timestamps
    let clearedMap: Record<string, number> = {};
    const metaPathTmp = path.join(TMP_DIR, '.cleared_collections.json');
    const metaPathBase = path.join(BASE_DIR, '.cleared_collections.json');
    try {
      if (fs.existsSync(metaPathTmp)) {
        clearedMap = JSON.parse(fs.readFileSync(metaPathTmp, 'utf-8'));
      } else if (fs.existsSync(metaPathBase)) {
        clearedMap = JSON.parse(fs.readFileSync(metaPathBase, 'utf-8'));
      }
    } catch {}

    for (const target of targetList) {
      const relDir = TARGET_DIR_MAP[target];
      if (!relDir) continue;
      clearedMap[relDir] = now;
      let count = 0;
      count += deleteFilesRecursive(path.join(BASE_DIR, relDir));
      count += deleteFilesRecursive(path.join(TMP_DIR, relDir));
      deletedCounts[target] = count;
    }

    // Persist cleared timestamp file in /tmp and BASE_DIR
    try {
      if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
      fs.writeFileSync(metaPathTmp, JSON.stringify(clearedMap, null, 2), 'utf-8');
    } catch {}
    try {
      if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });
      fs.writeFileSync(metaPathBase, JSON.stringify(clearedMap, null, 2), 'utf-8');
    } catch {}

    // Optionally clean on GitHub if token configured
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

        for (const target of targetList) {
          const relDir = TARGET_DIR_MAP[target].replace(/\\/g, '/');
          cleanGitHubDir(relDir).catch(() => {});
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
