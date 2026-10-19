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

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tra cứu phiếu, thiết bị, nhân viên..."
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Right: Theme toggle, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">

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
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Cài đặt kết nối GitHub</span>
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
