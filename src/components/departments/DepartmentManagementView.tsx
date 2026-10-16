'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { Department, User } from '@/types/user';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle2,
  Shield,
  Briefcase,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function DepartmentManagementView() {
  const { currentUser } = useAuth();
  const [departments, setDepartments] = useState<Department[]>(() => storage.getDepartments());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr';

  // Calculate member count for each department
  const getMemberCount = (deptName: string) => {
    return users.filter((u) => u.department.toLowerCase() === deptName.toLowerCase()).length;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setDescription('');
    setManagerId('');
    setFormError(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setDescription(dept.description || '');
    setManagerId(dept.managerId || '');
    setFormError(null);
    setShowModal(true);
  };

  // Save Department (Add or Edit)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      setFormError('Vui lòng nhập đầy đủ Mã phòng ban và Tên phòng ban.');
      return;
    }

    // Check duplicate code (except current editing)
    const duplicate = departments.find(
      (d) =>
        d.code.toUpperCase() === cleanCode &&
        (!editingDept || d.id !== editingDept.id)
    );
    if (duplicate) {
      setFormError(`Mã phòng ban "${cleanCode}" đã tồn tại trên hệ thống.`);
      return;
    }

    const selectedManager = users.find((u) => u.id === managerId);
    const now = new Date().toISOString();

    let updatedList: Department[];

    if (editingDept) {
      // Edit
      updatedList = departments.map((d) => {
        if (d.id === editingDept.id) {
          return {
            ...d,
            code: cleanCode,
            name: cleanName,
            description: description.trim() || undefined,
            managerId: managerId || undefined,
            managerName: selectedManager?.name || undefined,
            updatedAt: now,
          };
        }
        return d;
      });
    } else {
      // Add
      const newId = `PB-${cleanCode}`;
      const newDept: Department = {
        id: newId,
        code: cleanCode,
        name: cleanName,
        description: description.trim() || undefined,
        managerId: managerId || undefined,
        managerName: selectedManager?.name || undefined,
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [...departments, newDept];
    }

    storage.saveDepartments(updatedList, { id: currentUser.id, name: currentUser.name });
    setDepartments(updatedList);
    setShowModal(false);
  };

  // Delete Department
  const handleDelete = (dept: Department) => {
    if (!currentUser) return;
    const memberCount = getMemberCount(dept.name);

    if (memberCount > 0) {
      const confirmDelete = confirm(
        `Phòng ban "${dept.name}" hiện đang có ${memberCount} nhân viên trực thuộc. Bạn có chắc chắn muốn xóa không?`
      );
      if (!confirmDelete) return;
    } else {
      const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}"?`);
      if (!confirmDelete) return;
    }

    const updatedList = departments.filter((d) => d.id !== dept.id);
    storage.saveDepartments(updatedList, { id: currentUser.id, name: currentUser.name });
    setDepartments(updatedList);
  };

  const filtered = departments.filter((d) => {
    return (
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Quản Lý Danh Mục Phòng Ban
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thêm, sửa, xóa các phòng ban, xưởng sản xuất và bộ phận trong nhà máy
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phòng ban mới</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên phòng ban, mã phòng ban..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept) => {
          const members = getMemberCount(dept.name);
          return (
            <div
              key={dept.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {dept.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <b>{members}</b> nhân viên
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {dept.description || 'Chưa có mô tả cho phòng ban này.'}
                  </p>
                </div>

                {dept.managerName && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span>Trưởng BP: <b>{dept.managerName}</b></span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                    title="Chỉnh sửa phòng ban"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1"
                    title="Xóa phòng ban"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: Add / Edit Department */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingDept ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Phòng Ban Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mã phòng ban (Viết tắt):
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: SX1, CD, QA, HCNS, KT..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên phòng ban / Bộ phận:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Xưởng Sản Xuất 1, Phòng Cơ Điện..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chức năng nhiệm vụ:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nhiệm vụ chính của phòng ban..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trưởng bộ phận phụ trách:
                </label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">-- Chưa chỉ định --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.id} - {u.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  {editingDept ? 'Cập nhật' : 'Thêm phòng ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
