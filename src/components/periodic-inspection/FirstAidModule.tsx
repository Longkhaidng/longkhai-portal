'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { FirstAidInspection, FirstAidItemStandard } from '@/types/periodic-inspection';
import { FIRST_AID_LOCATIONS, FIRST_AID_ITEMS_BY_LOCATION } from '@/lib/periodic-inspection-data';
import * as XLSX from 'xlsx';
import {
  Plus,
  History,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Check,
  RotateCcw,
  Eye,
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
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [inspections, setInspections] = useState<FirstAidInspection[]>([]);

  // Form State
  const [selectedLocation, setSelectedLocation] = useState<string>('Văn phòng');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ghiChu, setGhiChu] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // History State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyLocationFilter, setHistoryLocationFilter] = useState<string>('all');
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<FirstAidInspection | null>(null);

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

  // Filter history
  const filteredInspections = inspections.filter((item) => {
    if (historyLocationFilter !== 'all' && item.diaDiem !== historyLocationFilter) return false;
    if (historySearch.trim()) {
      const s = historySearch.toLowerCase();
      const matchLoc = item.diaDiem.toLowerCase().includes(s);
      const matchUser = item.nguoiKT.toLowerCase().includes(s);
      const matchStatus = (item.summaryStatus || '').toLowerCase().includes(s);
      const matchNote = (item.ghiChu || '').toLowerCase().includes(s);
      return matchLoc || matchUser || matchStatus || matchNote;
    }
    return true;
  });

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
      )}

      {/* ================= HISTORY & REPORT VIEW ================= */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm theo người kiểm tra, địa điểm, ghi chú..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={historyLocationFilter}
                onChange={(e) => setHistoryLocationFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">Tất cả địa điểm</option>
                {FIRST_AID_LOCATIONS.map((loc) => (
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

          {/* History Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Thời gian KT</th>
                  <th className="py-2.5 px-3">Địa điểm</th>
                  <th className="py-2.5 px-3">Người kiểm tra</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  <th className="py-2.5 px-3 text-center">Đánh giá</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  <th className="py-2.5 px-3 text-center w-20">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
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
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.summaryStatus === 'Thiếu vật tư'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : item.summaryStatus === 'Dư vật tư'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {item.summaryStatus || 'Đầy đủ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                        {item.ghiChu || '---'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedInspectionForDetail(item)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-blue-600 cursor-pointer"
                          title="Xem chi tiết 26 vật tư"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInspectionForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Chi Tiết Kiểm Tra Tủ Sơ Cấp Cứu: {selectedInspectionForDetail.diaDiem}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời gian: {selectedInspectionForDetail.thoiGian} &bull; Người KT: {selectedInspectionForDetail.nguoiKT}
                </p>
              </div>
              <button
                onClick={() => setSelectedInspectionForDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 w-10 text-center">STT</th>
                      <th className="py-2 px-3">Vật tư y tế</th>
                      <th className="py-2 px-3 w-28 text-center">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInspectionForDetail.items &&
                      Object.entries(selectedInspectionForDetail.items).map(([k, v], i) => (
                        <tr key={k} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-center text-slate-400">{i + 1}</td>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{k}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-blue-700">{v}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {selectedInspectionForDetail.ghiChu && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900">Ghi chú / Đề xuất:</div>
                  <div className="text-amber-800 mt-0.5">{selectedInspectionForDetail.ghiChu}</div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedInspectionForDetail(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
