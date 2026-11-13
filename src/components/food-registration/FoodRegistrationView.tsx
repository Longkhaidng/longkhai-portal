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
  PREGNANT_FOOD_OPTIONS,
  VEGETARIAN_FOOD_OPTIONS,
  VEGETARIAN_UNITS,
  checkFoodQrValidity,
} from '@/types/food-registration';
import { FoodQrModal } from './FoodQrModal';
import { getQrConfirmUrl, generateQrDataUrl } from '@/lib/qr';
import { generateDocId, formatDate, formatDateTime, calculateEndDate, capitalizeFirstLetter, capitalizeWords } from '@/lib/utils';
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
  Lock,
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
  CheckSquare,
  Square,
  Ban,
  Send,
  Loader2,
  UserCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  Info,
} from 'lucide-react';

export function FoodRegistrationView() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<FoodRegistration[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Main Group Selection: 'pregnant_medicine' vs 'vegetarian'
  const [mainGroup, setMainGroup] = useState<FoodMainGroup>('pregnant_medicine');

  // Sub-category for pregnant/medicine group: 'pregnant' or 'medicine_drink'
  const [subCategory, setSubCategory] = useState<'pregnant' | 'medicine_drink'>('pregnant');

  // Pregnant Food Checkboxes (mặc định chọn 2 combo)
  const [pregnantBanhSua, setPregnantBanhSua] = useState<boolean>(true);
  const [pregnantTraiCaySua, setPregnantTraiCaySua] = useState<boolean>(true);

  // Vegetarian Food Option
  const [vegOption, setVegOption] = useState<string>(VEGETARIAN_FOOD_OPTIONS[0]);
  const [customVegDish, setCustomVegDish] = useState<string>('');
  const [vegQuantity, setVegQuantity] = useState<number>(1);
  const [vegUnit, setVegUnit] = useState<string>('Tô/Hộp');
  const [customVegUnit, setCustomVegUnit] = useState<string>('');
  const [vegNotes, setVegNotes] = useState<string>('');

  // Medicine Drink Reason (bắt buộc)
  const [medicineReason, setMedicineReason] = useState<string>('');

  // Form Basic Info
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');

  // Dates & Shifts
  const [durationDays, setDurationDays] = useState<number>(14);
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return calculateEndDate(today, 14);
  });
  const [shift, setShift] = useState<string>(FOOD_ENTRY_SHIFTS[0]);

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

  const [complianceCommitment, setComplianceCommitment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter & Tabs
  const [activeTab, setActiveTab] = useState<'my' | 'approver' | 'all'>(() =>
    isSecurityRole(currentUser) ? 'all' : 'my'
  );
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const isGuard = isSecurityRole(currentUser);
  const isAdmin = isSuperAdminOrBOD(currentUser);
  const isHR = isHRHead(currentUser);
  const isManager = currentUser?.role === 'manager';
  const isHRDeptEmployee = isHROrITDepartment(department.trim()) || isHROrITDepartment(currentUser?.department);

  const STATUS_FILTER_OPTIONS = useMemo(() => {
    if (isGuard && !isAdmin) {
      return [
        { value: 'approved', label: 'Đã duyệt' },
        { value: 'confirmed', label: 'Bảo vệ đã xác nhận' },
      ];
    }
    return [
      { value: 'pending_dept', label: 'Chờ Trưởng BP duyệt' },
      { value: 'pending_hr', label: 'Chờ Trưởng phòng HCNS duyệt' },
      { value: 'approved', label: 'Đã duyệt' },
      { value: 'confirmed', label: 'Bảo vệ đã xác nhận' },
      { value: 'rejected', label: 'Từ chối phê duyệt' },
      { value: 'expired', label: 'Hết hiệu lực' },
    ];
  }, [isGuard, isAdmin]);

  const toggleStatusFilter = (val: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Approval Modals
  const [approvingItem, setApprovingItem] = useState<{ item: FoodRegistration; level: 'dept' | 'hr' } | null>(null);
  const [approvalComment, setApprovalComment] = useState<string>('Đồng ý phê duyệt');
  const [rejectingItem, setRejectingItem] = useState<{ item: FoodRegistration; level: 'approver' | 'guard' } | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // QR Modal
  const [selectedQrItem, setSelectedQrItem] = useState<FoodRegistration | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

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

  // Handle Employee ID Change (when manager registers for others)
  const handleEmployeeIdChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const found = users.find((u) => u.id.toLowerCase() === empId.trim().toLowerCase());
    if (found) {
      setEmployeeName(found.name);
      setDepartment(found.department || '');
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Submit Registration
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
    let isVeg = mainGroup === 'vegetarian';

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

        // Bỏ phát sinh mở modal mã QR khi tạo phiếu xong theo yêu cầu
      } else {
        // MANG THAI / NƯỚC THUỐC: Luồng duyệt 2 cấp: Trưởng BP -> Trưởng phòng HCNS
        // Khởi tạo các bước duyệt
        const isManagerSender = currentUser?.role === 'manager' || isAdmin;
        const isDeptDirectToHR = isHROrITDepartment(department.trim()) || isHROrITDepartment(currentUser?.department);
        const isDirectToHR = isManagerSender || isDeptDirectToHR;
        const initialStatus = isDirectToHR ? 'pending_hr' : 'pending_dept';

        const steps = isDeptDirectToHR
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
                approverId: isManagerSender ? currentUser?.id : undefined,
                approverName: isManagerSender ? currentUser?.name : undefined,
                status: isManagerSender ? ('approved' as const) : ('pending' as const),
                comment: isManagerSender ? 'Tự tạo đơn cấp quản lý' : undefined,
                actionAt: isManagerSender ? now : undefined,
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
          currentStepIndex: isManagerSender && !isDeptDirectToHR ? 1 : 0,
          // Bỏ phát sinh mã QR khi tạo phiếu xong (chỉ phát sinh khi HCNS duyệt)
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
        if (isDeptDirectToHR) {
          showToast(`Gửi đơn thành công (${newId})! Đơn đã được chuyển trực tiếp đến Trưởng phòng HCNS duyệt.`);
        } else {
          showToast(`Gửi đơn thành công (${newId})! Đơn đang chuyển Trưởng bộ phận & Trưởng phòng HCNS duyệt.`);
        }

        // Bỏ phát sinh mở modal mã QR khi tạo phiếu xong theo yêu cầu
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
    const approver = {
      id: currentUser?.id || 'admin',
      name: currentUser?.name || 'Người duyệt',
    };

    if (level === 'dept') {
      storage.approveFoodRegistrationByDept(item.id, approver, approvalComment);
      showToast(`Trưởng BP đã duyệt đơn ${item.id}. Đơn đã chuyển đến Trưởng phòng HCNS!`);
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
      }
      showToast(`Trưởng phòng HCNS đã duyệt đơn ${item.id}! Mã QR đã được cấp phép.`);
    }

    setRegistrations(storage.getFoodRegistrations());
    setApprovingItem(null);
    setApprovalComment('Đồng ý phê duyệt');
  };

  // Approver / Guard Action: Reject
  const handleRejectSubmit = () => {
    if (!rejectingItem) return;
    const { item, level } = rejectingItem;
    const reason = rejectReason.trim() || 'Không đảm bảo điều kiện quy định';

    if (level === 'approver') {
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

    setRegistrations(storage.getFoodRegistrations());
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
    setRegistrations(storage.getFoodRegistrations());
    showToast(`Bảo vệ đã xác nhận thời gian mang vào cho phiếu ${item.id}`);
  };

  // Cancel Registration by Owner
  const handleCancelRegistration = (item: FoodRegistration) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy phiếu đăng ký "${item.id}" không?`)) return;
    storage.cancelFoodRegistration(item.id, {
      id: currentUser?.id || 'user',
      name: currentUser?.name || 'Người dùng',
    });
    setRegistrations(storage.getFoodRegistrations());
    showToast(`Đã hủy phiếu đăng ký ${item.id}`);
  };

  // Filtered List based on tab, search, status, and permissions
  const filteredRegistrations = useMemo(() => {
    // 1. RBAC filter
    let list = filterUserFoodRegistrations(registrations, currentUser, activeTab);

    // 2. Status filter (multi-select)
    if (selectedStatuses.length > 0) {
      list = list.filter((r) => {
        const isExpired = checkFoodQrValidity(r).isExpired;
        return selectedStatuses.some((st) => {
          if (st === 'expired') return isExpired;
          if (isExpired) return false;
          if (st === 'pending_approval') return r.status === 'pending_dept' || r.status === 'pending_hr';
          if (st === 'rejected') return r.status === 'rejected' || r.status === 'guard_rejected';
          return r.status === st;
        });
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
  }, [registrations, currentUser, activeTab, selectedStatuses, filterCategory, filterSearch]);

  // Counts for tabs & metric cards
  const metrics = useMemo(() => {
    const guardVisible = isGuard && !isAdmin
      ? filterUserFoodRegistrations(registrations, currentUser, 'all')
      : registrations;
    const myTickets = registrations.filter(
      (r) => currentUser && r.employeeId.toLowerCase() === currentUser.id.toLowerCase()
    );
    const waitingMe = registrations.filter((r) => {
      if (!currentUser) return false;
      if (r.employeeId.toLowerCase() === currentUser.id.toLowerCase()) return false;
      return canApproveFoodDept(currentUser, r) || canApproveFoodHR(currentUser, r);
    });
    const approvedActive = registrations.filter((r) => {
      const v = checkFoodQrValidity(r);
      return v.isValid && !v.isExpired;
    });
    const pendingTotal = registrations.filter(
      (r) => r.status === 'pending_dept' || r.status === 'pending_hr'
    ).length;

    return {
      total: guardVisible.length,
      myCount: myTickets.length,
      waitingMeCount: isGuard ? pendingTotal : waitingMe.length,
      approvedActiveCount: approvedActive.length,
      expiredCount: registrations.filter((r) => checkFoodQrValidity(r).isExpired).length,
    };
  }, [registrations, currentUser, isGuard, isAdmin]);

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

      {/* Top Banner - Bỏ hiển thị khi bảo vệ đăng nhập; đối với nhân viên khác bỏ các khung đỏ (chỉ giữ tiêu đề) */}
      {!isGuard && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-5 sm:p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <UtensilsCrossed className="w-7 h-7 sm:w-8 sm:h-8" />
              <span>Đăng Ký Mang Thực Phẩm Vào Nhà Máy</span>
            </h1>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left (5 cols) + List/Approval on Right (7 cols) - Khi là bảo vệ chỉ hiển thị Danh sách toàn màn hình */}
      <div className={isGuard ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'}>
        {/* Form Card (Ẩn hoàn toàn đối với nhân viên bảo vệ) */}
        {!isGuard && (
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Phiếu Đăng Ký Mang Thực Phẩm/ Thuốc Nước
              </h2>              
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. MSNV & Họ và tên */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã số NV (MSNV) *
                  {!(isAdmin || isManager || isHR) && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">(Tài khoản của bạn)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    readOnly={!(isAdmin || isManager || isHR)}
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeIdChange(e.target.value)}
                    placeholder="Ví dụ: 1008"
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      !(isAdmin || isManager || isHR) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
                    }`}
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  readOnly={!(isAdmin || isManager || isHR)}
                  value={employeeName}
                  onChange={(e) => setEmployeeName(capitalizeWords(e.target.value))}
                  autoCapitalize="words"
                  placeholder="Họ và tên nhân viên"
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    !(isAdmin || isManager || isHR) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
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
                  readOnly={!(isAdmin || isManager || isHR)}
                  value={department}
                  onChange={(e) => setDepartment(capitalizeFirstLetter(e.target.value))}
                  autoCapitalize="sentences"
                  placeholder="Ví dụ: Phân xưởng may - Chuyền 2"
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    !(isAdmin || isManager || isHR) ? 'bg-slate-100 dark:bg-slate-800/80 cursor-not-allowed opacity-90' : 'bg-slate-50 dark:bg-slate-800'
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMainGroup('pregnant_medicine')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    mainGroup === 'pregnant_medicine'
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-base">🤰🍵</span>
                    <span className="font-bold">1. Mang thai &amp; Nước thuốc</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Theo đợt (Duyệt Trưởng BP &amp; HCNS)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMainGroup('vegetarian')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    mainGroup === 'vegetarian'
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-bold shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-base">🥗</span>
                    <span className="font-bold">2. Thực phẩm chay</span>
                  </div>
                  <span className="justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    Dùng trong ngày
                  </span>
                </button>
              </div>
            </div>

            {/* SECTION A: MANG THAI & NƯỚC THUỐC */}
            {mainGroup === 'pregnant_medicine' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Lựa chọn con: Thực phẩm mang thai HOẶC Nước thuốc */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chọn phân loại chi tiết:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSubCategory('pregnant')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        subCategory === 'pregnant'
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>🤰</span>
                      <span>Thực phẩm mang thai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSubCategory('medicine_drink')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        subCategory === 'medicine_drink'
                          ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>🍵</span>
                      <span>Nước thuốc</span>
                    </button>
                  </div>
                </div>

                {/* Nếu chọn THỰC PHẨM CHO NGƯỜI MANG THAI: Cố định 2 combo, không cho chỉnh sửa */}
                {subCategory === 'pregnant' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Chi tiết món ăn *
                      </label>
                    </div>

                    <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div
                        className="flex-1 p-3 rounded-xl border border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs flex items-center justify-between select-none cursor-not-allowed opacity-95"
                        title="Mục chi tiết món ăn cố định theo quy định, không cho phép chỉnh sửa"
                      >
                        <span className="text-xs">🍪 Bánh + Sữa</span>
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          readOnly
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center justify-center shrink-0 py-0.5 sm:py-0">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700 shadow-2xs">
                          hoặc
                        </span>
                      </div>

                      <div
                        className="flex-1 p-3 rounded-xl border border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs flex items-center justify-between select-none cursor-not-allowed opacity-95"
                        title="Mục chi tiết món ăn cố định theo quy định, không cho phép chỉnh sửa"
                      >
                        <span className="text-xs">🍎 Trái cây + Sữa</span>
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          readOnly
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-amber-600 dark:text-amber-400 font-medium italic flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      * Ghi chú: Mỗi người chỉ được phép mang vào 02 đơn vị cho mỗi loại thực phẩm.
                    </p>
                  </div>
                )}

                {/* Nếu chọn NƯỚC THUỐC: Lý do mang nước thuốc vào (mục này bắt buộc phải nhập) */}
                {subCategory === 'medicine_drink' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Lý do mang nước thuốc vào: *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={medicineReason}
                      onChange={(e) => setMedicineReason(capitalizeFirstLetter(e.target.value))}
                      autoCapitalize="sentences"
                      placeholder="Nhập lý do bắt buộc (Ví dụ: Uống thuốc bắc/thuốc nam điều trị theo đơn bác sĩ sau bữa ăn, nước thảo dược hỗ trợ sức khỏe...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                    />
                  </div>
                )}

                {/* Thời gian: Số ngày cần mang vào -> Ngày bắt đầu -> Ngày kết thúc (Tự động tính, không cho sửa) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:min-h-[32px] leading-snug">
                      Số ngày cần mang vào *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={durationDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        const days = isNaN(val) ? 0 : val;
                        handleDurationDaysChange(days);
                      }}
                      placeholder="Ví dụ: 14"
                      className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:min-h-[32px] leading-snug">
                      Ngày bắt đầu *
                    </label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => handleEntryDateChange(e.target.value)}
                      className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:min-h-[32px] leading-snug">
                      Ngày kết thúc *
                    </label>
                    <input
                      type="date"
                      required
                      readOnly
                      disabled
                      value={toDate}
                      title="Ngày kết thúc được tự động tính từ Ngày bắt đầu + Số ngày cần mang vào (không cho phép chỉnh sửa)"
                      className="w-full h-10 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-not-allowed opacity-90"
                    />
                  </div>
                </div>

                {/* Thông báo luồng phê duyệt 2 cấp */}
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {isHRDeptEmployee
                        ? 'Luồng duyệt trực tiếp Trưởng phòng HCNS:'
                        : 'Luồng duyệt 2 cấp theo quy định:'}
                    </span>
                  </div>
                  <p className="leading-relaxed">
                    {isHRDeptEmployee
                      ? 'Nhân viên ➔ Trưởng phòng HCNS. Sau khi Trưởng phòng HCNS duyệt, phiếu sẽ có hiệu lực trong khoảng thời gian đã duyệt sẽ được kích hoạt.'
                      : 'Người lao động ➔ Trưởng bộ phận ➔ Trưởng phòng HCNS. Khi được phê duyệt hoàn tất, phiếu sẽ có hiệu lực trong khoảng thời gian đã duyệt sẽ được kích hoạt.'}
                  </p>
                </div>
              </div>
            )}

            {/* SECTION B: THỰC PHẨM CHAY */}
            {mainGroup === 'vegetarian' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Hàng gồm: Chọn món chay mang vào, Số lượng, Đơn vị tính */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Chọn món chay mang vào: *
                      </label>
                      <select
                        value={vegOption}
                        onChange={(e) => setVegOption(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {VEGETARIAN_FOOD_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt === 'Khác' ? 'Khác (Người lao động tự nhập vào)' : opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Số lượng: *
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={vegQuantity}
                        onChange={(e) => setVegQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Đơn vị tính: *
                      </label>
                      <select
                        value={vegUnit}
                        onChange={(e) => setVegUnit(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {VEGETARIAN_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u === 'Khác' ? 'Khác (tự nhập)' : u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Khi chọn Đơn vị tính là 'Khác' */}
                  {vegUnit === 'Khác' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nhập đơn vị tính khác (người lao động tự nhập): *
                      </label>
                      <input
                        type="text"
                        required
                        value={customVegUnit}
                        onChange={(e) => setCustomVegUnit(capitalizeFirstLetter(e.target.value))}
                        autoCapitalize="sentences"
                        placeholder="Ví dụ: Phần, Suất, Chai, Bát..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  )}

                  {/* Khi chọn món 'Khác', người lao động tự nhập vào */}
                  {vegOption === 'Khác' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Nhập tên món chay khác: *
                      </label>
                      <input
                        type="text"
                        required
                        value={customVegDish}
                        onChange={(e) => setCustomVegDish(capitalizeFirstLetter(e.target.value))}
                        autoCapitalize="sentences"
                        placeholder="Nhập tên món chay mang vào (Ví dụ: Cơm chay sườn non, gỏi cuốn chay...)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  )}

                  {/* Thêm mục ghi chú phía dưới */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ghi chú:
                    </label>
                    <input
                      type="text"
                      value={vegNotes}
                      onChange={(e) => setVegNotes(capitalizeFirstLetter(e.target.value))}
                      autoCapitalize="sentences"
                      placeholder="Nhập chi tiết nếu vượt quá 01 đơn vị tính/ người"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                {/* Ngày mang vào & Ca làm việc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ngày mang vào *
                    </label>
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ca làm việc *
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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

            {/* Cam kết tuân thủ bắt buộc */}
            <div
              onClick={() => setComplianceCommitment((prev) => !prev)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                complianceCommitment
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/80 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {complianceCommitment ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                )}
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold block mb-0.5">Cam kết tuân thủ bắt buộc:</span>
                <span className="italic">
                  &ldquo;Tôi tự chịu trách nhiệm về ATVSTP và mọi rủi ro phát sinh liên quan đến thực phẩm, nước uống do tôi mang vào Công ty.&rdquo;
                </span>
              </div>
            </div>

            {/* Nút gửi đăng ký */}
            <button
              type="submit"
              disabled={isSubmitting || !complianceCommitment}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                complianceCommitment && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-emerald-600/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng ký...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {mainGroup === 'vegetarian'
                      ? 'Gửi Đăng Ký'
                      : isHRDeptEmployee
                      ? 'Gửi Đăng Ký Trực Tiếp Trưởng Phòng HCNS'
                      : 'Gửi Đăng Ký Trình Duyệt 2 Cấp'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
        )}

        {/* List & Approvals Card (Mở rộng toàn màn hình khi là bảo vệ) */}
        <div className={`${isGuard ? 'w-full' : 'lg:col-span-7'} bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Danh Sách Đăng Ký Thực Phẩm</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isGuard
                  ? 'Danh sách người lao động đăng ký mang thực phẩm - Bảo vệ kiểm soát và quét QR tại cổng'
                  : 'Theo dõi tiến trình phê duyệt và kiểm soát ra vào'}
              </p>
            </div>

            {/* Scope Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
              {!isGuard && (
                <button
                  type="button"
                  onClick={() => setActiveTab('my')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'my'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Của tôi ({metrics.myCount})
                </button>
              )}

              {(isManager || isHR || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('approver')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'approver'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>Cần tôi duyệt</span>
                  {metrics.waitingMeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                      {metrics.waitingMeCount}
                    </span>
                  )}
                </button>
              )}

              {(isGuard || isHR || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {isGuard ? 'Danh sách người lao động' : 'Toàn bộ'} ({metrics.total})
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Tìm mã phiếu, tên, MSNV, món ăn..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer flex items-center justify-between gap-2 text-left"
              >
                <span className="truncate">
                  {selectedStatuses.length === 0
                    ? 'Tất cả trạng thái'
                    : selectedStatuses.length === 1
                    ? STATUS_FILTER_OPTIONS.find((o) => o.value === selectedStatuses[0])?.label
                    : `Đã chọn ${selectedStatuses.length} trạng thái`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-150 ${
                    isStatusDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1.5 max-h-72 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedStatuses([])}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                      selectedStatuses.length === 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                        selectedStatuses.length === 0
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {selectedStatuses.length === 0 && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="truncate">Tất cả trạng thái</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {STATUS_FILTER_OPTIONS.map((opt) => {
                    const isChecked = selectedStatuses.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleStatusFilter(opt.value)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                <option value="all">Tất cả nhóm</option>
                <option value="pregnant">Mang thai</option>
                <option value="medicine_drink">Nước thuốc</option>
                <option value="vegetarian">Ăn chay</option>
              </select>
            </div>
          </div>

          {/* Bảng danh sách đăng ký thực phẩm (Hiển thị dạng dòng trên cả điện thoại và máy tính) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            {filteredRegistrations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                <p>Chưa có dữ liệu đăng ký thực phẩm nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <th className="p-3 whitespace-nowrap">Mã phiếu</th>
                    <th className="p-3 whitespace-nowrap sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                      Người mang vào
                    </th>
                    <th className="p-3 whitespace-nowrap text-center">Thời gian hiệu lực</th>
                    <th className="p-3 whitespace-nowrap text-center">Phân loại &amp; Món</th>
                    <th className="p-3 whitespace-nowrap text-center">Trạng thái</th>
                    <th className="p-3 whitespace-nowrap text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredRegistrations.map((item) => {
                    const validity = checkFoodQrValidity(item);
                    const canDeptApprove = canApproveFoodDept(currentUser, item);
                    const canHRApprove = canApproveFoodHR(currentUser, item);

                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Doc ID - Xóa mã QR cột mã phiếu theo yêu cầu */}
                        <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <span>{item.id}</span>
                        </td>

                        {/* Employee Name & Dept - Cố định cột người mang vào khi dùng điện thoại để lướt ngang qua kiểm tra và xác nhận */}
                        <td className="p-3 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.employeeName}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {item.employeeId} &bull; {item.department}
                          </span>
                        </td>

                        {/* Validity period - Căn giữa, bỏ dòng còn hiệu lực theo khung đỏ */}
                        <td className="p-3 whitespace-nowrap text-center">
                          {item.toDate ? (
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                                {formatDate(item.entryDate)} &rarr; {formatDate(item.toDate)}
                              </span>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block">
                                Theo đợt duyệt
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                                {formatDate(item.entryDate)}
                              </span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                                {item.shift || 'Ca làm việc'}
                              </span>
                            </div>
                          )}

                          {validity.isExpired && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              Hết hiệu lực
                            </span>
                          )}
                        </td>

                        {/* Category & Dishes - Căn chỉnh hiển thị đầy đủ dữ liệu khi xem trên điện thoại, máy tính bảng, máy tính */}
                        <td className="p-3 min-w-[220px] max-w-[340px] whitespace-normal">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            <span>{FOOD_CATEGORY_ICONS[item.category]}</span>
                            <span>{FOOD_CATEGORY_LABELS[item.category]}</span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-1 leading-relaxed break-words">
                            {item.foodDetails}
                          </p>
                          {item.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5 break-words">
                              Ghi chú: {item.notes}
                            </p>
                          )}
                        </td>

                        {/* Status - Căn giữa, phiếu hết hiệu lực hiển thị "Hết hiệu lực" ở cột trạng thái */}
                        <td className="p-3 whitespace-nowrap text-center">
                          {validity.isExpired ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800">
                              Hết hiệu lực
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${FOOD_STATUS_BADGES[item.status]}`}
                            >
                              {FOOD_STATUS_LABELS[item.status]}
                            </span>
                          )}
                        </td>

                        {/* Actions - Căn giữa */}
                        <td className="p-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Button: Phê duyệt Trưởng bộ phận (Step 1) */}
                            {canDeptApprove && (
                              <button
                                type="button"
                                onClick={() => setApprovingItem({ item, level: 'dept' })}
                                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Trưởng BP duyệt đơn này"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Trưởng BP duyệt</span>
                              </button>
                            )}

                            {/* Button: Phê duyệt Trưởng phòng HCNS (Step 2) */}
                            {canHRApprove && (
                              <button
                                type="button"
                                onClick={() => setApprovingItem({ item, level: 'hr' })}
                                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                                title="Trưởng phòng HCNS duyệt"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>HCNS duyệt</span>
                              </button>
                            )}

                            {/* Button: Từ chối duyệt (nếu có quyền duyệt) */}
                            {(canDeptApprove || canHRApprove) && (
                              <button
                                type="button"
                                onClick={() => setRejectingItem({ item, level: 'approver' })}
                                className="p-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Từ chối đơn đăng ký này"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Button: Bảo vệ cổng xác nhận hoặc từ chối (Vẫn giữ lại 2 nút cho vào và từ chối cho đến khi phiếu hết hiệu lực) */}
                            {isGuard && !validity.isExpired && (item.status === 'approved' || item.status === 'confirmed' || item.status === 'guard_rejected') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGuardConfirm(item)}
                                  className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                                  title="Bảo vệ xác nhận giờ vào"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Cho vào</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingItem({ item, level: 'guard' })}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                                  title="Bảo vệ từ chối tại cổng"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}

                            {/* Khi phiếu ĐÃ HẾT HIỆU LỰC thì các nút ẩn đi, thay bằng dòng chữ đã xác nhận hoặc đã từ chối */}
                            {isGuard && validity.isExpired && item.status === 'confirmed' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                <span>Đã xác nhận</span>
                              </span>
                            )}

                            {isGuard && validity.isExpired && (item.status === 'guard_rejected' || item.status === 'rejected') && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold text-xs">
                                <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>Đã từ chối</span>
                              </span>
                            )}

                            {isGuard && validity.isExpired && item.status === 'approved' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 font-bold text-xs">
                                <span>Hết hiệu lực</span>
                              </span>
                            )}

                            {/* Button: Xem QR (CHỈ hiển thị khi đơn đã duyệt/xác nhận và không phải bảo vệ) */}
                            {!isGuard &&
                              (item.status === 'approved' || item.status === 'confirmed') &&
                              (item.qrCodeUrl || item.qrDataUrl) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedQrItem(item);
                                    setIsQrModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                  title="Xem mã QR"
                                >
                                  <QrCode className="w-4 h-4" />
                                </button>
                              )}

                            {/* Button: Hủy đơn nếu còn pending */}
                            {(item.status === 'pending_dept' || item.status === 'pending_hr') &&
                              (currentUser?.id === item.employeeId || isAdmin) && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelRegistration(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                  title="Hủy đơn này"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Phê duyệt (Trưởng BP / Trưởng phòng HCNS) */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {approvingItem.level === 'dept'
                    ? '1. Trưởng Bộ Phận Phê Duyệt'
                    : isHROrITDepartment(approvingItem.item.department)
                    ? 'Trưởng Phòng HCNS Phê Duyệt (Duyệt trực tiếp)'
                    : '2. Trưởng Phòng HCNS Phê Duyệt'}
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
                  {formatDate(approvingItem.item.entryDate)} → {formatDate(approvingItem.item.toDate || approvingItem.item.entryDate)}
                </span>
              </div>
              {approvingItem.item.category === 'pregnant' && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  * Ghi chú: Mỗi người chỉ được phép mang vào 02 đơn vị cho mỗi loại thực phẩm.
                </div>
              )}
            </div>

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
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
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
                onClick={() => setApprovingItem(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Từ chối (Người duyệt hoặc Bảo vệ) */}
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
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
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
        }}
      />
    </div>
  );
}
