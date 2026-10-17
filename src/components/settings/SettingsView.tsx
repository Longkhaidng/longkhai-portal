'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { GitHubConfig, AuditLog } from '@/types/github';
import {
  Settings,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Shield,
  Key,
  FolderGit2,
  History,
  Mail,
  Send,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { GitHubService } from '@/lib/github-api';
import { EmailConfig } from '@/types/email';

export function SettingsView() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<GitHubConfig>(() => storage.getGitHubConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());

  // Email Config State
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => storage.getEmailConfig());
  const [emailSaveMsg, setEmailSaveMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; text: string } | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveGitHubConfig(config);
    setTestResult({ success: true, message: 'Đã lưu cấu hình kết nối GitHub thành công!' });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const client = new GitHubService(config);
      const res = await client.testConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Lỗi kiểm tra kết nối' });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushAllToGitHub = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await storage.pushAllToGitHub();
      setSyncMessage({ success: res.success, text: res.message });
      setAuditLogs(storage.getAuditLogs());
    } catch (err: any) {
      setSyncMessage({ success: false, text: err.message || 'Lỗi đẩy dữ liệu lên GitHub' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullAllFromGitHub = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await storage.pullAllFromGitHub();
      setSyncMessage({ success: res.success, text: res.message });
      setAuditLogs(storage.getAuditLogs());
    } catch (err: any) {
      setSyncMessage({ success: false, text: err.message || 'Lỗi kéo dữ liệu từ GitHub' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveEmailConfig(emailConfig, {
      id: currentUser?.id || 'ADMIN',
      name: currentUser?.name || 'Quản trị viên',
    });
    setEmailSaveMsg({ success: true, text: 'Đã lưu cấu hình dịch vụ gửi Email thông báo thành công!' });
    setTimeout(() => setEmailSaveMsg(null), 4000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) {
      alert('Vui lòng nhập địa chỉ email nhận thư thử nghiệm!');
      return;
    }
    setIsSendingTest(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmailTo.trim(),
          subject: '[Long Khai Portal] Thư kiểm tra kết nối hệ thống gửi Email',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #0284c7;">Xin chào Quản trị viên,</h2>
              <p>Đây là email kiểm tra kết nối từ hệ thống <strong>Cổng Thông Tin Long Khai Portal</strong>.</p>
              <p>✓ Cấu hình máy chủ gửi email của bạn đã hoạt động thành công!</p>
            </div>
          `,
          emailConfig,
        }),
      });
      const data = await res.json();
      setTestEmailResult({ success: data.success, text: data.message });
    } catch (err: any) {
      setTestEmailResult({ success: false, text: `Lỗi kết nối: ${err.message}` });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Cài Đặt Hệ Thống & GitHub Database Layer
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cấu hình kết nối kho lưu trữ dữ liệu JSON trên GitHub Repo và theo dõi nhật ký kiểm toán Audit Log
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GitHub Database Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <FolderGit2 className="w-4 h-4 text-blue-600" />
              <span>Cấu hình GitHub Repository Data API</span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GitHub Owner / Tổ chức:
                  </label>
                  <input
                    type="text"
                    required
                    value={config.owner}
                    onChange={(e) => setConfig({ ...config, owner: e.target.value.trim() })}
                    placeholder="VD: longkhai-corp hoặc tên user"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên Repository:
                  </label>
                  <input
                    type="text"
                    required
                    value={config.repo}
                    onChange={(e) => setConfig({ ...config, repo: e.target.value.trim() })}
                    placeholder="VD: longkhai-portal-data"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nhánh Git (Branch):
                  </label>
                  <input
                    type="text"
                    required
                    value={config.branch}
                    onChange={(e) => setConfig({ ...config, branch: e.target.value.trim() })}
                    placeholder="main"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thư mục gốc dữ liệu (Base Path):
                  </label>
                  <input
                    type="text"
                    required
                    value={config.basePath}
                    onChange={(e) => setConfig({ ...config, basePath: e.target.value.trim() })}
                    placeholder="company-data"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Personal Access Token (PAT):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={config.token}
                    onChange={(e) => setConfig({ ...config, token: e.target.value.trim() })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx hoặc github_pat_xxxx"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Token cần có quyền <b>repo</b> (hoặc Contents: Read and write) để đọc ghi các file JSON.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors"
                >
                  {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>

          {/* Sync Actions Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>Đồng Bộ Hai Chiều Với GitHub Data</span>
            </div>
            <p className="text-xs text-slate-500">
              Chủ động đồng bộ toàn bộ file cấu hình JSON (`users.json`, `devices.json`, `forms.json`...) giữa trình duyệt và GitHub Repo.
            </p>

            {syncMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  syncMessage.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {syncMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{syncMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handlePushAllToGitHub}
                disabled={isSyncing}
                className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Đẩy toàn bộ dữ liệu lên GitHub (Push)</span>
              </button>

              <button
                type="button"
                onClick={handlePullAllFromGitHub}
                disabled={isSyncing}
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <DownloadCloud className="w-5 h-5" />
                <span>Kéo dữ liệu từ GitHub về máy (Pull)</span>
              </button>
            </div>
          </div>

          {/* Email Notification & Approval Settings Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Cấu hình Gửi Email Phê Duyệt Tự Động (SMTP / Gmail)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                Phê duyệt qua Email
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Khi nhân viên tạo đơn nghỉ phép hoặc phiếu ra vào cổng, hệ thống sẽ tự động gửi email thông báo kèm 2 nút <b>[Duyệt đơn]</b> và <b>[Từ chối đơn]</b> đến Email của Trưởng bộ phận.
            </p>

            {emailSaveMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{emailSaveMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmailConfig} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Máy chủ SMTP (SMTP Host):
                  </label>
                  <input
                    type="text"
                    value={emailConfig.smtpHost || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value.trim() })}
                    placeholder="VD: smtp.gmail.com"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cổng SMTP (Port):
                  </label>
                  <input
                    type="number"
                    value={emailConfig.smtpPort || 465}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })}
                    placeholder="465 hoặc 587"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tài khoản gửi (Email / User):
                  </label>
                  <input
                    type="email"
                    value={emailConfig.smtpUser || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value.trim() })}
                    placeholder="portal.longkhai@gmail.com..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu ứng dụng (App Password):
                  </label>
                  <input
                    type="password"
                    value={emailConfig.smtpPassword || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtpPassword: e.target.value.trim() })}
                    placeholder="Mật khẩu ứng dụng 16 ký tự của Gmail..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên hiển thị người gửi:
                  </label>
                  <input
                    type="text"
                    value={emailConfig.senderName || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    placeholder="Cổng Thông Tin Long Khai"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa chỉ Website Cổng Thông Tin (Base URL):
                  </label>
                  <input
                    type="text"
                    value={emailConfig.portalBaseUrl || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, portalBaseUrl: e.target.value.trim() })}
                    placeholder="VD: https://longkhai-portal.vercel.app"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  Lưu cấu hình Email
                </button>
              </div>
            </form>

            {/* Test Email Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Kiểm tra gửi email thử nghiệm:
              </span>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="Nhập email của bạn để nhận thử..."
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Đang gửi...' : 'Gửi thử'}</span>
                </button>
              </div>

              {testEmailResult && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    testEmailResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testEmailResult.text}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audit Log / Commit History (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <History className="w-4 h-4 text-purple-600" />
              <span>Nhật ký kiểm toán (Audit Trail)</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              {auditLogs.length} sự kiện
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                Chưa có hoạt động nào được ghi nhận.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                      {log.userName} ({log.userId})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono">
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700">
                      {log.module}
                    </span>
                    <span>&bull; {log.action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
