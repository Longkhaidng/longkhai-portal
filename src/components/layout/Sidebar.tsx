'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { CategoryPermission, WebIntegration } from '@/types/user';
import { storage } from '@/lib/storage';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Clock,
  QrCode,
  Bell,
  FileSpreadsheet,
  BarChart3,
  Users,
  Boxes,
  Settings,
  BookOpen,
  X,
  ChevronRight,
  Globe,
  ExternalLink,
  Monitor,
  Camera,
  FileText,
  BarChart,
  Database,
  LayoutGrid,
  Wrench,
} from 'lucide-react';

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Globe,
  BarChart,
  Monitor,
  Camera,
  FileText,
  Database,
  LayoutGrid,
  ExternalLink,
};

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingCounts?: {
    leave?: number;
    attendance?: number;
    gatePassActive?: number;
    repair?: number;
  };
  onSelectIntegratedWeb?: (site: WebIntegration) => void;
}

interface MenuItem {
  id: string;
  permission?: CategoryPermission;
  label: string;
  icon: React.ElementType;
  badgeCount?: number;
  badgeColor?: string;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingCounts = {},
  onSelectIntegratedWeb,
}: SidebarProps) {
  const { currentUser, hasPermission } = useAuth();
  const allWebIntegrations = storage.getWebIntegrations().filter((w) => w.isActive);
  
  // Filter integrated websites based on employee individual permissions
  const accessibleWebIntegrations = allWebIntegrations.filter((site) => {
    // Admin can see all active websites
    if (currentUser?.role === 'admin') return true;
    // Check if this specific site is allowed for this user
    return currentUser?.allowedWebIntegrations?.includes(site.id) ?? false;
  });

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      permission: 'dashboard',
      label: 'Dashboard Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'departments',
      permission: 'departments',
      label: 'Quản lý phòng ban',
      icon: Building2,
    },
    {
      id: 'leave',
      permission: 'leave',
      label: 'Đơn xin nghỉ phép',
      icon: CalendarDays,
      badgeCount: pendingCounts.leave,
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'attendance',
      permission: 'attendance',
      label: 'Phiếu xác nhận công',
      icon: Clock,
      badgeCount: pendingCounts.attendance,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'gate_pass',
      permission: 'gate_pass',
      label: 'Phiếu ra - vào cổng',
      icon: QrCode,
      badgeCount: pendingCounts.gatePassActive,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'repair',
      permission: 'repair',
      label: 'Phiếu đề xuất sửa chữa',
      icon: Wrench,
      badgeCount: pendingCounts.repair,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'announcements',
      permission: 'announcements',
      label: 'Thông báo & Nội quy',
      icon: Bell,
    },
    {
      id: 'forms',
      permission: 'forms',
      label: 'Quản lý biểu mẫu động',
      icon: FileSpreadsheet,
    },
    {
      id: 'reports',
      permission: 'reports',
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
    },
    {
      id: 'users',
      permission: 'users',
      label: 'Quản lý NV & Phân quyền',
      icon: Users,
    },
    {
      id: 'web_integrations',
      permission: 'web_integrations',
      label: 'Tích hợp Website (Cài đặt)',
      icon: Globe,
    },
    {
      id: 'settings',
      permission: 'settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
    },
  ];

  // Filter items based on user permissions
  const accessibleMenuItems = menuItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-68 bg-slate-900 text-slate-300 z-50 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center shadow-md border border-white/10 shrink-0">
              <img
                src="/logo.png"
                alt="Long Khai Corporation Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="font-black text-sm text-white tracking-wide leading-none">
                LONG KHẢI
              </div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                CORPORATION PORTAL
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card in Sidebar */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="text-xs font-bold text-white truncate">
            {currentUser?.name}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {currentUser?.position}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50 text-[10px]">
            <span className="font-mono text-blue-400 font-semibold bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-900/60">
              {currentUser?.id}
            </span>
            <span className="text-slate-400 capitalize">
              {currentUser?.role === 'admin' ? 'Quản trị viên' : currentUser?.department}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Chức Năng
          </div>

          {accessibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-blue-500 text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                ) : null}
              </button>
            );
          })}

          {/* DYNAMIC INTEGRATED WEBSITES SECTION IN SIDEBAR (FILTERED BY USER PERMISSION) */}
          {accessibleWebIntegrations.length > 0 && (
            <div className="pt-3 mt-3 border-t border-slate-800">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Website Tích Hợp</span>
                <Globe className="w-3 h-3 text-slate-500" />
              </div>

              {accessibleWebIntegrations.map((site) => {
                const SiteIcon = ICON_COMPONENTS[site.iconName] || Globe;
                const isSiteActive = currentTab === `web_${site.id}`;

                return (
                  <button
                    key={site.id}
                    onClick={() => {
                      if (site.displayMode === 'new_tab') {
                        window.open(site.url, '_blank');
                      } else {
                        if (onSelectIntegratedWeb) {
                          onSelectIntegratedWeb(site);
                        } else {
                          onSelectTab(`web_${site.id}`);
                        }
                      }
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isSiteActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <SiteIcon className={`w-4 h-4 shrink-0 ${isSiteActive ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="truncate">{site.title}</span>
                    </div>

                    {site.displayMode === 'new_tab' ? (
                      <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    ) : isSiteActive ? (
                      <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          <div>Hệ thống Nhà máy Long Khải</div>
          <div className="text-[10px] text-slate-600 mt-0.5">Phiên bản 2026.2 &bull; Next.js 15</div>
        </div>
      </aside>
    </>
  );
}
