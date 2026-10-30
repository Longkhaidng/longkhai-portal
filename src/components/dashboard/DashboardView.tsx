'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  FileText,
  CalendarDays,
  Clock,
  QrCode,
  CheckCircle2,
  TrendingUp,
  Building,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Building2,
  Globe,
  Users,
  Bell,
  Pin,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { Announcement, ANNOUNCEMENT_CATEGORY_LABELS } from '@/types/announcement';
import {
  filterUserLeaves,
  filterUserGatePasses,
  filterUserAttendances,
  isApproverRole,
  isSuperAdminOrBOD,
  isSecurityRole,
} from '@/lib/permissions';

interface DashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export function DashboardView({ onNavigateTab }: DashboardViewProps) {
  const { currentUser } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const isBOD = isSuperAdminOrBOD(currentUser);
  const isSecurity = isSecurityRole(currentUser);
  const canManageOthers = isApproverRole(currentUser) || isSecurity;

  const [dataVersion, setDataVersion] = useState(0);

  React.useEffect(() => {
    const handleStorageChange = () => {
      setDataVersion((v) => v + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const rawLeaves = useMemo(() => storage.getLeaveRequests(), [dataVersion]);
  const rawAttendances = useMemo(() => storage.getAttendanceConfirms(), [dataVersion]);
  const rawGatePasses = useMemo(() => storage.getGatePasses(), [dataVersion]);
  const formSubs = useMemo(() => storage.getFormSubmissions(), [dataVersion]);
  const departments = useMemo(() => storage.getDepartments(), [dataVersion]);
  const users = useMemo(() => storage.getUsers(), [dataVersion]);
  const webIntegrations = useMemo(() => storage.getWebIntegrations(), [dataVersion]);

  // Announcements list (pinned first, then latest published)
  const announcements = useMemo(() => {
    const list = storage.getAnnouncements();
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [dataVersion]);

  // Filter documents based on user permissions
  const leaves = useMemo(() => {
    return filterUserLeaves(rawLeaves, currentUser, isApproverRole(currentUser) ? 'all' : 'my');
  }, [rawLeaves, currentUser]);

  const attendances = useMemo(() => {
    return filterUserAttendances(rawAttendances, currentUser, canManageOthers ? 'all' : 'my');
  }, [rawAttendances, currentUser, canManageOthers]);

  const gatePasses = useMemo(() => {
    return filterUserGatePasses(rawGatePasses, currentUser, canManageOthers ? 'all' : 'my');
  }, [rawGatePasses, currentUser, canManageOthers]);

  // Metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalFormsThisMonth = useMemo(() => {
    let count = 0;
    const isThisMonth = (dStr?: string) => {
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };
    count += leaves.filter((l) => isThisMonth(l.createdAt)).length;
    count += attendances.filter((a) => isThisMonth(a.createdAt)).length;
    count += gatePasses.filter((g) => isThisMonth(g.createdAt)).length;
    count += formSubs.filter((s) => isThisMonth(s.createdAt)).length;
    return count;
  }, [leaves, attendances, gatePasses, formSubs, currentMonth, currentYear]);

  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === 'pending'), [leaves]);
  const pendingAttendances = useMemo(() => attendances.filter((a) => a.status === 'pending'), [attendances]);
  const activeGatePasses = useMemo(() => gatePasses.filter((g) => g.status === 'approved' || g.status === 'departed'), [gatePasses]);

  // Department Stats for Leave Requests
  const deptStats = useMemo(() => {
    const stats: Record<string, number> = {};
    rawLeaves.forEach((l) => {
      stats[l.department] = (stats[l.department] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [rawLeaves]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cổng Thông Tin Nhà Máy Long Khải &bull; 2026</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Xin chào, {currentUser?.name}!
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1">
              Phòng ban: <b className="text-white">{currentUser?.department}</b> &bull; Chức vụ:{' '}
              <b className="text-white">{currentUser?.position}</b>
            </p>
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Forms */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Biểu mẫu tháng này</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {totalFormsThisMonth}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Phát sinh trong tháng {currentMonth + 1}</p>
          </div>
        </div>

        {/* Card 2: Pending Leaves */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Đơn phép chờ duyệt</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {pendingLeaves.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Đang cần phê duyệt</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 3: Pending Attendance */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Xác nhận công chờ</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {pendingAttendances.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Quên / Mất thẻ cần duyệt</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 4: Active Gate Passes */}
        <div
          onClick={() => onNavigateTab('gate_pass')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Phiếu ra cổng hiệu lực</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {activeGatePasses.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Đang lưu hành</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>

        {/* Card 5: Departments Count */}
        <div
          onClick={() => onNavigateTab('departments')}
          className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-purple-400 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Phòng ban nhà máy</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {departments.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>{users.length} nhân sự</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-column sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Urgent Approvals & Announcements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Leaves List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  {!canManageOthers
                    ? 'Đơn nghỉ phép của bạn chờ duyệt'
                    : isBOD
                    ? 'Đơn nghỉ phép toàn công ty chờ phê duyệt'
                    : `Đơn nghỉ phép nhân viên ${currentUser?.department || 'bộ phận'} chờ duyệt`} ({pendingLeaves.length})
                </h2>
                <p className="text-xs text-slate-400">
                  {!canManageOthers
                    ? 'Đơn do bạn nộp đang chờ cấp trên xử lý'
                    : isBOD
                    ? 'Yêu cầu nghỉ phép từ các bộ phận toàn công ty'
                    : `Yêu cầu nghỉ phép từ nhân viên bộ phận ${currentUser?.department || ''}`}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('leave')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                Hiện không có đơn nghỉ phép nào đang chờ duyệt.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingLeaves.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('leave')}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {item.employeeName}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {item.employeeId}
                        </span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                          ({LEAVE_TYPE_LABELS[item.leaveType] || item.leaveType})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.department} &bull; Nghỉ {item.totalDays} ngày (Từ {formatDate(item.fromDate)} đến {formatDate(item.toDate)})
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                      Chờ duyệt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Attendance Confirmations */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  {!canManageOthers
                    ? 'Xác nhận công của bạn chờ duyệt'
                    : isSecurity
                    ? 'Phiếu xác nhận công chờ bảo vệ xác nhận'
                    : isBOD
                    ? 'Xác nhận công vào - ra toàn công ty chờ duyệt'
                    : `Xác nhận công nhân viên ${currentUser?.department || 'bộ phận'} chờ duyệt`} ({pendingAttendances.length})
                </h2>
                <p className="text-xs text-slate-400">
                  {!canManageOthers
                    ? 'Phiếu do bạn nộp đang chờ cấp trên xác nhận'
                    : isSecurity
                    ? 'Xác nhận giờ vào/ra thực tế tại cổng cho các trường hợp quên thẻ, mất thẻ'
                    : isBOD
                    ? 'Giải trình quên thẻ, mất thẻ hoặc thẻ lỗi toàn công ty'
                    : `Giải trình quên thẻ, mất thẻ từ nhân viên bộ phận ${currentUser?.department || ''}`}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('attendance')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingAttendances.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                Hiện không có phiếu xác nhận công nào đang chờ duyệt.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingAttendances.slice(0, 4).map((att) => (
                  <div
                    key={att.id}
                    onClick={() => onNavigateTab('attendance')}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {att.employeeName}
                        </span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {att.employeeId}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${ISSUE_TYPE_LABELS[att.issueType]?.badge}`}>
                          {ISSUE_TYPE_LABELS[att.issueType]?.text}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ngày {formatDate(att.date)} &bull; Vào: {att.checkInTime} - Ra: {att.checkOutTime} ({att.department})
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                      Bước {att.currentStepIndex + 1}/{att.steps.length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Thông Báo & Nội Quy Nhà Máy */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    Thông báo & Nội quy nhà máy
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {announcements.length} tin
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Quy định an toàn lao động, chính sách và tin tức nội bộ mới nhất
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Hiện chưa có thông báo hoặc nội quy nào được đăng tải.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAnnouncement(item)}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.isPinned && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                              <Pin className="w-2.5 h-2.5 fill-amber-700 dark:fill-amber-300" />
                              Ghim
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.color ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ANNOUNCEMENT_CATEGORY_LABELS[item.category]?.title || item.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            &bull; {formatDate(item.publishedAt)}
                          </span>
                        </div>
                        <h3 className="font-bold text-xs md:text-sm text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary || item.contentMarkdown.slice(0, 140)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Department Leave Distribution & Quick Factory Stats */}
        <div className="space-y-6">
          {/* Department Leave Distribution */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm mb-3">
              <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Phát sinh đơn theo bộ phận</span>
            </div>

            {deptStats.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu thống kê</p>
            ) : (
              <div className="space-y-3">
                {deptStats.map(([dept, count]) => {
                  const maxCount = deptStats[0][1] || 1;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                          {dept}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">{count} đơn</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Factory Working Shift Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Quy định giờ làm việc nhà máy</span>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Ca HC:</span>
                <b className="font-mono text-slate-800 dark:text-white">08:00 - 16:30</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Ca 1 (Sáng):</span>
                <b className="font-mono text-slate-800 dark:text-white">06:00 - 14:00</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Ca 2 (Chiều):</span>
                <b className="font-mono text-slate-800 dark:text-white">14:00 - 22:00</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span>Ca 3 (Ca đêm):</span>
                <b className="font-mono text-slate-800 dark:text-white">22:00 - 06:00</b>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Quên hoặc hỏng thẻ vui lòng làm phiếu xác nhận công trong ngày để được tính công chuẩn xác.
            </p>
          </div>
        </div>
      </div>

      {/* Modal View Full Announcement / Rule */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            {/* Modal Header */}
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
                      ANNOUNCEMENT_CATEGORY_LABELS[selectedAnnouncement.category]?.color ||
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {ANNOUNCEMENT_CATEGORY_LABELS[selectedAnnouncement.category]?.title ||
                      selectedAnnouncement.category}
                  </span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAnnouncement.title}
                </h2>
                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>
                    Người đăng: <b>{selectedAnnouncement.authorName}</b>
                  </span>
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

            {/* Modal Body */}
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

            {/* Modal Footer */}
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
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
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
