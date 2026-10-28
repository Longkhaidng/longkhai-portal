'use client';

import React, { useState, useRef } from 'react';
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
  onImportSuccess: (count: number) => void;
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
  onImportSuccess,
}: PCCCImportExcelModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [parsedDevices, setParsedDevices] = useState<PCCCDevice[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

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

    // Merge with current devices (updates existing IDs or appends new ones)
    const current = storage.getPCCCDevices();
    const map = new Map<string, PCCCDevice>();

    // Put current
    current.forEach((d) => map.set(d.id.toUpperCase(), d));

    // Overwrite / Add imported
    parsedDevices.forEach((d) => map.set(d.id.toUpperCase(), d));

    const finalDevices = Array.from(map.values());
    storage.savePCCCDevices(finalDevices);

    onImportSuccess(parsedDevices.length);
    onClose();
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
              <h3 className="text-sm font-bold">Tải Thiết Bị PCCC Lên Bằng File Excel Mẫu</h3>
              <p className="text-[11px] text-slate-400">Nạp danh mục thiết bị hàng loạt chuẩn quy chuẩn nhà máy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Action to download template */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chưa có file mẫu Excel?</h4>
              <p className="text-[11px] text-slate-500">Tải file mẫu chuẩn với 6 chủng loại thiết bị PCCC được định dạng sẵn</p>
            </div>
            <button
              type="button"
              onClick={() => downloadPCCCDevicesTemplate()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu</span>
            </button>
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

          {/* Parsed Preview Table */}
          {parsedDevices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã đọc thành công {parsedDevices.length} thiết bị từ file Excel
                </span>
                <span className="text-[11px] text-slate-500">Xem trước 5 dòng đầu:</span>
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
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={parsedDevices.length === 0 || isLoading}
            onClick={handleConfirmImport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>Nạp {parsedDevices.length} thiết bị vào hệ thống</span>
          </button>
        </div>
      </div>
    </div>
  );
}
