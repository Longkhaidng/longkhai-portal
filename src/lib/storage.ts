import { User, CATEGORY_DEFINITIONS, Department, WebIntegration, Position } from '@/types/user';
import { LeaveRequest } from '@/types/leave';
import { AttendanceConfirm } from '@/types/attendance';
import { GatePass } from '@/types/gatePass';
import { Announcement } from '@/types/announcement';
import { DynamicFormSchema, DynamicFormSubmission } from '@/types/dynamicForm';
import { PluginModule, INITIAL_PLUGINS } from '@/types/plugin';
import { GitHubConfig, AuditLog, SyncStatus } from '@/types/github';
import { EmailConfig } from '@/types/email';
import {
  INITIAL_ROOT_ADMIN,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_WEB_INTEGRATIONS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DYNAMIC_FORMS,
} from './initial-data';
import { GitHubService } from './github-api';
import { formatDocId, sortNewestFirst } from './utils';

const STORAGE_KEYS = {
  USERS: 'lk_portal_users',
  DEPARTMENTS: 'lk_portal_departments',
  POSITIONS: 'lk_portal_positions',
  WEB_INTEGRATIONS: 'lk_portal_web_integrations',
  LEAVE_REQUESTS: 'lk_portal_leave_requests',
  ATTENDANCE_CONFIRMS: 'lk_portal_attendance_confirms',
  GATE_PASSES: 'lk_portal_gate_passes',
  ANNOUNCEMENTS: 'lk_portal_announcements',
  DYNAMIC_FORMS: 'lk_portal_dynamic_forms',
  FORM_SUBMISSIONS: 'lk_portal_form_submissions',
  PLUGINS: 'lk_portal_plugins',
  GITHUB_CONFIG: 'lk_portal_github_config',
  EMAIL_CONFIG: 'lk_portal_email_config',
  AUDIT_LOGS: 'lk_portal_audit_logs',
  CURRENT_USER_SESSION: 'lk_portal_current_user_session',
};

