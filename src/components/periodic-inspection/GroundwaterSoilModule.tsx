'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { GroundwaterSoilInspection, GroundwaterSoilAnswer } from '@/types/periodic-inspection';
import { GROUNDWATER_SOIL_CRITERIA } from '@/lib/periodic-inspection-data';
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
  Calendar,
  User as UserIcon,
} from 'lucide-react';

interface GroundwaterSoilModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function GroundwaterSoilModule({ onSuccessToast }: GroundwaterSoilModuleProps) {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [inspections, setInspections] = useState<GroundwaterSoilInspection[]>([]);

  // Form State
  const [answers, setAnswers] = useState<Record<number, GroundwaterSoilAnswer>>({});
  const [ketQuaSoBo, setKetQuaSoBo] = useState<'Đạt' | 'Không đạt'>('Đạt');
  const [khuVucNghiNgo, setKhuVucNghiNgo] = useState<string>('');
  const [canLayMau, setCanLayMau] = useState<'Có' | 'Không'>('Không');
  const [khuyenNghi, setKhuyenNghi] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // History State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<GroundwaterSoilInspection | null>(null);

  const loadData = () => {
    const list = storage.getGroundwaterSoilInspections();
    setInspections(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize all to "Đạt"
  useEffect(() => {
    const initial: Record<number, GroundwaterSoilAnswer> = {};
    GROUNDWATER_SOIL_CRITERIA.forEach((c) => {
      initial[c.id] = {
        ketQua: 'Đạt',
        lyDo: '',
      };
    });
    setAnswers(initial);
  }, []);

  const handleAnswerChange = (
    id: number,
    field: 'ketQua' | 'lyDo',
    val: string
  ) => {
    setAnswers((prev) => {
      const current = prev[id] || { ketQua: 'Đạt', lyDo: '' };
      return {
        ...prev,
        [id]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleSetAllDat = () => {
    const next: Record<number, GroundwaterSoilAnswer> = {};
    GROUNDWATER_SOIL_CRITERIA.forEach((c) => {
      next[c.id] = {
        ketQua: 'Đạt',
        lyDo: '',
      };
    });
    setAnswers(next);
    setKetQuaSoBo('Đạt');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Validate all criteria answered
      const missing = GROUNDWATER_SOIL_CRITERIA.some((c) => !answers[c.id]?.ketQua);
      if (missing) {
        setSubmitMessage({
          type: 'err',
          text: 'Vui lòng đánh giá Đạt / Không đạt cho tất cả 8 nội dung kiểm tra!',
        });
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}`;

      const newRecord: GroundwaterSoilInspection = {
        id: `NGD-${Date.now()}`,
        nguoiKT: `${currentUser?.name || 'Nhân viên'} (${currentUser?.id || '---'})`,
        maNV: currentUser?.id || '',
        hoTen: currentUser?.name || '',
        boPhan: currentUser?.department || '',
        thoiGian: dateStr,
        createdAt: now.toISOString(),
        answers: { ...answers },
        tongHop: {
          ketQuaSoBo,
          khuVucNghiNgo: khuVucNghiNgo.trim(),
          canLayMau,
          khuyenNghi: khuyenNghi.trim(),
        },
      };

      storage.saveGroundwaterSoilInspection(newRecord, {
        id: currentUser?.id || '',
        name: currentUser?.name || '',
      });

      loadData();
      setSubmitMessage({
        type: 'ok',
        text: `Đã lưu kết quả khảo sát thành công (Mã đơn: ${newRecord.id})!`,
      });
      if (onSuccessToast) {
        onSuccessToast('Đã lưu kết quả kiểm tra hệ thống nước ngầm và đất!');
      }
      setKhuVucNghiNgo('');
      setKhuyenNghi('');
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
        'Thời Gian Khảo Sát': item.thoiGian,
        'Người Thực Hiện': item.nguoiKT,
        'Bộ Phận': item.boPhan,
        'Kết Quả Sơ Bộ': item.tongHop?.ketQuaSoBo || 'Đạt',
        'Khu Vực Nghi Ngờ': item.tongHop?.khuVucNghiNgo || '',
        'Cần Lấy Mẫu': item.tongHop?.canLayMau || 'Không',
        'Khuyến Nghị / Đề Xuất': item.tongHop?.khuyenNghi || '',
      };

      GROUNDWATER_SOIL_CRITERIA.forEach((c) => {
        const a = item.answers ? item.answers[c.id] : undefined;
        row[`Mục ${c.id}: ${c.text}`] = a ? (typeof a === 'string' ? a : a.ketQua) : '---';
        if (a && typeof a !== 'string' && a.lyDo) {
          row[`Mục ${c.id} (Lý do K.Đạt)`] = a.lyDo;
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSu_NuocNgamDat');
    XLSX.writeFile(workbook, `BaoCao_NuocNgamDat_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filter history
  const filteredInspections = inspections.filter((item) => {
    if (historySearch.trim()) {
      const s = historySearch.toLowerCase();
      const matchUser = item.nguoiKT.toLowerCase().includes(s);
      const matchDept = item.boPhan.toLowerCase().includes(s);
      const matchEval = (item.tongHop?.ketQuaSoBo || '').toLowerCase().includes(s);
      const matchNote = (item.tongHop?.khuyenNghi || '').toLowerCase().includes(s);
      return matchUser || matchDept || matchEval || matchNote;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>🌱</span>
            <span>Kiểm Tra Định Kỳ Hệ Thống Nước Ngầm Và Đất</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Khảo sát hiện trường 8 tiêu chí phát hiện nguy cơ thẩm thấu hóa chất, loang dầu, sụt lún và ô nhiễm đất ngầm
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Người thực hiện khảo sát</span>
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
                <span>Thời gian khảo sát</span>
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
              <span>Bắt buộc chọn &quot;Đạt&quot; hoặc &quot;Không đạt&quot; cho mỗi nội dung kiểm tra. Cột &quot;Lý do không đạt&quot; chỉ điền khi chọn &quot;Không đạt&quot;.</span>
            </div>
            <button
              type="button"
              onClick={handleSetAllDat}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Chọn tất cả Đạt
            </button>
          </div>

          {/* Checklist Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3">Kiểm tra hiện trường và thu thập dữ liệu sơ bộ</th>
                  <th className="py-2.5 px-3 w-24 text-center text-emerald-700">Đạt</th>
                  <th className="py-2.5 px-3 w-28 text-center text-red-700">Không đạt</th>
                  <th className="py-2.5 px-3 w-64">Lý do không đạt (nếu có)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {GROUNDWATER_SOIL_CRITERIA.map((c) => {
                  const ans = answers[c.id] || { ketQua: 'Đạt', lyDo: '' };
                  const isDat = ans.ketQua === 'Đạt';
                  const isKhongDat = ans.ketQua === 'Không đạt';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-bold">{c.id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 text-sm whitespace-pre-line">
                        {c.text}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer hover:bg-emerald-50">
                          <input
                            type="radio"
                            name={`soil_criterion_${c.id}`}
                            checked={isDat}
                            onChange={() => handleAnswerChange(c.id, 'ketQua', 'Đạt')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <label className="inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer hover:bg-red-50">
                          <input
                            type="radio"
                            name={`soil_criterion_${c.id}`}
                            checked={isKhongDat}
                            onChange={() => handleAnswerChange(c.id, 'ketQua', 'Không đạt')}
                            className="w-4 h-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={ans.lyDo || ''}
                          onChange={(e) => handleAnswerChange(c.id, 'lyDo', e.target.value)}
                          placeholder="Nhập nguyên nhân..."
                          className={`w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-hidden ${
                            isKhongDat
                              ? 'border-red-300 bg-red-50/50 focus:ring-1 focus:ring-red-500'
                              : 'border-slate-200 bg-white focus:ring-1 focus:ring-blue-500'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section: Tổng Hợp Và Khuyến Nghị */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <span>📋</span>
              <span>Tổng Hợp Và Khuyến Nghị</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Kết quả sơ bộ *
                </label>
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-700">
                    <input
                      type="radio"
                      name="ketQuaSoBo"
                      value="Đạt"
                      checked={ketQuaSoBo === 'Đạt'}
                      onChange={() => setKetQuaSoBo('Đạt')}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600"
                    />
                    <span>Đạt tiêu chuẩn</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-red-700">
                    <input
                      type="radio"
                      name="ketQuaSoBo"
                      value="Không đạt"
                      checked={ketQuaSoBo === 'Không đạt'}
                      onChange={() => setKetQuaSoBo('Không đạt')}
                      className="w-4 h-4 text-red-600 accent-red-600"
                    />
                    <span>Không đạt / Cần xử lý</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Cần lấy thêm mẫu phân tích chi tiết? *
                </label>
                <div className="flex items-center gap-4 bg-white p-2.5 rounded-xl border border-slate-200">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-700">
                    <input
                      type="radio"
                      name="canLayMau"
                      value="Có"
                      checked={canLayMau === 'Có'}
                      onChange={() => setCanLayMau('Có')}
                      className="w-4 h-4 text-amber-600 accent-amber-600"
                    />
                    <span>Có</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="canLayMau"
                      value="Không"
                      checked={canLayMau === 'Không'}
                      onChange={() => setCanLayMau('Không')}
                      className="w-4 h-4 text-slate-600 accent-slate-600"
                    />
                    <span>Không</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Khu vực nghi ngờ ô nhiễm (nếu có):
                </label>
                <textarea
                  rows={2}
                  value={khuVucNghiNgo}
                  onChange={(e) => setKhuVucNghiNgo(e.target.value)}
                  placeholder="Mô tả vị trí / tọa độ / phân xưởng nghi ngờ..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Khuyến nghị xử lý / giám sát tiếp theo:
                </label>
                <textarea
                  rows={2}
                  value={khuyenNghi}
                  onChange={(e) => setKhuyenNghi(e.target.value)}
                  placeholder="Đề xuất hướng xử lý hoặc quan trắc định kỳ..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
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
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Tìm theo người thực hiện, bộ phận, kết quả sơ bộ..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
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
                  <th className="py-2.5 px-3">Thời gian khảo sát</th>
                  <th className="py-2.5 px-3">Người thực hiện</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  {GROUNDWATER_SOIL_CRITERIA.map((c) => (
                    <th
                      key={c.id}
                      className="py-2.5 px-2 text-center font-bold text-[10px] max-w-[80px] truncate"
                      title={c.text}
                    >
                      Mục {c.id}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center">Kết quả sơ bộ</th>
                  <th className="py-2.5 px-3 text-center">Lấy mẫu</th>
                  <th className="py-2.5 px-3">Khuyến nghị</th>
                  <th className="py-2.5 px-3 text-center w-20">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={7 + GROUNDWATER_SOIL_CRITERIA.length} className="py-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu khảo sát nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.thoiGian}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{item.nguoiKT}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.boPhan}</td>
                      {GROUNDWATER_SOIL_CRITERIA.map((c) => {
                        const a = item.answers ? item.answers[c.id] : undefined;
                        const val = a ? (typeof a === 'string' ? a : a.ketQua) : '';

                        return (
                          <td key={c.id} className="py-2.5 px-2 text-center">
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
                            item.tongHop?.ketQuaSoBo === 'Đạt'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {item.tongHop?.ketQuaSoBo || 'Đạt'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.tongHop?.canLayMau === 'Có' ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Có
                          </span>
                        ) : (
                          <span className="text-slate-400">Không</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                        {item.tongHop?.khuyenNghi || '---'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedInspectionForDetail(item)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-blue-600 cursor-pointer"
                          title="Xem chi tiết khảo sát"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Chi Tiết Khảo Sát Nước Ngầm Và Đất ({selectedInspectionForDetail.id})
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

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                      <th className="py-2 px-3 w-10 text-center">STT</th>
                      <th className="py-2 px-3">Nội dung khảo sát</th>
                      <th className="py-2 px-3 w-24 text-center">Đánh giá</th>
                      <th className="py-2 px-3">Lý do không đạt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {GROUNDWATER_SOIL_CRITERIA.map((c) => {
                      const a = selectedInspectionForDetail.answers
                        ? selectedInspectionForDetail.answers[c.id]
                        : undefined;
                      const val = a ? (typeof a === 'string' ? a : a.ketQua) : '';
                      const lyDo = a && typeof a !== 'string' ? a.lyDo : '';

                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">{c.id}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{c.text}</td>
                          <td className="py-2 px-3 text-center">
                            {val === 'Đạt' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đạt
                              </span>
                            ) : val === 'Không đạt' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                K.Đạt
                              </span>
                            ) : (
                              <span className="text-slate-300">---</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{lyDo || '---'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700">Kết quả sơ bộ: </span>
                  <span
                    className={`font-bold ${
                      selectedInspectionForDetail.tongHop?.ketQuaSoBo === 'Đạt'
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {selectedInspectionForDetail.tongHop?.ketQuaSoBo || 'Đạt'}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Cần lấy mẫu phân tích: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedInspectionForDetail.tongHop?.canLayMau || 'Không'}
                  </span>
                </div>
                {selectedInspectionForDetail.tongHop?.khuVucNghiNgo && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-700">Khu vực nghi ngờ ô nhiễm: </span>
                    <span className="text-slate-800">
                      {selectedInspectionForDetail.tongHop.khuVucNghiNgo}
                    </span>
                  </div>
                )}
                {selectedInspectionForDetail.tongHop?.khuyenNghi && (
                  <div className="md:col-span-2">
                    <span className="font-bold text-slate-700">Khuyến nghị & Đề xuất: </span>
                    <span className="text-slate-800">
                      {selectedInspectionForDetail.tongHop.khuyenNghi}
                    </span>
                  </div>
                )}
              </div>
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
