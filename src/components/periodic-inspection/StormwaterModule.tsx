'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { StormwaterInspection, StormwaterAnswer } from '@/types/periodic-inspection';
import { STORMWATER_QUESTIONS } from '@/lib/periodic-inspection-data';
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

interface StormwaterModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function StormwaterModule({ onSuccessToast }: StormwaterModuleProps) {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'form' | 'history'>('form');
  const [inspections, setInspections] = useState<StormwaterInspection[]>([]);

  // Form State
  const [answers, setAnswers] = useState<Record<number, StormwaterAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // History State
  const [historySearch, setHistorySearch] = useState<string>('');
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<StormwaterInspection | null>(null);

  const loadData = () => {
    const list = storage.getStormwaterInspections();
    setInspections(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize answers
  useEffect(() => {
    const initial: Record<number, StormwaterAnswer> = {};
    STORMWATER_QUESTIONS.forEach((q) => {
      initial[q.id] = {
        ketQua: 'Không',
        chiTiet: '',
        ghiChu: '',
      };
    });
    setAnswers(initial);
  }, []);

  const handleAnswerChange = (
    qid: number,
    field: 'ketQua' | 'chiTiet' | 'ghiChu',
    val: string
  ) => {
    setAnswers((prev) => {
      const current = prev[qid] || { ketQua: 'Không', chiTiet: '', ghiChu: '' };
      return {
        ...prev,
        [qid]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleSetAllKhong = () => {
    const next: Record<number, StormwaterAnswer> = {};
    STORMWATER_QUESTIONS.forEach((q) => {
      next[q.id] = {
        ketQua: 'Không',
        chiTiet: '',
        ghiChu: '',
      };
    });
    setAnswers(next);
  };

  // Check visible questions based on Q1
  const q1Val = answers[1]?.ketQua || 'Không';

  const isQuestionVisible = (q: typeof STORMWATER_QUESTIONS[0]) => {
    if (!q.dependsOn) return true;
    return q.dependsOn.value === q1Val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Validate all visible questions have an answer
      const missing = STORMWATER_QUESTIONS.filter(isQuestionVisible).some(
        (q) => !answers[q.id]?.ketQua
      );

      if (missing) {
        setSubmitMessage({
          type: 'err',
          text: 'Vui lòng trả lời "Có"/"Không" đầy đủ cho tất cả nội dung kiểm tra đang hiển thị!',
        });
        setIsSubmitting(false);
        return;
      }

      // Check overall conclusion: Q12 is "Nguồn nước mưa có bị ô nhiễm không?"
      // If Q12 is "Có" or any severe leak is reported, evaluation is "Cần xử lý"
      const isPolluted = answers[12]?.ketQua === 'Có';
      const danhGiaTongQuat: 'Đạt' | 'Cần xử lý' = isPolluted ? 'Cần xử lý' : 'Đạt';

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
        2,
        '0'
      )}`;

      const newRecord: StormwaterInspection = {
        id: `HTNM-${Date.now()}`,
        nguoiKT: `${currentUser?.name || 'Nhân viên'} (${currentUser?.id || '---'})`,
        maNV: currentUser?.id || '',
        hoTen: currentUser?.name || '',
        boPhan: currentUser?.department || '',
        thoiGian: dateStr,
        createdAt: now.toISOString(),
        answers: { ...answers },
        danhGiaTongQuat,
      };

      storage.saveStormwaterInspection(newRecord, {
        id: currentUser?.id || '',
        name: currentUser?.name || '',
      });

      loadData();
      setSubmitMessage({
        type: 'ok',
        text: `Đã lưu kết quả kiểm tra thành công (Mã đơn: ${newRecord.id})!`,
      });
      if (onSuccessToast) {
        onSuccessToast('Đã lưu kết quả kiểm tra hệ thống nước mưa!');
      }
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
        'Người Kiểm Tra': item.nguoiKT,
        'Bộ Phận': item.boPhan,
        'Đánh Giá Tổng Quát': item.danhGiaTongQuat,
      };

      STORMWATER_QUESTIONS.forEach((q) => {
        const a = item.answers ? item.answers[q.id] : undefined;
        row[`Câu ${q.id}: ${q.text.split('\n')[0]}`] = a ? a.ketQua : '---';
        if (a?.chiTiet) row[`Câu ${q.id} (Chi tiết)`] = a.chiTiet;
        if (a?.ghiChu) row[`Câu ${q.id} (Ghi chú)`] = a.ghiChu;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSu_NuocMua');
    XLSX.writeFile(workbook, `BaoCao_NuocMua_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filter history
  const filteredInspections = inspections.filter((item) => {
    if (historySearch.trim()) {
      const s = historySearch.toLowerCase();
      const matchUser = item.nguoiKT.toLowerCase().includes(s);
      const matchDept = item.boPhan.toLowerCase().includes(s);
      const matchEval = (item.danhGiaTongQuat || '').toLowerCase().includes(s);
      return matchUser || matchDept || matchEval;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Module Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>🌧️</span>
            <span>Kiểm Tra Hệ Thống Nước Mưa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Khảo sát 12 điểm nguy cơ tràn đổ, rò rỉ hóa chất và ô nhiễm nguồn thoát nước mưa toàn nhà máy
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
              <span className="font-bold text-blue-700">ℹ️ Quy tắc rẽ nhánh:</span>
              <span>
                Riêng câu 1: nếu chọn &quot;Không&quot; thì trả lời tiếp câu 2; nếu chọn &quot;Có&quot; thì trả lời tiếp câu 3. Cột &quot;Mô tả chi tiết&quot; &amp; &quot;Ghi chú&quot; chỉ điền khi có bất thường.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSetAllKhong}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              Đặt tất cả &quot;Không&quot;
            </button>
          </div>

          {/* Checklist Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                  <th rowSpan={2} className="py-2.5 px-3 w-12 text-center border-r border-slate-200">
                    STT
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200">
                    Vị trí / Nội dung kiểm tra
                  </th>
                  <th colSpan={3} className="py-1.5 px-3 text-center border-r border-slate-200 bg-slate-50">
                    Kết quả kiểm tra
                  </th>
                  <th rowSpan={2} className="py-2.5 px-3 w-48">
                    Ghi chú
                  </th>
                </tr>
                <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                  <th className="py-1 px-2 w-16 text-center border-r border-slate-200 text-amber-700">Có</th>
                  <th className="py-1 px-2 w-16 text-center border-r border-slate-200 text-emerald-700">Không</th>
                  <th className="py-1 px-3 border-r border-slate-200">Mô tả chi tiết (nếu có)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STORMWATER_QUESTIONS.map((q) => {
                  if (!isQuestionVisible(q)) return null;

                  const ans = answers[q.id] || { ketQua: 'Không', chiTiet: '', ghiChu: '' };
                  const isCo = ans.ketQua === 'Có';
                  const isKhong = ans.ketQua === 'Không';
                  const isConclusion = q.group === 'Kết luận';

                  return (
                    <React.Fragment key={q.id}>
                      {isConclusion && (
                        <tr className="bg-blue-50/60 font-bold text-blue-900 text-[11px] tracking-wide uppercase border-y border-blue-200">
                          <td colSpan={6} className="py-2 px-3">
                            Kết Luận Đánh Giá
                          </td>
                        </tr>
                      )}
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isConclusion ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-bold border-r border-slate-100">
                          {q.id}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-100 whitespace-pre-line">
                          {q.text}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <label className="inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer hover:bg-amber-50">
                            <input
                              type="radio"
                              name={`stormwater_q_${q.id}`}
                              checked={isCo}
                              onChange={() => handleAnswerChange(q.id, 'ketQua', 'Có')}
                              className="w-4 h-4 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100">
                          <label className="inline-flex items-center justify-center p-1.5 rounded-lg cursor-pointer hover:bg-emerald-50">
                            <input
                              type="radio"
                              name={`stormwater_q_${q.id}`}
                              checked={isKhong}
                              onChange={() => handleAnswerChange(q.id, 'ketQua', 'Không')}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-100">
                          <input
                            type="text"
                            value={ans.chiTiet || ''}
                            onChange={(e) => handleAnswerChange(q.id, 'chiTiet', e.target.value)}
                            placeholder="Mô tả nếu có phát sinh..."
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={ans.ghiChu || ''}
                            onChange={(e) => handleAnswerChange(q.id, 'ghiChu', e.target.value)}
                            placeholder="Ghi chú (nếu có)..."
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                          />
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
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
                placeholder="Tìm theo người kiểm tra, bộ phận, đánh giá..."
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
                  <th className="py-2.5 px-3">Thời gian KT</th>
                  <th className="py-2.5 px-3">Người kiểm tra</th>
                  <th className="py-2.5 px-3">Bộ phận</th>
                  {STORMWATER_QUESTIONS.map((q) => (
                    <th
                      key={q.id}
                      className="py-2.5 px-2 text-center font-bold text-[10px] max-w-[80px] truncate"
                      title={q.text}
                    >
                      C{q.id}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center">Kết luận</th>
                  <th className="py-2.5 px-3 text-center w-20">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={5 + STORMWATER_QUESTIONS.length} className="py-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu kiểm tra nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.thoiGian}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{item.nguoiKT}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.boPhan}</td>
                      {STORMWATER_QUESTIONS.map((q) => {
                        const ans = item.answers ? item.answers[q.id] : undefined;
                        const val = ans ? (typeof ans === 'string' ? ans : ans.ketQua) : '';

                        return (
                          <td key={q.id} className="py-2.5 px-2 text-center">
                            {val === 'Có' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Có
                              </span>
                            ) : val === 'Không' ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Không
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
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedInspectionForDetail(item)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-blue-600 cursor-pointer"
                          title="Xem chi tiết các câu trả lời"
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
                  Chi Tiết Kiểm Tra Hệ Thống Nước Mưa ({selectedInspectionForDetail.id})
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
                      <th className="py-2 px-3">Nội dung kiểm tra</th>
                      <th className="py-2 px-3 w-20 text-center">Kết quả</th>
                      <th className="py-2 px-3">Mô tả chi tiết</th>
                      <th className="py-2 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {STORMWATER_QUESTIONS.map((q) => {
                      const ans = selectedInspectionForDetail.answers
                        ? selectedInspectionForDetail.answers[q.id]
                        : undefined;
                      const val = ans ? (typeof ans === 'string' ? ans : ans.ketQua) : '';
                      const chiTiet = ans && typeof ans !== 'string' ? ans.chiTiet : '';
                      const ghiChu = ans && typeof ans !== 'string' ? ans.ghiChu : '';

                      return (
                        <tr key={q.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-bold">{q.id}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 whitespace-pre-line">{q.text}</td>
                          <td className="py-2 px-3 text-center">
                            {val === 'Có' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Có
                              </span>
                            ) : val === 'Không' ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Không
                              </span>
                            ) : (
                              <span className="text-slate-300">---</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{chiTiet || '---'}</td>
                          <td className="py-2 px-3 text-slate-600">{ghiChu || '---'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
