'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PCCCDevice, PCCCCategory } from '@/types/pccc';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { downloadPCCCDevicesTemplate } from '@/lib/excel';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

interface PCCCImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'update_new' | 'replace_all';
  onImportSuccess: (count: number, mode: 'update_new' | 'replace_all', skippedCount?: number) => void;
}

function normalizePCCCCategory(catStr: string): PCCCCategory {
  const norm = catStr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (norm.includes('bot') || norm.includes('mfz')) return 'binh_bot';
  if (norm.includes('co2') || norm.includes('mt3') || norm.includes('mt5')) return 'binh_co2';
  if (norm.includes('bao chay') || norm.includes('chuong') || norm.includes('nut')) return 'nut_chuong';
  if (norm.includes('vach') || norm.includes('voi') || norm.includes('tu chua chay')) return 'tu_voi_vach';
  if (norm.includes('bom')) return 'tram_bom';
  if (norm.includes('trung tam')) return 'tu_trung_tam';
  return 'binh_bot';
}

export function PCCCImportExcelModal({
  isOpen,
  onClose,
  initialMode = 'update_new',
  onImportSuccess,
}: PCCCImportExcelModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<'update_new' | 'replace_all'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedDevices, setParsedDevices] = useState<PCCCDevice[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setImportMode(initialMode || 'update_new');
      setParsedDevices([]);
      setParseErrors([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const currentDevices = storage.getPCCCDevices();
  const existingIds = new Set(currentDevices.map((d) => d.id.trim().toUpperCase()));
  const newDevicesToAdd = parsedDevices.filter((d) => !existingIds.has(d.id.trim().toUpperCase()));
  const duplicateCount = parsedDevices.length - newDevicesToAdd.length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setParseErrors([]);
    setParsedDevices([]);

    try {
      const buffer = await file.arrayBuffer();
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        setParseErrors(['Không tìm thấy trang tính nào trong file Excel đã chọn.']);
        setIsLoading(false);
        return;
      }

      // Detect header row
      let headerRowNumber = 1;
      let idCol = 1;
      let nameCol = 2;
      let catCol = 3;
      let locCol = 4;
      let specsCol = 5;
      let expiryCol = 6;
      let notesCol = 7;

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 12) return;
        row.eachCell((cell, colNumber) => {
          const val = String(cell.value || '').toLowerCase().trim();
          if (val.includes('mã thiết bị') || (val.includes('mã') && !val.includes('nhóm'))) {
            headerRowNumber = rowNumber;
            idCol = colNumber;
          } else if (val.includes('tên thiết bị') || val.includes('tên')) {
            nameCol = colNumber;
          } else if (val.includes('chủng loại') || val.includes('loại')) {
            catCol = colNumber;
          } else if (val.includes('vị trí')) {
            locCol = colNumber;
          } else if (val.includes('chuẩn') || val.includes('kỹ thuật')) {
            specsCol = colNumber;
          } else if (val.includes('hạn kiểm định') || val.includes('hạn')) {
            expiryCol = colNumber;
          } else if (val.includes('ghi chú')) {
            notesCol = colNumber;
          }
        });
      });

      const extracted: PCCCDevice[] = [];
      const errors: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= headerRowNumber) return;

        const getVal = (col: number) => {
          const c = row.getCell(col).value;
          if (c === null || c === undefined) return '';
          if (typeof c === 'object' && 'text' in c) return String(c.text || '').trim();
          if (typeof c === 'object' && 'result' in c) return String(c.result || '').trim();
          return String(c).trim();
        };

        const rawId = getVal(idCol).toUpperCase();
        const rawName = getVal(nameCol);
        const rawCat = getVal(catCol);
        const rawLoc = getVal(locCol);
        const rawSpecs = getVal(specsCol) || '-';
        const rawExpiry = getVal(expiryCol) || '20/12/2026';
        const rawNotes = getVal(notesCol) || '';

        // Ignore empty lines
        if (!rawId && !rawName) return;

        if (!rawId) {
          errors.push(`Dòng ${rowNumber}: Thiếu mã thiết bị.`);
          return;
        }
        if (!rawName) {
          errors.push(`Dòng ${rowNumber} (${rawId}): Thiếu tên thiết bị.`);
          return;
        }
        if (!rawLoc) {
          errors.push(`Dòng ${rowNumber} (${rawId}): Thiếu vị trí đặt.`);
          return;
        }

        const category = normalizePCCCCategory(rawCat);

        extracted.push({
          id: rawId,
          name: rawName,
          category,
          location: rawLoc,
          specs: rawSpecs,
          inspectionExpiry: rawExpiry,
          notes: rawNotes || undefined,
          lastInspection: {
            status: 'pass',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            inspectorId: currentUser?.id || '2265',
            inspectorName: currentUser?.name || 'Trần Lê Hữu Lực',
          },
        });
      });

      if (extracted.length === 0 && errors.length === 0) {
        errors.push('Không tìm thấy dòng thiết bị hợp lệ nào trong file Excel.');
      }

      setParsedDevices(extracted);
      setParseErrors(errors);
    } catch (err: any) {
      console.error('Error parsing Excel:', err);
      setParseErrors([`Lỗi khi đọc file Excel: ${err.message || 'File không đúng định dạng chuẩn'}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedDevices.length === 0) return;

    if (importMode === 'replace_all') {
      const confirmed = window.confirm(
        'CẢNH BÁO XÓA & THAY THẾ TOÀN BỘ:\n\nThao tác này sẽ XÓA TOÀN BỘ danh sách thiết bị PCCC hiện tại và thay thế hoàn toàn bằng danh sách từ file Excel đã chọn.\n\nBạn có chắc chắn muốn tiếp tục?'
      );
      if (!confirmed) return;

      const uniqueDevices: PCCCDevice[] = [];
      const seenIds = new Set<string>();
      parsedDevices.forEach((d) => {
        const idUpper = d.id.trim().toUpperCase();
        if (!seenIds.has(idUpper)) {
          seenIds.add(idUpper);
          uniqueDevices.push({ ...d, id: idUpper });
        }
      });

      storage.savePCCCDevices(uniqueDevices);
      onImportSuccess(uniqueDevices.length, 'replace_all');
      onClose();
    } else {
      // update_new: thêm vào danh sách những thiết bị chưa có trên hệ thống
      const current = storage.getPCCCDevices();
      const currentIds = new Set(current.map((d) => d.id.trim().toUpperCase()));
      const newItems: PCCCDevice[] = [];
      let skipped = 0;

      parsedDevices.forEach((d) => {
        const idUpper = d.id.trim().toUpperCase();
        if (currentIds.has(idUpper)) {
          skipped++;
        } else {
          currentIds.add(idUpper);
          newItems.push({ ...d, id: idUpper });
        }
      });

      if (newItems.length === 0) {
        alert(`Tất cả ${parsedDevices.length} thiết bị trong file Excel đã tồn tại trên hệ thống (không có thiết bị mới nào được thêm).`);
        return;
      }

      const finalDevices = [...current, ...newItems];
      storage.savePCCCDevices(finalDevices);
      onImportSuccess(newItems.length, 'update_new', skipped);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Tải Danh Sách Thiết Bị PCCC Từ File Excel</h3>
              <p className="text-[11px] text-slate-400">Cập nhật thiết bị mới hoặc thay thế toàn bộ danh mục PCCC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Action to download template */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chưa có file mẫu Excel?</h4>
              <p className="text-[11px] text-slate-500">Tải file mẫu chuẩn với các cột định dạng sẵn</p>
            </div>
            <button
              type="button"
              onClick={() => downloadPCCCDevicesTemplate()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu</span>
            </button>
          </div>

          {/* Import Mode Selector: Cập nhật mới vs Thay thế toàn bộ */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Chọn phương thức nạp dữ liệu:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mục 1: Cập nhật mới */}
              <div
                onClick={() => setImportMode('update_new')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  importMode === 'update_new'
                    ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'update_new'}
                    onChange={() => setImportMode('update_new')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Cập nhật mới</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Thêm vào danh sách những thiết bị <strong>chưa có trên hệ thống</strong>. Các thiết bị đã tồn tại sẽ được giữ nguyên.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mục 2: Thay thế toàn bộ */}
              <div
                onClick={() => setImportMode('replace_all')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  importMode === 'replace_all'
                    ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-850'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace_all'}
                    onChange={() => setImportMode('replace_all')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Thay thế toàn bộ</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      <strong>Xóa toàn bộ</strong> danh sách thiết bị hiện có trên hệ thống và thay bằng danh sách mới trong file Excel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white dark:bg-slate-850 space-y-2"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center text-red-600">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {fileName ? `File đã chọn: ${fileName}` : 'Bấm vào đây để chọn file Excel thiết bị (.xlsx, .xls)'}
            </div>
            <p className="text-[11px] text-slate-400">
              Hệ thống sẽ tự động quét các cột Mã thiết bị, Tên, Chủng loại, Vị trí đặt, Chuẩn kỹ thuật
            </p>
          </div>

          {/* Errors list */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Có {parseErrors.length} lưu ý khi đọc file:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Preview Table & Summary */}
          {parsedDevices.length > 0 && (
            <div className="space-y-3">
              {/* Summary message by import mode */}
              {importMode === 'update_new' ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Chế độ Cập nhật mới:</span>
                  </div>
                  <p className="text-[11px] mt-1">
                    Đã đọc <b>{parsedDevices.length}</b> thiết bị: <b>{newDevicesToAdd.length}</b> thiết bị chưa có trên hệ thống (sẽ được thêm vào), <b>{duplicateCount}</b> thiết bị đã có sẵn (sẽ được bỏ qua).
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Cảnh báo chế độ Thay thế toàn bộ:</span>
                  </div>
                  <p className="text-[11px] mt-1">
                    Toàn bộ <b>{currentDevices.length}</b> thiết bị PCCC hiện tại sẽ bị xóa và thay thế bằng <b>{parsedDevices.length}</b> thiết bị mới từ file Excel này.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="text-[11px] text-slate-500">Xem trước 5 dòng đầu:</span>
                <span className="text-[11px] font-mono text-slate-400">Tổng cộng: {parsedDevices.length} thiết bị</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600">
                    <tr>
                      <th className="p-2 border">Mã</th>
                      <th className="p-2 border">Tên thiết bị</th>
                      <th className="p-2 border">Chủng loại</th>
                      <th className="p-2 border">Vị trí</th>
                      <th className="p-2 border">Chuẩn KT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    {parsedDevices.slice(0, 5).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border font-mono font-bold text-red-600">{d.id}</td>
                        <td className="p-2 border font-medium">{d.name}</td>
                        <td className="p-2 border">{d.category}</td>
                        <td className="p-2 border max-w-xs truncate">{d.location}</td>
                        <td className="p-2 border font-mono">{d.specs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={parsedDevices.length === 0 || isLoading || (importMode === 'update_new' && newDevicesToAdd.length === 0)}
            onClick={handleConfirmImport}
            className={`px-5 py-2 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              importMode === 'replace_all'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {importMode === 'replace_all' ? <RefreshCw className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
            <span>
              {importMode === 'replace_all'
                ? `Thay thế toàn bộ (${parsedDevices.length} thiết bị)`
                : `Cập nhật mới (${newDevicesToAdd.length} thiết bị)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
