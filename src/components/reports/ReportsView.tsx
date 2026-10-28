'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { exportReportToExcel, exportStationeryReportToExcel, exportPCCCReportToExcel, formatPCCCChecklistSummary } from '@/lib/excel';
import {
  Flame,
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Clock,
  CalendarDays,
  QrCode,
  Building2,
  Utensils,
  Search,
  RotateCcw,
  Wrench,
  Package,
  FileQuestion,
} from 'lucide-react';
import { formatDate, formatDateTime, sortNewestFirst } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { RepairProposal, REPAIR_STATUS_LABELS, REPAIR_STATUS_BADGES } from '@/types/repair';
import { PCCCDevice, PCCCInspection, PCCC_CATEGORIES } from '@/types/pccc';
import {
  StationeryProposal,
  GeneralProposal,
  STATIONERY_STATUS_LABELS,
  STATIONERY_STATUS_BADGES,
  GENERAL_STATUS_LABELS,
  GENERAL_STATUS_BADGES,
} from '@/types/proposal';
import { filterUserLeaves, filterUserAttendances, filterUserGatePasses, filterUserRepairProposals, filterUserStationeryProposals, filterUserGeneralProposals } from '@/lib/permissions';

export function ReportsView() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<'leave' | 'attendance' | 'gate_pass' | 'meal_cut' | 'repair' | 'stationery' | 'general' | 'departments' | 'pccc'>('leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const departments = storage.getDepartments();
  const users = storage.getUsers();

  const leaves = useMemo(() => {
    return filterUserLeaves(storage.getLeaveRequests(), currentUser, 'all', users);
  }, [currentUser, users]);

  const attendances = useMemo(() => {
    return filterUserAttendances(storage.getAttendanceConfirms(), currentUser, 'all');
  }, [currentUser]);

  const gatePasses = useMemo(() => {
    return filterUserGatePasses(storage.getGatePasses(), currentUser, 'all');
  }, [currentUser]);

  const repairs = useMemo(() => {
    return filterUserRepairProposals(storage.getRepairProposals(), currentUser, 'all');
  }, [currentUser]);

  const stationeries = useMemo(() => {
    return filterUserStationeryProposals(storage.getStationeryProposals(), currentUser, 'all');
  }, [currentUser]);

  const generals = useMemo(() => {
    return filterUserGeneralProposals(storage.getGeneralProposals(), currentUser, 'all');
  }, [currentUser]);

  // All leave requests where Economic staff has confirmed cutting meals
  const mealCutLeaves = useMemo(() => {
    return leaves.filter((l) =>
      l.steps.some((s) => s.roleRequired === 'economic' && s.status === 'approved')
    );
  }, [leaves]);

  // Filter handlers
  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFromDate(today);
    setToDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setFromDate(firstDay);
    setToDate(lastDay);
  };

  const handleResetFilters = () => {
    setDepartmentFilter('all');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    departmentFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    searchTerm.trim() !== '' ||
    statusFilter !== 'all';

  // 1. Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return sortNewestFirst(leaves.filter((l) => {
      if (departmentFilter !== 'all' && l.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          l.id.toLowerCase().includes(q) ||
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          (l.department && l.department.toLowerCase().includes(q));
        if (!match) return false;
      }
      const start = l.fromDate || (l.createdAt ? l.createdAt.slice(0, 10) : '');
      const end = l.toDate || start;
      if (fromDate && end && end < fromDate) return false;
      if (toDate && start && start > toDate) return false;
      return true;
    }));
  }, [leaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 2. Filtered Attendances
  const filteredAttendances = useMemo(() => {
    return sortNewestFirst(attendances.filter((a) => {
      if (departmentFilter !== 'all' && a.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          a.id.toLowerCase().includes(q) ||
          a.employeeId.toLowerCase().includes(q) ||
          a.employeeName.toLowerCase().includes(q) ||
          (a.reason && a.reason.toLowerCase().includes(q)) ||
          (a.department && a.department.toLowerCase().includes(q)) ||
          (a.shift && a.shift.toLowerCase().includes(q));
        if (!match) return false;
      }
      const aDate = a.date || (a.createdAt ? a.createdAt.slice(0, 10) : '');
      if (fromDate && aDate && aDate < fromDate) return false;
      if (toDate && aDate && aDate > toDate) return false;
      return true;
    }));
  }, [attendances, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 3. Filtered Gate Passes
  const filteredGatePasses = useMemo(() => {
    return sortNewestFirst(gatePasses.filter((gp) => {
      if (departmentFilter !== 'all' && gp.department !== departmentFilter) return false;
      if (statusFilter !== 'all') {
        if (gp.status !== statusFilter) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          gp.id.toLowerCase().includes(q) ||
          gp.employeeId.toLowerCase().includes(q) ||
          gp.employeeName.toLowerCase().includes(q) ||
          (gp.purpose && gp.purpose.toLowerCase().includes(q)) ||
          (gp.department && gp.department.toLowerCase().includes(q)) ||
          (gp.shift && gp.shift.toLowerCase().includes(q));
        if (!match) return false;
      }
      const gpDate = (gp.actualDepartureTime || gp.estimatedDepartureTime || gp.createdAt || '').slice(0, 10);
      if (fromDate && gpDate && gpDate < fromDate) return false;
      if (toDate && gpDate && gpDate > toDate) return false;
      return true;
    }));
  }, [gatePasses, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 4. Filtered Meal Cut Leaves
  const filteredMealCutLeaves = useMemo(() => {
    return sortNewestFirst(mealCutLeaves.filter((l) => {
      if (departmentFilter !== 'all' && l.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          l.id.toLowerCase().includes(q) ||
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          (l.department && l.department.toLowerCase().includes(q));
        if (!match) return false;
      }
      const start = l.fromDate || (l.createdAt ? l.createdAt.slice(0, 10) : '');
      const end = l.toDate || start;
      if (fromDate && end && end < fromDate) return false;
      if (toDate && start && start > toDate) return false;
      return true;
    }));
  }, [mealCutLeaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5. Filtered Repair Proposals
  const filteredRepairs = useMemo(() => {
    return sortNewestFirst(repairs.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.issueDescription.toLowerCase().includes(q) ||
          (p.proposedSolution && p.proposedSolution.toLowerCase().includes(q));
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [repairs, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5b. Filtered Stationery Proposals
  const filteredStationeries = useMemo(() => {
    return sortNewestFirst(stationeries.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const itemsStr = p.items.map((i) => `${i.itemId} ${i.itemName}`).join(' ').toLowerCase();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          itemsStr.includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [stationeries, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5c. Filtered General Proposals
  const filteredGenerals = useMemo(() => {
    return sortNewestFirst(generals.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.receiverDepartment.toLowerCase().includes(q) ||
          (p.receiverUserName && p.receiverUserName.toLowerCase().includes(q)) ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q);
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [generals, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 6. Filtered Departments
  const pcccDevices = useMemo(() => storage.getPCCCDevices(), []);
  const pcccInspections = useMemo(() => storage.getPCCCInspections(), []);

  const filteredPCCCDevices = useMemo(() => {
    return pcccDevices.filter((d) => {
      if (statusFilter === 'pass' && d.lastInspection?.status !== 'pass') return false;
      if (statusFilter === 'fail' && d.lastInspection?.status !== 'fail') return false;
      if (statusFilter === 'none' && d.lastInspection) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.specs.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pcccDevices, statusFilter, searchTerm]);
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (departmentFilter !== 'all' && d.name !== departmentFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.managerName && d.managerName.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [departments, departmentFilter, searchTerm]);

  // Current active result count
  const currentCount =
    reportType === 'leave'
      ? filteredLeaves.length
      : reportType === 'attendance'
      ? filteredAttendances.length
      : reportType === 'gate_pass'
      ? filteredGatePasses.length
      : reportType === 'meal_cut'
      ? filteredMealCutLeaves.length
      : reportType === 'repair'
      ? filteredRepairs.length
      : reportType === 'stationery'
      ? filteredStationeries.length
      : reportType === 'general'
      ? filteredGenerals.length
      : reportType === 'pccc' ? filteredPCCCDevices.length : filteredDepartments.length;

  // Export to Excel handler
  const handleExportExcel = () => {
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const subtitle =
      (departmentFilter !== 'all' ? `Phòng ban: ${departmentFilter} • ` : '') +
      (fromDate && toDate
        ? `Từ ngày ${formatDate(fromDate)} đến ngày ${formatDate(toDate)}`
        : fromDate
        ? `Từ ngày ${formatDate(fromDate)}`
        : toDate
        ? `Đến ngày ${formatDate(toDate)}`
        : 'Tất cả thời gian');

    let title = '';
    let fileName = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'leave') {
      title = 'NGHỈ PHÉP';
      fileName = `LONGKHAI_Bao_Cao_NGHI_PHEP_${nowStr}`;
      headers = [
        'Mã đơn',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Loại nghỉ phép',
        'Thời gian nghỉ',
        'Số ngày',
        'Lý do',
        'Trạng thái',
      ];
      rows = filteredLeaves.map((l) => [
        l.id,
        l.employeeId,
        l.employeeName,
        l.department,
        LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
        `${formatDate(l.fromDate)} → ${formatDate(l.toDate)}`,
        l.totalDays,
        l.reason || '',
        l.status === 'approved'
          ? 'Đã duyệt'
          : l.status === 'pending'
          ? 'Chờ duyệt'
          : l.status === 'rejected'
          ? 'Từ chối'
          : 'Đã hủy',
      ]);
    } else if (reportType === 'attendance') {
      title = 'XÁC NHẬN CÔNG';
      fileName = `LONGKHAI_Bao_Cao_XAC_NHAN_CONG_${nowStr}`;
      headers = [
        'Mã phiếu',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Lý do sự cố',
        'Ngày',
        'Ca làm việc',
        'Giờ vào thực tế',
        'Giờ ra thực tế',
        'Trạng thái',
      ];
      rows = filteredAttendances.map((a) => [
        a.id,
        a.employeeId,
        a.employeeName,
        a.department,
        ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType,
        formatDate(a.date),
        a.shift,
        a.actualCheckIn || '',
        a.actualCheckOut || '',
        a.status === 'approved'
          ? 'Đã duyệt'
          : a.status === 'pending'
          ? 'Chờ duyệt'
          : 'Từ chối',
      ]);
    } else if (reportType === 'gate_pass') {
      title = 'RA VÀO CỔNG & TÀI SẢN';
      fileName = `LONGKHAI_Bao_Cao_RA_VAO_CONG_${nowStr}`;
      headers = [
        'Mã phiếu',
        'Nhân viên',
        'Phòng ban',
        'Mục đích',
        'Tài sản mang theo',
        'Ca làm việc',
        'Giờ ra thực tế',
        'Giờ vào thực tế',
        'Trạng thái',
      ];
      rows = filteredGatePasses.map((gp) => {
        const empText = `${gp.employeeName} (${gp.employeeId})`;
        const assetStr =
          gp.hasAssets && gp.assets && gp.assets.length > 0
            ? gp.assets.map((a) => `${a.name} (${a.quantity})`).join(', ')
            : '';
        const depTime = gp.actualDepartureTime
          ? formatDateTime(gp.actualDepartureTime)
          : gp.timeType === 'nghi_dau_gio'
          ? ''
          : gp.estimatedDepartureTime && gp.status === 'approved'
          ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}`
          : '';
        const retTime =
          gp.timeType === 'nghi_cuoi_gio'
            ? ''
            : gp.actualReturnTime
            ? formatDateTime(gp.actualReturnTime)
            : gp.estimatedReturnTime && gp.status === 'approved'
            ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}`
            : '';
        const statusStr =
          gp.status === 'approved'
            ? 'Đã duyệt'
            : gp.status === 'departed'
            ? 'Đang ra ngoài'
            : gp.status === 'completed'
            ? 'Hoàn tất'
            : gp.status === 'pending'
            ? 'Chờ duyệt'
            : gp.status === 'rejected'
            ? 'Từ chối'
            : 'Hết hạn';

        return [
          gp.id,
          empText,
          gp.department,
          gp.purpose,
          assetStr,
          gp.shift || '',
          depTime,
          retTime,
          statusStr,
        ];
      });
    } else if (reportType === 'meal_cut') {
      title = 'CẮT CƠM NHÂN VIÊN';
      fileName = `LONGKHAI_Bao_Cao_CAT_COM_${nowStr}`;
      headers = [
        'STT',
        'Mã đơn',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Loại nghỉ',
        'Thời gian nghỉ',
        'Số ngày cắt cơm',
        'NV Kinh tế xác nhận',
        'Thời gian xác nhận',
        'Trạng thái',
      ];
      rows = filteredMealCutLeaves.map((l, idx) => {
        const ecoStep = l.steps.find((s) => s.roleRequired === 'economic');
        return [
          idx + 1,
          l.id,
          l.employeeId,
          l.employeeName,
          l.department,
          LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
          `${formatDate(l.fromDate)} → ${formatDate(l.toDate)}`,
          `${l.totalDays} ngày`,
          ecoStep?.approverName || 'Nhân viên kinh tế',
          ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận',
          'Đã cắt cơm',
        ];
      });
    } else if (reportType === 'repair') {
      title = 'ĐỀ XUẤT SỬA CHỮA';
      fileName = `LONGKHAI_Bao_Cao_DE_XUAT_SUA_CHUA_${nowStr}`;
      headers = [
        'STT',
        'Mã phiếu',
        'Thời gian gửi',
        'MSNV',
        'Họ tên nhân viên',
        'Tổ / Bộ phận',
        'Khu vực thiết bị',
        'Tình trạng sự việc',
        'Đề xuất hướng khắc phục',
        'Trạng thái',
        'Thời gian hoàn thành',
      ];
      rows = filteredRepairs.map((p, idx) => [
        idx + 1,
        p.id,
        formatDateTime(p.createdAt),
        p.employeeId,
        p.employeeName,
        p.department,
        p.location,
        p.issueDescription,
        p.proposedSolution || p.managerComment || '',
        REPAIR_STATUS_LABELS[p.status] || p.status,
        p.creatorConfirmedAt ? formatDateTime(p.creatorConfirmedAt) : '',
      ]);
    } else if (reportType === 'stationery') {
      if (filteredStationeries.length === 0) {
        alert('Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel.');
        return;
      }
      exportStationeryReportToExcel({
        proposals: filteredStationeries,
        subtitle,
        docCode: 'BC-LK-2026/01',
        fileName: `LONGKHAI_Bao_Cao_DE_XUAT_VPP_${nowStr}`,
      });
      return;
    } else if (reportType === 'general') {
      title = 'ĐỀ XUẤT KHÁC';
      fileName = `LONGKHAI_Bao_Cao_DE_XUAT_KHAC_${nowStr}`;
      headers = [
        'STT',
        'Mã phiếu',
        'Thời gian gửi',
        'MSNV',
        'Họ tên nhân viên',
        'Tổ / Bộ phận',
        'Bộ phận tiếp nhận',
        'Tiêu đề đề xuất',
        'Nội dung chi tiết',
        'Trạng thái',
      ];
      rows = filteredGenerals.map((p, idx) => [
        idx + 1,
        p.id,
        formatDateTime(p.createdAt),
        p.employeeId,
        p.employeeName,
        p.department,
        p.receiverUserName ? `${p.receiverUserName} (${p.receiverDepartment})` : p.receiverDepartment,
        p.title,
        p.content,
        GENERAL_STATUS_LABELS[p.status] || p.status,
      ]);
    } else if (reportType === 'pccc') {
      if (filteredPCCCDevices.length === 0) {
        alert('Không có dữ liệu thiết bị PCCC phù hợp với bộ lọc hiện tại để xuất file Excel.');
        return;
      }
      exportPCCCReportToExcel({
        devices: filteredPCCCDevices,
        inspections: pcccInspections,
        subtitle,
        docCode: 'BC-LK-PCCC/2026',
        fileName: `LONGKHAI_Bao_Cao_PCCC_${nowStr}`,
      });
      return;
    } else if (reportType === 'departments') {
      title = 'CƠ CẤU PHÒNG BAN';
      fileName = `LONGKHAI_Bao_Cao_PHONG_BAN_${nowStr}`;
      headers = [
        'Mã phòng ban',
        'Tên phòng ban',
        'Mô tả chức năng',
        'Trưởng bộ phận',
        'Số nhân sự',
      ];
      rows = filteredDepartments.map((d) => [
        d.code,
        d.name,
        d.description || '',
        d.managerName || 'Chưa chỉ định',
        `${users.filter((u) => u.department === d.name).length} người`,
      ]);
    }

    if (rows.length === 0) {
      alert('Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel.');
      return;
    }

    exportReportToExcel({
      title,
      subtitle,
      docCode: 'BC-LK-2026/01',
      headers,
      rows,
      fileName,
    });
  };

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS (Hidden completely on print/PDF) */}
      <div className="space-y-6 no-print print:hidden">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Báo Cáo & Thống Kê Tổng Hợp
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu số liệu, lọc dữ liệu đa chiều, xuất file Excel và in ấn báo cáo chuẩn quy cách nhà máy
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / PDF</span>
          </button>
        </div>
      </div>

      {/* Select Report Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <button
          onClick={() => setReportType('leave')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'leave'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <CalendarDays className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Nghỉ phép</div>
          <div className="text-[11px] text-slate-500">
            {filteredLeaves.length} đơn {hasActiveFilters && `(${leaves.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('attendance')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'attendance'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Xác nhận công</div>
          <div className="text-[11px] text-slate-500">
            {filteredAttendances.length} phiếu {hasActiveFilters && `(${attendances.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('gate_pass')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'gate_pass'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <QrCode className="w-5 h-5 text-emerald-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Ra vào cổng</div>
          <div className="text-[11px] text-slate-500">
            {filteredGatePasses.length} lượt {hasActiveFilters && `(${gatePasses.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('repair')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'repair'
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-sm ring-1 ring-orange-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Wrench className="w-5 h-5 text-orange-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Đề xuất sửa chữa</div>
          <div className="text-[11px] text-slate-500">
            {filteredRepairs.length} đề xuất {hasActiveFilters && `(${repairs.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('meal_cut')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'meal_cut'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm ring-1 ring-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Utensils className="w-5 h-5 text-rose-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cắt cơm</div>
          <div className="text-[11px] text-slate-500">
            {filteredMealCutLeaves.length} lượt {hasActiveFilters && `(${mealCutLeaves.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('stationery')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'stationery'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Package className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Văn phòng phẩm</div>
          <div className="text-[11px] text-slate-500">
            {filteredStationeries.length} đề xuất {hasActiveFilters && `(${stationeries.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('general')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'general'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <FileQuestion className="w-5 h-5 text-purple-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Đề xuất khác</div>
          <div className="text-[11px] text-slate-500">
            {filteredGenerals.length} đề xuất {hasActiveFilters && `(${generals.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('pccc')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'pccc'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-red-500 shadow-sm ring-1 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Flame className="w-5 h-5 text-red-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Kiểm tra PCCC</div>
          <div className="text-[11px] text-slate-500">
            {filteredPCCCDevices.length} thiết bị {hasActiveFilters && `(${pcccDevices.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => setReportType('departments')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'departments'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-5 h-5 text-purple-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cơ cấu phòng ban</div>
          <div className="text-[11px] text-slate-500">
            {filteredDepartments.length} phòng ban
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã, họ tên, lý do..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Phòng ban:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (for requests) */}
          {reportType !== 'departments' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Trạng thái:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="approved">Đã duyệt / Hoàn tất</option>
                <option value="pending">Chờ duyệt</option>
                <option value="rejected">Từ chối</option>
                {reportType === 'gate_pass' && (
                  <>
                    <option value="departed">Đang ra ngoài</option>
                    <option value="completed">Đã về lại</option>
                  </>
                )}
                {reportType === 'repair' && (
                  <>
                    <option value="pending_manager">Bước 2: Chờ Trưởng BP duyệt</option>
                    <option value="maintenance_pending">Bước 3: Chờ Cơ điện sửa chữa</option>
                    <option value="pending_confirmation">Bước 4: Chờ bạn xác nhận hoàn tất</option>
                    <option value="completed">Đã hoàn tất</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Từ ngày"
              title="Lọc từ ngày"
            />
            <span className="text-slate-400">&rarr;</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Đến ngày"
              title="Lọc đến ngày"
            />

            {/* Quick date shortcuts */}
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-[11px] transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-[11px] transition-colors"
            >
              Tháng này
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            Đang lọc: <strong className="text-slate-700 dark:text-slate-300">{currentCount}</strong> kết quả phù hợp
            {departmentFilter !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md">
                Phòng: {departmentFilter}
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-md">
                Trạng thái: {statusFilter}
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-md">
                {fromDate ? `Từ ${formatDate(fromDate)}` : ''} {toDate ? `đến ${formatDate(toDate)}` : ''}
              </span>
            )}
            {searchTerm.trim() && (
              <span className="ml-2 px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-md">
                Từ khóa: &quot;{searchTerm.trim()}&quot;
              </span>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Printable Paper Document Container */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 print-document print:p-0 print:border-none print:shadow-none print:m-0">
        {/* Factory Formal Letterhead */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-row justify-between items-start text-xs gap-4 w-full print-header-letterhead">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Long Khai Logo"
              className="w-12 h-12 object-contain shrink-0"
            />
            <div>
              <div className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Hệ thống Quản trị & Điều hành Sản xuất Nội bộ
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 dark:text-slate-400 ml-auto shrink-0 print-header-right">
            <div className="whitespace-nowrap font-medium">Ngày xuất báo cáo: {formatDate(new Date().toISOString())}</div>
            <div className="font-mono font-bold whitespace-nowrap">
              {reportType === 'pccc' ? 'Mã tài liệu: BC-LK-PCCC/2026' : 'Mã tài liệu: BC-LK-2026/01'}
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center">
          <h2 className="text-base md:text-lg font-black uppercase text-slate-900 dark:text-white">
            BÁO CÁO TỔNG HỢP{' '}
            {reportType === 'meal_cut'
              ? 'CẮT CƠM NHÂN VIÊN'
              : reportType === 'leave'
              ? 'NGHỈ PHÉP'
              : reportType === 'attendance'
              ? 'XÁC NHẬN CÔNG'
              : reportType === 'gate_pass'
              ? 'RA VÀO CỔNG & TÀI SẢN'
              : reportType === 'repair'
              ? 'ĐỀ XUẤT SỬA CHỮA'
              : reportType === 'stationery'
              ? 'ĐỀ XUẤT VĂN PHÒNG PHẨM'
              : reportType === 'general'
              ? 'ĐỀ XUẤT KHÁC'
              : reportType === 'pccc'
              ? 'KIỂM TRA THIẾT BỊ PCCC'
              : 'CƠ CẤU PHÒNG BAN'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {departmentFilter !== 'all' ? `Phòng ban: ${departmentFilter} • ` : ''}
            {fromDate && toDate
              ? `Từ ngày ${formatDate(fromDate)} đến ngày ${formatDate(toDate)}`
              : fromDate
              ? `Từ ngày ${formatDate(fromDate)}`
              : toDate
              ? `Đến ngày ${formatDate(toDate)}`
              : 'Tất cả thời gian'}
          </p>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto">
          {/* LEAVE REPORT TABLE */}
          {reportType === 'leave' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã đơn</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Loại nghỉ</th>
                  <th className="p-2 border">Thời gian nghỉ</th>
                  <th className="p-2 border text-center">Số ngày</th>
                  <th className="p-2 border">Lý do</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu nghỉ phép phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{l.id}</td>
                      <td className="p-2 border text-center font-mono">{l.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </td>
                      <td className="p-2 border">{l.department}</td>
                      <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</td>
                      <td className="p-2 border text-center font-medium">
                        {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                      </td>
                      <td className="p-2 border text-center font-bold text-rose-600">
                        {l.totalDays}
                      </td>
                      <td className="p-2 border max-w-xs truncate text-slate-700 dark:text-slate-300" title={l.reason}>
                        {l.reason || ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : l.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : l.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {l.status === 'approved'
                            ? 'Đã duyệt'
                            : l.status === 'pending'
                            ? 'Chờ duyệt'
                            : l.status === 'rejected'
                            ? 'Từ chối'
                            : 'Đã hủy'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ATTENDANCE REPORT TABLE */}
          {reportType === 'attendance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Lý do</th>
                  <th className="p-2 border">Ngày</th>
                  <th className="p-2 border">Ca làm việc</th>
                  <th className="p-2 border">Giờ vào thực tế</th>
                  <th className="p-2 border">Giờ ra thực tế</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu xác nhận công phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{a.id}</td>
                      <td className="p-2 border text-center font-mono">{a.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {a.employeeName}
                      </td>
                      <td className="p-2 border">{a.department}</td>
                      <td className="p-2 border">{ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType}</td>
                      <td className="p-2 border text-center font-medium">{formatDate(a.date)}</td>
                      <td className="p-2 border text-center font-medium text-slate-700 dark:text-slate-300">
                        {a.shift}
                      </td>
                      <td className="p-2 border text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {a.actualCheckIn || ''}
                      </td>
                      <td className="p-2 border text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {a.actualCheckOut || ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : a.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {a.status === 'approved'
                            ? 'Đã duyệt'
                            : a.status === 'pending'
                            ? 'Chờ duyệt'
                            : 'Từ chối'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* GATE PASS REPORT TABLE */}
          {reportType === 'gate_pass' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Nhân viên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Mục đích</th>
                  <th className="p-2 border">Tài sản mang theo</th>
                  <th className="p-2 border">Ca làm việc</th>
                  <th className="p-2 border">Giờ ra thực tế</th>
                  <th className="p-2 border">Giờ vào thực tế</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredGatePasses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu ra vào cổng phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredGatePasses.map((gp) => (
                    <tr key={gp.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{gp.id}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {gp.employeeName} ({gp.employeeId})
                      </td>
                      <td className="p-2 border">{gp.department}</td>
                      <td className="p-2 border">{gp.purpose}</td>
                      <td className="p-2 border">
                        {gp.hasAssets && gp.assets && gp.assets.length > 0 ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {gp.assets.map((a) => `${a.name} (${a.quantity})`).join(', ')}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-2 border text-center font-medium text-slate-700 dark:text-slate-300">
                        {gp.shift || ''}
                      </td>
                      <td className="p-2 border text-center">
                        {gp.actualDepartureTime
                          ? formatDateTime(gp.actualDepartureTime)
                          : gp.timeType === 'nghi_dau_gio'
                          ? ''
                          : gp.estimatedDepartureTime && gp.status === 'approved'
                          ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}`
                          : ''}
                      </td>
                      <td className="p-2 border text-center">
                        {gp.timeType === 'nghi_cuoi_gio'
                          ? ''
                          : gp.actualReturnTime
                          ? formatDateTime(gp.actualReturnTime)
                          : gp.estimatedReturnTime && gp.status === 'approved'
                          ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}`
                          : ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gp.status === 'approved'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : gp.status === 'departed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : gp.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : gp.status === 'pending'
                              ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {gp.status === 'approved'
                            ? 'Đã duyệt'
                            : gp.status === 'departed'
                            ? 'Đang ra ngoài'
                            : gp.status === 'completed'
                            ? 'Hoàn tất'
                            : gp.status === 'pending'
                            ? 'Chờ duyệt'
                            : gp.status === 'rejected'
                            ? 'Từ chối'
                            : 'Hết hạn'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* MEAL CUT REPORT TABLE */}
          {reportType === 'meal_cut' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã đơn</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Loại nghỉ</th>
                  <th className="p-2 border">Thời gian nghỉ</th>
                  <th className="p-2 border text-center">Số ngày cắt cơm</th>
                  <th className="p-2 border">NV Kinh tế xác nhận</th>
                  <th className="p-2 border">Thời gian xác nhận</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredMealCutLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Chưa có nhân viên nào được xác nhận cắt cơm phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredMealCutLeaves.map((l, idx) => {
                    const ecoStep = l.steps.find((s) => s.roleRequired === 'economic');
                    return (
                      <tr key={l.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-blue-600">{l.id}</td>
                        <td className="p-2 border font-mono">{l.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">
                          {l.employeeName}
                        </td>
                        <td className="p-2 border">{l.department}</td>
                        <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</td>
                        <td className="p-2 border font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(l.fromDate)} &rarr; {formatDate(l.toDate)}
                        </td>
                        <td className="p-2 border text-center font-bold text-rose-600">
                          {l.totalDays} ngày
                        </td>
                        <td className="p-2 border font-medium text-emerald-700 dark:text-emerald-400">
                          {ecoStep?.approverName || 'Nhân viên kinh tế'}
                        </td>
                        <td className="p-2 border text-[11px] text-slate-500">
                          {ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận'}
                        </td>
                        <td className="p-2 border">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đã cắt cơm
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* REPAIR PROPOSALS REPORT TABLE */}
          {reportType === 'repair' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Thời gian gửi</th>
                  <th className="p-2 border">MSNV</th>
                  <th className="p-2 border">Họ tên nhân viên</th>
                  <th className="p-2 border">Tổ / Bộ phận</th>
                  <th className="p-2 border">Khu vực thiết bị</th>
                  <th className="p-2 border">Tình trạng sự việc</th>
                  <th className="p-2 border">Đề xuất hướng khắc phục</th>
                  <th className="p-2 border">Trạng thái</th>
                  <th className="p-2 border">Thời gian hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Không tìm thấy đề xuất sửa chữa nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((p, idx) => {
                    const badge = REPAIR_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-amber-600">{p.id}</td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="p-2 border font-mono text-slate-700 dark:text-slate-300">{p.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">
                          {p.employeeName}
                        </td>
                        <td className="p-2 border">{p.department}</td>
                        <td className="p-2 border font-medium text-slate-800 dark:text-slate-200">{p.location}</td>
                        <td className="p-2 border max-w-xs whitespace-pre-line" title={p.issueDescription}>
                          {p.issueDescription}
                        </td>
                        <td className="p-2 border max-w-xs whitespace-pre-line text-slate-700 dark:text-slate-300" title={p.proposedSolution || p.managerComment || ''}>
                          {p.proposedSolution || p.managerComment || '-'}
                        </td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {p.creatorConfirmedAt ? formatDateTime(p.creatorConfirmedAt) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* STATIONERY REPORT TABLE */}
          {reportType === 'stationery' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center w-12">STT</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Mã phiếu</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Thời gian gửi</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">MSNV</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Họ tên nhân viên</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Tổ / Bộ phận</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Mã VPP</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Tên văn phòng phẩm đề xuất</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Số lượng</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Trạng thái</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center w-24">Ký nhận</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredStationeries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      Không tìm thấy đề xuất văn phòng phẩm nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStationeries.map((p, idx) => {
                    const badge = STATIONERY_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    const items = p.items && p.items.length > 0 ? p.items : [{ itemId: '-', itemName: '-', unit: '', quantity: 0 }];
                    const rowSpan = items.length;

                    return (
                      <React.Fragment key={p.id}>
                        {/* First Item Row with merged common cells */}
                        <tr className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-500 align-middle">
                            {idx + 1}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-blue-600 text-center align-middle whitespace-nowrap">
                            {p.id}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-[11px] text-center text-slate-600 dark:text-slate-300 whitespace-nowrap align-middle">
                            {formatDateTime(p.createdAt)}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-center text-slate-700 dark:text-slate-300 align-middle">
                            {p.employeeId}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white align-middle">
                            {p.employeeName}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 align-middle">
                            {p.department}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                            {items[0].itemId}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                            {items[0].itemName}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {items[0].quantity ? `${items[0].quantity} ${items[0].unit || ''}`.trim() : '-'}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block whitespace-nowrap ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center align-middle">
                            {/* Ký nhận bàn giao thực tế */}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-slate-500 italic max-w-xs align-middle" title={p.notes || ''}>
                            {p.notes || ''}
                          </td>
                        </tr>

                        {/* Subsequent Item Rows (only columns 7, 8, 9) */}
                        {items.slice(1).map((item, itemIdx) => (
                          <tr key={`${p.id}-item-${itemIdx + 1}`} className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                              {item.itemId}
                            </td>
                            <td className="p-2 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                              {item.itemName}
                            </td>
                            <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '-'}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* GENERAL REPORT TABLE */}
          {reportType === 'general' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Thời gian gửi</th>
                  <th className="p-2 border">MSNV</th>
                  <th className="p-2 border">Họ tên nhân viên</th>
                  <th className="p-2 border">Tổ / Bộ phận</th>
                  <th className="p-2 border">Bộ phận tiếp nhận</th>
                  <th className="p-2 border">Tiêu đề đề xuất</th>
                  <th className="p-2 border">Nội dung chi tiết</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredGenerals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không tìm thấy đề xuất khác nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredGenerals.map((p, idx) => {
                    const badge = GENERAL_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-purple-600">{p.id}</td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="p-2 border font-mono text-slate-700 dark:text-slate-300">{p.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">{p.employeeName}</td>
                        <td className="p-2 border">{p.department}</td>
                        <td className="p-2 border text-purple-700 dark:text-purple-300 font-medium">
                          {p.receiverUserName ? `${p.receiverUserName} (${p.receiverDepartment})` : p.receiverDepartment}
                        </td>
                        <td className="p-2 border font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={p.title}>
                          {p.title}
                        </td>
                        <td className="p-2 border max-w-xs whitespace-pre-line text-slate-700 dark:text-slate-300" title={p.content}>
                          {p.content}
                        </td>
                        <td className="p-2 border">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}


          {/* PCCC REPORT TABLE */}
          {reportType === 'pccc' && (
            <table className="w-full text-left border-collapse text-xs min-w-[1360px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12 whitespace-nowrap">STT</th>
                  <th className="p-2 border text-center w-32 min-w-[120px] whitespace-nowrap">Mã thiết bị</th>
                  <th className="p-2 border min-w-[200px] max-w-[260px]">Tên thiết bị</th>
                  <th className="p-2 border text-center w-28 min-w-[100px] whitespace-nowrap">Chủng loại</th>
                  <th className="p-2 border min-w-[150px] max-w-[200px]">Vị trí đặt</th>
                  <th className="p-2 border text-center w-24 min-w-[85px] whitespace-nowrap">Chuẩn KT</th>
                  <th className="p-2 border text-center w-24 min-w-[95px] whitespace-nowrap">Hạn KĐ</th>
                  <th className="p-2 border text-center w-36 min-w-[135px] whitespace-nowrap">Thời gian kiểm tra</th>
                  <th className="p-2 border w-44 min-w-[160px] whitespace-nowrap">Người kiểm tra</th>
                  <th className="p-2 border min-w-[200px] max-w-[300px]">Chi tiết các đầu mục kiểm tra</th>
                  <th className="p-2 border text-center w-24 min-w-[85px] whitespace-nowrap">Đánh giá</th>
                  <th className="p-2 border text-center w-20 min-w-[75px] whitespace-nowrap">Ký nhận</th>
                  <th className="p-2 border min-w-[130px]">Ghi chú / Đề xuất</th>
                </tr>
              </thead>
              <tbody>
                {filteredPCCCDevices.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400">
                      Không tìm thấy thiết bị PCCC nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredPCCCDevices.map((d, idx) => {
                    const catInfo = PCCC_CATEGORIES[d.category];
                    const insp = pcccInspections.find((i) => i.deviceId === d.id);
                    const details = formatPCCCChecklistSummary(insp);
                    const hasLast = !!d.lastInspection;
                    const isPass = d.lastInspection?.status === 'pass';

                    return (
                      <tr key={d.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500 whitespace-nowrap">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-red-600 text-center whitespace-nowrap">{d.id}</td>
                        <td className="p-2 border font-semibold text-slate-900 dark:text-white leading-tight">{d.name}</td>
                        <td className="p-2 border text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border whitespace-nowrap inline-block">
                            {catInfo?.name || d.category}
                          </span>
                        </td>
                        <td className="p-2 border leading-tight">{d.location}</td>
                        <td className="p-2 border text-center font-mono whitespace-nowrap">{d.specs}</td>
                        <td className="p-2 border text-center whitespace-nowrap font-mono">{d.inspectionExpiry}</td>
                        <td className="p-2 border text-center text-[11px] whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                          {d.lastInspection?.date || insp?.inspectedAt || '-'}
                        </td>
                        <td className="p-2 border font-medium whitespace-nowrap">
                          {d.lastInspection
                            ? `${d.lastInspection.inspectorName} (${d.lastInspection.inspectorId})`
                            : insp
                            ? `${insp.inspectorName} (${insp.inspectorId})`
                            : '-'}
                        </td>
                        <td className="p-2 border text-[11px] text-slate-700 dark:text-slate-300 max-w-xs whitespace-pre-line leading-tight">
                          {details}
                        </td>
                        <td className="p-2 border text-center whitespace-nowrap">
                          {hasLast ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap inline-block ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] whitespace-nowrap">Chưa KT</span>
                          )}
                        </td>
                        <td className="p-2 border text-center whitespace-nowrap"></td>
                        <td className="p-2 border text-slate-500 italic max-w-xs truncate" title={d.lastInspection?.notes || insp?.notes || ''}>
                          {d.lastInspection?.notes || insp?.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* DEPARTMENTS REPORT TABLE */}
          {reportType === 'departments' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phòng ban</th>
                  <th className="p-2 border">Tên phòng ban</th>
                  <th className="p-2 border">Mô tả chức năng</th>
                  <th className="p-2 border">Trưởng bộ phận</th>
                  <th className="p-2 border">Số nhân sự</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Không tìm thấy phòng ban phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border font-mono font-bold text-blue-600">{d.code}</td>
                      <td className="p-2 border font-bold">{d.name}</td>
                      <td className="p-2 border">{d.description || '-'}</td>
                      <td className="p-2 border">{d.managerName || 'Chưa chỉ định'}</td>
                      <td className="p-2 border font-bold">
                        {users.filter((u) => u.department === d.name).length} người
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Factory Signatures block for PCCC */}
        {reportType === 'pccc' && (
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs">
            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">NGƯỜI LẬP BÁO CÁO</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">CÁN BỘ AN TOÀN HSE</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">TRƯỞNG PHÒNG CƠ ĐIỆN</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">BAN GIÁM ĐỐC DUYỆT</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu)</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
