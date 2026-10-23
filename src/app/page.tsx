'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { DepartmentManagementView } from '@/components/departments/DepartmentManagementView';
import { LeaveView } from '@/components/leave/LeaveView';
import { AttendanceView } from '@/components/attendance/AttendanceView';
import { GatePassView } from '@/components/gatepass/GatePassView';
import { RepairProposalView } from '@/components/repair/RepairProposalView';
import { AnnouncementView } from '@/components/announcements/AnnouncementView';
import { DynamicFormsView } from '@/components/forms/DynamicFormsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { WebIntegrationManagementView } from '@/components/web-integrations/WebIntegrationManagementView';
import { EmbeddedWebView } from '@/components/web-integrations/EmbeddedWebView';
import { PluginsView } from '@/components/plugins/PluginsView';
import { UserManagementView } from '@/components/users/UserManagementView';
import { SettingsView } from '@/components/settings/SettingsView';
import { DeploymentGuideView } from '@/components/guide/DeploymentGuideView';
import { CategoryPermission, WebIntegration } from '@/types/user';
import { ShieldAlert, Lock } from 'lucide-react';
import { storage } from '@/lib/storage';
import {
  filterUserLeaves,
  filterUserAttendances,
  filterUserGatePasses,
  filterUserRepairProposals,
  isApproverRole,
  isSecurityRole,
  isMaintenanceStaff,
} from '@/lib/permissions';

