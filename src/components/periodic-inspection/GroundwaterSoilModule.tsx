'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { GroundwaterSoilInspection, GroundwaterSoilAnswer } from '@/types/periodic-inspection';
import { GROUNDWATER_SOIL_CRITERIA } from '@/lib/periodic-inspection-data';
import * as XLSX from 'xlsx';
import {
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

interface GroundwaterSoilModuleProps {
  onSuccessToast?: (msg: string) => void;
}

export function GroundwaterSoilModule({ onSuccessToast }: GroundwaterSoilModuleProps) {
  const { currentUser } = useAuth();
    const [inspections, setInspections] = useState<GroundwaterSoilInspection[]>([]);

  // Form State
  const [answers, setAnswers] = useState<Record<number, GroundwaterSoilAnswer>>({});
  const [ketQuaSoBo, setKetQuaSoBo] = useState<'Đạt' | 'Không đạt'>('Đạt');
  const [khuVucNghiNgo, setKhuVucNghiNgo] = useState<string>('');
  const [canLayMau, setCanLayMau] = useState<'Có' | 'Không'>('Không');
  const [khuyenNghi, setKhuyenNghi] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

      
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
    </div>
  );
}
