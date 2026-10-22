'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { GitHubConfig, AuditLog } from '@/types/github';
import { EmailConfig } from '@/types/email';
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
  ExternalLink,
  Info,
  Check,
  Copy,
  Code,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { GitHubService } from '@/lib/github-api';

const GOOGLE_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.toEmail || data.to;
    var subject = data.subject || '[Long Khải Portal] Yêu cầu phê duyệt';
    var html = data.html || data.htmlBody || '';
    var senderName = data.senderName || 'Cổng Thông Tin Long Khải';

    if (!to) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: 'Thiếu email người nhận' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    GmailApp.sendEmail(to, subject, '', {
      name: senderName,
      htmlBody: html
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: 'Đã gửi email thành công qua Google Apps Script tới ' + to 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function SettingsView() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'email' | 'github'>('email');

  // GitHub & Audit state
  const [config, setConfig] = useState<GitHubConfig>(() => storage.getGitHubConfig());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());

  // Email Config state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => storage.getEmailConfig());
  const [saveEmailResult, setSaveEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Sync email config and github config from server on mount
  useEffect(() => {
    fetch('/api/email-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setEmailConfig((prev) => ({
            ...prev,
            ...data.config,
            provider: 'google_relay',
          }));
        }
      })
      .catch((err) => console.warn('Không thể đọc email-config từ máy chủ:', err));

    fetch('/api/github-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config && data.config.token) {
          setConfig((prev) => ({ ...prev, ...data.config }));
          storage.saveGitHubConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  // Save GitHub Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveGitHubConfig(config);
    try {
      await fetch('/api/github-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
    } catch {}
    setTestResult({ success: true, message: 'Đã lưu cấu hình kết nối GitHub thành công trên máy chủ và trình duyệt!' });
  };

  // Test GitHub Connection
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

  // Save Email Config (Solely Google Apps Script Relay)
  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setSaveEmailResult(null);

    const fullConfig: EmailConfig = {
      ...emailConfig,
      provider: 'google_relay',
      isEnabled: true,
    };

    try {
      // 1. Save in local storage & sync github
      storage.saveEmailConfig(fullConfig, {
        id: currentUser?.id || 'ADMIN',
        name: currentUser?.name || 'Quản trị viên',
      });

      // 2. Save on server via /api/email-config
      try {
        await fetch('/api/email-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullConfig),
        });
      } catch (apiErr) {
        console.warn('Lỗi ghi server config:', apiErr);
      }

      setSaveEmailResult({
        success: true,
        message: 'Đã lưu cấu hình gửi Email Google Relay thành công!',
      });
    } catch (err: any) {
      setSaveEmailResult({
        success: false,
        message: err.message || 'Lỗi kết nối lưu cấu hình email.',
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const isEmailConfigured = Boolean(emailConfig.googleScriptUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Cài Đặt Hệ Thống & Cấu Hình Email Phê Duyệt
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cấu hình trung chuyển gửi Email thông báo phê duyệt (Google Web App Relay, Microsoft 365, Resend) và cơ sở dữ liệu GitHub
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('email')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Cấu hình Gửi Email Thông Báo Phê Duyệt</span>
          {isEmailConfigured ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã có cấu hình gửi" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Chưa kích hoạt tài khoản gửi" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('github')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'github'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>GitHub Database & Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: EMAIL CONFIGURATION */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Cấu hình Dịch vụ Gửi Email Phê Duyệt</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isEmailConfigured
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isEmailConfigured ? '✓ Đã sẵn sàng gửi' : '⚠ Chưa cấu hình tài khoản'}
                </span>
              </div>

              {/* Method Banner - Solely Google Relay */}
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <span>Phương thức: Google Apps Script Web App Relay</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold">
                        Khuyên dùng (100% Miễn phí)
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Gửi email thông báo phê duyệt qua giao thức HTTPS cổng 443 — Hoạt động bền vững, không bao giờ bị chặn cổng SMTP, gửi trực tiếp từ máy chủ Gmail của Google.
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveEmailConfig} className="space-y-4 text-xs">
                {/* GOOGLE APPS SCRIPT RELAY CONFIGURATION */}
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-900 dark:text-white">
                        Google Apps Script Web App URL: *
                      </label>
                      <a
                        href="https://script.new"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Mở Google Apps Script (script.new)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="url"
                      required
                      value={emailConfig.googleScriptUrl || ''}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, googleScriptUrl: e.target.value.trim() })
                      }
                      placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-emerald-400 dark:border-emerald-600 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Dán đường dẫn Web App đã triển khai từ Google Apps Script (kết thúc bằng <code>/exec</code>).
                    </p>
                  </div>

                  {/* Script Code Box with Copy */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mã nguồn Google Apps Script (Code.gs):</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        {copiedScript ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Đã sao chép!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép mã</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
                      {GOOGLE_SCRIPT_TEMPLATE}
                    </pre>
                  </div>

                  {/* 3 Step Deployment Instructions */}
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-emerald-800 dark:text-emerald-400">
                      3 bước triển khai nhanh trong 2 phút:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
                      <li>
                        Bấm nút <b>"Mở Google Apps Script (script.new)"</b> ở trên (đăng nhập bằng Gmail hoặc Google Workspace).
                      </li>
                      <li>
                        Bấm <b>"Sao chép mã"</b> và dán toàn bộ đè lên file <code>Code.gs</code> rồi bấm biểu tượng Save (Lưu).
                      </li>
                      <li>
                        Bấm nút <b>Deploy (Triển khai)</b> &gt; <b>New deployment (Tùy chọn triển khai mới)</b> &gt; chọn biểu tượng bánh răng chọn <b>Web app</b>:
                        <ul className="list-disc pl-4 mt-0.5 text-slate-600 dark:text-slate-400">
                          <li>Execute as: <b>Me</b> (Tôi)</li>
                          <li>Who has access: <b>Anyone</b> (Bất kỳ ai)</li>
                        </ul>
                        Bấm <b>Deploy</b>, cấp quyền cho script và sao chép <b>Web app URL</b> dán vào ô phía trên!
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tên hiển thị người gửi:
                    </label>
                    <input
                      type="text"
                      value={emailConfig.senderName || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                      placeholder="Cổng Thông Tin Long Khải"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Đường dẫn Cổng Thông Tin (Portal Base URL):
                    </label>
                    <input
                      type="url"
                      value={emailConfig.portalBaseUrl || 'https://longkhai-portal.vercel.app'}
                      onChange={(e) => setEmailConfig({ ...emailConfig, portalBaseUrl: e.target.value.trim() })}
                      placeholder="https://longkhai-portal.vercel.app"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                {saveEmailResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      saveEmailResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {saveEmailResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{saveEmailResult.message}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={isSavingEmail}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isSavingEmail ? 'Đang lưu...' : 'Lưu cấu hình Email Google Relay'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Guide & Troubleshooting (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Hướng dẫn & Lợi ích Google Relay</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Ưu điểm vượt trội của Google Web App:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-emerald-900 dark:text-emerald-200">
                    <li><b>Gửi qua HTTPS cổng 443:</b> Hoàn toàn vượt qua mọi giới hạn tường lửa hay quy định chặn cổng SMTP 587/465 của các hạ tầng điện toán đám mây (như Vercel, Netlify).</li>
                    <li><b>Không cần xác minh DNS tên miền:</b> Không yêu cầu phải cấu hình bản ghi SPF, DKIM phức tạp trên hosting công ty như Resend hay SendGrid.</li>
                    <li><b>Hỗ trợ mọi hòm thư:</b> Gửi thành công tới cả hộp thư công ty (<code>@longkhai.com.vn</code>) lẫn hộp thư cá nhân (Gmail, Outlook, Yahoo...).</li>
                    <li><b>Miễn phí vĩnh viễn:</b> Hạn mức mặc định của Google cấp tới 100 email/ngày (với Gmail cá nhân) hoặc 1.500 email/ngày (với Google Workspace).</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Cơ chế dự phòng gửi qua Outlook (Mailto):
                  </span>
                  <p className="text-[11px]">
                    Khi máy chủ chưa kịp cấu hình đường dẫn Web App, hệ thống tự động cung cấp nút <b>"Mở Email (Outlook)"</b> cho nhân viên khi nộp đơn để gửi ngay toàn bộ thông tin và link duyệt đến Trưởng bộ phận trong 1 giây mà không bị gián đoạn công việc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GITHUB DATABASE CONFIGURATION & AUDIT TRAIL */}
      {activeTab === 'github' && (
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
      )}
    </div>
  );
}
