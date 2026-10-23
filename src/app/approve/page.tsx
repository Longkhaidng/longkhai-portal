'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Wrench,
  Send,
  Building,
  MapPin,
} from 'lucide-react';

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trimStart();
      if (!trimmed) return line;
      const leadingSpaces = line.slice(0, line.length - trimmed.length);
      return leadingSpaces + trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    })
    .join('\n');
};

function QuickApprovalContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'leave' | 'gate_pass' | 'attendance' | 'repair' | null;
  const id = searchParams.get('id');
  const initialAction = (searchParams.get('action') as 'approve' | 'reject' | null) || 'approve';

  const [action, setAction] = useState<'approve' | 'reject'>(initialAction);
  const [isLoading, setIsLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);
  const [proposedSolution, setProposedSolution] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState<{
    success: boolean;
    alreadyProcessed?: boolean;
    message?: string;
    record?: any;
    action?: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    if (!id || !type) {
      setIsLoading(false);
      setResult({
        success: false,
        message: 'Đường dẫn phê duyệt không đầy đủ thông tin hoặc đã hết hạn.',
      });
      return;
    }

    // For repair proposal: Load document details first so manager can enter "Đề xuất hướng khắc phục"
    if (type === 'repair') {
      fetch(`/api/approve?type=repair&id=${encodeURIComponent(id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.doc) {
            setDoc(data.doc);
            if (data.doc.status !== 'pending_manager') {
              setResult({
                success: true,
                alreadyProcessed: true,
                message:
                  data.doc.status === 'rejected'
                    ? `Đề xuất ${data.doc.id} đã bị từ chối trước đó.`
                    : `Đề xuất ${data.doc.id} đã được phê duyệt trước đó và chuyển sang Cơ điện.`,
                record: data.doc,
                action: data.doc.status === 'rejected' ? 'reject' : 'approve',
              });
            }
          } else {
            setResult({
              success: false,
              message: data.message || `Không tìm thấy phiếu ${id} trên hệ thống.`,
            });
          }
        })
        .catch((err) => {
          setResult({
            success: false,
            message: err.message || 'Lỗi kết nối máy chủ.',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // For other types (leave, gate_pass, attendance): execute immediately
    fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, action: initialAction }),
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
  }, [id, type, initialAction]);

  // Submit decision for repair proposal
  const handleSubmitRepair = (targetAction: 'approve' | 'reject') => {
    if (!id || !type) return;
    setIsSubmitting(true);

    fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'repair',
        id,
        action: targetAction,
        proposedSolution: proposedSolution.trim() || undefined,
        comment: targetAction === 'approve' ? proposedSolution.trim() : rejectionReason.trim(),
      }),
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
        setIsSubmitting(false);
      });
  };

  const typeLabel =
    type === 'leave'
      ? 'Đơn Xin Nghỉ Phép'
      : type === 'gate_pass'
      ? 'Phiếu Ra - Vào Cổng'
      : type === 'attendance'
      ? 'Phiếu Xác Nhận Công'
      : 'Phiếu Đề Xuất Sửa Chữa';

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Authoritative branding */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 text-white text-center border-b border-slate-700/60">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 p-2 rounded-2xl bg-white/95 shadow-lg">
              <img
                src="/logo.png"
                alt="Long Khai Corporation Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
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

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {isLoading && (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Đang tải thông tin xét duyệt...
              </p>
            </div>
          )}

          {/* REPAIR INTERACTIVE APPROVAL FORM (Trưởng bộ phận nhập đề xuất trực tiếp từ email) */}
          {!isLoading && !result && type === 'repair' && doc && (
            <div className="space-y-5 text-left text-xs">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-sm mb-1 text-amber-700 dark:text-amber-400">
                  <Wrench className="w-4 h-4" />
                  <span>Xét duyệt đề xuất sửa chữa</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  Trưởng bộ phận xem xét tình trạng sự việc, nhập <b>đề xuất hướng khắc phục</b> và bấm phê duyệt. Hệ thống sẽ tự động chuyển tiếp qua email cho Trưởng bộ phận Cơ điện.
                </p>
              </div>

              {/* Proposal Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500">Người yêu cầu:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {doc.employeeName} ({doc.employeeId})
                  </span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500">Tổ / Bộ phận:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{doc.department}</span>
                </div>
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-slate-500">Khu vực thiết bị:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{doc.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Tình trạng sự việc:</span>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {doc.issueDescription}
                  </div>
                </div>
              </div>

              {/* Action Form */}
              {action === 'approve' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-white mb-1.5 flex items-center justify-between">
                      <span>Đề xuất hướng khắc phục:</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Tự động viết hoa đầu dòng)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={proposedSolution}
                      onChange={(e) => setProposedSolution(capitalizeFirstLetter(e.target.value))}
                      onBlur={() => setProposedSolution((prev) => capitalizeFirstLetter(prev.trim()))}
                      placeholder="Trưởng bộ phận nhập ý kiến đề xuất hướng khắc phục, chỉ đạo kiểm tra, vật tư thay thế cho bộ phận Cơ điện..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitRepair('approve')}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Đang chuyển Cơ điện...' : '✓ PHÊ DUYỆT & GỬI CƠ ĐIỆN'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setAction('reject')}
                      className="py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Từ chối...
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                      Lý do từ chối đề xuất:
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(capitalizeFirstLetter(e.target.value))}
                      onBlur={() => setRejectionReason((prev) => capitalizeFirstLetter(prev.trim()))}
                      placeholder="Nhập lý do từ chối để thông báo cho người lao động..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSubmitRepair('reject')}
                      className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isSubmitting ? 'Đang xử lý...' : '✕ XÁC NHẬN TỪ CHỐI ĐƠN'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setAction('approve')}
                      className="py-3 px-4 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Quay lại duyệt
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FINAL RESULT CARD (After successful action or already finalized) */}
          {!isLoading && result && (
            <div className="space-y-6 text-center">
              {result.success ? (
                result.action === 'approve' || (!result.action && action === 'approve') ? (
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
                      {type === 'repair' && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 mt-2">
                          Đơn đã được tự động chuyển tiếp qua email tới Trưởng bộ phận Cơ điện (Anh Trịnh Anh Tài) để tiếp nhận sửa chữa.
                        </p>
                      )}
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
        <div className="bg-slate-50 dark:bg-slate-900/60 py-3 px-6 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 text-center">
          Cổng Thông Tin Long Khải Portal &bull; Tự động đồng bộ
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