class StorageService {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // --- GITHUB CONFIG ---
  getGitHubConfig(): GitHubConfig {
    if (!this.isClient()) {
      return { owner: '', repo: '', branch: 'main', token: '', basePath: 'company-data' };
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GITHUB_CONFIG);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to get GitHub config from storage', e);
    }
    return {
      owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || '',
      repo: process.env.NEXT_PUBLIC_GITHUB_REPO || '',
      branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
      token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || '',
      basePath: 'company-data',
    };
  }

  saveGitHubConfig(config: GitHubConfig): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify(config));
    this.addAuditLog('update', 'settings', 'github_config', 'ADMIN', 'Quản trị viên', 'Cập nhật cấu hình GitHub kết nối cơ sở dữ liệu');
  }

  getGitHubClient(): GitHubService | null {
    const config = this.getGitHubConfig();
    if (config.owner && config.repo && config.token) {
      return new GitHubService(config);
    }
    return null;
  }

  // --- EMAIL CONFIG ---
  getEmailConfig(): EmailConfig {
    const defaultConfig: EmailConfig = {
      provider: 'gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: '',
      smtpPassword: '',
      senderName: 'Cổng Thông Tin Long Khải',
      senderEmail: '',
      isEnabled: true,
      portalBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
    };
    if (!this.isClient()) return defaultConfig;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMAIL_CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...defaultConfig, ...parsed };
      }
    } catch {}
    return defaultConfig;
  }

  saveEmailConfig(config: EmailConfig, byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(config));
    this.addAuditLog(
      'update',
      'settings',
      'email_config',
      byUser?.id || 'ADMIN',
      byUser?.name || 'Quản trị viên',
      'Cập nhật cấu hình gửi email thông báo phê duyệt'
    );
    this.syncFileToGitHub('settings/email-config.json', JSON.stringify(config, null, 2), 'Update email configuration');
  }

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  addAuditLog(
    action: AuditLog['action'],
    module: string,
    documentId: string,
    userId: string,
    userName: string,
    details: string
  ): void {
    if (!this.isClient()) return;
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}`,
      action,
      module,
      documentId,
      userId,
      userName,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }


  // --- POSITIONS (CHỨC VỤ) ---
  getPositions(): Position[] {
    if (!this.isClient()) return INITIAL_POSITIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSITIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return sortNewestFirst(parsed);
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(INITIAL_POSITIONS));
    return INITIAL_POSITIONS;
  }

  savePositions(positions: Position[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
    this.addAuditLog(
      'update',
      'positions',
      'settings/positions.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh mục chức vụ (${positions.length} chức vụ)`
    );
    this.syncFileToGitHub('settings/positions.json', JSON.stringify(positions, null, 2), `Update positions directory`);
  }

  // --- DEPARTMENTS (PHÒNG BAN) ---
  getDepartments(): Department[] {
    if (!this.isClient()) return INITIAL_DEPARTMENTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    return INITIAL_DEPARTMENTS;
  }

  saveDepartments(departments: Department[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    this.addAuditLog(
      'update',
      'departments',
      'settings/departments.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh mục phòng ban (${departments.length} phòng ban)`
    );
    this.syncFileToGitHub('settings/departments.json', JSON.stringify(departments, null, 2), `Update departments directory`);
  }

  // --- WEB INTEGRATIONS (TÍCH HỢP TRANG WEB) ---
  getWebIntegrations(): WebIntegration[] {
    if (!this.isClient()) return INITIAL_WEB_INTEGRATIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEB_INTEGRATIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.WEB_INTEGRATIONS, JSON.stringify(INITIAL_WEB_INTEGRATIONS));
    return INITIAL_WEB_INTEGRATIONS;
  }

  saveWebIntegrations(items: WebIntegration[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.WEB_INTEGRATIONS, JSON.stringify(items));
    this.addAuditLog(
      'update',
      'web_integrations',
      'settings/web_integrations.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh sách trang web tích hợp (${items.length} website)`
    );
    this.syncFileToGitHub('settings/web_integrations.json', JSON.stringify(items, null, 2), `Update web integrations list`);
  }

  // --- USERS & PERMISSIONS ---
  getUsers(): User[] {
    if (!this.isClient()) return [INITIAL_ROOT_ADMIN];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        const users = JSON.parse(data);
        if (Array.isArray(users) && users.length > 0) return users;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([INITIAL_ROOT_ADMIN]));
    return [INITIAL_ROOT_ADMIN];
  }

  saveUsers(users: User[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.addAuditLog(
      'update',
      'users',
      'settings/users.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh sách người dùng (${users.length} tài khoản)`
    );
    this.syncFileToGitHub('settings/users.json', JSON.stringify(users, null, 2), `Update users list (${users.length} accounts)`);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'users', data: users }),
    }).catch(() => {});
  }

  // --- LEAVE REQUESTS ---
  getLeaveRequests(): LeaveRequest[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
      if (data) {
        const list: LeaveRequest[] = JSON.parse(data);
        return sortNewestFirst(list.map((r) => ({ ...r, id: formatDocId(r.id) })));
      }
    } catch {}
    return [];
  }

  saveLeaveRequest(request: LeaveRequest, byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    const requests = this.getLeaveRequests();
    const existingIndex = requests.findIndex((r) => r.id === request.id);
    const isNew = existingIndex < 0;

    if (isNew) {
      requests.unshift(request);
    } else {
      requests[existingIndex] = request;
    }
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));

    this.addAuditLog(
      isNew ? 'create' : 'update',
      'leave',
      request.id,
      byUser?.id || request.employeeId,
      byUser?.name || request.employeeName,
      `${isNew ? 'Tạo' : 'Cập nhật'} đơn nghỉ phép ${request.id} (${request.totalDays} ngày) - Trạng thái: ${request.status}`
    );

    const year = new Date().getFullYear();
    this.syncFileToGitHub(`leave-request/${year}/${request.id}.json`, JSON.stringify(request, null, 2), `Update Leave Request ${request.id}`);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'leave_request', data: request }),
    }).catch(() => {});
  }

  // --- ATTENDANCE CONFIRMS ---
  getAttendanceConfirms(): AttendanceConfirm[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_CONFIRMS);
      if (data) {
        const parsed: AttendanceConfirm[] = JSON.parse(data);
        let modified = false;
        parsed.forEach((c) => {
          c.id = formatDocId(c.id);
          c.steps?.forEach((s) => {
            if (s.roleRequired === 'accountant' && (s.approverName === 'Bộ phận Kế toán Tiền lương' || !s.approverName)) {
              s.approverName = 'Bộ phận Kế toán Tài chính';
              modified = true;
            }
          });
        });
        if (modified) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIRMS, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}
    return [];
  }

  saveAttendanceConfirm(confirm: AttendanceConfirm, byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    const confirms = this.getAttendanceConfirms();
    const existingIndex = confirms.findIndex((c) => c.id === confirm.id);
    const isNew = existingIndex < 0;

    if (isNew) {
      confirms.unshift(confirm);
    } else {
      confirms[existingIndex] = confirm;
    }
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIRMS, JSON.stringify(confirms));

    this.addAuditLog(
      isNew ? 'create' : 'update',
      'attendance',
      confirm.id,
      byUser?.id || confirm.employeeId,
      byUser?.name || confirm.employeeName,
      `${isNew ? 'Tạo' : 'Cập nhật'} phiếu xác nhận công ${confirm.id} (${confirm.issueType}) - Trạng thái: ${confirm.status}`
    );

    const year = new Date().getFullYear();
    this.syncFileToGitHub(`attendance/${year}/${confirm.id}.json`, JSON.stringify(confirm, null, 2), `Update Attendance Confirm ${confirm.id}`);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'attendance', data: confirm }),
    }).catch(() => {});
  }

  // --- GATE PASSES ---
  getGatePasses(): GatePass[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GATE_PASSES);
      if (data) {
        const passes: GatePass[] = JSON.parse(data);
        return sortNewestFirst(passes.map((p) => ({ ...p, id: formatDocId(p.id) })));
      }
    } catch {}
    return [];
  }

  saveGatePass(pass: GatePass, byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    const passes = this.getGatePasses();
    const existingIndex = passes.findIndex((p) => p.id === pass.id);
    const isNew = existingIndex < 0;

    if (isNew) {
      passes.unshift(pass);
    } else {
      passes[existingIndex] = pass;
    }
    localStorage.setItem(STORAGE_KEYS.GATE_PASSES, JSON.stringify(passes));

    this.addAuditLog(
      isNew ? 'create' : 'update',
      'gate_pass',
      pass.id,
      byUser?.id || pass.employeeId,
      byUser?.name || pass.employeeName,
      `${isNew ? 'Tạo' : 'Cập nhật'} phiếu ra vào cổng ${pass.id} - Trạng thái: ${pass.status}`
    );

    const year = new Date().getFullYear();
    this.syncFileToGitHub(`gate-pass/${year}/${pass.id}.json`, JSON.stringify(pass, null, 2), `Update Gate Pass ${pass.id}`);
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'gate_pass', data: pass }),
    }).catch(() => {});
  }

  // --- ANNOUNCEMENTS ---
  getAnnouncements(): Announcement[] {
    if (!this.isClient()) return INITIAL_ANNOUNCEMENTS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    return INITIAL_ANNOUNCEMENTS;
  }

  saveAnnouncements(announcements: Announcement[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    this.addAuditLog(
      'update',
      'announcements',
      'announcements/announcements.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh sách thông báo (${announcements.length} bài viết)`
    );
    this.syncFileToGitHub('announcements/announcements.json', JSON.stringify(announcements, null, 2), `Update announcements`);
  }

  // --- DYNAMIC FORMS ---
  getDynamicForms(): DynamicFormSchema[] {
    if (!this.isClient()) return INITIAL_DYNAMIC_FORMS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DYNAMIC_FORMS);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.DYNAMIC_FORMS, JSON.stringify(INITIAL_DYNAMIC_FORMS));
    return INITIAL_DYNAMIC_FORMS;
  }

  saveDynamicForms(forms: DynamicFormSchema[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.DYNAMIC_FORMS, JSON.stringify(forms));
    this.addAuditLog(
      'update',
      'forms',
      'forms/forms.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật danh mục biểu mẫu động (${forms.length} biểu mẫu)`
    );
    this.syncFileToGitHub('forms/forms.json', JSON.stringify(forms, null, 2), `Update dynamic forms definitions`);
  }

  getFormSubmissions(): DynamicFormSubmission[] {
    if (!this.isClient()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FORM_SUBMISSIONS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  saveFormSubmission(submission: DynamicFormSubmission, byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    const subs = this.getFormSubmissions();
    const existingIndex = subs.findIndex((s) => s.id === submission.id);
    const isNew = existingIndex < 0;

    if (isNew) {
      subs.unshift(submission);
    } else {
      subs[existingIndex] = submission;
    }
    localStorage.setItem(STORAGE_KEYS.FORM_SUBMISSIONS, JSON.stringify(subs));

    this.addAuditLog(
      isNew ? 'create' : 'update',
      'forms',
      submission.id,
      byUser?.id || submission.employeeId,
      byUser?.name || submission.employeeName,
      `${isNew ? 'Nộp' : 'Cập nhật'} phiếu biểu mẫu ${submission.formTitle} (${submission.id}) - Trạng thái: ${submission.status}`
    );

    const year = new Date().getFullYear();
    this.syncFileToGitHub(`forms/submissions/${year}/${submission.id}.json`, JSON.stringify(submission, null, 2), `Form Submission ${submission.id}`);
  }

  // --- PLUGINS ---
  getPlugins(): PluginModule[] {
    if (!this.isClient()) return INITIAL_PLUGINS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLUGINS);
      if (data) return JSON.parse(data);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.PLUGINS, JSON.stringify(INITIAL_PLUGINS));
    return INITIAL_PLUGINS;
  }

  savePlugins(plugins: PluginModule[], byUser?: { id: string; name: string }): void {
    if (!this.isClient()) return;
    localStorage.setItem(STORAGE_KEYS.PLUGINS, JSON.stringify(plugins));
    this.addAuditLog(
      'update',
      'plugins',
      'settings/plugins.json',
      byUser?.id || 'SYSTEM',
      byUser?.name || 'Hệ thống',
      `Cập nhật trạng thái tiện ích mở rộng (${plugins.filter((p) => p.isEnabled).length} đang bật)`
    );
    this.syncFileToGitHub('settings/plugins.json', JSON.stringify(plugins, null, 2), `Update plugins settings`);
  }

  // --- SYNC ENGINE TO GITHUB ---
  private async syncFileToGitHub(relativeFilePath: string, content: string, commitMessage: string) {
    const client = this.getGitHubClient();
    if (!client) return;
    const config = this.getGitHubConfig();
    const fullPath = `${config.basePath || 'company-data'}/${relativeFilePath}`;
    try {
      await client.saveFile(fullPath, content, commitMessage);
    } catch (e) {
      console.warn(`[Storage Sync] Background push failed for ${fullPath}:`, e);
    }
  }

  /**
   * Pull all data from GitHub into LocalStorage (Full Sync)
   */
  async pullAllFromGitHub(): Promise<{ success: boolean; message: string }> {
    const client = this.getGitHubClient();
    if (!client) {
      return { success: false, message: 'Chưa cấu hình thông tin GitHub Token hoặc Repository.' };
    }
    const config = this.getGitHubConfig();
    const basePath = config.basePath || 'company-data';

    try {
      let pulledCount = 0;

      // 1. Users
      const usersFile = await client.getFile(`${basePath}/settings/users.json`);
      if (usersFile?.content) {
        try {
          const parsed = JSON.parse(usersFile.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      // 2. Departments
      const deptsFile = await client.getFile(`${basePath}/settings/departments.json`);
      if (deptsFile?.content) {
        try {
          const parsed = JSON.parse(deptsFile.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      // 3. Web Integrations
      const webFile = await client.getFile(`${basePath}/settings/web_integrations.json`);
      if (webFile?.content) {
        try {
          const parsed = JSON.parse(webFile.content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(STORAGE_KEYS.WEB_INTEGRATIONS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      // 4. Announcements
      const annFile = await client.getFile(`${basePath}/announcements/announcements.json`);
      if (annFile?.content) {
        try {
          const parsed = JSON.parse(annFile.content);
          if (Array.isArray(parsed)) {
            localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      // 5. Dynamic Forms
      const formsFile = await client.getFile(`${basePath}/forms/forms.json`);
      if (formsFile?.content) {
        try {
          const parsed = JSON.parse(formsFile.content);
          if (Array.isArray(parsed)) {
            localStorage.setItem(STORAGE_KEYS.DYNAMIC_FORMS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      // 6. Plugins
      const pluginsFile = await client.getFile(`${basePath}/settings/plugins.json`);
      if (pluginsFile?.content) {
        try {
          const parsed = JSON.parse(pluginsFile.content);
          if (Array.isArray(parsed)) {
            localStorage.setItem(STORAGE_KEYS.PLUGINS, JSON.stringify(parsed));
            pulledCount++;
          }
        } catch {}
      }

      return {
        success: true,
        message: `Đã đồng bộ thành công dữ liệu từ GitHub (${pulledCount} tệp cấu hình chính).`,
      };
    } catch (err: any) {
      return { success: false, message: `Lỗi kéo dữ liệu từ GitHub: ${err.message}` };
    }
  }

  /**
   * Push all current local data up to GitHub repository (Seed/Initial Push)
   */
  async pushAllToGitHub(): Promise<{ success: boolean; message: string }> {
    const client = this.getGitHubClient();
    if (!client) {
      return { success: false, message: 'Chưa cấu hình thông tin GitHub Token hoặc Repository.' };
    }
    const config = this.getGitHubConfig();
    const basePath = config.basePath || 'company-data';

    try {
      await client.saveFile(
        `${basePath}/settings/users.json`,
        JSON.stringify(this.getUsers(), null, 2),
        'Init/Update users directory'
      );
      await client.saveFile(
        `${basePath}/settings/departments.json`,
        JSON.stringify(this.getDepartments(), null, 2),
        'Init/Update departments directory'
      );
      await client.saveFile(
        `${basePath}/settings/web_integrations.json`,
        JSON.stringify(this.getWebIntegrations(), null, 2),
        'Init/Update web integrations list'
      );
      await client.saveFile(
        `${basePath}/announcements/announcements.json`,
        JSON.stringify(this.getAnnouncements(), null, 2),
        'Init/Update announcements'
      );
      await client.saveFile(
        `${basePath}/forms/forms.json`,
        JSON.stringify(this.getDynamicForms(), null, 2),
        'Init/Update forms schemas'
      );
      await client.saveFile(
        `${basePath}/settings/plugins.json`,
        JSON.stringify(this.getPlugins(), null, 2),
        'Init/Update plugins state'
      );

      return {
        success: true,
        message: `Đã đẩy toàn bộ dữ liệu cấu trúc (${basePath}/...) lên GitHub Repository thành công!`,
      };
    } catch (err: any) {
      return { success: false, message: `Lỗi đẩy dữ liệu lên GitHub: ${err.message}` };
    }
  }

  /**
   * Automatically fetch latest server data and populate localStorage
   * (Solves multi-browser and multi-computer synchronization)
   */
  async syncFromServer(): Promise<boolean> {
    if (!this.isClient()) return false;
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (!res.ok) return false;
      const json = await res.json();
      if (!json.success || !json.data) return false;

      const {
        users,
        departments,
        positions,
        webIntegrations,
        leaveRequests,
        gatePasses,
        attendanceConfirms,
        emailConfig,
        githubConfig,
      } = json.data;

      if (Array.isArray(users) && users.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      if (Array.isArray(departments) && departments.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
      }
      if (Array.isArray(positions) && positions.length > 0) {
        localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions));
      }
      if (Array.isArray(webIntegrations) && webIntegrations.length > 0) {
        localStorage.setItem(STORAGE_KEYS.WEB_INTEGRATIONS, JSON.stringify(webIntegrations));
      }
      if (Array.isArray(leaveRequests)) {
        const local = this.getLeaveRequests();
        const map = new Map<string, LeaveRequest>();
        local.forEach((r) => map.set(r.id, r));
        leaveRequests.forEach((r) => map.set(r.id, r));
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(Array.from(map.values())));
      }
      if (Array.isArray(gatePasses)) {
        const local = this.getGatePasses();
        const map = new Map<string, GatePass>();
        local.forEach((p) => map.set(p.id, p));
        gatePasses.forEach((p) => map.set(p.id, p));
        localStorage.setItem(STORAGE_KEYS.GATE_PASSES, JSON.stringify(Array.from(map.values())));
      }
      if (Array.isArray(attendanceConfirms)) {
        const local = this.getAttendanceConfirms();
        const map = new Map<string, AttendanceConfirm>();
        local.forEach((a) => map.set(a.id, a));
        attendanceConfirms.forEach((a) => map.set(a.id, a));
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIRMS, JSON.stringify(Array.from(map.values())));
      }
      if (emailConfig && emailConfig.googleScriptUrl) {
        localStorage.setItem(STORAGE_KEYS.EMAIL_CONFIG, JSON.stringify(emailConfig));
      }
      if (githubConfig && githubConfig.token) {
        localStorage.setItem(STORAGE_KEYS.GITHUB_CONFIG, JSON.stringify(githubConfig));
      }

      return true;
    } catch (e) {
      console.warn('syncFromServer error:', e);
      return false;
    }
  }
}

export const storage = new StorageService();
