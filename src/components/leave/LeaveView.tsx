'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { LeaveRequest, LeaveType, LEAVE_TYPE_LABELS, ApprovalStep } from '@/types/leave';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ChevronRight,
  User,
  ShieldCheck,
  AlertCircle,
  MinusCircle,
} from 'lucide-react';
import { formatDate, generateDocId } from '@/lib/utils';
import { dispatchApprovalEmail } from '@/lib/email';
import { ToastContainer, useToast } from '@/components/common/Toast';
import { filterUserLeaves, isApproverRole, isSuperAdminOrBOD, isSameDepartment, isEconomicStaff, isAssignedEconomicStaff, DocumentScope } from '@/lib/permissions';

export function LeaveView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => storage.getLeaveRequests());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  const allUsers = useMemo(() => storage.getUsers(), []);

  // Check if current user is Economic Staff or designated to cut meals for any employee
  const isAssignedEconomic = useMemo(() => {
    return isAssignedEconomicStaff(currentUser, allUsers, leaves);
  }, [currentUser, allUsers, leaves]);

  const canManageOthers = isApproverRole(currentUser) || isAssignedEconomic;
  const isBOD = isSuperAdminOrBOD(currentUser);

  // Initialize scopeFilter: approvers and economic staff default to 'all' so they immediately see pending requests
  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() => {
    if (!currentUser) return 'my';
    const users = storage.getUsers();
    const isEco = isAssignedEconomicStaff(currentUser, users);
    return (isApproverRole(currentUser) || isEco) ? 'all' : 'my';
  });

  // Ensure economic staff automatically switches away from 'my' if loaded initially as regular employee
  React.useEffect(() => {
    if (isAssignedEconomic && scopeFilter === 'my' && !isApproverRole(currentUser)) {
      setScopeFilter('all');
    }
  }, [isAssignedEconomic]);

  // Count leaves currently waiting for this economic staff to confirm meal cutting
  const pendingMealCutCount = useMemo(() => {
    if (!currentUser) return 0;
    const uid = currentUser.id.toLowerCase();
    return leaves.filter((l) => {
      if (l.status !== 'pending') return false;
      const currentStep = l.steps[l.currentStepIndex];
      return (
        currentStep?.roleRequired === 'economic' &&
        (currentStep?.approverId?.toLowerCase() === uid || isEconomicStaff(currentUser))
      );
    }).length;
  }, [leaves, currentUser]);

  // Approval action states
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectingModal, setIsRejectingModal] = useState(false);

  // Form states for new Leave Request
  const [leaveType, setLeaveType] = useState<LeaveType>('phep_nam');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [handoverPerson, setHandoverPerson] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Auto calculate days
  const calculatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [fromDate, toDate]);

  // Handle Create Request
  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (calculatedDays <= 0) {
      showToast({
        type: 'warning',
        title: 'Ngày nghỉ không hợp lệ',
        message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc!',
      });
      return;
    }

    const docId = generateDocId('LR', leaves.length);
    const allUsers = storage.getUsers();
    const freshUser = allUsers.find((u) => u.id.toLowerCase() === currentUser.id.toLowerCase()) || currentUser;

    // Check if employee has a Team Leader (Tổ trưởng)
    const teamLeaderId = freshUser.teamLeaderId || currentUser.teamLeaderId;
    const teamLeaderUser = teamLeaderId
      ? allUsers.find((u) => u.id.toLowerCase() === teamLeaderId.toLowerCase())
      : null;

    const targetHeadId = freshUser.departmentHeadId || currentUser.departmentHeadId;
    const deptHeadUser = targetHeadId
      ? allUsers.find((u) => u.id.toLowerCase() === targetHeadId.toLowerCase())
      : null;

    // Build approval steps according to rules:
    // If team leader exists: Nhân viên -> Tổ trưởng -> Trưởng bộ phận -> Hoàn thành.
    // If no team leader: Gửi trực tiếp đến Trưởng bộ phận.
    const steps: ApprovalStep[] = [];

    if (teamLeaderId && teamLeaderUser) {
      steps.push({
        stepName: 'Tổ trưởng phê duyệt',
        roleRequired: 'team_leader',
        approverId: teamLeaderUser.id,
        approverName: teamLeaderUser.name,
        status: 'pending',
      });
    }

    steps.push({
      stepName: 'Trưởng bộ phận phê duyệt',
      roleRequired: 'manager',
      approverId: targetHeadId || deptHeadUser?.id || undefined,
      approverName: deptHeadUser?.name || 'Trưởng phòng / Quản lý',
      status: 'pending',
    });

    // Check if employee has assigned Economic Staff (Nhân viên kinh tế / Phụ trách cắt cơm)
    const economicStaffId = freshUser.economicStaffId || currentUser.economicStaffId;
    const economicUser = economicStaffId
      ? allUsers.find((u) => u.id.toLowerCase() === economicStaffId.toLowerCase())
      : null;

    if (economicStaffId) {
      steps.push({
        stepName: 'Nhân viên kinh tế xác nhận cắt cơm',
        roleRequired: 'economic',
        approverId: economicStaffId,
        approverName: economicUser?.name || 'Nhân viên kinh tế',
        status: 'pending',
      });
    }

    const newRequest: LeaveRequest = {
      id: docId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      leaveType,
      fromDate,
      toDate,
      totalDays: calculatedDays,
      reason,
      handoverPerson: handoverPerson || undefined,
      emergencyContact: emergencyContact || currentUser.phone || undefined,
      status: 'pending',
      currentStepIndex: 0,
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveLeaveRequest(newRequest, { id: currentUser.id, name: currentUser.name });
    setLeaves(storage.getLeaveRequests());
    setShowCreateModal(false);

    // Only dispatch email if employee has explicit departmentHeadEmail configured
    const managerEmail = (freshUser.departmentHeadEmail || currentUser.departmentHeadEmail || '').trim();
    const managerName = deptHeadUser?.name || 'Trưởng bộ phận';

    if (managerEmail) {
      dispatchApprovalEmail({
        toEmail: managerEmail,
        managerName,
        type: 'leave',
        docId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        details: {
          title: 'Chi tiết Đơn Xin Nghỉ Phép',
          items: [
            { label: 'Loại nghỉ phép', value: LEAVE_TYPE_LABELS[leaveType] || leaveType },
            {
              label: 'Thời gian nghỉ',
              value: `${formatDate(fromDate)} đến ${formatDate(toDate)} (${calculatedDays} ngày)`,
            },
            { label: 'Lý do xin nghỉ', value: reason },
            { label: 'Người bàn giao công việc', value: handoverPerson || 'Không có' },
            { label: 'SĐT liên hệ khẩn cấp', value: emergencyContact || currentUser.phone || 'Không có' },
          ],
        },
      }).then((res) => {
        if (res.success) {
          showToast({
            type: 'success',
            title: 'Tạo đơn xin nghỉ phép thành công',
            message: `Đã gửi email thông báo phê duyệt đến Trưởng bộ phận: ${managerEmail}`,
          });
        } else {
          showToast({
            type: 'warning',
            title: `Đã lưu đơn ${docId} thành công`,
            message: `Chưa gửi email tự động được. Bạn có thể bấm nút bên dưới để mở ứng dụng Email/Outlook gửi thông tin cho Trưởng bộ phận (${managerEmail}).`,
            action: res.mailtoUrl
              ? {
                  label: 'Mở Outlook gửi ngay',
                  onClick: () => {
                    window.location.href = res.mailtoUrl!;
                  },
                }
              : undefined,
          });
        }
      }).catch(console.error);
    } else {
      showToast({
        type: 'success',
        title: 'Tạo đơn xin nghỉ phép thành công',
        message: targetHeadId
          ? `Đơn ${docId} đã được chuyển đến Trưởng bộ phận (${managerName} - Mã NV: ${targetHeadId}) phê duyệt trên hệ thống.`
          : `Đơn ${docId} đã được lưu và gửi đến cấp quản lý phê duyệt trên hệ thống.`,
      });
    }

    // Reset fields
    setReason('');
    setHandoverPerson('');
  };

  // Check if current user can approve the current step of this leave request
  // "tiến trình phê duyệt phải được thực hiện trình tự theo từng bước, mỗi người chỉ được phép phê duyệt đúng chức năng của mình"
  const canApprove = (leave: LeaveRequest): boolean => {
    if (!currentUser || leave.status !== 'pending') return false;

    const currentStep = leave.steps[leave.currentStepIndex];
    if (!currentStep || currentStep.status !== 'pending') return false;

    // Sequential step check: All previous steps must be approved
    for (let i = 0; i < leave.currentStepIndex; i++) {
      if (leave.steps[i].status !== 'approved') return false;
    }

    const roleReq = currentStep.roleRequired;

    // 1. Step Tổ trưởng
    if (roleReq === 'team_leader') {
      if (leave.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;
      if (currentStep.approverId && currentStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      return currentUser.role === 'team_leader' && isSameDepartment(leave.department, currentUser.department);
    }

    // 2. Step Trưởng bộ phận
    if (roleReq === 'manager') {
      if (leave.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;
      if (currentStep.approverId && currentStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      if (currentUser.role === 'manager' && isSameDepartment(leave.department, currentUser.department)) {
        return true;
      }
      if (isSuperAdminOrBOD(currentUser)) {
        return true;
      }
      return false;
    }

    // 3. Step Nhân viên kinh tế (Cắt cơm)
    // "để khi các trưởng bộ phận đồng ý cho nhân viên nghỉ phép thì thông tin sẽ được chuyển đến nhân viên kinh tế để cắt cơm"
    if (roleReq === 'economic') {
      if (currentStep.approverId && currentStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      return isEconomicStaff(currentUser);
    }

    return false;
  };

  // Execute Approval
  const handleApproveStep = () => {
    if (!selectedLeave || !currentUser) return;
    if (!canApprove(selectedLeave)) {
      showToast({
        type: 'error',
        title: 'Không thể phê duyệt',
        message: 'Bạn không có quyền phê duyệt đơn này! (Không được tự phê duyệt đơn của chính mình; chỉ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc mới có quyền phê duyệt).',
      });
      return;
    }
    const updated = { ...selectedLeave };
    const currentStep = updated.steps[updated.currentStepIndex];

    currentStep.status = 'approved';
    currentStep.approverId = currentUser.id;
    currentStep.approverName = currentUser.name;
    currentStep.comment = approvalComment || 'Đồng ý phê duyệt';
    currentStep.actionAt = new Date().toISOString();
    currentStep.signature = `${currentUser.name} (${currentUser.id})`;

    const isNext = updated.currentStepIndex + 1 < updated.steps.length;
    if (isNext) {
      updated.currentStepIndex += 1;
      const nextStep = updated.steps[updated.currentStepIndex];

      updated.updatedAt = new Date().toISOString();
      storage.saveLeaveRequest(updated, { id: currentUser.id, name: currentUser.name });
      setLeaves(storage.getLeaveRequests());
      setSelectedLeave(updated);
      setIsApproving(false);
      setApprovalComment('');

      if (nextStep.roleRequired === 'economic') {
        const users = storage.getUsers();
        const economicUser = users.find(
          (u) => u.id.toLowerCase() === nextStep.approverId?.toLowerCase()
        );

        // Dispatch email notification to economic staff if email is configured
        if (economicUser?.email) {
          dispatchApprovalEmail({
            toEmail: economicUser.email,
            managerName: economicUser.name,
            type: 'leave',
            docId: updated.id,
            employeeId: updated.employeeId,
            employeeName: updated.employeeName,
            department: updated.department,
            details: {
              title: 'Thông báo Cắt Cơm: Nhân viên được duyệt nghỉ phép',
              items: [
                { label: 'Nhân viên nghỉ phép', value: `${updated.employeeName} (${updated.employeeId})` },
                { label: 'Phòng ban / Xưởng', value: updated.department },
                { label: 'Thời gian nghỉ', value: `Từ ${formatDate(updated.fromDate)} đến ${formatDate(updated.toDate)} (${updated.totalDays} ngày)` },
                { label: 'Loại nghỉ phép', value: LEAVE_TYPE_LABELS[updated.leaveType] || updated.leaveType },
                { label: 'Lý do nghỉ', value: updated.reason },
                { label: 'Người duyệt (Trưởng BP)', value: `${currentUser.name} (${currentUser.id})` },
                { label: 'Yêu cầu', value: 'Vui lòng kiểm tra và xác nhận cắt cơm trên Cổng Portal Long Khải.' },
              ],
            },
          }).catch(console.error);
        }

        showToast({
          type: 'success',
          title: 'Trưởng bộ phận đã phê duyệt',
          message: economicUser?.email
            ? `Đơn ${updated.id} đã được chuyển và gửi email thông báo cắt cơm đến Nhân viên kinh tế: ${nextStep.approverName} (${economicUser.email}).`
            : `Đơn ${updated.id} đã được chuyển đến Nhân viên kinh tế (${nextStep.approverName} - Mã NV: ${nextStep.approverId}) để cắt cơm trên Cổng Portal.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Đã phê duyệt thành công',
          message: `Đơn ${updated.id} đã chuyển sang bước: ${nextStep.stepName}.`,
        });
      }
    } else {
      updated.status = 'approved';
      updated.updatedAt = new Date().toISOString();
      storage.saveLeaveRequest(updated, { id: currentUser.id, name: currentUser.name });
      setLeaves(storage.getLeaveRequests());
      setSelectedLeave(updated);
      setIsApproving(false);
      setApprovalComment('');

      showToast({
        type: 'success',
        title: 'Đã hoàn tất phê duyệt',
        message: currentStep.roleRequired === 'economic'
          ? `Đã xác nhận cắt cơm thành công cho đơn ${updated.id}. Hồ sơ nghỉ phép hoàn tất.`
          : `Đơn ${updated.id} đã được phê duyệt hoàn tất.`,
      });
    }
  };

  // Execute Rejection
  const handleRejectStep = () => {
    if (!selectedLeave || !currentUser) return;
    if (!canApprove(selectedLeave)) {
      showToast({
        type: 'error',
        title: 'Không thể từ chối',
        message: 'Bạn không có quyền từ chối đơn này! (Chỉ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc mới có quyền xử lý).',
      });
      return;
    }
    if (!rejectionReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Thiếu lý do từ chối',
        message: 'Vui lòng nhập lý do từ chối!',
      });
      return;
    }

    const updated = { ...selectedLeave };
    const currentStep = updated.steps[updated.currentStepIndex];

    currentStep.status = 'rejected';
    currentStep.approverId = currentUser.id;
    currentStep.approverName = currentUser.name;
    currentStep.comment = rejectionReason;
    currentStep.actionAt = new Date().toISOString();

    // Skip all remaining subsequent steps (e.g. Nhân viên kinh tế xác nhận cắt cơm)
    for (let k = updated.currentStepIndex + 1; k < updated.steps.length; k++) {
      updated.steps[k].status = 'skipped';
      updated.steps[k].comment = updated.steps[k].roleRequired === 'economic'
        ? 'Bỏ qua (Đơn đã bị từ chối, không cần cắt cơm)'
        : 'Bỏ qua (Đơn đã bị từ chối ở bước trước)';
    }

    updated.status = 'rejected';
    updated.updatedAt = new Date().toISOString();

    storage.saveLeaveRequest(updated, { id: currentUser.id, name: currentUser.name });
    setLeaves(storage.getLeaveRequests());
    setSelectedLeave(updated);
    setRejectionReason('');
    showToast({
      type: 'info',
      title: 'Đã từ chối đơn',
      message: `Đơn ${updated.id} đã bị từ chối. Bước cắt cơm của nhân viên kinh tế được bỏ qua.`,
    });
  };

  // Filter list strictly based on user permissions
  const userVisibleLeaves = useMemo(() => {
    return filterUserLeaves(leaves, currentUser, scopeFilter, allUsers);
  }, [leaves, currentUser, scopeFilter]);

  const filteredLeaves = userVisibleLeaves.filter((item) => {
    const matchesSearch =
      item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      item.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Quản Lý Đơn Xin Nghỉ Phép
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAssignedEconomic && !isApproverRole(currentUser)
              ? `Tiếp nhận và theo dõi thông tin đơn xin nghỉ phép của nhân viên để thực hiện cắt cơm (${currentUser?.name || ''})`
              : !canManageOthers
              ? `Chỉ hiển thị các đơn xin nghỉ phép của bạn (${currentUser?.name || ''})`
              : isBOD
              ? 'Quản lý và phê duyệt toàn bộ đơn xin nghỉ phép toàn công ty'
              : `Quản lý đơn xin nghỉ phép của nhân viên bộ phận ${currentUser?.department || ''}`}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo đơn xin nghỉ phép</span>
        </button>
      </div>

      {/* Notification banner for Economic Staff when there are pending meal-cut requests */}
      {isAssignedEconomic && pendingMealCutCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-base">
              🔔
            </span>
            <div>
              <span className="font-bold text-sm">Thông báo cắt cơm mới: </span>
              <span>Có <b>{pendingMealCutCount} đơn xin nghỉ phép</b> đã được Trưởng bộ phận phê duyệt đang chờ bạn xác nhận cắt cơm!</span>
            </div>
          </div>
          <button
            onClick={() => setScopeFilter('approver')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs transition-all"
          >
            Xem đơn chờ cắt cơm ({pendingMealCutCount}) &rarr;
          </button>
        </div>
      )}

      {/* Scope Switcher for Approvers / Managers / Economic Staff */}
      {canManageOthers && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isAssignedEconomic && !isApproverRole(currentUser)
              ? 'Tất cả đơn cắt cơm'
              : isBOD
              ? 'Tất cả đơn toàn công ty'
              : `Đơn nhân viên ${currentUser?.department || 'bộ phận'}`}
          </button>
          <button
            onClick={() => setScopeFilter('approver')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              scopeFilter === 'approver'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>{isAssignedEconomic && !isApproverRole(currentUser) ? 'Chờ xác nhận cắt cơm' : 'Đơn cần tôi duyệt'}</span>
            {pendingMealCutCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-extrabold">
                {pendingMealCutCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setScopeFilter('my')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'my'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Đơn của tôi
          </button>
        </div>
      )}

      {/* Filter and search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên nhân viên, mã NV, phòng ban..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ phê duyệt</option>
            <option value="approved">Đã duyệt hoàn thành</option>
            <option value="rejected">Bị từ chối</option>
          </select>
        </div>
      </div>

      {/* Table of Leave Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã đơn</th>
                <th className="py-3.5 px-4">Nhân viên</th>
                <th className="py-3.5 px-4">Loại phép</th>
                <th className="py-3.5 px-4">Thời gian nghỉ</th>
                <th className="py-3.5 px-4">Tiến trình duyệt</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn nghỉ phép nào.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedLeave(l)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {l.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {l.employeeId} &bull; {l.department}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {LEAVE_TYPE_LABELS[l.leaveType]}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {l.totalDays} ngày
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(l.fromDate)} → {formatDate(l.toDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {l.status === 'approved' ? (
                          <span className="text-emerald-600 font-bold">Hoàn tất phê duyệt</span>
                        ) : l.status === 'rejected' ? (
                          <span className="text-rose-600 font-bold">Đã bị từ chối</span>
                        ) : (
                          <span>
                            {l.steps[l.currentStepIndex]?.stepName || 'Đang xử lý'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {l.steps.map((st, i) => (
                          <div
                            key={i}
                            className={`w-5 h-1.5 rounded-full ${
                              st.status === 'approved'
                                ? 'bg-emerald-500'
                                : st.status === 'rejected'
                                ? 'bg-rose-500'
                                : i === l.currentStepIndex
                                ? 'bg-blue-600 animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            title={`${st.stepName}: ${st.status}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {l.status === 'pending' && (
                        l.steps[l.currentStepIndex]?.roleRequired === 'economic' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Chờ cắt cơm
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Chờ duyệt
                          </span>
                        )
                      )}
                      {l.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Đã duyệt
                        </span>
                      )}
                      {l.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Từ chối
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs hover:underline">
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

      {/* MODAL: Create Leave Request */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tạo Đơn Xin Nghỉ Phép Mới
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

            <form onSubmit={handleCreateLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Loại nghỉ phép:
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  {Object.entries(LEAVE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                <span className="font-semibold text-blue-900 dark:text-blue-300">
                  Tổng số ngày nghỉ tính toán:
                </span>
                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                  {calculatedDays > 0 ? `${calculatedDays} ngày` : 'Ngày không hợp lệ'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do xin nghỉ phép:
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ghi rõ lý do xin nghỉ..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Người bàn giao công việc:
                  </label>
                  <input
                    type="text"
                    value={handoverPerson}
                    onChange={(e) => setHandoverPerson(e.target.value)}
                    placeholder="Họ tên người thay thế..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại liên lạc:
                  </label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="SĐT khẩn cấp khi nghỉ..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Luồng phê duyệt tự động của đơn này:
                </div>
                <div>
                  {currentUser?.teamLeaderId ? (
                    <span>
                      1. Tổ trưởng (Mã: <b>{currentUser.teamLeaderId}</b>) &rarr; 2. Trưởng bộ phận {currentUser?.economicStaffId ? `→ 3. Nhân viên kinh tế (${currentUser.economicStaffId}) cắt cơm` : ''} &rarr; Hoàn thành.
                    </span>
                  ) : (
                    <span>
                      1. Trưởng bộ phận {currentUser?.economicStaffId ? `→ 2. Nhân viên kinh tế (${currentUser.economicStaffId}) cắt cơm` : ''} &rarr; Hoàn thành.
                    </span>
                  )}
                </div>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Nộp đơn nghỉ phép
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View Details & Approval Action */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                  {selectedLeave.id}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Đơn Xin Nghỉ Phép: {LEAVE_TYPE_LABELS[selectedLeave.leaveType]}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="In đơn nghỉ phép"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedLeave(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Leave Detail Information */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Người làm đơn:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedLeave.employeeName} ({selectedLeave.employeeId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phòng ban:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedLeave.department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời gian nghỉ:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedLeave.totalDays} ngày (Từ {formatDate(selectedLeave.fromDate)} đến {formatDate(selectedLeave.toDate)})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Người nhận bàn giao:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedLeave.handoverPerson || 'Không có'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Lý do:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedLeave.reason}
                </span>
              </div>
            </div>

            {/* Workflow Progress Steps */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Tiến trình phê duyệt đa cấp:
              </h4>
              <div className="space-y-2">
                {selectedLeave.steps.map((step, idx) => {
                  const isSkipped = step.status === 'skipped' || (selectedLeave.status === 'rejected' && idx > selectedLeave.currentStepIndex);
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        step.status === 'approved'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                          : step.status === 'rejected'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                          : isSkipped
                          ? 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                          : idx === selectedLeave.currentStepIndex
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900/50'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>Bước {idx + 1}: {step.stepName}</span>
                          {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          {step.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-600" />}
                          {isSkipped && <MinusCircle className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isSkipped ? (
                            <span className="italic text-slate-400">
                              Người duyệt: <b>{step.approverName || 'Nhân viên kinh tế'}</b> - (Bỏ qua vì đơn đã bị từ chối ở bước trước, không cần cắt cơm)
                            </span>
                          ) : (
                            <span>
                              Người duyệt: <b>{step.approverName || 'Chờ phân bổ'}</b> {step.comment && ` - Ghi chú: "${step.comment}"`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isSkipped ? 'text-slate-400 bg-slate-200/60 dark:bg-slate-700/50 px-2 py-0.5 rounded-md' : ''}`}>
                        {step.status === 'approved'
                          ? 'Đã duyệt'
                          : step.status === 'rejected'
                          ? 'Từ chối'
                          : isSkipped
                          ? 'Bỏ qua'
                          : 'Chờ xử lý'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar for Approvers */}
            {canApprove(selectedLeave) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bạn có thẩm quyền phê duyệt bước này:</span>
                </div>

                <div>
                  <input
                    type="text"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    placeholder="Nhập ý kiến / Chữ ký điện tử duyệt..."
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {!isRejectingModal ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleApproveStep}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {selectedLeave.steps[selectedLeave.currentStepIndex]?.roleRequired === 'economic'
                          ? '✓ Xác nhận đã cắt cơm'
                          : selectedLeave.currentStepIndex + 1 === selectedLeave.steps.length
                          ? '✓ Phê duyệt & Hoàn tất'
                          : '✓ Phê duyệt & Chuyển bước tiếp'}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsRejectingModal(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>✕ Từ chối đơn</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                      Lý do từ chối đơn: *
                    </label>
                    <textarea
                      rows={2}
                      autoFocus
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Ghi rõ lý do từ chối đơn nghỉ phép..."
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejectingModal(false);
                          setRejectionReason('');
                        }}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleRejectStep();
                          setIsRejectingModal(false);
                        }}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedLeave.status === 'pending' && !canApprove(selectedLeave) && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Bước {selectedLeave.currentStepIndex + 1}: {selectedLeave.steps[selectedLeave.currentStepIndex]?.stepName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedLeave.steps[selectedLeave.currentStepIndex]?.roleRequired === 'economic' ? (
                      <span>Đơn đã được Trưởng bộ phận đồng ý duyệt. Đang chờ Nhân viên kinh tế ({selectedLeave.steps[selectedLeave.currentStepIndex]?.approverName}) xác nhận cắt cơm.</span>
                    ) : selectedLeave.steps[selectedLeave.currentStepIndex]?.roleRequired === 'manager' ? (
                      selectedLeave.employeeId.toLowerCase() === currentUser?.id.toLowerCase() ? (
                        <span>Đang chờ Trưởng bộ phận ({selectedLeave.steps[selectedLeave.currentStepIndex]?.approverName}) phê duyệt. Người làm đơn không được tự phê duyệt đơn của chính mình.</span>
                      ) : (
                        <span>Đang chờ Trưởng bộ phận ({selectedLeave.steps[selectedLeave.currentStepIndex]?.approverName}) xem xét và phê duyệt.</span>
                      )
                    ) : (
                      <span>Đang chờ Tổ trưởng ({selectedLeave.steps[selectedLeave.currentStepIndex]?.approverName}) xem xét và phê duyệt.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
