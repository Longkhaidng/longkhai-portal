'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { OvertimeItem, checkEmployeeEditDeadline, computeHoursBetween } from '@/types/overtime';
import { X, Clock, CheckCircle2, XCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface OvertimeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OvertimeItem | null;
  registrationId: string;
  registrationDate: string;
  currentUser: User | null;
  onConfirm: (
    registrationId: string,
    itemId: string,
    confirmData: {
      confirmHours: number;
      confirmTime: string;
      status: 'confirmed' | 'rejected';
      note?: string;
    }
  ) => void;
}

export function OvertimeConfirmModal({
  isOpen,
  onClose,
  item,
  registrationId,
  registrationDate,
  currentUser,
  onConfirm,
}: OvertimeConfirmModalProps) {
  const [confirmFrom, setConfirmFrom] = useState<string>('');
  const [confirmTo, setConfirmTo] = useState<string>('');
  const [confirmHours, setConfirmHours] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  // Check 15:00 deadline rule
  const deadlineCheck = checkEmployeeEditDeadline(registrationDate);

  useEffect(() => {
    if (item) {
      const initialFrom = item.employeeConfirmTime
        ? item.employeeConfirmTime.split('-')[0]?.trim()
        : item.fromTime;
      const initialTo = item.employeeConfirmTime
        ? item.employeeConfirmTime.split('-')[1]?.trim()
        : item.toTime;
      const initialHours =
        item.employeeConfirmHours !== undefined ? item.employeeConfirmHours : item.hours;

      setConfirmFrom(initialFrom || '16:30');
      setConfirmTo(initialTo || '18:00');
      setConfirmHours(initialHours || 1.5);
      setNote(item.employeeConfirmNote || '');
    }
  }, [item]);

  // Recalculate hours when from/to change
  const handleFromChange = (newFrom: string) => {
    setConfirmFrom(newFrom);
    if (newFrom && confirmTo) {
      setConfirmHours(computeHoursBetween(newFrom, confirmTo));
    }
  };

  const handleToChange = (newTo: string) => {
    setConfirmTo(newTo);
    if (confirmFrom && newTo) {
      setConfirmHours(computeHoursBetween(confirmFrom, newTo));
    }
  };

  const handleHoursChange = (newHours: number) => {
    setConfirmHours(newHours);
    // Adjust to time if from time exists
    if (confirmFrom && newHours > 0) {
      const [h, m] = confirmFrom.split(':').map(Number);
      const totalMinutes = h * 60 + m + Math.round(newHours * 60);
      const endH = Math.floor((totalMinutes % (24 * 60)) / 60);
      const endM = totalMinutes % 60;
      setConfirmTo(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
    }
  };

  if (!isOpen || !item) return null;

  const isMyRecord = currentUser?.id === item.employeeId;
  const canEdit = deadlineCheck.isEditable;

  const handleSubmitConfirm = (status: 'confirmed' | 'rejected') => {
    if (!canEdit) {
      alert(`Đã quá 15:00 của ngày đăng ký tăng ca (${formatDate(registrationDate)}). Không thể chỉnh sửa!`);
      return;
    }

    const timeString = `${confirmFrom} - ${confirmTo}`;
    onConfirm(registrationId, item.id, {
      confirmHours,
      confirmTime: timeString,
      status,
      note: note.trim() || (status === 'confirmed' ? 'Người lao động đã xác nhận đồng ý' : 'Người lao động từ chối tăng ca'),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Xác Nhận & Điều Chỉnh Thời Gian Tăng Ca
              </h3>
              <p className="text-[11px] text-blue-100/90">
                Nhân viên xác nhận thời gian làm thêm giờ thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-200 overflow-y-auto max-h-[80vh]">
          {/* Employee & Registration Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.employeeName}
                </span>
                <span className="ml-2 font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                  MSNV: {item.employeeId}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {item.team || item.department}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-400">
              <div>
                Ngày đăng ký: <b className="text-slate-800 dark:text-slate-200">{formatDate(registrationDate)}</b>
              </div>
              <div>
                Ca làm việc: <b className="text-slate-800 dark:text-slate-200">{item.shift}</b>
              </div>
              <div>
                Lý do tăng ca: <b className="text-slate-800 dark:text-slate-200">{item.customReason || item.reasonType}</b>
              </div>
              <div>
                Món ăn giữa ca: <b className="text-emerald-600">{item.mealOption || 'Không áp dụng'}</b>
              </div>
            </div>
          </div>

          {/* Initial agreed time vs Actual confirmed time */}
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-950 dark:text-blue-300">
                1. Thời gian thỏa thuận ban đầu:
              </span>
              <span className="font-mono font-bold text-xs px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200">
                {item.fromTime} &rarr; {item.toTime} ({item.hours} giờ)
              </span>
            </div>

            <div className="pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-950 dark:text-blue-300">
                  2. Giờ xác nhận của người lao động:
                </span>
                {!canEdit && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Đã quá 15:00 &bull; Khóa chỉnh sửa
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Số giờ xác nhận: *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    disabled={!canEdit}
                    value={confirmHours}
                    onChange={(e) => handleHoursChange(parseFloat(e.target.value) || 0)}
                    className="w-full font-bold text-sm px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-300 rounded-xl disabled:bg-slate-100 disabled:opacity-60 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Từ giờ:</span>
                  </label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={confirmFrom}
                    onChange={(e) => handleFromChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl disabled:bg-slate-100 disabled:opacity-60 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Đến giờ:</span>
                  </label>
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={confirmTo}
                    onChange={(e) => handleToChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-xl disabled:bg-slate-100 disabled:opacity-60 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quy định thời hạn 15h00 Banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2 text-[11px] leading-relaxed ${
              canEdit
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 text-amber-900 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <div className="font-bold">Quy định chỉnh sửa thời gian tăng ca:</div>
              <div>
                Tất cả người lao động đều có quyền xem và chỉnh sửa thời gian tăng ca của mình sau khi tổ trưởng đã đăng ký.
                Người lao động chỉ có thể chỉnh sửa được <b>trước 15h00 của ngày đã đăng ký tăng ca</b> ({deadlineCheck.deadlineText}).
              </div>
              {!canEdit && (
                <div className="font-bold text-rose-700 dark:text-rose-400 mt-1">
                  &bull; Hiện tại đã qua thời hạn 15:00. Bạn không thể điều chỉnh thời gian được nữa.
                </div>
              )}
            </div>
          </div>

          {/* Ghi chú của nhân viên */}
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Ghi chú / Lý do điều chỉnh của người lao động:
            </label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc lý do nếu có thay đổi so với thỏa thuận ban đầu..."
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs disabled:opacity-60"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
          >
            Đóng
          </button>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitConfirm('rejected')}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Từ chối tăng ca</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitConfirm('confirmed')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận đồng ý ({confirmHours}h)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
