'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  RepairProposal,
  RepairProposalStatus,
  RepairStep,
  REPAIR_STATUS_BADGES,
  REPAIR_STATUS_LABELS,
} from '@/types/repair';
import {
  filterUserRepairProposals,
  isApproverRole,
  isSuperAdminOrBOD,
  isMaintenanceStaff,
  DocumentScope,
} from '@/lib/permissions';
import { generateDocId, formatDateTime, formatDate } from '@/lib/utils';
import { dispatchApprovalEmail, dispatchMaintenanceNotificationEmail } from '@/lib/email';
import { ToastContainer, useToast } from '@/components/common/Toast';
import {
  Wrench,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Plus,
  Building,
  MapPin,
  FileText,
  Lightbulb,
  UserCheck,
  Calendar,
  Printer,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';


const capitalizeFirstLetter = (text: string) => {
  if (!text) return text;
  return text
    .split('\n')
    .map((line) => {
      const trimmedIndex = line.search(/\S/);
      if (trimmedIndex === -1) return line;
      return (
        line.slice(0, trimmedIndex) +
        line.charAt(trimmedIndex).toUpperCase() +
        line.slice(trimmedIndex + 1)
      );
    })
    .join('\n');
};

export function RepairProposalView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  const [proposals, setProposals] = useState<RepairProposal[]>(() =>
    storage.getRepairProposals()
  );
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    isApproverRole(currentUser) || isSuperAdminOrBOD(currentUser) || isMaintenanceStaff(currentUser)
      ? 'all'
      : 'my'
  );

  // Form State
  const [department, setDepartment] = useState(() => currentUser?.department || 'Xưởng Sản Xuất 1 (Cơ Khí & CNC)');
  const [location, setLocation] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [modalProposedSolution, setModalProposedSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filter & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal State
  const [selectedProposal, setSelectedProposal] = useState<RepairProposal | null>(null);
  const [managerComment, setManagerComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [creatorFeedback, setCreatorFeedback] = useState('');

  // Storage listener to sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setProposals(storage.getRepairProposals());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update selected proposal if proposals list updates
  useEffect(() => {
    if (selectedProposal) {
      const fresh = proposals.find((p) => p.id === selectedProposal.id);
      if (fresh) setSelectedProposal(fresh);
    }
  }, [proposals]);

  // Sync manager proposal solution on select
  useEffect(() => {
    if (selectedProposal) {
      setModalProposedSolution(selectedProposal.proposedSolution || '');
    } else {
      setModalProposedSolution('');
    }
  }, [selectedProposal]);

  const departments = useMemo(() => storage.getDepartments(), []);
  const allUsers = useMemo(() => storage.getUsers(), []);

  // Check roles
  const isBOD = isSuperAdminOrBOD(currentUser);
  const isManagerOrTL = currentUser?.role === 'manager' || currentUser?.role === 'team_leader';
  const isMaintenance = isMaintenanceStaff(currentUser);
  const canManageOthers = isApproverRole(currentUser) || isMaintenance;

  // Filtered proposals by permissions & scope
  const userVisibleProposals = useMemo(() => {
    return filterUserRepairProposals(proposals, currentUser, scopeFilter);
  }, [proposals, currentUser, scopeFilter]);

  // Count pending for current user
  const pendingCountForUser = useMemo(() => {
    if (!currentUser) return 0;
    const uid = currentUser.id.toLowerCase();
    return userVisibleProposals.filter((p) => {
      if (isManagerOrTL && p.status === 'pending_manager') return true;
      if (isMaintenance && p.status === 'maintenance_pending') return true;
      if (p.employeeId.toLowerCase() === uid && p.status === 'pending_confirmation') return true;
      return false;
    }).length;
  }, [userVisibleProposals, currentUser, isManagerOrTL, isMaintenance]);

  // Final filtered list with search & status
  const filteredProposals = useMemo(() => {
    const q = search.toLowerCase().trim();
    return userVisibleProposals.filter((item) => {
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.issueDescription.toLowerCase().includes(q) ||
        (item.proposedSolution && item.proposedSolution.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userVisibleProposals, search, statusFilter]);

  // Handle Create Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!location.trim()) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập vị trí khu vực thiết bị hỏng.' });
      return;
    }
    if (!issueDescription.trim()) {
      showToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập tình trạng sự việc hỏng hóc.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const allProposals = storage.getRepairProposals();
      const newId = generateDocId('SC', allProposals);
      const now = new Date().toISOString();

      // Find department head for email
      const deptUsers = allUsers.filter(
        (u) => u.department && u.department.toLowerCase() === department.toLowerCase()
      );
      const managerUser =
        deptUsers.find((u) => u.role === 'manager' && u.email) ||
        allUsers.find((u) => u.id === currentUser.departmentHeadId && u.email) ||
        allUsers.find((u) => u.role === 'admin' && u.email);

      const managerEmail = currentUser.departmentHeadEmail || managerUser?.email || '';
      const managerName = managerUser?.name || 'Trưởng bộ phận';

      // 4 Workflow Steps matching the exact requirement
      const steps: RepairStep[] = [
        {
          step: 1,
          title: 'Bạn gửi đề xuất',
          roleRequired: 'employee',
          approverId: currentUser.id,
          approverName: currentUser.name,
          status: 'completed',
          updatedAt: now,
          comment: 'Đã gửi đề xuất sửa chữa lên hệ thống',
        },
        {
          step: 2,
          title: 'Trưởng bộ phận duyệt',
          subTitle: 'qua email',
          roleRequired: 'manager',
          approverId: managerUser?.id,
          approverName: managerName,
          approverEmail: managerEmail,
          status: 'pending',
        },
        {
          step: 3,
          title: 'Cơ điện sửa chữa',
          roleRequired: 'maintenance',
          status: 'pending',
        },
        {
          step: 4,
          title: 'Bạn xác nhận hoàn tất',
          subTitle: 'tab "Theo dõi đề xuất"',
          roleRequired: 'creator',
          approverId: currentUser.id,
          approverName: currentUser.name,
          status: 'pending',
        },
      ];

      const newProposal: RepairProposal = {
        id: newId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: department.trim(),
        location: capitalizeFirstLetter(location.trim()),
        issueDescription: capitalizeFirstLetter(issueDescription.trim()),
        status: 'pending_manager',
        steps,
        currentStepIndex: 1, // At step 2: Trưởng bộ phận duyệt
        createdAt: now,
        updatedAt: now,
      };

      storage.saveRepairProposal(newProposal, { id: currentUser.id, name: currentUser.name });
      setProposals(storage.getRepairProposals());

      // Dispatch Approval Email to Manager
      if (managerEmail) {
        dispatchApprovalEmail({
          toEmail: managerEmail,
          managerName: managerName,
          type: 'repair',
          docId: newProposal.id,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          department: newProposal.department,
          details: {
            title: 'Chi tiết đề xuất sửa chữa',
            items: [
              { label: 'Tổ / Bộ phận', value: newProposal.department },
              { label: 'Khu vực thiết bị hỏng', value: newProposal.location },
              { label: 'Tình trạng sự việc', value: newProposal.issueDescription },
              { label: 'Đề xuất hướng khắc phục', value: '(Trưởng bộ phận nhập khi duyệt đơn)' },
              { label: 'Thời gian gửi', value: formatDateTime(now) },
            ],
          },
        }).catch((err) => console.warn('Email dispatch error:', err));
      }

      showToast({
        type: 'success',
        title: 'Gửi đề xuất thành công',
        message: `Phiếu đề xuất ${newId} đã được tạo và chuyển tới Trưởng bộ phận duyệt qua email.`,
      });

      // Reset form
      setLocation('');
      setIssueDescription('');
      // Switch to tracking tab
      setActiveTab('list');
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Lỗi tạo đề xuất',
        message: err.message || 'Không thể tạo phiếu đề xuất lúc này.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Manager Approve / Reject
  const handleManagerAction = (isApprove: boolean) => {
    if (!selectedProposal || !currentUser) return;
    const now = new Date().toISOString();
    const updated: RepairProposal = { ...selectedProposal };

    const stepIndex = 1; // Step 2: Trưởng bộ phận
    if (updated.steps[stepIndex]) {
      updated.steps[stepIndex].status = isApprove ? 'approved' : 'rejected';
      updated.steps[stepIndex].approverId = currentUser.id;
      updated.steps[stepIndex].approverName = currentUser.name;
      updated.steps[stepIndex].updatedAt = now;
      updated.steps[stepIndex].comment = isApprove
        ? managerComment.trim() || 'Đồng ý phê duyệt đề xuất sửa chữa'
        : rejectionReason.trim() || 'Từ chối đề xuất';
    }

    updated.managerId = currentUser.id;
    updated.managerName = currentUser.name;
    updated.managerApprovedAt = now;
    updated.managerComment = managerComment.trim();

    if (isApprove) {
      if (modalProposedSolution.trim()) {
        updated.proposedSolution = capitalizeFirstLetter(modalProposedSolution.trim());
      }
      updated.status = 'maintenance_pending';
      updated.currentStepIndex = 2; // Move to Step 3: Cơ điện sửa chữa

      // Dispatch notification email to Head of Maintenance
      dispatchMaintenanceNotificationEmail(updated).catch((err) =>
        console.warn('Maintenance notification email error:', err)
      );

      showToast({
        type: 'success',
        title: 'Phê duyệt thành công',
        message: `Đề xuất ${updated.id} đã được duyệt và chuyển sang cho Bộ phận Cơ điện sửa chữa.`,
      });
    } else {
      updated.status = 'rejected';
      updated.rejectionReason = rejectionReason.trim() || 'Trưởng bộ phận từ chối';
      updated.rejectedBy = currentUser.name;
      updated.rejectedAt = now;
      showToast({
        type: 'info',
        title: 'Đã từ chối đề xuất',
        message: `Đề xuất ${updated.id} đã bị từ chối.`,
      });
    }

    updated.updatedAt = now;
    storage.saveRepairProposal(updated, { id: currentUser.id, name: currentUser.name });
    setProposals(storage.getRepairProposals());
    setSelectedProposal(updated);
    setIsRejecting(false);
    setManagerComment('');
    setRejectionReason('');
  };

  // Step 3: Maintenance Complete Repair
  const handleMaintenanceComplete = () => {
    if (!selectedProposal || !currentUser) return;
    const now = new Date().toISOString();
    const updated: RepairProposal = { ...selectedProposal };

    const stepIndex = 2; // Step 3: Cơ điện
    if (updated.steps[stepIndex]) {
      updated.steps[stepIndex].status = 'completed';
      updated.steps[stepIndex].approverId = currentUser.id;
      updated.steps[stepIndex].approverName = currentUser.name;
      updated.steps[stepIndex].updatedAt = now;
      updated.steps[stepIndex].comment = maintenanceNotes.trim() || 'Đã sửa chữa xong và bàn giao cho người sử dụng';
    }

    updated.maintenanceStaffId = currentUser.id;
    updated.maintenanceStaffName = currentUser.name;
    updated.maintenanceCompletedAt = now;
    updated.maintenanceNotes = maintenanceNotes.trim() || 'Đã hoàn tất sửa chữa';

    updated.status = 'pending_confirmation';
    updated.currentStepIndex = 3; // Move to Step 4: Bạn xác nhận hoàn tất
    updated.updatedAt = now;

    storage.saveRepairProposal(updated, { id: currentUser.id, name: currentUser.name });
    setProposals(storage.getRepairProposals());
    setSelectedProposal(updated);
    setMaintenanceNotes('');

    showToast({
      type: 'success',
      title: 'Xác nhận sửa chữa xong',
      message: `Đề xuất ${updated.id} đã hoàn tất sửa chữa và chuyển cho người đề xuất xác nhận bàn giao.`,
    });
  };

  // Step 4: Creator Confirm Completion
  const handleCreatorConfirm = () => {
    if (!selectedProposal || !currentUser) return;
    const now = new Date().toISOString();
    const updated: RepairProposal = { ...selectedProposal };

    const stepIndex = 3; // Step 4: Người đề xuất
    if (updated.steps[stepIndex]) {
      updated.steps[stepIndex].status = 'completed';
      updated.steps[stepIndex].approverId = currentUser.id;
      updated.steps[stepIndex].approverName = currentUser.name;
      updated.steps[stepIndex].updatedAt = now;
      updated.steps[stepIndex].comment = creatorFeedback.trim() || 'Thiết bị hoạt động bình thường, xác nhận hoàn tất';
    }

    updated.creatorConfirmedAt = now;
    updated.creatorFeedback = creatorFeedback.trim();
    updated.status = 'completed';
    updated.updatedAt = now;

    storage.saveRepairProposal(updated, { id: currentUser.id, name: currentUser.name });
    setProposals(storage.getRepairProposals());
    setSelectedProposal(updated);
    setCreatorFeedback('');

    showToast({
      type: 'success',
      title: 'Quy trình hoàn tất',
      message: `Bạn đã xác nhận hoàn tất phiếu đề xuất sửa chữa ${updated.id}. Cảm ơn bạn!`,
    });
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Phiếu đề xuất sửa chữa
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chọn Tổ/bộ phận, mô tả khu vực và tình trạng sự việc, rồi bấm "Gửi đề xuất". Trưởng bộ phận của Tổ đã chọn sẽ nhận email để duyệt và đề xuất hướng khắc phục.
              </p>
            </div>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo đề xuất mới</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Theo dõi đề xuất</span>
            {pendingCountForUser > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {pendingCountForUser}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Visual Workflow Steps Banner matching the user image */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Mô tả trình tự phê duyệt đề xuất sửa chữa:</span>
          </div>
          <span className="text-[11px] text-slate-400">4 bước khép kín</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 p-2 sm:p-3">
          {/* Step 1 */}
          <div className="p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Bạn gửi đề xuất
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Nhập khu vực, sự việc & gửi
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Trưởng bộ phận duyệt
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                qua email
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Cơ điện sửa chữa
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Khắc phục & bàn giao
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              4
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Bạn xác nhận hoàn tất
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                tab "Theo dõi đề xuất"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: TẠO ĐỀ XUẤT MỚI */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>Thông tin phiếu đề xuất sửa chữa</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Người tạo phiếu: <b>{currentUser?.name}</b> (Mã NV: {currentUser?.id}) &bull; Trưởng bộ phận duyệt sẽ nhận thông báo tức thời qua email.
            </p>
          </div>

          <form onSubmit={handleCreateProposal} className="space-y-6">
            {/* Field 1: Tổ/bộ phận */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Tổ / Bộ phận</span>
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (Vị trí công tác thực tế của nhân viên trên hệ thống)
                </span>
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {departments.length === 0 ? (
                    <option value={currentUser?.department || 'Chung'}>
                      {currentUser?.department || 'Chung'}
                    </option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 italic">
                * Hệ thống tự động nhận diện Trưởng bộ phận của đơn vị đã chọn để gửi email duyệt.
              </p>
            </div>

            {/* Field 2: Khu vực */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Khu vực</span>
                <span className="text-rose-500 font-bold">*</span>
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (Vị trí thiết bị bị hỏng do người lao động nhập vào - Bắt buộc)
                </span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
                onBlur={() => setLocation((prev) => capitalizeFirstLetter(prev.trim()))}
                placeholder="Ví dụ: Máy tiện CNC 02 - Xưởng 1, Quạt thông gió line 3, Trạm bơm khí nén..."
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Field 3: Tình trạng sự việc */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Tình trạng sự việc</span>
                <span className="text-rose-500 font-bold">*</span>
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (Mô tả hiện tượng hỏng hóc, sự cố - ý kiến đề xuất xử lý - Bắt buộc)
                </span>
              </label>
              <textarea
                required
                rows={4}
                value={issueDescription}
                onChange={(e) => setIssueDescription(capitalizeFirstLetter(e.target.value))}
                onBlur={() => setIssueDescription((prev) => capitalizeFirstLetter(prev.trim()))}
                placeholder="Mô tả chi tiết tình trạng sự việc thiết bị gặp phải, triệu chứng hư hỏng, thời điểm phát hiện, ý kiến đề xuất xử lý..."
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>



            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocation('');
                  setIssueDescription('');
                }}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Làm mới
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi đề xuất'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: THEO DÕI ĐỀ XUẤT */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Scope tabs for Approvers / Maintenance */}
            {canManageOthers && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    scopeFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isMaintenance
                    ? 'Tất cả đề xuất sửa chữa'
                    : isBOD
                    ? 'Tất cả toàn công ty'
                    : `Đề xuất bộ phận (${currentUser?.department || ''})`}
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter('my')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    scopeFilter === 'my'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Đề xuất của tôi
                </button>
              </div>
            )}

            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã phiếu, người gửi, khu vực, sự việc..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending_manager">Bước 2: Chờ Trưởng BP duyệt</option>
                <option value="maintenance_pending">Bước 3: Chờ Cơ điện sửa chữa</option>
                <option value="pending_confirmation">Bước 4: Chờ bạn xác nhận</option>
                <option value="completed">Đã hoàn tất</option>
                <option value="rejected">Bị từ chối</option>
              </select>

              {(statusFilter !== 'all' || search.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearch('');
                  }}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>
          </div>

          {/* Proposals Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã phiếu</th>
                    <th className="py-3.5 px-4">Người yêu cầu</th>
                    <th className="py-3.5 px-4">Khu vực thiết bị</th>
                    <th className="py-3.5 px-4">Tình trạng sự việc</th>
                    <th className="py-3.5 px-4 text-center">Tiến trình (4 bước)</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-medium">Chưa có đề xuất sửa chữa nào phù hợp bộ lọc.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('create')}
                          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo đề xuất mới ngay</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((item, idx) => {
                      const badge = REPAIR_STATUS_BADGES[item.status] || {
                        bg: 'bg-slate-100',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                        label: item.status,
                      };

                      return (
                        <tr
                          key={`${item.id}-${idx}`}
                          onClick={() => setSelectedProposal(item)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
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
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate max-w-[180px]">{item.location}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[240px]">
                              {item.issueDescription}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {/* Step Indicators */}
                            <div className="inline-flex items-center gap-1">
                              {[1, 2, 3, 4].map((stepNum) => {
                                const stepObj = item.steps[stepNum - 1];
                                const isDone = stepObj?.status === 'completed' || stepObj?.status === 'approved';
                                const isCurrent = item.currentStepIndex === stepNum - 1 && item.status !== 'completed' && item.status !== 'rejected';
                                const isReject = stepObj?.status === 'rejected';

                                return (
                                  <div
                                    key={stepNum}
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isReject
                                        ? 'bg-rose-500 text-white'
                                        : isDone
                                        ? 'bg-emerald-500 text-white'
                                        : isCurrent
                                        ? 'bg-amber-500 text-white animate-pulse'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                    }`}
                                    title={`Bước ${stepNum}: ${stepObj?.title || ''}`}
                                  >
                                    {isDone ? <Check className="w-3 h-3" /> : stepNum}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProposal(item);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                    {selectedProposal.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      REPAIR_STATUS_BADGES[selectedProposal.status]?.bg
                    } ${REPAIR_STATUS_BADGES[selectedProposal.status]?.text} ${
                      REPAIR_STATUS_BADGES[selectedProposal.status]?.border
                    }`}
                  >
                    {REPAIR_STATUS_LABELS[selectedProposal.status]}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Chi tiết phiếu đề xuất sửa chữa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProposal(null);
                  setIsRejecting(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Workflow 4-Step Progress */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                Tiến trình xử lý quy trình 4 bước:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                {selectedProposal.steps.map((s) => {
                  const isDone = s.status === 'completed' || s.status === 'approved';
                  const isCurrent =
                    selectedProposal.currentStepIndex === s.step - 1 &&
                    selectedProposal.status !== 'completed' &&
                    selectedProposal.status !== 'rejected';
                  const isReject = s.status === 'rejected';

                  return (
                    <div
                      key={s.step}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                        isReject
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700 dark:text-rose-300'
                          : isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-300'
                          : isCurrent
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300 font-bold ring-2 ring-amber-400/40'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                            {isDone ? <Check className="w-3 h-3" /> : s.step}
                          </span>
                          <span className="truncate">{s.title}</span>
                        </div>
                        {s.subTitle && (
                          <div className="text-[10px] opacity-80 mt-0.5">{s.subTitle}</div>
                        )}
                      </div>
                      <div className="text-[10px] mt-2 pt-1 border-t border-current/10">
                        {s.approverName && <div>{s.approverName}</div>}
                        {s.updatedAt && (
                          <div className="text-[9px] opacity-75">{formatDateTime(s.updatedAt)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Người gửi đề xuất:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedProposal.employeeName}
                </span>{' '}
                <span className="text-slate-500">({selectedProposal.employeeId})</span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Tổ / Bộ phận:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedProposal.department}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block mb-1">Khu vực thiết bị hỏng:</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  {selectedProposal.location}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                <span className="text-slate-400 block mb-1 font-semibold">Tình trạng sự việc:</span>
                <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                  {selectedProposal.issueDescription}
                </div>
              </div>

              {selectedProposal.proposedSolution && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                  <span className="text-slate-400 block mb-1 font-semibold flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                    Đề xuất hướng khắc phục:
                  </span>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {selectedProposal.proposedSolution}
                  </div>
                </div>
              )}

              {selectedProposal.maintenanceNotes && (
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 sm:col-span-2">
                  <span className="text-blue-600 dark:text-blue-400 block mb-1 font-bold flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" />
                    Kết quả xử lý từ Bộ phận Cơ điện:
                  </span>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {selectedProposal.maintenanceNotes}
                  </div>
                  {selectedProposal.maintenanceStaffName && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 mt-2">
                      Người thực hiện: {selectedProposal.maintenanceStaffName} &bull; {formatDateTime(selectedProposal.maintenanceCompletedAt)}
                    </div>
                  )}
                </div>
              )}

              {selectedProposal.creatorFeedback && (
                <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 sm:col-span-2">
                  <span className="text-emerald-700 dark:text-emerald-400 block mb-1 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Xác nhận hoàn tất từ người đề xuất:
                  </span>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {selectedProposal.creatorFeedback}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2">
                    Thời gian: {formatDateTime(selectedProposal.creatorConfirmedAt)}
                  </div>
                </div>
              )}

              {selectedProposal.rejectionReason && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 sm:col-span-2 text-rose-700 dark:text-rose-300">
                  <span className="font-bold block mb-1 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    Lý do từ chối:
                  </span>
                  <div>{selectedProposal.rejectionReason}</div>
                  {selectedProposal.rejectedBy && (
                    <div className="text-[11px] text-rose-500 mt-1">
                      Bởi: {selectedProposal.rejectedBy} &bull; {formatDateTime(selectedProposal.rejectedAt)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION SECTION ACCORDING TO ROLE & WORKFLOW STEP */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              {/* STEP 2 ACTIONS: Trưởng bộ phận duyệt */}
              {selectedProposal.status === 'pending_manager' && (isManagerOrTL || isBOD) && (
                <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Dành cho Trưởng bộ phận duyệt (Bước 2):</span>
                  </div>

                  {!isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>Đề xuất hướng khắc phục (chỉ đạo cho Cơ điện):</span>
                        </label>
                        <textarea
                          rows={3}
                          value={modalProposedSolution}
                          onChange={(e) => setModalProposedSolution(capitalizeFirstLetter(e.target.value))}
                          onBlur={() => setModalProposedSolution((prev) => capitalizeFirstLetter(prev.trim()))}
                          placeholder="Nhập đề xuất hướng khắc phục, phương án xử lý chỉ đạo cho Bộ phận Cơ điện..."
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleManagerAction(true)}
                          className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Phê duyệt đề xuất & Chuyển Cơ điện</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Từ chối...
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Nhập lý do từ chối đề xuất này..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-800 dark:text-white"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManagerAction(false)}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 ACTIONS: Cơ điện sửa chữa */}
              {selectedProposal.status === 'maintenance_pending' && (isMaintenance || isBOD) && (
                <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                  <div className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Dành cho Bộ phận Cơ điện (Bước 3):</span>
                  </div>
                  <textarea
                    rows={2}
                    value={maintenanceNotes}
                    onChange={(e) => setMaintenanceNotes(e.target.value)}
                    placeholder="Ghi chú nội dung đã sửa chữa, linh kiện đã thay thế hoặc hướng dẫn sử dụng bàn giao..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleMaintenanceComplete}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận đã sửa chữa xong & Bàn giao</span>
                  </button>
                </div>
              )}

              {/* STEP 4 ACTIONS: Người đề xuất xác nhận hoàn tất */}
              {selectedProposal.status === 'pending_confirmation' &&
                (selectedProposal.employeeId.toLowerCase() === currentUser?.id.toLowerCase() || isBOD) && (
                  <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-2xl border border-purple-200/60 dark:border-purple-900/40">
                    <div className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận hoàn tất (Bước 4 - Bạn xác nhận hoàn tất):</span>
                    </div>
                    <textarea
                      rows={2}
                      value={creatorFeedback}
                      onChange={(e) => setCreatorFeedback(e.target.value)}
                      placeholder="Ghi chú xác nhận (Ví dụ: Thiết bị đã hoạt động ổn định, bàn giao đầy đủ)..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreatorConfirm}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Tôi xác nhận thiết bị đã hoạt động bình thường (Hoàn tất)</span>
                    </button>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedProposal(null);
                  setIsRejecting(false);
                }}
                className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
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
