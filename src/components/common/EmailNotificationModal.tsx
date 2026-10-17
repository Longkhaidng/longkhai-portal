'use client';

import React, { useState } from 'react';
import { DispatchEmailResult } from '@/lib/email';
import {
  CheckCircle2,
  AlertTriangle,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Send,
  Settings,
} from 'lucide-react';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DispatchEmailResult | null;
  recipientEmail: string;
  docId: string;
  docTypeTitle: string;
}

export function EmailNotificationModal({
  isOpen,
  onClose,
  result,
  recipientEmail,
  docId,
  docTypeTitle,
}: EmailNotificationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const handleCopyLink = () => {
    if (result.approveUrl) {
      navigator.clipboard.writeText(result.approveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              result.success
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
            }`}
          >
            {result.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {result.success ? 'Đã Gửi Email Thành Công' : 'Thông Báo Gửi Email Duyệt Đơn'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ: <b className="font-mono text-blue-600">{docId}</b> ({docTypeTitle}) &bull; Trưởng BP: <b className="text-slate-800 dark:text-slate-200">{recipientEmail}</b>
            </p>
          </div>
        </div>

        {/* Success State */}
        {result.success ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
            <p className="font-semibold leading-relaxed">
              ✓ Hệ thống đã tự động gửi email thông báo kèm 2 nút <strong>[Phê duyệt đơn]</strong> và <strong>[Từ chối đơn]</strong> đến hòm thư của Trưởng bộ phận:
            </p>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/80 font-mono font-bold text-center text-emerald-700 dark:text-emerald-300">
              {recipientEmail}
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Trưởng bộ phận có thể kiểm tra hòm thư và bấm duyệt ngay trên điện thoại hoặc máy tính.
            </p>
          </div>
        ) : (
          /* Not Configured / Fallback State */
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">
                ⚠️ Hồ sơ đã được lưu thành công trên hệ thống!
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Tuy nhiên, hệ thống chưa kết nối tài khoản gửi Email tự động (SMTP / Gmail / Microsoft 365) trong mục <strong>Cài đặt hệ thống</strong>. Bạn có thể gửi thông báo cho Trưởng bộ phận bằng các cách sau:
              </p>
            </div>

            {/* Option 1: Open Mail Client */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Cách 1: Mở Outlook / Ứng dụng Mail gửi ngay (Khuyên dùng)
              </span>
              <p className="text-[11px] text-slate-500">
                Hệ thống đã soạn sẵn toàn bộ nội dung đơn và link duyệt gửi tới <b>{recipientEmail}</b>:
              </p>
              <a
                href={result.mailtoUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>BẤM ĐỂ MỞ EMAIL SOẠN SẴN VÀ GỬI NGAY</span>
              </a>
            </div>

            {/* Option 2: Copy link to Zalo / Teams */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Cách 2: Gửi link duyệt đơn qua Zalo / Tin nhắn
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.approveUrl}
                  className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-mono text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
                </button>
              </div>
            </div>

            {/* Note for Admin */}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed italic">
              * Dành cho Quản trị viên: Để hệ thống tự động gửi email ngầm mà không cần mở Outlook, vui lòng vào <b>Cài đặt hệ thống &rarr; Cấu hình Gửi Email</b> để nhập tài khoản gửi thư (Gmail hoặc Microsoft 365).
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
}
