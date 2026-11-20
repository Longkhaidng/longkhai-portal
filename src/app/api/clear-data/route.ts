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
  | 'pccc_inspections'
  | 'periodic_inspections'
  | 'food_inspection_3step'
  | 'announcements';

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
  'periodic_inspections',
  'food_inspection_3step',
  'announcements',
];

const TARGET_DIR_MAP: Record<ClearTargetType, string[]> = {
  gate_pass: ['gate-pass'],
  leave_request: ['leave-request'],
  attendance: ['attendance'],
  food_registration: ['food-registration'],
  camera_request: ['camera-request'],
  overtime: ['overtime'],
  repair: ['repair-proposal'],
  stationery: ['stationery-proposal'],
  general_proposal: ['general-proposal'],
  pccc_inspections: [path.join('pccc', 'inspections')],
  periodic_inspections: [
    path.join('periodic-inspections', 'first-aid'),
    path.join('periodic-inspections', 'eyewash'),
    path.join('periodic-inspections', 'stormwater'),
    path.join('periodic-inspections', 'groundwater-soil'),
  ],
  food_inspection_3step: [path.join('settings', 'food-inspection-3step.json')],
  announcements: [path.join('settings', 'announcements.json')],
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
      const paths = TARGET_DIR_MAP[target] || [];
      clearedMap[target] = now;
      let count = 0;

      for (const p of paths) {
        clearedMap[p.replace(/\\/g, '/')] = now;
        const isFile = p.endsWith('.json');

        if (isFile) {
          // Special file reset (e.g. food inspection or announcements)
          for (const base of [BASE_DIR, TMP_DIR]) {
            const targetFile = path.join(base, p);
            try {
              if (fs.existsSync(targetFile)) {
                if (p.includes('food-inspection-3step')) {
                  const content = fs.readFileSync(targetFile, 'utf-8');
                  const parsed = JSON.parse(content);
                  const resetStore = {
                    settings: parsed?.settings || {
                      companyName: 'Công ty CP Long Khải tại Đà Nẵng',
                      inspector: '',
                      location: 'Nhà ăn',
                    },
                    updatedAt: new Date().toISOString(),
                    STEP1_FRESH: [],
                    STEP1_DRY: [],
                    STEP2_COOKING: [],
                    STEP3_SERVING: [],
                    STEP4_SAMPLE: [],
                    freshTemplates: parsed?.freshTemplates || [],
                    dryTemplates: parsed?.dryTemplates || [],
                    cookingTemplates: parsed?.cookingTemplates || [],
                    servingTemplates: parsed?.servingTemplates || [],
                    sampleFoodTemplates: parsed?.sampleFoodTemplates || [],
                  };
                  fs.writeFileSync(targetFile, JSON.stringify(resetStore, null, 2), 'utf-8');
                  count++;
                } else if (p.includes('announcements')) {
                  fs.writeFileSync(targetFile, '[]', 'utf-8');
                  count++;
                }
              }
            } catch {}
          }
        } else {
          // Directory deletion
          count += deleteFilesRecursive(path.join(BASE_DIR, p));
          count += deleteFilesRecursive(path.join(TMP_DIR, p));
        }
      }
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

    // Await cleaning on GitHub if token configured
    const gitConfig = resolveServerGitHubConfig();
    if (gitConfig.token && gitConfig.owner && gitConfig.repo) {
      try {
        const gh = new GitHubService(gitConfig);
        const basePath = gitConfig.basePath || 'company-data';

        const cleanGitHubDir = async (subDir: string) => {
          const currentYr = new Date().getFullYear();
          const years = [currentYr, currentYr - 1, currentYr + 1];

          for (const yr of years) {
            try {
              const list = await gh.listFiles(`${basePath}/${subDir}/${yr}`);
              for (const item of list) {
                if (item.type === 'file' && item.name.endsWith('.json')) {
                  await gh.deleteFile(item.path, `Clean ${item.name} via Data Management`, item.sha);
                }
              }
            } catch {}
          }

          // Check direct subDir files
          try {
            const list = await gh.listFiles(`${basePath}/${subDir}`);
            for (const item of list) {
              if (item.type === 'file' && item.name.endsWith('.json') && !item.name.startsWith('.')) {
                await gh.deleteFile(item.path, `Clean ${item.name} via Data Management`, item.sha);
              }
            }
          } catch {}
        };

        for (const target of targetList) {
          const paths = TARGET_DIR_MAP[target] || [];
          for (const p of paths) {
            const relDir = p.replace(/\\/g, '/');
            if (relDir.endsWith('.json')) {
              // Special file on GitHub
              try {
                const ghPath = `${basePath}/${relDir}`;
                if (relDir.includes('food-inspection-3step')) {
                  const emptyStore = JSON.stringify({
                    settings: {
                      companyName: 'Công ty CP Long Khải tại Đà Nẵng',
                      inspector: '',
                      location: 'Nhà ăn',
                    },
                    updatedAt: new Date().toISOString(),
                    STEP1_FRESH: [],
                    STEP1_DRY: [],
                    STEP2_COOKING: [],
                    STEP3_SERVING: [],
                    STEP4_SAMPLE: [],
                  }, null, 2);
                  await gh.saveFile(ghPath, emptyStore, 'Clean food inspection logs via Data Management');
                } else if (relDir.includes('announcements')) {
                  await gh.saveFile(ghPath, '[]', 'Clean announcements via Data Management');
                }
              } catch {}
            } else {
              await cleanGitHubDir(relDir);
            }
          }
        }

        // Save .cleared_collections.json to GitHub
        try {
          await gh.saveFile(
            `${basePath}/.cleared_collections.json`,
            JSON.stringify(clearedMap, null, 2),
            'Update cleared collections timestamps'
          );
        } catch {}
      } catch (ghErr) {
        console.warn('Lỗi dọn dẹp trên GitHub:', ghErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã dọn dẹp sạch sẽ dữ liệu trên máy chủ thành công!`,
      deletedCounts,
      clearedMap,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || 'Lỗi khi xóa dữ liệu' }, { status: 500 });
  }
}
