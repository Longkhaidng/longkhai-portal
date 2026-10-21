'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { User, CategoryPermission, CATEGORY_DEFINITIONS, UserRole, Department } from '@/types/user';
import {
  Users,
  Upload,
  Download,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  UserPlus,
  Globe,
  Pencil,
  Trash2,
} from 'lucide-react';
import { INITIAL_ROOT_ADMIN } from '@/lib/initial-data';
import {
  parseEmployeeExcel,
  generateEmployeeTemplateExcel,
  exportAllUsersToExcel,
  ParsedEmployeeResult,
} from '@/lib/excel';


const ROLE_LABELS: Record<UserRole, { label: string; badge: string }> = {
  admin: { label: 'Quản trị viên (Admin)', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
  manager: { label: 'Trưởng bộ phận (Manager)', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
  team_leader: { label: 'Tổ trưởng (Team Leader)', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  hr: { label: 'Nhân sự (HR)', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  cb: { label: 'Nhân viên C&B', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  security: { label: 'Bảo vệ cổng (Security)', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  accountant: { label: 'Kế toán', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  it: { label: 'CNTT (IT)', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
  ehs: { label: 'An toàn (EHS)', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  employee: { label: 'Công nhân / Nhân viên', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

export function UserManagementView() {
  const { currentUser, reloadCurrentUser } = useAuth();
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [departments, setDepartments] = useState<Department[]>(() => storage.getDepartments());
  const [allWebsites, setAllWebsites] = useState(() => storage.getWebIntegrations());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Excel Upload Modal State (with 2 options: 'update' or 'replace')
  const [importMode, setImportMode] = useState<'update' | 'replace'>('update');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedEmployeeResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

// Permission Matrix Modal State
  const [permissionTargetUser, setPermissionTargetUser] = useState<User | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<CategoryPermission[]>([]);
  const [selectedWebIntegrations, setSelectedWebIntegrations] = useState<string[]>([]);

  // Manual Add New User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpDept, setNewEmpDept] = useState(departments[0]?.name || 'Xưởng Sản Xuất 1');
  const [newEmpPos, setNewEmpPos] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<UserRole>('employee');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpTeamLeader, setNewEmpTeamLeader] = useState('');
  const [newEmpDeptHead, setNewEmpDeptHead] = useState('');
  const [newEmpEconomicStaff, setNewEmpEconomicStaff] = useState('');
  const [newEmpDeptHeadEmail, setNewEmpDeptHeadEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('LK@123456');
  const [newEmpPerms, setNewEmpPerms] = useState<CategoryPermission[]>([
    'dashboard',
    'leave',
    'attendance',
    'gate_pass',
    'announcements',
  ]);
  const [newEmpWebIntegrations, setNewEmpWebIntegrations] = useState<string[]>([]);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPos, setEditPos] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTeamLeader, setEditTeamLeader] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editEconomicStaff, setEditEconomicStaff] = useState('');
  const [editDeptHeadEmail, setEditDeptHeadEmail] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  // Filter list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase()) ||
      u.position.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || u.department === deptFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  // Handle Open Add User Modal
  const handleOpenAddUser = () => {
    setNewEmpId('');
    setNewEmpName('');
    setNewEmpDept(departments[0]?.name || 'Xưởng Sản Xuất 1');
    setNewEmpPos('');
    setNewEmpRole('employee');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpTeamLeader('');
    setNewEmpDeptHead('');
    setNewEmpDeptHeadEmail('');
    setNewEmpPassword('LK@123456');
    setNewEmpPerms(['dashboard', 'leave', 'attendance', 'gate_pass', 'announcements']);
    setNewEmpWebIntegrations([]);
    setAllWebsites(storage.getWebIntegrations());
    setAddUserError(null);
    setShowAddUserModal(true);
  };

  // Handle Save Manual User
  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setAddUserError(null);

    const cleanId = newEmpId.trim().toUpperCase();
    const cleanName = newEmpName.trim();

    if (!cleanId || !cleanName) {
      setAddUserError('Vui lòng nhập đầy đủ Mã nhân viên và Họ tên.');
      return;
    }

    // Check duplicate ID
    const exists = users.find((u) => u.id.toLowerCase() === cleanId.toLowerCase());
    if (exists) {
      setAddUserError(`Mã nhân viên "${cleanId}" đã tồn tại trên hệ thống.`);
      return;
    }

    const now = new Date().toISOString();
    const newUser: User = {
      id: cleanId,
      name: cleanName,
      department: newEmpDept,
      position: newEmpPos.trim() || 'Nhân viên',
      role: newEmpRole,
      email: newEmpEmail.trim() || undefined,
      phone: newEmpPhone.trim() || undefined,
      teamLeaderId: newEmpTeamLeader.trim() || undefined,
      departmentHeadId: newEmpDeptHead.trim() || undefined,
      economicStaffId: newEmpEconomicStaff.trim() || undefined,
      departmentHeadEmail: newEmpDeptHeadEmail.trim() || undefined,
      permissions: newEmpRole === 'admin' ? CATEGORY_DEFINITIONS.map((c) => c.id) : newEmpPerms,
      allowedWebIntegrations: newEmpWebIntegrations,
      isActive: true,
      password: newEmpPassword.trim() || 'LK@123456',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newUser, ...users];
    storage.saveUsers(updated, { id: currentUser.id, name: currentUser.name });
    setUsers(updated);
    reloadCurrentUser();
    setShowAddUserModal(false);
  };

  // Handle Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditDept(user.department);
    setEditPos(user.position);
    setEditRole(user.role);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditTeamLeader(user.teamLeaderId || '');
    setEditDeptHead(user.departmentHeadId || '');
    setEditEconomicStaff(user.economicStaffId || '');
    
    // Do not auto-lookup manager's email; default to empty if not explicitly set
    setEditDeptHeadEmail(user.departmentHeadEmail || '');

    setEditIsActive(user.isActive);
    setEditError(null);
  };

  // Handle Save Edited User
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingUser) return;
    setEditError(null);

    const cleanName = editName.trim();
    if (!cleanName) {
      setEditError('Họ và tên không được để trống.');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: cleanName,
          department: editDept,
          position: editPos.trim() || 'Nhân viên',
          role: editRole,
          email: editEmail.trim() || undefined,
          phone: editPhone.trim() || undefined,
          teamLeaderId: editTeamLeader.trim() || undefined,
          departmentHeadId: editDeptHead.trim() || undefined,
          economicStaffId: editEconomicStaff.trim() || undefined,
          departmentHeadEmail: editDeptHeadEmail.trim() || undefined,
          isActive: editIsActive,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    storage.saveUsers(updated, { id: currentUser.id, name: currentUser.name });
    setUsers(updated);
    reloadCurrentUser();
    setEditingUser(null);
  };

  // Handle Delete User
  const handleDeleteUser = (target: User) => {
    if (!currentUser) return;
    if (target.id === '2265' || target.id === 'ADMIN01') {
      alert('Không thể xóa tài khoản Quản trị viên khởi tạo (Root Admin 2265)!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên "${target.name}" (${target.id}) khỏi hệ thống?`)) {
      const updated = users.filter((u) => u.id !== target.id);
      storage.saveUsers(updated, { id: currentUser.id, name: currentUser.name });
      setUsers(updated);
      reloadCurrentUser();
      if (editingUser?.id === target.id) {
        setEditingUser(null);
      }
    }
  };

  // Handle Excel file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setIsParsing(true);
    setUploadError(null);

    try {
      const result = await parseEmployeeExcel(file);
      setParsedResult(result);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi đọc file Excel');
      setParsedResult(null);
    } finally {
      setIsParsing(false);
    }
  };


// Confirm import parsed users from Excel: Tùy chọn 1 (Cập nhật nhân viên mới) hoặc Tùy chọn 2 (Thay thế toàn bộ)
  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.users.length === 0 || !currentUser) return;
    const incoming = parsedResult.users;

    if (importMode === 'replace') {
      const warnMsg = `CẢNH BÁO: Bạn đang chọn THAY THẾ TOÀN BỘ danh sách nhân viên!\n\nHành động này sẽ XÓA TẤT CẢ ${users.length} nhân viên hiện tại trên hệ thống và thay bằng ${incoming.length} nhân viên trong file Excel.\n(Tài khoản Quản trị viên 2265 vẫn được bảo lưu an toàn).\n\nBạn có chắc chắn muốn thực hiện thay thế?`;
      if (!confirm(warnMsg)) return;

      // Preserve root admin (2265 / ADMIN01) if not included in the file
      const rootAdmin = users.find((u) => u.id === '2265' || u.id === 'ADMIN01') || INITIAL_ROOT_ADMIN;
      const hasRoot = incoming.some((u) => u.id === '2265' || u.id === 'ADMIN01');
      const finalUsers = hasRoot ? incoming : [rootAdmin, ...incoming];

      storage.saveUsers(finalUsers, { id: currentUser.id, name: currentUser.name });
      setUsers(finalUsers);
      reloadCurrentUser();
      setShowUploadModal(false);
      setUploadFile(null);
      setParsedResult(null);
      alert(`Đã thay thế toàn bộ danh sách thành công!\nTổng số nhân viên mới trên hệ thống: ${finalUsers.length} người.`);
    } else {
      // importMode === 'update' (Cập nhật nhân viên mới & thông tin nhân viên đã có)
      const existing = [...users];
      let newCount = 0;
      let updateCount = 0;

      incoming.forEach((newUser) => {
        const index = existing.findIndex((u) => u.id.toLowerCase() === newUser.id.toLowerCase());
        if (index >= 0) {
          updateCount++;
          existing[index] = {
            ...existing[index],
            ...newUser,
            updatedAt: new Date().toISOString(),
          };
        } else {
          newCount++;
          existing.push(newUser);
        }
      });

      storage.saveUsers(existing, { id: currentUser.id, name: currentUser.name });
      setUsers(existing);
      reloadCurrentUser();
      setShowUploadModal(false);
      setUploadFile(null);
      setParsedResult(null);
      alert(`Cập nhật danh sách nhân viên thành công!\n- Thêm mới: ${newCount} nhân viên\n- Cập nhật: ${updateCount} nhân viên\nTổng cộng hiện có: ${existing.length} nhân viên trong hệ thống.`);
    }
  };

  // Open Permission Matrix for a User
  const handleOpenPermissions = (target: User) => {
    setPermissionTargetUser(target);
    setSelectedPermissions(target.permissions || []);
    setSelectedWebIntegrations(target.allowedWebIntegrations || []);
    setAllWebsites(storage.getWebIntegrations());
  };

  // Toggle single category permission
  const handleTogglePermission = (catId: CategoryPermission) => {
    if (selectedPermissions.includes(catId)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== catId));
    } else {
      setSelectedPermissions([...selectedPermissions, catId]);
    }
  };

  // Select all or deselect all
  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === CATEGORY_DEFINITIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(CATEGORY_DEFINITIONS.map((c) => c.id));
    }
  };

  // Save updated permissions
  const handleSavePermissions = () => {
    if (!permissionTargetUser || !currentUser) return;

    const updatedUsers = users.map((u) => {
      if (u.id === permissionTargetUser.id) {
        return {
          ...u,
          permissions: selectedPermissions,
          allowedWebIntegrations: selectedWebIntegrations,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    storage.saveUsers(updatedUsers, { id: currentUser.id, name: currentUser.name });
    setUsers(updatedUsers);
    reloadCurrentUser();
    setPermissionTargetUser(null);
  };

  // Toggle User Active / Inactive Status
  const handleToggleStatus = (target: User) => {
    if (!currentUser) return;
    if (target.id === '2265' || target.id === 'ADMIN01') {
      alert('Không thể khóa tài khoản Root Admin 2265!');
      return;
    }

    const updated = users.map((u) => {
      if (u.id === target.id) {
        return { ...u, isActive: !u.isActive, updatedAt: new Date().toISOString() };
      }
      return u;
    });

    storage.saveUsers(updated, { id: currentUser.id, name: currentUser.name });
    setUsers(updated);
  };

  // Reset User Password
  const handleResetPassword = (target: User) => {
    const newPass = prompt(`Nhập mật khẩu mới cho nhân viên ${target.name} (${target.id}):`, 'LK@123456');
    if (!newPass || !currentUser) return;

    const updated = users.map((u) => {
      if (u.id === target.id) {
        return { ...u, password: newPass, updatedAt: new Date().toISOString() };
      }
      return u;
    });

    storage.saveUsers(updated, { id: currentUser.id, name: currentUser.name });
    setUsers(updated);
    alert(`Đã đặt lại mật khẩu cho ${target.name} thành công!`);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Quản Lý Nhân Viên & Phân Quyền
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm nhân viên mới, nạp danh sách Excel và phân quyền truy cập chi tiết từng danh mục
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Nút Thêm nhân viên mới */}
          <button
            onClick={handleOpenAddUser}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm nhân viên mới</span>
          </button>

          <button
            onClick={() => exportAllUsersToExcel(users)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
            title="Tải toàn bộ danh sách nhân viên hiện có về máy tính dạng file Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải danh sách nhân viên ({users.length})</span>
          </button>

          <button
            onClick={generateEmployeeTemplateExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Tải file Excel mẫu chuẩn"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải file Excel mẫu</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải lên danh sách Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã NV (Tên đăng nhập), Họ tên, Chức vụ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả chức vụ</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="manager">Trưởng bộ phận (Manager)</option>
            <option value="team_leader">Tổ trưởng (Team Leader)</option>
            <option value="hr">Nhân sự (HR)</option>
            <option value="cb">Nhân viên C&B</option>
            <option value="security">Bảo vệ cổng (Security)</option>
            <option value="accountant">Kế toán</option>
            <option value="it">CNTT (IT)</option>
            <option value="employee">Công nhân / Nhân viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4">Mã NV (Tên Đăng Nhập)</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Phòng ban & Vị trí</th>
                <th className="py-3.5 px-4">Chức vụ</th>
                <th className="py-3.5 px-4">Danh mục được cấp quyền</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chưa có nhân viên nào phù hợp. Vui lòng nhấn "+ Thêm nhân viên mới" hoặc "Tải lên danh sách Excel".
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const isRoot = u.id === '2265' || u.id === 'ADMIN01';
                  const permCount = u.role === 'admin' ? CATEGORY_DEFINITIONS.length : u.permissions?.length || 0;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {u.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                        {u.email && <div className="text-[11px] text-slate-400">{u.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {u.department}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.position}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ROLE_LABELS[u.role]?.badge || 'bg-slate-100 text-slate-700'}`}>
                          {ROLE_LABELS[u.role]?.label || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {permCount} / {CATEGORY_DEFINITIONS.length} danh mục
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3" />
                          <span>
                            {u.role === 'admin'
                              ? `Tất cả website (${allWebsites.filter((w) => w.isActive).length})`
                              : `${u.allowedWebIntegrations?.length || 0} website con`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[220px] mt-0.5">
                          {u.role === 'admin'
                            ? 'Toàn quyền hệ thống (Administrator)'
                            : u.permissions?.join(', ')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Tạm khóa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold border border-amber-200 dark:border-amber-800/60 transition-colors inline-flex items-center gap-1"
                          title="Chỉnh sửa thông tin nhân viên"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={() => handleOpenPermissions(u)}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200 dark:border-blue-800/60 transition-colors inline-flex items-center gap-1"
                          title="Cấu hình danh mục được phép vào"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Phân quyền</span>
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {!isRoot && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                              title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                            >
                              {u.isActive ? (
                                <Lock className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Xóa nhân viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW EMPLOYEE MANUALLY */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Thêm Nhân Viên Mới Vào Hệ Thống
                </h3>
                <p className="text-xs text-slate-500">
                  Tạo tài khoản với Tên đăng nhập là Mã số nhân viên
                </p>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {addUserError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số nhân viên (Tên đăng nhập): *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpId}
                    onChange={(e) => setNewEmpId(e.target.value)}
                    placeholder="VD: LK-105, LK-201..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên nhân viên: *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng ban / Xưởng: *
                  </label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vị trí công tác:
                  </label>
                  <input
                    type="text"
                    value={newEmpPos}
                    onChange={(e) => setNewEmpPos(e.target.value)}
                    placeholder="VD: Công nhân tiện CNC, Kế toán..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chức vụ:
                  </label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="employee">Nhân viên / Công nhân</option>
                    <option value="team_leader">Tổ trưởng</option>
                    <option value="manager">Trưởng bộ phận</option>
                    <option value="hr">Nhân sự (HR)</option>
                    <option value="cb">Nhân viên C&B</option>
                    <option value="security">Bảo vệ cổng</option>
                    <option value="accountant">Kế toán</option>
                    <option value="it">CNTT (IT)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    placeholder="0901234567..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu ban đầu:
                  </label>
                  <input
                    type="text"
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Tổ trưởng (nếu có):
                  </label>
                  <input
                    type="text"
                    value={newEmpTeamLeader}
                    onChange={(e) => setNewEmpTeamLeader(e.target.value)}
                    placeholder="Mã NV của Tổ trưởng..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Trưởng bộ phận:
                  </label>
                  <input
                    type="text"
                    value={newEmpDeptHead}
                    onChange={(e) => setNewEmpDeptHead(e.target.value)}
                    placeholder="Mã NV của Trưởng BP..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã nhân viên kinh tế (nếu có):
                  </label>
                  <input
                    type="text"
                    value={newEmpEconomicStaff}
                    onChange={(e) => setNewEmpEconomicStaff(e.target.value)}
                    placeholder="Ví dụ: 1912, 2754... (để chuyển cắt cơm)"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                  {newEmpEconomicStaff.trim() && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      {(() => {
                        const found = users.find((u) => u.id.toLowerCase() === newEmpEconomicStaff.trim().toLowerCase());
                        return found ? `✓ ${found.name} (${found.position || found.department})` : '⚠️ Chưa tìm thấy mã NV này';
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Trưởng bộ phận (Nếu không nhập thì để trống):
                  </label>
                  <input
                    type="email"
                    value={newEmpDeptHeadEmail}
                    onChange={(e) => setNewEmpDeptHeadEmail(e.target.value)}
                    placeholder="Để trống nếu duyệt qua Cổng Portal..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Category Permissions checkbox */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block font-bold text-slate-800 dark:text-white mb-2">
                  Phân quyền danh mục cho nhân viên này:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {CATEGORY_DEFINITIONS.map((cat) => {
                    const isChecked = newEmpPerms.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setNewEmpPerms(newEmpPerms.filter((p) => p !== cat.id));
                            } else {
                              setNewEmpPerms([...newEmpPerms, cat.id]);
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                        <span className="font-semibold">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Web Integrations permissions checkbox */}
              {allWebsites.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
                      <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Phân quyền Website Tích Hợp (Menu con):</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (newEmpWebIntegrations.length === allWebsites.length) {
                          setNewEmpWebIntegrations([]);
                        } else {
                          setNewEmpWebIntegrations(allWebsites.map((w) => w.id));
                        }
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      {newEmpWebIntegrations.length === allWebsites.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                    {allWebsites.map((site) => {
                      const isChecked = newEmpWebIntegrations.includes(site.id);
                      return (
                        <label
                          key={site.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewEmpWebIntegrations(newEmpWebIntegrations.filter((id) => id !== site.id));
                              } else {
                                setNewEmpWebIntegrations([...newEmpWebIntegrations, site.id]);
                              }
                            }}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-semibold truncate">{site.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Tạo tài khoản nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXCEL UPLOAD AND PREVIEW */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tải Lên Danh Sách Nhân Viên Bằng File Excel
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống tự động tạo tài khoản với Tên đăng nhập là Mã số nhân viên
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Upload drag-drop area */}
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <label className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  <span>Nhấp để chọn file Excel (.xlsx / .xls)</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Định dạng hỗ trợ: Microsoft Excel (.xlsx, .xls)
                </p>
              </div>

              {uploadFile && (
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl inline-block">
                  Tệp đã chọn: <b>{uploadFile.name}</b> ({(uploadFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Preview Parsed Data */}
            {parsedResult && (() => {
              const previewNewCount = parsedResult.users.filter(
                (nu) => !users.some((u) => u.id.toLowerCase() === nu.id.toLowerCase())
              ).length;
              const previewUpdateCount = parsedResult.users.length - previewNewCount;

              return (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Cập nhật trực tiếp vào hệ thống (Không cần xóa cài lại):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Hệ thống sẽ <b>thêm mới {previewNewCount} nhân viên</b> chưa có và <b>cập nhật {previewUpdateCount} nhân viên</b> đã tồn tại theo Mã NV. Dữ liệu nhân sự hiện có được giữ nguyên an toàn.
                  </p>
                </div>

                {/* 2 TÙY CHỌN NẠP EXCEL */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Chọn phương thức nạp dữ liệu vào hệ thống:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Tùy chọn 1: Cập nhật nhân viên mới */}
                    <div
                      onClick={() => setImportMode('update')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        importMode === 'update'
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'update'}
                          onChange={() => setImportMode('update')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Cập nhật nhân viên mới</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">Khuyên dùng</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            Cập nhật thông tin nhân viên mới chưa có trong danh sách hiện tại. Giữ nguyên an toàn toàn bộ dữ liệu nhân viên cũ.
                          </p>
                          <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            Thêm mới: +{previewNewCount} &bull; Cập nhật: {previewUpdateCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tùy chọn 2: Thay thế toàn bộ */}
                    <div
                      onClick={() => setImportMode('replace')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        importMode === 'replace'
                          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="mt-0.5 text-rose-600"
                        />
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                            <span>Thay thế toàn bộ</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-semibold">Xóa danh sách cũ</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            Xóa tất cả nhân viên hiện tại trong danh sách ({users.length} người) và thay thế hoàn toàn bằng danh sách trong file mẫu tải lên.
                          </p>
                          <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                            Bảo lưu an toàn tài khoản Quản trị viên 2265
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Xem trước danh sách ({parsedResult.users.length} dòng):
                  </span>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-emerald-600">Mới: +{previewNewCount}</span>
                    <span className="text-blue-600">Cập nhật: {previewUpdateCount}</span>
                    <span className="text-slate-500">Tổng: {parsedResult.users.length}</span>
                  </div>
                </div>

                {parsedResult.errors.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1 max-h-24 overflow-y-auto">
                    <div className="font-bold">Cảnh báo một số dòng lỗi:</div>
                    {parsedResult.errors.map((err, idx) => (
                      <div key={idx} className="text-[11px]">• {err}</div>
                    ))}
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 border-b text-slate-500">
                        <th className="p-2">Mã NV</th>
                        <th className="p-2">Họ tên</th>
                        <th className="p-2">Phòng ban</th>
                        <th className="p-2">Chức vụ</th>
                        <th className="p-2">Quyền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedResult.users.slice(0, 10).map((u) => (
                        <tr key={u.id}>
                          <td className="p-2 font-mono font-bold text-blue-600">{u.id}</td>
                          <td className="p-2 font-semibold">{u.name}</td>
                          <td className="p-2">{u.department}</td>
                          <td className="p-2">{u.position}</td>
                          <td className="p-2">{u.permissions.length} mục</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!parsedResult || parsedResult.users.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors ${
                  importMode === 'replace'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {importMode === 'replace'
                  ? `Thay thế toàn bộ (${parsedResult?.users.length || 0} nhân viên)`
                  : `Cập nhật nhân viên mới (${parsedResult?.users.length || 0} nhân viên)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PERMISSION MATRIX BY CATEGORY & INTEGRATED WEBSITES */}
      {permissionTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase">
                  Phân quyền hệ thống &amp; Menu con
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {permissionTargetUser.name} ({permissionTargetUser.id})
                </h3>
                <p className="text-xs text-slate-500">
                  {permissionTargetUser.position} &bull; {permissionTargetUser.department}
                </p>
              </div>
              <button
                onClick={() => setPermissionTargetUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Select All Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                1. Chọn các danh mục hệ thống được phép truy cập:
              </span>
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedPermissions.length === CATEGORY_DEFINITIONS.length
                  ? 'Bỏ chọn tất cả'
                  : 'Chọn tất cả'}
              </button>
            </div>

            {/* Checkbox grid of all categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {CATEGORY_DEFINITIONS.map((cat) => {
                const isChecked = selectedPermissions.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    onClick={() => handleTogglePermission(cat.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-900 text-blue-950 dark:text-blue-200 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-xs">{cat.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{cat.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Website Integrations Submenu Permission Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Phân quyền Menu Con: Website Tích Hợp ({selectedWebIntegrations.length} / {allWebsites.length}):
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedWebIntegrations.length === allWebsites.length) {
                      setSelectedWebIntegrations([]);
                    } else {
                      setSelectedWebIntegrations(allWebsites.map((w) => w.id));
                    }
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {selectedWebIntegrations.length === allWebsites.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {allWebsites.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400 italic py-2 text-center">
                    Chưa có website nào được tích hợp trong hệ thống.
                  </p>
                ) : (
                  allWebsites.map((site) => {
                    const isChecked = selectedWebIntegrations.includes(site.id);
                    return (
                      <label
                        key={site.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedWebIntegrations(selectedWebIntegrations.filter((id) => id !== site.id));
                          } else {
                            setSelectedWebIntegrations([...selectedWebIntegrations, site.id]);
                          }
                        }}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-indigo-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{site.title}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {site.url}
                          </div>
                          <div className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                            {site.displayMode === 'new_tab' ? 'Mở tab mới (External)' : 'Nhúng trong trang (Embed)'}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPermissionTargetUser(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Lưu phân quyền ({selectedPermissions.length} danh mục, {selectedWebIntegrations.length} website)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT EMPLOYEE INFO */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-[11px]">
                    {editingUser.id}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Chỉnh Sửa Thông Tin Nhân Viên
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật họ tên, phòng ban, vị trí công tác, chức vụ và thông tin liên hệ
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã số nhân viên (Tên đăng nhập):
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.id}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase text-slate-500 cursor-not-allowed"
                    title="Mã nhân viên cố định để đảm bảo toàn vẹn dữ liệu hồ sơ"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên nhân viên: *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng ban / Xưởng: *
                  </label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vị trí công tác:
                  </label>
                  <input
                    type="text"
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value)}
                    placeholder="VD: Công nhân tiện CNC, Kế toán..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Chức vụ:
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={editingUser.id === '2265' || editingUser.id === 'ADMIN01'}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-60"
                  >
                    <option value="employee">Nhân viên / Công nhân</option>
                    <option value="team_leader">Tổ trưởng</option>
                    <option value="manager">Trưởng bộ phận</option>
                    <option value="hr">Nhân sự (HR)</option>
                    <option value="cb">Nhân viên C&B</option>
                    <option value="security">Bảo vệ cổng</option>
                    <option value="accountant">Kế toán</option>
                    <option value="it">CNTT (IT)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="0901234567..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email công việc:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="nhanvien@longkhai.vn..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Tổ trưởng (nếu có):
                  </label>
                  <input
                    type="text"
                    value={editTeamLeader}
                    onChange={(e) => setEditTeamLeader(e.target.value)}
                    placeholder="Mã NV của Tổ trưởng..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Trưởng bộ phận:
                  </label>
                  <input
                    type="text"
                    value={editDeptHead}
                    onChange={(e) => setEditDeptHead(e.target.value)}
                    placeholder="Mã NV của Trưởng BP..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mã nhân viên kinh tế:
                  </label>
                  <input
                    type="text"
                    value={editEconomicStaff}
                    onChange={(e) => setEditEconomicStaff(e.target.value)}
                    placeholder="Mã NV kinh tế để chuyển cắt cơm..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                  />
                  {editEconomicStaff.trim() && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      {(() => {
                        const found = users.find((u) => u.id.toLowerCase() === editEconomicStaff.trim().toLowerCase());
                        return found ? `✓ ${found.name} (${found.position || found.department})` : '⚠️ Chưa tìm thấy mã NV này';
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Trưởng bộ phận (Nếu không nhập thì để trống):
                  </label>
                  <input
                    type="email"
                    value={editDeptHeadEmail}
                    onChange={(e) => setEditDeptHeadEmail(e.target.value)}
                    placeholder="Để trống nếu duyệt qua Cổng Portal theo Mã NV..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái tài khoản:
                </label>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  disabled={editingUser.id === '2265' || editingUser.id === 'ADMIN01'}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold disabled:opacity-60"
                >
                  <option value="active">🟢 Đang hoạt động (Active)</option>
                  <option value="inactive">🔴 Tạm khóa (Inactive)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  {(editingUser.id !== '2265' && editingUser.id !== 'ADMIN01') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(editingUser)}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa nhân viên</span>
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
