'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { User } from '@/types/user';
import {
  FoodRegistration,
  FoodCategory,
  FoodMainGroup,
  FOOD_CATEGORY_LABELS,
  FOOD_CATEGORY_ICONS,
  FOOD_STATUS_LABELS,
  FOOD_STATUS_BADGES,
  FOOD_ENTRY_SHIFTS,
  VEGETARIAN_FOOD_OPTIONS,
  VEGETARIAN_UNITS,
  checkFoodQrValidity,
} from '@/types/food-registration';
import { FoodQrModal } from './FoodQrModal';
import { getQrConfirmUrl, generateQrDataUrl } from '@/lib/qr';
import { generateDocId, formatDate, formatDateTime, calculateEndDate, capitalizeFirstLetter, capitalizeWords } from '@/lib/utils';
import { dispatchFoodRegistrationApprovalEmail } from '@/lib/email';
import {
  isSecurityRole,
  isSuperAdminOrBOD,
  isHRHead,
  canApproveFoodDept,
  canApproveFoodHR,
  filterUserFoodRegistrations,
  isHROrITDepartment,
} from '@/lib/permissions';
import {
  UtensilsCrossed,
  Plus,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  User as UserIcon,
  Search,
  Filter,
  Ban,
  Send,
  Loader2,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  Printer,
  MinusCircle,
  X,
} from 'lucide-react';

