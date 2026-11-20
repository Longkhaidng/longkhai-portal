'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FoodRegistration,
  FOOD_CATEGORY_LABELS,
  FOOD_STATUS_LABELS,
  FOOD_STATUS_BADGES,
  checkFoodQrValidity,
} from '@/types/food-registration';
import {
  X,
  XCircle,
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
import { generateQrDataUrl, getQrConfirmUrl } from '@/lib/qr';
import { storage } from '@/lib/storage';

interface FoodQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: FoodRegistration | null;
  isGuard?: boolean;
  onGuardConfirm?: (item: FoodRegistration) => void;
  onGuardReject?: (item: FoodRegistration) => void;
}

export function FoodQrModal({
  isOpen,
  onClose,
  registration,
  isGuard,
  onGuardConfirm,
  onGuardReject,
}: FoodQrModalProps) {
  const qrRef = useRef<HTMLImageElement>(null);
  const [activeQrUrl, setActiveQrUrl] = useState<string>(registration?.qrDataUrl || '');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);

  // Auto-generate QR code on the fly if missing and record is approved/confirmed/vegetarian
  useEffect(() => {
    let isMounted = true;
    if (isOpen && registration) {
      if (registration.qrDataUrl) {
        setActiveQrUrl(registration.qrDataUrl);
      } else if (
        registration.status === 'approved' ||
        registration.status === 'confirmed' ||
        registration.category === 'vegetarian'
      ) {
        setIsGeneratingQr(true);
        const confirmUrl = registration.qrCodeUrl || getQrConfirmUrl('food', registration.id);
        generateQrDataUrl(confirmUrl)
          .then((dataUrl) => {
            if (isMounted) {
              setActiveQrUrl(dataUrl);
              registration.qrCodeUrl = confirmUrl;
              registration.qrDataUrl = dataUrl;
              storage.saveFoodRegistration(registration, { id: 'system', name: 'Hệ thống' });
            }
          })
          .catch((err) => {
            console.warn('Error auto-generating QR code:', err);
          })
          .finally(() => {
            if (isMounted) setIsGeneratingQr(false);
          });
      } else {
        setActiveQrUrl('');
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, registration]);

  if (!isOpen || !registration) return null;

  const validity = checkFoodQrValidity(registration);
  const isPendingApproval = registration.status === 'pending_dept' || registration.status === 'pending_hr';

  // Helper lấy tên thực phẩm hiển thị chuẩn
  const getFoodDisplayName = (): string => {
    if (registration.category === 'medicine_drink') {
      return 'Nước thuốc';
    }
    if (registration.category === 'pregnant') {
      return registration.foodDetails || 'Bánh + Sữa hoặc Trái cây + Sữa';
    }
    return registration.foodDetails || FOOD_CATEGORY_LABELS[registration.category] || 'Thực phẩm';
  };

  const foodDisplayName = getFoodDisplayName();

  // Helper download QR badge card
  const handleDownloadQr = () => {
    if (!activeQrUrl) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback simple download
        const a = document.createElement('a');
        a.href = activeQrUrl;
        a.download = `QR_ThucPham_${registration.id}_${registration.employeeId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = 500;
        canvas.height = 640;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header banner
        ctx.fillStyle = '#059669';
        ctx.fillRect(0, 0, canvas.width, 68);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PHIẾU MANG THỰC PHẨM VÀO NHÀ MÁY', canvas.width / 2, 32);
        ctx.font = '13px sans-serif';
        ctx.fillText(`Mã phiếu: ${registration.id} | CÔNG TY LONG KHẢI`, canvas.width / 2, 54);

        // QR Image
        ctx.drawImage(img, 100, 85, 300, 300);

        // Separator
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(30, 400);
        ctx.lineTo(470, 400);
        ctx.stroke();

        // 2 MAIN INFORMATION ITEMS
        ctx.textAlign = 'left';

        // 1. Họ và tên người đăng ký
        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('1. Họ và tên người đăng ký:', 36, 430);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${registration.employeeName} (${registration.employeeId})`, 36, 458);

        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.fillText(`Bộ phận: ${registration.department}`, 36, 482);

        // 2. Tên thực phẩm mang vào
        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('2. Tên thực phẩm mang vào:', 36, 520);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 17px sans-serif';
        const displayFood = foodDisplayName.length > 42 ? foodDisplayName.slice(0, 40) + '...' : foodDisplayName;
        ctx.fillText(displayFood, 36, 546);

        // Validity period footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        const dateStr = registration.toDate && registration.toDate !== registration.entryDate
          ? `${formatDate(registration.entryDate)} → ${formatDate(registration.toDate)}`
          : formatDate(registration.entryDate);
        ctx.fillText(`Thời gian hiệu lực: ${dateStr}`, 36, 595);

        // Border card
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `QR_ThucPham_${registration.id}_${registration.employeeId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      img.src = activeQrUrl;
    } catch {
      // Fallback
      const a = document.createElement('a');
      a.href = activeQrUrl;
      a.download = `QR_ThucPham_${registration.id}_${registration.employeeId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
            {validity.isExpired ? (
              <span className="px-3 py-1 text-xs font-bold rounded-full border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                Hết hiệu lực
              </span>
            ) : (
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${FOOD_STATUS_BADGES[registration.status]}`}>
                {FOOD_STATUS_LABELS[registration.status]}
              </span>
            )}
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
                  ? 'Đơn đăng ký của nhân viên Phòng HCNS hoặc CNTT được chuyển trực tiếp đến Trưởng phòng HCNS phê duyệt. Mã QR sẽ được kích hoạt ngay sau khi Trưởng phòng HCNS phê duyệt.'
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
                {activeQrUrl ? (
                  <img
                    ref={qrRef}
                    src={activeQrUrl}
                    alt={`QR Code ${registration.id}`}
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : isGeneratingQr ? (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 mb-2 stroke-1 animate-pulse text-emerald-500" />
                    <span className="font-medium text-emerald-600">Đang khởi tạo mã QR...</span>
                  </div>
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 mb-2 stroke-1 text-slate-300" />
                    <span>Mã QR chưa sẵn sàng</span>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-slate-500 font-medium">
                  Đưa mã QR này cho bảo vệ tại cổng quét xác nhận
                </p>
              </div>
            </>
          )}

          {/* Registration Info: ONLY 2 main items as requested */}
          <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 text-left space-y-3">
            <div>
              <span className="text-slate-400 text-xs font-medium block mb-0.5">
                1. Họ và tên người đăng ký:
              </span>
              <div className="flex items-center justify-between">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {registration.employeeName}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  MSNV: <b>{registration.employeeId}</b>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 text-xs font-medium block mb-0.5">
                2. Tên thực phẩm mang vào:
              </span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 block">
                {foodDisplayName}
              </span>
              {registration.category === 'medicine_drink' && (registration.medicineReason || registration.foodDetails) && (
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-normal">
                  Lý do: {registration.medicineReason || registration.foodDetails.replace(/^Nước thuốc\s*\(Lý do:\s*/i, '').replace(/\)$/, '')}
                </span>
              )}
            </div>

            {/* Guard status / confirmation indicator if confirmed */}
            {registration.status === 'confirmed' && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Bảo vệ {registration.guardName || 'cổng'} đã quét xác nhận</span>
              </div>
            )}

            {/* Khối bảo vệ cổng kiểm tra & xác nhận trong modal (nếu bảo vệ đang xem) */}
            {isGuard && !validity.isExpired && (registration.status === 'approved' || registration.status === 'confirmed') && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Xác nhận tại cổng:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onGuardConfirm?.(registration)}
                      className="py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cho vào</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onGuardReject?.(registration)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center gap-2">
          {activeQrUrl && !isPendingApproval && !validity.isExpired && (
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải thẻ &amp; Mã QR</span>
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
