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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { filterUserLeaves, filterUserAttendances, filterUserGatePasses } from '@/lib/permissions';

export function ReportsView() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<'leave' | 'attendance' | 'gate_pass' | 'departments'>('leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const leaves = filterUserLeaves(storage.getLeaveRequests(), currentUser, 'all');
  const attendances = filterUserAttendances(storage.getAttendanceConfirms(), currentUser, 'all');
  const gatePasses = filterUserGatePasses(storage.getGatePasses(), currentUser, 'all');
  const departments = storage.getDepartments();
  const users = storage.getUsers();

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
      dataToExport = gatePasses.map((gp) => ({
        'Mã phiếu': gp.id,
        'Mã NV': gp.employeeId,
        'Họ và tên': gp.employeeName,
        'Phòng ban': gp.department,
        'Mục đích': gp.purpose,
        'Loại': gp.passType === 'business' ? 'Công tác' : 'Việc riêng',
        'Có tài sản': gp.hasAssets ? 'Có' : 'Không',
        'Giờ ra dự kiến': gp.estimatedDepartureTime,
        'Giờ vào dự kiến': gp.estimatedReturnTime || '',
        'Giờ ra thực tế': gp.actualDepartureTime || '',
        'Giờ vào thực tế': gp.actualReturnTime || '',
        'Trạng thái': gp.status,
      }));
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

      {/* Select Report Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            BÁO CÁO TỔNG HỢP {reportType.toUpperCase()}
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
                  <th className="p-2 border">Giờ ra</th>
                  <th className="p-2 border">Giờ vào</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.map((gp) => (
                  <tr key={gp.id} className="border-b">
                    <td className="p-2 border font-mono font-bold text-emerald-600">{gp.id}</td>
                    <td className="p-2 border font-semibold">{gp.employeeName} ({gp.employeeId})</td>
                    <td className="p-2 border">{gp.purpose}</td>
                    <td className="p-2 border">{gp.actualDepartureTime || gp.estimatedDepartureTime}</td>
                    <td className="p-2 border">{gp.actualReturnTime || gp.estimatedReturnTime || '-'}</td>
                    <td className="p-2 border uppercase text-[10px] font-bold">{gp.status}</td>
                  </tr>
                ))}
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
