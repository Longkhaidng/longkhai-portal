'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Shield,
  Key,
  Database,
  Building2,
  HardDrive,
  DownloadCloud,
  RefreshCw,
  Check,
} from 'lucide-react';
import { storage } from '@/lib/storage';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenGitHubSettings?: () => void;
}

export function Header({ onToggleSidebar, onOpenGitHubSettings }: HeaderProps) {
  const { currentUser, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const ok = await storage.syncFromServer();
      if (ok) {
        setSyncToast({ type: 'success', text: 'Đã cập nhật dữ liệu mới nhất!' });
      } else {
        setSyncToast({ type: 'error', text: 'Không thể kết nối máy chủ' });
      }
    } catch {
      setSyncToast({ type: 'error', text: 'Lỗi đồng bộ' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const gitConfig = storage.getGitHubConfig();
  const hasGitToken = Boolean(gitConfig.token && gitConfig.owner && gitConfig.repo);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors lg:hidden"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <img
            src="/logo.png"
            alt="Long Khai Logo"
            className="w-7 h-7 object-contain"
          />
          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
            LONG KHẢI
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tra cứu phiếu, thiết bị, nhân viên..."
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Right: Theme toggle, Quick Backup, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Sync Data Button for All Devices */}
        <div className="relative">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Đồng bộ dữ liệu mới nhất từ máy chủ cho thiết bị"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ'}</span>
          </button>
          {syncToast && (
            <div className={`absolute top-full right-0 mt-2 whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-lg z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 ${
              syncToast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {syncToast.type === 'success' && <Check className="w-3.5 h-3.5" />}
              <span>{syncToast.text}</span>
            </div>
          )}
        </div>

        {/* Quick Backup for Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              try {
                const backup = storage.exportFullBackupData();
                const now = new Date();
                const yyyy = now.getFullYear();
                const MM = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const jsonStr = JSON.stringify(backup, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `LongKhai_Full_Backup_${yyyy}${MM}${dd}_${hh}${mm}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('Lỗi sao lưu nhanh:', e);
              }
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 transition-colors shadow-xs cursor-pointer"
            title="Sao lưu nhanh toàn bộ hệ thống về máy tính (.JSON)"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sao lưu</span>
            {storage.isBackupDue() && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Đến hạn sao lưu định kỳ" />
            )}
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Chuyển chế độ Sáng / Tối"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-sm">
              {currentUser?.name ? currentUser.name.slice(0, 2) : 'NV'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 leading-tight">
                <span>{currentUser?.name || 'Nhân viên'}</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                  {currentUser?.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {currentUser?.position} &bull; {currentUser?.department}
              </div>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Mã NV: {currentUser?.id}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  <Shield className="w-3 h-3" />
                  <span>Vai trò: {currentUser?.role?.toUpperCase()}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenGitHubSettings?.();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Sao lưu & Quản lý dữ liệu</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenGitHubSettings?.();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Cài đặt kết nối GitHub & Email</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
