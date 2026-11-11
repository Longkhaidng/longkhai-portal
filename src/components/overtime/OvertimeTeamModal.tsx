'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/types/user';
import {
  OvertimeItem,
  OvertimeCategory,
  OvertimeDayType,
  OvertimeCompensation,
  OvertimeReasonType,
  OVERTIME_SHIFTS,
  OVERTIME_DAY_TYPE_LABELS,
  OVERTIME_CATEGORY_LABELS,
  OVERTIME_COMPENSATION_LABELS,
  OVERTIME_REASON_LABELS,
  calculateOvertimeTimes,
  OvertimeMealMenu,
  getOvertimeMealOptions,
} from '@/types/overtime';
import { X, Users, Search, CheckCircle2, Clock, Utensils, CheckSquare, Square } from 'lucide-react';

interface OvertimeTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  registrationDate: string;
  mealMenus: OvertimeMealMenu[];
  onApplyTeam: (items: OvertimeItem[]) => void;
}

export function OvertimeTeamModal({
  isOpen,
  onClose,
  users,
  currentUser,
  registrationDate,
  mealMenus,
  onApplyTeam,
}: OvertimeTeamModalProps) {
  // Leader selection state
  const [leaderCode, setLeaderCode] = useState<string>('');
  const [selectedLeader, setSelectedLeader] = useState<User | null>(null);

  // Common settings for team members
  const [shift, setShift] = useState<string>('Ca HC (08:00 - 16:30)');
  const [dayType, setDayType] = useState<OvertimeDayType>('ngay_thuong');
  const [overtimeType, setOvertimeType] = useState<OvertimeCategory>('sau_ca');
  const [hours, setHours] = useState<number>(1.5);
  const [fromTime, setFromTime] = useState<string>('16:30');
  const [toTime, setToTime] = useState<string>('18:00');
  const [reasonType, setReasonType] = useState<OvertimeReasonType>('ke_hoach_sx');
  const [customReason, setCustomReason] = useState<string>('');
  const [compensationType, setCompensationType] = useState<OvertimeCompensation>('tinh_luong');
  const [mealOption, setMealOption] = useState<string>('');

  // Selected members list
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Auto-fill times when shift, overtimeType or hours change
  useEffect(() => {
    const calc = calculateOvertimeTimes(shift, overtimeType, hours);
    setFromTime(calc.fromTime);
    setToTime(calc.toTime);
  }, [shift, overtimeType, hours]);

  // Set default leader when modal opens
  useEffect(() => {
    if (isOpen) {
      // If current user is a team leader or has members reporting to them, default to them
      const isLeader =
        currentUser?.role === 'team_leader' ||
        currentUser?.position?.toLowerCase().includes('tổ trưởng') ||
        users.some((u) => u.teamLeaderId === currentUser?.id);

      if (isLeader && currentUser) {
        setLeaderCode(currentUser.id);
        setSelectedLeader(currentUser);
      } else {
        // Find first known team leader in users list
        const firstTL = users.find(
          (u) =>
            u.role === 'team_leader' ||
            u.position?.toLowerCase().includes('tổ trưởng') ||
            users.some((m) => m.teamLeaderId === u.id)
        );
        if (firstTL) {
          setLeaderCode(firstTL.id);
          setSelectedLeader(firstTL);
        }
      }
    }
  }, [isOpen, currentUser, users]);

  // When leaderCode changes: "người lao động chỉ cần nhập đúng mã số của tổ trưởng thì tên tổ trưởng sẽ hiện lên"
  useEffect(() => {
    if (!leaderCode.trim()) {
      setSelectedLeader(null);
      setSelectedMemberIds(new Set());
      return;
    }
    const found = users.find(
      (u) =>
        u.id.toLowerCase() === leaderCode.trim().toLowerCase() ||
        u.name.toLowerCase() === leaderCode.trim().toLowerCase()
    );
    if (found) {
      setSelectedLeader(found);
    } else {
      setSelectedLeader(null);
    }
  }, [leaderCode, users]);

  // Find team members reporting to selected leader
  const teamMembers = useMemo(() => {
    if (!selectedLeader) return [];
    // Members who have teamLeaderId === leader.id
    const direct = users.filter((u) => u.teamLeaderId === selectedLeader.id);
    if (direct.length > 0) {
      // Include the leader themself if not already in list
      if (!direct.some((d) => d.id === selectedLeader.id)) {
        return [selectedLeader, ...direct];
      }
      return direct;
    }
    // If no direct teamLeaderId set, match by same department and production role
    const byDept = users.filter(
      (u) =>
        u.department === selectedLeader.department &&
        (u.id === selectedLeader.id ||
          u.position?.toLowerCase().includes('công nhân') ||
          u.position?.toLowerCase().includes('thợ') ||
          u.position?.toLowerCase().includes('nhân viên'))
    );
    return byDept.length > 0 ? byDept : [selectedLeader];
  }, [selectedLeader, users]);

  // Select all members by default when team members list changes
  useEffect(() => {
    if (teamMembers.length > 0) {
      setSelectedMemberIds(new Set(teamMembers.map((m) => m.id)));
    } else {
      setSelectedMemberIds(new Set());
    }
  }, [teamMembers]);

  // Set default meal if applicable
  useEffect(() => {
    if (hours < 2) {
      setMealOption('Không áp dụng (< 2h)');
    } else {
      const opts = getOvertimeMealOptions(registrationDate, hours);
      if (!mealOption || mealOption === 'Không áp dụng (< 2h)' || (!opts.includes(mealOption) && mealOption !== 'Tự túc / Không ăn')) {
        setMealOption(opts[0] || 'Tự túc / Không ăn');
      }
    }
  }, [hours, registrationDate, mealOption]);

  const toggleMember = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedMemberIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedMemberIds.size === teamMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(teamMembers.map((m) => m.id)));
    }
  };

  const handleApply = () => {
    if (!selectedLeader) {
      alert('Vui lòng nhập mã số và chọn Tổ trưởng hợp lệ');
      return;
    }
    if (selectedMemberIds.size === 0) {
      alert('Vui lòng chọn ít nhất 1 nhân viên trong tổ');
      return;
    }

    const teamLabel = selectedLeader.position?.includes('Tổ')
      ? `${selectedLeader.position} (${selectedLeader.name})`
      : `Tổ ${selectedLeader.name}`;

    const items: OvertimeItem[] = teamMembers
      .filter((m) => selectedMemberIds.has(m.id))
      .map((m) => ({
        id: `OT-ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeId: m.id,
        employeeName: m.name,
        position: m.position || 'Công nhân',
        team: teamLabel,
        department: m.department || selectedLeader.department,
        shift,
        dayType,
        overtimeType,
        compensationType,
        reasonType,
        customReason: reasonType === 'khac' ? customReason : undefined,
        hours,
        fromTime,
        toTime,
        mealOption: hours < 2 ? 'Không áp dụng (< 2h)' : mealOption || (getOvertimeMealOptions(registrationDate, hours)[0] || 'Tự túc / Không ăn'),
        employeeConfirmTime: `${fromTime} - ${toTime}`,
        employeeConfirmHours: hours,
        employeeConfirmStatus: 'confirmed',
        employeeConfirmedAt: new Date().toISOString(),
        approvalStatus: 'approved',
        approvedByName: currentUser?.name || 'Trưởng bộ phận',
        approvedAt: new Date().toISOString(),
      }));

    onApplyTeam(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Thêm Cả Tổ Vào Danh Sách Đăng Ký Tăng Ca
              </h3>
              <p className="text-[11px] text-blue-100/90">
                Nhập mã số Tổ trưởng để tự động nạp toàn bộ danh sách nhân viên của tổ
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
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs text-slate-700 dark:text-slate-200">
          {/* Step 1: Nhập mã số Tổ trưởng */}
          <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Nhập mã số Tổ trưởng (MSNV): *</span>
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 italic">
                * Chỉ cần nhập đúng MSNV, tên và thông tin Tổ trưởng sẽ tự động hiển thị
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 relative">
                <input
                  type="text"
                  value={leaderCode}
                  onChange={(e) => setLeaderCode(e.target.value)}
                  placeholder="Ví dụ: 1079, 1114, 1403..."
                  className="w-full font-mono font-bold text-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-600 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Quick Select from known leaders */}
              <div className="sm:col-span-7 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Gợi ý nhanh:</span>
                {users
                  .filter(
                    (u) =>
                      u.role === 'team_leader' ||
                      u.position?.toLowerCase().includes('tổ trưởng') ||
                      users.some((m) => m.teamLeaderId === u.id)
                  )
                  .slice(0, 4)
                  .map((tl) => (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={() => setLeaderCode(tl.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        leaderCode === tl.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {tl.name} ({tl.id})
                    </button>
                  ))}
              </div>
            </div>

            {/* Display Leader Result */}
            {selectedLeader ? (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-xs">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {selectedLeader.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700">
                      MSNV: {selectedLeader.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Chức vụ: <b>{selectedLeader.position || 'Tổ trưởng'}</b> &bull; Phòng ban:{' '}
                    <b>{selectedLeader.department}</b> &bull; Sĩ số tổ:{' '}
                    <b className="text-emerald-600">{teamMembers.length} người</b>
                  </div>
                </div>
              </div>
            ) : leaderCode.trim() ? (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200">
                Chưa tìm thấy nhân sự có mã số: <b>{leaderCode}</b>. Vui lòng kiểm tra lại.
              </div>
            ) : null}
          </div>

          {/* Step 2: Cấu hình thông số tăng ca chung cho cả tổ */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Thiết lập thông số tăng ca chung cho cả tổ:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Ca làm việc:
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  {OVERTIME_SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Thời gian làm thêm:
                </label>
                <select
                  value={dayType}
                  onChange={(e) => setDayType(e.target.value as OvertimeDayType)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="ngay_thuong">{OVERTIME_DAY_TYPE_LABELS.ngay_thuong}</option>
                  <option value="ngay_nghi">{OVERTIME_DAY_TYPE_LABELS.ngay_nghi}</option>
                  <option value="ngay_le">{OVERTIME_DAY_TYPE_LABELS.ngay_le}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Loại tăng ca:
                </label>
                <select
                  value={overtimeType}
                  onChange={(e) => setOvertimeType(e.target.value as OvertimeCategory)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="sau_ca">{OVERTIME_CATEGORY_LABELS.sau_ca}</option>
                  <option value="truoc_ca">{OVERTIME_CATEGORY_LABELS.truoc_ca}</option>
                  <option value="khong_theo_ca">{OVERTIME_CATEGORY_LABELS.khong_theo_ca}</option>
                </select>
              </div>
            </div>

            {/* Giờ tăng ca: Cột số giờ nằm đầu tiên, tiếp theo Từ - Đến */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="block font-bold text-blue-700 dark:text-blue-400 mb-1">
                  Số giờ: *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                  className="w-full font-bold text-sm px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-blue-300 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Từ giờ:</span>
                </label>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Đến giờ:</span>
                </label>
                <input
                  type="time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Lý do làm thêm:
                </label>
                <select
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value as OvertimeReasonType)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="ke_hoach_sx">{OVERTIME_REASON_LABELS.ke_hoach_sx}</option>
                  <option value="khac">{OVERTIME_REASON_LABELS.khac}</option>
                </select>
                {reasonType === 'khac' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập lý do cụ thể..."
                    className="mt-1.5 w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Loại bù/lương:
                </label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value as OvertimeCompensation)}
                  className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="tinh_luong">{OVERTIME_COMPENSATION_LABELS.tinh_luong}</option>
                  <option value="nghi_bu">{OVERTIME_COMPENSATION_LABELS.nghi_bu}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-amber-500" />
                  <span>Ăn/uống giữa ca:</span>
                </label>
                {hours < 2 ? (
                  <div className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-400 italic rounded-xl border border-slate-200 text-xs">
                    Không áp dụng (&lt; 2h)
                  </div>
                ) : (
                  <select
                    value={mealOption || 'Tự túc / Không ăn'}
                    onChange={(e) => setMealOption(e.target.value)}
                    className="w-full py-2 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-emerald-700 dark:text-emerald-400"
                  >
                    <option value="Tự túc / Không ăn">Tự túc / Không ăn</option>
                    {getOvertimeMealOptions(registrationDate, hours).map((dish) => (
                      <option key={dish} value={dish}>
                        {dish}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Danh sách nhân viên tổ được chọn */}
          {selectedLeader && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span>Danh sách nhân viên tổ ({teamMembers.length} người):</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    Đã chọn: {selectedMemberIds.size}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  {selectedMemberIds.size === teamMembers.length ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Bỏ chọn tất cả</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Chọn tất cả</span>
                    </>
                  )}
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2.5 w-10 text-center">Chọn</th>
                      <th className="p-2.5 w-24">MSNV</th>
                      <th className="p-2.5">Họ và tên</th>
                      <th className="p-2.5">Chức vụ</th>
                      <th className="p-2.5">Phòng ban</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teamMembers.map((m) => {
                      const isSelected = selectedMemberIds.has(m.id);
                      return (
                        <tr
                          key={m.id}
                          onClick={() => toggleMember(m.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded-md text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-600">{m.id}</td>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {m.name}
                            {m.id === selectedLeader.id && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                                Tổ trưởng
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-600">{m.position || '-'}</td>
                          <td className="p-2.5 text-slate-500">{m.department}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedLeader ? (
              <span>
                Sẽ thêm <b className="text-blue-600">{selectedMemberIds.size}</b> nhân viên tổ{' '}
                <b>{selectedLeader.name}</b> vào bảng đăng ký.
              </span>
            ) : (
              <span>Vui lòng nhập mã số Tổ trưởng để tiếp tục.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedLeader || selectedMemberIds.size === 0}
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Áp dụng vào danh sách ({selectedMemberIds.size} người)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
