'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  GeneralProposal,
  GeneralProposalStatus,
  GeneralStep,
  GENERAL_STATUS_BADGES,
  GENERAL_STATUS_LABELS,
} from '@/types/proposal';
import {
  filterUserGeneralProposals,
  isSuperAdminOrBOD,
  isITStaff,
  isApproverRole,
  DocumentScope,
} from '@/lib/permissions';
import { generateDocId, formatDateTime } from '@/lib/utils';
import { dispatchGeneralApprovalEmail } from '@/lib/email';
import { ToastContainer, useToast } from '@/components/common/Toast';
import {
  FileQuestion,
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
  UserCheck,
  FileText,
  Printer,
  Check,
  Sparkles,
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

export interface GeneralProposalSubViewProps {
  defaultTab?: 'create' | 'list';
}

interface ReceiverOption {
  key: string;
  userId: string;
  userName: string;
  email: string;
  department: string;
  title: string;
}

export function GeneralProposalSubView({ defaultTab = 'create' }: GeneralProposalSubViewProps) {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  const [proposals, setProposals] = useState<GeneralProposal[]>(() =>
    storage.getGeneralProposals()
  );

  const [activeTab, setActiveTab] = useState<'create' | 'list'>(defaultTab);

  // Check roles
  const isBOD = isSuperAdminOrBOD(currentUser);
  const isManager = currentUser?.role === 'manager' || currentUser?.role === 'team_leader';
  const isIT = isITStaff(currentUser);
  const canManageOthers = isBOD || isManager || isIT;

  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    canManageOthers ? 'all' : 'my'
  );

  // Department & Users from storage
  const departments = useMemo(() => storage.getDepartments(), []);
  const allUsers = useMemo(() => storage.getUsers(), []);

  // Prepare list of receivers: IT + all Department Heads
  const receiverOptions: ReceiverOption[] = useMemo(() => {
    const list: ReceiverOption[] = [];

    // 1. IT Department (Trần Lê Hữu Lực - 2265)
    const itUser = allUsers.find((u) => u.id === '2265' || u.role === 'admin' || /cntt|it/i.test(u.department || ''));
    list.push({
      key: 'it_2265',
      userId: itUser?.id || '2265',
      userName: itUser?.name || 'Trần Lê Hữu Lực',
      email: itUser?.email || 'it@longkhai.com.vn',
      department: 'Bộ phận CNTT',
      title: 'Trần Lê Hữu Lực (2265) - Bộ phận CNTT',
    });

    // 2. Department heads
    const managerUsers = allUsers.filter(
      (u) =>
        (u.role === 'manager' || u.role === 'team_leader') &&
        u.id !== '2265' &&
        u.id !== currentUser?.id
    );

    managerUsers.forEach((u) => {
      list.push({
        key: `user_${u.id}`,
        userId: u.id,
        userName: u.name,
        email: u.email || '',
        department: u.department || 'Ban Quản Lý',
        title: `${u.name} (${u.id}) - Trưởng BP ${u.department || ''}`,
      });
    });

    return list;
  }, [allUsers, currentUser]);

  // Form State
  const [department, setDepartment] = useState(() => currentUser?.department || 'Văn Phòng');
  const [selectedReceiverKey, setSelectedReceiverKey] = useState<string>(
    () => receiverOptions[0]?.key || 'it_2265'
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Filter & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal State
  const [selectedProposal, setSelectedProposal] = useState<GeneralProposal | null>(null);
  const [approverComment, setApproverComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Storage listener to sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setProposals(storage.getGeneralProposals());
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

  // Filtered proposals by permissions & scope
  const userVisibleProposals = useMemo(() => {
    return filterUserGeneralProposals(proposals, currentUser, scopeFilter);
  }, [proposals, currentUser, scopeFilter]);

  // Count pending for current user
  const pendingCountForUser = useMemo(() => {
    if (!currentUser) return 0;
    const uid = currentUser.id.toLowerCase();
    return userVisibleProposals.filter((p) => {
      if (p.status === 'pending_receiver') {
        const isTarget = p.receiverUserId?.toLowerCase() === uid;
        const isTargetDept = isIT && /cntt|it/i.test(p.receiverDepartment);
        return isTarget || isTargetDept || isBOD;
      }
      if (p.status === 'pending_manager') {
        const isManagerDept = isManager && p.receiverDepartment.toLowerCase() === (currentUser.department || '').toLowerCase();
        return isManagerDept || isBOD;
      }
      return false;
    }).length;
  }, [userVisibleProposals, currentUser, isManager, isIT, isBOD]);

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
        item.receiverDepartment.toLowerCase().includes(q) ||
        (item.receiverUserName && item.receiverUserName.toLowerCase().includes(q)) ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userVisibleProposals, search, statusFilter]);

  // Handle Create General Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!title.trim()) {
      showToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tiêu đề đề xuất.',
      });
      return;
    }

    if (!content.trim()) {
      showToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập nội dung chi tiết của đề xuất.',
      });
      return;
    }

    const chosenReceiver = receiverOptions.find((r) => r.key === selectedReceiverKey) || receiverOptions[0];

    setIsSubmitting(true);
    try {
      const allProposals = storage.getGeneralProposals();
      const newId = generateDocId('DK', allProposals);
      const now = new Date().toISOString();

      // Find department manager of receiver department
      const receiverDeptUsers = allUsers.filter(
        (u) => u.department && u.department.toLowerCase() === (chosenReceiver?.department || '').toLowerCase()
      );
      const deptManager =
        receiverDeptUsers.find((u) => u.role === 'manager' && u.email) ||
        (chosenReceiver?.userId ? allUsers.find((u) => u.id === chosenReceiver.userId) : null) ||
        allUsers.find((u) => u.role === 'admin' && u.email);

      // 3 Workflow Steps:
      // Bước 1: Nhân viên gửi đề xuất
      // Bước 2: Bộ phận tiếp nhận xử lý
      // Bước 3: Trưởng bộ phận của bộ phận tiếp nhận phê duyệt
      const steps: GeneralStep[] = [
        {
          step: 1,
          title: 'Bạn gửi đề xuất',
          roleRequired: 'employee',
          approverId: currentUser.id,
          approverName: currentUser.name,
          status: 'completed',
          updatedAt: now,
          comment: 'Đã gửi phiếu đề xuất khác lên hệ thống',
        },
        {
          step: 2,
          title: 'Bộ phận tiếp nhận xử lý',
          subTitle: chosenReceiver?.title,
          roleRequired: 'receiver',
          approverId: chosenReceiver?.userId,
          approverName: chosenReceiver?.userName,
          approverEmail: chosenReceiver?.email,
          status: 'pending',
        },
        {
          step: 3,
          title: 'Trưởng bộ phận phê duyệt',
          subTitle: deptManager?.name || 'Trưởng bộ phận tiếp nhận',
          roleRequired: 'manager',
          approverId: deptManager?.id,
          approverName: deptManager?.name,
          approverEmail: deptManager?.email,
          status: 'pending',
        },
      ];

      const activeEmailCfg = storage.getEmailConfig();
      const newProposal: GeneralProposal = {
        id: newId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: department.trim(),
        title: capitalizeFirstLetter(title.trim()),
        content: capitalizeFirstLetter(content.trim()),
        receiverDepartment: chosenReceiver?.department || 'Bộ phận tiếp nhận',
        receiverUserId: chosenReceiver?.userId,
        receiverUserName: chosenReceiver?.userName,
        receiverUserEmail: chosenReceiver?.email,
        managerId: deptManager?.id,
        managerName: deptManager?.name,
        managerEmail: deptManager?.email,
        status: 'pending_receiver',
        steps,
        currentStepIndex: 1, // At step 2: Bộ phận tiếp nhận
        createdAt: now,
        updatedAt: now,
        emailRelayUrl: activeEmailCfg.googleScriptUrl || undefined,
        emailConfig: {
          googleScriptUrl: activeEmailCfg.googleScriptUrl || undefined,
          senderName: activeEmailCfg.senderName || undefined,
          portalBaseUrl: activeEmailCfg.portalBaseUrl || undefined,
        },
      };

      storage.saveGeneralProposal(newProposal, { id: currentUser.id, name: currentUser.name });
      setProposals(storage.getGeneralProposals());

      // Send email to Step 2 receiver
      dispatchGeneralApprovalEmail(newProposal, 'receiver').catch((err) =>
        console.warn('Dispatch general email error:', err)
      );

      showToast({
        type: 'success',
        title: 'Gửi đề xuất thành công',
        message: `Phiếu đề xuất ${newId} đã được chuyển tới ${chosenReceiver?.title} để xử lý.`,
      });

      // Reset form
      setTitle('');
      setContent('');
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

  // Step 2 & Step 3 Approval Action
  const handleProposalApproval = (isApprove: boolean) => {
    if (!selectedProposal || !currentUser) return;
    const now = new Date().toISOString();
    const updated: GeneralProposal = { ...selectedProposal };

    if (updated.status === 'pending_receiver') {
      // Step 2: Receiver process
      const stepIdx = 1;
      if (updated.steps[stepIdx]) {
        updated.steps[stepIdx].status = isApprove ? 'approved' : 'rejected';
        updated.steps[stepIdx].approverId = currentUser.id;
        updated.steps[stepIdx].approverName = currentUser.name;
        updated.steps[stepIdx].updatedAt = now;
        updated.steps[stepIdx].comment = isApprove
          ? approverComment.trim() || 'Bộ phận tiếp nhận đã xử lý và chuyển Trưởng bộ phận duyệt'
          : rejectionReason.trim() || 'Từ chối đề xuất';
      }

      updated.receiverNotes = approverComment.trim();
      updated.receiverProcessedAt = now;

      if (isApprove) {
        updated.status = 'pending_manager';
        updated.currentStepIndex = 2; // Step 3: Trưởng bộ phận duyệt

        // Dispatch email to Manager
        dispatchGeneralApprovalEmail(updated, 'manager').catch((err) =>
          console.warn('Dispatch email to manager error:', err)
        );

        showToast({
          type: 'success',
          title: 'Xử lý thành công',
          message: `Đề xuất ${updated.id} đã được chuyển sang Trưởng bộ phận duyệt hoàn tất.`,
        });
      } else {
        updated.status = 'rejected';
        updated.rejectionReason = rejectionReason.trim() || 'Bộ phận tiếp nhận từ chối';
        updated.rejectedBy = currentUser.name;
        updated.rejectedAt = now;
        showToast({
          type: 'info',
          title: 'Đã từ chối',
          message: `Đề xuất ${updated.id} đã bị từ chối.`,
        });
      }
    } else if (updated.status === 'pending_manager') {
      // Step 3: Manager process
      const stepIdx = 2;
      if (updated.steps[stepIdx]) {
        updated.steps[stepIdx].status = isApprove ? 'completed' : 'rejected';
        updated.steps[stepIdx].approverId = currentUser.id;
        updated.steps[stepIdx].approverName = currentUser.name;
        updated.steps[stepIdx].updatedAt = now;
        updated.steps[stepIdx].comment = isApprove
          ? approverComment.trim() || 'Trưởng bộ phận đồng ý phê duyệt hoàn tất'
          : rejectionReason.trim() || 'Từ chối đề xuất';
      }

      updated.managerId = currentUser.id;
      updated.managerName = currentUser.name;
      updated.managerApprovedAt = now;
      updated.managerComment = approverComment.trim();

      if (isApprove) {
        updated.status = 'completed';
        showToast({
          type: 'success',
          title: 'Phê duyệt hoàn tất',
          message: `Đề xuất ${updated.id} đã được phê duyệt thành công!`,
        });
      } else {
        updated.status = 'rejected';
        updated.rejectionReason = rejectionReason.trim() || 'Trưởng bộ phận từ chối';
        updated.rejectedBy = currentUser.name;
        updated.rejectedAt = now;
        showToast({
          type: 'info',
          title: 'Đã từ chối',
          message: `Đề xuất ${updated.id} đã bị từ chối.`,
        });
      }
    }

    updated.updatedAt = now;
    storage.saveGeneralProposal(updated, { id: currentUser.id, name: currentUser.name });
    setProposals(storage.getGeneralProposals());
    setSelectedProposal(updated);
    setIsRejecting(false);
    setApproverComment('');
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sub Header & Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Phiếu đề xuất khác
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gửi đề xuất, kiến nghị hoặc yêu cầu hỗ trợ tới Bộ phận CNTT hoặc các Trưởng bộ phận
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
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
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
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Theo dõi đề xuất</span>
            {pendingCountForUser > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[10px]">
                {pendingCountForUser}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Visual Workflow Steps Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span>Trình tự phê duyệt đề xuất khác:</span>
          </div>
          <span className="text-[11px] text-slate-400">3 bước khép kín</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 p-2 sm:p-3">
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
                Chọn người tiếp nhận & mô tả yêu cầu
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
                Bộ phận tiếp nhận xử lý
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                Kiểm tra & đề xuất phương án
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
                Trưởng bộ phận phê duyệt
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Duyệt thực hiện &bull; Hoàn tất
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
              <FileText className="w-5 h-5 text-purple-500" />
              <span>Thông tin phiếu đề xuất khác</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Người tạo phiếu: <b>{currentUser?.name}</b> (Mã NV: {currentUser?.id}) &bull; Chọn người tiếp nhận để chuyển tiếp yêu cầu chính xác.
            </p>
          </div>

          <form onSubmit={handleCreateProposal} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Tổ / Bộ phận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tổ / Bộ phận</span>
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    (Vị trí công tác của nhân viên)
                  </span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {departments.length === 0 ? (
                    <option value={currentUser?.department || 'Văn Phòng'}>
                      {currentUser?.department || 'Văn Phòng'}
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

              {/* Field 2: Người / Bộ phận tiếp nhận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                  <span>Người / Bộ phận tiếp nhận</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedReceiverKey}
                  onChange={(e) => setSelectedReceiverKey(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {receiverOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Field 3: Tiêu đề đề xuất */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Tiêu đề đề xuất</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tóm tắt tiêu đề yêu cầu hoặc đề xuất..."
                value={title}
                onChange={(e) => setTitle(capitalizeFirstLetter(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 font-semibold"
              />
            </div>

            {/* Field 4: Nội dung chi tiết */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Nội dung chi tiết đề xuất</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Mô tả cụ thể nội dung đề xuất, căn cứ đề xuất, mục đích và kết quả mong đợi..."
                value={content}
                onChange={(e) => setContent(capitalizeFirstLetter(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-slate-400 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTitle('');
                  setContent('');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Nhập lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi phiếu đề xuất'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: THEO DÕI ĐỀ XUẤT */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã phiếu, người gửi, tiêu đề, nội dung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Scope filter (All vs My) */}
              {canManageOthers && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('my')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      scopeFilter === 'my'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Đơn của tôi
                  </button>
                  <button
                    type="button"
                    onClick={() => setScopeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      scopeFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tất cả đơn
                  </button>
                </div>
              )}

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_receiver">Chờ BP tiếp nhận</option>
                  <option value="pending_manager">Chờ Trưởng BP duyệt</option>
                  <option value="completed">Đã hoàn tất</option>
                  <option value="rejected">Bị từ chối</option>
                </select>
              </div>

              {/* Reset filter */}
              {(search || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Đặt lại bộ lọc"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Proposals Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Người đề xuất</th>
                    <th className="px-4 py-3">Tổ / Bộ phận</th>
                    <th className="px-4 py-3">BP Tiếp nhận</th>
                    <th className="px-4 py-3">Tiêu đề đề xuất</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p>Không có đề xuất nào phù hợp</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((item) => {
                      const badge = GENERAL_STATUS_BADGES[item.status] || GENERAL_STATUS_BADGES.pending_receiver;
                      const uid = (currentUser?.id || '').toLowerCase();
                      const needsReceiverAction =
                        item.status === 'pending_receiver' &&
                        (item.receiverUserId?.toLowerCase() === uid || (isIT && /cntt|it/i.test(item.receiverDepartment)) || isBOD);
                      const needsManagerAction =
                        item.status === 'pending_manager' &&
                        (isManager && item.receiverDepartment.toLowerCase() === (currentUser?.department || '').toLowerCase() || isBOD);
                      const isActionNeeded = needsReceiverAction || needsManagerAction;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isActionNeeded ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              {isActionNeeded && (
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                              )}
                              <span>{item.id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.employeeName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.employeeId}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                            {item.department}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-purple-700 dark:text-purple-300">
                            {item.receiverUserName ? `${item.receiverUserName} (${item.receiverDepartment})` : item.receiverDepartment}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] truncate" title={item.title}>
                            {item.title}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                            {formatDateTime(item.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedProposal(item)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                                isActionNeeded
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isActionNeeded ? 'Xử lý ngay' : 'Chi tiết'}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <FileQuestion className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Phiếu đề xuất khác #{selectedProposal.id}
                    </h3>
                    {(() => {
                      const badge = GENERAL_STATUS_BADGES[selectedProposal.status] || GENERAL_STATUS_BADGES.pending_receiver;
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tạo ngày: {formatDateTime(selectedProposal.createdAt)} &bull; Cập nhật: {formatDateTime(selectedProposal.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="In phiếu"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProposal(null);
                    setIsRejecting(false);
                    setApproverComment('');
                    setRejectionReason('');
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Progress Steps Timeline */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                  Tiến trình xử lý (3 bước)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedProposal.steps.map((st) => {
                    const isDone = st.status === 'completed' || st.status === 'approved';
                    const isRejected = st.status === 'rejected';
                    const isCurrent = !isDone && !isRejected && st.step - 1 === selectedProposal.currentStepIndex;

                    return (
                      <div
                        key={st.step}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                            : isRejected
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                            : isCurrent
                            ? 'bg-purple-500/10 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 ring-1 ring-purple-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px]">Bước {st.step}</span>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          {isCurrent && <Clock className="w-3.5 h-3.5 text-purple-500 animate-spin" />}
                        </div>
                        <div className="font-bold text-xs">{st.title}</div>
                        {st.subTitle && (
                          <div className="text-[10px] opacity-75">{st.subTitle}</div>
                        )}
                        {st.updatedAt && (
                          <div className="text-[10px] opacity-60 mt-1">
                            {formatDateTime(st.updatedAt)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Người đề xuất</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.employeeName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Mã NV: <b>{selectedProposal.employeeId}</b> &bull; Bộ phận: <b>{selectedProposal.department}</b>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60">
                  <div className="text-purple-800 dark:text-purple-400 text-[11px] mb-1 font-bold">Người / Bộ phận tiếp nhận</div>
                  <div className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                    {selectedProposal.receiverUserName || selectedProposal.receiverDepartment}
                  </div>
                  <div className="text-purple-700 dark:text-purple-300 text-[11px] mt-0.5">
                    {selectedProposal.receiverDepartment}
                  </div>
                </div>
              </div>

              {/* Title & Content */}
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Tiêu đề đề xuất</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.title}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Nội dung chi tiết đề xuất</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedProposal.content}
                  </div>
                </div>

                {/* Receiver Notes */}
                {selectedProposal.receiverProcessedAt && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                    <div className="text-blue-800 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                      Ý kiến của Bộ phận tiếp nhận
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {selectedProposal.receiverNotes || 'Đã tiếp nhận và chuyển Trưởng bộ phận duyệt.'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Thời gian: {formatDateTime(selectedProposal.receiverProcessedAt)}
                    </div>
                  </div>
                )}

                {/* Manager Comments */}
                {selectedProposal.managerApprovedAt && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="text-emerald-800 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                      Ý kiến phê duyệt của Trưởng bộ phận
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {selectedProposal.managerComment || 'Đồng ý phê duyệt đề xuất.'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Người duyệt: <b>{selectedProposal.managerName}</b> &bull; Thời gian: {formatDateTime(selectedProposal.managerApprovedAt)}
                    </div>
                  </div>
                )}

                {/* Rejection Notice */}
                {selectedProposal.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Đề xuất đã bị từ chối</span>
                    </div>
                    <div>
                      Người từ chối: <b>{selectedProposal.rejectedBy || 'Bộ phận tiếp nhận'}</b>
                      {selectedProposal.rejectedAt && ` (${formatDateTime(selectedProposal.rejectedAt)})`}
                    </div>
                    <div className="mt-1">
                      Lý do: <i>{selectedProposal.rejectionReason}</i>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION SECTIONS ACCORDING TO ROLE & STEP */}

              {/* Step 2 Actions: Receiver Action */}
              {selectedProposal.status === 'pending_receiver' &&
                (selectedProposal.receiverUserId?.toLowerCase() === currentUser?.id.toLowerCase() ||
                  (isIT && /cntt|it/i.test(selectedProposal.receiverDepartment)) ||
                  isBOD) && (
                  <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-300 dark:border-purple-700/60 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>Dành cho Bộ phận tiếp nhận: Xử lý & Chuyển Trưởng BP duyệt</span>
                    </div>

                    {!isRejecting ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Ý kiến xử lý / Phương án thực hiện:
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Nhập nội dung tiếp nhận, phương án xử lý để Trưởng bộ phận duyệt..."
                            value={approverComment}
                            onChange={(e) => setApproverComment(capitalizeFirstLetter(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsRejecting(true)}
                            className="px-4 py-2 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                          >
                            Từ chối đề xuất
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProposalApproval(true)}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Tiếp nhận & Chuyển Trưởng BP duyệt</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                            Lý do từ chối (*):
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Nhập lý do từ chối..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(capitalizeFirstLetter(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsRejecting(false)}
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleProposalApproval(false)}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Xác nhận từ chối</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              {/* Step 3 Actions: Manager Action */}
              {selectedProposal.status === 'pending_manager' && (isManager || isBOD) && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dành cho Trưởng bộ phận: Phê duyệt đề xuất</span>
                  </div>

                  {!isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ý kiến phê duyệt:
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Đồng ý thực hiện theo đề xuất..."
                          value={approverComment}
                          onChange={(e) => setApproverComment(capitalizeFirstLetter(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(true)}
                          className="px-4 py-2 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                        >
                          Từ chối đề xuất
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProposalApproval(true)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Phê duyệt hoàn tất</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                          Lý do từ chối (*):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Nhập lý do từ chối..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(capitalizeFirstLetter(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRejecting(false)}
                          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProposalApproval(false)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Xác nhận từ chối</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
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
