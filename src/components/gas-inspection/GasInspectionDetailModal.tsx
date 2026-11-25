'use client';

import React, { useState } from 'react';
import { GasInspectionRecord } from '@/types/gas-inspection';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  X,
  Printer,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  UserCheck,
  Camera,
  Calendar,
  FileCheck,
  Check,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface GasInspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: GasInspectionRecord | null;
  onPrint: (inspection: GasInspectionRecord) => void;
  onUpdated: (inspection: GasInspectionRecord) => void;
}

export function GasInspectionDetailModal({
  isOpen,
  onClose,
  inspection,
  onPrint,
  onUpdated,
}: GasInspectionDetailModalProps) {
  const { currentUser } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isConfirmingKitchen, setIsConfirmingKitchen] = useState(false);

  if (!isOpen || !inspection) return null;

  const handleKitchenConfirmQuick = () => {
    if (!currentUser) return;
    const updated: GasInspectionRecord = {
      ...inspection,
      kitchenConfirmation: {
        staffName: currentUser.name,
        empId: currentUser.id,
        department: currentUser.department || 'Nhà Bếp',
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        notes: 'Xác nhận trực tuyến qua cổng Portal: Người kiểm tra đã thực hiện đầy đủ.',
      },
      status: 'completed',
      updatedAt: new Date().toISOString(),
    };

    setIsConfirmingKitchen(true);
    try {
      storage.saveGasInspection(updated, {
        id: currentUser.id,
        name: currentUser.name,
      });
      onUpdated(updated);
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi xác nhận.');
    } finally {
      setIsConfirmingKitchen(false);
    }
  };

  const isKitchenOrAdmin =
    currentUser?.role === 'admin' ||
    (currentUser?.department && /bếp|nhà bếp|nấu ăn|an toàn|ehs|hcns/i.test(currentUser.department));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  Chi Tiết Phiếu Kiểm Tra Gas {inspection.id}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    inspection.overallResult === 'pass'
                      ? 'bg-emerald-400 text-emerald-950'
                      : inspection.overallResult === 'warning'
                      ? 'bg-amber-300 text-amber-950'
                      : 'bg-rose-400 text-rose-950'
                  }`}
                >
                  {inspection.overallResult === 'pass'
                    ? '✓ ĐẠT AN TOÀN'
                    : inspection.overallResult === 'warning'
                    ? '⚠ CÓ CẢNH BÁO'
                    : '✗ KHÔNG ĐẠT'}
                </span>
              </div>
              <p className="text-xs text-amber-100 flex items-center gap-2 mt-0.5">
                <span>{inspection.stationName}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(inspection.scanTimestamp)}
                </span>
                {inspection.isQrScanned && (
                  <span className="px-2 py-0.2 bg-emerald-500/30 text-white rounded font-medium text-[10px]">
                    Quét mã QR thực tế
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPrint(inspection)}
              className="px-3 py-1.5 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> In biên bản
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Top Quick Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Đơn vị thay gas / bảo trì
              </span>
              <p className="text-sm font-extrabold text-slate-800">{inspection.supplierName}</p>
              <p className="text-xs text-slate-600 mt-1">
                Đại diện: {inspection.supplierRepresentative?.representativeName || 'Lê Văn Tuấn'} -{' '}
                {inspection.supplierRepresentative?.phone || '0913888999'}
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Người vận hành gas công ty
              </span>
              <p className="text-sm font-extrabold text-slate-800">{inspection.companyOperatorName}</p>
              <p className="text-xs text-slate-600 mt-1">
                MSNV: {inspection.companyOperatorCode || '---'} • Phòng Cơ điện
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Người kiểm tra an toàn
              </span>
              <p className="text-sm font-extrabold text-slate-800">{inspection.inspector.name}</p>
              <p className="text-xs text-slate-600 mt-1">
                MSNV: {inspection.inspector.id} • {inspection.inspector.department}
              </p>
            </div>
          </div>

          {/* Checklist Results Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Kết Quả Kiểm Tra Kỹ Thuật Chi Tiết
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Van, day dan, bo dieu ap */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">
                    1. Van, Dây dẫn & Bộ điều áp
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      inspection.checklist.valvesHosesRegulators.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspection.checklist.valvesHosesRegulators.status === 'pass' ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {inspection.checklist.valvesHosesRegulators.notes || 'Không có ghi chú'}
                </p>
              </div>

              {/* Do kin */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">
                    2. Kết quả kiểm tra Độ kín
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      inspection.checklist.leakageCheck.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspection.checklist.leakageCheck.status === 'pass' ? 'KÍN TUYỆT ĐỐI' : 'RÒ RỈ'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Phương pháp: {inspection.checklist.leakageCheck.method === 'detector' ? 'Máy dò khí rò rỉ' : 'Bọt xà phòng'} •{' '}
                  {inspection.checklist.leakageCheck.notes || 'Kín tốt'}
                </p>
              </div>

              {/* Dau do gas */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">
                    3. Thử độ nhạy Đầu dò Gas
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      inspection.checklist.detectorSensitivity.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspection.checklist.detectorSensitivity.status === 'pass' ? 'NHẠY TỐT' : 'KÉM NHẠY'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Thời gian phản ứng: {inspection.checklist.detectorSensitivity.responseTimeSeconds || 3} giây •{' '}
                  {inspection.checklist.detectorSensitivity.notes || 'Bình thường'}
                </p>
              </div>

              {/* Coi, den, van ngat */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">
                    4. Còi, Đèn & Van ngắt tự động
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      inspection.checklist.alarmAndAutoValve.status === 'pass'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspection.checklist.alarmAndAutoValve.status === 'pass' ? 'HOẠT ĐỘNG TỐT' : 'KHÔNG ĐẠT'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {inspection.checklist.alarmAndAutoValve.notes || 'Hoạt động bình thường'}
                </p>
              </div>
            </div>
          </div>

          {/* Gas Cylinders Table */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Flame className="w-4 h-4 text-amber-600" />
              Danh Sách Bình Gas Tại Trạm ({inspection.cylinders.length} bình)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-3 w-10 text-center">STT</th>
                    <th className="py-2 px-3">Mã số bình (Seri)</th>
                    <th className="py-2 px-3">Trọng lượng</th>
                    <th className="py-2 px-3">Hạn kiểm định</th>
                    <th className="py-2 px-3">Tình trạng</th>
                    <th className="py-2 px-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspection.cylinders.map((cyl, idx) => (
                    <tr key={cyl.id || idx}>
                      <td className="py-2 px-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{cyl.serialNumber}</td>
                      <td className="py-2 px-3">{cyl.weightKg || '45kg'}</td>
                      <td className="py-2 px-3">{cyl.expiryDate || '---'}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            cyl.status === 'good'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cyl.status === 'rusty'
                              ? 'bg-amber-100 text-amber-800'
                              : cyl.status === 'dented'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cyl.status === 'good'
                            ? 'Tốt, đạt chuẩn'
                            : cyl.status === 'rusty'
                            ? 'Rỉ sét bề mặt'
                            : cyl.status === 'dented'
                            ? 'Móp méo vỏ'
                            : 'Hết hạn / Rò rỉ'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-500">{cyl.notes || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Photos Section */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Camera className="w-4 h-4 text-amber-600" />
              Hình Ảnh Trước và Sau Kiểm Tra
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-xs text-slate-700 block mb-2">
                  TRƯỚC KIỂM TRA ({inspection.photosBefore?.length || 0} ảnh)
                </span>
                {inspection.photosBefore && inspection.photosBefore.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {inspection.photosBefore.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Trước kiểm tra"
                        onClick={() => setSelectedPhoto(p)}
                        className="w-full aspect-video object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Không có ảnh chụp trước kiểm tra</p>
                )}
              </div>

              <div>
                <span className="font-bold text-xs text-slate-700 block mb-2">
                  SAU KIỂM TRA ({inspection.photosAfter?.length || 0} ảnh)
                </span>
                {inspection.photosAfter && inspection.photosAfter.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {inspection.photosAfter.map((p, idx) => (
                      <img
                        key={idx}
                        src={p}
                        alt="Sau kiểm tra"
                        onClick={() => setSelectedPhoto(p)}
                        className="w-full aspect-video object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Không có ảnh chụp sau kiểm tra</p>
                )}
              </div>
            </div>
          </div>

          {/* Issues & Remedial Actions */}
          {(inspection.issuesFound || inspection.remedialActions) && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Lỗi Phát Hiện & Biện Pháp Khắc Phục
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-1">Lỗi phát hiện:</span>
                  <p className="text-slate-700">{inspection.issuesFound || 'Không có'}</p>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900 block mb-1">Biện pháp khắc phục:</span>
                  <p className="text-slate-700">{inspection.remedialActions || 'Không có'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Kitchen Confirmation Card */}
          <div className="p-5 bg-emerald-50/90 rounded-2xl border border-emerald-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                Xác Nhận Của Nhà Bếp
              </h4>
              {inspection.kitchenConfirmation?.confirmed ? (
                <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Bếp đã xác nhận đầy đủ
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500 text-white font-bold text-xs rounded-full flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Chờ Bếp xác nhận
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 bg-white/80 p-3.5 rounded-xl border border-emerald-200">
              <p className="font-bold text-emerald-900">
                Người xác nhận: {inspection.kitchenConfirmation?.staffName || '---'} (MSNV:{' '}
                {inspection.kitchenConfirmation?.empId || '---'})
              </p>
              <p className="mt-1">
                Thời gian:{' '}
                {inspection.kitchenConfirmation?.confirmedAt
                  ? formatDateTime(inspection.kitchenConfirmation.confirmedAt)
                  : 'Chưa ký xác nhận'}
              </p>
              <p className="mt-1 italic text-slate-600">
                Ý kiến của Bếp: &ldquo;{inspection.kitchenConfirmation?.notes || 'Đã kiểm tra đầy đủ'}&rdquo;
              </p>
            </div>

            {!inspection.kitchenConfirmation?.confirmed && isKitchenOrAdmin && (
              <button
                type="button"
                onClick={handleKitchenConfirmQuick}
                disabled={isConfirmingKitchen}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isConfirmingKitchen ? 'Đang lưu xác nhận...' : 'Xác Nhận Ngay: Bếp đã kiểm tra đủ quy trình'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500">Mã phiếu lưu trữ: {inspection.id}</span>
          <div className="flex gap-2">
            <button
              onClick={() => onPrint(inspection)}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> In biên bản
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Full Image Preview Zoom Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedPhoto}
                alt="Phóng to ảnh"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
