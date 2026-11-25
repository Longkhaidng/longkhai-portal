'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  RepairProposal,
  RepairProposalStatus,
  RepairStep,
  ProposalAttachment,
  isProposalAttachmentExpired,
  getProposalAttachmentRemainingText,
  ATTACHMENT_MAX_SIZE_BYTES,
  ATTACHMENT_EXPIRY_DAYS,
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
import {
  dispatchApprovalEmail,
  dispatchMaintenanceNotificationEmail,
  dispatchBODNotificationEmail,
} from '@/lib/email';
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
  Paperclip,
  Upload,
  X,
  ExternalLink,
  ImageOff,
  Image as ImageIcon,
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

export interface RepairProposalSubViewProps {
  defaultTab?: 'create' | 'list';
  isOpenCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

export function RepairProposalSubView({
  defaultTab = 'list',
  isOpenCreateModal,
  onCloseCreateModal,
}: RepairProposalSubViewProps) {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();

  const [proposals, setProposals] = useState<RepairProposal[]>(() =>
    storage.getRepairProposals()
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(
    () => defaultTab === 'create' || Boolean(isOpenCreateModal)
  );

  useEffect(() => {
    if (isOpenCreateModal !== undefined) {
      setShowCreateModal(isOpenCreateModal);
    }
  }, [isOpenCreateModal]);

  const handleCloseModal = () => {
    setShowCreateModal(false);
    onCloseCreateModal?.();
  };

  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    isApproverRole(currentUser) || isSuperAdminOrBOD(currentUser) || isMaintenanceStaff(currentUser)
      ? 'all'
      : 'my'
  );

  // Form State
  const [department, setDepartment] = useState(() => currentUser?.department || 'Chung');
  const [location, setLocation] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [attachments, setAttachments] = useState<ProposalAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Process selected files for attachment (< 1MB, image/PDF)
  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    files.forEach((file) => {
      // 1. Kiểm tra kích thước nhỏ hơn 1MB (1,048,576 bytes)
      if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
        showToast({
          type: 'warning',
          title: 'Tệp quá dung lượng',
          message: `Tệp "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB) vượt quá giới hạn 1MB. Vui lòng chọn tệp nhỏ hơn 1MB.`,
        });
        return;
      }

      // 2. Kiểm tra định dạng: Ảnh hoặc PDF
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isImg && !isPdf) {
        showToast({
          type: 'warning',
          title: 'Định dạng không hỗ trợ',
          message: `Tệp "${file.name}" không hợp lệ. Hệ thống chỉ chấp nhận hình ảnh (PNG, JPG, WEBP) hoặc file PDF.`,
        });
        return;
      }

      // Đọc file thành Base64 Data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const now = new Date();
        const expiresDate = new Date(now.getTime() + ATTACHMENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const newAtt: ProposalAttachment = {
          id: `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          data: dataUrl,
          uploadedAt: now.toISOString(),
          expiresAt: expiresDate.toISOString(),
          isExpired: false,
        };

        setAttachments((prev) => [...prev, newAtt]);
        showToast({
          type: 'success',
          title: 'Đã đính kèm tệp',
          message: `Đã thêm "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Tệp sẽ tự động xóa sau 7 ngày.`,
        });
      };
      reader.onerror = () => {
        showToast({
          type: 'error',
          title: 'Lỗi đọc tệp',
          message: `Không thể đọc nội dung tệp "${file.name}".`,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const openAttachment = (att: ProposalAttachment) => {
    if (!att.data) {
      showToast({
        type: 'warning',
        title: 'Tệp đã hết hạn',
        message: 'Tệp đính kèm này đã tự động xóa khỏi hệ thống sau 7 ngày.',
      });
      return;
    }

    try {
      if (att.data.startsWith('data:')) {
        const [header, base64] = att.data.split(',');
        const mime = header.match(/:(.*?);/)?.[1] || att.type;
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(att.data, '_blank');
      }
    } catch {
      window.open(att.data, '_blank');
    }
  };

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

  // Auto-select proposal from URL params (e.g. from email link)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlType = urlParams.get('type');
      const urlId = urlParams.get('id');
      const action = urlParams.get('action');
      if (urlType === 'repair' && urlId) {
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

      const userDept = (currentUser?.department || department || 'Chung').trim();
      // Find department head for email
      const deptUsers = allUsers.filter(
        (u) => u.department && u.department.toLowerCase() === userDept.toLowerCase()
      );
      const managerUser =
        deptUsers.find((u) => u.role === 'manager' && u.email) ||
        allUsers.find((u) => u.id === currentUser.departmentHeadId && u.email) ||
        allUsers.find((u) => u.role === 'admin' && u.email);

      const managerEmail = currentUser.departmentHeadEmail || managerUser?.email || '';
      const managerName = managerUser?.name || 'Trưởng bộ phận';

      // 4 Workflow Steps
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

      const activeEmailCfg = storage.getEmailConfig();
      const newProposal: RepairProposal = {
        id: newId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: userDept,
        location: capitalizeFirstLetter(location.trim()),
        issueDescription: capitalizeFirstLetter(issueDescription.trim()),
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'pending_manager',
        steps,
        currentStepIndex: 1, // At step 2: Trưởng bộ phận duyệt
        createdAt: now,
        updatedAt: now,
        emailRelayUrl: activeEmailCfg.googleScriptUrl || undefined,
        emailConfig: {
          googleScriptUrl: activeEmailCfg.googleScriptUrl || undefined,
          senderName: activeEmailCfg.senderName || undefined,
          portalBaseUrl: activeEmailCfg.portalBaseUrl || undefined,
        },
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
              { label: 'Thời gian gửi', value: formatDateTime(now) },
            ],
            attachments: newProposal.attachments,
          },
        }).catch((err) => console.warn('Email dispatch error:', err));
      }

