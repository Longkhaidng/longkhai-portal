import { resolveServerGitHubConfig } from '@/lib/server-github';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GitHubConfig } from '@/types/github';

const CONFIG_PATH = path.join(process.cwd(), 'company-data', 'settings', 'github-config.json');
const TMP_CONFIG_PATH = path.join('/tmp', 'github-config.json');



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
