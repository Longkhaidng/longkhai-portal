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
  FileSpreadsheet,
  HardDrive,
  Trash2,
  Clock,
  AlertOctagon,
  FileText,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { GitHubService } from '@/lib/github-api';
import { exportDocumentsBackupToExcel } from '@/lib/excel';
import { ToastContainer, useToast } from '@/components/common/Toast';

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

function downloadJsonFile(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getBackupFilename(ext: 'json' | 'xlsx', prefix = 'LongKhai_Full_Backup') {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${prefix}_${yyyy}${MM}${dd}_${hh}${mm}.${ext}`;
}

export function SettingsView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [activeTab, setActiveTab] = useState<'backup' | 'email' | 'github'>('backup');

  // Backup & Data management state
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [backupInterval, setBackupInterval] = useState<number>(7);
  const [isDue, setIsDue] = useState<boolean>(false);

  const [leaveCount, setLeaveCount] = useState<number>(0);
  const [gatePassCount, setGatePassCount] = useState<number>(0);
  const [attCount, setAttCount] = useState<number>(0);

  // Clear data state
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearTargets, setClearTargets] = useState<{
    gate_pass: boolean;
    leave_request: boolean;
    attendance: boolean;
  }>({
    gate_pass: true,
    leave_request: true,
    attendance: true,
  });
  const [confirmDeleteText, setConfirmDeleteText] = useState<string>('');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Restore data state
  const [restorePreview, setRestorePreview] = useState<{
    summary: any;
    rawBackup: any;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

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

  const refreshCounts = () => {
    setLeaveCount(storage.getLeaveRequests().length);
    setGatePassCount(storage.getGatePasses().length);
    setAttCount(storage.getAttendanceConfirms().length);
    setLastBackupDate(storage.getLastBackupDate());
    setBackupInterval(storage.getBackupIntervalDays());
    setIsDue(storage.isBackupDue());
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const handleDownloadJsonBackup = () => {
    try {
      const backup = storage.exportFullBackupData();
      const filename = getBackupFilename('json', 'LongKhai_Full_Backup');
      downloadJsonFile(backup, filename);
      refreshCounts();
      showToast({
        type: 'success',
        title: 'Sao lưu dữ liệu thành công',
        message: `Đã lưu tệp ${filename} vào máy tính!`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi sao lưu',
        message: err.message || 'Không thể xuất tệp sao lưu JSON.',
      });
    }
  };

  const handleDownloadExcelBackup = async () => {
    try {
      const leaves = storage.getLeaveRequests();
      const gatePasses = storage.getGatePasses();
      const atts = storage.getAttendanceConfirms();
      const filename = getBackupFilename('xlsx', 'LongKhai_TongHop_Phieu');
      await exportDocumentsBackupToExcel(leaves, gatePasses, atts, filename);
      storage.setLastBackupDate();
      refreshCounts();
      showToast({
        type: 'success',
        title: 'Xuất Excel thành công',
        message: `Đã lưu bảng tính ${filename} vào máy tính!`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi xuất Excel',
        message: err.message || 'Không thể xuất tệp Excel.',
      });
    }
  };

  const handleFileSelectedForRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || !parsed.data) {
          showToast({
            type: 'error',
            title: 'Tệp sao lưu không hợp lệ',
            message: 'Tệp JSON không đúng định dạng chuẩn của hệ thống Long Khải Portal.',
          });
          return;
        }
        setRestorePreview({
          summary: parsed.summary || {
            leaveRequests: parsed.data.leaveRequests?.length || 0,
            gatePasses: parsed.data.gatePasses?.length || 0,
            attendanceConfirms: parsed.data.attendanceConfirms?.length || 0,
            users: parsed.data.users?.length || 0,
            departments: parsed.data.departments?.length || 0,
          },
          rawBackup: parsed,
        });
      } catch {
        showToast({
          type: 'error',
          title: 'Lỗi đọc tệp',
          message: 'Không thể giải mã dữ liệu JSON từ tệp tải lên.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview?.rawBackup) return;
    setIsRestoring(true);
    try {
      const res = await storage.restoreFullBackupData(restorePreview.rawBackup, {
        id: currentUser?.id || 'ADMIN',
        name: currentUser?.name || 'Quản trị viên',
      });
      if (res.success) {
        showToast({
          type: 'success',
          title: 'Khôi phục dữ liệu thành công',
          message: res.message,
        });
        setRestorePreview(null);
        refreshCounts();
      } else {
        showToast({
          type: 'error',
          title: 'Lỗi khôi phục',
          message: res.message,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi khôi phục',
        message: err.message || 'Đã xảy ra sự cố khi nạp lại dữ liệu.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteClear = async () => {
    if (confirmDeleteText.trim().toUpperCase() !== 'XÓA') {
      showToast({
        type: 'warning',
        title: 'Chưa xác nhận thao tác',
        message: 'Vui lòng gõ chính xác từ "XÓA" để thực hiện.',
      });
      return;
    }

    const selectedTargets: ('gate_pass' | 'leave_request' | 'attendance')[] = [];
    if (clearTargets.gate_pass) selectedTargets.push('gate_pass');
    if (clearTargets.leave_request) selectedTargets.push('leave_request');
    if (clearTargets.attendance) selectedTargets.push('attendance');

    if (selectedTargets.length === 0) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn dữ liệu cần xóa',
        message: 'Vui lòng tích chọn ít nhất 1 loại phiếu muốn xóa sạch.',
      });
      return;
    }

    setIsClearing(true);
    try {
      const res = await storage.clearAllDocuments(selectedTargets, {
        id: currentUser?.id || 'ADMIN',
        name: currentUser?.name || 'Quản trị viên',
      });

      if (res.success) {
        showToast({
          type: 'success',
          title: 'Đã xóa dữ liệu thành công',
          message: res.message,
        });
        setShowClearModal(false);
        setConfirmDeleteText('');
        refreshCounts();
      } else {
        showToast({
          type: 'error',
          title: 'Lỗi xóa dữ liệu',
          message: res.message,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi hệ thống',
        message: err.message || 'Không thể hoàn tất việc dọn dẹp dữ liệu.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleChangeBackupInterval = (days: number) => {
    storage.setBackupIntervalDays(days);
    setBackupInterval(days);
    setIsDue(storage.isBackupDue());
    showToast({
      type: 'info',
      title: 'Đã lưu chu kỳ sao lưu',
      message: days === 0 ? 'Đã tắt tính năng nhắc nhở sao lưu.' : `Sẽ nhắc nhở sao lưu sau mỗi ${days} ngày.`,
    });
  };

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
            Cài Đặt Hệ Thống, Sao Lưu & Email Phê Duyệt
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quản lý sao lưu dữ liệu máy tính, dọn dẹp phiếu yêu cầu, cấu hình email phê duyệt và cơ sở dữ liệu GitHub
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Sao Lưu & Quản Lý Dữ Liệu</span>
          {isDue && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Đến hạn sao lưu định kỳ" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
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
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'github'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>GitHub Database & Audit Trail</span>
        </button>
      </div>

      {/* TAB 0: BACKUP & DATA MANAGEMENT */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Phiếu Ra Vào Cổng</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{gatePassCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Dữ liệu lưu tại company-data/gate-pass</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Đơn Xin Nghỉ Phép</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{leaveCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Dữ liệu lưu tại company-data/leave-request</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Phiếu Xác Nhận Công</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{attCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Dữ liệu lưu tại company-data/attendance</p>
            </div>
          </div>

          {/* Backup Reminder Banner (if due or overdue) */}
          {isDue && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Đã đến hạn sao lưu dữ liệu định kỳ!
                </p>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  Lần sao lưu gần nhất: {lastBackupDate ? formatDateTime(lastBackupDate) : 'Chưa có bản sao lưu nào được ghi nhận'}.
                  Chu kỳ nhắc nhở hiện tại là <b>{backupInterval} ngày</b>. Hãy bấm tải bản sao lưu (.json hoặc .xlsx) bên dưới về máy tính để phòng ngừa rủi ro mất dữ liệu.
                </p>
              </div>
            </div>
          )}

          {/* Action Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Backup Actions */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Sao Lưu Dữ Liệu Về Máy Tính
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tải toàn bộ cơ sở dữ liệu về máy tính cá nhân để lưu trữ dự phòng an toàn. Bạn có thể chọn tải tệp dữ liệu kỹ thuật (.JSON) hoặc xuất bảng tính tổng hợp (.XLSX).
              </p>

              {/* Status info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Lần sao lưu gần nhất:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {lastBackupDate ? formatDateTime(lastBackupDate) : 'Chưa từng sao lưu'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 dark:text-slate-400">Chu kỳ nhắc nhở sao lưu:</span>
                  <select
                    value={backupInterval}
                    onChange={(e) => handleChangeBackupInterval(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value={7}>7 ngày (Khuyên dùng)</option>
                    <option value={14}>14 ngày (2 tuần)</option>
                    <option value={30}>30 ngày (1 tháng)</option>
                    <option value={0}>Tắt nhắc nhở</option>
                  </select>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadJsonBackup}
                  className="w-full p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                      <DownloadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        Tải Tệp Sao Lưu Toàn Diện (.JSON)
                      </h4>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                        Đóng gói 100% dữ liệu phiếu, danh mục nhân viên & cấu hình để khôi phục khi cần.
                      </p>
                    </div>
                  </div>
                  <DownloadCloud className="w-4 h-4 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
                </button>

                <button
                  type="button"
                  onClick={handleDownloadExcelBackup}
                  className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-left transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Xuất Toàn Bộ Phiếu Ra File Excel (.XLSX)
                      </h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                        Đa trang tính (3 Sheet: Nghỉ phép, Ra vào cổng, Xác nhận công) xem trực tiếp trên Excel.
                      </p>
                    </div>
                  </div>
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* Card 2: Restore from Backup */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Khôi Phục Dữ Liệu Từ Tệp Sao Lưu
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tải tệp sao lưu <code>.json</code> đã lưu trước đó từ máy tính của bạn lên để khôi phục lại hệ thống. Thao tác này an toàn và có bước xem trước xác nhận số lượng bản ghi trước khi nạp.
              </p>

              <div className="p-4 rounded-xl border border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <label
                    htmlFor="restore-file-input"
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Nhấp để chọn tệp .json từ máy tính</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">Chỉ chấp nhận file .json chuẩn sao lưu từ Long Khải Portal</p>
                </div>
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelectedForRestore}
                  className="hidden"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-300">Lưu ý khi khôi phục:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Toàn bộ phiếu và cấu hình trong tệp sẽ được đồng bộ lại vào hệ thống.</li>
                  <li>Nếu bạn chỉ muốn kiểm tra hoặc xem lại, bạn có thể xem trước nội dung trước khi bấm xác nhận.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DANGER ZONE: Clear Documents */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 border-2 border-rose-200 dark:border-rose-900/50 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-rose-200 dark:border-rose-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Vùng Dọn Dẹp / Xóa Dữ Liệu Phiếu Hiện Tại (Danger Zone)
                </h3>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Dành cho quản trị viên khi cần dọn dẹp sạch sẽ toàn bộ dữ liệu phiếu để bắt đầu kỳ mới
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Chọn các loại phiếu cần xóa sạch:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClearTargets({ gate_pass: true, leave_request: true, attendance: true })}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setClearTargets({ gate_pass: false, leave_request: false, attendance: false })}
                    className="text-[11px] text-slate-500 hover:underline font-semibold cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  clearTargets.gate_pass
                    ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={clearTargets.gate_pass}
                    onChange={(e) => setClearTargets({ ...clearTargets, gate_pass: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <div>Phiếu ra vào cổng</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">({gatePassCount} phiếu)</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  clearTargets.leave_request
                    ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={clearTargets.leave_request}
                    onChange={(e) => setClearTargets({ ...clearTargets, leave_request: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <div>Đơn xin nghỉ phép</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">({leaveCount} đơn)</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                  clearTargets.attendance
                    ? 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={clearTargets.attendance}
                    onChange={(e) => setClearTargets({ ...clearTargets, attendance: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <div>Phiếu xác nhận công</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">({attCount} phiếu)</div>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="leading-relaxed">
                  <b>Cam kết an toàn hệ thống:</b> Thao tác này chỉ xóa dữ liệu các phiếu đã chọn trên cả máy chủ và trình duyệt. Tuyệt đối <b>KHÔNG</b> làm mất danh mục tài khoản nhân viên, phòng ban, chức vụ hay bất kỳ cấu hình nào khác.
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khuyến nghị: Bạn nên bấm <b>"Tải tệp sao lưu (.JSON)"</b> hoặc <b>"Xuất Excel"</b> ở mục trên trước khi tiến hành xóa.
                </p>
                <button
                  type="button"
                  onClick={() => setShowClearModal(true)}
                  disabled={!clearTargets.gate_pass && !clearTargets.leave_request && !clearTargets.attendance}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa sạch dữ liệu đã chọn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* CLEAR CONFIRMATION MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xác nhận xóa sạch dữ liệu phiếu
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  Thao tác này không thể hoàn tác sau khi thực hiện!
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white">Các mục sẽ bị dọn dẹp sạch sẽ:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                {clearTargets.gate_pass && <li>Toàn bộ phiếu ra vào cổng ({gatePassCount} phiếu)</li>}
                {clearTargets.leave_request && <li>Toàn bộ đơn xin nghỉ phép ({leaveCount} đơn)</li>}
                {clearTargets.attendance && <li>Toàn bộ phiếu xác nhận công ({attCount} phiếu)</li>}
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Để xác nhận, vui lòng gõ từ <span className="text-rose-600 font-mono">XÓA</span> vào ô dưới đây:
              </label>
              <input
                type="text"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="Nhập XÓA"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl font-bold text-center text-rose-600 dark:text-rose-400 outline-none focus:ring-2 focus:ring-rose-500 uppercase"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setConfirmDeleteText('');
                }}
                disabled={isClearing}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={confirmDeleteText.trim().toUpperCase() !== 'XÓA' || isClearing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE PREVIEW MODAL */}
      {restorePreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Xem trước dữ liệu tệp sao lưu
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ngày tạo: {restorePreview.rawBackup.exportedAt ? formatDateTime(restorePreview.rawBackup.exportedAt) : 'Không xác định'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Phiếu ra vào cổng:</span>
                <span className="font-bold text-base text-blue-600">{restorePreview.summary.gatePasses ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Đơn xin nghỉ phép:</span>
                <span className="font-bold text-base text-purple-600">{restorePreview.summary.leaveRequests ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Phiếu xác nhận công:</span>
                <span className="font-bold text-base text-emerald-600">{restorePreview.summary.attendanceConfirms ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">Tài khoản nhân viên:</span>
                <span className="font-bold text-base text-slate-800 dark:text-white">{restorePreview.summary.users ?? 0}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn nạp toàn bộ dữ liệu này vào hệ thống? Dữ liệu hiện tại sẽ được cập nhật đồng bộ với tệp sao lưu.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRestorePreview(null)}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nạp dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Xác nhận khôi phục</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
