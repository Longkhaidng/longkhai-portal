'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Clock } from 'lucide-react';

function QuickApprovalContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'leave' | 'gate_pass' | 'attendance' | null;
  const id = searchParams.get('id');
  const action = searchParams.get('action') as 'approve' | 'reject' | null;

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    alreadyProcessed?: boolean;
    message?: string;
    record?: any;
    action?: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    if (!id || !type || !action) {
      setIsLoading(false);
      setResult({
        success: false,
        message: 'Đường dẫn phê duyệt không đầy đủ thông tin hoặc đã hết hạn.',
      });
      return;
    }

    // Call server API for instant execution
    fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, action }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        setResult({
          success: false,
          message: err.message || 'Lỗi kết nối máy chủ khi xử lý phê duyệt.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, type, action]);

  const typeLabel =
    type === 'leave'
      ? 'Đơn Xin Nghỉ Phép'
      : type === 'gate_pass'
      ? 'Phiếu Ra - Vào Cổng'
      : 'Phiếu Xác Nhận Công';

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-slate-700/50 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Dark, authoritative styling */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white text-center border-b border-slate-700/60">
          <div className="text-[12px] font-black uppercase tracking-wider text-slate-100 mb-1">
            CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
          </div>
          <h1 className="text-base font-bold tracking-tight text-blue-200">
            HỆ THỐNG XÉT DUYỆT TRỰC TUYẾN
          </h1>
          {id && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-mono font-bold text-white border border-white/10">
              <FileText className="w-3.5 h-3.5" />
              <span>{id}</span>
            </div>
          )}
        </div>

        {/* Body Result - Clean & Minimalist */}
        <div className="p-8">
          {isLoading && (
            <div className="py-10 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Đang xử lý yêu cầu phê duyệt từ Email...
              </p>
            </div>
          )}

          {!isLoading && result && (
            <div className="space-y-6">
              {result.success ? (
                action === 'approve' ? (
                  // APPROVE SUCCESS
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        ✓ PHÊ DUYỆT THÀNH CÔNG
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {typeLabel} <b>{id}</b>
                        {result.record?.employeeName && (
                          <> của nhân viên <b>{result.record.employeeName}</b></>
                        )}
                        {' '}đã được phê duyệt thành công.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        Kết quả đã được cập nhật tự động lên hệ thống cho người lao động.
                      </p>
                    </div>
                  </div>
                ) : (
                  // REJECT SUCCESS
                  <div className="space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
                      <XCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                        ✕ TỪ CHỐI ĐƠN THÀNH CÔNG
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {typeLabel} <b>{id}</b>
                        {result.record?.employeeName && (
                          <> của nhân viên <b>{result.record.employeeName}</b></>
                        )}
                        {' '}đã được ghi nhận từ chối.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        Kết quả đã được cập nhật tự động lên hệ thống cho người lao động.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                // ERROR
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      Thông Báo Xử Lý
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {result.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simple Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/60 py-3 px-6 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
          Cổng Thông Tin Long Khai Portal &bull; Tự động đồng bộ
        </div>
      </div>
    </div>
  );
}

export default function QuickApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <QuickApprovalContent />
    </Suspense>
  );
}