export function FoodRegistrationView() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<FoodRegistration[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User permissions & roles
  const isGuard = isSecurityRole(currentUser);
  const isAdmin = isSuperAdminOrBOD(currentUser);
  const isHR = isHRHead(currentUser);
  const isHRStaff = isHR || currentUser?.role === 'hr' || currentUser?.role === 'cb';
  const isManager = currentUser?.role === 'manager';
  const canManageOthers = isAdmin || isManager || isHRStaff || isGuard;

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<FoodRegistration | null>(null);
  const [approvingItem, setApprovingItem] = useState<{ item: FoodRegistration; level: 'dept' | 'hr' } | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('Đồng ý phê duyệt');
  const [modalActionType, setModalActionType] = useState<'approve' | 'reject'>('approve');
  const [modalRejectReason, setModalRejectReason] = useState<string>('');
  const [rejectingItem, setRejectingItem] = useState<{ item: FoodRegistration; level: 'approver' | 'guard' } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [selectedQrItem, setSelectedQrItem] = useState<FoodRegistration | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Helper tính số ngày đăng ký
  const calculateItemDays = (item: FoodRegistration): number => {
    if (item.durationDays && item.durationDays > 0) return item.durationDays;
    if (!item.toDate || item.toDate === item.entryDate) return 1;
    try {
      const d1 = new Date(item.entryDate);
      const d2 = new Date(item.toDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  // Helper mở modal phê duyệt & từ chối
  const openApproveModal = (item: FoodRegistration, level: 'dept' | 'hr') => {
    setApprovingItem({ item, level });
    setModalActionType('approve');
    setApprovalComment('Đồng ý phê duyệt');
    setModalRejectReason('');
  };

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'my' | 'approver' | 'all'>(() =>
    isSecurityRole(currentUser) ? 'all' : 'my'
  );
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedStatusSingle, setSelectedStatusSingle] = useState<string>('all');

  // Form States
  const [mainGroup, setMainGroup] = useState<FoodMainGroup>('pregnant_medicine');
  const [subCategory, setSubCategory] = useState<'pregnant' | 'medicine_drink'>('pregnant');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [vegOption, setVegOption] = useState<string>(VEGETARIAN_FOOD_OPTIONS[0]);
  const [customVegDish, setCustomVegDish] = useState<string>('');
  const [vegQuantity, setVegQuantity] = useState<number>(1);
  const [vegUnit, setVegUnit] = useState<string>('Tô/Hộp');
  const [customVegUnit, setCustomVegUnit] = useState<string>('');
  const [vegNotes, setVegNotes] = useState<string>('');
  const [medicineReason, setMedicineReason] = useState<string>('');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return calculateEndDate(today, 14);
  });
  const [shift, setShift] = useState<string>(FOOD_ENTRY_SHIFTS[0]);
  const [complianceCommitment, setComplianceCommitment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isHRDeptEmployee = isHROrITDepartment(department.trim()) || isHROrITDepartment(currentUser?.department);

  const handleDurationDaysChange = (val: number) => {
    setDurationDays(val);
    if (val > 0 && entryDate) {
      setToDate(calculateEndDate(entryDate, val));
    }
  };

  const handleEntryDateChange = (val: string) => {
    setEntryDate(val);
    if (durationDays > 0 && val) {
      setToDate(calculateEndDate(val, durationDays));
    }
  };

  // Toast helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Load Initial Data
  const loadData = () => {
    const loadedUsers = storage.getUsers();
    setUsers(loadedUsers);
    const loadedRegs = storage.getFoodRegistrations();
    setRegistrations(loadedRegs);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => setRegistrations(storage.getFoodRegistrations());
    window.addEventListener('storage', handleSync);
    window.addEventListener('food_registrations_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('food_registrations_updated', handleSync);
    };
  }, []);

  // Sync Form with Current User
  useEffect(() => {
    if (currentUser) {
      setSelectedEmployeeId(currentUser.id);
      setEmployeeName(currentUser.name);
      setDepartment(currentUser.department || 'Phân xưởng sản xuất');
      if (isGuard) {
        setActiveTab('all');
      } else if (isAdmin || isHR || isManager) {
        setActiveTab('approver');
      } else {
        setActiveTab('my');
      }
    }
  }, [currentUser, isAdmin, isGuard, isHR, isManager]);

  // Check URL params for direct approval link from email (?type=food_registration&id=...&action=approve)
  useEffect(() => {
    if (typeof window === 'undefined' || !currentUser) return;
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    const urlId = urlParams.get('id');
    const urlAction = urlParams.get('action');

    if ((urlType === 'food' || urlType === 'food_registration') && urlId) {
      const all = storage.getFoodRegistrations();
      const target = all.find((r) => r.id.toLowerCase() === urlId.toLowerCase());
      if (target) {
        setFilterSearch(urlId);
        const canDept = canApproveFoodDept(currentUser, target);
        const canHR = canApproveFoodHR(currentUser, target);
        const uid = currentUser.id.toLowerCase();
        const isMy =
          target.employeeId.toLowerCase() === uid ||
          target.createdById?.toLowerCase() === uid ||
          (target as any).createdBy?.toLowerCase() === uid;

        if (canDept || canHR) {
          setActiveTab('approver');
        } else if (isMy) {
          setActiveTab('my');
        } else {
          setActiveTab('all');
        }

        if (urlAction === 'approve' && (canDept || canHR)) {
          openApproveModal(target, canHR ? 'hr' : 'dept');
        } else if (urlAction === 'reject' && (canDept || canHR)) {
          setRejectingItem({ item: target, level: 'approver' });
        } else {
          setSelectedDetailItem(target);
        }
      }
    }
  }, [currentUser]);

  // Handle Employee ID Change (when manager/HR registers for others)
  const handleEmployeeIdChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const found = users.find((u) => u.id.toLowerCase() === empId.trim().toLowerCase());
    if (found) {
      setEmployeeName(found.name);
      setDepartment(found.department || '');
    }
  };

  // Submit Registration Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployeeId.trim()) {
      showToast('Vui lòng nhập Mã số nhân viên (MSNV).', 'error');
      return;
    }
    if (!employeeName.trim()) {
      showToast('Vui lòng nhập Họ và tên nhân viên.', 'error');
      return;
    }
    if (!department.trim()) {
      showToast('Vui lòng nhập Bộ phận / Phân xưởng / Chuyền sản xuất.', 'error');
      return;
    }

    let finalCategory: FoodCategory;
    let finalFoodDetails = '';
    const isVeg = mainGroup === 'vegetarian';

    if (isVeg) {
      finalCategory = 'vegetarian';
      const dishName = vegOption === 'Khác' ? capitalizeFirstLetter(customVegDish.trim()) : vegOption;
      if (vegOption === 'Khác' && !customVegDish.trim()) {
        showToast('Vui lòng nhập tên món chay bạn muốn mang vào.', 'error');
        return;
      }
      if (vegUnit === 'Khác' && !customVegUnit.trim()) {
        showToast('Vui lòng nhập đơn vị tính khác cho món chay.', 'error');
        return;
      }
      const unitStr = vegUnit === 'Khác' ? capitalizeFirstLetter(customVegUnit.trim()) : vegUnit;
      const cleanNotes = vegNotes.trim() ? capitalizeFirstLetter(vegNotes.trim()) : '';
      finalFoodDetails = `${dishName} (SL: ${vegQuantity} ${unitStr})${cleanNotes ? ` - Ghi chú: ${cleanNotes}` : ''}`;

      if (!entryDate) {
        showToast('Vui lòng chọn ngày mang thực phẩm vào.', 'error');
        return;
      }
      if (!shift) {
        showToast('Vui lòng chọn ca làm việc.', 'error');
        return;
      }
    } else {
      // Pregnant or Medicine drink
      finalCategory = subCategory;
      if (subCategory === 'pregnant') {
        // Cố định 2 combo, không cho chỉnh sửa
        finalFoodDetails = 'Bánh + Sữa hoặc Trái cây + Sữa';
      } else {
        // Nước thuốc: Bắt buộc nhập lý do
        if (!medicineReason.trim()) {
          showToast('Vui lòng nhập lý do mang nước thuốc vào nhà máy (bắt buộc).', 'error');
          return;
        }
        finalFoodDetails = `Nước thuốc (Lý do: ${capitalizeFirstLetter(medicineReason.trim())})`;
      }

      if (!durationDays || durationDays <= 0) {
        showToast('Vui lòng nhập số ngày cần mang vào hợp lệ (tối thiểu 1 ngày).', 'error');
        return;
      }
      if (!entryDate) {
        showToast('Vui lòng chọn ngày bắt đầu.', 'error');
        return;
      }
      if (!toDate) {
        showToast('Ngày kết thúc không hợp lệ.', 'error');
        return;
      }
      if (toDate < entryDate) {
        showToast('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.', 'error');
        return;
      }
    }

    if (!complianceCommitment) {
      showToast('Bạn phải tích chọn cam kết tuân thủ an toàn vệ sinh thực phẩm.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentList = storage.getFoodRegistrations();
      const newId = generateDocId('TP', currentList);
      const now = new Date().toISOString();

      let newRegistration: FoodRegistration;

      if (isVeg) {
        // THỰC PHẨM CHAY: Có hiệu lực trong ngày (12h)
        const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
        const qrUrl = getQrConfirmUrl('food', newId);
        const qrDataUrl = await generateQrDataUrl(qrUrl);
        newRegistration = {
          id: newId,
          employeeId: selectedEmployeeId.trim(),
          employeeName: capitalizeWords(employeeName.trim()),
          createdById: currentUser?.id || selectedEmployeeId.trim(),
          createdByName: currentUser?.name || capitalizeWords(employeeName.trim()),
          department: capitalizeFirstLetter(department.trim()),
          entryDate,
          shift,
          category: 'vegetarian',
          mainGroup: 'vegetarian',
          foodDetails: finalFoodDetails,
          customFoodDetails: vegOption === 'Khác' ? capitalizeFirstLetter(customVegDish.trim()) : undefined,
          quantity: vegQuantity,
          unit: vegUnit === 'Khác' ? capitalizeFirstLetter(customVegUnit.trim()) : vegUnit,
          customUnit: vegUnit === 'Khác' ? capitalizeFirstLetter(customVegUnit.trim()) : undefined,
          notes: vegNotes.trim() ? capitalizeFirstLetter(vegNotes.trim()) : undefined,
          complianceCommitment: true,
          status: 'approved',
          expiresAt,
          qrCodeUrl: qrUrl,
          qrDataUrl,
          createdAt: now,
          updatedAt: now,
        };

        storage.saveFoodRegistration(newRegistration, {
          id: currentUser?.id || selectedEmployeeId,
          name: currentUser?.name || employeeName,
        });

        setRegistrations(storage.getFoodRegistrations());
        showToast(`Đăng ký thành công! Mã phiếu: ${newId}.`);
      } else {
        // MANG THAI / NƯỚC THUỐC:
        // - Nhân viên thuộc phòng HCNS hoặc CNTT: gửi trực tiếp đến mail Trưởng phòng HCNS
        // - Nhân viên các phòng ban khác: Luồng duyệt 2 cấp tuần tự: Trưởng BP -> Trưởng phòng HCNS
        const isDirectToHR = isHROrITDepartment(department.trim()) || isHROrITDepartment(currentUser?.department);
        const initialStatus = isDirectToHR ? 'pending_hr' : 'pending_dept';

        const steps = isDirectToHR
          ? [
              {
                stepName: 'Trưởng phòng HCNS' as const,
                roleRequired: 'hr' as const,
                status: 'pending' as const,
              },
            ]
          : [
              {
                stepName: 'Trưởng bộ phận' as const,
                roleRequired: 'manager' as const,
                status: 'pending' as const,
              },
              {
                stepName: 'Trưởng phòng HCNS' as const,
                roleRequired: 'hr' as const,
                status: 'pending' as const,
              },
            ];

        newRegistration = {
          id: newId,
          employeeId: selectedEmployeeId.trim(),
          employeeName: capitalizeWords(employeeName.trim()),
          createdById: currentUser?.id || selectedEmployeeId.trim(),
          createdByName: currentUser?.name || capitalizeWords(employeeName.trim()),
          department: capitalizeFirstLetter(department.trim()),
          entryDate,
          toDate,
          durationDays,
          category: finalCategory,
          mainGroup: 'pregnant_medicine',
          foodDetails: finalFoodDetails,
          medicineReason: subCategory === 'medicine_drink' ? capitalizeFirstLetter(medicineReason.trim()) : undefined,
          complianceCommitment: true,
          status: initialStatus,
          steps,
          currentStepIndex: 0,
          qrCodeUrl: undefined,
          qrDataUrl: undefined,
          createdAt: now,
          updatedAt: now,
        };

        storage.saveFoodRegistration(newRegistration, {
          id: currentUser?.id || selectedEmployeeId,
          name: currentUser?.name || employeeName,
        });

        setRegistrations(storage.getFoodRegistrations());
        if (isDirectToHR) {
          dispatchFoodRegistrationApprovalEmail(newRegistration, 'hr').then((res) => {
            if (res.success) {
              showToast(`Gửi đơn thành công (${newId})! Đã gửi email thông báo trực tiếp đến Trưởng phòng HCNS (${res.toEmail || 'Quỳnh'}).`);
            } else {
              showToast(`Gửi đơn thành công (${newId})! Đơn đã chuyển trực tiếp đến Trưởng phòng HCNS phê duyệt.`);
            }
          });
        } else {
          dispatchFoodRegistrationApprovalEmail(newRegistration, 'dept').then((res) => {
            if (res.success) {
              showToast(`Gửi đơn thành công (${newId})! Đã gửi email thông báo đến Trưởng bộ phận (${res.toEmail || 'Quản lý'}).`);
            } else {
              showToast(`Gửi đơn thành công (${newId})! Đơn đã chuyển đến Trưởng bộ phận phê duyệt.`);
            }
          });
        }
      }

      // Reset form
      setCustomVegDish('');
      setVegQuantity(1);
      setVegUnit('Tô/Hộp');
      setCustomVegUnit('');
      setVegNotes('');
      setMedicineReason('');
      setDurationDays(14);
      setEntryDate(new Date().toISOString().slice(0, 10));
      setToDate(calculateEndDate(new Date().toISOString().slice(0, 10), 14));
      setComplianceCommitment(false);
      setShowCreateModal(false);
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi gửi đăng ký.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approver Action: Approve
  const handleApproveSubmit = async () => {
    if (!approvingItem) return;
    const { item, level } = approvingItem;

    const canDept = canApproveFoodDept(currentUser, item);
    const canHR = canApproveFoodHR(currentUser, item);
    if (!canDept && !canHR) {
      showToast('Bạn không có quyền phê duyệt phiếu này!', 'error');
      setApprovingItem(null);
      return;
    }

    const approver = {
      id: currentUser?.id || 'admin',
      name: currentUser?.name || 'Người duyệt',
    };

    if (level === 'dept') {
      storage.approveFoodRegistrationByDept(item.id, approver, approvalComment);
      const list = storage.getFoodRegistrations();
      const updated = list.find((r) => r.id === item.id);
      if (updated) {
        dispatchFoodRegistrationApprovalEmail(updated, 'hr').then((res) => {
          if (res.success) {
            showToast(`Trưởng BP đã duyệt đơn ${item.id}. Đã gửi email đến Trưởng phòng HCNS (${res.toEmail || 'Quỳnh'})!`);
          } else {
            showToast(`Trưởng BP đã duyệt đơn ${item.id}. Đơn đã chuyển đến Trưởng phòng HCNS!`);
          }
        });
        if (selectedDetailItem?.id === item.id) {
          setSelectedDetailItem(updated);
        }
      }
    } else {
      const qrUrl = getQrConfirmUrl('food', item.id);
      const qrDataUrl = await generateQrDataUrl(qrUrl);
      storage.approveFoodRegistrationByHR(item.id, approver, approvalComment);
      const list = storage.getFoodRegistrations();
      const updated = list.find((r) => r.id === item.id);
      if (updated) {
        updated.qrCodeUrl = qrUrl;
        updated.qrDataUrl = qrDataUrl;
        storage.saveFoodRegistration(updated, approver);
        if (selectedDetailItem?.id === item.id) {
          setSelectedDetailItem(updated);
        }
      }
      showToast(`Trưởng phòng HCNS đã duyệt đơn ${item.id}! Mã QR đã được cấp phép.`);
    }

    setRegistrations(storage.getFoodRegistrations());
    setApprovingItem(null);
    setModalActionType('approve');
    setApprovalComment('Đồng ý phê duyệt');
    setModalRejectReason('');
  };

  // Reject directly from the Approve/Reject notification modal
  const handleModalRejectSubmit = () => {
    if (!approvingItem) return;
    const { item } = approvingItem;
    const reason = modalRejectReason.trim();
    if (!reason) {
      showToast('Vui lòng nhập lý do từ chối!', 'error');
      return;
    }

    const canDept = canApproveFoodDept(currentUser, item);
    const canHR = canApproveFoodHR(currentUser, item);
    if (!canDept && !canHR) {
      showToast('Bạn không có quyền từ chối phiếu này!', 'error');
      setApprovingItem(null);
      setModalActionType('approve');
      setModalRejectReason('');
      return;
    }

    storage.rejectFoodRegistrationByApprover(
      item.id,
      { id: currentUser?.id || 'approver', name: currentUser?.name || 'Người duyệt' },
      reason
    );
    showToast(`Đã từ chối phê duyệt đơn ${item.id}`);

    const updatedList = storage.getFoodRegistrations();
    setRegistrations(updatedList);
    if (selectedDetailItem?.id === item.id) {
      const updated = updatedList.find((r) => r.id === item.id);
      if (updated) setSelectedDetailItem(updated);
    }
    setApprovingItem(null);
    setModalActionType('approve');
    setModalRejectReason('');
  };

  // Approver / Guard Action: Reject
  const handleRejectSubmit = () => {
    if (!rejectingItem) return;
    const { item, level } = rejectingItem;
    const reason = rejectReason.trim() || (level === 'guard' ? 'Thực phẩm không đúng với đăng ký' : 'Không đảm bảo điều kiện quy định');

    if (level === 'approver') {
      const canDept = canApproveFoodDept(currentUser, item);
      const canHR = canApproveFoodHR(currentUser, item);
      if (!canDept && !canHR) {
        showToast('Bạn không có quyền từ chối phiếu này!', 'error');
        setRejectingItem(null);
        return;
      }

      storage.rejectFoodRegistrationByApprover(
        item.id,
        { id: currentUser?.id || 'approver', name: currentUser?.name || 'Người duyệt' },
        reason
      );
      showToast(`Đã từ chối phê duyệt đơn ${item.id}`);
    } else {
      storage.rejectFoodRegistration(
        item.id,
        currentUser?.name || 'Bảo vệ cổng',
        reason,
        currentUser?.id
      );
      showToast(`Bảo vệ đã ghi nhận từ chối cho mang vào phiếu ${item.id}`);
    }

    const updatedList = storage.getFoodRegistrations();
    setRegistrations(updatedList);
    if (selectedDetailItem?.id === item.id) {
      const updated = updatedList.find((r) => r.id === item.id);
      if (updated) setSelectedDetailItem(updated);
    }
    setRejectingItem(null);
    setRejectReason('');
  };

  // Guard Direct Confirmation at Gate
  const handleGuardConfirm = (item: FoodRegistration) => {
    const validity = checkFoodQrValidity(item);
    if (validity.isExpired) {
      showToast('Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực.', 'error');
      return;
    }
    if (validity.isNotYetValid || !validity.isValid) {
      showToast(validity.message || 'Phiếu đăng ký chưa có hiệu lực', 'error');
      return;
    }
    const guardName = currentUser?.name || 'Bảo vệ cổng';
    storage.confirmFoodRegistration(item.id, guardName, 'Đã kiểm tra đúng danh mục thực phẩm cho phép', currentUser?.id);
    const updatedList = storage.getFoodRegistrations();
    setRegistrations(updatedList);
    if (selectedDetailItem?.id === item.id) {
      const updated = updatedList.find((r) => r.id === item.id);
      if (updated) setSelectedDetailItem(updated);
    }
    showToast(`Bảo vệ đã xác nhận thời gian mang vào cho phiếu ${item.id}`);
  };

  // Cancel Registration by Owner
  const handleCancelRegistration = (item: FoodRegistration) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy phiếu đăng ký "${item.id}" không?`)) return;
    storage.cancelFoodRegistration(item.id, {
      id: currentUser?.id || 'user',
      name: currentUser?.name || 'Người dùng',
    });
    const updatedList = storage.getFoodRegistrations();
    setRegistrations(updatedList);
    if (selectedDetailItem?.id === item.id) {
      setSelectedDetailItem(null);
    }
    showToast(`Đã hủy phiếu đăng ký ${item.id}`);
  };

  // Filtered List based on tab, search, status, and permissions
  const filteredRegistrations = useMemo(() => {
    // 1. RBAC filter
    let list = filterUserFoodRegistrations(registrations, currentUser, activeTab);

    // 2. Status filter
    if (selectedStatusSingle !== 'all') {
      list = list.filter((r) => {
        const isExpired = checkFoodQrValidity(r).isExpired;
        if (selectedStatusSingle === 'expired') return isExpired;
        if (isExpired) return false;
        if (selectedStatusSingle === 'pending_dept') return r.status === 'pending_dept';
        if (selectedStatusSingle === 'pending_hr') return r.status === 'pending_hr';
        if (selectedStatusSingle === 'approved') return r.status === 'approved';
        if (selectedStatusSingle === 'confirmed') return r.status === 'confirmed';
        if (selectedStatusSingle === 'rejected') return r.status === 'rejected' || r.status === 'guard_rejected';
        return r.status === selectedStatusSingle;
      });
    }

    // 3. Category filter
    if (filterCategory !== 'all') {
      list = list.filter((r) => r.category === filterCategory);
    }

    // 4. Search Query
    if (filterSearch.trim()) {
      const q = filterSearch.trim().toLowerCase();
      list = list.filter((r) => {
        return (
          r.id.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeId.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.foodDetails.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [registrations, currentUser, activeTab, selectedStatusSingle, filterCategory, filterSearch]);

  // Counts for tabs & metric cards
  const metrics = useMemo(() => {
    const uid = currentUser?.id.toLowerCase();
    const guardVisible = isGuard && !isAdmin
      ? filterUserFoodRegistrations(registrations, currentUser, 'all')
      : registrations;
    const myTickets = filterUserFoodRegistrations(registrations, currentUser, 'my');
    const waitingMe = filterUserFoodRegistrations(registrations, currentUser, 'approver');
    const pendingTotal = registrations.filter(
      (r) => r.status === 'pending_dept' || r.status === 'pending_hr'
    ).length;

    return {
      total: guardVisible.length,
      myCount: myTickets.length,
      waitingMeCount: isGuard ? pendingTotal : waitingMe.length,
    };
  }, [registrations, currentUser, isGuard, isAdmin]);

  // Check if search query matches in other tabs when current tab has 0 results
  const matchInOtherTabs = useMemo(() => {
    if (!filterSearch.trim() || filteredRegistrations.length > 0) return null;
    const q = filterSearch.trim().toLowerCase();
    const searchFilter = (r: FoodRegistration) =>
      r.id.toLowerCase().includes(q) ||
      r.employeeName.toLowerCase().includes(q) ||
      r.employeeId.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.foodDetails.toLowerCase().includes(q);

    if (activeTab !== 'approver' && (isManager || isHR || isAdmin)) {
      const approverList = filterUserFoodRegistrations(registrations, currentUser, 'approver');
      const found = approverList.filter(searchFilter);
      if (found.length > 0) {
        return { tab: 'approver' as const, count: found.length, tabLabel: 'Phiếu cần tôi duyệt' };
      }
    }

    if (activeTab !== 'my' && !isGuard) {
      const myList = filterUserFoodRegistrations(registrations, currentUser, 'my');
      const found = myList.filter(searchFilter);
      if (found.length > 0) {
        return { tab: 'my' as const, count: found.length, tabLabel: 'Phiếu của tôi' };
      }
    }

    if (activeTab !== 'all') {
      const allList = filterUserFoodRegistrations(registrations, currentUser, 'all');
      const found = allList.filter(searchFilter);
      if (found.length > 0) {
        return { tab: 'all' as const, count: found.length, tabLabel: 'Tất cả phiếu' };
      }
    }

    return null;
  }, [filterSearch, filteredRegistrations.length, activeTab, registrations, currentUser, isManager, isHR, isAdmin, isGuard]);

  const handleTabChange = (newTab: 'all' | 'approver' | 'my') => {
    setActiveTab(newTab);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold text-white transition-all transform animate-in slide-in-from-top-4 ${
            toastMessage.type === 'error'
              ? 'bg-rose-600 shadow-rose-600/30'
              : 'bg-emerald-600 shadow-emerald-600/30'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header (Layout identical to Attendance Confirm View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Phiếu Đăng Ký Mang Thực Phẩm
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {!canManageOthers
              ? `Chỉ hiển thị các phiếu đăng ký thực phẩm của bạn (${currentUser?.name || ''})`
              : isGuard
              ? 'Danh sách người lao động đăng ký mang thực phẩm - Bảo vệ kiểm soát và quét QR tại cổng'
              : isAdmin
              ? 'Quản lý phiếu đăng ký thực phẩm toàn công ty (người mang thai, nước thuốc, ăn chay)'
              : isHRStaff
              ? 'Quản lý và tiếp nhận phê duyệt đăng ký thực phẩm toàn công ty'
              : `Quản lý phiếu đăng ký thực phẩm của nhân viên bộ phận ${currentUser?.department || ''}`}
          </p>
        </div>

        {/* Nút đăng ký mang thực phẩm vào (Ẩn đối với bảo vệ) */}
        {!isGuard && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng ký mang thực phẩm vào</span>
          </button>
        )}
      </div>

      {/* Scope Switcher for Approvers / Managers / Security / HR / Admin */}
      {canManageOthers && (
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isGuard ? 'Danh sách người lao động' : 'Tất cả phiếu'} ({metrics.total})
          </button>

          {(isManager || isHR || isAdmin) && (
            <button
              onClick={() => handleTabChange('approver')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'approver'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Phiếu cần tôi duyệt</span>
              {metrics.waitingMeCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-700 font-extrabold">
                  {metrics.waitingMeCount}
                </span>
              )}
            </button>
          )}

          {!isGuard && (
            <button
              onClick={() => handleTabChange('my')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'my'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Phiếu của tôi ({metrics.myCount})
            </button>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Tìm theo tên NV, mã NV, phòng ban, món ăn..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
          {filterSearch && (
            <button
              type="button"
              onClick={() => setFilterSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 sm:flex-initial py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
          >
            <option value="all">Tất cả nhóm</option>
            <option value="pregnant">Mang thai</option>
            <option value="medicine_drink">Nước thuốc</option>
            <option value="vegetarian">Ăn chay</option>
          </select>

          <select
            value={selectedStatusSingle}
            onChange={(e) => setSelectedStatusSingle(e.target.value)}
            className="flex-1 sm:flex-initial py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending_dept">Chờ Trưởng BP duyệt</option>
            <option value="pending_hr">Chờ Trưởng phòng HCNS duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="confirmed">Bảo vệ đã xác nhận</option>
            <option value="rejected">Từ chối phê duyệt</option>
            <option value="expired">Hết hiệu lực</option>
          </select>

          {(selectedStatusSingle !== 'all' || filterCategory !== 'all' || filterSearch.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setSelectedStatusSingle('all');
                setFilterCategory('all');
                setFilterSearch('');
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline px-2 py-1 font-semibold whitespace-nowrap cursor-pointer shrink-0"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Table: Dual Responsive View (Mobile Cards + Desktop Table) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Mobile View (md:hidden landscape:hidden) */}
        <div className="md:hidden landscape:hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
          {filteredRegistrations.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400 text-xs space-y-3">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1 opacity-60" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                Không tìm thấy phiếu nào trong mục <b>&ldquo;{activeTab === 'my' ? 'Phiếu của tôi' : activeTab === 'approver' ? 'Phiếu cần tôi duyệt' : 'Tất cả phiếu'}&rdquo;</b>
                {filterSearch ? ` khớp với &ldquo;${filterSearch}&rdquo;` : ''}.
              </p>
              {matchInOtherTabs && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Tìm thấy {matchInOtherTabs.count} phiếu khớp trong tab &ldquo;{matchInOtherTabs.tabLabel}&rdquo;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab(matchInOtherTabs.tab)}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Chuyển sang tab &ldquo;{matchInOtherTabs.tabLabel}&rdquo; để xem
                  </button>
                </div>
              )}
              {(filterSearch || selectedStatusSingle !== 'all' || filterCategory !== 'all') && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterSearch('');
                      setSelectedStatusSingle('all');
                      setFilterCategory('all');
                    }}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Xóa bộ lọc để hiển thị danh sách
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredRegistrations.map((item) => {
              const validity = checkFoodQrValidity(item);
              const canDept = canApproveFoodDept(currentUser, item);
              const canHR = canApproveFoodHR(currentUser, item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDetailItem(item)}
                  className="p-3.5 space-y-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {item.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {FOOD_CATEGORY_ICONS[item.category]} {FOOD_CATEGORY_LABELS[item.category]}
                      </span>
                    </div>
                    {validity.isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                        Hết hiệu lực
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${FOOD_STATUS_BADGES[item.status]}`}>
                        {FOOD_STATUS_LABELS[item.status]}
                      </span>
                    )}
                  </div>

                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {item.employeeName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.employeeId} &bull; {item.department}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.foodDetails}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Thời gian: {item.toDate ? `${formatDate(item.entryDate)} → ${formatDate(item.toDate)}` : `Ngày ${formatDate(item.entryDate)} (${item.shift || 'Ca HC'})`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {canDept && (
                        <button
                          type="button"
                          onClick={() => openApproveModal(item, 'dept')}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg"
                        >
                          Trưởng BP duyệt
                        </button>
                      )}
                      {canHR && (
                        <button
                          type="button"
                          onClick={() => openApproveModal(item, 'hr')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg"
                        >
                          HCNS duyệt
                        </button>
                      )}
                      {(canDept || canHR) && (
                        <button
                          type="button"
                          onClick={() => setRejectingItem({ item, level: 'approver' })}
                          className="p-1 border border-rose-300 text-rose-600 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {isGuard && !validity.isExpired && (item.status === 'approved' || item.status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleGuardConfirm(item)}
                          className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[11px] rounded-lg"
                        >
                          Cho vào
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!isGuard && (item.status === 'approved' || item.status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQrItem(item);
                            setIsQrModalOpen(true);
                          }}
                          className="px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1 cursor-pointer hover:bg-amber-500/20"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Mã QR</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedDetailItem(item)}
                        className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-0.5"
                      >
                        <span>Chi tiết</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop & Landscape Table View */}
        <div className="hidden md:block landscape:block overflow-x-auto overflow-y-auto max-h-[600px] rounded-2xl scrollbar-thin">
          <table className="w-full text-left border-separate border-spacing-0 text-xs min-w-[1020px]">
            <thead className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 shadow-xs border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="sticky top-0 left-0 z-50 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-nowrap w-[95px] min-w-[95px] border-b border-slate-200 dark:border-slate-700">Mã phiếu</th>
                <th className="sticky top-0 left-[95px] z-50 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-normal w-[170px] min-w-[170px] border-b border-r border-slate-200 dark:border-slate-700 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]">Nhân viên</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-normal w-[145px] min-w-[145px] border-b border-slate-200 dark:border-slate-700">Nhóm thực phẩm</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 w-[180px] min-w-[170px] max-w-[230px] border-b border-slate-200 dark:border-slate-700">Chi tiết món / Nước thuốc</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-normal w-[150px] min-w-[140px] border-b border-slate-200 dark:border-slate-700">Thời gian hiệu lực</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-normal w-[155px] min-w-[150px] border-b border-slate-200 dark:border-slate-700">Tiến trình duyệt</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 whitespace-normal w-[140px] min-w-[135px] border-b border-slate-200 dark:border-slate-700">Trạng thái</th>
                <th className="sticky top-0 z-40 bg-slate-100 dark:bg-slate-800 py-3 px-3.5 text-right whitespace-nowrap w-[130px] min-w-[130px] border-b border-slate-200 dark:border-slate-700">Chi tiết / Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs border-b border-slate-100 dark:border-slate-800">
                    <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                    <p className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                      Không tìm thấy phiếu nào trong mục <b>&ldquo;{activeTab === 'my' ? 'Phiếu của tôi' : activeTab === 'approver' ? 'Phiếu cần tôi duyệt' : 'Tất cả phiếu'}&rdquo;</b>
                      {filterSearch ? ` khớp với từ khóa &ldquo;${filterSearch}&rdquo;` : ''}.
                    </p>
                    {matchInOtherTabs && (
                      <div className="mt-3 inline-flex items-center gap-2 p-2.5 px-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Tìm thấy <b>{matchInOtherTabs.count}</b> phiếu khớp từ khóa trong tab <b>&ldquo;{matchInOtherTabs.tabLabel}&rdquo;</b>.
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab(matchInOtherTabs.tab)}
                          className="ml-2 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Chuyển đến xem ngay &rarr;
                        </button>
                      </div>
                    )}
                    {(filterSearch || selectedStatusSingle !== 'all' || filterCategory !== 'all') && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterSearch('');
                            setSelectedStatusSingle('all');
                            setFilterCategory('all');
                          }}
                          className="text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                        >
                          Xóa bộ lọc & Hiển thị lại tất cả phiếu trong tab này
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((item) => {
                  const validity = checkFoodQrValidity(item);
                  const canDeptApprove = canApproveFoodDept(currentUser, item);
                  const canHRApprove = canApproveFoodHR(currentUser, item);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedDetailItem(item)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 transition-colors py-3 px-3.5 font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap w-[95px] min-w-[95px] border-b border-slate-100 dark:border-slate-800">
                        {item.id}
                      </td>
                      <td className="sticky left-[95px] z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 transition-colors py-3 px-3.5 w-[170px] min-w-[170px] max-w-[170px] border-b border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.3)]">
                        <div className="font-bold text-slate-900 dark:text-white leading-snug break-words whitespace-normal">
                          {item.employeeName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 leading-snug break-words whitespace-normal">
                          {item.employeeId} &bull; {item.department}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 w-[145px] min-w-[145px] max-w-[160px] border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] px-2 py-1 rounded-lg font-semibold inline-flex items-start gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 leading-snug break-words whitespace-normal text-left">
                          <span className="shrink-0 mt-0.5">{FOOD_CATEGORY_ICONS[item.category]}</span>
                          <span className="break-words">{FOOD_CATEGORY_LABELS[item.category]}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 w-[180px] min-w-[170px] max-w-[230px] border-b border-slate-100 dark:border-slate-800">
                        <div className="font-medium text-slate-800 dark:text-slate-200 leading-snug break-words whitespace-normal">
                          {item.foodDetails}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 leading-snug break-words whitespace-normal">
                            Ghi chú: {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 w-[150px] min-w-[140px] max-w-[160px] border-b border-slate-100 dark:border-slate-800">
                        {item.toDate ? (
                          <div className="leading-snug break-words whitespace-normal">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {formatDate(item.entryDate)} &rarr; {formatDate(item.toDate)}
                            </div>
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                              {item.durationDays || 14} ngày
                            </div>
                          </div>
                        ) : (
                          <div className="leading-snug break-words whitespace-normal">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              Ngày {formatDate(item.entryDate)}
                            </div>
                            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                              {item.shift || 'Ca làm việc'}
                            </div>
                          </div>
                        )}
                        {validity.isExpired && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Hết hiệu lực
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 w-[155px] min-w-[150px] max-w-[165px] border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-snug break-words whitespace-normal">
                          {item.mainGroup === 'vegetarian' ? (
                            <span className="text-emerald-600 font-bold">Tự động kích hoạt (Dùng trong ngày)</span>
                          ) : item.status === 'approved' ? (
                            <span className="text-emerald-600 font-bold">Hoàn tất quy trình</span>
                          ) : item.status === 'confirmed' ? (
                            <span className="text-teal-600 font-bold">Bảo vệ đã xác nhận</span>
                          ) : item.status === 'rejected' || item.status === 'guard_rejected' ? (
                            <span className="text-rose-600 font-bold">Bị từ chối</span>
                          ) : item.status === 'pending_dept' ? (
                            <span className="text-amber-600 font-bold">1. Chờ Trưởng BP duyệt</span>
                          ) : (
                            <span className="text-indigo-600 font-bold">2. Chờ Trưởng phòng HCNS duyệt</span>
                          )}
                        </div>
                        {item.mainGroup !== 'vegetarian' && item.steps && item.steps.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
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
                                title={`Bước ${i + 1}: ${st.stepName}`}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 w-[140px] min-w-[135px] max-w-[150px] border-b border-slate-100 dark:border-slate-800">
                        {validity.isExpired ? (
                          <span className="inline-block px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 leading-snug break-words whitespace-normal text-center">
                            Hết hiệu lực
                          </span>
                        ) : (
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${FOOD_STATUS_BADGES[item.status]} leading-snug break-words whitespace-normal text-center`}>
                            {FOOD_STATUS_LABELS[item.status]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right w-[130px] min-w-[130px] border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-end flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isGuard && (item.status === 'approved' || item.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQrItem(item);
                                setIsQrModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px] rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1 hover:bg-amber-500/20 cursor-pointer"
                              title="Xem mã QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                          )}
                          {canDeptApprove && (
                            <button
                              type="button"
                              onClick={() => openApproveModal(item, 'dept')}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] cursor-pointer"
                              title="Trưởng BP duyệt"
                            >
                              Trưởng BP duyệt
                            </button>
                          )}
                          {canHRApprove && (
                            <button
                              type="button"
                              onClick={() => openApproveModal(item, 'hr')}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] cursor-pointer"
                              title="Trưởng phòng HCNS duyệt"
                            >
                              Trưởng phòng HCNS duyệt
                            </button>
                          )}
                          {(canDeptApprove || canHRApprove) && (
                            <button
                              type="button"
                              onClick={() => setRejectingItem({ item, level: 'approver' })}
                              className="p-1 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Từ chối"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {isGuard && !validity.isExpired && (item.status === 'approved' || item.status === 'confirmed') && (
                            <button
                              type="button"
                              onClick={() => handleGuardConfirm(item)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px] cursor-pointer"
                              title="Bảo vệ cho vào"
                            >
                              Cho vào
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailItem(item)}
                            className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
                            title="Xem chi tiết phiếu"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ĐĂNG KÝ MANG THỰC PHẨM VÀO (Hiện ra khi nhấn nút "+ Đăng ký mang thực phẩm vào") */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Đăng Ký Mang Thực Phẩm Vào Nhà Máy
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vui lòng chọn nhóm thực phẩm và điền đầy đủ thông tin theo quy định
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* 1. MSNV & Họ và tên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                <div className="flex flex-col justify-between h-full">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 leading-snug">
                    Mã số NV (MSNV) *
                    {!(isAdmin || isManager || isHRStaff) && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(Tài khoản của bạn)</span>
                    )}
                  </label>
                  <div className="relative mt-auto">
                    <input
                      type="text"
                      required
                      readOnly={!(isAdmin || isManager || isHRStaff)}
                      value={selectedEmployeeId}
                      onChange={(e) => handleEmployeeIdChange(e.target.value)}
                      placeholder="Ví dụ: 1008"
                      className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        !(isAdmin || isManager || isHRStaff) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
                      }`}
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 leading-snug">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={!(isAdmin || isManager || isHRStaff)}
                    value={employeeName}
                    onChange={(e) => setEmployeeName(capitalizeWords(e.target.value))}
                    autoCapitalize="words"
                    placeholder="Họ và tên nhân viên"
                    className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 mt-auto ${
                      !(isAdmin || isManager || isHRStaff) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* 2. Bộ phận / Phân xưởng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bộ phận / Phân xưởng / Chuyền sản xuất *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    readOnly={!(isAdmin || isManager || isHRStaff)}
                    value={department}
                    onChange={(e) => setDepartment(capitalizeFirstLetter(e.target.value))}
                    autoCapitalize="sentences"
                    placeholder="Ví dụ: Phân xưởng may - Chuyền 2"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      !(isAdmin || isManager || isHRStaff) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 3. Phân chia 2 mục lớn theo yêu cầu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Nhóm thực phẩm đăng ký *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMainGroup('pregnant_medicine')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 h-full ${
                      mainGroup === 'pregnant_medicine'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl shrink-0">🤰🍵</span>
                    <div>
                      <span className="text-xs font-bold block leading-snug">
                        1. Mang thai &amp; Nước thuốc
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Theo đợt (Trưởng BP &amp; HCNS duyệt)
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMainGroup('vegetarian')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 h-full ${
                      mainGroup === 'vegetarian'
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xl shrink-0">🥗</span>
                    <div>
                      <span className="text-xs font-bold block leading-snug">
                        2. Thực phẩm chay
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Dùng trong ngày
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Group 1: Mang thai & Nước thuốc */}
              {mainGroup === 'pregnant_medicine' && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="subCat"
                        checked={subCategory === 'pregnant'}
                        onChange={() => setSubCategory('pregnant')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>Thực phẩm cho người mang thai</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="subCat"
                        checked={subCategory === 'medicine_drink'}
                        onChange={() => setSubCategory('medicine_drink')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span>Nước thuốc</span>
                    </label>
                  </div>

                  {subCategory === 'pregnant' ? (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-slate-700 dark:text-slate-300 space-y-1.5">
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Danh mục cố định cho người mang thai:
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        • Bánh + Sữa hoặc Trái cây + Sữa
                      </p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                        * Quy định: Tối đa 02 đơn vị cho mỗi loại thực phẩm.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Lý do mang nước thuốc vào (bắt buộc): *
                      </label>
                      <input
                        type="text"
                        required
                        value={medicineReason}
                        onChange={(e) => setMedicineReason(capitalizeFirstLetter(e.target.value))}
                        autoCapitalize="sentences"
                        placeholder="Ví dụ: Bác sĩ chỉ định uống thuốc nam/thuốc bắc sau ăn, điều trị đau bao tử..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  )}

                  {/* Khoảng ngày & Số ngày */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ngày bắt đầu: *
                      </label>
                      <input
                        type="date"
                        required
                        value={entryDate}
                        onChange={(e) => handleEntryDateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số ngày mang vào: *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        required
                        value={durationDays}
                        onChange={(e) => handleDurationDaysChange(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ngày kết thúc (tự động):
                      </label>
                      <input
                        type="date"
                        readOnly
                        value={toDate}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Thông tin luồng duyệt */}
                  <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>
                        {isHRDeptEmployee
                          ? 'Luồng duyệt trực tiếp Trưởng phòng HCNS:'
                          : 'Luồng phê duyệt 2 cấp tuần tự:'}
                      </span>
                    </span>
                    <p className="leading-relaxed">
                      {isHRDeptEmployee
                        ? 'Nhân viên ➔ Trưởng phòng HCNS phê duyệt. Sau khi Trưởng phòng HCNS duyệt, phiếu sẽ có hiệu lực trong khoảng thời gian đã duyệt.'
                        : 'Nhân viên ➔ Trưởng bộ phận duyệt ➔ Trưởng phòng HCNS duyệt. Sau khi Trưởng phòng HCNS duyệt hoàn tất, hệ thống sẽ tự động kích hoạt mã QR hiệu lực để bảo vệ cổng kiểm soát.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Group 2: Thực phẩm chay */}
              {mainGroup === 'vegetarian' && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3.5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Chọn món chay mang vào: *
                      </label>
                      <select
                        value={vegOption}
                        onChange={(e) => setVegOption(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        {VEGETARIAN_FOOD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số lượng: *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        required
                        value={vegQuantity}
                        onChange={(e) => setVegQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {vegOption === 'Khác' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nhập tên món chay khác: *
                      </label>
                      <input
                        type="text"
                        required
                        value={customVegDish}
                        onChange={(e) => setCustomVegDish(capitalizeFirstLetter(e.target.value))}
                        autoCapitalize="sentences"
                        placeholder="Ví dụ: Cơm chay sườn non, gỏi cuốn chay..."
                        className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Đơn vị tính: *
                      </label>
                      <select
                        value={vegUnit}
                        onChange={(e) => setVegUnit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      >
                        {VEGETARIAN_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ghi chú:
                      </label>
                      <input
                        type="text"
                        value={vegNotes}
                        onChange={(e) => setVegNotes(capitalizeFirstLetter(e.target.value))}
                        autoCapitalize="sentences"
                        placeholder="Nhập chi tiết nếu vượt quá 01 đơn vị tính / người"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  {vegUnit === 'Khác' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nhập đơn vị tính khác: *
                      </label>
                      <input
                        type="text"
                        required
                        value={customVegUnit}
                        onChange={(e) => setCustomVegUnit(capitalizeFirstLetter(e.target.value))}
                        placeholder="Ví dụ: Suất, Bát, Chai..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  )}

                  {/* Ngày & Ca */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ngày mang vào: *
                      </label>
                      <input
                        type="date"
                        required
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ca làm việc: *
                      </label>
                      <select
                        value={shift}
                        onChange={(e) => setShift(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                      >
                        {FOOD_ENTRY_SHIFTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cam kết VSATTP */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 text-xs leading-relaxed select-none">
                  <input
                    type="checkbox"
                    checked={complianceCommitment}
                    onChange={(e) => setComplianceCommitment(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>
                    Tôi cam kết thực phẩm mang vào đáp ứng đầy đủ điều kiện an toàn vệ sinh thực phẩm, đóng gói sạch sẽ, đúng chủng loại đã đăng ký và chịu hoàn toàn trách nhiệm theo quy định của Công ty.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !complianceCommitment}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                    isSubmitting || !complianceCommitment
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi Đăng Ký Mang Thực Phẩm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT PHIẾU (Hiện ra khi nhấn vào 1 dòng trong bảng) */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Phiếu Đăng Ký Thực Phẩm
                  </h3>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    {selectedDetailItem.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isGuard && (selectedDetailItem.status === 'approved' || selectedDetailItem.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      setSelectedQrItem(selectedDetailItem);
                      setIsQrModalOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Xuất trình mã QR"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Mã QR</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  title="In phiếu"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer px-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Người mang vào:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedDetailItem.employeeName} ({selectedDetailItem.employeeId})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Phòng ban / Xưởng:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedDetailItem.department}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Nhóm thực phẩm:</span>
                <span className="font-bold text-slate-800 dark:text-white inline-flex items-center gap-1">
                  <span>{FOOD_CATEGORY_ICONS[selectedDetailItem.category]}</span>
                  <span>{FOOD_CATEGORY_LABELS[selectedDetailItem.category]}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời gian hiệu lực:</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedDetailItem.toDate
                    ? `${formatDate(selectedDetailItem.entryDate)} → ${formatDate(selectedDetailItem.toDate)} (${selectedDetailItem.durationDays || 14} ngày)`
                    : `Ngày ${formatDate(selectedDetailItem.entryDate)} (${selectedDetailItem.shift || 'Ca HC'})`}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[11px]">Chi tiết món ăn / thực phẩm:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedDetailItem.foodDetails}
                </span>
              </div>
              {selectedDetailItem.medicineReason && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Lý do mang nước thuốc:</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {selectedDetailItem.medicineReason}
                  </span>
                </div>
              )}
              {selectedDetailItem.notes && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Ghi chú:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {selectedDetailItem.notes}
                  </span>
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-400 text-[11px]">Trạng thái phiếu:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${FOOD_STATUS_BADGES[selectedDetailItem.status]}`}>
                  {FOOD_STATUS_LABELS[selectedDetailItem.status]}
                </span>
              </div>
            </div>

            {/* Workflow steps (for pregnant/medicine) */}
            {selectedDetailItem.mainGroup !== 'vegetarian' && selectedDetailItem.steps && selectedDetailItem.steps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                  Tiến trình phê duyệt ({selectedDetailItem.steps.length} bước):
                </h4>
                <div className="space-y-2">
                  {selectedDetailItem.steps.map((st, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        st.status === 'approved'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                          : st.status === 'rejected'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
                          : i === selectedDetailItem.currentStepIndex
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
                          {st.approverName ? (
                            <span>
                              Người duyệt: <b>{st.approverName}</b> {st.comment && ` - "${st.comment}"`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Đang chờ xử lý...</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase">
                        {st.status === 'approved' ? 'Đã duyệt' : st.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guard result at gate */}
            {(selectedDetailItem.guardName || selectedDetailItem.status === 'confirmed' || selectedDetailItem.status === 'guard_rejected') && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Kiểm soát tại cổng (Bảo vệ):
                </span>
                {selectedDetailItem.status === 'confirmed' ? (
                  <p className="text-teal-700 dark:text-teal-300 font-medium">
                    ✓ Bảo vệ ({selectedDetailItem.guardName || 'Bảo vệ cổng'}) đã xác nhận cho mang thực phẩm vào nhà máy{selectedDetailItem.confirmedAt ? ` lúc ${formatDateTime(selectedDetailItem.confirmedAt)}` : ''}.
                  </p>
                ) : selectedDetailItem.status === 'guard_rejected' ? (
                  <p className="text-rose-700 dark:text-rose-300 font-medium">
                    ✕ Bảo vệ từ chối: {selectedDetailItem.guardNote || selectedDetailItem.rejectedReason || 'Không đảm bảo điều kiện quy định'}.
                  </p>
                ) : null}
              </div>
            )}

            {/* Approver Action Panel inside Detail Modal */}
            {(() => {
              const canDept = canApproveFoodDept(currentUser, selectedDetailItem);
              const canHR = canApproveFoodHR(currentUser, selectedDetailItem);
              if (canDept || canHR) {
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Thao tác phê duyệt ({canHR ? 'Trưởng phòng HCNS' : 'Trưởng bộ phận'}):</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openApproveModal(selectedDetailItem, canHR ? 'hr' : 'dept')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                      >
                        ✓ Duyệt phiếu này
                      </button>
                      <button
                        onClick={() => setRejectingItem({ item: selectedDetailItem, level: 'approver' })}
                        className="px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Guard Action Panel inside Detail Modal */}
            {isGuard && !checkFoodQrValidity(selectedDetailItem).isExpired && (selectedDetailItem.status === 'approved' || selectedDetailItem.status === 'confirmed') && (
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Bảo vệ kiểm soát tại cổng:</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGuardConfirm(selectedDetailItem)}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                  >
                    ✓ Xác nhận cho vào
                  </button>
                  <button
                    onClick={() => setRejectingItem({ item: selectedDetailItem, level: 'guard' })}
                    className="px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ✕ Từ chối tại cổng
                  </button>
                </div>
              </div>
            )}

            {/* Cancel Button if Owner & Pending */}
            {(selectedDetailItem.status === 'pending_dept' || selectedDetailItem.status === 'pending_hr') &&
              (currentUser?.id === selectedDetailItem.employeeId || isAdmin) && (
                <div className="pt-1">
                  <button
                    onClick={() => handleCancelRegistration(selectedDetailItem)}
                    className="w-full py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Hủy phiếu đăng ký này</span>
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {/* MODAL PHÊ DUYỆT & TỪ CHỐI */}
      {approvingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setApprovingItem(null);
            setModalActionType('approve');
            setModalRejectReason('');
          }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng X góc trên bên phải thay thế cho nút Đóng ở dưới */}
            <button
              type="button"
              onClick={() => {
                setApprovingItem(null);
                setModalActionType('approve');
                setModalRejectReason('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đóng hộp thoại"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              {modalActionType === 'approve' ? (
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {modalActionType === 'approve' ? (
                    approvingItem.level === 'dept'
                      ? '1. Trưởng Bộ Phận Phê Duyệt'
                      : isHROrITDepartment(approvingItem.item.department)
                      ? 'Trưởng Phòng HCNS Phê Duyệt (Duyệt trực tiếp)'
                      : '2. Trưởng Phòng HCNS Phê Duyệt'
                  ) : (
                    approvingItem.level === 'dept'
                      ? '1. Trưởng Bộ Phận Từ Chối'
                      : 'Trưởng Phòng HCNS Từ Chối Phê Duyệt'
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phiếu: <b className="font-mono">{approvingItem.item.id}</b> - {approvingItem.item.employeeName}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Phân loại:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {FOOD_CATEGORY_LABELS[approvingItem.item.category]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chi tiết món:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {approvingItem.item.foodDetails}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Khoảng ngày:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {approvingItem.item.toDate
                    ? `${formatDate(approvingItem.item.entryDate)} → ${formatDate(approvingItem.item.toDate)}`
                    : `Ngày ${formatDate(approvingItem.item.entryDate)} (${approvingItem.item.shift || 'Ca HC'})`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Số ngày đăng ký:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {calculateItemDays(approvingItem.item)} ngày
                </span>
              </div>
              {approvingItem.item.category === 'pregnant' && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  * Ghi chú: Mỗi người chỉ được phép mang vào 02 đơn vị cho mỗi loại thực phẩm.
                </div>
              )}
            </div>

            {modalActionType === 'approve' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Ý kiến phê duyệt:
                  </label>
                  <input
                    type="text"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(capitalizeFirstLetter(e.target.value))}
                    autoCapitalize="sentences"
                    placeholder="Ý kiến ghi chú của người duyệt..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleApproveSubmit}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {approvingItem.level === 'dept'
                        ? 'Xác nhận duyệt (Chuyển HCNS)'
                        : 'Duyệt hoàn tất'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalActionType('reject')}
                    className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Từ chối</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="animate-in fade-in duration-150">
                  <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">
                    Lý do từ chối: *
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    required
                    value={modalRejectReason}
                    onChange={(e) => setModalRejectReason(capitalizeFirstLetter(e.target.value))}
                    autoCapitalize="sentences"
                    placeholder="Nhập lý do từ chối phê duyệt đơn này..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-50/40 dark:bg-rose-950/20 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleModalRejectSubmit}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Xác nhận từ chối</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalActionType('approve');
                      setModalRejectReason('');
                    }}
                    className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Quay lại
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {rejectingItem.level === 'approver'
                    ? 'Từ Chối Phê Duyệt'
                    : 'Bảo Vệ Từ Chối Cho Vào'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phiếu: <b className="font-mono">{rejectingItem.item.id}</b> - {rejectingItem.item.employeeName}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Lý do từ chối: *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(capitalizeFirstLetter(e.target.value))}
                autoCapitalize="sentences"
                placeholder="Ví dụ: Đem thực phẩm không đúng danh mục, bao bì rách không đảm bảo vệ sinh..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <XCircle className="w-4 h-4" />
                <span>Xác nhận từ chối</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <FoodQrModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedQrItem(null);
        }}
        registration={selectedQrItem}
        isGuard={isGuard}
        onGuardConfirm={(item) => {
          const validity = checkFoodQrValidity(item);
          if (validity.isExpired || validity.isNotYetValid || !validity.isValid) {
            handleGuardConfirm(item);
            return;
          }
          handleGuardConfirm(item);
          setSelectedQrItem((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
        }}
        onGuardReject={(item) => {
          setRejectingItem({ item, level: 'guard' });
          setRejectReason('Thực phẩm không đúng với đăng ký');
        }}
      />
    </div>
  );
}
