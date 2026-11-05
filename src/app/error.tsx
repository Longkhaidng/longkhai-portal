'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error caught by error boundary:', error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      // Clear session & overtime cached keys that could cause invalid state
      const keysToClear = [
        'lk_portal_active_session_empid',
        'lk_portal_overtime_registrations',
        'lk_portal_overtime_meal_menus',
      ];
      keysToClear.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
    } catch {}
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Đã xảy ra lỗi khởi động trang</h1>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Hệ thống gặp sự cố tạm thời trong quá trình nạp dữ liệu cục bộ. Bạn có thể nhấn thử tải lại hoặc làm mới bộ nhớ đệm để khắc phục.
        </p>

        {error?.message && (
          <div className="mb-6 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
            <p className="text-[11px] font-mono text-rose-400 break-all line-clamp-3">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
          >
            <RefreshCw className="w-4 h-4" />
            Thử tải lại (Reload)
          </button>

          <button
            onClick={handleClearCacheAndReload}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-amber-400" />
            Xóa bộ nhớ đệm & Khởi động lại
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mt-2"
          >
            <Home className="w-3.5 h-3.5" />
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
