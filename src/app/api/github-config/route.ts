import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GitHubConfig } from '@/types/github';

const CONFIG_PATH = path.join(process.cwd(), 'company-data', 'settings', 'github-config.json');
const TMP_CONFIG_PATH = path.join('/tmp', 'github-config.json');

export function resolveServerGitHubConfig(): GitHubConfig {
  const envConfig: GitHubConfig = {
    owner: process.env.GITHUB_OWNER || process.env.NEXT_PUBLIC_GITHUB_OWNER || 'Longkhaidng',
    repo: process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || 'longkhai-portal',
    branch: process.env.GITHUB_BRANCH || process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
    token: process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
    basePath: 'company-data',
  };

  try {
    const targetPath = fs.existsSync(TMP_CONFIG_PATH) ? TMP_CONFIG_PATH : CONFIG_PATH;
    if (fs.existsSync(targetPath)) {
      const fileData = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(fileData);
      return {
        ...envConfig,
        ...parsed,
        token: parsed.token || envConfig.token,
      };
    }
  } catch (err: any) {
    console.warn('Lỗi đọc github-config trên server:', err.message);
  }

  return envConfig;
}

export async function GET() {
  const config = resolveServerGitHubConfig();
  return NextResponse.json({
    success: true,
    config: {
      ...config,
      // Mask token slightly on public GET if needed, or pass full if same-origin internal API
      token: config.token,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GitHubConfig;
    if (!body || !body.owner || !body.repo) {
      return NextResponse.json({ success: false, message: 'Dữ liệu cấu hình GitHub không hợp lệ' }, { status: 400 });
    }

    const configToSave: GitHubConfig = {
      owner: body.owner.trim(),
      repo: body.repo.trim(),
      branch: body.branch?.trim() || 'main',
      token: body.token?.trim() || '',
      basePath: body.basePath?.trim() || 'company-data',
    };

    // 1. Write to company-data if filesystem is writable
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configToSave, null, 2), 'utf-8');
    } catch {}

    // 2. Write to /tmp for serverless runtime
    try {
      fs.writeFileSync(TMP_CONFIG_PATH, JSON.stringify(configToSave, null, 2), 'utf-8');
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình GitHub trên máy chủ thành công!',
      config: configToSave,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
