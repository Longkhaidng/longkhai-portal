'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Building,
  Calendar,
  LogIn,
  LogOut,
  QrCode,
  FileText,
  CreditCard,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';

export const SECURITY_GUARDS = [
  'Lương Văn Vĩnh',
  'Nguyễn Hữu Lập',
  'Lê Văn Ân',
  'Trương Văn Hùng',
  'Trần Công Nhân',
] as const;

function ScanConfirmContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get('id') || searchParams.get('code') || '';
  const paramType = searchParams.get('type') as 'gate_pass' | 'attendance' | null;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [docType, setDocType] = useState<'gate_pass' | 'attendance'>('gate_pass');
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [managerInfo, setManagerInfo] = useState<any>(null);

  // Form states for security action
  const [guardName, setGuardName] = useState<string>(SECURITY_GUARDS[0]);
  const [actionTime, setActionTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [actualCheckIn, setActualCheckIn] = useState('');
  const [actualCheckOut, setActualCheckOut] = useState('');
  const [note, setNote] = useState('Đã xác nhận kiểm tra vào/ra thực tế qua quét mã QR');

  // Submit / Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    message: string;
  } | null>(null);

  // Fetch document details on load
  const loadDoc = () => {
    if (!rawId) {
      setIsLoading(false);
      setErrorMsg('Vui lòng quét mã QR hợp lệ hoặc cung cấp mã phiếu cần xác nhận.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const query = new URLSearchParams({ id: rawId });
    if (paramType) query.set('type', paramType);

    fetch(`/api/scan-confirm?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setErrorMsg(data.message || 'Không tìm thấy phiếu trên hệ thống.');
          return;
        }
        setDocData(data.record);
        setDocType(data.type);
        setEmployeeInfo(data.employee);
        setManagerInfo(data.manager);

        if (data.type === 'attendance' && data.record) {
          setActualCheckIn(data.record.checkInTime || '08:00');
          setActualCheckOut(data.record.checkOutTime || '16:30');
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadDoc();
  }, [rawId, paramType]);

  // Handle Security Action for Gate Pass
  const handleGatePassAction = (action: 'depart' | 'return') => {
    if (!docData) return;
    setIsSubmitting(true);

    const payload = {
      type: 'gate_pass',
      id: docData.id,
      action,
      actualTime: new Date().toISOString(),
      guardName: guardName.trim() || 'Bảo vệ cổng (Quét QR)',
      note: note.trim(),
    };

    fetch('/api/scan-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocData(data.record);
          setResultModal({
            show: true,
            success: true,
            title: action === 'depart' ? 'Xác nhận Cho Ra Cổng Thành Công' : 'Xác nhận Đã Vào Cổng Thành Công',
            message: data.message || 'Đã ghi nhận thời gian thực tế của nhân viên thành công.',
          });
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Không thể xác nhận',
            message: data.message || 'Có lỗi xảy ra khi xác nhận phiếu.',
          });
        }
      })
      .catch((err) => {
        setResultModal({
          show: true,
          success: false,
          title: 'Lỗi kết nối',
          message: err.message || 'Không thể gửi dữ liệu lên máy chủ.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Handle Security Action for Attendance Confirm (Step 1)
  const handleAttendanceAction = (actionType: 'check_in' | 'check_out') => {
    if (!docData) return;
    setIsSubmitting(true);

    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const payload = {
      type: 'attendance',
      id: docData.id,
      action: actionType === 'check_in' ? 'confirm_check_in' : 'confirm_check_out',
      actionType,
      time: currentTime,
      guardName: guardName.trim() || 'Bảo vệ cổng (Quét QR)',
      note: note.trim(),
    };

    fetch('/api/scan-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocData(data.record);

          // Update localStorage if client has it
          try {
            if (typeof window !== 'undefined') {
              const localAtt = localStorage.getItem('longkhai_attendance_confirms');
              if (localAtt) {
                const list = JSON.parse(localAtt);
                const idx = list.findIndex((a: any) => a.id === data.record.id);
                if (idx >= 0) {
                  list[idx] = data.record;
                } else {
                  list.unshift(data.record);
                }
                localStorage.setItem('longkhai_attendance_confirms', JSON.stringify(list));
              }
            }
          } catch {}

          const actionLabel = actionType === 'check_in' ? 'Thời Gian Vào' : 'Thời Gian Ra';
          setResultModal({
            show: true,
            success: true,
            title: `Xác Nhận ${actionLabel} Thực Tế Thành Công`,
            message: data.message || `Đã ghi nhận ${actionLabel.toLowerCase()} thực tế lúc ${currentTime} cho nhân viên ${docData.employeeName}.`,
          });
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Không thể xác nhận',
            message: data.message || 'Có lỗi xảy ra khi xác nhận.',
          });
        }
      })
      .catch((err) => {
        setResultModal({
          show: true,
          success: false,
          title: 'Lỗi kết nối',
          message: err.message || 'Không thể gửi dữ liệu lên máy chủ.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 flex flex-col items-center justify-start sm:justify-center font-sans text-slate-100">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Authoritative Header */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-5 border-b border-slate-800 text-center relative">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
            CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>XÁC NHẬN BẢO VỆ CỔNG (QUÉT MÃ QR)</span>
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-300">
            <span>✓ Xác thực trực tiếp &bull; Không cần đăng nhập</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {isLoading && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Đang nạp dữ liệu phiếu từ mã QR...
              </p>
            </div>
          )}

          {!isLoading && errorMsg && (
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3">
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="font-bold text-sm text-rose-200">Không thể tra cứu phiếu</div>
              <p className="text-xs text-rose-300/90">{errorMsg}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Tải lại trang
              </button>
            </div>
          )}

          {!isLoading && docData && (
            <>
              {/* Document Identity Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">
                    {docType === 'gate_pass' ? 'Phiếu Ra - Vào Cổng' : 'Phiếu Xác Nhận Công Vào - Ra'}
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                    {docData.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Thời gian tạo:</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {docData.createdAt ? new Date(docData.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              </div>

              {/* Employee Information Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>THÔNG TIN NGƯỜI LAO ĐỘNG</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Họ và tên:</span>
                    <span className="font-bold text-white text-sm">
                      {docData.employeeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Mã số nhân viên:</span>
                    <span className="font-bold font-mono text-blue-400">
                      {docData.employeeId}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">Phòng ban / Xưởng:</span>
                    <span className="font-semibold text-slate-200">
                      {docData.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* DETAILS: GATE PASS */}
              {docType === 'gate_pass' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span>CHI TIẾT XIN PHÉP RA - VÀO CỔNG</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Lý do ra cổng:</span>
                        <span className="font-bold text-amber-300 text-sm">
                          {docData.purpose}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Loại thời gian:</span>
                          <span className="font-semibold text-slate-200">
                            {docData.timeType === 'nghi_dau_gio'
                              ? 'Nghỉ đầu giờ (Vào trễ)'
                              : docData.timeType === 'nghi_giua_gio'
                              ? 'Nghỉ giữa giờ (Ra & Vào lại)'
                              : docData.timeType === 'nghi_cuoi_gio'
                              ? 'Nghỉ cuối giờ (Về sớm)'
                              : 'Trong ca làm việc'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Giờ dự kiến:</span>
                          <span className="font-semibold text-slate-200">
                            {docData.estimatedDepartureTime ? `Ra: ${docData.estimatedDepartureTime.split('T')[1] || docData.estimatedDepartureTime}` : ''}
                            {docData.estimatedReturnTime ? ` &bull; Vào: ${docData.estimatedReturnTime.split('T')[1] || docData.estimatedReturnTime}` : ''}
                          </span>
                        </div>
                      </div>

                      {docData.hasAssets && docData.assets && docData.assets.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-slate-400 text-[11px] block mb-1">
                            Tài sản / hàng mẫu mang ra:
                          </span>
                          <div className="space-y-1">
                            {docData.assets.map((ast: any, idx: number) => (
                              <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200">{ast.name}</span>
                                <span className="font-bold text-amber-400">{ast.quantity} {ast.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* APPROVAL STATUS BANNER */}
                  {docData.status === 'pending' ? (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/80 text-amber-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>CHƯA ĐƯỢC TRƯỞNG BỘ PHẬN PHÊ DUYỆT</span>
                      </div>
                      <p className="text-xs text-amber-300/90 leading-relaxed">
                        Phiếu này đang ở trạng thái <b>Chờ Trưởng bộ phận duyệt</b>. Người lao động chưa được phép ra khỏi cổng công ty. Bảo vệ vui lòng yêu cầu người lao động liên hệ Trưởng bộ phận phê duyệt trước khi xuất xưởng.
                      </p>
                    </div>
                  ) : docData.status === 'rejected' ? (
                    <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        <span>PHIẾU NÀY ĐÃ BỊ TỪ CHỐI</span>
                      </div>
                      <p className="text-xs text-rose-300">
                        Trưởng bộ phận đã từ chối yêu cầu ra cổng này. Bảo vệ không cho phép người lao động ra cổng.
                      </p>
                    </div>
                  ) : (
                    /* APPROVED / DEPARTED / COMPLETED */
                    <div className="space-y-4">
                      <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          {docData.managerApproverName
                            ? `Trưởng bộ phận (${docData.managerApproverName}) đã phê duyệt hợp lệ`
                            : 'Trưởng bộ phận đã phê duyệt hợp lệ'}
                        </span>
                      </div>

                      {/* Case 1: Waiting for Departure */}
                      {docData.status === 'approved' && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-700/60 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                            <LogOut className="w-4 h-4" />
                            <span>Xác nhận Cho Ra Cổng (Ghi nhận giờ ra thực tế)</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                                Tên bảo vệ xác nhận: *
                              </label>
                              <select
                                value={guardName}
                                onChange={(e) => setGuardName(e.target.value)}
                                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
                              >
                                {SECURITY_GUARDS.map((guard) => (
                                  <option key={guard} value={guard}>
                                    {guard}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                                Giờ xác nhận:
                              </label>
                              <input
                                type="text"
                                value={actionTime}
                                onChange={(e) => setActionTime(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                              Ghi chú của bảo vệ (tùy chọn):
                            </label>
                            <input
                              type="text"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                              placeholder="Ghi chú kiểm tra..."
                            />
                          </div>

                          <button
                            onClick={() => handleGatePassAction('depart')}
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{isSubmitting ? 'ĐANG LƯU XÁC NHẬN...' : '✓ BẢO VỆ XÁC NHẬN CHO RA CỔNG'}</span>
                          </button>
                        </div>
                      )}

                      {/* Case 2: Waiting for Return */}
                      {docData.status === 'departed' && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-blue-700/60 space-y-3">
                          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                            <LogIn className="w-4 h-4" />
                            <span>Xác nhận Đã Vào Cổng (Ghi nhận giờ vào thực tế)</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <div>Đã ra cổng lúc: <b className="text-amber-400">{docData.actualDepartureTime ? new Date(docData.actualDepartureTime).toLocaleTimeString('vi-VN') : 'Đã ra'}</b></div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                                Tên bảo vệ xác nhận: *
                              </label>
                              <select
                                value={guardName}
                                onChange={(e) => setGuardName(e.target.value)}
                                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
                              >
                                {SECURITY_GUARDS.map((guard) => (
                                  <option key={guard} value={guard}>
                                    {guard}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                                Giờ vào thực tế:
                              </label>
                              <input
                                type="text"
                                value={actionTime}
                                onChange={(e) => setActionTime(e.target.value)}
                                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-blue-400 font-mono font-bold"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleGatePassAction('return')}
                            disabled={isSubmitting}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{isSubmitting ? 'ĐANG LƯU XÁC NHẬN...' : '✓ BẢO VỆ XÁC NHẬN ĐÃ VÀO CỔNG'}</span>
                          </button>
                        </div>
                      )}

                      {/* Case 3: Fully Completed */}
                      {docData.status === 'completed' && (
                        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-center space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                          <div className="font-bold text-sm text-emerald-300">
                            PHIẾU RA - VÀO CỔNG ĐÃ HOÀN TẤT
                          </div>
                          <div className="text-xs text-slate-300 space-y-0.5">
                            {docData.actualDepartureTime && (
                              <div>Giờ ra thực tế: <b>{new Date(docData.actualDepartureTime).toLocaleTimeString('vi-VN')}</b></div>
                            )}
                            {docData.actualReturnTime && (
                              <div>Giờ vào thực tế: <b>{new Date(docData.actualReturnTime).toLocaleTimeString('vi-VN')}</b></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DETAILS: ATTENDANCE CONFIRM */}
              {docType === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>CHI TIẾT PHIẾU XÁC NHẬN CÔNG</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Sự cố chấm công:</span>
                        <span className="font-bold text-amber-300 text-sm">
                          {(ISSUE_TYPE_LABELS as any)[docData.issueType]?.text || docData.issueType}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Ngày & Ca làm việc:</span>
                          <span className="font-semibold text-slate-200">
                            {formatDate(docData.date)} ({docData.shift})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Giờ đăng ký:</span>
                          <span className="font-semibold text-blue-400 font-mono">
                            {docData.checkInTime} &rarr; {docData.checkOutTime}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 text-[11px] block">Lý do giải trình:</span>
                        <span className="font-medium text-slate-300">
                          {docData.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* STEP 1: SECURITY CHECK */}
                  {Array.isArray(docData.steps) && docData.steps[0] && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-amber-600/70 space-y-3.5">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Bước 1: Bảo vệ cổng xác nhận vào/ra thực tế</span>
                        </div>
                        {docData.steps[0].status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] lowercase font-semibold">
                            ✓ đã chuyển duyệt
                          </span>
                        )}
                      </div>

                      {/* Hiển thị thời gian thực tế đã ghi nhận */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 text-[11px] block">Thời gian vào thực tế:</span>
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            {docData.actualCheckIn ? `✓ ${docData.actualCheckIn}` : 'Chưa ghi nhận'}
                          </span>
                          {docData.actualCheckInGuard && (
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              Bảo vệ: {docData.actualCheckInGuard}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 text-[11px] block">Thời gian ra thực tế:</span>
                          <span className="font-mono font-bold text-sm text-blue-400">
                            {docData.actualCheckOut ? `✓ ${docData.actualCheckOut}` : 'Chưa ghi nhận'}
                          </span>
                          {docData.actualCheckOutGuard && (
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              Bảo vệ: {docData.actualCheckOutGuard}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                            Tên bảo vệ xác nhận: *
                          </label>
                          <select
                            value={guardName}
                            onChange={(e) => setGuardName(e.target.value)}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                          >
                            {SECURITY_GUARDS.map((guard) => (
                              <option key={guard} value={guard}>
                                {guard}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                            Ghi chú kiểm tra:
                          </label>
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                            placeholder="Đã kiểm tra vào/ra thực tế qua quét mã"
                          />
                        </div>
                      </div>

                      {/* 2 nút theo yêu cầu của người dùng */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAttendanceAction('check_in')}
                          disabled={isSubmitting}
                          className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 shrink-0" />
                          <span>{isSubmitting ? 'ĐANG LƯU...' : 'Xác nhận thời gian vào'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceAction('check_out')}
                          disabled={isSubmitting}
                          className="py-3.5 px-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-950 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>{isSubmitting ? 'ĐANG LƯU...' : 'Xác nhận thời gian ra'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 p-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500 space-y-1">
          <div>Hệ thống Cổng Thông Tin Long Khai Portal &bull; Phiên bản bảo mật 2026</div>
        </div>
      </div>

      {/* POPUP RESULT DIALOG */}
      {resultModal && resultModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              resultModal.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {resultModal.success ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                {resultModal.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {resultModal.message}
              </p>
            </div>

            <button
              onClick={() => setResultModal(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Hoàn tất & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ScanConfirmContent />
    </Suspense>
  );
}
