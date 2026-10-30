'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { FirstAidInspection, FirstAidItemStandard } from '@/types/periodic-inspection';
import { FIRST_AID_LOCATIONS, FIRST_AID_ITEMS_BY_LOCATION } from '@/lib/periodic-inspection-data';
import * as XLSX from 'xlsx';
import {
  Plus,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Check,
  RotateCcw,
  X,
  MapPin,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

interface FirstAidModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function FirstAidModule({ onSuccessToast }: FirstAidModuleProps) {
  const { currentUser } = useAuth();
    const [inspections, setInspections] = useState<FirstAidInspection[]>([]);

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('Văn phòng');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ghiChu, setGhiChu] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

        
  // Load inspections from storage
  const loadData = () => {
    const list = storage.getFirstAidInspections();
    setInspections(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Standard items for selected location
  const currentStandards: FirstAidItemStandard[] =
    FIRST_AID_ITEMS_BY_LOCATION[selectedLocation] ||
    FIRST_AID_ITEMS_BY_LOCATION['Văn phòng'] ||
    [];

  // When location changes, reset quantities to standard
  useEffect(() => {
    const initialQty: Record<string, number> = {};
    currentStandards.forEach((it) => {
      initialQty[it.name] = it.chuan;
    });
    setQuantities(initialQty);
    setSubmitMessage(null);
  }, [selectedLocation]);

  // Group items
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, FirstAidItemStandard[]> = {};
    currentStandards.forEach((it) => {
      const g = it.group || 'Vật Tư Khác';
      if (!groups[g]) groups[g] = [];
      groups[g].push(it);
    });
    return groups;
  }, [currentStandards]);

  const handleQtyChange = (name: string, val: string) => {
    const num = parseInt(val, 10);
    setQuantities((prev) => ({
      ...prev,
      [name]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  const handleSetAllStandard = () => {
    const std: Record<string, number> = {};
    currentStandards.forEach((it) => {
      std[it.name] = it.chuan;
    });
    setQuantities(std);
  };

  const handleSetAllZero = () => {
    const zero: Record<string, number> = {};
    currentStandards.forEach((it) => {
      zero[it.name] = 0;
    });
    setQuantities(zero);
  };

  // Submit Inspection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setSubmitMessage({ type: 'err', text: 'Vui lòng chọn địa điểm kiểm tra!' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Evaluate status
      let hasShortage = false;
      let hasExcess = false;

      currentStandards.forEach((it) => {
        const actual = quantities[it.name] ?? 0;
        if (actual < it.chuan) hasShortage = true;
        if (actual > it.chuan) hasExcess = true;
      });

      const summaryStatus: 'Đầy đủ' | 'Dư vật tư' | 'Thiếu vật tư' = hasShortage
        ? 'Thiếu vật tư'
        : hasExcess
        ? 'Dư vật tư'
        : 'Đầy đủ';

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}`;

      const newRecord: FirstAidInspection = {
        id: `SCC-${Date.now()}`,
        diaDiem: selectedLocation,
        nguoiKT: `${currentUser?.name || 'Nhân viên'} (${currentUser?.id || '---'})`,
        maNV: currentUser?.id || '',
        hoTen: currentUser?.name || '',
        boPhan: currentUser?.department || '',
        thoiGian: dateStr,
        createdAt: now.toISOString(),
        items: { ...quantities },
        summaryStatus,
        ghiChu: ghiChu.trim(),
      };

      storage.saveFirstAidInspection(newRecord, {
        id: currentUser?.id || '',
        name: currentUser?.name || '',
      });

      loadData();
      setSubmitMessage({
        type: 'ok',
        text: `Đã lưu kết quả kiểm tra thành công (Mã đơn: ${newRecord.id})!`,
      });
      if (onSuccessToast) {
        onSuccessToast(`Đã lưu kiểm tra Tủ sơ cấp cứu tại ${selectedLocation}!`);
      }
      setGhiChu('');
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
        'Đánh Giá': item.summaryStatus || 'Đầy đủ',
        'Ghi Chú': item.ghiChu || '',
      };

      // Add item details
      if (item.items) {
        Object.entries(item.items).forEach(([k, v]) => {
          row[k] = v;
        });
      }
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSu_TuSoCapCuu');
    XLSX.writeFile(workbook, `BaoCao_TuSoCapCuu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  
  return (
    <div className="space-y-4">
      {/* Module Sub-Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>🧰</span>
            <span>Kiểm Tra Tủ Sơ Cấp Cứu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý số lượng & hạn mức chuẩn 26 vật tư y tế theo từng khu vực nhà máy
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          {/* Top Form Meta Information */}
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
                {FIRST_AID_LOCATIONS.map((loc) => (
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

          {/* Quick Helper Actions & Notice */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700">ℹ️ Hướng dẫn:</span>
              <span>
                Nhập số lượng thực tế hiện có trong tủ sơ cấp cứu tại <b className="text-blue-900">{selectedLocation}</b>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetAllStandard}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 cursor-pointer shadow-2xs"
              >
                Điền tất cả theo chuẩn
              </button>
              <button
                type="button"
                onClick={handleSetAllZero}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Đặt lại 0
              </button>
            </div>
          </div>

          {/* Checklist Table Grouped by Category */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Tên vật tư y tế</th>
                  <th className="py-2.5 px-3 w-28 text-center">Số lượng chuẩn</th>
                  <th className="py-2.5 px-3 w-36 text-center">Số lượng hiện có</th>
                  <th className="py-2.5 px-3 w-28 text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(groupedItems).map(([groupName, items]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    <tr className="bg-slate-50 font-bold text-blue-900 text-[11px] tracking-wide uppercase">
                      <td colSpan={5} className="py-2 px-3 bg-blue-50/40 border-y border-blue-100">
                        {groupName} ({items.length} mục)
                      </td>
                    </tr>
                    {items.map((it, idx) => {
                      const actual = quantities[it.name] ?? it.chuan;
                      const isShort = actual < it.chuan;
                      const isExcess = actual > it.chuan;
                      const isOk = actual === it.chuan;

                      return (
                        <tr key={it.name} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-600">{it.chuan}</td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQtyChange(it.name, String(Math.max(0, actual - 1)))
                                }
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={actual}
                                onChange={(e) => handleQtyChange(it.name, e.target.value)}
                                className={`w-14 text-center py-1 font-bold rounded-md border text-xs focus:outline-hidden ${
                                  isShort
                                    ? 'border-red-400 bg-red-50 text-red-700 ring-1 ring-red-400'
                                    : 'border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(it.name, String(actual + 1))}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isOk && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đủ
                              </span>
                            )}
                            {isShort && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                Thiếu ({it.chuan - actual})
                              </span>
                            )}
                            {isExcess && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                Dư (+{actual - it.chuan})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Note / Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú / Đề xuất bổ sung vật tư (nếu có):
            </label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Nhập ghi chú hoặc yêu cầu cấp bổ sung các vật tư đang bị thiếu..."
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
    </div>
  );
}
