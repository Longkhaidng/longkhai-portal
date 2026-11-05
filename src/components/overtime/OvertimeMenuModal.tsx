'use client';

import React, { useState } from 'react';
import { OvertimeMealMenu } from '@/types/overtime';
import { X, Utensils, Plus, Trash2, Edit3, Calendar, Clock, Check, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface OvertimeMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  menus: OvertimeMealMenu[];
  onSaveMenu: (menu: OvertimeMealMenu) => void;
  onDeleteMenu: (id: string) => void;
}

export function OvertimeMenuModal({
  isOpen,
  onClose,
  menus,
  onSaveMenu,
  onDeleteMenu,
}: OvertimeMenuModalProps) {
  const [filterDate, setFilterDate] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shiftTime, setShiftTime] = useState<string>('Sau ca chiều (16:30 - 18:30)');
  const [dishName, setDishName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const commonShiftTimes = [
    'Sau ca chiều (16:30 - 18:30)',
    'Ca ngày (11:30 - 12:30)',
    'Ca đêm (22:00 - 02:00)',
    'Tất cả các ca',
  ];

  const commonDishes = [
    'Cơm sườn nướng mỡ hành + Canh cải ngọt',
    'Bún bò giò heo Huế + Bánh mì',
    'Cơm đùi gà chiên mắm + Canh rau củ',
    'Mì Quảng tôm thịt trứng + Bánh tráng mè',
    'Bánh mì chả lụa xá xíu + Sữa chua nếp cẩm',
    'Hủ tiếu Nam Vang thịt bằm trứng cút',
    'Bánh bao nhân thịt xá xíu + Sữa Fami',
  ];

  if (!isOpen) return null;

  const filteredMenus = menus.filter((m) => {
    if (filterDate && m.date !== filterDate) return false;
    return true;
  });

  const handleStartEdit = (m: OvertimeMealMenu) => {
    setEditingId(m.id);
    setDate(m.date);
    setShiftTime(m.shiftTime);
    setDishName(m.dishName);
    setNotes(m.notes || '');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setDishName('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) {
      alert('Vui lòng nhập tên món ăn');
      return;
    }

    const menu: OvertimeMealMenu = {
      id: editingId || `MENU-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      shiftTime,
      dishName: dishName.trim(),
      notes: notes.trim() || undefined,
      createdAt: editingId ? (menus.find((m) => m.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveMenu(menu);
    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Quản Lý Thực Đơn Ăn Giữa Ca Hằng Ngày (HCNS)
              </h3>
              <p className="text-[11px] text-emerald-100/90">
                Chỉ Quản trị viên &amp; HCNS có quyền thêm mới và điều chỉnh món ăn theo ngày cho nhân sự tăng ca
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700 dark:text-slate-200">
          {/* Form thêm/sửa món ăn */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{editingId ? 'Cập nhật món ăn thực đơn' : 'Thêm món ăn mới vào thực đơn:'}</span>
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Ngày tháng: *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Thời gian làm thêm giờ: *</span>
                </label>
                <input
                  type="text"
                  required
                  list="shiftTimesList"
                  value={shiftTime}
                  onChange={(e) => setShiftTime(e.target.value)}
                  placeholder="Ví dụ: Sau ca chiều (16:30 - 18:30)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
                <datalist id="shiftTimesList">
                  {commonShiftTimes.map((st) => (
                    <option key={st} value={st} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-emerald-600" />
                  <span>Tên món ăn: *</span>
                </label>
                <input
                  type="text"
                  required
                  list="dishesList"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Ví dụ: Cơm sườn nướng mỡ hành"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400"
                />
                <datalist id="dishesList">
                  {commonDishes.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Ghi chú thực đơn:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú nhà ăn, bếp phục vụ, đồ uống đi kèm..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  {editingId ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}
                </button>
              </div>
            </div>
          </form>

          {/* Danh sách thực đơn hiện có */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Danh sách thực đơn các ngày ({filteredMenus.length} món):
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Lọc theo ngày:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                {filterDate && (
                  <button
                    type="button"
                    onClick={() => setFilterDate('')}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-3 w-28">Ngày tháng</th>
                    <th className="p-3 w-48">Thời gian tăng ca</th>
                    <th className="p-3">Tên món ăn</th>
                    <th className="p-3">Ghi chú</th>
                    <th className="p-3 w-20 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMenus.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Chưa có món ăn nào trong thực đơn ngày này. Hãy thêm mới ở trên.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-semibold text-blue-700 dark:text-blue-400">
                          {formatDate(m.date)}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                          {m.shiftTime}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {m.dishName}
                        </td>
                        <td className="p-3 text-slate-500 italic">{m.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(m)}
                              className="p-1 rounded-md text-blue-600 hover:bg-blue-50"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Xóa món "${m.dishName}" khỏi thực đơn ngày ${formatDate(m.date)}?`)) {
                                  onDeleteMenu(m.id);
                                }
                              }}
                              className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