      showToast({
        type: 'success',
        title: 'Gửi đề xuất thành công',
        message: `Phiếu đề xuất ${newId} đã được tạo và chuyển tới Trưởng bộ phận duyệt qua email.`,
      });

      // Reset form & close modal
      setLocation('');
      setIssueDescription('');
      setAttachments([]);
      handleCloseModal();
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
      updated.status = 'maintenance_pending';
      updated.currentStepIndex = 2; // Move to Step 3: Cơ điện sửa chữa

      // 1. Dispatch notification email to Head of Maintenance
      dispatchMaintenanceNotificationEmail(updated).catch((err) =>
        console.warn('Maintenance notification email error:', err)
      );

      // 2. Dispatch FYI notification email to BOD (Ban Giám Đốc)
      dispatchBODNotificationEmail(updated).catch((err) =>
        console.warn('BOD notification email error:', err)
      );

      showToast({
        type: 'success',
        title: 'Phê duyệt thành công',
        message: `Đề xuất ${updated.id} đã được duyệt và chuyển sang cho Bộ phận Cơ điện, đồng thời thông báo đến BGĐ.`,
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

      {/* Sub Header & Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Đề xuất sửa chữa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gửi đề xuất sửa chữa máy móc thiết bị, cơ sở vật chất tới Trưởng bộ phận & Đội Cơ điện
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {pendingCountForUser > 0 && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ duyệt: {pendingCountForUser}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đề xuất mới</span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH ĐỀ XUẤT (THEO DÕI ĐỀ XUẤT - Luôn hiển thị mặc định) */}
      <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm mã phiếu, người gửi, khu vực, nội dung..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
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
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isManagerOrTL ? 'Phiếu bộ phận' : 'Tất cả đơn'}
                  </button>
                </div>
              )}

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending_manager">Chờ TBP duyệt</option>
                  <option value="maintenance_pending">Cơ điện đang xử lý</option>
                  <option value="pending_confirmation">Chờ bạn nghiệm thu</option>
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

          {/* Proposals Table - Dual Responsive View */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Mobile Card View (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
              {filteredProposals.length === 0 ? (
                <div className="px-4 py-12 text-center text-slate-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                  <p className="text-xs">Không có đề xuất nào phù hợp</p>
                </div>
              ) : (
                filteredProposals.map((item) => {
                  const badge = REPAIR_STATUS_BADGES[item.status] || REPAIR_STATUS_BADGES.pending_manager;
                  const isCreator = currentUser?.id.toLowerCase() === item.employeeId.toLowerCase();
                  const needsConfirmation = isCreator && item.status === 'pending_confirmation';
                  const needsManager = isManagerOrTL && item.status === 'pending_manager';
                  const needsMaintenance = isMaintenance && item.status === 'maintenance_pending';
                  const isActionNeeded = needsConfirmation || needsManager || needsMaintenance;

                  return (
                    <div
                      key={`m-rp-${item.id}`}
                      onClick={() => setSelectedProposal(item)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800/70 transition-colors cursor-pointer space-y-2.5 ${
                        isActionNeeded ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isActionNeeded && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                          )}
                          <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                            {item.id}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{item.employeeName}</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            KV: <strong className="text-slate-800 dark:text-slate-200">{item.location}</strong>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.employeeId} &bull; {item.department}
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        {item.issueDescription}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                        <span className="text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProposal(item);
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isActionNeeded
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isActionNeeded ? 'Xử lý ngay' : 'Chi tiết'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px] rounded-2xl scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 shadow-xs border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Mã phiếu</th>
                    <th className="px-4 py-3">Người đề xuất</th>
                    <th className="px-4 py-3">Tổ / Bộ phận</th>
                    <th className="px-4 py-3">Khu vực</th>
                    <th className="px-4 py-3">Tình trạng sự việc</th>
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
                      const badge = REPAIR_STATUS_BADGES[item.status] || REPAIR_STATUS_BADGES.pending_manager;
                      const isCreator = currentUser?.id.toLowerCase() === item.employeeId.toLowerCase();
                      const needsConfirmation = isCreator && item.status === 'pending_confirmation';
                      const needsManager = isManagerOrTL && item.status === 'pending_manager';
                      const needsMaintenance = isMaintenance && item.status === 'maintenance_pending';
                      const isActionNeeded = needsConfirmation || needsManager || needsMaintenance;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isActionNeeded ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              {isActionNeeded && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
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
                          <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate">
                            {item.location}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 max-w-[220px] truncate" title={item.issueDescription}>
                            {item.issueDescription}
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
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
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

      {/* MODAL: TẠO ĐỀ XUẤT MỚI (Màn hình riêng giống như tạo phiếu đăng ký thực phẩm) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header (Cố định ở trên cùng khi cuộn/lướt) */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Thông tin đề xuất
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-2xl font-bold transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 text-xs">
              {/* Field 1: Khu vực */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Khu vực</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập vị trí khu vực, máy móc hoặc thiết bị cần sửa chữa..."
                  value={location}
                  onChange={(e) => setLocation(capitalizeFirstLetter(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
                />
              </div>

              {/* Field 2: Tình trạng sự việc */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tình trạng sự việc</span>
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Mô tả chi tiết tình trạng hỏng hóc, sự cố, nguyên nhân (nếu biết)..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(capitalizeFirstLetter(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              {/* Field 3: Đính kèm file ảnh, PDF (< 1MB, tự xóa sau 7 ngày) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đính kèm hình ảnh, PDF</span>
                    <span className="text-[11px] font-normal text-slate-400">(Không bắt buộc)</span>
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Tối đa 1MB/file • Tự động xóa sau 7 ngày
                  </span>
                </div>

                {/* Dropzone & file input */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 text-slate-700 dark:text-slate-200">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-xs">Bấm để chọn file hoặc kéo thả ảnh, PDF vào đây</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Chấp nhận file hình ảnh (PNG, JPG, WEBP) hoặc file PDF &bull; Kích thước &lt; 1MB
                  </p>
                </div>

                {/* Danh sách tệp đã chọn */}
                {attachments.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {attachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {att.type.startsWith('image/') ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600">
                              <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0 font-bold text-[10px]">
                              PDF
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{att.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                              <span>{(att.size / 1024).toFixed(1)} KB</span>
                              <span>&bull;</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">Tự xóa sau 7 ngày</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachment(idx);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Xóa tệp đính kèm này"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trình tự phê duyệt chuyển xuống phía dưới tình trạng sự việc theo yêu cầu */}
              <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 sm:p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Trình tự phê duyệt đề xuất sửa chữa máy móc thiết bị:</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">4 bước khép kín</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  {/* Step 1 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Bạn gửi đề xuất</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Nhập khu vực, sự việc &amp; gửi</div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Trưởng bộ phận duyệt</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">qua email (gửi tiếp Cơ điện &amp; BGĐ)</div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Cơ điện sửa chữa</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Khắc phục &amp; bàn giao</div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Bạn xác nhận hoàn tất</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">tab &quot;Theo dõi đề xuất&quot;</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Lưu ý về quy trình:</span> Sau khi gửi, phiếu đề xuất sẽ tự động gửi email cho Trưởng bộ phận của bạn để xem xét và phê duyệt. Khi Trưởng bộ phận duyệt, phiếu sẽ chuyển tiếp đến Trưởng bộ phận Cơ điện và đồng thời gửi thông tin thông báo cho Ban Giám Đốc.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocation('');
                    setIssueDescription('');
                    setAttachments([]);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Nhập lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi đề xuất...' : 'Gửi đề xuất sửa chữa'}</span>
                </button>
              </div>
            </form>
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
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Phiếu đề xuất sửa chữa #{selectedProposal.id}
                    </h3>
                    {(() => {
                      const badge = REPAIR_STATUS_BADGES[selectedProposal.status] || REPAIR_STATUS_BADGES.pending_manager;
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
                    setManagerComment('');
                    setRejectionReason('');
                    setMaintenanceNotes('');
                    setCreatorFeedback('');
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
                  Tiến trình xử lý (4 bước)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
                            ? 'bg-amber-500/10 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 ring-1 ring-amber-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px]">Bước {st.step}</span>
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                          {isCurrent && <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
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
                  <div className="text-slate-400 text-[11px] mb-1">Họ và tên nhân viên đề xuất</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.employeeName}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Mã nhân viên: <b>{selectedProposal.employeeId}</b>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">Tổ / Bộ phận</div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.department}
                  </div>
                </div>
              </div>

              {/* Location & Issue Description */}
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Khu vực máy móc thiết bị hỏng</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">
                    {selectedProposal.location}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tình trạng sự việc chi tiết</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {selectedProposal.issueDescription}
                  </div>
                </div>

                {/* Tệp đính kèm (Ảnh & PDF) */}
                {selectedProposal.attachments && selectedProposal.attachments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tệp đính kèm ({selectedProposal.attachments.length})</span>
                      </div>
                      <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
                        Tự động xóa sau 7 ngày kể từ lúc tạo
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedProposal.attachments.map((att) => {
                        const expired = isProposalAttachmentExpired(att) || !att.data;
                        const remainingText = getProposalAttachmentRemainingText(att);

                        return (
                          <div
                            key={att.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                              expired
                                ? 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {att.type.startsWith('image/') ? (
                                expired ? (
                                  <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                    <ImageOff className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => setPreviewImage(att.data)}
                                    className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600 cursor-pointer hover:opacity-80 transition-opacity"
                                    title="Bấm để xem ảnh lớn"
                                  >
                                    <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                                  </div>
                                )
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center shrink-0 font-bold text-xs">
                                  PDF
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white text-xs truncate" title={att.name}>
                                  {att.name}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{(att.size / 1024).toFixed(1)} KB</span>
                                  <span>&bull;</span>
                                  {expired ? (
                                    <span className="text-rose-500 font-medium">Đã xóa sau 7 ngày</span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{remainingText}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {!expired && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (att.type.startsWith('image/')) {
                                    setPreviewImage(att.data);
                                  } else {
                                    openAttachment(att);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Xem</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manager Review / Comment Info */}
                {selectedProposal.managerName && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-xs">
                    <div className="text-amber-800 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thông tin phê duyệt của Trưởng bộ phận</span>
                    </div>
                    {selectedProposal.managerComment && (
                      <div className="text-slate-800 dark:text-slate-200 mt-1 mb-1 whitespace-pre-wrap">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Ghi chú / Ý kiến:</span> {selectedProposal.managerComment}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Người duyệt: <b className="text-slate-700 dark:text-slate-300">{selectedProposal.managerName}</b>
                      {selectedProposal.managerApprovedAt && ` (${formatDateTime(selectedProposal.managerApprovedAt)})`}
                    </div>
                  </div>
                )}

                {/* Maintenance Notes */}
                {(selectedProposal.maintenanceNotes ||
                  selectedProposal.status === 'maintenance_pending' ||
                  selectedProposal.status === 'pending_confirmation' ||
                  selectedProposal.status === 'completed') && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                    <div className="text-blue-800 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kết quả sửa chữa của Bộ phận Cơ điện</span>
                    </div>
                    {selectedProposal.maintenanceNotes ? (
                      <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {selectedProposal.maintenanceNotes}
                      </div>
                    ) : (
                      <div className="italic text-slate-400">
                        Cơ điện đang tiến hành xử lý...
                      </div>
                    )}
                    {selectedProposal.maintenanceStaffName && (
                      <div className="text-[11px] text-slate-400 mt-2">
                        Nhân viên cơ điện phụ trách: <b>{selectedProposal.maintenanceStaffName}</b>
                        {selectedProposal.maintenanceCompletedAt &&
                          ` (Xong lúc: ${formatDateTime(selectedProposal.maintenanceCompletedAt)})`}
                      </div>
                    )}
                  </div>
                )}

                {/* Creator Confirmation */}
                {(selectedProposal.creatorFeedback || selectedProposal.creatorConfirmedAt) && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                    <div className="text-emerald-800 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ý kiến nghiệm thu của người đề xuất</span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {selectedProposal.creatorFeedback || 'Đã kiểm tra, thiết bị hoạt động bình thường.'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Thời gian xác nhận: {formatDateTime(selectedProposal.creatorConfirmedAt!)}
                    </div>
                  </div>
                )}

                {/* Rejection notice */}
                {selectedProposal.status === 'rejected' && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Đề xuất đã bị từ chối</span>
                    </div>
                    <div className="text-xs">
                      Người từ chối: <b>{selectedProposal.rejectedBy || 'Trưởng bộ phận'}</b>
                      {selectedProposal.rejectedAt && ` (${formatDateTime(selectedProposal.rejectedAt)})`}
                    </div>
                    <div className="text-xs mt-1">
                      Lý do: <i>{selectedProposal.rejectionReason}</i>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION SECTIONS ACCORDING TO ROLE & STEP */}

              {/* Step 2 Actions: Manager Approval */}
              {selectedProposal.status === 'pending_manager' && (isManagerOrTL || isBOD) && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    <span>Dành cho Trưởng bộ phận: Duyệt đề xuất sửa chữa</span>
                  </div>

                  {!isRejecting ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Ý kiến phê duyệt / Ghi chú cho Cơ điện (tùy chọn):
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập ý kiến chỉ đạo hoặc ghi chú gửi Cơ điện..."
                          value={managerComment}
                          onChange={(e) => setManagerComment(capitalizeFirstLetter(e.target.value))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                          onClick={() => handleManagerAction(true)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Duyệt & Chuyển sang Bộ phận Cơ điện</span>
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
                          onClick={() => handleManagerAction(false)}
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

              {/* Step 3 Actions: Maintenance Team Complete */}
              {selectedProposal.status === 'maintenance_pending' && (isMaintenance || isBOD) && (
                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-300 dark:border-blue-700/60 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Dành cho Bộ phận Cơ điện: Xác nhận hoàn tất sửa chữa</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Ghi chú kết quả sửa chữa & hướng dẫn bàn giao:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả công việc đã sửa chữa, linh kiện thay thế (nếu có)..."
                      value={maintenanceNotes}
                      onChange={(e) => setMaintenanceNotes(capitalizeFirstLetter(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleMaintenanceComplete}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã sửa xong & Bàn giao cho người đề xuất</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 Actions: Creator Confirm Completion */}
              {selectedProposal.status === 'pending_confirmation' &&
                currentUser?.id.toLowerCase() === selectedProposal.employeeId.toLowerCase() && (
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700/60 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Bước 4: Bạn xác nhận hoàn tất sửa chữa</span>
                    </div>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200">
                      Bộ phận Cơ điện đã báo sửa chữa xong thiết bị. Vui lòng kiểm tra thực tế tại khu vực và xác nhận hoàn tất.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Ý kiến nghiệm thu / Phản hồi (tùy chọn):
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Máy đã chạy tốt, cảm ơn bộ phận cơ điện..."
                        value={creatorFeedback}
                        onChange={(e) => setCreatorFeedback(capitalizeFirstLetter(e.target.value))}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleCreatorConfirm}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác nhận thiết bị đã hoạt động tốt (Hoàn tất)</span>
                      </button>
                    </div>
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

      {/* Lightbox Preview Modal for Image Attachments */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-3 border border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-300">Xem ảnh đính kèm</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center">
              <img
                src={previewImage}
                alt="Ảnh đính kèm"
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
