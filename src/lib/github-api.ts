import { GitHubConfig } from '@/types/github';

export class GitHubService {
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  private get headers(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'LongKhai-Manufacturing-Portal',
    };
    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token.trim()}`;
    }
    return headers;
  }

  private get baseUrl(): string {
    return `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
  }

  // Helper encode UTF-8 to Base64 (handles Vietnamese Unicode cleanly)
  private utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper decode Base64 to UTF-8
  private base64ToUtf8(b64: string): string {
    const cleanB64 = b64.replace(/\s/g, '');
    const binary = atob(cleanB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  /**
   * Test if the GitHub credentials and repository exist and are accessible
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.owner || !this.config.repo || !this.config.token) {
      return { success: false, message: 'Vui lòng điền đầy đủ GitHub Owner, Repository và Token (PAT).' };
    }

    try {
      const res = await fetch(this.baseUrl, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, message: 'GitHub Token không hợp lệ hoặc đã hết hạn.' };
        }
        if (res.status === 404) {
          return { success: false, message: `Không tìm thấy repository: ${this.config.owner}/${this.config.repo}` };
        }
        return { success: false, message: `Lỗi kết nối GitHub (HTTP ${res.status}): ${res.statusText}` };
      }

      const repoInfo = await res.json();
      return {
        success: true,
        message: `Kết nối thành công tới repository "${repoInfo.full_name}" (Nhánh: ${this.config.branch || 'main'}).`,
      };
    } catch (err: any) {
      return { success: false, message: `Lỗi mạng khi kết nối GitHub: ${err.message}` };
    }
  }

  /**
   * Get file content and SHA from GitHub
   */
  async getFile(path: string): Promise<{ content: string; sha: string } | null> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${this.baseUrl}/contents/${cleanPath}?ref=${this.config.branch || 'main'}`;

    try {
      const res = await fetch(url, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (res.status === 404) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
      }

      const data = await res.json();
      const content = this.base64ToUtf8(data.content || '');
      return { content, sha: data.sha };
    } catch (err) {
      console.warn(`[GitHub API] getFile ${path} failed:`, err);
      return null;
    }
  }

  /**
   * Create or update a file on GitHub
   */
  async saveFile(path: string, content: string, commitMessage: string, sha?: string): Promise<{ success: boolean; sha?: string; error?: string }> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `${this.baseUrl}/contents/${cleanPath}`;

    try {
      // If no SHA provided, check if file exists to avoid 422 Conflict
      let targetSha = sha;
      if (!targetSha) {
        const existing = await this.getFile(cleanPath);
        if (existing) {
          targetSha = existing.sha;
        }
      }

      const bodyPayload: any = {
        message: commitMessage || `Update ${cleanPath} via Long Khai Portal`,
        content: this.utf8ToBase64(content),
        branch: this.config.branch || 'main',
      };

      if (targetSha) {
        bodyPayload.sha = targetSha;
      }

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || res.statusText);
      }

      const result = await res.json();
      return { success: true, sha: result.content?.sha };
    } catch (err: any) {
      console.error(`[GitHub API] saveFile ${path} error:`, err);
      return { success: false, error: err.message };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string): Promise<Array<{ name: string; path: string; type: 'file' | 'dir'; sha: string }>> {
    const cleanPath = dirPath.startsWith('/') ? dirPath.slice(1) : dirPath;
    const url = `${this.baseUrl}/contents/${cleanPath}?ref=${this.config.branch || 'main'}`;

    try {
      const res = await fetch(url, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (!res.ok) return [];

      const items = await res.json();
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        sha: item.sha,
      }));
    } catch (err) {
      console.warn(`[GitHub API] listFiles ${dirPath} failed:`, err);
      return [];
    }
  }

  /**
   * Get Commit History (Audit Log)
   */
  async getCommitHistory(path?: string, limit: number = 20): Promise<any[]> {
    let url = `${this.baseUrl}/commits?per_page=${limit}&sha=${this.config.branch || 'main'}`;
    if (path) {
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      url += `&path=${cleanPath}`;
    }

    try {
      const res = await fetch(url, {
        headers: this.headers,
        cache: 'no-store',
      });

      if (!res.ok) return [];

      const commits = await res.json();
      return commits.map((c: any) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit?.message,
        author: c.commit?.author?.name,
        date: c.commit?.author?.date,
      }));
    } catch (err) {
      console.warn('[GitHub API] getCommitHistory failed:', err);
      return [];
    }
  }
}
