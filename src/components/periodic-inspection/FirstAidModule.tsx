'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isSuperAdminOrBOD } from '@/lib/permissions';
import { storage } from '@/lib/storage';
import { FirstAidInspection, FirstAidItemStandard } from '@/types/periodic-inspection';
import { FIRST_AID_LOCATIONS } from '@/lib/periodic-inspection-data';
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
  Settings,
  Save,
  ShieldCheck,
} from 'lucide-react';

interface FirstAidModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function FirstAidModule({ onSuccessToast }: FirstAidModuleProps) {
  const { currentUser } = useAuth();
  const isAdmin =
    isSuperAdminOrBOD(currentUser) ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'ehs' ||
    (Boolean(currentUser?.department) && /an toàn|ehs|y tế|nhân sự|hcns/i.test(currentUser!.department));

  const [inspections, setInspections] = useState<FirstAidInspection[]>([]);
  const [allStandards, setAllStandards] = useState<Record<string, FirstAidItemStandard[]>>(() =>
    storage.getFirstAidStandards()
  );
  const [isEditingStandards, setIsEditingStandards] = useState<boolean>(false);

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
    allStandards[selectedLocation] ||
    allStandards['Văn phòng'] ||
    [];

  // When location changes, reset quantities to standard
  useEffect(() => {
    const initialQty: Record<string, number> = {};
    currentStandards.forEach((it) => {
      initialQty[it.name] = it.chuan;
    });
    setQuantities(initialQty);
    setSubmitMessage(null);
  }, [selectedLocation, allStandards]);

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

  const handleUpdateStandardQty = (name: string, newChuan: number) => {
    const validChuan = Math.max(0, isNaN(newChuan) ? 0 : newChuan);
    setAllStandards((prev) => {
      const currentList = prev[selectedLocation] || prev['Văn phòng'] || [];
      const updatedList = currentList.map((item) =>
        item.name === name ? { ...item, chuan: validChuan } : item
      );
      return {
        ...prev,
        [selectedLocation]: updatedList,
      };
    });
  };

  const handleSaveStandards = () => {
    storage.saveFirstAidStandards(allStandards, {
      id: currentUser?.id || 'admin',
      name: currentUser?.name || 'Quản trị viên',
    });
    setIsEditingStandards(false);
    if (onSuccessToast) {
      onSuccessToast('Đã lưu số lượng chuẩn vật tư y tế thành công!');
    }
  };

  const handleResetStandards = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục số lượng chuẩn về mặc định ban đầu của hệ thống?')) {
      storage.resetFirstAidStandards();
      const defaults = storage.getFirstAidStandards();
      setAllStandards(defaults);
      setIsEditingStandards(false);
      if (onSuccessToast) {
        onSuccessToast('Đã khôi phục số lượng chuẩn về mặc định ban đầu!');
      }
    }
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

        // Generate next sequential 4-digit ID (e.g. SCC-0005)
      const existingFA = storage.getFirstAidInspections();
      let maxFANum = 0;
      existingFA.forEach((item) => {
        const m = item.id.match(/^SCC-(\d+)$/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxFANum && num < 100000) maxFANum = num;
        }
      });
      const nextFAId = `SCC-${String(maxFANum + 1).padStart(4, '0')}`;

      const newRecord: FirstAidInspection = {
        id: nextFAId,
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
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700 dark:text-blue-400">ℹ️ Hướng dẫn:</span>
              <span>
                Nhập số lượng thực tế hiện có trong tủ sơ cấp cứu tại <b className="text-blue-900 dark:text-blue-200">{selectedLocation}</b>.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSetAllStandard}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              >
                Điền tất cả theo chuẩn
              </button>
              <button
                type="button"
                onClick={handleSetAllZero}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              >
                Đặt lại 0
              </button>
              {isAdmin && !isEditingStandards && (
                <button
                  type="button"
                  onClick={() => setIsEditingStandards(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md cursor-pointer shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <Settings className="w-3 h-3" />
                  <span>Sửa số lượng chuẩn (Admin)</span>
                </button>
              )}
            </div>
          </div>

          {/* Admin Editing Banner */}
          {isAdmin && isEditingStandards && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <b>Quyền Admin:</b> Đang chỉnh sửa định mức chuẩn tại <b>{selectedLocation}</b>. Bạn có thể tăng/giảm số lượng chuẩn ở cột &quot;Số lượng chuẩn&quot;, sau đó bấm &quot;Lưu số lượng chuẩn&quot;.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveStandards}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu số lượng chuẩn</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAllStandards(storage.getFirstAidStandards());
                    setIsEditingStandards(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleResetStandards}
                  className="px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer flex items-center gap-1"
                  title="Khôi phục về chuẩn ban đầu của hệ thống"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mặc định</span>
                </button>
              </div>
            </div>
          )}

          {/* Checklist Table Grouped by Category with Horizontal Scroll */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase font-bold text-[11px] border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Tên vật tư y tế</th>
                  <th className="py-2.5 px-3 w-36 text-center">Số lượng chuẩn</th>
                  <th className="py-2.5 px-3 w-36 text-center">Số lượng hiện có</th>
                  <th className="py-2.5 px-3 w-28 text-center">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Object.entries(groupedItems).map(([groupName, items]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    <tr className="bg-slate-50 dark:bg-slate-800/40 font-bold text-blue-900 dark:text-blue-300 text-[11px] tracking-wide uppercase">
                      <td colSpan={5} className="py-2 px-3 bg-blue-50/40 dark:bg-blue-950/30 border-y border-blue-100 dark:border-blue-900/40">
                        {groupName} ({items.length} mục)
                      </td>
                    </tr>
                    {items.map((it, idx) => {
                      const actual = quantities[it.name] ?? it.chuan;
                      const isShort = actual < it.chuan;
                      const isExcess = actual > it.chuan;
                      const isOk = actual === it.chuan;

                      return (
                        <tr key={it.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{it.name}</td>
                          <td className={`py-2 px-3 text-center ${isEditingStandards ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}`}>
                            {isEditingStandards ? (
                              <div className="inline-flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStandardQty(it.name, Math.max(0, it.chuan - 1))}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-amber-100 border border-amber-300 cursor-pointer shadow-2xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={it.chuan}
                                  onChange={(e) => handleUpdateStandardQty(it.name, parseInt(e.target.value, 10))}
                                  className="w-12 text-center py-0.5 font-bold rounded border border-amber-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStandardQty(it.name, it.chuan + 1)}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-amber-100 border border-amber-300 cursor-pointer shadow-2xs"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-600 dark:text-slate-400">{it.chuan}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="inline-flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQtyChange(it.name, String(Math.max(0, actual - 1)))
                                }
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
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
                                    : 'border-slate-300 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-blue-500'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleQtyChange(it.name, String(actual + 1))}
                                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isOk && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Đủ
                              </span>
                            )}
                            {isShort && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                                Thiếu ({it.chuan - actual})
                              </span>
                            )}
                            {isExcess && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
