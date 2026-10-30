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
import { ProposalHubView } from '@/components/proposals/ProposalHubView';
import { PCCCInspectionView } from '@/components/pccc/PCCCInspectionView';
import { PeriodicInspectionView } from '@/components/periodic-inspection/PeriodicInspectionView';
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
  filterUserStationeryProposals,
  filterUserGeneralProposals,
  isApproverRole,
  isSecurityRole,
  isMaintenanceStaff,
} from '@/lib/permissions';

function PortalAppContent() {
  const { currentUser, isLoading, hasPermission } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [viewingWebSite, setViewingWebSite] = useState<WebIntegration | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  React.useEffect(() => {
    const handleStorageChange = () => {
      setDataVersion((v) => v + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('pccc')) {
        setCurrentTab('pccc');
      } else {
        const targetType = urlParams.get('type');
        if (targetType) {
          if (targetType === 'leave') setCurrentTab('leave');
          else if (targetType === 'attendance') setCurrentTab('attendance');
          else if (targetType === 'gate_pass') setCurrentTab('gate_pass');
          else if (targetType === 'repair') setCurrentTab('proposals_repair');
          else if (targetType === 'stationery') setCurrentTab('proposals_stationery');
          else if (targetType === 'general') setCurrentTab('proposals_general');
        }
      }
    }
  }, [currentUser]);

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
  const userStationeries = filterUserStationeryProposals(
    storage.getStationeryProposals(),
    currentUser,
    canManageOthers ? 'approver' : 'my'
  );
  const userGenerals = filterUserGeneralProposals(
    storage.getGeneralProposals(),
    currentUser,
    canManageOthers ? 'approver' : 'my'
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

  const isHRStaff =
    currentUser?.id === '1139' ||
    currentUser?.role === 'hr' ||
    (Boolean(currentUser?.department) && /hcns|nhân sự/i.test(currentUser!.department) && currentUser?.role !== 'manager');
  const isHRManager =
    currentUser?.id === '1867' ||
    (currentUser?.role === 'manager' && Boolean(currentUser?.department) && /hcns|nhân sự/i.test(currentUser!.department));

  const pendingStationeries = userStationeries.filter((s) => {
    if (isHRStaff && s.status === 'pending_hr') return true;
    if (isHRManager && s.status === 'pending_manager') return true;
    return false;
  }).length;

  const pendingGenerals = userGenerals.filter((g) => {
    if (g.status === 'pending_receiver') {
      const isTarget = g.receiverUserId?.toLowerCase() === currentUser?.id.toLowerCase();
      const isIT = (currentUser?.role === 'admin' || /cntt|it/i.test(currentUser?.department || '')) && /cntt|it/i.test(g.receiverDepartment);
      return isTarget || isIT;
    }
    if (g.status === 'pending_manager') {
      return (currentUser?.role === 'manager' || currentUser?.role === 'team_leader') && g.receiverDepartment.toLowerCase() === (currentUser?.department || '').toLowerCase();
    }
    return false;
  }).length;

  const totalPendingProposals = pendingRepairs + pendingStationeries + pendingGenerals;

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

    // Proposal Hub RBAC Guard (preserves backward compatibility with 'repair' permission)
    if (currentTab === 'proposals' || currentTab.startsWith('proposals_')) {
      if (!hasPermission('repair')) {
        return (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-2xl mb-3">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Từ chối truy cập danh mục
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
              Tài khoản <b className="text-slate-800 dark:text-slate-200">{currentUser.name}</b> ({currentUser.id}) chưa được phân quyền truy cập danh mục Phiếu đề xuất. Vui lòng liên hệ Quản trị viên để được cấp quyền.
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
    }

    // Permission check for protected categories
    const isCategory = (tab: string): tab is CategoryPermission => {
      return [
        'dashboard',
        'departments',
        'leave',
        'attendance',
        'gate_pass',
        'repair',
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
      case 'proposals':
      case 'repair':
        return <ProposalHubView initialCategory="repair" />;
      case 'proposals_repair':
        return <ProposalHubView initialCategory="repair" />;
      case 'proposals_stationery':
        return <ProposalHubView initialCategory="stationery" />;
      case 'proposals_general':
        return <ProposalHubView initialCategory="general" />;
      case 'pccc':
        if (!hasPermission('pccc')) return <DashboardView onNavigateTab={(tab: string) => setCurrentTab(tab)} />;
        return <PCCCInspectionView />;
      case 'periodic_inspection':
      case 'periodic_first_aid':
      case 'periodic_eyewash':
      case 'periodic_stormwater':
      case 'periodic_groundwater_soil':
        return <PeriodicInspectionView initialSubTab={currentTab} />;
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
          repair: totalPendingProposals,
          proposals: totalPendingProposals,
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
            setCurrentTab('settings');
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
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
