'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Fuel,
  BarChart3,
  Bell,
  Pin,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
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
  filterUserRepairProposals,
  canApproveFoodDept,
  canApproveFoodHR,
  isApproverRole,
  isSuperAdminOrBOD,
  isSecurityRole,
  isMaintenanceStaff,
  isSameDepartment,
  isITStaff,
  isHRHead,
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
  const { currentUser, hasPermission, logout } = useAuth();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeTaskTab, setActiveTaskTab] = useState<TaskTab>('all');

  // Đảm bảo tab được chọn luôn là tab mà người lao động có quyền xem
  React.useEffect(() => {
    if (activeTaskTab === 'leave' && !hasPermission('leave')) setActiveTaskTab('all');
    if (activeTaskTab === 'attendance' && !hasPermission('attendance')) setActiveTaskTab('all');
    if (activeTaskTab === 'food' && !hasPermission('food_registration')) setActiveTaskTab('all');
    if (activeTaskTab === 'proposal' && !hasPermission('repair')) setActiveTaskTab('all');
  }, [activeTaskTab, hasPermission]);

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
  const rawStationery = useMemo(() => storage.getStationeryProposals(), [dataVersion]);
  const rawGeneral = useMemo(() => storage.getGeneralProposals(), [dataVersion]);
  const rawCamera = useMemo(() => storage.getCameraRequests(), [dataVersion]);
  const rawOvertime = useMemo(() => storage.getOvertimeRegistrations(), [dataVersion]);
  const announcementsList = useMemo(() => storage.getAnnouncements(), [dataVersion]);

  const isSuperAdmin = isSuperAdminOrBOD(currentUser);
  const isApprover = isApproverRole(currentUser);
  const isMaintenance = isMaintenanceStaff(currentUser);
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'team_leader';
  const isSecurity = isSecurityRole(currentUser);
  const uid = currentUser?.id.toLowerCase() || '';

  // All registered users for supervisor/head checking
  const allUsers = useMemo(() => storage.getUsers(), [dataVersion]);

  // Unified RBAC check for document ownership & management:
  // - Admin: sees all documents across the entire company
  // - Department head / Manager / Team Leader: sees own tickets + tickets of employees in their department or supervised by them
  // - Normal employee: sees ONLY their own tickets
  const isManagedByViewer = useCallback(
    (empId?: string, empDept?: string) => {
      if (!currentUser) return false;
      if (isSuperAdmin) return true;
      const ownerId = (empId || '').trim().toLowerCase();
      if (ownerId && ownerId === uid) return true;

      if (isManager || isApprover) {
        if (empDept && isSameDepartment(currentUser.department, empDept)) return true;
        if (ownerId && allUsers.length > 0) {
          const target = allUsers.find((u) => (u.id || '').trim().toLowerCase() === ownerId);
          if (target) {
            if (target.departmentHeadId && target.departmentHeadId.trim().toLowerCase() === uid) return true;
            if (
              target.departmentHeadEmail &&
              currentUser.email &&
              target.departmentHeadEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()
            ) {
              return true;
            }
            if (target.department && isSameDepartment(currentUser.department, target.department)) return true;
          }
        }
      }
      return false;
    },
    [currentUser, isSuperAdmin, isManager, isApprover, uid, allUsers]
  );

  // Filtered collections
  const leaves = useMemo(() => {
    return filterUserLeaves(rawLeaves, currentUser, isApprover ? 'all' : 'my');
  }, [rawLeaves, currentUser, isApprover]);

  const attendances = useMemo(() => {
    return filterUserAttendances(rawAttendances, currentUser, isApprover ? 'all' : 'my');
  }, [rawAttendances, currentUser, isApprover]);

  const gatePasses = useMemo(() => {
    return filterUserGatePasses(rawGatePasses, currentUser, isApprover || isSecurity ? 'all' : 'my');
  }, [rawGatePasses, currentUser, isApprover, isSecurity]);

  const foodRegistrations = useMemo(() => {
    return filterUserFoodRegistrations(rawFoods, currentUser, isApprover || isSecurity ? 'all' : 'my');
  }, [rawFoods, currentUser, isApprover, isSecurity]);

  const proposals = useMemo(() => {
    return filterUserRepairProposals(rawProposals, currentUser, isSuperAdmin || isMaintenance || isManager ? 'all' : 'my');
  }, [rawProposals, currentUser, isSuperAdmin, isMaintenance, isManager]);

  // Announcements list (pinned first, then newest)
  const announcements = useMemo(() => {
    return [...announcementsList].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [announcementsList]);

  // Pending counts & queues strictly complying with RBAC
  const pendingLeaves = useMemo(() => {
    if (!currentUser) return [];
    return rawLeaves.filter((l) => {
      if (l.status !== 'pending') return false;
      return isManagedByViewer(l.employeeId, l.department);
    });
  }, [rawLeaves, currentUser, isManagedByViewer]);

  const pendingAttendances = useMemo(() => {
    if (!currentUser) return [];
    return rawAttendances.filter((a) => {
      if (a.status !== 'pending') return false;
      return isManagedByViewer(a.employeeId, a.department);
    });
  }, [rawAttendances, currentUser, isManagedByViewer]);

  const activeGatePasses = useMemo(() => {
    if (!currentUser) return [];
    return rawGatePasses.filter((g) => {
      const isActive = g.status === 'approved' || g.status === 'departed' || g.status === 'pending';
      if (!isActive) return false;
      if (isSecurity) return true;
      return isManagedByViewer(g.employeeId, g.department);
    });
  }, [rawGatePasses, currentUser, isSecurity, isManagedByViewer]);

  const pendingFoods = useMemo(() => {
    if (!currentUser) return [];
    return rawFoods.filter((f) => {
      if (f.status !== 'pending_dept' && f.status !== 'pending_hr') return false;
      return isManagedByViewer(f.employeeId || f.createdById, f.department);
    });
  }, [rawFoods, currentUser, isManagedByViewer]);

  const activeFoodRegistrations = useMemo(() => {
    if (!currentUser) return [];
    return rawFoods.filter((f) => {
      if (f.status !== 'approved' && f.status !== 'confirmed') return false;
      const v = checkFoodQrValidity(f);
      if (v.isExpired) return false;
      if (isSecurity) return true;
      return isManagedByViewer(f.employeeId || f.createdById, f.department);
    });
  }, [rawFoods, currentUser, isSecurity, isManagedByViewer]);

  const pendingProposals = useMemo(() => {
    if (!currentUser) return [];
    let repairList: any[] = [];
    if (!isSuperAdmin && !isMaintenance && !isManager) {
      repairList = rawProposals.filter((p) => p.employeeId?.toLowerCase() === uid && p.status !== 'completed' && p.status !== 'rejected');
    } else {
      repairList = rawProposals.filter((p) => {
        if (p.status === 'completed' || p.status === 'rejected') return false;
        if (isMaintenance && p.status === 'maintenance_pending') return true;
        return isManagedByViewer(p.employeeId, p.department);
      });
    }

    const stationeryList = rawStationery.filter((s: any) => {
      if (s.status === 'approved' || s.status === 'rejected') return false;
      return isManagedByViewer(s.createdById, s.department);
    });

    const generalList = rawGeneral.filter((g: any) => {
      if (g.status === 'completed' || g.status === 'rejected') return false;
      return isManagedByViewer(g.employeeId, g.department);
    });

    const cameraList = rawCamera.filter((c: any) => {
      if (c.status === 'approved' || c.status === 'rejected') return false;
      if (isITStaff(currentUser) && c.status === 'pending_it') return true;
      if (isHRHead(currentUser) && c.status === 'pending_hr') return true;
      return isManagedByViewer(c.employeeId, c.department);
    });

    return [...repairList, ...stationeryList, ...generalList, ...cameraList];
  }, [rawProposals, rawStationery, rawGeneral, rawCamera, currentUser, isSuperAdmin, isMaintenance, isManager, uid, isManagedByViewer]);

  const pendingOvertime = useMemo(() => {
    if (!currentUser) return [];
    return rawOvertime.filter((o) => {
      if (o.status !== 'pending') return false;
      const isParticipant = o.items?.some((it) => it.employeeId?.toLowerCase() === uid);
      if (isParticipant) return true;
      return isManagedByViewer(o.createdById, o.department);
    });
  }, [rawOvertime, currentUser, uid, isManagedByViewer]);

  // Unified Actionable Task Items (Chỉ hiển thị các mục mà người lao động được phân quyền)
  const taskItems: DashboardTaskItem[] = useMemo(() => {
    const list: DashboardTaskItem[] = [];

    // Leaves
    if (hasPermission('leave')) {
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
    }

    // Attendance
    if (hasPermission('attendance')) {
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
    }

    // Food
    if (hasPermission('food_registration')) {
      // 1. Pending food registrations
      pendingFoods.forEach((item) => {
        list.push({
          id: item.id,
          type: 'food',
          typeLabel: 'Thực phẩm',
          typeBadgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
          title: `${item.employeeName} (${item.employeeId})`,
          subtitle: `${item.department} • ${FOOD_CATEGORY_LABELS[item.category] || item.category} (${item.foodDetails || item.customFoodDetails || 'Thực phẩm'}) - Ngày ${formatDate(item.entryDate)}`,
          dateStr: formatDate(item.createdAt),
          statusText: item.status === 'pending_dept' ? 'Chờ Trưởng BP' : 'Chờ TP HCNS',
          statusBadgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
          targetTab: 'food_registration',
        });
      });

      // 2. Active approved food registrations (like vegetarian or approved medicine)
      activeFoodRegistrations.forEach((item) => {
        list.push({
          id: item.id,
          type: 'food',
          typeLabel: 'Thực phẩm',
          typeBadgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
          title: `${item.employeeName} (${item.employeeId})`,
          subtitle: `${item.department} • ${FOOD_CATEGORY_LABELS[item.category] || item.category} (${item.foodDetails || item.customFoodDetails || 'Thực phẩm'}) - Ngày ${formatDate(item.entryDate)}`,
          dateStr: formatDate(item.createdAt),
          statusText: item.status === 'confirmed' ? 'Đã vào cổng' : 'Đã duyệt (Mã QR)',
          statusBadgeColor: item.status === 'confirmed'
            ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          targetTab: 'food_registration',
        });
      });
    }

    // Proposals
    if (hasPermission('repair')) {
      pendingProposals.forEach((item: any) => {
        const isRepair = !!item.issueDescription;
        const isStationery = !!item.items && !item.issueDescription && !item.areaDescription;
        const isCamera = !!item.areaDescription || (item.id && String(item.id).startsWith('CAM'));
        const typeLabel = isRepair
          ? 'Đề xuất sửa chữa'
          : isStationery
          ? 'Đề xuất VPP'
          : isCamera
          ? 'Đăng ký Camera'
          : 'Đề xuất chung';
        const subtitle = isRepair
          ? `${item.department} • Vị trí: ${item.location} - ${item.issueDescription}`
          : isStationery
          ? `${item.department} • Văn phòng phẩm (${item.items?.length || 0} món)`
          : isCamera
          ? `${item.department} • Trích xuất camera (${item.areaDescription || item.reason || 'Xem camera'})`
          : `${item.department} • ${item.title || item.description || 'Đề xuất khác'}`;
        const targetTab = isCamera ? 'camera' : 'proposals';
        const statusText =
          item.status === 'pending_manager'
            ? 'Chờ Trưởng BP'
            : item.status === 'maintenance_pending'
            ? 'Chờ Cơ điện'
            : item.status === 'pending_hr'
            ? 'Chờ TP HCNS'
            : item.status === 'pending_it'
            ? 'Chờ IT'
            : 'Chờ duyệt';

        list.push({
          id: item.id,
          type: 'proposal',
          typeLabel,
          typeBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          title: `${item.employeeName || item.createdByName} (${item.employeeId || item.createdById})`,
          subtitle,
          dateStr: formatDate(item.createdAt),
          statusText,
          statusBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          targetTab,
        });
      });
    }

    // Overtime
    if (hasPermission('overtime')) {
      pendingOvertime.forEach((item) => {
        list.push({
          id: item.id,
          type: 'proposal',
          typeLabel: 'Làm thêm giờ',
          typeBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          title: `${item.createdByName || item.department} (${item.createdById})`,
          subtitle: `${item.department} • Đăng ký tăng ca (${item.items?.length || 0} người) - Ngày ${formatDate(item.registrationDate)}`,
          dateStr: formatDate(item.createdAt),
          statusText: 'Chờ duyệt',
          statusBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          targetTab: 'overtime',
        });
      });
    }

    return list;
  }, [hasPermission, pendingLeaves, pendingAttendances, pendingFoods, activeFoodRegistrations, pendingProposals, pendingOvertime]);

  const leaveCount = useMemo(() => taskItems.filter((t) => t.type === 'leave').length, [taskItems]);
  const attendanceCount = useMemo(() => taskItems.filter((t) => t.type === 'attendance').length, [taskItems]);
  const foodCount = useMemo(() => taskItems.filter((t) => t.type === 'food').length, [taskItems]);
  const proposalCount = useMemo(() => taskItems.filter((t) => t.type === 'proposal').length, [taskItems]);

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

  // Metric Cards filtered by User Permissions
  const metricCards = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      count: number;
      label: string;
      hasPending?: boolean;
      pendingCount?: number;
      icon: any;
      colorBg: string;
      colorText: string;
      hoverBorder: string;
      tab: string;
    }> = [];

    if (hasPermission('leave')) {
      const pCount = pendingLeaves.length;
      list.push({
        id: 'leave',
        title: 'Nghỉ phép',
        count: pCount,
        label: 'Đang chờ duyệt',
        hasPending: pCount > 0,
        pendingCount: pCount,
        icon: CalendarDays,
        colorBg: 'bg-blue-50 dark:bg-blue-950/60',
        colorText: 'text-blue-600 dark:text-blue-400',
        hoverBorder: 'hover:border-blue-400 dark:hover:border-blue-700',
        tab: 'leave',
      });
    }

    if (hasPermission('attendance')) {
      const pCount = pendingAttendances.length;
      list.push({
        id: 'attendance',
        title: 'Xác nhận công',
        count: pCount,
        label: 'Quên / Mất thẻ',
        hasPending: pCount > 0,
        pendingCount: pCount,
        icon: Clock,
        colorBg: 'bg-amber-50 dark:bg-amber-950/60',
        colorText: 'text-amber-600 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-700',
        tab: 'attendance',
      });
    }

    if (hasPermission('gate_pass')) {
      list.push({
        id: 'gate_pass',
        title: 'Ra vào cổng',
        count: activeGatePasses.length,
        label: 'Đang lưu hành',
        hasPending: false,
        pendingCount: 0,
        icon: QrCode,
        colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        colorText: 'text-emerald-600 dark:text-emerald-400',
        hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-700',
        tab: 'gate_pass',
      });
    }

    if (hasPermission('food_registration')) {
      const pCount = pendingFoods.length;
      const aCount = activeFoodRegistrations.length;
      list.push({
        id: 'food_registration',
        title: 'Thực phẩm mang vào',
        count: pCount > 0 ? pCount : aCount,
        label: pCount > 0
          ? (aCount > 0 ? `${pCount} chờ duyệt • ${aCount} mã QR` : 'Chờ phê duyệt')
          : 'Mã QR hiệu lực',
        hasPending: pCount > 0,
        pendingCount: pCount,
        icon: UtensilsCrossed,
        colorBg: 'bg-teal-50 dark:bg-teal-950/60',
        colorText: 'text-teal-600 dark:text-teal-400',
        hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-700',
        tab: 'food_registration',
      });
    }

    const canRepair = hasPermission('repair');
    const canOT = hasPermission('overtime');
    if (canRepair || canOT) {
      const pCount = (canRepair ? pendingProposals.length : 0) + (canOT ? pendingOvertime.length : 0);
      const title = canRepair && canOT ? 'Đề xuất & Thêm giờ' : canRepair ? 'Phiếu đề xuất' : 'Làm thêm giờ';
      const targetTab = canRepair ? 'proposals' : 'overtime';
      list.push({
        id: 'proposals_ot',
        title,
        count: pCount,
        label: 'Chờ phê duyệt',
        hasPending: pCount > 0,
        pendingCount: pCount,
        icon: Timer,
        colorBg: 'bg-purple-50 dark:bg-purple-950/60',
        colorText: 'text-purple-600 dark:text-purple-400',
        hoverBorder: 'hover:border-purple-400 dark:hover:border-purple-700',
        tab: targetTab,
      });
    }

    return list;
  }, [
    hasPermission,
    pendingLeaves.length,
    pendingAttendances.length,
    activeGatePasses.length,
    activeFoodRegistrations.length,
    pendingFoods.length,
    pendingProposals.length,
    pendingOvertime.length,
  ]);

  const gridColsClass = useMemo(() => {
    switch (metricCards.length) {
      case 1:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 2:
        return 'grid-cols-2 lg:grid-cols-4';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-2 lg:grid-cols-5';
    }
  }, [metricCards.length]);

  // Quick Action Shortcuts definition
  const quickActions = [
    { id: 'leave', label: 'Đơn nghỉ phép', icon: CalendarDays, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' },
    { id: 'attendance', label: 'Xác nhận công', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
    { id: 'gate_pass', label: 'Ra vào cổng', icon: QrCode, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
    { id: 'overtime', label: 'Làm thêm giờ', icon: Timer, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900' },
    { id: 'food_registration', label: 'Thực phẩm mang vào', icon: UtensilsCrossed, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900' },
    { id: 'proposals', label: 'Phiếu đề xuất', icon: ClipboardList, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900' },
    { id: 'pccc', label: 'Kiểm tra PCCC', icon: Flame, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900' },
    { id: 'gas_inspection', label: 'Kiểm tra Gas', icon: Fuel, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
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

            {/* Nút đăng xuất nhanh trên điện thoại */}
            <div className="sm:hidden pt-1">
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold transition-colors cursor-pointer"
                title="Đăng xuất khỏi hệ thống"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {isSecurityRole(currentUser) && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => onNavigateTab('gate_pass')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Kiểm soát ra vào cổng</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thông báo / Thông cáo nổi bật khi có nhân viên tạo phiếu mới chờ xử lý */}
      {taskItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-bounce">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 min-w-0">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                Thông báo hồ sơ &amp; phiếu mới:
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Hiện có <span className="font-bold text-amber-600 dark:text-amber-400">{taskItems.length} phiếu</span> đang chờ bạn hoặc cấp quản lý xem xét và giải quyết.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstTask = taskItems[0];
              if (firstTask) onNavigateTab(firstTask.targetTab);
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
          >
            <span>Xem phiếu</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. Key Operational Metric Cards (Chỉ hiển thị các mục mà người lao động được phân quyền) */}
      {metricCards.length > 0 && (
        <div className={`grid ${gridColsClass} gap-3 sm:gap-4`}>
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigateTab(card.tab)}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer ${card.hoverBorder} hover:shadow-md transition-all group relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {card.title}
                    </span>
                    {card.hasPending && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white shadow-xs animate-pulse">
                        {card.pendingCount} chờ duyệt
                      </span>
                    )}
                  </div>
                  <div className={`p-2 ${card.colorBg} ${card.colorText} rounded-xl group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {card.count}
                  </div>
                  <p className={`text-[11px] ${card.colorText} font-medium mt-0.5 flex items-center justify-between`}>
                    <span>{card.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                {hasPermission('leave') && (
                  <button
                    type="button"
                    onClick={() => setActiveTaskTab('leave')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTaskTab === 'leave'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Phép ({leaveCount})
                  </button>
                )}
                {hasPermission('attendance') && (
                  <button
                    type="button"
                    onClick={() => setActiveTaskTab('attendance')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTaskTab === 'attendance'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Công ({attendanceCount})
                  </button>
                )}
                {hasPermission('food_registration') && (
                  <button
                    type="button"
                    onClick={() => setActiveTaskTab('food')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTaskTab === 'food'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Thực phẩm ({foodCount})
                  </button>
                )}
                {hasPermission('repair') && (
                  <button
                    type="button"
                    onClick={() => setActiveTaskTab('proposal')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTaskTab === 'proposal'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Đề xuất ({proposalCount})
                  </button>
                )}
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
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1">
                {filteredTasks.map((task) => (
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
