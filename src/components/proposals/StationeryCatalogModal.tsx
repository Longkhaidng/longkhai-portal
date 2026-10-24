'use client';

import React, { useState } from 'react';
import { StationeryItem } from '@/types/proposal';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/common/Toast';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  RotateCcw,
} from 'lucide-react';

interface StationeryCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogUpdated?: () => void;
}

export function StationeryCatalogModal({
  isOpen,
  onClose,
  onCatalogUpdated,
}: StationeryCatalogModalProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<StationeryItem[]>(() => storage.getStationeryItems());
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Cây');
  const [category, setCategory] = useState('Bút viết');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const refreshList = () => {
    const list = storage.getStationeryItems();
    setItems(list);
    if (onCatalogUpdated) onCatalogUpdated();
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setCode(`VPP-${String(items.length + 1).padStart(3, '0')}`);
    setName('');
    setUnit('Cây');
    setCategory('Bút viết');
    setNotes('');
  };

  const handleOpenEdit = (item: StationeryItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setCode(item.id);
    setName(item.name);
    setUnit(item.unit);
    setCategory(item.category || 'Văn phòng phẩm');
    setNotes(item.notes || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !unit.trim()) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập Mã VPP, Tên VPP và Đơn vị tính.' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code if adding new
    if (!isEditing && items.some((i) => i.id.toUpperCase() === cleanCode)) {
      showToast({ type: 'error', title: 'Mã VPP đã tồn tại', message: `Mã ${cleanCode} đã có trong danh mục. Vui lòng chọn mã khác.` });
      return;
    }

    const itemToSave: StationeryItem = {
      id: cleanCode,
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim(),
      notes: notes.trim() || undefined,
      isActive: true,
    };

    storage.saveStationeryItem(itemToSave, { id: currentUser?.id || 'ADMIN', name: currentUser?.name || 'Quản trị viên' });
    refreshList();
    showToast({
      type: 'success',
      title: isEditing ? 'Đã cập nhật' : 'Đã thêm mới',
      message: `${isEditing ? 'Cập nhật' : 'Thêm'} mặt hàng ${itemToSave.name} thành công.`,
    });

    handleOpenAdd();
  };

  const handleDelete = (id: string, itemName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mặt hàng "${itemName}" (${id}) khỏi danh mục không?`)) {
      return;
    }
    storage.deleteStationeryItem(id, { id: currentUser?.id || 'ADMIN', name: currentUser?.name || 'Quản trị viên' });
    refreshList();
    showToast({ type: 'info', title: 'Đã xóa mặt hàng', message: `Đã xóa ${itemName} (${id}) khỏi danh mục.` });
  };

  const filteredItems = items.filter((i) => {
    const q = searchTerm.toLowerCase();
    return i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 text-blue-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Quản Lý Danh Mục Văn Phòng Phẩm</h2>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Thêm, sửa, xóa mã VPP, tên và đơn vị tính dùng trong Phiếu đề xuất VPP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto flex-1">
          {/* Form Create / Edit (4 cols) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                {isEditing ? <Edit2 className="w-3.5 h-3.5 text-blue-500" /> : <Plus className="w-3.5 h-3.5 text-emerald-500" />}
                {isEditing ? 'Chỉnh sửa mặt hàng' : 'Thêm mặt hàng mới'}
              </span>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  + Tạo mới
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mã VPP: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: VPP-001, BUT-BI-XANH..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên văn phòng phẩm: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Bút bi Thiên Long TL-027 (Xanh)..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn vị tính: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cây, Ram, Hộp, Cuộn..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nhóm mặt hàng:
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Bút viết, Giấy in..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú quy cách:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Hộp 20 cây, 500 tờ/ram..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200/60 rounded-xl"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Lưu thay đổi' : 'Thêm vào danh mục'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Table List (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo mã VPP, tên mặt hàng..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                Tổng cộng: <b>{filteredItems.length}</b> mặt hàng
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex-1 overflow-y-auto max-h-[380px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 font-bold text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="p-2.5">Mã VPP</th>
                    <th className="p-2.5">Tên văn phòng phẩm</th>
                    <th className="p-2.5 text-center">ĐVT</th>
                    <th className="p-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Không tìm thấy mặt hàng nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.id}
                        </td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">
                          <div>{item.name}</div>
                          {item.category && (
                            <div className="text-[10px] text-slate-400">{item.category}</div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-600 dark:text-slate-300">
                          {item.unit}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mr-1"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Xóa khỏi danh mục"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            * Danh mục này được đồng bộ tức thời cho toàn bộ nhân viên khi tạo phiếu đề xuất VPP.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
