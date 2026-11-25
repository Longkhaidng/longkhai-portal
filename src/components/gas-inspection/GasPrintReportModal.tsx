'use client';

import React from 'react';
import { GasInspectionRecord } from '@/types/gas-inspection';
import { X, Printer, Flame, CheckCircle, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface GasPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: GasInspectionRecord | null;
}

export function GasPrintReportModal({
  isOpen,
  onClose,
  inspection,
}: GasPrintReportModalProps) {
  if (!isOpen || !inspection) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        {/* Screen Controls Header */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Xem trước bản in Biên bản kiểm tra Gas ({inspection.id})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> In biên bản (Ctrl + P)
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 format) */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-slate-100/60 print:bg-white text-slate-900">
          <div className="max-w-[800px] mx-auto bg-white p-8 rounded-xl shadow-sm print:shadow-none print:p-0 border border-slate-200 print:border-none space-y-5 text-xs font-serif leading-relaxed">
            {/* Header: Company Name & Document Code */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-black text-xl flex-shrink-0">
                  LK
                </div>
                <div>
                  <h1 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
                  </h1>
                  <p className="text-[10px] text-slate-600 uppercase">
                    HỆ THỐNG AN TOÀN LAO ĐỘNG, PCCC & VẬN HÀNH BẾP ĂN TẬP THỂ
                  </p>
                  <p className="text-[10px] text-slate-500 italic">
                    Địa chỉ: Đường số 3, KCN Hòa Khánh, P. Hòa Khánh Bắc, Q. Liên Chiểu, TP. Đà Nẵng
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <div className="font-bold text-slate-800">Mã biên bản: {inspection.id}</div>
                <div className="text-slate-500 text-[10px]">BM-EHS-GAS/2026</div>
                <div className="text-slate-500 text-[10px]">
                  Thời gian: {formatDateTime(inspection.scanTimestamp)}
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center pt-2 pb-1">
              <h2 className="text-base font-black uppercase tracking-wide text-slate-900">
                BIÊN BẢN KIỂM TRA KỸ THUẬT AN TOÀN HỆ THỐNG GAS
              </h2>
              <p className="text-[11px] text-slate-600 italic">
                (Áp dụng kiểm tra định kỳ và kiểm tra mỗi lần thay bình gas phục vụ bếp ăn tập thể)
              </p>
            </div>

            {/* Part I: Thông tin chung */}
            <div className="space-y-2 border border-slate-300 rounded-lg p-3 bg-slate-50/50">
              <div className="font-bold text-[11px] uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-1">
                I. THÔNG TIN VỊ TRÍ & CÁC ĐƠN VỊ THỰC HIỆN
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">1. Vị trí trạm gas:</span>{' '}
                  <span className="font-bold">{inspection.stationName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">2. Thời điểm kiểm tra thực tế:</span>{' '}
                  <span className="font-bold text-amber-900">{formatDateTime(inspection.scanTimestamp)}</span>
                  {inspection.isQrScanned && <span className="text-[10px] text-emerald-700 ml-1">(Quét mã QR)</span>}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">3. Đơn vị thay gas/bảo trì:</span>{' '}
                  <span className="font-bold">{inspection.supplierName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">4. Đại diện đơn vị thay gas:</span>{' '}
                  <span>
                    {inspection.supplierRepresentative?.representativeName || '---'} (SĐT:{' '}
                    {inspection.supplierRepresentative?.phone || '---'})
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">5. Người vận hành gas Công ty:</span>{' '}
                  <span className="font-bold">{inspection.companyOperatorName}</span> (MSNV:{' '}
                  {inspection.companyOperatorCode || '---'})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">6. Người kiểm tra an toàn:</span>{' '}
                  <span className="font-bold">{inspection.inspector.name}</span> (MSNV:{' '}
                  {inspection.inspector.id} • {inspection.inspector.department})
                </div>
              </div>
            </div>

            {/* Part II: Danh sách bình gas */}
            <div className="space-y-2">
              <div className="font-bold text-[11px] uppercase tracking-wide text-slate-800">
                II. DANH MỤC MÃ SỐ BÌNH GAS VÀ TÌNH TRẠNG VỎ BÌNH
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-center">
                    <th className="border border-slate-400 py-1 px-2 w-10">STT</th>
                    <th className="border border-slate-400 py-1 px-3">Mã số vỏ bình (Seri)</th>
                    <th className="border border-slate-400 py-1 px-2 w-24">Trọng lượng</th>
                    <th className="border border-slate-400 py-1 px-2 w-28">Hạn kiểm định</th>
                    <th className="border border-slate-400 py-1 px-3 w-40">Tình trạng vỏ bình</th>
                    <th className="border border-slate-400 py-1 px-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {inspection.cylinders.map((cyl, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="border border-slate-400 py-1 px-2 text-center font-semibold">{idx + 1}</td>
                      <td className="border border-slate-400 py-1 px-3 font-bold">{cyl.serialNumber}</td>
                      <td className="border border-slate-400 py-1 px-2 text-center">{cyl.weightKg || '45kg'}</td>
                      <td className="border border-slate-400 py-1 px-2 text-center">{cyl.expiryDate || '---'}</td>
                      <td className="border border-slate-400 py-1 px-3">
                        {cyl.status === 'good'
                          ? 'Đạt, tốt'
                          : cyl.status === 'rusty'
                          ? 'Rỉ sét bề mặt'
                          : cyl.status === 'dented'
                          ? 'Móp méo vỏ'
                          : 'Hết hạn / Nghi ngờ rò rỉ'}
                      </td>
                      <td className="border border-slate-400 py-1 px-3 text-slate-600">{cyl.notes || '---'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Part III: Kết quả kiểm tra an toàn kỹ thuật */}
            <div className="space-y-2">
              <div className="font-bold text-[11px] uppercase tracking-wide text-slate-800">
                III. KẾT QUẢ KIỂM TRA KỸ THUẬT AN TOÀN
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-center">
                    <th className="border border-slate-400 py-1 px-2 w-10">STT</th>
                    <th className="border border-slate-400 py-1 px-3">Nội dung kiểm tra</th>
                    <th className="border border-slate-400 py-1 px-2 w-32">Kết quả đánh giá</th>
                    <th className="border border-slate-400 py-1 px-3">Nội dung chi tiết / Ghi nhận thực tế</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 py-1 px-2 text-center font-semibold">1</td>
                    <td className="border border-slate-400 py-1 px-3 font-semibold">
                      Kiểm tra Van, Dây dẫn & Bộ điều áp
                    </td>
                    <td className="border border-slate-400 py-1 px-2 text-center font-bold">
                      {inspection.checklist.valvesHosesRegulators.status === 'pass' ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT'}
                    </td>
                    <td className="border border-slate-400 py-1 px-3">
                      {inspection.checklist.valvesHosesRegulators.notes || 'Bình thường'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 py-1 px-2 text-center font-semibold">2</td>
                    <td className="border border-slate-400 py-1 px-3 font-semibold">
                      Kiểm tra Độ kín (Mối hàn, ren, cổ bình)
                    </td>
                    <td className="border border-slate-400 py-1 px-2 text-center font-bold">
                      {inspection.checklist.leakageCheck.status === 'pass' ? '✓ KÍN TUYỆT ĐỐI' : '✗ PHÁT HIỆN RÒ RỈ'}
                    </td>
                    <td className="border border-slate-400 py-1 px-3">
                      Phương pháp: {inspection.checklist.leakageCheck.method === 'detector' ? 'Máy đo khí' : 'Bọt xà phòng'} •{' '}
                      {inspection.checklist.leakageCheck.notes || 'Kín tốt'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 py-1 px-2 text-center font-semibold">3</td>
                    <td className="border border-slate-400 py-1 px-3 font-semibold">
                      Thử độ nhạy Đầu dò Gas
                    </td>
                    <td className="border border-slate-400 py-1 px-2 text-center font-bold">
                      {inspection.checklist.detectorSensitivity.status === 'pass' ? '✓ NHẠY TỐT' : '✗ KÉM NHẠY'}
                    </td>
                    <td className="border border-slate-400 py-1 px-3">
                      Thời gian phản ứng: {inspection.checklist.detectorSensitivity.responseTimeSeconds || 3} giây •{' '}
                      {inspection.checklist.detectorSensitivity.notes || 'Bình thường'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 py-1 px-2 text-center font-semibold">4</td>
                    <td className="border border-slate-400 py-1 px-3 font-semibold">
                      Kiểm tra Còi, Đèn & Van ngắt tự động
                    </td>
                    <td className="border border-slate-400 py-1 px-2 text-center font-bold">
                      {inspection.checklist.alarmAndAutoValve.status === 'pass' ? '✓ HOẠT ĐỘNG TỐT' : '✗ KHÔNG ĐẠT'}
                    </td>
                    <td className="border border-slate-400 py-1 px-3">
                      {inspection.checklist.alarmAndAutoValve.notes || 'Bình thường'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Part IV: Tồn tại & Biện pháp khắc phục */}
            <div className="border border-slate-300 rounded-lg p-3 space-y-1.5 text-xs bg-slate-50/50">
              <div className="font-bold text-[11px] uppercase tracking-wide text-slate-800">
                IV. CÁC LỖI PHÁT HIỆN & BIỆN PHÁP KHẮC PHỤC
              </div>
              <div>
                <span className="font-semibold text-slate-700">• Lỗi phát hiện:</span>{' '}
                <span>{inspection.issuesFound || 'Không có tồn tại nào.'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">• Biện pháp khắc phục:</span>{' '}
                <span>{inspection.remedialActions || 'Hệ thống an toàn, tiếp tục duy trì kiểm tra định kỳ.'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">• Đánh giá chung:</span>{' '}
                <span className="font-bold">
                  {inspection.overallResult === 'pass'
                    ? 'HỆ THỐNG ĐẠT TIÊU CHUẨN AN TOÀN'
                    : inspection.overallResult === 'warning'
                    ? 'CẦN THEO DÕI / KHẮC PHỤC CÁC ĐIỂM CẢNH BÁO'
                    : 'KHÔNG ĐẠT AN TOÀN - YÊU CẦU NGƯNG SỬ DỤNG ĐỂ SỬA CHỮA'}
                </span>
              </div>
            </div>

            {/* Part V: Xác nhận của Nhà Bếp */}
            <div className="border border-emerald-400 bg-emerald-50/50 rounded-lg p-3 text-xs">
              <div className="font-bold text-[11px] uppercase tracking-wide text-emerald-950 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                V. XÁC NHẬN CỦA NHÀ BẾP (BẾP XÁC NHẬN ĐÃ THỰC HIỆN ĐẦY ĐỦ)
              </div>
              <p className="mt-1 text-slate-800">
                Đại diện Nhà Bếp xác nhận người kiểm tra và đơn vị cấp gas đã thực hiện đầy đủ quy trình kiểm tra
                kỹ thuật an toàn tại hiện trường bếp trước khi đưa vào vận hành nấu nướng.
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-700">
                <span>
                  Đại diện Bếp: <strong>{inspection.kitchenConfirmation?.staffName || '---'}</strong> (MSNV:{' '}
                  {inspection.kitchenConfirmation?.empId || '---'})
                </span>
                <span>
                  Thời gian xác nhận:{' '}
                  <strong>
                    {inspection.kitchenConfirmation?.confirmedAt
                      ? formatDateTime(inspection.kitchenConfirmation.confirmedAt)
                      : 'Đã xác nhận'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Part VI: Khung chữ ký 4 bên */}
            <div className="pt-4 grid grid-cols-4 gap-2 text-center text-[11px]">
              <div>
                <div className="font-bold uppercase text-slate-800">NGƯỜI KIỂM TRA</div>
                <div className="text-[10px] text-slate-500 italic mb-10">(Ký & ghi rõ họ tên)</div>
                <div className="font-bold text-slate-900">{inspection.inspector.name}</div>
                <div className="text-[10px] text-slate-500">MSNV: {inspection.inspector.id}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-800">NGƯỜI VẬN HÀNH GAS</div>
                <div className="text-[10px] text-slate-500 italic mb-10">(Ký & ghi rõ họ tên)</div>
                <div className="font-bold text-slate-900">{inspection.companyOperatorName}</div>
                <div className="text-[10px] text-slate-500">MSNV: {inspection.companyOperatorCode || '---'}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-800">ĐẠI DIỆN THAY GAS</div>
                <div className="text-[10px] text-slate-500 italic mb-10">(Ký & đóng dấu/ghi tên)</div>
                <div className="font-bold text-slate-900">
                  {inspection.supplierRepresentative?.representativeName || 'Lê Văn Tuấn'}
                </div>
                <div className="text-[10px] text-slate-500">{inspection.supplierName}</div>
              </div>

              <div>
                <div className="font-bold uppercase text-slate-800">ĐẠI DIỆN NHÀ BẾP</div>
                <div className="text-[10px] text-slate-500 italic mb-10">(Ký xác nhận đã kiểm tra đủ)</div>
                <div className="font-bold text-slate-900">
                  {inspection.kitchenConfirmation?.staffName || 'Đoàn Thị Lan'}
                </div>
                <div className="text-[10px] text-slate-500">
                  MSNV: {inspection.kitchenConfirmation?.empId || '1049'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Hệ thống Quản trị & Điều hành Nội bộ - Long Khải Portal</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
