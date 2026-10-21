'use client';

import React, { useState } from 'react';
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
  FileSpreadsheet,
  Building2,
  Utensils,
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

  const leaves = filterUserLeaves(storage.getLeaveRequests(), currentUser, 'all');
  const attendances = filterUserAttendances(storage.getAttendanceConfirms(), currentUser, 'all');
  const gatePasses = filterUserGatePasses(storage.getGatePasses(), currentUser, 'all');
  const departments = storage.getDepartments();
  const users = storage.getUsers();

  // All leave requests where Economic staff has confirmed cutting meals
  const mealCutLeaves = leaves.filter((l) =>
    l.steps.some((s) => s.roleRequired === 'economic' && s.status === 'approved')
  );

  const filteredMealCutLeaves = mealCutLeaves.filter((l) => {
    if (departmentFilter !== 'all' && l.department !== departmentFilter) return false;
    if (fromDate && l.fromDate < fromDate) return false;
    if (toDate && l.toDate > toDate) return false;
    return true;
  });

  // Export to Excel handler
  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let fileName = `LONGKHAI_Bao_Cao_${reportType.toUpperCase()}`;

    if (reportType === 'leave') {
      dataToExport = leaves.map((l) => ({
        'Mã đơn': l.id,
        'Mã NV': l.employeeId,
        'Họ và tên': l.employeeName,
        'Phòng ban': l.department,
        'Loại nghỉ phép': LEAVE_TYPE_LABELS[l.leaveType],
        'Từ ngày': l.fromDate,
        'Đến ngày': l.toDate,
        'Số ngày': l.totalDays,
        'Lý do': l.reason,
        'Trạng thái': l.status,
      }));
    } else if (reportType === 'attendance') {
      dataToExport = attendances.map((a) => ({
        'Mã phiếu': a.id,
        'Mã NV': a.employeeId,
        'Họ và tên': a.employeeName,
        'Phòng ban': a.department,
        'Trường hợp': ISSUE_TYPE_LABELS[a.issueType]?.text,
        'Ngày': a.date,
        'Giờ vào': a.checkInTime,
        'Giờ ra': a.checkOutTime,
        'Ca': a.shift,
        'Lý do giải trình': a.reason,
        'Trạng thái': a.status,
      }));
    } else if (reportType === 'gate_pass') {
      dataToExport = gatePasses.map((gp, idx) => ({
        'STT': idx + 1,
        'Mã phiếu': gp.id,
        'Mã NV': gp.employeeId,
        'Họ và tên': gp.employeeName,
        'Phòng ban': gp.department,
        'Mục đích': gp.purpose,
        'Loại': gp.passType === 'business' ? 'Công tác' : 'Việc riêng',
        'Tài sản mang theo': gp.hasAssets && gp.assets && gp.assets.length > 0
          ? gp.assets.map((a) => `${a.name} (SL: ${a.quantity})`).join('; ')
          : 'Không mang theo',
        'Giờ ra dự kiến': gp.estimatedDepartureTime || '',
        'Giờ vào dự kiến': gp.estimatedReturnTime || '',
        'Giờ ra thực tế': gp.actualDepartureTime || '',
        'Giờ vào thực tế': gp.actualReturnTime || '',
        'Trạng thái': gp.status,
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
          'Loại nghỉ phép': LEAVE_TYPE_LABELS[l.leaveType],
          'Từ ngày': l.fromDate,
          'Đến ngày': l.toDate,
          'Số ngày cắt cơm': l.totalDays,
          'NV Kinh tế xác nhận': ecoStep?.approverName || ecoStep?.approverId || 'NV Kinh tế',
          'Thời gian xác nhận': ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận',
          'Lý do nghỉ': l.reason,
          'Trạng thái đơn': l.status === 'approved' ? 'Hoàn tất' : l.status,
        };
      });
      fileName = `LONGKHAI_Bao_Cao_CAT_COM_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    } else if (reportType === 'departments') {
      dataToExport = departments.map((d) => ({
        'Mã phòng ban': d.code,
        'Tên phòng ban': d.name,
        'Mô tả': d.description || '',
        'Trưởng bộ phận': d.managerName || '',
        'Số nhân sự': users.filter((u) => u.department === d.name).length,
      }));
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
            Tra cứu số liệu, xuất file Excel và in ấn báo cáo chuẩn quy cách nhà máy
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Lọc dữ liệu:
          </span>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            placeholder="Từ ngày"
          />
          <span className="text-slate-400">&rarr;</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Select Report Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setReportType('leave')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'leave'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <CalendarDays className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Nghỉ phép</div>
          <div className="text-[11px] text-slate-500">{leaves.length} đơn phát sinh</div>
        </button>

        <button
          onClick={() => setReportType('attendance')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'attendance'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Xác nhận công</div>
          <div className="text-[11px] text-slate-500">{attendances.length} phiếu giải trình</div>
        </button>

        <button
          onClick={() => setReportType('gate_pass')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'gate_pass'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <QrCode className="w-5 h-5 text-emerald-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Ra vào cổng</div>
          <div className="text-[11px] text-slate-500">{gatePasses.length} lượt ra vào</div>
        </button>

        <button
          onClick={() => setReportType('meal_cut')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'meal_cut'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Utensils className="w-5 h-5 text-rose-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cắt cơm</div>
          <div className="text-[11px] text-slate-500">{filteredMealCutLeaves.length} lượt cắt cơm</div>
        </button>

        <button
          onClick={() => setReportType('departments')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'departments'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5 text-purple-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cơ cấu phòng ban</div>
          <div className="text-[11px] text-slate-500">{departments.length} phòng ban</div>
        </button>
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
            BÁO CÁO TỔNG HỢP {reportType === 'meal_cut' ? 'CẮT CƠM NHÂN VIÊN' : reportType === 'leave' ? 'NGHỈ PHÉP' : reportType === 'attendance' ? 'XÁC NHẬN CÔNG' : reportType === 'gate_pass' ? 'RA VÀO CỔNG & TÀI SẢN' : 'CƠ CẤU PHÒNG BAN'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phục vụ công tác thanh kiểm tra và quản trị nội bộ nhà máy
          </p>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto">
          {reportType === 'leave' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã đơn</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Loại nghỉ</th>
                  <th className="p-2 border">Số ngày</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="p-2 border font-mono font-bold">{l.id}</td>
                    <td className="p-2 border font-mono">{l.employeeId}</td>
                    <td className="p-2 border font-semibold">{l.employeeName}</td>
                    <td className="p-2 border">{l.department}</td>
                    <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType]}</td>
                    <td className="p-2 border font-bold">{l.totalDays}</td>
                    <td className="p-2 border uppercase text-[10px] font-bold">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'attendance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Lý do</th>
                  <th className="p-2 border">Ngày</th>
                  <th className="p-2 border">Giờ vào - ra</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="p-2 border font-mono font-bold">{a.id}</td>
                    <td className="p-2 border font-mono">{a.employeeId}</td>
                    <td className="p-2 border font-semibold">{a.employeeName}</td>
                    <td className="p-2 border">{ISSUE_TYPE_LABELS[a.issueType]?.text}</td>
                    <td className="p-2 border">{formatDate(a.date)}</td>
                    <td className="p-2 border font-mono">{a.checkInTime} - {a.checkOutTime}</td>
                    <td className="p-2 border uppercase text-[10px] font-bold">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'gate_pass' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Nhân viên</th>
                  <th className="p-2 border">Mục đích</th>
                  <th className="p-2 border">Tài sản mang theo</th>
                  <th className="p-2 border">Giờ ra thực tế</th>
                  <th className="p-2 border">Giờ vào thực tế</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.map((gp) => (
                  <tr key={gp.id} className="border-b">
                    <td className="p-2 border font-mono font-bold text-emerald-600">{gp.id}</td>
                    <td className="p-2 border font-semibold">{gp.employeeName} ({gp.employeeId})</td>
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
                    <td className="p-2 border">{gp.actualDepartureTime ? formatDateTime(gp.actualDepartureTime) : (gp.estimatedDepartureTime ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}` : '-')}</td>
                    <td className="p-2 border">{gp.timeType === 'nghi_cuoi_gio' ? 'Không về lại' : gp.actualReturnTime ? formatDateTime(gp.actualReturnTime) : (gp.estimatedReturnTime ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}` : '-')}</td>
                    <td className="p-2 border uppercase text-[10px] font-bold">{gp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
                    <td colSpan={11} className="p-6 text-center text-slate-400">
                      Chưa có nhân viên nào được xác nhận cắt cơm trong hệ thống hoặc khoảng thời gian đã chọn.
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
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">{l.employeeName}</td>
                        <td className="p-2 border">{l.department}</td>
                        <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType]}</td>
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
                {departments.map((d) => (
                  <tr key={d.id} className="border-b">
                    <td className="p-2 border font-mono font-bold text-blue-600">{d.code}</td>
                    <td className="p-2 border font-bold">{d.name}</td>
                    <td className="p-2 border">{d.description || '-'}</td>
                    <td className="p-2 border">{d.managerName || 'Chưa chỉ định'}</td>
                    <td className="p-2 border font-bold">
                      {users.filter((u) => u.department === d.name).length} người
                    </td>
                  </tr>
                ))}
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
