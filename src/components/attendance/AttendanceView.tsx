'use client';

import React, { useState, useMemo } from 'react';
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
  MinusCircle,
  QrCode,
} from 'lucide-react';
import { formatDate, generateDocId } from '@/lib/utils';
import { dispatchApprovalEmail, dispatchCBNotificationEmail } from '@/lib/email';
import { generateQrDataUrl, getQrConfirmUrl } from '@/lib/qr';
import { ToastContainer, useToast } from '@/components/common/Toast';
import {
  filterUserAttendances,
  isApproverRole,
  isSuperAdminOrBOD,
  isSameDepartment,
  isSecurityRole,
  isITStaff,
  isAccountantStaff,
  DocumentScope,
} from '@/lib/permissions';

export function AttendanceView() {
  const { currentUser } = useAuth();
  const { toasts, showToast, dismissToast } = useToast();
  const [attendances, setAttendances] = useState<AttendanceConfirm[]>(() =>
    storage.getAttendanceConfirms()
  );
  const [search, setSearch] = useState('');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const isBOD = isSuperAdminOrBOD(currentUser);
  const isSecurity = isSecurityRole(currentUser);
  const isIT = isITStaff(currentUser);
  const isAccountant = isAccountantStaff(currentUser);
  const canManageOthers = isApproverRole(currentUser) || isSecurity || isIT || isAccountant;
  const [scopeFilter, setScopeFilter] = useState<DocumentScope>(() =>
    isApproverRole(currentUser) || isSecurity || isIT || isAccountant ? 'all' : 'my'
  );

  // Auto-switch away from 'my' for accountant/IT users so they see pending slips immediately
  React.useEffect(() => {
    if ((isAccountant || isIT) && scopeFilter === 'my' && !isApproverRole(currentUser)) {
      setScopeFilter('all');
    }
  }, [isAccountant, isIT]);

  // Count attendance slips waiting for Accountant to record card fee (Step 3)
  const pendingAccountantCount = useMemo(() => {
    if (!currentUser) return 0;
    return attendances.filter((a) => {
      if (a.status !== 'pending') return false;
      const currentStep = a.steps[a.currentStepIndex];
      return currentStep?.roleRequired === 'accountant';
    }).length;
  }, [attendances, currentUser]);

  // Count attendance slips waiting for IT to process card issuance / biometric update
  const pendingITCount = useMemo(() => {
    if (!currentUser) return 0;
    return attendances.filter((a) => {
      if (a.status !== 'pending') return false;
      const currentStep = a.steps[a.currentStepIndex];
      return currentStep?.roleRequired === 'it';
    }).length;
  }, [attendances, currentUser]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AttendanceConfirm | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [qrSelectedItem, setQrSelectedItem] = useState<AttendanceConfirm | null>(null);

  const handleShowQr = async (item: AttendanceConfirm) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const qrUrl = getQrConfirmUrl('attendance', item.id, origin);
    const dataUrl = await generateQrDataUrl(qrUrl);
    setQrModalUrl(dataUrl);
    setQrSelectedItem(item);
  };

  // Form states
  const [issueType, setIssueType] = useState<AttendanceIssueType>('quen_the');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState('16:30');
  const [shift, setShift] = useState('Ca Hành chính (08:00 - 16:30)');
  const [customShift, setCustomShift] = useState('');
  const [reason, setReason] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Auto-fill times when selecting shift
  const handleShiftChange = (newShift: string) => {
    setShift(newShift);
    if (newShift === 'Ca Hành chính (08:00 - 16:30)') {
      setCheckInTime('08:00');
      setCheckOutTime('16:30');
    } else if (newShift === 'Ca 1 (06:00 - 14:00)') {
      setCheckInTime('06:00');
      setCheckOutTime('14:00');
    } else if (newShift === 'Ca 2 (14:00 - 22:00)') {
      setCheckInTime('14:00');
      setCheckOutTime('22:00');
    } else if (newShift === 'Ca 3 (22:00 - 06:00)') {
      setCheckInTime('22:00');
      setCheckOutTime('06:00');
    }
  };

  // Handle submit form
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const docId = generateDocId('ATT', attendances.length);
    const allUsers = storage.getUsers();
    const freshUser = allUsers.find((u) => u.id.toLowerCase() === currentUser.id.toLowerCase()) || currentUser;
    const targetHeadId = freshUser.departmentHeadId || currentUser.departmentHeadId;
    const deptHeadUser = targetHeadId
      ? allUsers.find((u) => u.id.toLowerCase() === targetHeadId.toLowerCase())
      : null;
    const managerName = deptHeadUser?.name || 'Trưởng bộ phận';

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
      approverId: targetHeadId || undefined,
      approverName: deptHeadUser?.name || 'Quản lý / Trưởng bộ phận',
      status: 'pending',
    });

    if (issueType === 'mat_the') {
      steps.push({
        stepName: 'Kế toán ghi nhận trừ phí phôi thẻ',
        roleRequired: 'accountant',
        approverName: 'Bộ phận Kế toán Tài chính',
        status: 'pending',
      });
    }

    steps.push({
      stepName: issueType === 'mat_the' ? 'IT cấp phôi thẻ mới' : 'IT cập nhật dữ liệu máy chấm công',
      roleRequired: 'it',
      approverName: 'Bộ phận CNTT (IT)',
      status: 'pending',
    });

    const finalShift = shift === 'Ca khác' ? (customShift.trim() || 'Ca khác') : shift;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const qrCodeData = getQrConfirmUrl('attendance', docId, origin);

    const newConfirm: AttendanceConfirm = {
      id: docId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      issueType,
      date,
      checkInTime,
      checkOutTime,
      shift: finalShift,
      reason,
      status: 'pending',
      currentStepIndex: 0,
      steps,
      qrCodeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveAttendanceConfirm(newConfirm, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setShowCreateModal(false);

    // Only dispatch email if employee has explicit departmentHeadEmail configured
    const managerEmail = (freshUser.departmentHeadEmail || currentUser.departmentHeadEmail || '').trim();

    if (managerEmail) {
      dispatchApprovalEmail({
        toEmail: managerEmail,
        managerName,
        type: 'attendance',
        docId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        details: {
          title: 'Chi tiết Phiếu Xác Nhận Công',
          items: [
            { label: 'Sự cố chấm công', value: ISSUE_TYPE_LABELS[issueType]?.text || issueType },
            { label: 'Ngày cần xác nhận', value: formatDate(date) },
            { label: 'Ca làm việc', value: finalShift },
            { label: 'Thời gian vào - ra thực tế', value: `Vào: ${checkInTime} - Ra: ${checkOutTime}` },
            { label: 'Lý do giải trình', value: reason },
          ],
        },
      }).then((res) => {
        if (res.success) {
          showToast({
            type: 'success',
            title: 'Tạo phiếu xác nhận công thành công',
            message: `Đã gửi email thông báo phê duyệt đến Trưởng bộ phận: ${managerEmail}`,
          });
        } else {
          showToast({
            type: 'warning',
            title: `Đã lưu phiếu ${docId} thành công`,
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
        title: 'Tạo phiếu xác nhận công thành công',
        message: targetHeadId
          ? `Phiếu ${docId} đã được chuyển đến Trưởng bộ phận (${managerName} - Mã NV: ${targetHeadId}) phê duyệt trên hệ thống.`
          : `Phiếu ${docId} đã được lưu và gửi đến cấp quản lý phê duyệt trên hệ thống.`,
      });
    }

    setReason('');
    setCustomShift('');
  };

  // Check if current user can approve current step
  // "tiến trình phê duyệt phải được thực hiện trình tự theo từng bước, mỗi người chỉ được phép phê duyệt đúng chức năng của mình"
  const canApprove = (att: AttendanceConfirm): boolean => {
    if (!currentUser || att.status !== 'pending') return false;

    const currentStep = att.steps[att.currentStepIndex];
    if (!currentStep || currentStep.status !== 'pending') return false;

    // Sequential step check: All previous steps must be approved
    for (let i = 0; i < att.currentStepIndex; i++) {
      if (att.steps[i].status !== 'approved') return false;
    }

    const roleReq = currentStep.roleRequired;

    // 1. Step Bảo vệ (Bảo vệ cổng xác nhận vào/ra thực tế)
    if (roleReq === 'security') {
      return isSecurityRole(currentUser);
    }

    // 2. Step Trưởng bộ phận (Trưởng bộ phận phê duyệt giải trình)
    if (roleReq === 'manager') {
      // Employee cannot self-approve their own request
      if (att.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;
      // Assigned manager ID
      if (currentStep.approverId && currentStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      // Department head of same department
      if (currentUser.role === 'manager' && isSameDepartment(currentUser.department, att.department)) {
        return true;
      }
      // BOD acting as Manager
      if (isSuperAdminOrBOD(currentUser)) {
        return true;
      }
      return false;
    }

    // 3. Step Tổ trưởng (nếu có)
    if (roleReq === 'team_leader') {
      if (att.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;
      if (currentStep.approverId && currentStep.approverId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      return currentUser.role === 'team_leader' && isSameDepartment(currentUser.department, att.department);
    }

    // 4. Step Kế toán (Kế toán ghi nhận trừ phí phôi thẻ)
    if (roleReq === 'accountant') {
      return isAccountantStaff(currentUser);
    }

    // 5. Step IT (IT cập nhật dữ liệu máy chấm công / IT cấp phôi thẻ mới)
    // "Như trong hình dưới thì bước 3 phải do chính nhân viên IT xác nhận và hoàn thành."
    if (roleReq === 'it') {
      return isITStaff(currentUser);
    }

    if (currentUser.role === roleReq) return true;

    return false;
  };

  // Approve action
  const handleApprove = () => {
    if (!selectedItem || !currentUser) return;
    if (!canApprove(selectedItem)) {
      showToast({
        type: 'error',
        title: 'Không thể phê duyệt',
        message: 'Bạn không có quyền phê duyệt phiếu này! (Người tạo phiếu không được tự phê duyệt; chỉ Tổ trưởng, Trưởng bộ phận, Bảo vệ hoặc Ban giám đốc mới có quyền phê duyệt/xác nhận).',
      });
      return;
    }
    const updated = { ...selectedItem };
    const step = updated.steps[updated.currentStepIndex];

    step.status = 'approved';
    step.approverId = currentUser.id;
    step.approverName = currentUser.name;
    step.comment = approvalComment || 'Đã xác nhận kiểm tra hợp lệ';
    step.actionAt = new Date().toISOString();

    let nextStep: ApprovalStep | undefined = undefined;
    if (updated.currentStepIndex + 1 < updated.steps.length) {
      updated.currentStepIndex += 1;
      nextStep = updated.steps[updated.currentStepIndex];
    } else {
      updated.status = 'approved';
    }

    updated.updatedAt = new Date().toISOString();
    storage.saveAttendanceConfirm(updated, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setSelectedItem(updated);
    setApprovalComment('');

    // Dispatch email notifications when advancing to subsequent steps
    if (nextStep) {
      const allUsers = storage.getUsers();

      // Case 1: Next step is Manager (Trưởng bộ phận)
      if (nextStep.roleRequired === 'manager') {
        const emp = allUsers.find((u) => u.id.toLowerCase() === updated.employeeId.toLowerCase());
        const managerId = nextStep.approverId || emp?.departmentHeadId;
        const managerUser = managerId ? allUsers.find((u) => u.id.toLowerCase() === managerId.toLowerCase()) : null;
        const managerEmail = (managerUser?.email || emp?.departmentHeadEmail || '').trim();

        if (managerEmail) {
          dispatchApprovalEmail({
            toEmail: managerEmail,
            managerName: managerUser?.name || nextStep.approverName,
            type: 'attendance',
            docId: updated.id,
            employeeId: updated.employeeId,
            employeeName: updated.employeeName,
            department: updated.department,
            details: {
              title: 'Thông báo Duyệt Phiếu Xác Nhận Công',
              items: [
                { label: 'Sự cố chấm công', value: ISSUE_TYPE_LABELS[updated.issueType]?.text || updated.issueType },
                { label: 'Nhân viên giải trình', value: `${updated.employeeName} (${updated.employeeId})` },
                { label: 'Phòng ban / Xưởng', value: updated.department },
                { label: 'Ngày & Ca làm việc', value: `${formatDate(updated.date)} (${updated.shift})` },
                { label: 'Giờ vào - ra thực tế', value: `Vào: ${updated.checkInTime} - Ra: ${updated.checkOutTime}` },
                { label: 'Lý do giải trình', value: updated.reason },
                { label: 'Bảo vệ cổng', value: `Đã xác nhận thực tế (${currentUser.name})` },
                { label: 'Yêu cầu', value: 'Vui lòng xem xét và phê duyệt trên Cổng Portal Long Khai.' },
              ],
            },
          }).catch(console.error);
        }

        showToast({
          type: 'success',
          title: 'Đã xác nhận vào/ra thực tế',
          message: managerEmail
            ? `Phiếu ${updated.id} đã được chuyển và gửi email đến Trưởng bộ phận (${managerUser?.name || nextStep.approverName} - ${managerEmail}).`
            : `Phiếu ${updated.id} đã được chuyển đến Trưởng bộ phận (${managerUser?.name || nextStep.approverName}) phê duyệt.`,
        });
      }

      // Case 2: Next step is Accountant (Bộ phận Kế toán Tài chính)
      else if (nextStep.roleRequired === 'accountant') {
        const accountants = allUsers.filter((u) => isAccountantStaff(u) && u.email);
        for (const acc of accountants) {
          dispatchApprovalEmail({
            toEmail: acc.email!,
            managerName: acc.name,
            type: 'attendance',
            docId: updated.id,
            employeeId: updated.employeeId,
            employeeName: updated.employeeName,
            department: updated.department,
            details: {
              title: 'Thông báo Kế toán Tài chính: Ghi nhận trừ phí phôi thẻ (Mất thẻ)',
              items: [
                { label: 'Sự cố chấm công', value: ISSUE_TYPE_LABELS[updated.issueType]?.text || updated.issueType },
                { label: 'Nhân viên mất thẻ', value: `${updated.employeeName} (${updated.employeeId})` },
                { label: 'Phòng ban / Xưởng', value: updated.department },
                { label: 'Ngày & Ca làm việc', value: `${formatDate(updated.date)} (${updated.shift})` },
                { label: 'Lý do giải trình', value: updated.reason },
                { label: 'Trưởng BP đã duyệt', value: `${currentUser.name} (${currentUser.id})` },
                { label: 'Bước xử lý', value: 'Bước 3: Kế toán ghi nhận trừ phí phôi thẻ' },
                { label: 'Yêu cầu', value: 'Vui lòng kiểm tra và ghi nhận trừ phí phôi thẻ trên Cổng Portal Long Khai.' },
              ],
            },
          }).catch(console.error);
        }

        showToast({
          type: 'success',
          title: 'Trưởng bộ phận đã phê duyệt',
          message: accountants.length > 0
            ? `Phiếu ${updated.id} đã được chuyển và gửi email thông báo đến Bộ phận Kế toán Tài chính (${accountants.map((a) => a.name).join(', ')}).`
            : `Phiếu ${updated.id} đã được chuyển đến Bộ phận Kế toán Tài chính để ghi nhận trừ phí phôi thẻ.`,
        });
      }

      // Case 3: Next step is IT (Bộ phận CNTT)
      else if (nextStep.roleRequired === 'it') {
        const itUsers = allUsers.filter((u) => isITStaff(u) && u.email);
        for (const itUser of itUsers) {
          dispatchApprovalEmail({
            toEmail: itUser.email!,
            managerName: itUser.name,
            type: 'attendance',
            docId: updated.id,
            employeeId: updated.employeeId,
            employeeName: updated.employeeName,
            department: updated.department,
            details: {
              title: updated.issueType === 'mat_the'
                ? 'Thông báo IT: Cấp phôi thẻ mới cho nhân viên'
                : 'Thông báo IT: Cập nhật dữ liệu máy chấm công',
              items: [
                { label: 'Sự cố chấm công', value: ISSUE_TYPE_LABELS[updated.issueType]?.text || updated.issueType },
                { label: 'Nhân viên', value: `${updated.employeeName} (${updated.employeeId})` },
                { label: 'Phòng ban / Xưởng', value: updated.department },
                { label: 'Ngày & Ca làm việc', value: `${formatDate(updated.date)} (${updated.shift})` },
                { label: 'Lý do giải trình', value: updated.reason },
                { label: 'Người duyệt trước đó', value: `${currentUser.name} (${currentUser.id})` },
                { label: 'Yêu cầu', value: updated.issueType === 'mat_the'
                    ? 'Vui lòng thực hiện cấp phôi thẻ mới trên Cổng Portal Long Khai.'
                    : 'Vui lòng cập nhật dữ liệu máy chấm công trên Cổng Portal Long Khai.' },
              ],
            },
          }).catch(console.error);
        }

        showToast({
          type: 'success',
          title: 'Đã phê duyệt thành công',
          message: itUsers.length > 0
            ? `Phiếu ${updated.id} đã được chuyển và gửi email thông báo đến Bộ phận CNTT (IT).`
            : `Phiếu ${updated.id} đã được chuyển đến Bộ phận CNTT (IT) để xử lý hoàn tất.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Đã phê duyệt thành công',
          message: `Phiếu ${updated.id} đã được xác nhận và chuyển sang bước tiếp theo (${nextStep.stepName}).`,
        });
      }
    } else {
      // Step IT completed -> Dispatch notification to C&B department
      dispatchCBNotificationEmail({
        type: 'attendance',
        docId: updated.id,
        employeeId: updated.employeeId,
        employeeName: updated.employeeName,
        department: updated.department,
        title: 'Phiếu Xác Nhận Công',
        summary: `Nhân viên ${updated.employeeName} đã được IT xác nhận hoàn tất giải trình công.`,
        itApproverName: currentUser.name,
        details: [
          { label: 'Mã phiếu', value: updated.id },
          { label: 'Nhân viên', value: `${updated.employeeName} (${updated.employeeId})` },
          { label: 'Phòng ban', value: updated.department },
          { label: 'Sự cố chấm công', value: ISSUE_TYPE_LABELS[updated.issueType]?.text || updated.issueType },
          { label: 'Ca làm việc', value: `Ngày ${formatDate(updated.date)} (${updated.shift})` },
          { label: 'TG vào thực tế', value: updated.actualCheckIn || updated.checkInTime },
          { label: 'TG ra thực tế', value: updated.actualCheckOut || updated.checkOutTime },
          { label: 'Lý do giải trình', value: updated.reason },
          { label: 'Bảo vệ xác nhận', value: updated.steps[0]?.approverName || 'Đã xác nhận' },
          { label: 'IT xác nhận hoàn tất', value: `${currentUser.name} (${currentUser.id})` },
        ],
      }).catch(console.error);

      showToast({
        type: 'success',
        title: 'Hồ sơ đã hoàn tất phê duyệt',
        message: `Phiếu ${updated.id} đã hoàn thành. Hệ thống đã đẩy thông báo đến Bộ phận C&B để cập nhật dữ liệu chấm công.`,
      });
    }
  };

  // Reject action
  const handleReject = () => {
    if (!selectedItem || !currentUser) return;
    if (!canApprove(selectedItem)) {
      showToast({
        type: 'error',
        title: 'Không thể từ chối',
        message: 'Bạn không có quyền từ chối phiếu này! (Chỉ Tổ trưởng, Trưởng bộ phận, Bảo vệ hoặc Ban giám đốc mới có quyền xử lý).',
      });
      return;
    }
    if (!rejectionReason.trim()) {
      showToast({
        type: 'warning',
        title: 'Thiếu lý do từ chối',
        message: 'Vui lòng nhập lý do từ chối phiếu!',
      });
      return;
    }

    const updated = { ...selectedItem };
    const step = updated.steps[updated.currentStepIndex];

    step.status = 'rejected';
    step.approverId = currentUser.id;
    step.approverName = currentUser.name;
    step.comment = rejectionReason.trim();
    step.actionAt = new Date().toISOString();

    // Skip all remaining subsequent steps
    for (let k = updated.currentStepIndex + 1; k < updated.steps.length; k++) {
      updated.steps[k].status = 'skipped';
      updated.steps[k].comment = 'Bỏ qua (Phiếu đã bị từ chối ở bước trước)';
    }

    updated.status = 'rejected';
    updated.updatedAt = new Date().toISOString();

    storage.saveAttendanceConfirm(updated, { id: currentUser.id, name: currentUser.name });
    setAttendances(storage.getAttendanceConfirms());
    setSelectedItem(updated);
    setIsRejecting(false);
    setRejectionReason('');
    showToast({
      type: 'info',
      title: 'Đã từ chối phiếu',
      message: `Phiếu ${updated.id} đã chuyển sang trạng thái từ chối.`,
    });
  };

  // Filter list strictly based on user permissions
  const userVisibleAttendances = useMemo(() => {
    return filterUserAttendances(attendances, currentUser, scopeFilter);
  }, [attendances, currentUser, scopeFilter]);

  const filtered = userVisibleAttendances.filter((item) => {
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
              Phiếu Xác Nhận Công
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAccountant && !isApproverRole(currentUser)
              ? 'Tiếp nhận và ghi nhận trừ phí phôi thẻ cho các trường hợp mất thẻ'
              : isIT && !isApproverRole(currentUser)
              ? 'Tiếp nhận xử lý cấp thẻ mới hoặc cập nhật dữ liệu máy chấm công'
              : !canManageOthers
              ? `Chỉ hiển thị các phiếu xác nhận công của bạn (${currentUser?.name || ''})`
              : isSecurity
              ? 'Xác nhận giờ vào/ra thực tế tại cổng cho các trường hợp quên thẻ, mất thẻ, thẻ lỗi'
              : isBOD
              ? 'Quản lý phiếu xác nhận công toàn công ty (quên thẻ, thẻ hỏng, mất thẻ)'
              : `Quản lý phiếu xác nhận công của nhân viên bộ phận ${currentUser?.department || ''}`}
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

      {/* Notification banner for Accountant Staff when there are pending lost card slips */}
      {isAccountant && pendingAccountantCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-base">
              🔔
            </span>
            <div>
              <span className="font-bold text-sm">Thông báo Kế toán Tài chính: </span>
              <span>Có <b>{pendingAccountantCount} phiếu xác nhận công (mất thẻ)</b> đang chờ Bộ phận Kế toán Tài chính ghi nhận trừ phí phôi thẻ!</span>
            </div>
          </div>
          <button
            onClick={() => setScopeFilter('approver')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs transition-all"
          >
            Xem phiếu chờ kế toán xác nhận ({pendingAccountantCount}) &rarr;
          </button>
        </div>
      )}

      {/* Notification banner for IT Staff when there are pending card/attendance slips */}
      {isIT && !isBOD && pendingITCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200">
            <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 text-base">
              🔔
            </span>
            <div>
              <span className="font-bold text-sm">Thông báo Bộ phận IT: </span>
              <span>Có <b>{pendingITCount} phiếu xác nhận công</b> đang chờ IT xử lý cấp phôi thẻ / cập nhật máy chấm công!</span>
            </div>
          </div>
          <button
            onClick={() => setScopeFilter('approver')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs transition-all"
          >
            Xem phiếu chờ IT xử lý ({pendingITCount}) &rarr;
          </button>
        </div>
      )}

      {/* Scope Switcher for Approvers / Managers / Security / Accountant / IT */}
      {canManageOthers && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setScopeFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isSecurity
              ? 'Tất cả phiếu xác nhận công'
              : isAccountant && !isApproverRole(currentUser)
              ? 'Tất cả phiếu liên quan kế toán'
              : isIT && !isApproverRole(currentUser)
              ? 'Tất cả phiếu liên quan IT'
              : isBOD
              ? 'Tất cả phiếu toàn công ty'
              : `Phiếu nhân viên ${currentUser?.department || 'bộ phận'}`}
          </button>
          <button
            onClick={() => setScopeFilter('approver')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              scopeFilter === 'approver'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>
              {isSecurity
                ? 'Phiếu cần bảo vệ xác nhận'
                : isAccountant && !isApproverRole(currentUser)
                ? 'Chờ kế toán xác nhận'
                : isIT && !isApproverRole(currentUser)
                ? 'Chờ IT xử lý'
                : 'Phiếu cần tôi duyệt'}
            </span>
            {isAccountant && !isApproverRole(currentUser) && pendingAccountantCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-extrabold">
                {pendingAccountantCount}
              </span>
            )}
            {isIT && !isApproverRole(currentUser) && pendingITCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-extrabold">
                {pendingITCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setScopeFilter('my')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              scopeFilter === 'my'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Phiếu của tôi
          </button>
        </div>
      )}

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
                <th className="py-3.5 px-4">Ca làm việc</th>
                <th className="py-3.5 px-4">Thời gian vào thực tế</th>
                <th className="py-3.5 px-4">Thời gian ra thực tế</th>
                <th className="py-3.5 px-4">Tiến trình duyệt</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
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
                      <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                        {item.shift}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.steps[0]?.status === 'approved' ? (
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.actualCheckIn || item.checkInTime}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa xác nhận</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.steps[0]?.status === 'approved' ? (
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.actualCheckOut || item.checkOutTime}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Chưa xác nhận</span>
                      )}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowQr(item);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[11px] rounded-lg border border-amber-300 dark:border-amber-800/80 flex items-center gap-1 transition-colors"
                          title="Xem mã QR để bảo vệ quét"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Mã QR</span>
                        </button>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline hidden sm:inline">
                          Xem chi tiết &rarr;
                        </span>
                      </div>
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
                  Tạo Phiếu Xác Nhận Công
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
                    Mất thẻ
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
                  onChange={(e) => handleShiftChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Ca Hành chính (08:00 - 16:30)">Ca Hành chính (08:00 - 16:30)</option>
                  <option value="Ca 1 (06:00 - 14:00)">Ca 1 (06:00 - 14:00)</option>
                  <option value="Ca 2 (14:00 - 22:00)">Ca 2 (14:00 - 22:00)</option>
                  <option value="Ca 3 (22:00 - 06:00)">Ca 3 (22:00 - 06:00)</option>
                  <option value="Ca khác">Ca khác (Tự nhập)</option>
                </select>

                {shift === 'Ca khác' && (
                  <div className="mt-2.5">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nhập ca làm việc của bạn: *
                    </label>
                    <input
                      type="text"
                      required
                      value={customShift}
                      onChange={(e) => setCustomShift(e.target.value)}
                      placeholder="VD: Ca gãy (08:00 - 12:00 & 14:00 - 18:00)..."
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
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
                  Phiếu Xác Nhận Công
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShowQr(selectedItem)}
                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 text-xs font-bold"
                  title="Xuất trình mã QR cho bảo vệ quét"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mã QR</span>
                </button>
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
                {selectedItem.steps.map((st, i) => {
                  const isSkipped = st.status === 'skipped' || (selectedItem.status === 'rejected' && i > selectedItem.currentStepIndex);
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        st.status === 'approved'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                          : st.status === 'rejected'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                          : isSkipped
                          ? 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
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
                          {isSkipped && <MinusCircle className="w-4 h-4 text-slate-400" />}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isSkipped ? (
                            <span className="italic text-slate-400">
                              Người duyệt: <b>{st.approverName}</b> - (Bỏ qua vì phiếu đã bị từ chối ở bước trước)
                            </span>
                          ) : (
                            <span>
                              Người duyệt: <b>{st.approverName}</b> {st.comment && ` - "${st.comment}"`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isSkipped ? 'text-slate-400 bg-slate-200/60 dark:bg-slate-700/50 px-2 py-0.5 rounded-md' : ''}`}>
                        {st.status === 'approved' ? 'Đã duyệt' : st.status === 'rejected' ? 'Từ chối' : isSkipped ? 'Bỏ qua' : 'Chờ duyệt'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approver Action Panel */}
            {canApprove(selectedItem) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác nhận duyệt bước này ({selectedItem.steps[selectedItem.currentStepIndex]?.stepName}):</span>
                </div>

                {!isRejecting ? (
                  <>
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
                        {selectedItem.steps[selectedItem.currentStepIndex]?.roleRequired === 'it'
                          ? '✓ IT xác nhận & Hoàn thành'
                          : selectedItem.steps[selectedItem.currentStepIndex]?.roleRequired === 'accountant'
                          ? '✓ Kế toán xác nhận trừ phí & Chuyển IT'
                          : selectedItem.currentStepIndex + 1 === selectedItem.steps.length
                          ? '✓ Xác nhận & Hoàn tất'
                          : '✓ Xác nhận & Chuyển bước tiếp theo'}
                      </button>
                      <button
                        onClick={() => setIsRejecting(true)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-rose-200 dark:border-rose-900/60">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                      Lý do từ chối phiếu: *
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do không chấp thuận..."
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReject}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                      >
                        Xác nhận từ chối phiếu
                      </button>
                      <button
                        onClick={() => {
                          setIsRejecting(false);
                          setRejectionReason('');
                        }}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedItem.status === 'pending' && !canApprove(selectedItem) && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Bước {selectedItem.currentStepIndex + 1}: {selectedItem.steps[selectedItem.currentStepIndex]?.stepName}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {selectedItem.steps[selectedItem.currentStepIndex]?.roleRequired === 'it' ? (
                      <span>Bước này phải do chính nhân viên IT (Bộ phận CNTT) xác nhận và hoàn thành cập nhật máy chấm công.</span>
                    ) : selectedItem.steps[selectedItem.currentStepIndex]?.roleRequired === 'security' ? (
                      <span>Bước này phải do Bảo vệ cổng kiểm tra và xác nhận vào/ra thực tế.</span>
                    ) : selectedItem.steps[selectedItem.currentStepIndex]?.roleRequired === 'accountant' ? (
                      <span>Bước này phải do Bộ phận Kế toán Tài chính kiểm tra và ghi nhận trừ phí phôi thẻ.</span>
                    ) : selectedItem.employeeId.toLowerCase() === currentUser?.id.toLowerCase() ? (
                      <span>Đang chờ Trưởng bộ phận phê duyệt (Người tạo phiếu không được tự phê duyệt đơn của chính mình).</span>
                    ) : (
                      <span>Đang chờ Trưởng bộ phận ({selectedItem.steps[selectedItem.currentStepIndex]?.approverName}) xem xét và phê duyệt.</span>
                    )}
                  </div>
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

      {/* MODAL: View Attendance QR Code */}
      {qrModalUrl && qrSelectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-5 h-5 text-amber-600" />
                <span>Mã QR Xác Nhận Công</span>
              </h3>
              <button
                onClick={() => setQrModalUrl(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Xuất trình mã này cho <b>Bảo vệ tại cổng</b> quét mã để xác nhận thời gian vào - ra thực tế (Bước 1 - không cần bảo vệ đăng nhập).
            </p>

            {/* Status notice */}
            {qrSelectedItem.steps[0]?.status === 'approved' ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 text-left">
                ✓ Bước 1 đã được Bảo vệ cổng xác nhận thực tế.
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300 text-left">
                ⏳ Chờ bảo vệ cổng quét mã để ghi nhận giờ vào - ra thực tế.
              </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img src={qrModalUrl} alt="Mã QR Xác Nhận Công" className="w-56 h-56 mx-auto" />
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left">
              <div className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm">{qrSelectedItem.id}</div>
              <div className="font-semibold">{qrSelectedItem.employeeName} ({qrSelectedItem.employeeId})</div>
              <div className="text-[11px] text-slate-500">{ISSUE_TYPE_LABELS[qrSelectedItem.issueType]?.text} &bull; {formatDate(qrSelectedItem.date)}</div>
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Vào: {qrSelectedItem.checkInTime} &bull; Ra: {qrSelectedItem.checkOutTime}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : '';
                  window.open(getQrConfirmUrl('attendance', qrSelectedItem.id, origin), '_blank');
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
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

      {/* Modern In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