function PortalAppContent() {
  const { currentUser, isLoading, hasPermission } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewingWebSite, setViewingWebSite] = useState<WebIntegration | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
          Đang khởi động Cổng Thông Tin Long Khải...
        </p>
      </div>
    );
  }

  // If not logged in -> Show Login Page
  if (!currentUser) {
    return <LoginForm />;
  }

  // Calculate pending counts for badges based on user role and permissions
  const isSecurity = isSecurityRole(currentUser);
  const canManageOthers = isApproverRole(currentUser);
  const userLeaves = filterUserLeaves(storage.getLeaveRequests(), currentUser, canManageOthers ? 'approver' : 'my');
  const userAtts = filterUserAttendances(
    storage.getAttendanceConfirms(),
    currentUser,
    canManageOthers || isSecurity ? 'approver' : 'my'
  );
  const userGps = filterUserGatePasses(
    storage.getGatePasses(),
    currentUser,
    canManageOthers || isSecurity ? 'approver' : 'my'
  );
  const userRepairs = filterUserRepairProposals(
    storage.getRepairProposals(),
    currentUser,
    canManageOthers || isMaintenanceStaff(currentUser) ? 'approver' : 'my'
  );

  const pendingLeaves = userLeaves.filter((l) => l.status === 'pending').length;
  const pendingAtts = userAtts.filter((a) => a.status === 'pending').length;
  const activeGps = userGps.filter((g) => g.status === 'approved' || g.status === 'departed').length;
  const pendingRepairs = userRepairs.filter((r) => {
    if (currentUser?.role === 'manager' || currentUser?.role === 'team_leader') return r.status === 'pending_manager';
    if (isMaintenanceStaff(currentUser)) return r.status === 'maintenance_pending';
    if (r.employeeId.toLowerCase() === currentUser?.id.toLowerCase()) return r.status === 'pending_confirmation';
    return false;
  }).length;

  // Render view by tab with RBAC Guard
  const renderActiveView = () => {
    // If viewing an integrated website
    if (viewingWebSite) {
      const isAllowed =
        currentUser.role === 'admin' ||
        currentUser.allowedWebIntegrations?.includes(viewingWebSite.id);

      if (!isAllowed) {
        return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl mb-3">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quyền truy cập bị giới hạn
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
              Bạn không có quyền truy cập vào website tích hợp <b className="text-slate-800 dark:text-slate-200">{viewingWebSite.title}</b>. Vui lòng liên hệ Quản trị viên để được cấp quyền.
            </p>
            <button
              onClick={() => setViewingWebSite(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Quay lại Dashboard
            </button>
          </div>
        );
      }

      return (
        <EmbeddedWebView
          site={viewingWebSite}
          onBack={() => setViewingWebSite(null)}
        />
      );
    }

    // Guide is only accessible to Admin
    if (currentTab === 'guide') {
      if (currentUser.role !== 'admin') {
        return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl mb-3">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Quyền truy cập bị giới hạn
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
              Mục Hướng dẫn triển khai GitHub chỉ dành riêng cho Quản trị viên hệ thống (Admin).
            </p>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Quay lại Dashboard
            </button>
          </div>
        );
      }
      return <DeploymentGuideView />;
    }

    // Permission check for protected categories
    const isCategory = (tab: string): tab is CategoryPermission => {
      return [
        'dashboard',
        'departments',
        'leave',
        'attendance',
        'gate_pass',
        'announcements',
        'forms',
        'reports',
        'users',
        'web_integrations',
        'plugins',
        'settings',
      ].includes(tab);
    };

    if (isCategory(currentTab) && !hasPermission(currentTab)) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Từ chối truy cập danh mục
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
            Tài khoản <b className="text-slate-800 dark:text-slate-200">{currentUser.name}</b> ({currentUser.id}) chưa được phân quyền truy cập danh mục này. Vui lòng liên hệ Quản trị viên để được cấp quyền qua file Excel hoặc ma trận phân quyền.
          </p>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Quay lại Dashboard
          </button>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab) => {
          setViewingWebSite(null);
          setCurrentTab(tab);
        }} />;
      case 'departments':
        return <DepartmentManagementView />;
      case 'leave':
        return <LeaveView />;
      case 'attendance':
        return <AttendanceView />;
      case 'gate_pass':
        return <GatePassView />;
      case 'repair':
        return <RepairProposalView />;
      case 'announcements':
        return <AnnouncementView />;
      case 'forms':
        return <DynamicFormsView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UserManagementView />;
      case 'web_integrations':
        return (
          <WebIntegrationManagementView
            onSelectSiteToView={(site) => setViewingWebSite(site)}
          />
        );
      case 'plugins':
        return <PluginsView />;
      case 'settings':
        return <SettingsView />;
      default:
        // Check if tab is an integrated website id (web_WEB-xxx)
        if (currentTab.startsWith('web_')) {
          const siteId = currentTab.replace('web_', '');
          const site = storage.getWebIntegrations().find((w) => w.id === siteId);
          if (site) {
            const isAllowed =
              currentUser.role === 'admin' ||
              currentUser.allowedWebIntegrations?.includes(site.id);

            if (!isAllowed) {
              return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl mb-3">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Quyền truy cập bị giới hạn
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                    Bạn không có quyền truy cập vào website tích hợp <b className="text-slate-800 dark:text-slate-200">{site.title}</b>. Vui lòng liên hệ Quản trị viên để được cấp quyền.
                  </p>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Quay lại Dashboard
                  </button>
                </div>
              );
            }

            return (
              <EmbeddedWebView
                site={site}
                onBack={() => setCurrentTab('dashboard')}
              />
            );
          }
        }
        return <DashboardView onNavigateTab={(tab) => {
          setViewingWebSite(null);
          setCurrentTab(tab);
        }} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={viewingWebSite ? `web_${viewingWebSite.id}` : currentTab}
        onSelectTab={(tabId) => {
          setViewingWebSite(null);
          setCurrentTab(tabId);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        pendingCounts={{
          leave: pendingLeaves,
          attendance: pendingAtts,
          gatePassActive: activeGps,
          repair: pendingRepairs,
        }}
        onSelectIntegratedWeb={(site) => {
          setViewingWebSite(site);
        }}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenGitHubSettings={() => {
            setViewingWebSite(null);
            setCurrentTab('settings');
          }}
        />

        {/* Content Body */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <PortalAppContent />
    </AuthProvider>
  );
}
