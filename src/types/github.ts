export interface GitHubConfig {
  owner: string; // Tên user hoặc organization trên GitHub
  repo: string; // Tên repository (ví dụ: longkhai-company-data)
  branch: string; // main
  token: string; // GitHub Personal Access Token (PAT)
  basePath: string; // Thư mục gốc chứa dữ liệu: "company-data"
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'sync' | 'import';
  module: string; // pccc, leave, attendance, gate_pass, users, forms, announcements...
  documentId: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
  commitSha?: string;
}

export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  lastSyncedAt?: string;
  pendingChangesCount: number;
  message?: string;
}
