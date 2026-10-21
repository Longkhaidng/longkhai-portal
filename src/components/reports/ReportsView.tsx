'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { exportDataToExcel } from '@/lib/excel';
import {
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
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { filterUserLeaves, filterUserAttendances, filterUserGatePasses } from '@/lib/permissions';

export function ReportsView() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<'leave' | 'attendance' | 'gate_pass' | 'meal_cut' | 'departments'>('leave');
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
    return leaves.filter((l) => {
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
    });
  }, [leaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 2. Filtered Attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((a) => {
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
    });
  }, [attendances, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 3. Filtered Gate Passes
  const filteredGatePasses = useMemo(() => {
    return gatePasses.filter((gp) => {
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
    });
  }, [gatePasses, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 4. Filtered Meal Cut Leaves
  const filteredMealCutLeaves = useMemo(() => {
    return mealCutLeaves.filter((l) => {
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
    });
  }, [mealCutLeaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5. Filtered Departments
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
      : filteredDepartments.length;

  // Export to Excel handler
  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let fileName = `LONGKHAI_Bao_Cao_${reportType.toUpperCase()}`;

    if (reportType === 'leave') {
      dataToExport = filteredLeaves.map((l) => ({
        'Mã đơn': l.id,
        'Mã NV': l.employeeId,
        'Họ và tên': l.employeeName,
        'Phòng ban': l.department,
        'Loại nghỉ phép': LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
        'Từ ngày': l.fromDate,
        'Đến ngày': l.toDate,
        'Số ngày': l.totalDays,
        'Lý do': l.reason,
        'Trạng thái':
          l.status === 'approved'
            ? 'Đã duyệt'
            : l.status === 'pending'
            ? 'Chờ duyệt'
            : l.status === 'rejected'
            ? 'Từ chối'
            : l.status,
      }));
    } else if (reportType === 'attendance') {
      dataToExport = filteredAttendances.map((a) => ({
        'Mã phiếu': a.id,
        'Mã NV': a.employeeId,
        'Họ và tên': a.employeeName,
        'Phòng ban': a.department,
        'Lý do': ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType,
        'Ngày': a.date,
        'Ca làm việc': a.shift,
        'Giờ vào thực tế': a.actualCheckIn || '',
        'Giờ ra thực tế': a.actualCheckOut || '',
        'Lý do giải trình': a.reason,
        'Trạng thái':
          a.status === 'approved'
            ? 'Đã duyệt'
            : a.status === 'pending'
            ? 'Chờ duyệt'
            : a.status === 'rejected'
            ? 'Từ chối'
            : a.status,
      }));
    } else if (reportType === 'gate_pass') {
      dataToExport = filteredGatePasses.map((gp, idx) => ({
        'STT': idx + 1,
        'Mã phiếu': gp.id,
        'Mã NV': gp.employeeId,
        'Họ và tên': gp.employeeName,
        'Phòng ban': gp.department,
        'Mục đích': gp.purpose,
        'Loại': gp.passType === 'business' ? 'Công tác' : 'Việc riêng',
        'Tài sản mang theo':
          gp.hasAssets && gp.assets && gp.assets.length > 0
            ? gp.assets.map((a) => `${a.name} (SL: ${a.quantity})`).join('; ')
            : 'Không mang theo',
        'Ca làm việc': gp.shift || '',
        'Giờ ra thực tế': gp.actualDepartureTime ? formatDateTime(gp.actualDepartureTime) : '',
        'Giờ vào thực tế': gp.actualReturnTime ? formatDateTime(gp.actualReturnTime) : '',
        'Trạng thái':
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
            : gp.status,
      }));
    } else if (reportType === 'meal_cut') {
      dataToExport = filteredMealCutLeaves.map((l, idx) => {
        const ecoStep = l.steps.find((s) => s.roleRequired === 'economic');
        return {
          'STT': idx + 1,
          'Mã đơn': l.id,
          'Mã NV': l.employeeId,
          'Họ và tên': l.employeeName,
          'Phòng ban': l.department,
          'Loại nghỉ phép': LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
          'Từ ngày': l.fromDate,
          'Đến ngày': l.toDate,
          'Số ngày cắt cơm': l.totalDays,
          'NV Kinh tế xác nhận': ecoStep?.approverName || ecoStep?.approverId || 'NV Kinh tế',
          'Thời gian xác nhận': ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận',
          'Lý do nghỉ': l.reason,
          'Trạng thái đơn':
            l.status === 'approved'
              ? 'Hoàn tất'
              : l.status === 'pending'
              ? 'Chờ duyệt'
              : l.status,
        };
      });
      fileName = `LONGKHAI_Bao_Cao_CAT_COM_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    } else if (reportType === 'departments') {
      dataToExport = filteredDepartments.map((d) => ({
        'Mã phòng ban': d.code,
        'Tên phòng ban': d.name,
        'Mô tả': d.description || '',
        'Trưởng bộ phận': d.managerName || '',
        'Số nhân sự': users.filter((u) => u.department === d.name).length,
      }));
    }

    if (dataToExport.length === 0) {
      alert('Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel.');
      return;
    }

    exportDataToExcel(dataToExport, fileName);
  };

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* Printable Paper Document Container */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Factory Formal Letterhead */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs">
          <div>
            <div className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
              CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Hệ thống Quản trị & Điều hành Sản xuất Nội bộ
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 mt-2 md:mt-0">
            <div>Ngày xuất báo cáo: {formatDate(new Date().toISOString())}</div>
            <div className="font-mono">Mã tài liệu: BC-LK-2026/01</div>
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
                      <td className="p-2 border font-mono font-bold text-blue-600">{l.id}</td>
                      <td className="p-2 border font-mono">{l.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </td>
                      <td className="p-2 border">{l.department}</td>
                      <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</td>
                      <td className="p-2 border font-medium">
                        {formatDate(l.fromDate)} &rarr; {formatDate(l.toDate)}
                      </td>
                      <td className="p-2 border text-center font-bold text-rose-600">
                        {l.totalDays}
                      </td>
                      <td className="p-2 border max-w-xs truncate" title={l.reason}>
                        {l.reason || '-'}
                      </td>
                      <td className="p-2 border">
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
                      <td className="p-2 border font-mono font-bold text-amber-600">{a.id}</td>
                      <td className="p-2 border font-mono">{a.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {a.employeeName}
                      </td>
                      <td className="p-2 border">{a.department}</td>
                      <td className="p-2 border">{ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType}</td>
                      <td className="p-2 border font-medium">{formatDate(a.date)}</td>
                      <td className="p-2 border font-medium text-slate-700 dark:text-slate-300">
                        {a.shift}
                      </td>
                      <td className="p-2 border font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {a.actualCheckIn || '-'}
                      </td>
                      <td className="p-2 border font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {a.actualCheckOut || '-'}
                      </td>
                      <td className="p-2 border">
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
                      <td className="p-2 border font-mono font-bold text-emerald-600">{gp.id}</td>
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
                        ) : (
                          <span className="text-slate-400">Không mang</span>
                        )}
                      </td>
                      <td className="p-2 border font-medium text-slate-700 dark:text-slate-300">
                        {gp.shift || '-'}
                      </td>
                      <td className="p-2 border">
                        {gp.actualDepartureTime
                          ? formatDateTime(gp.actualDepartureTime)
                          : gp.estimatedDepartureTime
                          ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}`
                          : '-'}
                      </td>
                      <td className="p-2 border">
                        {gp.timeType === 'nghi_cuoi_gio'
                          ? 'Không về lại'
                          : gp.actualReturnTime
                          ? formatDateTime(gp.actualReturnTime)
                          : gp.estimatedReturnTime
                          ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}`
                          : '-'}
                      </td>
                      <td className="p-2 border">
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

        {/* Signature Blocks for Official Factory Paper Documents */}
        <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
          <div>
            <div className="font-bold uppercase text-slate-800 dark:text-slate-200">Người Lập Biểu</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-16" />
          </div>
          <div>
            <div className="font-bold uppercase text-slate-800 dark:text-slate-200">Trưởng Bộ Phận</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, ghi rõ họ tên)</div>
            <div className="h-16" />
          </div>
          <div>
            <div className="font-bold uppercase text-slate-800 dark:text-slate-200">Ban Giám Đốc Phê Duyệt</div>
            <div className="text-[11px] text-slate-400 mt-0.5">(Ký, đóng dấu)</div>
            <div className="h-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
