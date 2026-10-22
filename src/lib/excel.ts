import * as XLSX from 'xlsx';
import { User, UserRole, CategoryPermission, CATEGORY_DEFINITIONS } from '@/types/user';

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


export interface ExportReportOptions {
  title: string;
  subtitle: string;
  docCode?: string;
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  colWidths?: number[];
}

export function exportReportToExcel(opts: ExportReportOptions) {
  const now = new Date();
  const exportDate = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const aoa: any[][] = [
    ['CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG'],
    ['Hệ thống Quản trị & Điều hành Sản xuất Nội bộ'],
    [`Ngày xuất báo cáo: ${exportDate} | Mã tài liệu: ${opts.docCode || 'BC-LK-2026/01'}`],
    [],
    [`BÁO CÁO TỔNG HỢP ${opts.title.toUpperCase()}`],
    [opts.subtitle],
    [],
    opts.headers,
    ...opts.rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);

  if (opts.colWidths && opts.colWidths.length > 0) {
    worksheet['!cols'] = opts.colWidths.map((w) => ({ wch: w }));
  } else {
    worksheet['!cols'] = opts.headers.map((h, i) => {
      let maxLen = h.length;
      opts.rows.forEach((r) => {
        const valStr = String(r[i] || '');
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      return { wch: Math.min(Math.max(maxLen + 4, 14), 45) };
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo cáo');
  XLSX.writeFile(workbook, `${opts.fileName}.xlsx`);
}
