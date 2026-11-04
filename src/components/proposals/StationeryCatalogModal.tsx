'use client';

import React, { useState, useRef } from 'react';
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
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
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
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'update_new' | 'replace_all'>('update_new');

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Cây');
  const [category, setCategory] = useState('Bút viết');
  const [monthlyQuota, setMonthlyQuota] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerUpdateNew = () => {
    setImportMode('update_new');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleTriggerReplaceAll = () => {
    const confirmed = window.confirm(
      'CẢNH BÁO XÓA & THAY THẾ TOÀN BỘ:\n\nThao tác này sẽ XÓA TOÀN BỘ danh mục VPP hiện có trên hệ thống và thay thế hoàn toàn bằng danh sách từ file Excel đã chọn.\n\nBạn có chắc chắn muốn tiếp tục?'
    );
    if (!confirmed) return;
    setImportMode('replace_all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };


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
    setMonthlyQuota('');
    setNotes('');
  };

  const handleOpenEdit = (item: StationeryItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setCode(item.id);
    setName(item.name);
    setUnit(item.unit);
    setCategory(item.category || 'Văn phòng phẩm');
    setMonthlyQuota(item.monthlyQuota !== undefined && item.monthlyQuota !== null ? item.monthlyQuota : '');
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
      monthlyQuota: monthlyQuota !== '' ? Number(monthlyQuota) : undefined,
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

  // Download Excel Template for Stationery
  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Long Khải Portal';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Danh Mục VPP', {
        views: [{ showGridLines: true }],
      });

      worksheet.columns = [
        { header: 'Mã VPP', key: 'id', width: 16 },
        { header: 'Tên văn phòng phẩm', key: 'name', width: 38 },
        { header: 'Đơn vị tính', key: 'unit', width: 14 },
        { header: 'Định mức / tháng', key: 'monthlyQuota', width: 18 },
        { header: 'Nhóm mặt hàng', key: 'category', width: 22 },
        { header: 'Ghi chú quy cách', key: 'notes', width: 26 },
      ];

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E40AF' }, // Blue 800
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Sample data rows
      const sampleRows = [
        { id: 'VPP-001', name: 'Bút bi Thiên Long TL-027 (Xanh)', unit: 'Cây', monthlyQuota: 20, category: 'Bút viết', notes: 'Hộp 20 cây' },
        { id: 'VPP-002', name: 'Bút bi Thiên Long TL-027 (Đỏ)', unit: 'Cây', monthlyQuota: 10, category: 'Bút viết', notes: 'Hộp 20 cây' },
        { id: 'VPP-003', name: 'Giấy in A4 Double A 70gsm', unit: 'Ram', monthlyQuota: 5, category: 'Giấy in', notes: '500 tờ/ram' },
        { id: 'VPP-004', name: 'Kim bấm số 10 Max', unit: 'Hộp', category: 'Dụng cụ văn phòng', notes: 'Hộp nhỏ' },
        { id: 'VPP-005', name: 'Băng keo trong 5cm 100 yard', unit: 'Cuộn', category: 'Băng keo', notes: 'Cây 6 cuộn' },
      ];

      sampleRows.forEach((r) => {
        const row = worksheet.addRow(r);
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10.5 };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 1 || colNumber === 3 ? 'center' : 'left',
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Mau_Danh_Muc_Van_Phong_Pham_Long_Khai.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Đã tải file mẫu Excel',
        message: 'Bạn có thể chỉnh sửa file mẫu và bấm "Thêm vào từ file Excel mẫu" để nạp vào danh mục.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi tải file mẫu',
        message: err.message || 'Không thể tạo file Excel mẫu lúc này.',
      });
    }
  };

  // Import Stationery from Excel File
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        showToast({
          type: 'error',
          title: 'File không hợp lệ',
          message: 'Không tìm thấy trang tính nào trong file Excel đã chọn.',
        });
        return;
      }

      // Detect header row
      let headerRowIdx = 1;
      let codeCol = 1;
      let nameCol = 2;
      let unitCol = 3;
      let categoryCol = 4;
      let quotaCol = -1;
      let notesCol = 5;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 10) return;
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase().trim();
          if (val.includes('mã') && !val.includes('nhóm')) {
            headerRowIdx = rowNumber;
            codeCol = colNumber;
          } else if (val.includes('tên')) {
            nameCol = colNumber;
          } else if (val.includes('đvt') || val.includes('đơn vị')) {
            unitCol = colNumber;
          } else if (val.includes('định mức') || val.includes('quota') || val.includes('hạn mức')) {
            quotaCol = colNumber;
          } else if (val.includes('nhóm') || val.includes('loại')) {
            categoryCol = colNumber;
          } else if (val.includes('ghi chú') || val.includes('quy cách')) {
            notesCol = colNumber;
          }
        });
      });

      const parsedItems: StationeryItem[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowIdx) return;

        const getVal = (col: number) => {
          const c = row.getCell(col).value;
          if (c === null || c === undefined) return '';
          if (typeof c === 'object' && 'text' in c) return String(c.text || '').trim();
          return String(c).trim();
        };

        const rawCode = getVal(codeCol);
        const rawName = getVal(nameCol);
        if (!rawCode || !rawName) return;

        const rawUnit = getVal(unitCol) || 'Cây';
        const rawCategory = getVal(categoryCol) || 'Văn phòng phẩm';
        const rawQuota = quotaCol > 0 ? getVal(quotaCol) : '';
        const parsedQuota = rawQuota !== '' && !isNaN(Number(rawQuota)) ? Number(rawQuota) : undefined;
        const rawNotes = getVal(notesCol) || undefined;

        parsedItems.push({
          id: rawCode.toUpperCase().replace(/\s+/g, '-'),
          name: rawName,
          unit: rawUnit,
          category: rawCategory,
          monthlyQuota: parsedQuota,
          notes: rawNotes,
          isActive: true,
        });
      });

      if (parsedItems.length === 0) {
        showToast({
          type: 'warning',
          title: 'Không tìm thấy mặt hàng',
          message: 'File Excel không có dòng mặt hàng nào hợp lệ (cần có cột Mã VPP và Tên VPP).',
        });
        return;
      }

      if (importMode === 'update_new') {
        const currentCatalog = storage.getStationeryItems();
        const existingNames = new Set(currentCatalog.map((i) => i.name.trim().toLowerCase()));
        const existingIds = new Set(currentCatalog.map((i) => i.id.toUpperCase()));
        const itemsToAdd: StationeryItem[] = [];
        let duplicateCount = 0;

        for (const item of parsedItems) {
          const normName = item.name.trim().toLowerCase();
          if (existingNames.has(normName)) {
            duplicateCount++;
            continue;
          }

          let finalId = item.id.toUpperCase();
          if (existingIds.has(finalId)) {
            finalId = `VPP-${String(currentCatalog.length + itemsToAdd.length + 1).padStart(3, '0')}`;
          }

          existingNames.add(normName);
          existingIds.add(finalId);
          itemsToAdd.push({
            ...item,
            id: finalId,
          });
        }

        if (itemsToAdd.length === 0) {
          showToast({
            type: 'info',
            title: 'Không có mặt hàng mới',
            message: `Tất cả ${parsedItems.length} mặt hàng trong file Excel đều đã có tên trong danh mục (đã bỏ qua ${duplicateCount} mặt hàng trùng tên).`,
          });
          return;
        }

        storage.saveStationeryItems(itemsToAdd, {
          id: currentUser?.id || 'ADMIN',
          name: currentUser?.name || 'Quản trị viên',
        });

        refreshList();
        showToast({
          type: 'success',
          title: 'Cập nhật VPP mới thành công',
          message: `Đã nạp thêm ${itemsToAdd.length} mặt hàng mới vào danh mục (${duplicateCount} mặt hàng trùng tên đã được bỏ qua).`,
        });
      } else {
        // replace_all: xóa tất cả VPP hiện tại trên hệ thống và thêm mới VPP từ danh sách trong file excel
        const uniqueItems: StationeryItem[] = [];
        const seenIds = new Set<string>();
        parsedItems.forEach((item, index) => {
          let finalId = item.id.toUpperCase();
          if (seenIds.has(finalId)) {
            finalId = `${finalId}-${index + 1}`;
          }
          seenIds.add(finalId);
          uniqueItems.push({ ...item, id: finalId });
        });

        storage.replaceStationeryItems(uniqueItems, {
          id: currentUser?.id || 'ADMIN',
          name: currentUser?.name || 'Quản trị viên',
        });

        refreshList();
        showToast({
          type: 'success',
          title: 'Đã thay thế toàn bộ danh mục',
          message: `Đã xóa danh mục cũ và nạp mới toàn bộ ${uniqueItems.length} mặt hàng từ file Excel thành công!`,
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi đọc file Excel',
        message: err.message || 'Không thể đọc nội dung file Excel đã chọn.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredItems = items.filter((i) => {
    const q = searchTerm.toLowerCase();
    return i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || (i.category && i.category.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

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
          {/* Form Create / Edit (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  {isEditing ? <Edit2 className="w-3.5 h-3.5 text-blue-500" /> : <Plus className="w-3.5 h-3.5 text-emerald-500" />}
                  {isEditing ? 'Chỉnh sửa mặt hàng' : 'Thêm mặt hàng mới'}
                </span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
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

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Đơn vị tính: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Cây, Ram..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-600 dark:text-blue-400 mb-1">
                      Định mức / tháng:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={monthlyQuota}
                      onChange={(e) => setMonthlyQuota(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="VD: 10"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700/60 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
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
                      placeholder="Bút viết..."
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
                      className="px-3 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200/60 rounded-xl cursor-pointer"
                    >
                      Hủy
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Lưu thay đổi' : 'Thêm vào danh mục'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Excel Template Import Box */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Nhập hàng loạt từ Excel mẫu</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Tải về file Excel mẫu chuẩn"
                  >
                    <Download className="w-3 h-3" />
                    <span>Tải file mẫu</span>
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  Tải file mẫu, điền danh sách mặt hàng và chọn phương thức tải lên:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleTriggerUpdateNew}
                    className="w-full py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 text-center"
                    title="Chỉ tải lên những VPP chưa có tên trong danh sách"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>Cập nhật VPP mới</span>
                  </button>
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleTriggerReplaceAll}
                    className="w-full py-2.5 px-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 text-center"
                    title="Xóa tất cả VPP hiện tại trên hệ thống và thêm mới từ Excel"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Thay thế toàn bộ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table List (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleTriggerUpdateNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Chỉ nạp những VPP chưa có tên trong danh sách"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cập nhật VPP mới</span>
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleTriggerReplaceAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Xóa tất cả VPP hiện tại và nạp lại từ file Excel"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thay thế toàn bộ</span>
                </button>
                <span className="text-[11px] text-slate-400 whitespace-nowrap hidden sm:inline">
                  Tổng: <b>{filteredItems.length}</b>
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex-1 overflow-y-auto max-h-[440px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 font-bold text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="p-2.5">Mã VPP</th>
                    <th className="p-2.5">Tên văn phòng phẩm</th>
                    <th className="p-2.5 text-center">ĐVT</th>
                    <th className="p-2.5 text-center">Định mức/tháng</th>
                    <th className="p-2.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
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
                        <td className="p-2.5 text-center font-medium text-slate-700 dark:text-slate-200">
                          {item.monthlyQuota !== undefined && item.monthlyQuota !== null ? (
                            <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 inline-flex items-center">
                              {item.monthlyQuota} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">--</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 mr-1 cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
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
