import fs from 'fs';
import path from 'path';
import { GitHubConfig } from '@/types/github';

const BASE_DIR = path.join(process.cwd(), 'company-data');
const TMP_DIR = path.join('/tmp', 'company-data');

export function resolveServerGitHubConfig(): GitHubConfig {
  const tmpConfigFile = path.join(TMP_DIR, 'settings/github-config.json');
  const localConfigFile = path.join(BASE_DIR, 'settings/github-config.json');

  let fileConfig: any = {};
  try {
    if (fs.existsSync(tmpConfigFile)) {
      fileConfig = JSON.parse(fs.readFileSync(tmpConfigFile, 'utf-8'));
    } else if (fs.existsSync(localConfigFile)) {
      fileConfig = JSON.parse(fs.readFileSync(localConfigFile, 'utf-8'));
    }
  } catch {}

  const owner = process.env.GITHUB_OWNER || process.env.NEXT_PUBLIC_GITHUB_OWNER || fileConfig.owner || 'Longkhaidng';
  const repo = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || fileConfig.repo || 'longkhai-portal';
  const branch = process.env.GITHUB_BRANCH || process.env.NEXT_PUBLIC_GITHUB_BRANCH || fileConfig.branch || 'main';
  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN || fileConfig.token || '';
  const basePath = process.env.GITHUB_BASE_PATH || fileConfig.basePath || 'company-data';

  return {
    owner,
    repo,
    branch,
    token,
    basePath,
  };
}
