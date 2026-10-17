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
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
  Check,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { GitHubService } from '@/lib/github-api';

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
  const [testEmailTo, setTestEmailTo] = useState<string>('it@longkhai.com.vn');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveEmailResult, setSaveEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Sync email config from server on mount
  useEffect(() => {
    fetch('/api/email-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setEmailConfig((prev) => ({
            ...prev,
            ...data.config,
            // Keep local password if server masked it
            smtpPassword: data.config.smtpPassword === '********' ? prev.smtpPassword : data.config.smtpPassword,
          }));
        }
      })
      .catch((err) => console.warn('Không thể đọc email-config từ máy chủ:', err));
  }, []);

  // Save GitHub Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveGitHubConfig(config);
    setTestResult({ success: true, message: 'Đã lưu cấu hình kết nối GitHub thành công!' });
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

  // Save Email Config
  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    setSaveEmailResult(null);

    try {
      // 1. Save in local storage & sync github
      storage.saveEmailConfig(emailConfig, {
        id: currentUser?.id || 'ADMIN',
        name: currentUser?.name || 'Quản trị viên',
      });

      // 2. Save on server via /api/email-config
      try {
        const res = await fetch('/api/email-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailConfig),
        });
        await res.json();
      } catch (apiErr) {
        console.warn('Lỗi ghi server config (chạy chế độ serverless fallback):', apiErr);
      }

      setSaveEmailResult({
        success: true,
        message: 'Đã lưu cấu hình gửi Email thành công!',
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

  // Send Test Email
  const handleSendTestEmail = async () => {
    const to = testEmailTo.trim();
    if (!to) {
      setEmailTestResult({ success: false, message: 'Vui lòng nhập địa chỉ email nhận kiểm tra!' });
      return;
    }

    setIsSendingTest(true);
    setEmailTestResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: to,
          subject: '[Long Khai Portal] Kiểm tra kết nối gửi Email thành công!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #0284c7; margin-top: 0;">✓ Thử nghiệm kết nối Email thành công!</h2>
              <p>Xin chào <b>${to}</b>,</p>
              <p>Email này được gửi thử nghiệm từ <b>Cổng Thông Tin Long Khai Portal</b> nhằm xác minh cấu hình máy chủ gửi email phê duyệt.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}<br />Máy chủ gửi: ${emailConfig.provider === 'resend' ? 'Resend API' : emailConfig.smtpHost || 'Office 365'}</p>
            </div>
          `,
          emailConfig,
          isTest: true,
        }),
      });

      const data = await res.json();
      setEmailTestResult({
        success: data.success === true,
        message: data.message || (data.success ? 'Đã gửi email kiểm tra thành công!' : 'Gửi email thất bại.'),
      });
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.message || 'Lỗi kết nối máy chủ gửi mail.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Quick Preset Helper
  const applyPreset = (preset: 'o365' | 'gmail' | 'resend') => {
    if (preset === 'o365') {
      setEmailConfig((prev) => ({
        ...prev,
        provider: 'smtp',
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: false,
        senderName: 'Cổng Thông Tin Long Khai',
        senderEmail: prev.smtpUser || 'no-reply@longkhai.com.vn',
      }));
    } else if (preset === 'gmail') {
      setEmailConfig((prev) => ({
        ...prev,
        provider: 'gmail',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        senderName: 'Cổng Thông Tin Long Khai',
        senderEmail: prev.smtpUser || '',
      }));
    } else if (preset === 'resend') {
      setEmailConfig((prev) => ({
        ...prev,
        provider: 'resend',
        senderName: 'Cổng Thông Tin Long Khai',
        senderEmail: 'onboarding@resend.dev',
      }));
    }
  };

  const isEmailConfigured = Boolean(
    (emailConfig.smtpUser && emailConfig.smtpPassword) || emailConfig.resendApiKey
  );

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
          Cấu hình máy chủ gửi Email thông báo phê duyệt (Microsoft 365, Gmail, Resend) và cơ sở dữ liệu GitHub
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

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Chọn nhanh nhà cung cấp Email:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('o365')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      emailConfig.provider === 'smtp' && emailConfig.smtpHost?.includes('office365')
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Microsoft 365</span>
                    </div>
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                      @longkhai.com.vn (Port 587)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      emailConfig.provider === 'gmail'
                        ? 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>Google Gmail</span>
                    </div>
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                      SMTP (Port 465 / SSL)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('resend')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      emailConfig.provider === 'resend'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Resend API (Khuyên dùng)</span>
                    </div>
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                      Miễn phí 3.000 mail/tháng
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveEmailConfig} className="space-y-4 text-xs">
                {emailConfig.provider !== 'resend' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Máy chủ SMTP Host: *
                        </label>
                        <input
                          type="text"
                          required
                          value={emailConfig.smtpHost || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value.trim() })}
                          placeholder="smtp.office365.com hoặc smtp.gmail.com"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Cổng SMTP Port: *
                        </label>
                        <input
                          type="number"
                          required
                          value={emailConfig.smtpPort || 587}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, smtpPort: Number(e.target.value) })
                          }
                          placeholder="587 hoặc 465"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tài khoản gửi Email (Username): *
                        </label>
                        <input
                          type="text"
                          required
                          value={emailConfig.smtpUser || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value.trim() })}
                          placeholder="VD: it@longkhai.com.vn"
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Mật khẩu (hoặc Mật khẩu ứng dụng): *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={emailConfig.smtpPassword || ''}
                            onChange={(e) =>
                              setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })
                            }
                            placeholder="Mật khẩu tài khoản email"
                            className="w-full p-2 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={emailConfig.smtpSecure || false}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpSecure: e.target.checked })}
                        className="rounded text-blue-600"
                      />
                      <label htmlFor="smtpSecure" className="text-slate-600 dark:text-slate-400">
                        Sử dụng kết nối bảo mật SSL trực tiếp (Chỉ chọn khi dùng cổng 465)
                      </label>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Resend API Key: *
                    </label>
                    <input
                      type="password"
                      required
                      value={emailConfig.resendApiKey || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value.trim() })}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Lấy API Key miễn phí tại <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">resend.com</a> (miễn phí 3.000 email/tháng, gửi qua giao thức HTTPS cổng 443 không lo bị chặn trên Vercel).
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
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
                      Địa chỉ Email gửi (From Email):
                    </label>
                    <input
                      type="email"
                      value={emailConfig.senderEmail || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value.trim() })}
                      placeholder={emailConfig.provider === 'resend' ? 'onboarding@resend.dev' : 'it@longkhai.com.vn'}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {emailConfig.provider === 'resend' ? (
                        <span>
                          * Với Resend miễn phí chưa xác minh Domain: Bắt buộc để <b>onboarding@resend.dev</b> (Resend giới hạn chỉ gửi được về email đăng ký tài khoản Resend). Nếu đã xác minh Domain công ty trên Resend, bạn có thể điền <i>portal@longkhai.com.vn</i>.
                        </span>
                      ) : emailConfig.provider === 'gmail' ? (
                        <span>
                          * Điền chính địa chỉ Gmail của bạn trùng với tài khoản gửi (VD: <b>vitex.dng@gmail.com</b>).
                        </span>
                      ) : (
                        <span>
                          * Điền chính địa chỉ email Microsoft 365 công ty trùng với tài khoản gửi (VD: <b>it@longkhai.com.vn</b>).
                        </span>
                      )}
                    </p>
                  </div>
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    Được nhúng vào các nút "Phê duyệt" và "Từ chối" trong email để Trưởng bộ phận bấm duyệt đơn trực tuyến.
                  </p>
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
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                  >
                    {isSavingEmail ? 'Đang lưu...' : 'Lưu cấu hình Email'}
                  </button>
                </div>
              </form>
            </div>

            {/* Test Connection Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Gửi Thử Nghiệm Kiểm Tra Kết Nối (Test Email)</span>
              </div>
              <p className="text-xs text-slate-500">
                Gửi một email kiểm tra tới hộp thư để đảm bảo máy chủ kết nối thông suốt và nhận diện được Trưởng bộ phận.
              </p>

              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  placeholder="Nhập email nhận kiểm tra (VD: it@longkhai.com.vn)"
                  className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Đang gửi...' : 'Gửi thử ngay'}</span>
                </button>
              </div>

              {emailTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    emailTestResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {emailTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{emailTestResult.message}</p>
                    {emailTestResult.success && (
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Hệ thống đã xác thực và chuyển tiếp thành công đến hộp thư <b>{testEmailTo}</b>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guide & Troubleshooting (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Hướng dẫn cấu hình gửi Email</span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 space-y-1.5">
                  <span className="font-bold text-blue-800 dark:text-blue-300 block">
                    1. Cấu hình Microsoft 365 (@longkhai.com.vn):
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Host: <code>smtp.office365.com</code> | Port: <code>587</code></li>
                    <li>Tài khoản: Email tài khoản Microsoft 365 của công ty.</li>
                    <li>Mật khẩu: Mật khẩu hộp thư hoặc App Password (Mật khẩu ứng dụng) nếu tài khoản có bật xác thực 2 bước (MFA).</li>
                    <li>Yêu cầu quản trị viên Microsoft 365 bật tính năng <b>Authenticated SMTP (SMTP AUTH)</b> cho hộp thư gửi.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    2. Giải pháp Resend API (Khuyên dùng cho Vercel):
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Vercel chặn cổng 25, do đó gửi qua API HTTPS cổng 443 là giải pháp tin cậy nhất 100%.</li>
                    <li>Đăng ký tài khoản miễn phí tại <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">resend.com</a>.</li>
                    <li>Tạo API Key và dán vào ô Resend API Key phía bên trái.</li>
                    <li>Gói miễn phí cho phép gửi 3.000 email/tháng hoàn toàn tự động.</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    3. Cơ chế dự phòng gửi qua Outlook (Mailto):
                  </span>
                  <p className="text-[11px]">
                    Trong trường hợp máy chủ chưa kịp cấu hình tài khoản gửi email, hệ thống tự động cung cấp nút <b>"Mở Email (Outlook)"</b> cho nhân viên khi nộp đơn để gửi ngay toàn bộ thông tin và link duyệt đến Trưởng bộ phận trong 1 giây mà không bị gián đoạn công việc.
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
