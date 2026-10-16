'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  AttendanceConfirm,
  AttendanceIssueType,
  ISSUE_TYPE_LABELS,
  AttendanceStatus,
} from '@/types/attendance';
import { ApprovalStep } from '@/types/leave';
import {
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Printer,
  ShieldCheck,
  User,
  CreditCard,
  Building,
} from 'lucide-react';
import { formatDate, generateDocId } from '@/lib/utils';

export function AttendanceView() {
  const { currentUser } = useAuth();
  const [attendances, setAttendances] = useState<AttendanceConfirm[]>(() =>
    storage.getAttendanceConfirms()
  );
  const [search, setSearch] = useState('');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AttendanceConfirm | null>(null);

  // Form states
  const [issueType, setIssueType] = useState<AttendanceIssueType>('quen_the');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('07:30');
  const [checkOutTime, setCheckOutTime] = useState('16:30');
  const [shift, setShift] = useState('Ca Hành chính (07:30 - 16:30)');
  const [reason, setReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  // Handle submit form
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const docId = generateDocId('ATT', attendances.length);
    const steps: ApprovalStep[] = [];

    // Luồng duyệt:
    // Nếu mất thẻ: Nhân viên → Bảo vệ → Trưởng bộ phận → Kế toán → IT → Hoàn thành
    // Quên thẻ / Thẻ hỏng: Nhân viên → Bảo vệ → Trưởng bộ phận → IT → Hoàn thành
    steps.push({
      stepName: 'Bảo vệ cổng xác nhận vào/ra thực tế',
      roleRequired: 'security',
      approverName: 'Tổ trưởng / Nhân viên Bảo vệ Cổng',
      status: 'pending',
    });

    steps.push({
      stepName: 'Trưởng bộ phận phê duyệt giải trình',
      roleRequired: 'manager',
      approverName: 'Quản lý / Trưởng bộ phận',
      status: 'pending',
    });

    if (issueType === 'mat_the') {
      steps.push({
        stepName: 'Kế toán ghi nhận trừ phí phôi thẻ',
        roleRequired: 'accountant',
        approverName: 'Bộ phận Kế toán Tiền lương',
        status: 'pending',
      });
    }

    steps.push({
      stepName: issueType === 'mat_the' ? 'IT cấp phôi thẻ mới' : 'IT cập nhật dữ liệu máy chấm công',
      roleRequired: 'it',
      approverName: 'Bộ phận CNTT (IT)',
      status: 'pending',
    });

    const newConfirm: AttendanceConfirm = {
      id: docId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      issueType,
      date,
      checkInTime,
      checkOutTime,
      shift,
      reason,
      status: 'pending',
      currentStepIndex: 0,
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveAttendanceConfirm(newConfirm, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setShowCreateModal(false);
    setReason('');
  };

  // Check if current user can approve current step
  const canApprove = (att: AttendanceConfirm): boolean => {
    if (!currentUser || att.status !== 'pending') return false;
    if (currentUser.role === 'admin') return true;

    const currentStep = att.steps[att.currentStepIndex];
    if (!currentStep || currentStep.status !== 'pending') return false;

    return currentUser.role === currentStep.roleRequired;
  };

  // Approve action
  const handleApprove = () => {
    if (!selectedItem || !currentUser) return;
    const updated = { ...selectedItem };
    const step = updated.steps[updated.currentStepIndex];

    step.status = 'approved';
    step.approverId = currentUser.id;
    step.approverName = currentUser.name;
    step.comment = approvalComment || 'Đã xác nhận kiểm tra hợp lệ';
    step.actionAt = new Date().toISOString();

    if (updated.currentStepIndex + 1 < updated.steps.length) {
      updated.currentStepIndex += 1;
    } else {
      updated.status = 'approved';
    }

    updated.updatedAt = new Date().toISOString();
    storage.saveAttendanceConfirm(updated, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setSelectedItem(updated);
    setApprovalComment('');
  };

  // Reject action
  const handleReject = () => {
    if (!selectedItem || !currentUser) return;
    const reasonText = prompt('Nhập lý do từ chối:');
    if (!reasonText) return;

    const updated = { ...selectedItem };
    const step = updated.steps[updated.currentStepIndex];

    step.status = 'rejected';
    step.approverId = currentUser.id;
    step.approverName = currentUser.name;
    step.comment = reasonText;
    step.actionAt = new Date().toISOString();

    updated.status = 'rejected';
    updated.updatedAt = new Date().toISOString();

    storage.saveAttendanceConfirm(updated, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setSelectedItem(updated);
  };

  // Filter
  const filtered = attendances.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());
    const matchesIssue = issueFilter === 'all' || item.issueType === issueFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesIssue && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Phiếu Xác Nhận Công Vào - Ra
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Giải quyết các trường hợp quên thẻ, thẻ hỏng, mất thẻ với luồng phê duyệt tự động
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu xác nhận công</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên NV, mã NV, phòng ban..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả lý do</option>
            <option value="mat_the">Mất thẻ nhân viên</option>
            <option value="quen_the">Quên mang thẻ</option>
            <option value="the_hong">Thẻ hỏng / Không quét được</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="approved">Đã hoàn thành</option>
            <option value="rejected">Bị từ chối</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã phiếu</th>
                <th className="py-3.5 px-4">Nhân viên</th>
                <th className="py-3.5 px-4">Lý do phát sinh</th>
                <th className="py-3.5 px-4">Ngày & Giờ vào/ra</th>
                <th className="py-3.5 px-4">Tiến trình duyệt</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy phiếu xác nhận công nào.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {item.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.employeeId} &bull; {item.department}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          ISSUE_TYPE_LABELS[item.issueType]?.badge
                        }`}
                      >
                        {ISSUE_TYPE_LABELS[item.issueType]?.text}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Ngày {formatDate(item.date)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Vào: <b>{item.checkInTime}</b> &bull; Ra: <b>{item.checkOutTime}</b>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {item.status === 'approved' ? (
                          <span className="text-emerald-600 font-bold">Hoàn tất quy trình</span>
                        ) : item.status === 'rejected' ? (
                          <span className="text-rose-600 font-bold">Bị từ chối</span>
                        ) : (
                          <span>
                            {item.steps[item.currentStepIndex]?.stepName || 'Đang chờ duyệt'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {item.steps.map((st, i) => (
                          <div
                            key={i}
                            className={`w-4 h-1.5 rounded-full ${
                              st.status === 'approved'
                                ? 'bg-emerald-500'
                                : st.status === 'rejected'
                                ? 'bg-rose-500'
                                : i === item.currentStepIndex
                                ? 'bg-amber-500 animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            title={`${st.stepName}: ${st.status}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Chờ duyệt ({item.currentStepIndex + 1}/{item.steps.length})
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Đã duyệt
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Từ chối
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline">
                        Xem chi tiết &rarr;
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create Attendance */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tạo Phiếu Xác Nhận Công Vào - Ra
                </h3>
                <p className="text-xs text-slate-500">
                  Người làm đơn: <b>{currentUser?.name}</b> ({currentUser?.id} - {currentUser?.department})
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trường hợp phát sinh:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueType('quen_the')}
                    className={`py-2 px-2 text-center rounded-xl border font-semibold transition-all ${
                      issueType === 'quen_the'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Quên mang thẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueType('the_hong')}
                    className={`py-2 px-2 text-center rounded-xl border font-semibold transition-all ${
                      issueType === 'the_hong'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Thẻ hỏng / lỗi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueType('mat_the')}
                    className={`py-2 px-2 text-center rounded-xl border font-semibold transition-all ${
                      issueType === 'mat_the'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Mất thẻ nhân viên
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ngày làm việc cần xác nhận:
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giờ vào thực tế:
                  </label>
                  <input
                    type="time"
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Giờ ra thực tế:
                  </label>
                  <input
                    type="time"
                    required
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ca làm việc:
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Ca Hành chính (07:30 - 16:30)">Ca Hành chính (07:30 - 16:30)</option>
                  <option value="Ca 1 (06:00 - 14:00)">Ca 1 (06:00 - 14:00)</option>
                  <option value="Ca 2 (14:00 - 22:00)">Ca 2 (14:00 - 22:00)</option>
                  <option value="Ca 3 (22:00 - 06:00)">Ca 3 (22:00 - 06:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung giải trình:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do tại sao không quét được thẻ..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Workflow notification */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                <span className="font-bold">Quy trình duyệt: </span>
                {issueType === 'mat_the' ? (
                  <span>Nhân viên &rarr; Bảo vệ &rarr; Trưởng bộ phận &rarr; Kế toán &rarr; IT &rarr; Hoàn thành.</span>
                ) : (
                  <span>Nhân viên &rarr; Bảo vệ &rarr; Trưởng bộ phận &rarr; IT &rarr; Hoàn thành.</span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md"
                >
                  Nộp phiếu xác nhận công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View and Approve */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {selectedItem.id}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Phiếu Xác Nhận Công Vào - Ra
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="In phiếu"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nhân viên:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedItem.employeeName} ({selectedItem.employeeId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phòng ban:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedItem.department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trường hợp:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {ISSUE_TYPE_LABELS[selectedItem.issueType]?.text}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ngày & Ca:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {formatDate(selectedItem.date)} ({selectedItem.shift})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Giờ vào - Giờ ra:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {selectedItem.checkInTime} &rarr; {selectedItem.checkOutTime}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Nội dung giải trình:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedItem.reason}
                </span>
              </div>
            </div>

            {/* Workflow Steps */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Tiến trình duyệt hồ sơ ({selectedItem.steps.length} bước):
              </h4>
              <div className="space-y-2">
                {selectedItem.steps.map((st, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      st.status === 'approved'
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                        : st.status === 'rejected'
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                        : i === selectedItem.currentStepIndex
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span>Bước {i + 1}: {st.stepName}</span>
                        {st.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {st.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-600" />}
                      </div>
                      <div className="text-[11px] mt-0.5">
                        Người duyệt: <b>{st.approverName}</b> {st.comment && ` - "${st.comment}"`}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase">
                      {st.status === 'approved' ? 'Đã duyệt' : st.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approver Action Panel */}
            {canApprove(selectedItem) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác nhận duyệt bước này ({selectedItem.steps[selectedItem.currentStepIndex]?.stepName}):</span>
                </div>

                <input
                  type="text"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Ghi chú xác nhận / kiểm tra..."
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-slate-900 dark:text-white"
                />

                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    ✓ Xác nhận & Chuyển bước tiếp theo
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    ✕ Từ chối
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
