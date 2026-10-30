'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { EyewashInspection } from '@/types/periodic-inspection';
import { EYEWASH_LOCATIONS, EYEWASH_CRITERIA } from '@/lib/periodic-inspection-data';
import * as XLSX from 'xlsx';
import {
  Plus,
  History,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  X,
  MapPin,
  Calendar,
  User as UserIcon,
  Check,
} from 'lucide-react';

interface EyewashModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function EyewashModule({ onSuccessToast }: EyewashModuleProps) {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [inspections, setInspections] = useState<EyewashInspection[]>([]);

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<string>(EYEWASH_LOCATIONS[0] || 'Kho Hóa chất');
  const [results, setResults] = useState<Record<string, 'Đạt' | 'Không đạt'>>({});
  const [deXuat, setDeXuat] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // History State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyLocationFilter, setHistoryLocationFilter] = useState<string>('all');
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<EyewashInspection | null>(null);

  const loadData = () => {
    const list = storage.getEyewashInspections();
    setInspections(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set default all "Đạt"
  useEffect(() => {
    const initial: Record<string, 'Đạt' | 'Không đạt'> = {};
    EYEWASH_CRITERIA.forEach((c) => {
      initial[c] = 'Đạt';
    });
    setResults(initial);
    setSubmitMessage(null);
  }, [selectedLocation]);

  const handleResultChange = (criterion: string, val: 'Đạt' | 'Không đạt') => {
    setResults((prev) => ({
      ...prev,
      [criterion]: val,
    }));
  };

  const handleSetAllDat = () => {
    const all: Record<string, 'Đạt' | 'Không đạt'> = {};
    EYEWASH_CRITERIA.forEach((c) => {
      all[c] = 'Đạt';
    });
    setResults(all);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setSubmitMessage({ type: 'err', text: 'Vui lòng chọn địa điểm máy rửa mắt!' });
      return;
    }

    // Check all criteria are answered
    const missing = EYEWASH_CRITERIA.some((c) => !results[c]);
    if (missing) {
      setSubmitMessage({ type: 'err', text: 'Vui lòng đánh giá đầy đủ tất cả nội dung kiểm tra!' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const isAllDat = EYEWASH_CRITERIA.every((c) => results[c] === 'Đạt');
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}`;

      const newRecord: EyewashInspection = {
        id: `MRM-${Date.now()}`,
        diaDiem: selectedLocation,
        nguoiKT: `${currentUser?.name || 'Nhân viên'} (${currentUser?.id || '---'})`,
        maNV: currentUser?.id || '',
        hoTen: currentUser?.name || '',
        boPhan: currentUser?.department || '',
        thoiGian: dateStr,
        createdAt: now.toISOString(),
        items: { ...results },
        deXuat: deXuat.trim(),
        danhGiaTongQuat: isAllDat ? 'Đạt' : 'Không đạt',
      };

      storage.saveEyewashInspection(newRecord, {
        id: currentUser?.id || '',
        name: currentUser?.name || '',
      });

      loadData();
      setSubmitMessage({
        type: 'ok',
        text: `Đã lưu kết quả kiểm tra thành công (Mã đơn: ${newRecord.id})!`,
      });
      if (onSuccessToast) {
        onSuccessToast(`Đã lưu kiểm tra máy rửa mắt tại ${selectedLocation}!`);
      }
      setDeXuat('');
    } catch {
      setSubmitMessage({ type: 'err', text: 'Đã có lỗi xảy ra khi lưu kết quả!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (inspections.length === 0) {
      alert('Không có dữ liệu để xuất Excel');
      return;
    }

    const rows = inspections.map((item, idx) => {
      const row: Record<string, any> = {
        STT: idx + 1,
        'Mã Phiếu': item.id,
        'Thời Gian KT': item.thoiGian,
        'Địa Điểm': item.diaDiem,
        'Người Kiểm Tra': item.nguoiKT,
        'Bộ Phận': item.boPhan,
        'Đánh Giá Tổng Quát': item.danhGiaTongQuat,
        'Đề Xuất': item.deXuat || '',
      };

      if (item.items) {
        Object.entries(item.items).forEach(([k, v]) => {
          row[k] = v;
        });
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSu_MayRuaMat');
    XLSX.writeFile(workbook, `BaoCao_MayRuaMat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filter history
  const filteredInspections = inspections.filter((item) => {
    if (historyLocationFilter !== 'all' && item.diaDiem !== historyLocationFilter) return false;
    if (historySearch.trim()) {
      const s = historySearch.toLowerCase();
      const matchLoc = item.diaDiem.toLowerCase().includes(s);
      const matchUser = item.nguoiKT.toLowerCase().includes(s);
      const matchEval = (item.danhGiaTongQuat || '').toLowerCase().includes(s);
      const matchNote = (item.deXuat || '').toLowerCase().includes(s);
      return matchLoc || matchUser || matchEval || matchNote;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>🚿</span>
            <span>Kiểm Tra Máy Rửa Mắt Khẩn Cấp</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Checklist 5 tiêu chuẩn an toàn máy rửa mắt: Nguồn nước, vòi phun, áp lực và vệ sinh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              onClick={() => setViewMode('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'form'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Biểu mẫu kiểm tra</span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Quá trình kiểm tra ({inspections.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            title="Xuất file Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* ================= FORM VIEW ================= */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          {/* Form Meta Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Địa điểm kiểm tra *</span>
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                required
              >
                {EYEWASH_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Người kiểm tra</span>
              </label>
              <input
                type="text"
                readOnly
                value={`${currentUser?.name || ''} (${currentUser?.id || ''}) - ${currentUser?.department || ''}`}
                className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg focus:outline-hidden cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Thời gian kiểm tra</span>
              </label>
              <input
                type="text"
                readOnly
                value="Tự động ghi nhận theo thời điểm gửi"
                className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg focus:outline-hidden cursor-not-allowed italic"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700">ℹ️ Hướng dẫn:</span>
              <span>Đánh giá từng nội dung kiểm tra của máy rửa mắt tại địa điểm đã chọn (Bắt buộc chọn Đạt/Không đạt).</span>
            </div>
            <button
              type="button"
              onClick={handleSetAllDat}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 cursor-pointer shadow-2xs"
            >
              Chọn tất cả Đạt
            </button>
          </div>

          {/* Criteria Checklist Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Nội dung kiểm tra</th>
                  <th className="py-2.5 px-3 w-32 text-center text-emerald-700">Đạt</th>
                  <th className="py-2.5 px-3 w-32 text-center text-red-700">Không đạt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {EYEWASH_CRITERIA.map((criterion, idx) => {
                  const val = results[criterion];
                  const isDat = val === 'Đạt';
                  const isKhongDat = val === 'Không đạt';

                  return (
                    <tr key={criterion} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 text-sm">{criterion}</td>
                      <td className="py-3 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors">
                          <input
                            type="radio"
                            name={`criterion_${idx}`}
                            checked={isDat}
                            onChange={() => handleResultChange(criterion, 'Đạt')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                          <input
                            type="radio"
                            name={`criterion_${idx}`}
                            checked={isKhongDat}
                            onChange={() => handleResultChange(criterion, 'Không đạt')}
                            className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Proposal / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đề xuất / Ghi chú (nếu có):
            </label>
            <textarea
              rows={2}
              value={deXuat}
              onChange={(e) => setDeXuat(e.target.value)}
              placeholder="Ghi chú tình trạng hư hỏng, bất thường hoặc đề xuất bảo trì, thay mới linh kiện máy rửa mắt..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {submitMessage && (
                <div
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${
                    submitMessage.type === 'ok'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {submitMessage.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{submitMessage.text}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu kết quả...' : 'Lưu Kết Quả Kiểm Tra'}
            </button>
          </div>
        </form>
      )}

      {/* ================= HISTORY VIEW ================= */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm theo người kiểm tra, địa điểm, đề xuất..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={historyLocationFilter}
                onChange={(e) => setHistoryLocationFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả địa điểm</option>
                {EYEWASH_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <b>{filteredInspections.length}</b> / {inspections.length} bản ghi
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Thời gian KT</th>
                  <th className="py-2.5 px-3">Địa điểm</th>
                  <th className="py-2.5 px-3">Người kiểm tra</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  {EYEWASH_CRITERIA.map((c) => (
                    <th key={c} className="py-2.5 px-2 text-center font-bold text-[10px] max-w-[100px] truncate">
                      {c}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center">Tổng quát</th>
                  <th className="py-2.5 px-3">Đề xuất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={6 + EYEWASH_CRITERIA.length} className="py-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu kiểm tra nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.thoiGian}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {item.diaDiem}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{item.nguoiKT}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.boPhan}</td>
                      {EYEWASH_CRITERIA.map((c) => {
                        const val = item.items ? item.items[c] : '---';
                        return (
                          <td key={c} className="py-2.5 px-2 text-center">
                            {val === 'Đạt' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đạt
                              </span>
                            ) : val === 'Không đạt' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                K.Đạt
                              </span>
                            ) : (
                              <span className="text-slate-300">---</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.danhGiaTongQuat === 'Đạt'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {item.danhGiaTongQuat}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                        {item.deXuat || '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
