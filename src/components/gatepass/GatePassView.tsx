'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  GatePass,
  GatePassAsset,
  GatePassStatus,
  GatePassTimeType,
  GatePassReasonCategory,
  PERSONAL_REASONS,
  GATE_PASS_SHIFTS,
  OTHER_GATE_PASS_SHIFTS,
} from '@/types/gatePass';
import { ApprovalStep } from '@/types/leave';
import {
  QrCode,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Package,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  ScanLine,
  ArrowRight,
  LogOut,
  LogIn,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { formatDate, formatDateTime, generateDocId } from '@/lib/utils';
import { generateQrDataUrl, getQrConfirmUrl } from '@/lib/qr';
import { dispatchApprovalEmail, dispatchCBNotificationEmail } from '@/lib/email';
import { ToastContainer, useToast } from '@/components/common/Toast';
import {
  filterUserGatePasses,
  isApproverRole,
  isSuperAdminOrBOD,
  isSameDepartment,
  isSecurityRole,
  DocumentScope,
} from '@/lib/permissions';

export function GatePassView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [passes, setPasses] = useState<GatePass[]>(() => storage.getGatePasses());
  const [activeTab, setActiveTab] = useState<'list' | 'security_gate'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const isBOD = isSuperAdminOrBOD(currentUser);
  const isSecurity = isSecurityRole(currentUser);
  const canManageOthers = isApproverRole(currentUser) || isSecurity;
  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    isApproverRole(currentUser) || isSecurity ? 'all' : 'my'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [passRejectionReason, setPassRejectionReason] = useState('');

  // Listen for storage changes to keep gate passes synchronized
  React.useEffect(() => {
    const handleStorageChange = () => {
      setPasses(storage.getGatePasses());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Security Gate scan input
  const [scanCode, setScanCode] = useState('');
  const [scannedPass, setScannedPass] = useState<GatePass | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Helper for datetime-local
  const getTodayDateTimeStr = (hour = '08', minute = '00') => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hour}:${minute}`;
  };

  // New GatePass Form State
  const [timeType, setTimeType] = useState<GatePassTimeType>('nghi_giua_gio');
  const [departureTime, setDepartureTime] = useState(() => getTodayDateTimeStr('11', '30'));
  const [returnTime, setReturnTime] = useState(() => getTodayDateTimeStr('13', '00'));
  const [reasonCategory, setReasonCategory] = useState<GatePassReasonCategory>('ca_nhan');
  const [specificReason, setSpecificReason] = useState<string>('');
  const [companyReason, setCompanyReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [shift, setShift] = useState<string>('Ca HC (08:00 - 16:30)');
  const [otherShiftSelect, setOtherShiftSelect] = useState('');
  const [customShift, setCustomShift] = useState('');
  const [hasAssets, setHasAssets] = useState(false);
  const [assets, setAssets] = useState<GatePassAsset[]>([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetQty, setNewAssetQty] = useState(1);
  const [newAssetSerial, setNewAssetSerial] = useState('');

  // Approval selection options: Tổ trưởng duyệt & Trưởng bộ phận duyệt
  const [needTeamLeader, setNeedTeamLeader] = useState<boolean>(true);
  const [needManager, setNeedManager] = useState<boolean>(true);

  // Check if current user has team leader configured
  const hasTeamLeader = useMemo(() => {
    if (!currentUser) return false;
    const users = storage.getUsers();
    const fresh = users.find((u) => u.id.toLowerCase() === currentUser.id.toLowerCase()) || currentUser;
    return Boolean(fresh.teamLeaderId && fresh.teamLeaderId.trim());
  }, [currentUser, showCreateModal]);

  const handleOpenCreateModal = () => {
    const users = storage.getUsers();
    const fresh = (currentUser ? users.find((u) => u.id.toLowerCase() === currentUser.id.toLowerCase()) : null) || currentUser;
    const userHasTL = Boolean(fresh?.teamLeaderId && fresh.teamLeaderId.trim());
    setNeedTeamLeader(userHasTL);
    setNeedManager(true);
    setShowCreateModal(true);
  };

  const handleSelectTimeType = (type: GatePassTimeType) => {
    setTimeType(type);
    if (type === 'nghi_dau_gio') {
      if (!returnTime) setReturnTime(getTodayDateTimeStr('09', '00'));
    } else if (type === 'nghi_cuoi_gio') {
      if (!departureTime) setDepartureTime(getTodayDateTimeStr('15', '00'));
    } else if (type === 'nghi_giua_gio') {
      if (!departureTime) setDepartureTime(getTodayDateTimeStr('11', '30'));
      if (!returnTime) setReturnTime(getTodayDateTimeStr('13', '00'));
    }
  };

  // Add Asset item to list
  const handleAddAsset = () => {
    if (!newAssetName.trim()) return;
    const item: GatePassAsset = {
      id: `AST-${Date.now()}`,
      name: newAssetName.trim(),
      quantity: Number(newAssetQty) || 1,
      unit: 'cái',
      serialNumber: newAssetSerial.trim() || undefined,
    };
    setAssets([...assets, item]);
    setNewAssetName('');
    setNewAssetSerial('');
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  // Submit new Gate Pass
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const finalShift = shift === 'Ca khác' ? customShift.trim() : shift;
    if (!finalShift) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn ca làm việc',
        message: 'Vui lòng chọn ca làm việc của bạn (mục này bắt buộc).',
      });
      return;
    }

    if (reasonCategory === 'ca_nhan' && !specificReason) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn lý do',
        message: 'Vui lòng chọn lý do cụ thể trong danh sách.',
      });
      return;
    }
    if (reasonCategory === 'cong_ty' && !companyReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập công việc',
        message: 'Vui lòng nhập nội dung công việc hoặc địa điểm công tác.',
      });
      return;
    }
    if (reasonCategory === 'khac' && !otherReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Chưa nhập lý do',
        message: 'Vui lòng nhập lý do ra - vào cổng.',
      });
      return;
    }

    if (timeType === 'nghi_dau_gio' && !returnTime) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn thời gian',
        message: 'Vui lòng chọn thời gian vào cổng.',
      });
      return;
    }
    if (timeType === 'nghi_cuoi_gio' && !departureTime) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn thời gian',
        message: 'Vui lòng chọn thời gian ra cổng.',
      });
      return;
    }
    if (timeType === 'nghi_giua_gio' && (!departureTime || !returnTime)) {
      showToast({
        type: 'warning',
        title: 'Chưa chọn thời gian',
        message: 'Vui lòng chọn cả thời gian ra và thời gian vào.',
      });
      return;
    }

    let finalPurpose = '';
    let calculatedPassType: 'business' | 'personal' = 'personal';

    if (reasonCategory === 'ca_nhan') {
      finalPurpose = specificReason;
      calculatedPassType = 'personal';
    } else if (reasonCategory === 'cong_ty') {
      finalPurpose = `Công tác: ${companyReason.trim()}`;
      calculatedPassType = 'business';
    } else {
      finalPurpose = `Khác: ${otherReason.trim()}`;
      calculatedPassType = 'personal';
    }

    const docId = generateDocId('GP', passes);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const qrPayload = getQrConfirmUrl('gate_pass', docId, origin);

    const allUsers = storage.getUsers();
    const freshUser = allUsers.find((u) => u.id.toLowerCase() === currentUser.id.toLowerCase()) || currentUser;
    const targetHeadId = freshUser.departmentHeadId || currentUser.departmentHeadId;
    const deptHeadUser = targetHeadId
      ? allUsers.find((u) => u.id.toLowerCase() === targetHeadId.toLowerCase())
      : null;
    const managerName = deptHeadUser?.name || 'Trưởng bộ phận';

    const targetLeaderId = freshUser.teamLeaderId || currentUser.teamLeaderId;
    const teamLeaderUser = targetLeaderId
      ? allUsers.find((u) => u.id.toLowerCase() === targetLeaderId.toLowerCase())
      : null;
    const teamLeaderName = teamLeaderUser?.name || 'Tổ trưởng';

    // Auto-flush entered asset if user checked hasAssets and entered name without clicking 'Thêm'
    const finalAssets = [...assets];
    if (hasAssets && newAssetName.trim()) {
      finalAssets.push({
        id: `AST-${Date.now()}`,
        name: newAssetName.trim(),
        quantity: Number(newAssetQty) || 1,
        unit: 'cái',
        serialNumber: newAssetSerial.trim() || undefined,
      });
    }
    const shouldHaveAssets = hasAssets && finalAssets.length > 0;

    // Build approval steps according to selected options
    const steps: ApprovalStep[] = [];
    if (needTeamLeader) {
      steps.push({
        stepName: 'Tổ trưởng phê duyệt',
        roleRequired: 'team_leader',
        approverId: targetLeaderId || undefined,
        approverName: teamLeaderName,
        status: 'pending',
      });
    }
    if (needManager) {
      steps.push({
        stepName: 'Trưởng bộ phận phê duyệt',
        roleRequired: 'manager',
        approverId: targetHeadId || undefined,
        approverName: managerName,
        status: 'pending',
      });
    }
    steps.push({
      stepName: 'Bảo vệ xác nhận ra/vào cổng',
      roleRequired: 'security',
      approverName: 'Bảo vệ cổng',
      status: 'pending',
    });

    const newPass: GatePass = {
      id: docId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      purpose: finalPurpose,
      passType: calculatedPassType,
      timeType,
      reasonCategory,
      specificReason: reasonCategory === 'ca_nhan' ? specificReason : undefined,
      customReason: reasonCategory === 'cong_ty' ? companyReason.trim() : reasonCategory === 'khac' ? otherReason.trim() : undefined,
      shift: finalShift,
      hasAssets: shouldHaveAssets,
      assets: shouldHaveAssets ? finalAssets : [],
      estimatedDepartureTime: (timeType === 'nghi_giua_gio' || timeType === 'nghi_cuoi_gio') ? departureTime : undefined,
      estimatedReturnTime: (timeType === 'nghi_dau_gio' || timeType === 'nghi_giua_gio') ? returnTime : undefined,
      requireTeamLeader: needTeamLeader,
      requireManager: needManager,
      teamLeaderApproverId: needTeamLeader ? targetLeaderId || undefined : undefined,
      teamLeaderApproverName: needTeamLeader ? teamLeaderName : undefined,
      managerApproverId: needManager ? targetHeadId || undefined : undefined,
      managerApproverName: needManager ? managerName : undefined,
      currentStepIndex: 0,
      steps,
      status: 'pending',
      qrCodeData: qrPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveGatePass(newPass, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setShowCreateModal(false);

    // Determine first approver for email dispatch
    const isTeamLeaderFirst = needTeamLeader;
    const firstApproverRole = isTeamLeaderFirst ? 'Tổ trưởng' : 'Trưởng bộ phận';
    const firstApproverName = isTeamLeaderFirst ? teamLeaderName : managerName;
    const firstApproverEmail = isTeamLeaderFirst
      ? (teamLeaderUser?.email || '').trim()
      : (freshUser.departmentHeadEmail || currentUser.departmentHeadEmail || deptHeadUser?.email || '').trim();
    const firstApproverId = isTeamLeaderFirst ? targetLeaderId : targetHeadId;

    const timeDesc =
      timeType === 'nghi_dau_gio'
        ? `Nghỉ đầu giờ (Vào cổng: ${formatDateTime(returnTime)})`
        : timeType === 'nghi_cuoi_gio'
        ? `Nghỉ cuối giờ (Ra cổng: ${formatDateTime(departureTime)})`
        : `Nghỉ trong giờ làm việc (Ra: ${formatDateTime(departureTime)} - Vào: ${formatDateTime(returnTime)})`;

    if (firstApproverEmail) {
      dispatchApprovalEmail({
        toEmail: firstApproverEmail,
        managerName: firstApproverName,
        type: 'gate_pass',
        docId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        details: {
          title: 'Chi tiết Phiếu Ra - Vào Cổng',
          items: [
            {
              label: 'Hình thức',
              value:
                timeType === 'nghi_dau_gio'
                  ? 'Nghỉ đầu giờ'
                  : timeType === 'nghi_cuoi_gio'
                  ? 'Nghỉ cuối giờ'
                  : 'Nghỉ trong giờ làm việc',
            },
            { label: 'Thời gian dự kiến', value: timeDesc },
            { label: 'Lý do ra cổng', value: finalPurpose },
            {
              label: 'Tài sản mang theo',
              value: hasAssets && assets.length > 0 ? `${assets.length} món tài sản` : 'Không mang theo',
            },
            {
              label: 'Cấp duyệt hiện tại',
              value: `${firstApproverRole}: ${firstApproverName}`,
            },
          ],
        },
      }).then((res) => {
        if (res.success) {
          showToast({
            type: 'success',
            title: 'Tạo phiếu ra vào cổng thành công',
            message: `Đã gửi email thông báo phê duyệt đến ${firstApproverRole}: ${firstApproverEmail}`,
          });
        } else {
          showToast({
            type: 'warning',
            title: `Đã lưu phiếu ${docId} thành công`,
            message: `Chưa gửi email tự động được. Bạn có thể bấm nút bên dưới để mở ứng dụng Email/Outlook gửi thông tin cho ${firstApproverRole} (${firstApproverEmail}).`,
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
        title: 'Tạo phiếu ra vào cổng thành công',
        message: firstApproverId
          ? `Phiếu ${docId} đã được chuyển đến ${firstApproverRole} (${firstApproverName} - Mã NV: ${firstApproverId}) phê duyệt trên hệ thống.`
          : `Phiếu ${docId} đã được lưu và gửi đến cấp quản lý phê duyệt trên hệ thống.`,
      });
    }

    // Reset
    setTimeType('nghi_giua_gio');
    setDepartureTime(getTodayDateTimeStr('11', '30'));
    setReturnTime(getTodayDateTimeStr('13', '00'));
    setReasonCategory('ca_nhan');
    setSpecificReason('');
    setCompanyReason('');
    setOtherReason('');
    setAssets([]);
    setHasAssets(false);
  };

  // Check if current user can approve this gate pass
  const canApproveGatePass = (pass: GatePass): boolean => {
    if (!currentUser || pass.status !== 'pending') return false;

    // 1. Employee cannot self-approve their own pass
    if (pass.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;

    // 2. Admin & BOD can approve any pass across company
    if (isSuperAdminOrBOD(currentUser)) return true;

    // 3. Multi-step approval check if steps array exists
    if (Array.isArray(pass.steps) && pass.steps.length > 0) {
      const stepIndex = pass.currentStepIndex ?? 0;
      const curStep = pass.steps[stepIndex];
      if (!curStep || curStep.status !== 'pending') return false;

      if (curStep.roleRequired === 'team_leader') {
        if (curStep.approverId && curStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) return true;
        return currentUser.role === 'team_leader' && isSameDepartment(currentUser.department, pass.department);
      }

      if (curStep.roleRequired === 'manager') {
        if (curStep.approverId && curStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) return true;
        return currentUser.role === 'manager' && isSameDepartment(currentUser.department, pass.department);
      }

      return false;
    }

    // 4. Fallback for legacy passes without steps
    if (currentUser.role === 'manager' || currentUser.role === 'team_leader') {
      if (isSameDepartment(currentUser.department, pass.department)) return true;
      if (pass.managerApproverId && pass.managerApproverId.toLowerCase() === currentUser.id.toLowerCase()) return true;
      return false;
    }

    return false;
  };

  // Manager / Team Leader Approve
  const handleManagerApprove = async (pass: GatePass) => {
    if (!currentUser) return;
    if (!canApproveGatePass(pass)) {
      showToast({
        type: 'error',
        title: 'Không thể phê duyệt',
        message: 'Bạn không có quyền phê duyệt phiếu này! (Người tạo phiếu không được tự phê duyệt; chỉ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc mới có quyền phê duyệt).',
      });
      return;
    }

    const now = new Date().toISOString();
    const updated: GatePass = { ...pass, updatedAt: now };

    if (Array.isArray(updated.steps) && updated.steps.length > 0) {
      const stepIndex = updated.currentStepIndex ?? 0;
      const currentStep = updated.steps[stepIndex];
      if (currentStep) {
        currentStep.status = 'approved';
        currentStep.approverId = currentUser.id;
        currentStep.approverName = currentUser.name;
        currentStep.actionAt = now;

        if (currentStep.roleRequired === 'team_leader') {
          updated.teamLeaderApproverId = currentUser.id;
          updated.teamLeaderApproverName = currentUser.name;
          updated.teamLeaderApprovedAt = now;
        } else {
          updated.managerApproverId = currentUser.id;
          updated.managerApproverName = currentUser.name;
          updated.managerApprovedAt = now;
        }
      }

      const nextStep = updated.steps[stepIndex + 1];
      if (nextStep && nextStep.roleRequired === 'manager') {
        // Advance to manager step
        updated.currentStepIndex = stepIndex + 1;
        updated.status = 'pending';

        // Dispatch email to manager
        const allUsers = storage.getUsers();
        const emp = allUsers.find((u) => u.id.toLowerCase() === pass.employeeId.toLowerCase());
        const mgrId = nextStep.approverId || emp?.departmentHeadId;
        const mgrUser = mgrId ? allUsers.find((u) => u.id.toLowerCase() === mgrId.toLowerCase()) : null;
        const mgrEmail = (mgrUser?.email || emp?.departmentHeadEmail || '').trim();

        if (mgrEmail) {
          dispatchApprovalEmail({
            toEmail: mgrEmail,
            managerName: mgrUser?.name || 'Trưởng bộ phận',
            type: 'gate_pass',
            docId: pass.id,
            employeeId: pass.employeeId,
            employeeName: pass.employeeName,
            department: pass.department,
            details: {
              title: 'Thông báo Duyệt Phiếu Ra - Vào Cổng',
              items: [
                { label: 'Tổ trưởng đã duyệt', value: `${currentUser.name} (${currentUser.id})` },
                {
                  label: 'Hình thức',
                  value:
                    pass.timeType === 'nghi_dau_gio'
                      ? 'Nghỉ đầu giờ'
                      : pass.timeType === 'nghi_cuoi_gio'
                      ? 'Nghỉ cuối giờ'
                      : 'Nghỉ trong giờ làm việc',
                },
                { label: 'Lý do ra cổng', value: pass.purpose },
              ],
            },
          }).catch(console.error);
        }

        storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
        setPasses(storage.getGatePasses());
        setSelectedPass(updated);
        showToast({
          type: 'success',
          title: 'Tổ trưởng đã phê duyệt',
          message: mgrEmail
            ? `Phiếu ${updated.id} đã được chuyển và gửi email đến Trưởng bộ phận (${mgrUser?.name || 'Trưởng bộ phận'} - ${mgrEmail}).`
            : `Phiếu ${updated.id} đã được chuyển tiếp đến Trưởng bộ phận phê duyệt trên hệ thống.`,
        });
        return;
      } else {
        // Management approval finished: pass is approved and ready for Security
        if (nextStep && nextStep.roleRequired === 'security') {
          updated.currentStepIndex = stepIndex + 1;
        }
        updated.status = 'approved';
        storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
        setPasses(storage.getGatePasses());
        setSelectedPass(updated);
        showToast({
          type: 'success',
          title: 'Đã phê duyệt thành công',
          message: `Phiếu ra vào cổng ${updated.id} đã được phê duyệt. Sẵn sàng cho bảo vệ quét mã xác nhận ra cổng.`,
        });
        return;
      }
    } else {
      // Legacy pass without steps
      updated.status = 'approved';
      updated.managerApproverId = currentUser.id;
      updated.managerApproverName = currentUser.name;
      updated.managerApprovedAt = now;
      storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
      setPasses(storage.getGatePasses());
      setSelectedPass(updated);
      showToast({
        type: 'success',
        title: 'Đã phê duyệt thành công',
        message: `Phiếu ra vào cổng ${updated.id} đã được phê duyệt. Sẵn sàng cho bảo vệ quét mã xác nhận ra cổng.`,
      });
    }
  };

  // Manager / Team Leader Reject
  const handleManagerReject = async (pass: GatePass) => {
    if (!currentUser) return;
    if (!canApproveGatePass(pass)) {
      showToast({
        type: 'error',
        title: 'Không thể từ chối',
        message: 'Bạn không có quyền từ chối phiếu này! (Chỉ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc mới có quyền xử lý).',
      });
      return;
    }
    if (!passRejectionReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Thiếu lý do từ chối',
        message: 'Vui lòng nhập lý do từ chối phiếu!',
      });
      return;
    }

    const now = new Date().toISOString();
    const updated: GatePass = { ...pass, updatedAt: now };

    if (Array.isArray(updated.steps) && updated.steps.length > 0) {
      const stepIndex = updated.currentStepIndex ?? 0;
      const currentStep = updated.steps[stepIndex];
      if (currentStep) {
        currentStep.status = 'rejected';
        currentStep.approverId = currentUser.id;
        currentStep.approverName = currentUser.name;
        currentStep.comment = passRejectionReason.trim();
        currentStep.actionAt = now;
      }
    }

    updated.status = 'rejected';
    updated.managerApproverId = currentUser.id;
    updated.managerApproverName = currentUser.name;
    updated.managerApprovedAt = now;
    updated.rejectionReason = passRejectionReason.trim();

    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setSelectedPass(updated);
    setIsRejecting(false);
    setPassRejectionReason('');
    showToast({
      type: 'info',
      title: 'Đã từ chối phiếu',
      message: `Phiếu ra vào cổng ${updated.id} đã chuyển sang trạng thái từ chối.`,
    });
  };


  // IT Confirm & Dispatch C&B Notification
  const handleITConfirmGatePass = async (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: GatePass = {
      ...pass,
      itConfirmedAt: now,
      itConfirmedBy: `${currentUser.name} (${currentUser.id})`,
      status: (pass.status === 'departed' && pass.timeType === 'nghi_cuoi_gio') || pass.actualReturnTime ? 'completed' : pass.status,
      updatedAt: now,
    };

    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setSelectedPass(updated);

    // Dispatch notification email to C&B department
    const details = [
      { label: 'Mã phiếu', value: updated.id },
      { label: 'Nhân viên', value: `${updated.employeeName} (${updated.employeeId})` },
      { label: 'Phòng ban', value: updated.department },
      { label: 'Lý do ra vào cổng', value: updated.purpose },
      { label: 'Loại thời gian', value: updated.timeType === 'nghi_dau_gio' ? 'Nghỉ đầu giờ' : updated.timeType === 'nghi_cuoi_gio' ? 'Nghỉ cuối giờ' : 'Nghỉ trong giờ làm việc' },
      { label: 'TG ra dự kiến', value: updated.estimatedDepartureTime ? formatDateTime(updated.estimatedDepartureTime) : '-' },
      { label: 'TG vào dự kiến', value: updated.estimatedReturnTime ? formatDateTime(updated.estimatedReturnTime) : '-' },
      { label: 'TG ra thực tế (Bảo vệ quét)', value: updated.actualDepartureTime ? formatDateTime(updated.actualDepartureTime) : 'Chưa ghi nhận' },
      { label: 'TG vào thực tế (Bảo vệ quét)', value: updated.actualReturnTime ? formatDateTime(updated.actualReturnTime) : (updated.timeType === 'nghi_cuoi_gio' ? 'Không về lại (Nghỉ cuối giờ)' : 'Chưa ghi nhận') },
      { label: 'Tài sản mang theo', value: updated.hasAssets && updated.assets.length > 0 ? updated.assets.map(a => `${a.name} (SL: ${a.quantity})`).join('; ') : 'Không mang theo' },
      { label: 'Trưởng bộ phận phê duyệt', value: updated.managerApproverName || 'Đã duyệt' },
      { label: 'IT xác nhận hoàn tất', value: `${currentUser.name} (${currentUser.id})` },
    ];

    await dispatchCBNotificationEmail({
      type: 'gate_pass',
      docId: updated.id,
      employeeId: updated.employeeId,
      employeeName: updated.employeeName,
      department: updated.department,
      title: 'Phiếu Ra - Vào Cổng',
      summary: `Nhân viên ${updated.employeeName} đã được IT xác nhận hoàn tất ra vào cổng.`,
      itApproverName: currentUser.name,
      details,
    });

    showToast({
      type: 'success',
      title: 'Đã hoàn tất xác nhận IT',
      message: `Đã xác nhận phiếu ${updated.id} và đẩy thông báo thành công đến Bộ phận C&B để cập nhật dữ liệu chấm công.`,
    });
  };

  // Show QR modal
  const handleShowQr = async (pass: GatePass) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const qrTargetUrl = getQrConfirmUrl('gate_pass', pass.id, origin);
    const url = await generateQrDataUrl(qrTargetUrl);
    setQrModalUrl(url);
    setSelectedPass(pass);
  };

  // Security Scanner: Lookup Pass by ID
  const handleLookupPass = (codeToSearch?: string) => {
    const code = (codeToSearch || scanCode).trim().toUpperCase();
    setScanMessage(null);
    if (!code) return;

    const found = passes.find((p) => p.id.toUpperCase() === code || p.qrCodeData.includes(code));
    if (found) {
      setScannedPass(found);
    } else {
      setScannedPass(null);
      setScanMessage(`Không tìm thấy phiếu ra vào cổng có mã "${code}"`);
    }
  };

  // Security Confirm Entry for Nghỉ đầu giờ (Vào cổng đầu ca)
  const handleConfirmEntry = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: GatePass = {
      ...pass,
      status: 'completed',
      actualReturnTime: now,
      securityReturnGuardId: currentUser.id,
      updatedAt: now,
    };
    if (Array.isArray(updated.steps)) {
      const secStep = updated.steps.find((s) => s.roleRequired === 'security');
      if (secStep) {
        secStep.status = 'approved';
        secStep.approverId = currentUser.id;
        secStep.approverName = currentUser.name;
        secStep.actionAt = now;
      }
    }
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setSelectedPass(updated);
    const msg = `✓ Đã ghi nhận giờ VÀO CỔNG cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`;
    setScanMessage(msg);
    showToast({
      type: 'success',
      title: 'Bảo vệ xác nhận thành công',
      message: msg,
    });
  };

  // Security Confirm Departure (Ra cổng)
  const handleConfirmDeparture = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const newStatus: GatePassStatus = pass.timeType === 'nghi_cuoi_gio' ? 'completed' : 'departed';
    const updated: GatePass = {
      ...pass,
      status: newStatus,
      actualDepartureTime: now,
      securityDepartureGuardId: currentUser.id,
      updatedAt: now,
    };
    if (Array.isArray(updated.steps)) {
      const secStep = updated.steps.find((s) => s.roleRequired === 'security');
      if (secStep) {
        secStep.approverId = currentUser.id;
        secStep.approverName = currentUser.name;
        secStep.actionAt = now;
        if (newStatus === 'completed') {
          secStep.status = 'approved';
        }
      }
    }
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setSelectedPass(updated);
    const msg =
      pass.timeType === 'nghi_cuoi_gio'
        ? `✓ Đã ghi nhận giờ RA CỔNG (Nghỉ cuối giờ) cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`
        : `✓ Đã ghi nhận giờ RA CỔNG cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}`;
    setScanMessage(msg);
    showToast({
      type: 'success',
      title: 'Bảo vệ xác nhận thành công',
      message: msg,
    });
  };

  // Security Confirm Return (Vào cổng lại)
  const handleConfirmReturn = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: GatePass = {
      ...pass,
      status: 'completed',
      actualReturnTime: now,
      securityReturnGuardId: currentUser.id,
      updatedAt: now,
    };
    if (Array.isArray(updated.steps)) {
      const secStep = updated.steps.find((s) => s.roleRequired === 'security');
      if (secStep) {
        secStep.status = 'approved';
        secStep.approverId = currentUser.id;
        secStep.approverName = currentUser.name;
        secStep.actionAt = now;
      }
    }
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setSelectedPass(updated);
    const msg = `✓ Đã ghi nhận giờ VÀO CỔNG LẠI cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`;
    setScanMessage(msg);
    showToast({
      type: 'success',
      title: 'Bảo vệ xác nhận thành công',
      message: msg,
    });
  };

  // Filter strictly based on user permissions
  const userVisiblePasses = useMemo(() => {
    return filterUserGatePasses(passes, currentUser, scopeFilter);
  }, [passes, currentUser, scopeFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return userVisiblePasses.filter((p) => {
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.employeeName.toLowerCase().includes(q) ||
        p.employeeId.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.purpose && p.purpose.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userVisiblePasses, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Phiếu Ra - Vào Cổng Nhà Máy (Gate Pass)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {!canManageOthers
              ? `Chỉ hiển thị các phiếu ra vào cổng của bạn (${currentUser?.name || ''})`
              : isSecurity
              ? 'Kiểm soát nhân viên ra vào cổng, kiểm tra tài sản mang theo và quét mã QR Code an ninh'
              : isBOD
              ? 'Quản lý phiếu ra cổng toàn công ty, kiểm soát tài sản mang theo và quét mã QR Code an ninh'
              : `Quản lý phiếu ra cổng của nhân viên bộ phận ${currentUser?.department || ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switch tab buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Danh sách phiếu
            </button>
            {(isSecurity || isBOD) && (
              <button
                onClick={() => setActiveTab('security_gate')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'security_gate'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Bảo vệ cổng quét QR</span>
              </button>
            )}
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu ra cổng</span>
          </button>
        </div>
      </div>

      {/* Scope Switcher for Approvers / Managers / Security */}
      {canManageOthers && activeTab === 'list' && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSecurity
              ? 'Tất cả phiếu ra vào cổng'
              : isBOD
              ? 'Tất cả phiếu toàn công ty'
              : `Phiếu nhân viên ${currentUser?.department || 'bộ phận'}`}
          </button>
          <button
            onClick={() => setScopeFilter('approver')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'approver'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSecurity ? 'Phiếu cần bảo vệ xác nhận' : 'Phiếu cần tôi duyệt'}
          </button>
          <button
            onClick={() => setScopeFilter('my')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'my'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Phiếu của tôi
          </button>
        </div>
      )}

      {/* TAB 1: LIST VIEW */}
      {activeTab === 'list' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã phiếu, tên NV, mục đích..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <option value="pending">Chờ quản lý duyệt</option>
                <option value="approved">Đã duyệt (Có hiệu lực QR)</option>
                <option value="departed">Đang ở ngoài (Đã ra cổng)</option>
                <option value="completed">Đã về lại (Hoàn tất)</option>
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

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã phiếu</th>
                    <th className="py-3.5 px-4">Người yêu cầu</th>
                    <th className="py-3.5 px-4">Lý do ra - vào cổng</th>
                    <th className="py-3.5 px-4">Tài sản mang theo</th>
                    <th className="py-3.5 px-4">Thời gian dự kiến</th>
                    <th className="py-3.5 px-4">Thời gian ra thực tế</th>
                    <th className="py-3.5 px-4">Thời gian vào thực tế</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Mã QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không có phiếu ra vào cổng nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr
                        key={`${item.id}-${idx}`}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedPass(item)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
                          <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 max-w-[260px]">
                            {item.purpose}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.reasonCategory === 'cong_ty'
                                ? 'Công ty'
                                : item.reasonCategory === 'khac'
                                ? 'Lý do khác'
                                : 'Cá nhân'}
                            </span>
                            {item.timeType && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                                {item.timeType === 'nghi_dau_gio'
                                  ? 'Đầu giờ'
                                  : item.timeType === 'nghi_cuoi_gio'
                                  ? 'Cuối giờ'
                                  : 'Giữa giờ'}
                              </span>
                            )}
                            {item.shift && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                {item.shift}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.hasAssets && item.assets && item.assets.length > 0 ? (
                            <div className="space-y-1 max-w-[200px]">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                                <Package className="w-3 h-3 shrink-0" />
                                <span>{item.assets.length} món</span>
                              </span>
                              <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate" title={item.assets.map((a) => `${a.name} (SL: ${a.quantity})`).join(', ')}>
                                {item.assets.map((a) => `${a.name} (${a.quantity})`).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Không mang</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.timeType === 'nghi_dau_gio' ? (
                            <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              Vào: {formatDateTime(item.estimatedReturnTime)}
                            </div>
                          ) : item.timeType === 'nghi_cuoi_gio' ? (
                            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              Ra: {formatDateTime(item.estimatedDepartureTime)}
                            </div>
                          ) : (
                            <>
                              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                Ra: {formatDateTime(item.estimatedDepartureTime)}
                              </div>
                              {item.estimatedReturnTime && (
                                <div className="text-[10px] text-slate-400">
                                  Vào: {formatDateTime(item.estimatedReturnTime)}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.actualDepartureTime ? (
                            <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {formatDateTime(item.actualDepartureTime)}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa ra</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.timeType === 'nghi_cuoi_gio' ? (
                            <span className="text-[11px] text-slate-500 italic">Không về lại (Cuối giờ)</span>
                          ) : item.actualReturnTime ? (
                            <div className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {formatDateTime(item.actualReturnTime)}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa vào</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {item.steps && item.steps[item.currentStepIndex ?? 0]?.roleRequired === 'team_leader'
                                ? 'Chờ Tổ trưởng duyệt'
                                : 'Chờ Trưởng BP duyệt'}
                            </span>
                          )}
                          {item.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Đã duyệt
                            </span>
                          )}
                          {item.status === 'departed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Đang ở ngoài
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Hoàn tất
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowQr(item);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60"
                            title="Xem mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: SECURITY GUARD SCANNER VIEW */}
      {activeTab === 'security_gate' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
              <ScanLine className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cổng Kiểm Soát An Ninh Bảo Vệ
            </h2>
            <p className="text-xs text-slate-500">
              Nhập mã phiếu (GPxxxx) hoặc quét mã QR trên màn hình điện thoại nhân viên
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Nhập mã phiếu (Ví dụ: GP26-0001)..."
              className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupPass();
              }}
            />
            <button
              onClick={() => handleLookupPass()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Kiểm tra phiếu
            </button>
          </div>

          {scanMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 font-medium">
              {scanMessage}
            </div>
          )}

          {/* Scanned Pass Result Card */}
          {scannedPass && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {scannedPass.id}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {scannedPass.employeeName} ({scannedPass.employeeId})
                  </h3>
                  <p className="text-xs text-slate-500">{scannedPass.department}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {scannedPass.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <div>Lý do ra - vào: <b>{scannedPass.purpose}</b></div>
                <div>Hình thức: <b>{
                  scannedPass.timeType === 'nghi_dau_gio'
                    ? 'Nghỉ đầu giờ'
                    : scannedPass.timeType === 'nghi_cuoi_gio'
                    ? 'Nghỉ cuối giờ'
                    : 'Nghỉ trong giờ làm việc'
                }</b></div>
                {scannedPass.estimatedDepartureTime && (
                  <div>Giờ dự kiến ra: <b>{formatDateTime(scannedPass.estimatedDepartureTime)}</b></div>
                )}
                {scannedPass.estimatedReturnTime && (
                  <div>Giờ dự kiến vào: <b>{formatDateTime(scannedPass.estimatedReturnTime)}</b></div>
                )}
                <div>Giờ ra thực tế: <b>{formatDateTime(scannedPass.actualDepartureTime)}</b></div>
                <div>Giờ vào thực tế: <b>{formatDateTime(scannedPass.actualReturnTime)}</b></div>
                <div>Quản lý duyệt: <b>{scannedPass.managerApproverName || 'Chưa duyệt'}</b></div>
              </div>

              {/* Assets list */}
              {scannedPass.hasAssets && scannedPass.assets.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                    <Package className="w-4 h-4" />
                    <span>Tài sản mang theo (Bảo vệ đối chiếu khi ra/vào):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200">
                    {scannedPass.assets.map((ast) => (
                      <li key={ast.id}>
                        {ast.name} - SL: <b>{ast.quantity} {ast.unit}</b> {ast.serialNumber && `(Số Seri: ${ast.serialNumber})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons for Security Guard */}
              <div className="pt-2 flex gap-3">
                {scannedPass.status === 'approved' && scannedPass.timeType === 'nghi_dau_gio' && (
                  <button
                    onClick={() => handleConfirmEntry(scannedPass)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Xác nhận CHO VÀO CỔNG (Nghỉ đầu giờ)</span>
                  </button>
                )}

                {scannedPass.status === 'approved' && scannedPass.timeType !== 'nghi_dau_gio' && (
                  <button
                    onClick={() => handleConfirmDeparture(scannedPass)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>
                      {scannedPass.timeType === 'nghi_cuoi_gio'
                        ? 'Xác nhận CHO RA CỔNG (Nghỉ cuối giờ)'
                        : 'Xác nhận CHO RA CỔNG'}
                    </span>
                  </button>
                )}

                {scannedPass.status === 'departed' && (
                  <button
                    onClick={() => handleConfirmReturn(scannedPass)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Xác nhận ĐÃ VÀO CỔNG LẠI</span>
                  </button>
                )}

                {scannedPass.status === 'completed' && (
                  <div className="w-full text-center py-2 text-xs font-bold text-slate-500">
                    Phiếu này đã hoàn tất vào/ra cổng!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create Gate Pass */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tạo Phiếu Ra - Vào Cổng
                </h3>
                <p className="text-xs text-slate-500">
                  Người yêu cầu: <b>{currentUser?.name}</b> ({currentUser?.id} - {currentUser?.department})
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
              {/* Lý do ra – vào cổng */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do ra – vào cổng:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setReasonCategory('ca_nhan')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'ca_nhan'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setReasonCategory('cong_ty')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'cong_ty'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Công ty
                  </button>
                  <button
                    type="button"
                    onClick={() => setReasonCategory('khac')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'khac'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Lý do khác
                  </button>
                </div>

                {reasonCategory === 'ca_nhan' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Chọn lý do cụ thể: *
                    </label>
                    <select
                      required
                      value={specificReason}
                      onChange={(e) => setSpecificReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="">-- Chọn lý do --</option>
                      {PERSONAL_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reasonCategory === 'cong_ty' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nội dung công tác / Địa điểm đến: *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={companyReason}
                      onChange={(e) => setCompanyReason(e.target.value)}
                      placeholder="Ghi rõ nội dung công việc công tác hoặc địa điểm..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {reasonCategory === 'khac' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nhập lý do cụ thể: *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Ghi rõ lý do ra - vào cổng..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Ca làm việc */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ca làm việc: *
                </label>
                <select
                  required
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="">-- Chọn ca làm việc --</option>
                  {GATE_PASS_SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {shift === 'Ca khác' && (
                  <div className="mt-2 space-y-2">
                    <select
                      required
                      value={otherShiftSelect}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOtherShiftSelect(val);
                        if (val !== 'custom') {
                          setCustomShift(val);
                        } else {
                          setCustomShift('');
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs"
                    >
                      <option value="">-- Chọn ca đã tạo sẵn --</option>
                      {OTHER_GATE_PASS_SHIFTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="custom">-- Tùy chọn khác (tự nhập tay) --</option>
                    </select>

                    {otherShiftSelect === 'custom' && (
                      <input
                        type="text"
                        required
                        value={customShift}
                        onChange={(e) => setCustomShift(e.target.value)}
                        placeholder="Nhập tên ca và thời gian làm việc..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Thời gian ra – vào dự kiến */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian ra – vào dự kiến:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_dau_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_dau_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ đầu giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_giua_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_giua_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ trong giờ làm việc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_cuoi_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_cuoi_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ cuối giờ
                  </button>
                </div>

                {/* Conditional inputs */}
                {timeType === 'nghi_dau_gio' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Thời gian vào cổng: *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {timeType === 'nghi_giua_gio' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Thời gian ra: *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Thời gian vào: *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {timeType === 'nghi_cuoi_gio' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Thời gian ra cổng: *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Assets Declaration */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={hasAssets}
                    onChange={(e) => setHasAssets(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Có mang theo tài sản / thiết bị ra ngoài</span>
                </label>

                {hasAssets && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        placeholder="Tên tài sản (VD: Laptop Dell, Bộ dụng cụ kiểm tra...)"
                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        value={newAssetQty}
                        onChange={(e) => setNewAssetQty(Number(e.target.value))}
                        className="w-16 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddAsset}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                      >
                        Thêm
                      </button>
                    </div>

                    {assets.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {assets.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <span>
                              {a.name} (SL: {a.quantity})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(a.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Approval workflow options */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cấp phê duyệt yêu cầu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                      needTeamLeader
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    } ${!hasTeamLeader ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={needTeamLeader}
                      disabled={!hasTeamLeader}
                      onChange={(e) => {
                        if (!hasTeamLeader) return;
                        if (!e.target.checked && !needManager) return;
                        setNeedTeamLeader(e.target.checked);
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Tổ trưởng duyệt</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                      needManager
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={needManager}
                      onChange={(e) => {
                        if (!e.target.checked && !needTeamLeader) return;
                        setNeedManager(e.target.checked);
                      }}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span>Trưởng bộ phận duyệt</span>
                  </label>
                </div>
                {!hasTeamLeader && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                    * Nhân viên chưa được thiết lập mã Tổ trưởng trong hệ thống, mặc định duyệt qua Trưởng bộ phận.
                  </p>
                )}
              </div>

              {/* Dynamic workflow preview */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300">
                <span className="font-bold">Quy trình duyệt: </span>
                <span>
                  {[
                    'Nhân viên',
                    needTeamLeader ? 'Tổ trưởng' : null,
                    needManager ? 'Trưởng bộ phận' : null,
                    'Bảo vệ',
                    'Hoàn thành',
                  ]
                    .filter(Boolean)
                    .join(' → ')}
                </span>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Tạo phiếu ra cổng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View QR Code */}
      {qrModalUrl && selectedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>Mã QR Ra - Vào Cổng</span>
              </h3>
              <button
                onClick={() => setQrModalUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Xuất trình mã này cho <b>Bảo vệ tại cổng</b> quét mã để xác nhận thời gian vào - ra thực tế (Không cần bảo vệ đăng nhập).
            </p>

            {/* Approval Status notice */}
            {selectedPass.status === 'pending' ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300 text-left">
                ⚠️ Phiếu đang chờ {selectedPass.steps && selectedPass.steps[selectedPass.currentStepIndex ?? 0]?.roleRequired === 'team_leader' ? 'Tổ trưởng' : 'Trưởng bộ phận'} phê duyệt. Sau khi duyệt, bảo vệ mới có thể xác nhận cho ra cổng.
              </div>
            ) : selectedPass.status === 'approved' ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 text-left">
                ✅ Đã được phê duyệt. Sẵn sàng cho bảo vệ quét mã để xác nhận ra cổng.
              </div>
            ) : selectedPass.status === 'departed' ? (
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-[11px] font-semibold text-blue-800 dark:text-blue-300 text-left">
                🚪 Đã ra cổng. Trình mã này cho bảo vệ quét khi vào lại công ty.
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 text-left">
                ✓ Phiếu đã hoàn tất quy trình ra vào cổng.
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img src={qrModalUrl} alt="Mã QR Phiếu ra cổng" className="w-56 h-56 mx-auto" />
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
              <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">{selectedPass.id}</div>
              <div className="font-semibold">{selectedPass.employeeName} ({selectedPass.employeeId})</div>
              <div className="text-[11px] text-slate-500">{selectedPass.department}</div>
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 pt-0.5">Lý do: <b>{selectedPass.purpose}</b></div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  window.open(getQrConfirmUrl('gate_pass', selectedPass.id, origin), '_blank');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Mở trang quét bảo vệ
              </button>
              <button
                onClick={() => setQrModalUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pass Detail & Manager Approval */}
      {selectedPass && !qrModalUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-600">{selectedPass.id}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Chi Tiết Phiếu Ra Vào Cổng
                </h3>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Nhân viên: <b className="text-slate-900 dark:text-white">{selectedPass.employeeName}</b> ({selectedPass.employeeId})</span>
                <span>Phòng ban: <b>{selectedPass.department}</b></span>
              </div>
              {selectedPass.shift && (
                <div>
                  <span className="text-slate-400">Ca làm việc:</span>{' '}
                  <b className="text-slate-900 dark:text-white">{selectedPass.shift}</b>
                </div>
              )}
              <div>
                <span className="text-slate-400">Hình thức ra - vào:</span>{' '}
                <b className="text-blue-600 dark:text-blue-400">
                  {selectedPass.timeType === 'nghi_dau_gio'
                    ? 'Nghỉ đầu giờ'
                    : selectedPass.timeType === 'nghi_cuoi_gio'
                    ? 'Nghỉ cuối giờ'
                    : 'Nghỉ trong giờ làm việc'}
                </b>
              </div>
              <div>
                <span className="text-slate-400">Phân loại:</span>{' '}
                <b>
                  {selectedPass.reasonCategory === 'cong_ty'
                    ? 'Công việc / Công tác'
                    : selectedPass.reasonCategory === 'khac'
                    ? 'Lý do khác'
                    : 'Việc cá nhân'}
                </b>
              </div>
              <div>
                <span className="text-slate-400">Lý do cụ thể:</span>{' '}
                <b className="text-slate-900 dark:text-white">{selectedPass.purpose}</b>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                {selectedPass.timeType !== 'nghi_dau_gio' && (
                  <div>
                    Thời gian ra dự kiến: <b>{formatDateTime(selectedPass.estimatedDepartureTime)}</b>
                  </div>
                )}
                {selectedPass.timeType !== 'nghi_cuoi_gio' && (
                  <div>
                    Thời gian vào dự kiến: <b>{formatDateTime(selectedPass.estimatedReturnTime)}</b>
                  </div>
                )}
                {selectedPass.actualDepartureTime && (
                  <div className="text-emerald-600 dark:text-emerald-400">
                    Bảo vệ xác nhận ra cổng: <b>{formatDateTime(selectedPass.actualDepartureTime)}</b>
                  </div>
                )}
                {selectedPass.actualReturnTime && (
                  <div className="text-emerald-600 dark:text-emerald-400">
                    Bảo vệ xác nhận vào cổng: <b>{formatDateTime(selectedPass.actualReturnTime)}</b>
                  </div>
                )}
              </div>

              {selectedPass.rejectionReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                  <span className="font-bold">Lý do từ chối: </span>
                  <span>{selectedPass.rejectionReason}</span>
                </div>
              )}

              <div>
                Trạng thái:{' '}
                <span className="font-bold uppercase tracking-wider">
                  {selectedPass.status === 'pending'
                    ? 'Chờ duyệt'
                    : selectedPass.status === 'approved'
                    ? 'Đã duyệt'
                    : selectedPass.status === 'rejected'
                    ? 'Bị từ chối'
                    : selectedPass.status === 'departed'
                    ? 'Đang ở ngoài'
                    : 'Hoàn tất'}
                </span>
              </div>
            </div>

            {/* Multi-step approval progress tracker */}
            {selectedPass.steps && selectedPass.steps.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Tiến trình phê duyệt:
                </div>
                <div className="space-y-1.5">
                  {selectedPass.steps.map((st, i) => {
                    const isSkipped = st.status === 'skipped' || (selectedPass.status === 'rejected' && i > (selectedPass.currentStepIndex ?? 0));
                    const isCurrent = i === (selectedPass.currentStepIndex ?? 0) && selectedPass.status === 'pending';
                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          st.status === 'approved'
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                            : st.status === 'rejected'
                            ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                            : isSkipped
                            ? 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                            : isCurrent
                            ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/50'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Bước {i + 1}: {st.stepName}</span>
                            {st.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {st.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                            {isSkipped && <MinusCircle className="w-3.5 h-3.5 text-slate-400" />}
                          </div>
                          <div className="text-[11px] mt-0.5 text-slate-500">
                            Người duyệt: <b>{st.approverName}</b>
                            {st.actionAt && ` (${formatDateTime(st.actionAt)})`}
                            {st.comment && ` - "${st.comment}"`}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${
                          st.status === 'approved'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : st.status === 'rejected'
                            ? 'text-rose-700 dark:text-rose-400'
                            : isCurrent
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}>
                          {st.status === 'approved' ? 'Đã duyệt' : st.status === 'rejected' ? 'Từ chối' : isCurrent ? 'Chờ duyệt' : 'Chưa đến lượt'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Manager approval / reject actions */}
            {selectedPass.status === 'pending' && canApproveGatePass(selectedPass) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                  Phê duyệt phiếu ra cổng (
                  {selectedPass.steps && selectedPass.steps[selectedPass.currentStepIndex ?? 0]
                    ? selectedPass.steps[selectedPass.currentStepIndex ?? 0].stepName
                    : 'Cấp quản lý'}
                  ):
                </span>
                {!isRejecting ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManagerApprove(selectedPass)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {selectedPass.steps &&
                        selectedPass.steps[selectedPass.currentStepIndex ?? 0]?.roleRequired === 'team_leader' &&
                        selectedPass.steps.some((s, idx) => idx > (selectedPass.currentStepIndex ?? 0) && s.roleRequired === 'manager')
                          ? '✓ Tổ trưởng duyệt & Chuyển Trưởng BP'
                          : '✓ Đồng ý phê duyệt phiếu'}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>✕ Từ chối</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                      Lý do từ chối: *
                    </label>
                    <textarea
                      rows={2}
                      autoFocus
                      required
                      value={passRejectionReason}
                      onChange={(e) => setPassRejectionReason(e.target.value)}
                      placeholder="Ghi rõ lý do từ chối phiếu ra cổng..."
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejecting(false);
                          setPassRejectionReason('');
                        }}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManagerReject(selectedPass)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Confirmation action block in modal */}
            {(isSecurity || isBOD) && (selectedPass.status === 'approved' || selectedPass.status === 'departed') && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/40 space-y-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
                  Bảo vệ cổng xác nhận thực tế:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedPass.status === 'approved' && selectedPass.timeType === 'nghi_dau_gio' && (
                    <button
                      onClick={() => handleConfirmEntry(selectedPass)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>✓ Xác nhận nhân viên vào cổng (Đầu ca)</span>
                    </button>
                  )}

                  {selectedPass.status === 'approved' && selectedPass.timeType !== 'nghi_dau_gio' && (
                    <button
                      onClick={() => handleConfirmDeparture(selectedPass)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>✓ Xác nhận nhân viên ra cổng</span>
                    </button>
                  )}

                  {selectedPass.status === 'departed' && (
                    <button
                      onClick={() => handleConfirmReturn(selectedPass)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>✓ Xác nhận nhân viên đã vào cổng lại (Hoàn tất)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* IT Confirmation & C&B Notification block */}
            {(currentUser?.role === 'it' || currentUser?.role === 'admin' || isBOD) && selectedPass.status !== 'pending' && selectedPass.status !== 'rejected' && (
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Bộ phận CNTT (IT) - Xác nhận hoàn tất & Báo C&B:</span>
                  </span>
                  {selectedPass.itConfirmedAt && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ✓ Đã thông báo C&B ({selectedPass.itConfirmedBy})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-800 dark:text-purple-300">
                  Nhân viên IT kiểm tra đối chiếu giờ ra/vào thực tế và bấm nút bên dưới để hoàn tất hồ sơ, tự động đẩy email thông báo đến Bộ phận C&B cập nhật dữ liệu máy chấm công.
                </p>
                <button
                  type="button"
                  onClick={() => handleITConfirmGatePass(selectedPass)}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedPass.itConfirmedAt ? 'Cập nhật lại & Đẩy thông báo đến C&B' : 'IT Xác nhận hoàn tất & Thông báo C&B'}</span>
                </button>
              </div>
            )}

            {/* Waiting Notice for employees or non-approvers */}
            {selectedPass.status === 'pending' && !canApproveGatePass(selectedPass) && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {selectedPass.employeeId.toLowerCase() === currentUser?.id.toLowerCase()
                    ? 'Phiếu đang chờ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc phê duyệt (Người tạo phiếu không được tự phê duyệt phiếu của chính mình).'
                    : 'Phiếu đang chờ phê duyệt từ Tổ trưởng, Trưởng bộ phận hoặc Ban giám đốc.'}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleShowQr(selectedPass)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Xem mã QR</span>
              </button>
              <button
                onClick={() => setSelectedPass(null)}
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
