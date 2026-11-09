'use client';

import React, { useRef } from 'react';
import { FoodRegistration, FOOD_CATEGORY_LABELS, FOOD_STATUS_LABELS, FOOD_STATUS_BADGES } from '@/types/food-registration';
import { X, Download, QrCode, CheckCircle2, User, Building, Calendar, Clock, UtensilsCrossed, ExternalLink, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface FoodQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: FoodRegistration | null;
}

export function FoodQrModal({ isOpen, onClose, registration }: FoodQrModalProps) {
  const qrRef = useRef<HTMLImageElement>(null);

  if (!isOpen || !registration) return null;

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
                <span className="text-slate-400 text-[10px] block">{registration.toDate ? 'Thời gian mang vào:' : 'Ngày mang vào:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {registration.toDate && registration.toDate !== registration.entryDate ? `${formatDate(registration.entryDate)} → ${formatDate(registration.toDate)}` : formatDate(registration.entryDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">{registration.shift ? 'Ca làm việc:' : 'Hình thức:'}</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {registration.shift || (registration.toDate ? 'Theo đợt' : '-')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 text-[10px] block mb-0.5">{registration.category === 'medicine_drink' ? 'Phân loại thực phẩm:' : 'Phân loại & Món ăn:'}</span>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                {FOOD_CATEGORY_LABELS[registration.category]}
                {registration.customCategory ? ` (${registration.customCategory})` : ''}
              </p>
              <p className={`text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 line-clamp-2 ${registration.category === 'medicine_drink' ? 'hidden' : ''}`}>
                {registration.foodDetails}
              </p>
            </div>

            {registration.status === 'confirmed' && (
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
          {registration.qrDataUrl && (
            <button
              onClick={handleDownloadQr}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải ảnh QR về máy</span>
            </button>
          )}

          {registration.qrCodeUrl && (
            <a
              href={registration.qrCodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Mở link xác nhận</span>
            </a>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
