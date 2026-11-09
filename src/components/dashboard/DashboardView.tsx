'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  CalendarDays,
  Clock,
  QrCode,
  UtensilsCrossed,
  Timer,
  ClipboardList,
  Flame,
  BarChart3,
  Bell,
  Pin,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { FOOD_CATEGORY_LABELS, checkFoodQrValidity } from '@/types/food-registration';
import { Announcement, ANNOUNCEMENT_CATEGORY_LABELS } from '@/types/announcement';
import {
  filterUserLeaves,
  filterUserGatePasses,
  filterUserAttendances,
  filterUserFoodRegistrations,
  canApproveFoodDept,
  canApproveFoodHR,
  isApproverRole,
  isSuperAdminOrBOD,
  isSecurityRole,
} from '@/lib/permissions';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

type TaskTab = 'all' | 'leave' | 'attendance' | 'food' | 'proposal';

interface DashboardTaskItem {
  id: string;
  type: 'leave' | 'attendance' | 'food' | 'proposal';
  typeLabel: string;
  typeBadgeColor: string;
  title: string;
  subtitle: string;
  dateStr: string;
  statusText: string;
  statusBadgeColor: string;
  targetTab: string;
}

export function DashboardView({ onNavigateTab }: DashboardViewProps) {
  const { currentUser, hasPermission } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<TaskTab>('all');

  const canManageOthers = isApproverRole(currentUser) || isSecurityRole(currentUser);

  const [dataVersion, setDataVersion] = useState(0);

  React.useEffect(() => {
    const handleStorageChange = () => setDataVersion((v) => v + 1);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('food_registrations_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('food_registrations_updated', handleStorageChange);
    };
  }, []);

  // Raw data from storage
  const rawLeaves = useMemo(() => storage.getLeaveRequests(), [dataVersion]);
  const rawAttendances = useMemo(() => storage.getAttendanceConfirms(), [dataVersion]);
  const rawGatePasses = useMemo(() => storage.getGatePasses(), [dataVersion]);
  const rawFoods = useMemo(() => storage.getFoodRegistrations(), [dataVersion]);
  const rawProposals = useMemo(() => storage.getRepairProposals(), [dataVersion]);
  const rawOvertime = useMemo(() => storage.getOvertimeRegistrations(), [dataVersion]);
  const announcementsList = useMemo(() => storage.getAnnouncements(), [dataVersion]);

  // Filtered collections
  const leaves = useMemo(() => {
    return filterUserLeaves(rawLeaves, currentUser, isApproverRole(currentUser) ? 'all' : 'my');
  }, [rawLeaves, currentUser]);

  const attendances = useMemo(() => {
    return filterUserAttendances(rawAttendances, currentUser, canManageOthers ? 'all' : 'my');
  }, [rawAttendances, currentUser, canManageOthers]);

  const gatePasses = useMemo(() => {
    return filterUserGatePasses(rawGatePasses, currentUser, canManageOthers ? 'all' : 'my');
  }, [rawGatePasses, currentUser, canManageOthers]);

  const foodRegistrations = useMemo(() => {
    return filterUserFoodRegistrations(rawFoods, currentUser, canManageOthers ? 'all' : 'my');
  }, [rawFoods, currentUser, canManageOthers]);

  // Announcements list (pinned first, then newest)
  const announcements = useMemo(() => {
    return [...announcementsList].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [announcementsList]);

  // Pending counts
  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === 'pending'), [leaves]);
  const pendingAttendances = useMemo(() => attendances.filter((a) => a.status === 'pending'), [attendances]);
  const activeGatePasses = useMemo(
    () => gatePasses.filter((g) => g.status === 'approved' || g.status === 'departed'),
    [gatePasses]
  );
  const activeFoodRegistrations = useMemo(() => {
    return foodRegistrations.filter((f) => {
      const v = checkFoodQrValidity(f);
      return v.isValid && !v.isExpired;
    });
  }, [foodRegistrations]);

  const pendingFoods = useMemo(() => {
    if (!currentUser) return [];
    return foodRegistrations.filter((f) => {
      if (f.status === 'pending_dept') return canApproveFoodDept(currentUser, f);
      if (f.status === 'pending_hr') return canApproveFoodHR(currentUser, f);
      return false;
    });
  }, [foodRegistrations, currentUser]);

  const pendingProposals = useMemo(() => {
    return rawProposals.filter((p) => p.status === 'pending_manager' || p.status === 'maintenance_pending' || p.status === 'pending_confirmation');
  }, [rawProposals]);

  const pendingOvertime = useMemo(() => {
    return rawOvertime.filter((o) => o.status === 'pending');
  }, [rawOvertime]);

  // Unified Actionable Task Items
  const taskItems: DashboardTaskItem[] = useMemo(() => {
    const list: DashboardTaskItem[] = [];

    // Leaves
    pendingLeaves.forEach((item) => {
      list.push({
        id: item.id,
        type: 'leave',
        typeLabel: 'Nghỉ phép',
        typeBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        title: `${item.employeeName} (${item.employeeId})`,
        subtitle: `${item.department} • ${LEAVE_TYPE_LABELS[item.leaveType] || item.leaveType} (${item.totalDays} ngày: ${formatDate(item.fromDate)} - ${formatDate(item.toDate)})`,
        dateStr: formatDate(item.createdAt),
        statusText: 'Chờ duyệt',
        statusBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        targetTab: 'leave',
      });
    });

    // Attendance
    pendingAttendances.forEach((item) => {
      list.push({
        id: item.id,
        type: 'attendance',
        typeLabel: 'Xác nhận công',
        typeBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        title: `${item.employeeName} (${item.employeeId})`,
        subtitle: `${item.department} • ${ISSUE_TYPE_LABELS[item.issueType]?.text || 'Quên thẻ'} (${formatDate(item.date)} ${item.shift})`,
        dateStr: formatDate(item.createdAt),
        statusText: `Bước ${item.currentStepIndex + 1}/${item.steps?.length || 2}`,
        statusBadgeColor: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
        targetTab: 'attendance',
      });
    });

    // Food
    pendingFoods.forEach((item) => {
      list.push({
        id: item.id,
        type: 'food',
        typeLabel: 'Thực phẩm',
        typeBadgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
        title: `${item.employeeName} (${item.employeeId})`,
        subtitle: `${item.department} • ${FOOD_CATEGORY_LABELS[item.category] || item.category} (${item.foodDetails})`,
        dateStr: formatDate(item.createdAt),
        statusText: item.status === 'pending_dept' ? 'Chờ Trưởng BP' : 'Chờ TP HCNS',
        statusBadgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        targetTab: 'food_registration',
      });
    });

    // Proposals
    pendingProposals.forEach((item) => {
      list.push({
        id: item.id,
        type: 'proposal',
        typeLabel: 'Đề xuất sửa chữa',
        typeBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        title: `${item.employeeName} (${item.employeeId})`,
        subtitle: `${item.department} • Vị trí: ${item.location} - ${item.issueDescription}`,
        dateStr: formatDate(item.createdAt),
        statusText: item.status === 'pending_manager' ? 'Chờ Trưởng BP' : item.status === 'maintenance_pending' ? 'Chờ Cơ điện' : 'Chờ xác nhận',
        statusBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        targetTab: 'proposals',
      });
    });

    return list;
  }, [pendingLeaves, pendingAttendances, pendingFoods, pendingProposals]);

  const filteredTasks = useMemo(() => {
    if (activeTaskTab === 'all') return taskItems;
    return taskItems.filter((t) => t.type === activeTaskTab);
  }, [taskItems, activeTaskTab]);

  // Today Date String formatted in Vietnamese
  const todayVN = useMemo(() => {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dName = days[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return `${dName}, ngày ${d}/${m}/${y}`;
  }, []);

  // Quick Action Shortcuts definition
  const quickActions = [
    { id: 'leave', label: 'Đơn nghỉ phép', icon: CalendarDays, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' },
    { id: 'attendance', label: 'Xác nhận công', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
    { id: 'gate_pass', label: 'Ra vào cổng', icon: QrCode, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
    { id: 'overtime', label: 'Làm thêm giờ', icon: Timer, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900' },
    { id: 'food_registration', label: 'Thực phẩm mang vào', icon: UtensilsCrossed, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900' },
    { id: 'proposals', label: 'Phiếu đề xuất', icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900' },
    { id: 'pccc', label: 'Kiểm tra PCCC', icon: Flame, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' },
    { id: 'reports', label: 'Báo cáo & Thống kê', icon: BarChart3, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900' },
  ].filter((a) => {
    if (a.id === 'proposals') return hasPermission('repair');
    return hasPermission(a.id as any);
  });

  return (
    <div className="space-y-6">
      {/* 1. Sleek Modern Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Cổng Thông Tin Nội Bộ Nhà Máy Long Khải</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-white/90">{todayVN}</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Xin chào, {currentUser?.name}!</span>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse hidden sm:inline-block" />
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-medium pt-0.5">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/10 font-mono text-[11px] text-white">
                MSNV: {currentUser?.id}
              </span>
              <span>&bull;</span>
              <span className="text-slate-200 font-semibold">{currentUser?.department}</span>
              <span>&bull;</span>
              <span className="text-blue-300">{currentUser?.position || 'Nhân viên'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onNavigateTab('leave')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <span>+ Tạo đơn mới</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Five Key Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Leave */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nghỉ phép
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {pendingLeaves.length}
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Đang chờ duyệt</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Xác nhận công
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {pendingAttendances.length}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Quên / Mất thẻ</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 3: Gate Pass */}
        <div
          onClick={() => onNavigateTab('gate_pass')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ra vào cổng
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeGatePasses.length}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Đang lưu hành</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 4: Food Intake */}
        <div
          onClick={() => onNavigateTab('food_registration')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-teal-400 dark:hover:border-teal-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Thực phẩm mang vào
            </span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {activeFoodRegistrations.length}
            </div>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Mã QR hiệu lực</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 5: Proposals & Overtime */}
        <div
          onClick={() => onNavigateTab('proposals')}
          className="col-span-2 sm:col-span-1 lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Đề xuất & Thêm giờ
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {pendingProposals.length + pendingOvertime.length}
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Chờ phê duyệt</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Functional Shortcuts */}
      {quickActions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Lối tắt chức năng nhanh</span>
            </span>
            <span className="text-[11px] text-slate-400">Nhấn để truy cập ngay</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  type="button"
                  onClick={() => onNavigateTab(qa.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-102 hover:shadow-xs text-center ${qa.color}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-[11px] font-semibold truncate w-full">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Main 2-column Grid: Work Queue (Left 2 cols) & Company Side Panel (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 spans): Unified Actionable Task Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Việc cần xử lý & Tiến độ hồ sơ</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {taskItems.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các hồ sơ, đơn từ đang chờ bạn hoặc cấp quản lý giải quyết
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTaskTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tất cả ({taskItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('leave')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTaskTab === 'leave'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Phép ({pendingLeaves.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('attendance')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTaskTab === 'attendance'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Công ({pendingAttendances.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('food')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTaskTab === 'food'
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Thực phẩm ({pendingFoods.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('proposal')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeTaskTab === 'proposal'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Đề xuất ({pendingProposals.length})
                </button>
              </div>
            </div>

            {/* List of Tasks */}
            {filteredTasks.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">
                  Tuyệt vời! Hiện không có hồ sơ nào thuộc mục này đang chờ xử lý.
                </p>
                <p className="text-[11px] text-slate-400">Mọi hồ sơ đã được phê duyệt và giải quyết kịp thời.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.slice(0, 6).map((task) => (
                  <div
                    key={`${task.type}-${task.id}`}
                    onClick={() => onNavigateTab(task.targetTab)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors gap-3 group"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${task.typeBadgeColor}`}>
                          {task.typeLabel}
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({task.dateStr})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {task.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${task.statusBadgeColor}`}>
                        {task.statusText}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Announcements & Working Shift Rules */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Thông báo nội bộ ({announcements.length})
                  </h3>
                  <p className="text-[10px] text-slate-400">Chính sách & An toàn nhà máy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('announcements')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có thông báo nào.</p>
            ) : (
              <div className="space-y-2.5">
                {announcements.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 cursor-pointer transition-all group space-y-1"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          <Pin className="w-2.5 h-2.5 fill-amber-700" />
                          Ghim
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.color || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.title || item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">&bull; {formatDate(item.publishedAt)}</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.summary || item.contentMarkdown.slice(0, 100)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Working Shift Standard Rules */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Quy định giờ làm việc nhà máy</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Ca Hành chính:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">08:00 - 16:30</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Ca 1 (Sáng):</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">06:00 - 14:00</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Ca 2 (Chiều):</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">14:00 - 22:00</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Ca 3 (Đêm):</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">22:00 - 06:00</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              * Quên hoặc hỏng thẻ vui lòng làm phiếu xác nhận công trong ngày để đảm bảo công chuẩn xác.
            </p>
          </div>
        </div>
      </div>

      {/* Modal View Full Announcement / Rule */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {selectedAnnouncement.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Pin className="w-3 h-3 fill-amber-700 dark:fill-amber-300" />
                      Đã ghim
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ANNOUNCEMENT_CATEGORY_LABELS[selectedAnnouncement.category]?.color || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ANNOUNCEMENT_CATEGORY_LABELS[selectedAnnouncement.category]?.title || selectedAnnouncement.category}
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAnnouncement.title}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Người đăng: <b>{selectedAnnouncement.authorName}</b></span>
                  <span>&bull;</span>
                  <span>Ngày ban hành: {formatDate(selectedAnnouncement.publishedAt)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedAnnouncement.summary && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 font-medium text-purple-900 dark:text-purple-200">
                  {selectedAnnouncement.summary}
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none text-xs md:text-sm">
                {selectedAnnouncement.contentMarkdown}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedAnnouncement(null);
                  onNavigateTab('announcements');
                }}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <span>Xem trong trang Thông báo & Nội quy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
