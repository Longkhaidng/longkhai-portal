import * as XLSX from 'xlsx';
import { User, UserRole, CategoryPermission, CATEGORY_DEFINITIONS } from '@/types/user';
import { LeaveRequest, LEAVE_TYPE_LABELS } from '@/types/leave';
import { GatePass } from '@/types/gatePass';
import { AttendanceConfirm, ISSUE_TYPE_LABELS } from '@/types/attendance';
import { formatDate, formatDateTime } from '@/lib/utils';

export interface ParsedEmployeeResult {
  users: User[];
  errors: string[];
  totalRows: number;
}


function normalizeHeaderKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function getRowValue(row: any, ...aliases: string[]): string {
  // 1. Direct match with aliases
  for (const a of aliases) {
    if (row[a] !== undefined && row[a] !== null && String(row[a]).trim() !== '') {
      return String(row[a]).trim();
    }
  }
  // 2. Normalized match against all row keys
  const rowKeys = Object.keys(row);
  for (const a of aliases) {
    const normA = normalizeHeaderKey(a);
    for (const rk of rowKeys) {
      if (normalizeHeaderKey(rk) === normA) {
        const val = row[rk];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return '';
}

export function parseEmployeeExcel(file: File): Promise<ParsedEmployeeResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const users: User[] = [];
        const errors: string[] = [];
        const now = new Date().toISOString();

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // Row 1 is header

          // Flexible header matching with accent & space normalization
          const employeeId = getRowValue(
            row,
            'Mã nhân viên', 'Mã NV', 'Mã số NV', 'Mã số nhân viên', 'employeeId', 'EmployeeID', 'id', 'ID', 'Mã số'
          );

          const name = getRowValue(
            row,
            'Họ và tên', 'Họ tên', 'Tên nhân viên', 'Tên', 'name', 'FullName', 'Họ & Tên'
          );

          const department = getRowValue(
            row,
            'Phòng ban', 'Bộ phận', 'Phòng ban / Xưởng', 'Phân xưởng', 'Xưởng', 'department'
          ) || 'Nhà máy';

          const position = getRowValue(
            row,
            'Vị trí công tác', 'Chức danh', 'Chức vụ', 'Vị trí', 'position'
          ) || 'Nhân viên';

          const roleRaw = getRowValue(
            row,
            'Vai trò', 'Role', 'role', 'Chức vụ hệ thống'
          ).toLowerCase() || 'employee';

          const email = getRowValue(row, 'Email', 'Email công việc', 'email', 'Hộp thư');
          const phone = getRowValue(row, 'Số điện thoại', 'SĐT', 'SDT', 'Điện thoại', 'phone', 'Telephone', 'Số ĐT');
          const teamLeaderId = getRowValue(row, 'Mã Tổ trưởng', 'Mã tổ trưởng', 'Tổ trưởng', 'Mã số tổ trưởng', 'teamLeaderId', 'team_leader_id');
          const departmentHeadId = getRowValue(row, 'Mã Trưởng BP', 'Mã Trưởng bộ phận', 'Trưởng BP', 'Trưởng bộ phận', 'Mã TB', 'departmentHeadId', 'managerId');
          
          let economicStaffId = getRowValue(
            row,
            'Mã NV kinh tế',
            'Mã NV Kinh tế',
            'Mã nhân viên kinh tế',
            'Mã số nhân viên kinh tế',
            'Mã số NV kinh tế',
            'NV kinh tế',
            'Nhân viên kinh tế',
            'Mã kinh tế',
            'Mã NV cắt cơm',
            'NV cắt cơm',
            'Mã số NV cắt cơm',
            'Mã NV KT',
            'NV KT',
            'economicStaffId',
            'economic_staff_id'
          );

          // Deep search fallback for economicStaffId
          if (!economicStaffId) {
            for (const rk of Object.keys(row)) {
              const norm = normalizeHeaderKey(rk);
              if (
                norm.includes('kinhte') ||
                norm.includes('catcom') ||
                norm.includes('economic') ||
                norm === 'manvkt' ||
                norm === 'nvkt'
              ) {
                const val = row[rk];
                if (val !== undefined && val !== null && String(val).trim() !== '') {
                  economicStaffId = String(val).trim();
                  break;
                }
              }
            }
          }

          const departmentHeadEmail = getRowValue(row, 'Email Trưởng BP', 'Email Trưởng bộ phận', 'Email TB', 'departmentHeadEmail');
          const password = getRowValue(row, 'Mật khẩu', 'password', 'Pass') || 'LK@123456';
          const permissionsRaw = getRowValue(row, 'Phân quyền', 'Quyền', 'permissions', 'Quyền hạn');

          if (!employeeId) {
            errors.push(`Dòng ${rowNum}: Thiếu Mã nhân viên`);
            return;
          }

          if (!name) {
            errors.push(`Dòng ${rowNum}: Thiếu Họ và tên cho Mã NV ${employeeId}`);
            return;
          }

          // Map role
          let role: UserRole = 'employee';
          if (roleRaw.includes('admin') || roleRaw.includes('quản trị')) role = 'admin';
          else if (roleRaw.includes('c&b') || roleRaw.includes('cb')) role = 'cb';
          else if (roleRaw.includes('hr') || roleRaw.includes('nhân sự')) role = 'hr';
          else if (roleRaw.includes('ehs') || roleRaw.includes('an toàn')) role = 'ehs';
          else if (roleRaw.includes('security') || roleRaw.includes('bảo vệ')) role = 'security';
          else if (roleRaw.includes('manager') || roleRaw.includes('trưởng') || roleRaw.includes('quản lý')) role = 'manager';
          else if (roleRaw.includes('team_leader') || roleRaw.includes('tổ trưởng')) role = 'team_leader';
          else if (roleRaw.includes('accountant') || roleRaw.includes('kế toán')) role = 'accountant';
          else if (roleRaw.includes('it') || roleRaw.includes('cntt')) role = 'it';

          // Map permissions
          let permissions: CategoryPermission[] = [];
          if (permissionsRaw.toLowerCase() === 'all' || permissionsRaw.toLowerCase() === 'tất cả' || role === 'admin') {
            permissions = CATEGORY_DEFINITIONS.map(c => c.id);
          } else if (permissionsRaw) {
            const list = permissionsRaw.split(/[,;|]/).map(s => s.trim().toLowerCase());
            CATEGORY_DEFINITIONS.forEach(cat => {
              if (
                list.includes(cat.id.toLowerCase()) ||
                list.includes(cat.name.toLowerCase())
              ) {
                permissions.push(cat.id);
              }
            });
          }

          // If no permissions specified, set defaults based on role
          if (permissions.length === 0) {
            permissions = ['dashboard', 'leave', 'attendance', 'gate_pass', 'announcements'];
            if (role === 'security') permissions.push('gate_pass', 'attendance');
            if (role === 'cb') permissions.push('leave', 'attendance', 'gate_pass', 'reports');
            if (role === 'hr') permissions.push('leave', 'attendance', 'reports', 'users', 'departments');
            if (role === 'manager' || role === 'team_leader') permissions.push('reports', 'forms');
          }

          users.push({
            id: employeeId,
            name,
            department,
            position,
            role,
            email: email || undefined,
            phone: phone || undefined,
            teamLeaderId: teamLeaderId || undefined,
            departmentHeadId: departmentHeadId || undefined,
            economicStaffId: economicStaffId || undefined,
            departmentHeadEmail: departmentHeadEmail || undefined,
            permissions,
            isActive: true,
            password: password || 'LK@123456',
            createdAt: now,
            updatedAt: now,
          });
        });

        resolve({
          users,
          errors,
          totalRows: rawJson.length,
        });
      } catch (err: any) {
        reject(new Error(`Lỗi đọc file Excel: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateEmployeeTemplateExcel() {
  const headers = [
    'STT',
    'Mã nhân viên',
    'Họ và tên',
    'Phòng ban',
    'Chức vụ',
    'Vai trò',
    'Email',
    'Số điện thoại',
    'Mã Tổ trưởng',
    'Mã Trưởng BP',
    'Mã NV kinh tế',
    'Email Trưởng BP',
    'Mật khẩu',
    'Phân quyền',
  ];

  const sampleData = [
    {
      'STT': 1,
      'Mã nhân viên': 'LK-101',
      'Họ và tên': 'Nguyễn Văn An',
      'Phòng ban': 'Xưởng Sản xuất 1',
      'Chức vụ': 'Công nhân tiện CNC',
      'Vai trò': 'employee',
      'Email': 'an.nguyen@longkhai.vn',
      'Số điện thoại': '0901234567',
      'Mã Tổ trưởng': 'LK-050',
      'Mã Trưởng BP': 'LK-010',
      'Mã NV kinh tế': '2415',
      'Email Trưởng BP': 'cuong.le@longkhai.vn',
      'Mật khẩu': 'LK@123456',
      'Phân quyền': 'dashboard,leave,attendance,gate_pass,announcements',
    },
    {
      'STT': 2,
      'Mã nhân viên': 'LK-050',
      'Họ và tên': 'Trần Văn Bình',
      'Phòng ban': 'Xưởng Sản xuất 1',
      'Chức vụ': 'Tổ trưởng Tổ Cơ khí',
      'Vai trò': 'team_leader',
      'Email': 'binh.tran@longkhai.vn',
      'Số điện thoại': '0912345678',
      'Mã Tổ trưởng': '',
      'Mã Trưởng BP': 'LK-010',
      'Mã NV kinh tế': '2415',
      'Email Trưởng BP': 'cuong.le@longkhai.vn',
      'Mật khẩu': 'LK@123456',
      'Phân quyền': 'dashboard,leave,attendance,gate_pass,announcements,reports',
    },
    {
      'STT': 3,
      'Mã nhân viên': 'LK-010',
      'Họ và tên': 'Lê Hoàng Cường',
      'Phòng ban': 'Xưởng Sản xuất 1',
      'Chức vụ': 'Trưởng phòng Sản xuất',
      'Vai trò': 'manager',
      'Email': 'cuong.le@longkhai.vn',
      'Số điện thoại': '0923456789',
      'Mã Tổ trưởng': '',
      'Mã Trưởng BP': '',
      'Email Trưởng BP': 'giamdoc@longkhai.vn',
      'Mật khẩu': 'LK@123456',
      'Phân quyền': 'all',
    },
    {
      'STT': 4,
      'Mã nhân viên': 'LK-005',
      'Họ và tên': 'Phạm Thị Dung',
      'Phòng ban': 'Phòng Hành Chính Nhân Sự',
      'Chức vụ': 'Chuyên viên Nhân sự',
      'Vai trò': 'hr',
      'Email': 'dung.pham@longkhai.vn',
      'Số điện thoại': '0934567890',
      'Mã Tổ trưởng': '',
      'Mã Trưởng BP': 'LK-002',
      'Mã NV kinh tế': '1139',
      'Email Trưởng BP': 'hr.manager@longkhai.vn',
      'Mật khẩu': 'LK@123456',
      'Phân quyền': 'dashboard,leave,attendance,users,departments,reports',
    },
    {
      'STT': 5,
      'Mã nhân viên': 'LK-008',
      'Họ và tên': 'Võ Văn Em',
      'Phòng ban': 'Đội Bảo Vệ & An Ninh',
      'Chức vụ': 'Nhân viên An ninh Cổng chính',
      'Vai trò': 'security',
      'Email': 'em.vo@longkhai.vn',
      'Số điện thoại': '0945678901',
      'Mã Tổ trưởng': '',
      'Mã Trưởng BP': 'LK-002',
      'Email Trưởng BP': 'an.ninh@longkhai.vn',
      'Mật khẩu': 'LK@123456',
      'Phân quyền': 'dashboard,gate_pass,attendance,announcements',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã NV
    { wch: 22 }, // Họ tên
    { wch: 25 }, // Phòng ban
    { wch: 22 }, // Chức vụ
    { wch: 14 }, // Vai trò
    { wch: 24 }, // Email
    { wch: 15 }, // SĐT
    { wch: 14 }, // Tổ trưởng
    { wch: 14 }, // Trưởng BP
    { wch: 14 }, // Mã NV kinh tế
    { wch: 26 }, // Email Trưởng BP
    { wch: 14 }, // Mật khẩu
    { wch: 45 }, // Phân quyền
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách Nhân viên');
  
  // Also add Instructions Sheet
  const instructions = [
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '1. Cột "Mã nhân viên" là DUY NHẤT trong toàn công ty và dùng làm Tên đăng nhập.' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '2. Cột "Vai trò": employee (Nhân viên), team_leader (Tổ trưởng), manager (Trưởng BP), hr (Nhân sự), security (Bảo vệ), accountant (Kế toán), it (CNTT), admin (Quản trị).' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '3. Cột "Mã Trưởng BP" & "Email Trưởng BP": Điền thông tin Trưởng BP để hệ thống tự động đẩy email phê duyệt khi nhân viên tạo đơn nghỉ phép/ra vào cổng.' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '3.1. Cột "Mã NV kinh tế" (hoặc "Mã nhân viên kinh tế"): Điền mã số nhân viên kinh tế phụ trách cắt cơm của bộ phận đó để tự động chuyển đơn duyệt cắt cơm sau khi Trưởng BP duyệt.' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '4. Cột "Phân quyền": Điền "all" để cấp toàn quyền, hoặc liệt kê các mã cách nhau bằng dấu phẩy:' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - dashboard: Tổng quan điều hành' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - departments: Quản lý phòng ban (Thêm, sửa, xóa phòng ban)' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - leave: Đơn xin nghỉ phép' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - attendance: Phiếu xác nhận công vào - ra' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - gate_pass: Phiếu ra - vào cổng & Quét QR bảo vệ' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - announcements: Thông báo nội bộ & Tin tức' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - forms: Biểu mẫu động không cần sửa code' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - reports: Báo cáo & Thống kê' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - users: Quản lý nhân viên & Phân quyền' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - web_integrations: Tích hợp website ngoài vào menu' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - plugins: Mở rộng (5S, ISO, An toàn, Kaizen...)' },
    { 'HƯỚNG DẪN ĐIỀN DỮ LIỆU NHÂN VIÊN': '   - settings: Cài đặt hệ thống & GitHub' },
  ];
  const instrSheet = XLSX.utils.json_to_sheet(instructions);
  instrSheet['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Hướng dẫn phân quyền');

  XLSX.writeFile(workbook, 'LONGKHAI_Mau_Danh_Sach_Nhan_Vien.xlsx');
}

export function exportDataToExcel(data: any[], fileName: string, sheetName: string = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportAllUsersToExcel(users: User[]) {
  const data = users.map((u, index) => ({
    'STT': index + 1,
    'Mã nhân viên': u.id,
    'Họ và tên': u.name,
    'Phòng ban': u.department,
    'Chức vụ': u.position,
    'Vai trò': u.role,
    'Email': u.email || '',
    'Số điện thoại': u.phone || '',
    'Mã Tổ trưởng': u.teamLeaderId || '',
    'Mã Trưởng BP': u.departmentHeadId || '',
    'Mã NV kinh tế': u.economicStaffId || '',
    'Email Trưởng BP': u.departmentHeadEmail || '',
    'Phân quyền': (u.permissions || []).join(', '),
    'Trạng thái': u.isActive ? 'Đang hoạt động' : 'Đã khóa',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 15 }, // Mã NV
    { wch: 22 }, // Họ tên
    { wch: 25 }, // Phòng ban
    { wch: 22 }, // Chức vụ
    { wch: 14 }, // Vai trò
    { wch: 24 }, // Email
    { wch: 15 }, // SĐT
    { wch: 14 }, // Tổ trưởng
    { wch: 14 }, // Trưởng BP
    { wch: 14 }, // Mã NV kinh tế
    { wch: 26 }, // Email Trưởng BP
    { wch: 45 }, // Phân quyền
    { wch: 16 }, // Trạng thái
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Nhân Viên');
  const d = new Date();
  const dateStr = String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  XLSX.writeFile(workbook, 'LONGKHAI_Danh_Sach_Nhan_Vien_' + dateStr + '.xlsx');
}


import ExcelJS from 'exceljs';
import { downloadBlob } from './utils';

export interface ExportReportOptions {
  title: string;
  subtitle: string;
  docCode?: string;
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  colWidths?: number[];
  centerCols?: number[];
}

export async function exportReportToExcel(opts: ExportReportOptions) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Long Khải Portal';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Báo Cáo', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: true }],
  });

  const now = new Date();
  const exportDate = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const totalCols = Math.max(opts.headers.length, 9);

  // Border style for table cells: solid black thin border
  const solidBlackBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  // Row 1: Company Name (Left) & Export Date (Right)
  const row1 = worksheet.addRow([]);
  row1.getCell(1).value = 'CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG';
  row1.getCell(1).font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF000000' } };
  row1.getCell(totalCols).value = `Ngày xuất báo cáo: ${exportDate}`;
  row1.getCell(totalCols).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
  row1.getCell(totalCols).alignment = { horizontal: 'right' };

  // Row 2: Sub-info (Left) & Doc Code (Right)
  const row2 = worksheet.addRow([]);
  row2.getCell(1).value = 'Hệ thống Quản trị & Điều hành Sản xuất Nội bộ';
  row2.getCell(1).font = { name: 'Calibri', italic: true, size: 9.5, color: { argb: 'FF64748B' } };
  row2.getCell(totalCols).value = `Mã tài liệu: ${opts.docCode || 'BC-LK-2026/01'}`;
  row2.getCell(totalCols).font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
  row2.getCell(totalCols).alignment = { horizontal: 'right' };

  // Row 3: Empty separator
  worksheet.addRow([]);

  // Row 4: Report Main Title
  const row4 = worksheet.addRow([]);
  row4.getCell(1).value = `BÁO CÁO TỔNG HỢP ${opts.title.toUpperCase()}`;
  row4.getCell(1).font = { name: 'Calibri', bold: true, size: 15, color: { argb: 'FF000000' } };
  row4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(4, 1, 4, totalCols);
  row4.height = 24;

  // Row 5: Report Period Subtitle
  const row5 = worksheet.addRow([]);
  row5.getCell(1).value = opts.subtitle;
  row5.getCell(1).font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF64748B' } };
  row5.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(5, 1, 5, totalCols);

  // Row 6: Empty separator
  worksheet.addRow([]);

  // Row 7: Table Headers
  const headerRow = worksheet.addRow(opts.headers);
  headerRow.height = 24;
  for (let c = 1; c <= opts.headers.length; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { name: 'Calibri', bold: true, size: 10.5, color: { argb: 'FF000000' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    };
    cell.border = solidBlackBorder;
  }

  // Row 8+: Data Rows
  opts.rows.forEach((rowValues) => {
    const row = worksheet.addRow(rowValues);
    row.height = 20;

    for (let c = 1; c <= opts.headers.length; c++) {
      const cell = row.getCell(c);
      const colIdx = c - 1;
      const isCentered = opts.centerCols ? opts.centerCols.includes(colIdx) : false;

      // Solid black thin border for EVERY cell
      cell.border = solidBlackBorder;

      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = {
        horizontal: isCentered ? 'center' : 'left',
        vertical: 'middle',
      };

      const valStr = String(cell.value || '').trim();

      // Doc ID styling (Blue bold)
      if (colIdx === 0 && /^([A-Z]{2,4}\d{2}-\d+)$/.test(valStr)) {
        cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF0284C7' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Employee name (Bold)
      if (opts.headers[colIdx] === 'Họ và tên' || (opts.headers[colIdx] === 'Nhân viên' && colIdx === 1)) {
        cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF0F172A' } };
      }

      // Status column styling
      if (valStr === 'Đã duyệt' || valStr === 'Hoàn tất' || valStr === 'Đã cắt cơm') {
        cell.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF059669' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (valStr === 'Từ chối' || valStr === 'Bị từ chối') {
        cell.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FFE11D48' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (valStr === 'Chờ duyệt') {
        cell.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FFD97706' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (valStr === 'Đang ra ngoài') {
        cell.font = { name: 'Calibri', bold: true, size: 9.5, color: { argb: 'FF0284C7' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Red bold for days count column
      if (opts.headers[colIdx] === 'Số ngày' || opts.headers[colIdx] === 'Số ngày cắt cơm') {
        cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFE11D48' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }
  });

  // Calculate Column Widths
  worksheet.columns.forEach((col, idx) => {
    let maxLen = opts.headers[idx] ? opts.headers[idx].length : 10;
    opts.rows.forEach((r) => {
      const cellVal = String(r[idx] || '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    col.width = Math.min(Math.max(maxLen + 4, 13), 38);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${opts.fileName}.xlsx`);
}

/**
 * Export full multi-sheet Excel backup containing Leave Requests, Gate Passes, and Attendance Confirms
 */
export async function exportDocumentsBackupToExcel(
  leaveRequests: LeaveRequest[],
  gatePasses: GatePass[],
  attendanceConfirms: AttendanceConfirm[],
  fileName?: string
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Long Khải Portal';
  workbook.created = new Date();

  const primaryFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' },
  };

  const headerFont: Partial<ExcelJS.Font> = {
    name: 'Calibri',
    bold: true,
    size: 11,
    color: { argb: 'FFFFFFFF' },
  };

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  const setupSheet = (
    sheetName: string,
    title: string,
    headers: string[],
    rows: (string | number)[][],
    centerCols: number[] = [0, 1]
  ) => {
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    ws.mergeCells(1, 1, 1, headers.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = title.toUpperCase();
    titleCell.font = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FF1E3A8A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells(2, 1, 2, headers.length);
    const subCell = ws.getCell(2, 1);
    subCell.value = `Thời gian sao lưu: ${formatDateTime(new Date().toISOString())} | Tổng số bản ghi: ${rows.length}`;
    subCell.font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF64748B' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 18;

    ws.getRow(3).height = 8;

    const headerRow = ws.getRow(4);
    headerRow.height = 26;
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.fill = primaryFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = thinBorder;
    });

    rows.forEach((r, rIdx) => {
      const row = ws.addRow(r);
      row.height = 20;
      const isEven = rIdx % 2 === 0;

      r.forEach((_, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.border = thinBorder;
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.alignment = {
          horizontal: centerCols.includes(cIdx) ? 'center' : 'left',
          vertical: 'middle',
        };
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        }
      });
    });

    ws.columns.forEach((col, idx) => {
      let maxLen = headers[idx] ? headers[idx].length : 10;
      rows.forEach((row) => {
        const str = String(row[idx] || '');
        if (str.length > maxLen) maxLen = str.length;
      });
      col.width = Math.min(Math.max(maxLen + 4, 12), 40);
    });
  };

  // 1. Sheet: Đơn xin nghỉ phép
  const leaveHeaders = [
    'Mã đơn',
    'Mã nhân viên',
    'Họ và tên',
    'Phòng ban',
    'Loại nghỉ phép',
    'Từ ngày',
    'Đến ngày',
    'Số ngày',
    'Lý do nghỉ',
    'Trạng thái',
    'Ngày nộp đơn',
  ];
  const leaveRows = leaveRequests.map((l) => [
    l.id,
    l.employeeId,
    l.employeeName,
    l.department,
    LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
    formatDate(l.fromDate),
    formatDate(l.toDate),
    l.totalDays,
    l.reason,
    l.status === 'approved' ? 'Đã duyệt' : l.status === 'rejected' ? 'Bị từ chối' : l.status === 'cancelled' ? 'Đã hủy' : 'Chờ duyệt',
    formatDateTime(l.createdAt),
  ]);
  setupSheet('Đơn xin nghỉ phép', 'DANH SÁCH SAO LƯU ĐƠN XIN NGHỈ PHÉP', leaveHeaders, leaveRows, [0, 1, 5, 6, 7, 9, 10]);

  // 2. Sheet: Phiếu ra vào cổng
  const gateHeaders = [
    'Mã phiếu',
    'Mã nhân viên',
    'Họ và tên',
    'Phòng ban',
    'Hình thức ra vào',
    'Ca làm việc',
    'Lý do ra cổng',
    'TG ra dự kiến',
    'TG vào dự kiến',
    'Bảo vệ quét ra',
    'Bảo vệ quét vào',
    'Trạng thái',
    'Ngày tạo',
  ];
  const gateRows = gatePasses.map((g) => [
    g.id,
    g.employeeId,
    g.employeeName,
    g.department,
    g.timeType === 'nghi_dau_gio' ? 'Nghỉ đầu giờ' : g.timeType === 'nghi_cuoi_gio' ? 'Nghỉ cuối giờ' : 'Nghỉ trong giờ',
    g.shift || 'Ca HC',
    g.purpose,
    g.estimatedDepartureTime ? formatDateTime(g.estimatedDepartureTime) : '-',
    g.estimatedReturnTime ? formatDateTime(g.estimatedReturnTime) : '-',
    g.actualDepartureTime ? formatDateTime(g.actualDepartureTime) : '-',
    g.actualReturnTime ? formatDateTime(g.actualReturnTime) : (g.timeType === 'nghi_cuoi_gio' ? 'Không về lại' : '-'),
    g.status === 'approved' ? 'Đã duyệt' : g.status === 'departed' ? 'Đang ra ngoài' : g.status === 'completed' ? 'Hoàn tất' : g.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt',
    formatDateTime(g.createdAt),
  ]);
  setupSheet('Phiếu ra - vào cổng', 'DANH SÁCH SAO LƯU PHIẾU RA - VÀO CỔNG', gateHeaders, gateRows, [0, 1, 4, 5, 7, 8, 9, 10, 11, 12]);

  // 3. Sheet: Phiếu xác nhận công
  const attHeaders = [
    'Mã phiếu',
    'Mã nhân viên',
    'Họ và tên',
    'Phòng ban',
    'Sự cố',
    'Ngày xác nhận',
    'Ca làm việc',
    'Giờ vào thực tế',
    'Giờ ra thực tế',
    'Lý do giải trình',
    'Trạng thái',
    'Ngày nộp',
  ];
  const attRows = attendanceConfirms.map((a) => [
    a.id,
    a.employeeId,
    a.employeeName,
    a.department,
    ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType,
    formatDate(a.date),
    a.shift || 'Ca HC',
    a.checkInTime,
    a.checkOutTime,
    a.reason,
    a.status === 'approved' ? 'Đã duyệt' : a.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt',
    formatDateTime(a.createdAt),
  ]);
  setupSheet('Phiếu xác nhận công', 'DANH SÁCH SAO LƯU PHIẾU XÁC NHẬN CÔNG', attHeaders, attRows, [0, 1, 4, 5, 6, 7, 8, 10, 11]);

  const now = new Date();
  const dateSuffix = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const outName = fileName || `LONGKHAI_Backup_Phieu_${dateSuffix}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `${outName}.xlsx`);
}
