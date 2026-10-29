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

function readJsonFile<T>(relPath: string, defaultValue: T): T {
  // Check /tmp first, then process.cwd()/company-data
  const tmpFile = path.join(TMP_DIR, relPath);
  const localFile = path.join(BASE_DIR, relPath);

  try {
    if (fs.existsSync(tmpFile)) {
      const data = fs.readFileSync(tmpFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}

  try {
    if (fs.existsSync(localFile)) {
      const data = fs.readFileSync(localFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}

  return defaultValue;
}

function scanJsonFiles<T>(subDir: string): T[] {
  const results: Map<string, T> = new Map();

  // Helper to read directory recursively
  const readDir = (dir: string) => {
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          readDir(full);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          try {
            const content = fs.readFileSync(full, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed && parsed.id) {
              results.set(parsed.id, parsed);
            }
          } catch {}
        }
      }
    } catch {}
  };

  // Read base dir first, then overlay with /tmp dir
  readDir(path.join(BASE_DIR, subDir));
  readDir(path.join(TMP_DIR, subDir));

  return Array.from(results.values());
}

export async function GET() {
  try {
    const users = readJsonFile<any[]>('settings/users.json', []);
    const departments = readJsonFile<any[]>('settings/departments.json', []);
    const positions = readJsonFile<any[]>('settings/positions.json', []);
    const webIntegrations = readJsonFile<any[]>('settings/web_integrations.json', []);
    const emailConfig = readJsonFile<any>('settings/email-config.json', null);
    const githubConfig = resolveServerGitHubConfig();

    const leaveRequests = scanJsonFiles<any>('leave-request');
    const gatePasses = scanJsonFiles<any>('gate-pass');
    const attendanceConfirms = scanJsonFiles<any>('attendance');
    const repairProposals = scanJsonFiles<any>('repair-proposal');
    const stationeryProposals = scanJsonFiles<any>('stationery-proposal');
    const generalProposals = scanJsonFiles<any>('general-proposal');
    const stationeryItems = readJsonFile<any[]>('settings/stationery-items.json', []);
    const pcccDevices = readJsonFile<any[]>('pccc/master_devices.json', []);
    const pcccInspections = scanJsonFiles<any>('pccc/inspections');

    return NextResponse.json({
      success: true,
      data: {
        users,
        departments,
        positions,
        webIntegrations,
        leaveRequests,
        gatePasses,
        attendanceConfirms,
        repairProposals,
        stationeryProposals,
        generalProposals,
        stationeryItems,
        pcccDevices,
        pcccInspections,
        emailConfig,
        githubConfig,
      },
      counts: {
        users: users.length,
        leaveRequests: leaveRequests.length,
        gatePasses: gatePasses.length,
        attendanceConfirms: attendanceConfirms.length,
        repairProposals: repairProposals.length,
        stationeryProposals: stationeryProposals.length,
        generalProposals: generalProposals.length,
        stationeryItems: stationeryItems.length,
        pcccDevices: pcccDevices.length,
        pcccInspections: pcccInspections.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data, githubToken } = body as {
      type:
        | 'users'
        | 'leave_request'
        | 'gate_pass'
        | 'attendance'
        | 'repair_proposal'
        | 'stationery_proposal'
        | 'general_proposal'
        | 'stationery_items'
        | 'departments'
        | 'web_integrations'
        | 'github_config'
        | 'email_config'
        | 'pccc_devices'
        | 'pccc_inspections';
      data: any;
      githubToken?: string;
    };

    if (!type || !data) {
      return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    let relFilePath = '';
    let commitMessage = '';

    if (type === 'users') {
      relFilePath = 'settings/users.json';
      commitMessage = `Update users directory (${Array.isArray(data) ? data.length : 1} accounts)`;
    } else if (type === 'leave_request') {
      const year = data.createdAt ? new Date(data.createdAt).getFullYear() : new Date().getFullYear();
      relFilePath = `leave-request/${year}/${data.id}.json`;
      commitMessage = `Update Leave Request ${data.id} (${data.status})`;
    } else if (type === 'gate_pass') {
      const year = data.createdAt ? new Date(data.createdAt).getFullYear() : new Date().getFullYear();
      relFilePath = `gate-pass/${year}/${data.id}.json`;
      commitMessage = `Update Gate Pass ${data.id} (${data.status})`;
    } else if (type === 'attendance') {
      const year = data.date ? new Date(data.date).getFullYear() : new Date().getFullYear();
      relFilePath = `attendance/${year}/${data.id}.json`;
      commitMessage = `Update Attendance ${data.id} (${data.status})`;
    } else if (type === 'repair_proposal') {
      const year = data.createdAt ? new Date(data.createdAt).getFullYear() : new Date().getFullYear();
      relFilePath = `repair-proposal/${year}/${data.id}.json`;
      commitMessage = `Update Repair Proposal ${data.id} (${data.status})`;
    } else if (type === 'stationery_proposal') {
      const year = data.createdAt ? new Date(data.createdAt).getFullYear() : new Date().getFullYear();
      relFilePath = `stationery-proposal/${year}/${data.id}.json`;
      commitMessage = `Update Stationery Proposal ${data.id} (${data.status})`;
    } else if (type === 'general_proposal') {
      const year = data.createdAt ? new Date(data.createdAt).getFullYear() : new Date().getFullYear();
      relFilePath = `general-proposal/${year}/${data.id}.json`;
      commitMessage = `Update General Proposal ${data.id} (${data.status})`;
    } else if (type === 'stationery_items') {
      relFilePath = 'settings/stationery-items.json';
      commitMessage = `Update stationery catalog (${Array.isArray(data) ? data.length : 1} items)`;
    } else if (type === 'departments') {
      relFilePath = 'settings/departments.json';
      commitMessage = `Update departments directory`;
    } else if (type === 'web_integrations') {
      relFilePath = 'settings/web_integrations.json';
      commitMessage = `Update web integrations list`;
    } else if (type === 'email_config') {
      relFilePath = 'settings/email-config.json';
      commitMessage = `Update email configuration`;
    } else if (type === 'pccc_devices') {
      relFilePath = 'pccc/master_devices.json';
      commitMessage = `Update PCCC Master Devices (${Array.isArray(data) ? data.length : 1} items)`;
    } else if (type === 'pccc_inspections') {
      const year = data.inspectedAt ? new Date(data.inspectedAt).getFullYear() : new Date().getFullYear();
      relFilePath = `pccc/inspections/${year}/${data.id}.json`;
      commitMessage = `Save PCCC Inspection ${data.id}`;
    }

    const jsonString = JSON.stringify(data, null, 2);

    // 1. Write to /tmp for immediate serverless availability
    try {
      const tmpFile = path.join(TMP_DIR, relFilePath);
      ensureDir(path.dirname(tmpFile));
      fs.writeFileSync(tmpFile, jsonString, 'utf-8');
    } catch (e: any) {
      console.warn('Không thể ghi /tmp:', e.message);
    }

    // 2. Try writing to process.cwd()/company-data if writable
    try {
      const localFile = path.join(BASE_DIR, relFilePath);
      ensureDir(path.dirname(localFile));
      fs.writeFileSync(localFile, jsonString, 'utf-8');
    } catch {}

    // 3. Push to GitHub if token available
    const gitConfig = resolveServerGitHubConfig();
    const token = githubToken?.trim() || gitConfig.token?.trim();

    if (token && gitConfig.owner && gitConfig.repo && relFilePath) {
      try {
        const gh = new GitHubService({ ...gitConfig, token });
        const ghPath = `${gitConfig.basePath || 'company-data'}/${relFilePath}`;
        gh.saveFile(ghPath, jsonString, commitMessage).catch((ghErr) => {
          console.warn('[Sync API] GitHub background push failed:', ghErr.message);
        });
      } catch (err: any) {
        console.warn('[Sync API] GitHub service init error:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đã lưu và đồng bộ dữ liệu thành công!',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
