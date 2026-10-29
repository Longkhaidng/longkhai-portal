'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  StationeryItem,
  StationeryProposal,
  StationeryProposalItem,
  StationeryStep,
  STATIONERY_STATUS_BADGES,
  STATIONERY_STATUS_LABELS,
} from '@/types/proposal';
import {
  filterUserStationeryProposals,
  isSuperAdminOrBOD,
  DocumentScope,
} from '@/lib/permissions';
import { generateDocId, formatDateTime } from '@/lib/utils';
import { StationeryCatalogModal } from './StationeryCatalogModal';
import { dispatchStationeryApprovalEmail } from '@/lib/email';
import { ToastContainer, useToast } from '@/components/common/Toast';
import {
  Package,
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
  Trash2,
  Building,
  UserCheck,
  FileText,
  Printer,
  Check,
  Sparkles,
  Settings,
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

export interface StationeryProposalSubViewProps {
  defaultTab?: 'create' | 'list';
}

interface ProposalFormRow {
  itemId: string;
  itemName: string;
  unit: string;
  monthlyQuota?: number;
  quantity: number;
  notes: string;
}

export function StationeryProposalSubView({ defaultTab = 'create' }: StationeryProposalSubViewProps) {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  const [proposals, setProposals] = useState<StationeryProposal[]>(() =>
    storage.getStationeryProposals()
  );
  const [stationeryCatalog, setStationeryCatalog] = useState<StationeryItem[]>(() =>
    storage.getStationeryItems().filter((item) => item.isActive)
  );

  const [activeTab, setActiveTab] = useState<'create' | 'list'>(defaultTab);

  // Check roles
  const isBOD = isSuperAdminOrBOD(currentUser);
  const isHRStaff =
    currentUser?.id === '1139' ||
    currentUser?.role === 'hr' ||
    (Boolean(currentUser?.department) && /hcns|nhân sự/i.test(currentUser!.department) && currentUser?.role !== 'manager');
  const isHRManager =
    currentUser?.id === '1867' ||
    (currentUser?.role === 'manager' && Boolean(currentUser?.department) && /hcns|nhân sự/i.test(currentUser!.department));
  const canManageOthers = isBOD || isHRStaff || isHRManager;
  const canManageCatalog = isBOD || currentUser?.role === 'admin' || currentUser?.id === '1139' || currentUser?.id === '1867' || (Boolean(currentUser?.department) && /hcns|nhân sự/i.test(currentUser!.department));

  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    canManageOthers ? 'all' : 'my'
  );

  // Form State
  const [department, setDepartment] = useState(() => currentUser?.department || 'Văn Phòng');
  const [formRows, setFormRows] = useState<ProposalFormRow[]>([
    { itemId: '', itemName: '', unit: '', monthlyQuota: undefined, quantity: 1, notes: '' },
  ]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Table Filter & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal State
  const [selectedProposal, setSelectedProposal] = useState<StationeryProposal | null>(null);
  const [approverComment, setApproverComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (selectedProposal) {
      const initialMap: Record<string, number> = {};
      selectedProposal.items.forEach((it) => {
        initialMap[it.itemId] = it.approvedQuantity !== undefined ? it.approvedQuantity : it.quantity;
      });
      setApprovedQuantities(initialMap);
    } else {
      setApprovedQuantities({});
    }
  }, [selectedProposal]);

  const canEditApprovedQuantity = Boolean(
    selectedProposal &&
      ((selectedProposal.status === 'pending_hr' && (isHRStaff || isBOD)) ||
        (selectedProposal.status === 'pending_manager' && (isHRManager || isBOD)))
  );

  // Storage listener to sync across tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setProposals(storage.getStationeryProposals());
      setStationeryCatalog(storage.getStationeryItems().filter((item) => item.isActive));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-select proposal from URL params (e.g. from email link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlType = urlParams.get('type');
      const urlId = urlParams.get('id');
      const action = urlParams.get('action');
      if (urlType === 'stationery' && urlId) {
        const found = proposals.find((p) => p.id.toLowerCase() === urlId.toLowerCase());
        if (found) {
          setSelectedProposal(found);
          if (action === 'reject') {
            setIsRejecting(true);
          }
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [proposals]);

  // Update selected proposal if proposals list updates
  useEffect(() => {
    if (selectedProposal) {
      const fresh = proposals.find((p) => p.id === selectedProposal.id);
      if (fresh) setSelectedProposal(fresh);
    }
  }, [proposals]);

  const departments = useMemo(() => storage.getDepartments(), []);

  // Filtered proposals by permissions & scope
  const userVisibleProposals = useMemo(() => {
    return filterUserStationeryProposals(proposals, currentUser, scopeFilter);
  }, [proposals, currentUser, scopeFilter]);

  // Count pending for current user
  const pendingCountForUser = useMemo(() => {
    if (!currentUser) return 0;
    return userVisibleProposals.filter((p) => {
      if ((isHRStaff || isBOD) && p.status === 'pending_hr') return true;
      if ((isHRManager || isBOD) && p.status === 'pending_manager') return true;
      return false;
    }).length;
  }, [userVisibleProposals, currentUser, isHRStaff, isHRManager, isBOD]);

  // Final filtered list with search & status
  const filteredProposals = useMemo(() => {
    const q = search.toLowerCase().trim();
    return userVisibleProposals.filter((item) => {
      const itemsSummary = item.items.map((i) => `${i.itemId} ${i.itemName}`).join(' ').toLowerCase();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        itemsSummary.includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userVisibleProposals, search, statusFilter]);

  // Add Item Row
  const handleAddRow = () => {
    setFormRows((prev) => [
      ...prev,
      { itemId: '', itemName: '', unit: '', monthlyQuota: undefined, quantity: 1, notes: '' },
    ]);
  };

  // Remove Item Row
  const handleRemoveRow = (index: number) => {
    if (formRows.length <= 1) {
      showToast({ type: 'warning', title: 'Thông báo', message: 'Phiếu đề xuất phải có ít nhất 1 mặt hàng.' });
      return;
    }
    setFormRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Select Item in a row
  const handleSelectItem = (index: number, itemId: string) => {
    const found = stationeryCatalog.find((c) => c.id === itemId);
    setFormRows((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        if (!found) {
          return { ...row, itemId: '', itemName: '', unit: '', monthlyQuota: undefined };
        }
        return {
          ...row,
          itemId: found.id,
          itemName: found.name,
          unit: found.unit,
          monthlyQuota: found.monthlyQuota,
        };
      })
    );
  };

  // Update quantity in a row
  const handleUpdateQuantity = (index: number, val: number) => {
    setFormRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, quantity: Math.max(1, val) } : row))
    );
  };

  // Update notes in a row
  const handleUpdateRowNotes = (index: number, notes: string) => {
    setFormRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, notes: capitalizeFirstLetter(notes) } : row))
    );
  };

  // Submit Stationery Proposal
  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate rows
    const validRows = formRows.filter((r) => r.itemId && r.quantity > 0);
    if (validRows.length === 0) {
      showToast({
        type: 'warning',
        title: 'Thiếu thông tin mặt hàng',
        message: 'Vui lòng chọn ít nhất một mặt hàng văn phòng phẩm hợp lệ và số lượng > 0.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const allProposals = storage.getStationeryProposals();
      const newId = generateDocId('VPP', allProposals);
      const now = new Date().toISOString();

      const items: StationeryProposalItem[] = validRows.map((r) => ({
        itemId: r.itemId,
        itemName: r.itemName,
        unit: r.unit,
        monthlyQuota: r.monthlyQuota,
        quantity: r.quantity,
        notes: r.notes.trim() || undefined,
      }));

      // 3 Workflow Steps:
      // Bước 1: Nhân viên gửi đề xuất
      // Bước 2: Chuyên viên HCNS (1139 - Võ Thị Tuyết)
      // Bước 3: Trưởng phòng HCNS (1867 - Trương Anh Như Quỳnh)
      const steps: StationeryStep[] = [
        {
          step: 1,
          title: 'Bạn gửi đề xuất',
          roleRequired: 'employee',
          approverId: currentUser.id,
          approverName: currentUser.name,
          status: 'completed',
          updatedAt: now,
          comment: 'Đã gửi đề xuất văn phòng phẩm',
        },
        {
          step: 2,
          title: 'Chuyên viên HCNS tiếp nhận',
          subTitle: 'Võ Thị Tuyết (1139)',
          roleRequired: 'hr',
          approverId: '1139',
          approverName: 'Võ Thị Tuyết',
          approverEmail: 'tuyet.vo@longkhai.com.vn',
          status: 'pending',
        },
        {
          step: 3,
          title: 'Trưởng phòng HCNS duyệt',
          subTitle: 'Trương Anh Như Quỳnh (1867)',
          roleRequired: 'manager',
          approverId: '1867',
          approverName: 'Trương Anh Như Quỳnh',
          approverEmail: 'Quynh.truong@longkhai.com.vn',
          status: 'pending',
        },
      ];

      const activeEmailCfg = storage.getEmailConfig();
      const newProposal: StationeryProposal = {
        id: newId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: department.trim(),
        items,
        notes: generalNotes.trim() ? capitalizeFirstLetter(generalNotes.trim()) : undefined,
        receiverStaffId: '1139',
        receiverStaffName: 'Võ Thị Tuyết',
        receiverStaffEmail: 'tuyet.vo@longkhai.com.vn',
        managerId: '1867',
        managerName: 'Trương Anh Như Quỳnh',
        managerEmail: 'Quynh.truong@longkhai.com.vn',
        status: 'pending_hr',
        steps,
        currentStepIndex: 1, // At step 2: Chuyên viên HCNS (1139)
        createdAt: now,
        updatedAt: now,
        emailRelayUrl: activeEmailCfg.googleScriptUrl || undefined,
        emailConfig: {
          googleScriptUrl: activeEmailCfg.googleScriptUrl || undefined,
          senderName: activeEmailCfg.senderName || undefined,
          portalBaseUrl: activeEmailCfg.portalBaseUrl || undefined,
        },
      };

      storage.saveStationeryProposal(newProposal, { id: currentUser.id, name: currentUser.name });
      setProposals(storage.getStationeryProposals());

      // Send email to Step 2 receiver (1139 - Võ Thị Tuyết)
      dispatchStationeryApprovalEmail(newProposal, 'hr').catch((err) =>
        console.warn('Dispatch stationery email error:', err)
      );

      showToast({
        type: 'success',
        title: 'Gửi đề xuất thành công',
        message: `Phiếu đề xuất ${newId} đã được tạo và chuyển tới Chuyên viên HCNS Võ Thị Tuyết (1139) tiếp nhận.`,
      });

      // Reset form
      setFormRows([{ itemId: '', itemName: '', unit: '', quantity: 1, notes: '' }]);
      setGeneralNotes('');
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
    const updatedItems = selectedProposal.items.map((it) => ({
      ...it,
      approvedQuantity:
        approvedQuantities[it.itemId] !== undefined
          ? approvedQuantities[it.itemId]
          : (it.approvedQuantity ?? it.quantity),
    }));
    const updated: StationeryProposal = {
      ...selectedProposal,
      items: isApprove ? updatedItems : selectedProposal.items,
    };

    if (updated.status === 'pending_hr') {
      // Step 2: HR Staff action
      const stepIdx = 1;
      if (updated.steps[stepIdx]) {
        updated.steps[stepIdx].status = isApprove ? 'approved' : 'rejected';
        updated.steps[stepIdx].approverId = currentUser.id;
        updated.steps[stepIdx].approverName = currentUser.name;
        updated.steps[stepIdx].updatedAt = now;
        updated.steps[stepIdx].comment = isApprove
          ? approverComment.trim() || 'Chuyên viên HCNS đồng ý đề xuất và chuyển duyệt'
          : rejectionReason.trim() || 'Từ chối đề xuất';
      }

      updated.receiverStaffId = currentUser.id;
      updated.receiverStaffName = currentUser.name;
      updated.receiverApprovedAt = now;
      updated.receiverComment = approverComment.trim();

      if (isApprove) {
        updated.status = 'pending_manager';
        updated.currentStepIndex = 2; // Step 3: TP HCNS duyệt

        // Dispatch email to TP HCNS (1867)
        dispatchStationeryApprovalEmail(updated, 'manager').catch((err) =>
          console.warn('Dispatch email to TP HCNS error:', err)
        );

        showToast({
          type: 'success',
          title: 'Tiếp nhận thành công',
          message: `Đề xuất ${updated.id} đã được chuyển tới Trưởng phòng HCNS duyệt.`,
        });
      } else {
        updated.status = 'rejected';
        updated.rejectionReason = rejectionReason.trim() || 'Chuyên viên HCNS từ chối';
        updated.rejectedBy = currentUser.name;
        updated.rejectedAt = now;
        showToast({
          type: 'info',
          title: 'Đã từ chối',
          message: `Đề xuất ${updated.id} đã bị từ chối.`,
        });
      }
    } else if (updated.status === 'pending_manager') {
      // Step 3: TP HCNS action
      const stepIdx = 2;
      if (updated.steps[stepIdx]) {
        updated.steps[stepIdx].status = isApprove ? 'completed' : 'rejected';
        updated.steps[stepIdx].approverId = currentUser.id;
        updated.steps[stepIdx].approverName = currentUser.name;
        updated.steps[stepIdx].updatedAt = now;
        updated.steps[stepIdx].comment = isApprove
          ? approverComment.trim() || 'Trưởng phòng HCNS duyệt cấp phát'
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
          message: `Đề xuất ${updated.id} đã được phê duyệt cấp phát hoàn tất!`,
        });
      } else {
        updated.status = 'rejected';
        updated.rejectionReason = rejectionReason.trim() || 'Trưởng phòng HCNS từ chối';
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
    storage.saveStationeryProposal(updated, { id: currentUser.id, name: currentUser.name });
    setProposals(storage.getStationeryProposals());
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
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Đề xuất văn phòng phẩm
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lập phiếu yêu cầu cung cấp văn phòng phẩm định kỳ hoặc phát sinh cho bộ phận
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
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
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
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Theo dõi đề xuất</span>
            {pendingCountForUser > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px]">
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
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Trình tự phê duyệt đề xuất văn phòng phẩm:</span>
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
                Chọn danh mục mặt hàng VPP & số lượng
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
                Chuyên viên HCNS tiếp nhận
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                Võ Thị Tuyết (1139)
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
                Trưởng phòng HCNS duyệt
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Trương Anh Như Quỳnh (1867) &bull; Hoàn tất
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: TẠO ĐỀ XUẤT MỚI */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-5xl mx-auto">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>Thông tin phiếu đề xuất văn phòng phẩm</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Người tạo phiếu: <b>{currentUser?.name}</b> (Mã NV: {currentUser?.id}) &bull; Người nhận phiếu mặc định: <b>Võ Thị Tuyết (1139) - Chuyên viên HCNS</b>.
            </p>
          </div>

          <form onSubmit={handleCreateProposal} className="space-y-6">
            {/* Header Form Row: Tổ/Bộ phận & Người nhận mặc định */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Tổ / Bộ phận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tổ / Bộ phận</span>
                  <span className="text-[10px] font-normal text-slate-400 ml-1">
                    (Bộ phận thực tế của nhân viên)
                  </span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Field 2: Người nhận mặc định */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>Người nhận phiếu mặc định</span>
                </label>
                <div className="px-4 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-medium text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span>Võ Thị Tuyết (1139) - Chuyên viên HCNS</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">tuyet.vo@longkhai.com.vn</span>
                </div>
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-500" />
                  <span>Danh mục văn phòng phẩm đề xuất</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {canManageCatalog && (
                    <button
                      type="button"
                      onClick={() => setIsCatalogModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="Chỉnh sửa mã VPP, tên, đơn vị tính và định mức cấp phát hàng tháng"
                    >
                      <Settings className="w-3.5 h-3.5 text-blue-500" />
                      <span>Quản lý danh mục & Định mức</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm mặt hàng</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">STT</th>
                      <th className="px-3 py-2.5 w-56">Mã VPP</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Tên văn phòng phẩm</th>
                      <th className="px-3 py-2.5 w-20 text-center">ĐVT</th>
                      <th className="px-3 py-2.5 w-28 text-center text-blue-600 dark:text-blue-400">Định mức</th>
                      <th className="px-3 py-2.5 w-28 text-center">Số lượng đặt</th>
                      <th className="px-3 py-2.5 min-w-[150px]">Ghi chú</th>
                      <th className="px-3 py-2.5 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {formRows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-3 py-2.5 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={row.itemId}
                            onChange={(e) => handleSelectItem(index, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                          >
                            <option value="">-- Chọn mã VPP --</option>
                            {stationeryCatalog.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.id} - {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {row.itemName ? (
                            <span className="font-semibold">{row.itemName}</span>
                          ) : (
                            <span className="text-slate-400 italic">Tự động điền theo mã VPP</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400 font-medium">
                          {row.unit ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                              {row.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {row.monthlyQuota !== undefined && row.monthlyQuota !== null ? (
                            <span
                              className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 inline-flex items-center gap-1"
                              title={`Định mức: ${row.monthlyQuota} ${row.unit}/tháng`}
                            >
                              {row.monthlyQuota} {row.unit}
                            </span>
                          ) : row.itemId ? (
                            <span className="text-slate-400 text-[11px] italic">Không giới hạn</span>
                          ) : (
                            <span className="text-slate-400 italic">--</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              value={row.quantity}
                              onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                              className={`w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                row.monthlyQuota !== undefined && row.quantity > row.monthlyQuota
                                  ? 'border-amber-400 text-amber-600 dark:text-amber-400 ring-1 ring-amber-300'
                                  : 'border-slate-200 dark:border-slate-700'
                              }`}
                            />
                            {row.monthlyQuota !== undefined && row.quantity > row.monthlyQuota && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400 text-center font-semibold mt-0.5">
                                Vượt định mức ({row.quantity - row.monthlyQuota})
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            placeholder="Ghi chú thêm..."
                            value={row.notes}
                            onChange={(e) => handleUpdateRowNotes(index, e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={formRows.length <= 1}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30 cursor-pointer"
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ghi chú chung cho phiếu đề xuất (tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Nhập lý do sử dụng, thời gian cần nhận hàng hoặc lưu ý cho HCNS..."
                value={generalNotes}
                onChange={(e) => setGeneralNotes(capitalizeFirstLetter(e.target.value))}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormRows([{ itemId: '', itemName: '', unit: '', quantity: 1, notes: '' }]);
                  setGeneralNotes('');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Nhập lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi đề xuất văn phòng phẩm'}</span>
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
                placeholder="Tìm mã phiếu, người gửi, mặt hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
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
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
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
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_hr">Chờ NV HCNS (1139) duyệt</option>
                  <option value="pending_manager">Chờ TP HCNS duyệt</option>
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
                    <th className="px-4 py-3">Mặt hàng đề xuất</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProposals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p>Không có đề xuất văn phòng phẩm nào phù hợp</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProposals.map((item) => {
                      const badge = STATIONERY_STATUS_BADGES[item.status] || STATIONERY_STATUS_BADGES.pending_hr;
                      const needsHRAction = (isHRStaff || isBOD) && item.status === 'pending_hr';
                      const needsManagerAction = (isHRManager || isBOD) && item.status === 'pending_manager';
                      const isActionNeeded = needsHRAction || needsManagerAction;

                      const itemsSummary = item.items
                        .map((i) => `${i.itemName} (${i.quantity} ${i.unit})`)
                        .join(', ');

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isActionNeeded ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              {isActionNeeded && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
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
                          <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 max-w-[280px] truncate" title={itemsSummary}>
                            <span className="font-medium text-slate-900 dark:text-white">{item.items.length} món:</span> {itemsSummary}
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
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
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
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Phiếu đề xuất VPP #{selectedProposal.id}
                    </h3>
                    {(() => {
                      const badge = STATIONERY_STATUS_BADGES[selectedProposal.status] || STATIONERY_STATUS_BADGES.pending_hr;
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
                  Tiến trình phê duyệt (3 bước)
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
                            ? 'bg-blue-500/10 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 ring-1 ring-blue-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px]">Bước {st.step}</span>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          {isCurrent && <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
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
                    Mã NV: <b>{selectedProposal.employeeId}</b>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Tổ / Bộ phận</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.department}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Người tiếp nhận: <b>Võ Thị Tuyết (1139)</b>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span className="uppercase tracking-wider">Danh mục mặt hàng đề xuất</span>
                  <span className="text-[11px] text-slate-400">{selectedProposal.items.length} mặt hàng</span>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 w-12 text-center">STT</th>
                        <th className="px-3 py-2 w-32">Mã VPP</th>
                        <th className="px-3 py-2">Tên văn phòng phẩm</th>
                        <th className="px-3 py-2 w-20 text-center">ĐVT</th>
                        <th className="px-3 py-2 w-28 text-center text-blue-600 dark:text-blue-400">Định mức</th>
                        <th className="px-3 py-2 w-24 text-center">Số lượng</th>
                        <th className="px-3 py-2 w-28 text-center text-emerald-600 dark:text-emerald-400">Số lượng duyệt</th>
                        <th className="px-3 py-2">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {selectedProposal.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                            {it.itemId}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {it.itemName}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                              {it.unit}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            {it.monthlyQuota !== undefined && it.monthlyQuota !== null ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 inline-flex items-center">
                                {it.monthlyQuota} {it.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">--</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">
                            {it.quantity}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {canEditApprovedQuantity ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={approvedQuantities[it.itemId] ?? it.approvedQuantity ?? it.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0);
                                    setApprovedQuantities((prev) => ({ ...prev, [it.itemId]: val }));
                                  }}
                                  className="w-16 px-2 py-1 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs print:hidden shadow-2xs focus:ring-1 focus:ring-emerald-500"
                                />
                                <span className="hidden print:inline font-bold text-emerald-700 text-xs">
                                  {approvedQuantities[it.itemId] ?? it.approvedQuantity ?? it.quantity}
                                </span>
                              </div>
                            ) : it.approvedQuantity !== undefined ? (
                              <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center">
                                {it.approvedQuantity}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">
                                {selectedProposal.status === 'completed' ? it.quantity : '--'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-500 italic">
                            {it.notes || '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Overall notes */}
              {selectedProposal.notes && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    Ghi chú của người đề xuất
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    {selectedProposal.notes}
                  </div>
                </div>
              )}

              {/* Step 2 comments */}
              {selectedProposal.receiverApprovedAt && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 text-xs">
                  <div className="text-blue-800 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    Ý kiến tiếp nhận của Chuyên viên HCNS (Võ Thị Tuyết)
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    {selectedProposal.receiverComment || 'Đã tiếp nhận và chuyển duyệt.'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Thời gian: {formatDateTime(selectedProposal.receiverApprovedAt)}
                  </div>
                </div>
              )}

              {/* Step 3 comments */}
              {selectedProposal.managerApprovedAt && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                  <div className="text-emerald-800 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    Ý kiến phê duyệt của Trưởng phòng HCNS ({selectedProposal.managerName || 'Trương Anh Như Quỳnh'})
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">
                    {selectedProposal.managerComment || 'Đồng ý cấp phát theo số lượng yêu cầu.'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Thời gian: {formatDateTime(selectedProposal.managerApprovedAt)}
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
                    Người từ chối: <b>{selectedProposal.rejectedBy || 'Phòng HCNS'}</b>
                    {selectedProposal.rejectedAt && ` (${formatDateTime(selectedProposal.rejectedAt)})`}
                  </div>
                  <div className="mt-1">
                    Lý do: <i>{selectedProposal.rejectionReason}</i>
                  </div>
                </div>
              )}

              {/* ACTION SECTIONS ACCORDING TO ROLE & STEP */}

              {/* Step 2 Actions: HR Staff (1139) Action */}
              {selectedProposal.status === 'pending_hr' && (isHRStaff || isBOD) && (
                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-300 dark:border-blue-700/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Dành cho Chuyên viên HCNS (1139): Tiếp nhận & Chuyển duyệt</span>
                  </div>

                  {!isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ghi chú tiếp nhận (tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập ghi chú gửi Trưởng phòng HCNS..."
                          value={approverComment}
                          onChange={(e) => setApproverComment(capitalizeFirstLetter(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Tiếp nhận & Chuyển Trưởng phòng HCNS duyệt</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
                          Lý do từ chối đề xuất (*):
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Nhập lý do từ chối để nhân viên nắm thông tin..."
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

              {/* Step 3 Actions: HR Manager (1867) Action */}
              {selectedProposal.status === 'pending_manager' && (isHRManager || isBOD) && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Dành cho Trưởng phòng HCNS: Phê duyệt cấp phát VPP</span>
                  </div>

                  {!isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ý kiến phê duyệt (tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Đồng ý duyệt cấp phát..."
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
                          <span>Phê duyệt & Hoàn tất cấp phát</span>
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

      {/* Catalog Management Modal */}
      {canManageCatalog && (
        <StationeryCatalogModal
          isOpen={isCatalogModalOpen}
          onClose={() => setIsCatalogModalOpen(false)}
          onCatalogUpdated={() => {
            setStationeryCatalog(storage.getStationeryItems().filter((item) => item.isActive));
          }}
        />
      )}
    </div>
  );
}
