'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { LeaveRequest } from '@/types/leave';
import { GatePass } from '@/types/gatePass';
import { AttendanceConfirm, ISSUE_TYPE_LABELS } from '@/types/attendance';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Building2,
  User as UserIcon,
  AlertTriangle,
  ArrowRight,
  Package,
  ShieldCheck,
  FileText,
} from 'lucide-react';

function QuickApprovalContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as 'leave' | 'gate_pass' | 'attendance' | null;
  const id = searchParams.get('id');
  const initialAction = searchParams.get('action') as 'approve' | 'reject' | null;

  const [action, setAction] = useState<'approve' | 'reject'>(initialAction === 'reject' ? 'reject' : 'approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('Đồng ý phê duyệt');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [attendance, setAttendance] = useState<AttendanceConfirm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !type) {
      setLoading(false);
      return;
    }

    if (type === 'leave') {
      const all = storage.getLeaveRequests();
      const found = all.find((l) => l.id.toUpperCase() === id.toUpperCase());
      setLeave(found || null);
    } else if (type === 'gate_pass') {
      const all = storage.getGatePasses();
      const found = all.find((g) => g.id.toUpperCase() === id.toUpperCase());
      setGatePass(found || null);
    } else if (type === 'attendance') {
      const all = storage.getAttendanceConfirms();
      const found = all.find((a) => a.id.toUpperCase() === id.toUpperCase());
      setAttendance(found || null);
    }
    setLoading(false);
  }, [id, type]);

  // Handle Approve
  const handleApprove = () => {
    setSubmitError(null);
    const now = new Date().toISOString();

    if (type === 'leave' && leave) {
      const updated: LeaveRequest = { ...leave };
      const step = updated.steps[updated.currentStepIndex];
      if (step) {
        step.status = 'approved';
        step.approverName = 'Trưởng bộ phận (Phê duyệt qua Email)';
        step.comment = approvalNote.trim() || 'Đồng ý phê duyệt';
        step.actionAt = now;
      }
      if (updated.currentStepIndex + 1 < updated.steps.length) {
        updated.currentStepIndex += 1;
      } else {
        updated.status = 'approved';
      }
      updated.updatedAt = now;

      storage.saveLeaveRequest(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setLeave(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✓ Đã phê duyệt Đơn xin nghỉ phép ${updated.id} thành công!`);
    } else if (type === 'gate_pass' && gatePass) {
      const updated: GatePass = {
        ...gatePass,
        status: 'approved',
        managerApproverName: 'Trưởng bộ phận (Phê duyệt qua Email)',
        managerApprovedAt: now,
        updatedAt: now,
      };

      storage.saveGatePass(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setGatePass(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✓ Đã phê duyệt Phiếu ra - vào cổng ${updated.id} thành công!`);
    } else if (type === 'attendance' && attendance) {
      const updated: AttendanceConfirm = { ...attendance };
      const step = updated.steps[updated.currentStepIndex];
      if (step) {
        step.status = 'approved';
        step.approverName = 'Trưởng bộ phận (Phê duyệt qua Email)';
        step.comment = approvalNote.trim() || 'Đồng ý phê duyệt';
        step.actionAt = now;
      }
      if (updated.currentStepIndex + 1 < updated.steps.length) {
        updated.currentStepIndex += 1;
      } else {
        updated.status = 'approved';
      }
      updated.updatedAt = now;

      storage.saveAttendanceConfirm(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setAttendance(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✓ Đã phê duyệt Phiếu xác nhận công ${updated.id} thành công!`);
    }
  };

  // Handle Reject
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setSubmitError('Vui lòng nhập lý do từ chối để phản hồi cho nhân viên.');
      return;
    }
    setSubmitError(null);
    const now = new Date().toISOString();

    if (type === 'leave' && leave) {
      const updated: LeaveRequest = { ...leave };
      const step = updated.steps[updated.currentStepIndex];
      if (step) {
        step.status = 'rejected';
        step.approverName = 'Trưởng bộ phận (Từ chối qua Email)';
        step.comment = rejectionReason.trim();
        step.actionAt = now;
      }
      updated.status = 'rejected';
      updated.updatedAt = now;

      storage.saveLeaveRequest(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setLeave(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✕ Đã từ chối Đơn xin nghỉ phép ${updated.id}. Lý do từ chối đã được gửi đến nhân viên.`);
    } else if (type === 'gate_pass' && gatePass) {
      const updated: GatePass = {
        ...gatePass,
        status: 'rejected',
        managerApproverName: 'Trưởng bộ phận (Từ chối qua Email)',
        managerApprovedAt: now,
        rejectionReason: rejectionReason.trim(),
        updatedAt: now,
      };

      storage.saveGatePass(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setGatePass(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✕ Đã từ chối Phiếu ra - vào cổng ${updated.id}. Lý do từ chối đã được gửi đến nhân viên.`);
    } else if (type === 'attendance' && attendance) {
      const updated: AttendanceConfirm = { ...attendance };
      const step = updated.steps[updated.currentStepIndex];
      if (step) {
        step.status = 'rejected';
        step.approverName = 'Trưởng bộ phận (Từ chối qua Email)';
        step.comment = rejectionReason.trim();
        step.actionAt = now;
      }
      updated.status = 'rejected';
      updated.updatedAt = now;

      storage.saveAttendanceConfirm(updated, { id: 'MGR_EMAIL', name: 'Trưởng bộ phận' });
      setAttendance(updated);
      setIsSubmitted(true);
      setSubmitMessage(`✕ Đã từ chối Phiếu xác nhận công ${updated.id}. Lý do từ chối đã được gửi đến nhân viên.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const record = type === 'leave' ? leave : type === 'attendance' ? attendance : gatePass;

  if (!record || !id || !type) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-xl border border-slate-200 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy yêu cầu</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hồ sơ mã <b>{id || 'không xác định'}</b> không tìm thấy trên hệ thống hoặc đã được lưu chuyển. Vui lòng đăng nhập Cổng thông tin để tra cứu trực tiếp.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700"
          >
            Về Cổng Thông Tin Long Khai
          </a>
        </div>
      </div>
    );
  }

  const isPending = record.status === 'pending';
  const isApproved = record.status === 'approved' || (type === 'gate_pass' && (record.status === 'departed' || record.status === 'completed'));
  const isRejected = record.status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 px-4 flex flex-col items-center justify-center font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-700 p-6 text-white text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-200 mb-1">
            CÔNG TY CỔ PHẦN CÔNG NGHIỆP LONG KHAI
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            XÉT DUYỆT YÊU CẦU TRỰC TUYẾN
          </h1>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-mono font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>{record.id}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">

          {/* Success Banner if just submitted */}
          {isSubmitted && submitMessage && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed font-semibold ${
              isApproved
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {isApproved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div>{submitMessage}</div>
                <div className="text-[11px] font-normal text-slate-500 mt-1">
                  Dữ liệu đã được cập nhật thành công lên cơ sở dữ liệu hệ thống.
                </div>
              </div>
            </div>
          )}

          {/* Current Status Pill if not pending */}
          {!isPending && !isSubmitted && (
            <div className={`p-4 rounded-2xl text-center text-xs font-bold ${
              isApproved
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {isApproved ? '✓ Yêu cầu này ĐÃ ĐƯỢC PHÊ DUYỆT' : '✕ Yêu cầu này ĐÃ BỊ TỪ CHỐI'}
            </div>
          )}

          {/* Employee & Request Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {record.employeeName.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{record.employeeName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Mã NV: {record.employeeId}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                {type === 'leave' ? 'Nghỉ phép' : type === 'attendance' ? 'Xác nhận công' : 'Ra vào cổng'}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Phòng ban:</span>
                <span className="font-semibold text-slate-800">{record.department}</span>
              </div>

              {type === 'leave' && leave && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Loại nghỉ phép:</span>
                    <span className="font-bold text-blue-700">{leave.leaveType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian nghỉ:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(leave.fromDate)} &rarr; {formatDate(leave.toDate)} ({leave.totalDays} ngày)
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-0.5">Lý do nghỉ:</span>
                    <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium italic">
                      "{leave.reason}"
                    </p>
                  </div>
                  {leave.handoverPerson && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bàn giao công việc:</span>
                      <span className="font-semibold text-slate-800">{leave.handoverPerson}</span>
                    </div>
                  )}
                </>
              )}

              {type === 'attendance' && attendance && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sự cố chấm công:</span>
                    <span className="font-bold text-amber-700">
                      {ISSUE_TYPE_LABELS[attendance.issueType]?.text || attendance.issueType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ngày làm việc:</span>
                    <span className="font-semibold text-slate-800">{formatDate(attendance.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ca làm việc:</span>
                    <span className="font-semibold text-slate-800">{attendance.shift}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Giờ vào - ra thực tế:</span>
                    <span className="font-semibold text-slate-800">
                      Vào: {attendance.checkInTime} - Ra: {attendance.checkOutTime}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-0.5">Lý do giải trình:</span>
                    <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium italic">
                      "{attendance.reason}"
                    </p>
                  </div>
                </>
              )}

              {type === 'gate_pass' && gatePass && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hình thức ra - vào:</span>
                    <span className="font-bold text-blue-700">
                      {gatePass.timeType === 'nghi_dau_gio'
                        ? 'Nghỉ đầu giờ'
                        : gatePass.timeType === 'nghi_cuoi_gio'
                        ? 'Nghỉ cuối giờ'
                        : 'Nghỉ giữa giờ'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phân loại:</span>
                    <span className="font-semibold text-slate-800">
                      {gatePass.reasonCategory === 'cong_ty'
                        ? 'Việc công ty'
                        : gatePass.reasonCategory === 'khac'
                        ? 'Lý do khác'
                        : 'Việc cá nhân'}
                    </span>
                  </div>
                  {gatePass.timeType !== 'nghi_dau_gio' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thời gian ra dự kiến:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(gatePass.estimatedDepartureTime)}</span>
                    </div>
                  )}
                  {gatePass.timeType !== 'nghi_cuoi_gio' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thời gian vào dự kiến:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(gatePass.estimatedReturnTime)}</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-slate-400 block mb-0.5">Lý do cụ thể:</span>
                    <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 font-medium italic">
                      "{gatePass.purpose}"
                    </p>
                  </div>
                  {gatePass.hasAssets && (
                    <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 font-semibold">
                      <Package className="w-3.5 h-3.5" />
                      <span>Mang theo {gatePass.assets.length} món tài sản ra cổng</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Tabs & Forms (When Still Pending) */}
          {isPending && !isSubmitted && (
            <div className="space-y-4 pt-1">
              
              {/* Switch Action Tab Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAction('approve');
                    setSubmitError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    action === 'approve'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Duyệt Đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAction('reject');
                    setSubmitError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    action === 'reject'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ Chối Đơn</span>
                </button>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Form 1: Approve Form */}
              {action === 'approve' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ghi chú phê duyệt (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="VD: Đồng ý phê duyệt..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>XÁC NHẬN PHÊ DUYỆT ĐƠN NÀY</span>
                  </button>
                </div>
              )}

              {/* Form 2: Reject Form with Required Rejection Reason */}
              {action === 'reject' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-rose-700 mb-1">
                      Lý do từ chối đơn: *
                    </label>
                    <textarea
                      rows={3}
                      required
                      autoFocus
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập rõ lý do tại sao không thể phê duyệt đơn này..."
                      className="w-full p-3 bg-rose-50/50 border border-rose-300 focus:border-rose-500 rounded-xl text-xs text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Nội dung này sẽ được lưu vào lịch sử phê duyệt và thông báo cho nhân viên.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleReject}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>XÁC NHẬN TỪ CHỐI ĐƠN NÀY</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer Back Link */}
          <div className="pt-2 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>Vào Cổng Thông Tin Long Khai Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <QuickApprovalContent />
    </Suspense>
  );
}
