'use client';

import React, { useRef } from 'react';
import {
  FoodRegistration,
  FOOD_CATEGORY_LABELS,
  FOOD_STATUS_LABELS,
  FOOD_STATUS_BADGES,
  checkFoodQrValidity,
} from '@/types/food-registration';
import {
  X,
  Download,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface FoodQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: FoodRegistration | null;
}

export function FoodQrModal({ isOpen, onClose, registration }: FoodQrModalProps) {
  const qrRef = useRef<HTMLImageElement>(null);

  if (!isOpen || !registration) return null;

  const validity = checkFoodQrValidity(registration);
  const isPendingApproval = registration.status === 'pending_dept' || registration.status === 'pending_hr';

  const handleDownloadQr = () => {
    if (!registration.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = registration.qrDataUrl;
    a.download = `QR_ThucPham_${registration.id}_${registration.employeeId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Mã QR Thực Phẩm Mang Vào
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Mã phiếu: <b className="text-emerald-600 dark:text-emerald-400">{registration.id}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex flex-col items-center space-y-4 text-center overflow-y-auto max-h-[75vh]">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${FOOD_STATUS_BADGES[registration.status]}`}>
              {FOOD_STATUS_LABELS[registration.status]}
            </span>
          </div>

          {/* CASE 1: EXPIRED QR CODE */}
          {validity.isExpired ? (
            <div className="w-full p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-400 dark:border-rose-800 text-center space-y-2">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-sm font-black text-rose-700 dark:text-rose-200 uppercase">
                Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực.
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-300">
                Mã QR này không còn hiệu lực qua cổng. Vui lòng đăng ký đơn mới nếu tiếp tục có nhu cầu mang thực phẩm vào nhà máy.
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                {registration.category === 'vegetarian'
                  ? 'Mã QR thực phẩm chay có thời hạn trong 12h kể từ lúc đăng ký.'
                  : `Thời hạn đăng ký đã kết thúc vào ngày ${registration.toDate || registration.entryDate}.`}
              </div>
            </div>
          ) : isPendingApproval ? (
            /* CASE 2: PENDING MULTI-STEP APPROVAL (Pregnant / Medicine) */
            <div className="w-full p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-left space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {registration.steps && registration.steps.length === 1
                    ? 'Đang chờ Trưởng phòng HCNS phê duyệt (Chưa cấp mã QR)'
                    : 'Quy trình phê duyệt 2 cấp (Chưa cấp mã QR)'}
                </span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {registration.steps && registration.steps.length === 1
                  ? 'Đơn đăng ký của nhân viên Phòng HCNS được chuyển trực tiếp đến Trưởng phòng HCNS phê duyệt. Mã QR sẽ được kích hoạt ngay sau khi Trưởng phòng HCNS phê duyệt.'
                  : 'Theo quy định, thực phẩm chế độ dài ngày cần được Trưởng bộ phận và Trưởng phòng HCNS phê duyệt. Mã QR sẽ được cấp tự động sau khi phê duyệt hoàn tất.'}
              </p>

              <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/60 text-xs">
                {registration.steps && registration.steps.length === 1 ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Trưởng phòng HCNS duyệt</span>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {registration.steps?.[0]?.status === 'approved' ? '✓ Đã duyệt' : 'Đang chờ duyệt'}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Step 1: Dept Head */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">1. Trưởng bộ phận</span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {registration.steps?.[0]?.status === 'approved' ? '✓ Đã duyệt' : 'Đang chờ duyệt'}
                      </span>
                    </div>
                    {/* Step 2: HR Head */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">2. Trưởng phòng HCNS</span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        {registration.steps?.[1]?.status === 'approved'
                          ? '✓ Đã duyệt'
                          : registration.steps?.[0]?.status === 'approved'
                          ? 'Chờ duyệt'
                          : 'Chờ bước 1'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* CASE 3: VALID ACTIVE QR CODE */
            <>
              {/* Validity notice banner */}
              {validity.remainingText && (
                <div className="w-full px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{validity.remainingText}</span>
                </div>
              )}

              {/* QR Container */}
              <div className="p-4 bg-white rounded-3xl shadow-inner border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                {registration.qrDataUrl ? (
                  <img
                    ref={qrRef}
                    src={registration.qrDataUrl}
                    alt={`QR Code ${registration.id}`}
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 mb-2 stroke-1 animate-pulse" />
                    <span>Đang tải mã QR...</span>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  Đưa mã QR này cho bảo vệ tại cổng quét xác nhận
                </p>
              </div>
            </>
          )}

          {/* Registration Info Summary Card */}
          <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 text-left text-xs space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[10px] block">Người mang vào:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {registration.employeeName} ({registration.employeeId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Bộ phận / Xưởng:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {registration.department}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <div>
                <span className="text-slate-400 text-[10px] block">
                  {registration.toDate ? 'Thời gian mang vào:' : 'Ngày mang vào:'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {registration.toDate && registration.toDate !== registration.entryDate
                    ? `${formatDate(registration.entryDate)} → ${formatDate(registration.toDate)}`
                    : formatDate(registration.entryDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">
                  {registration.shift ? 'Ca làm việc:' : 'Hình thức:'}
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {registration.shift || (registration.toDate ? 'Theo đợt' : '-')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 text-[10px] block mb-0.5">
                {registration.category === 'medicine_drink' ? 'Phân loại & Lý do mang vào:' : 'Phân loại & Món ăn:'}
              </span>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {FOOD_CATEGORY_LABELS[registration.category]}
                {registration.customCategory ? ` (${registration.customCategory})` : ''}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                {registration.category === 'medicine_drink'
                  ? (registration.medicineReason || registration.foodDetails)
                  : registration.foodDetails}
              </p>
              {registration.category === 'pregnant' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 italic mt-1 font-medium">
                  * Ghi chú: Mỗi người chỉ được phép mang vào 02 đơn vị cho mỗi loại thực phẩm.
                </p>
              )}
              {registration.notes && (
                <p className="text-[10px] text-slate-500 mt-1">
                  <span className="font-medium text-slate-400">Ghi chú:</span> {registration.notes}
                </p>
              )}
            </div>

            {registration.entryLogs && registration.entryLogs.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Lịch sử bảo vệ xác nhận ({registration.entryLogs.length} lần):
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {registration.entryLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={log.action === 'confirmed' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {log.action === 'confirmed' ? '✓' : '✕'}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{log.guardName}</span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {log.timestamp ? new Date(log.timestamp).toLocaleDateString('vi-VN') + ' ' + new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {registration.status === 'confirmed' && (!registration.entryLogs || registration.entryLogs.length === 0) && (
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Bảo vệ <b>{registration.guardName || 'Bảo vệ cổng'}</b> đã xác nhận cho mang vào
                  {registration.confirmedAt && ` (${new Date(registration.confirmedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`}.
                </span>
              </div>
            )}

            {registration.status === 'rejected' && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                Lý do từ chối: <b>{registration.rejectedReason || 'Không đảm bảo an toàn vệ sinh'}</b>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-2">
          {registration.qrDataUrl && !isPendingApproval && !validity.isExpired && (
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh QR</span>
            </button>
          )}

          {registration.qrCodeUrl && !isPendingApproval && !validity.isExpired && (
            <a
              href={registration.qrCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Mở link</span>
            </a>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
