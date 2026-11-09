'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { User } from '@/types/user';
import {
  FoodRegistration,
  FoodCategory,
  FOOD_CATEGORY_LABELS,
  FOOD_CATEGORY_ICONS,
  FOOD_STATUS_LABELS,
  FOOD_STATUS_BADGES,
  FOOD_ENTRY_SHIFTS,
  PREGNANT_FOOD_OPTIONS,
  VEGETARIAN_FOOD_OPTIONS,
} from '@/types/food-registration';
import { FoodQrModal } from './FoodQrModal';
import { getQrConfirmUrl, generateQrDataUrl } from '@/lib/qr';
import { generateDocId, formatDate, formatDateTime } from '@/lib/utils';
import { isSecurityRole } from '@/lib/permissions';
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
  CheckSquare,
  Square,
  Ban,
  Send,
  Loader2,
} from 'lucide-react';

export function FoodRegistrationView() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<FoodRegistration[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [shift, setShift] = useState<string>(FOOD_ENTRY_SHIFTS[0]);
  const [category, setCategory] = useState<FoodCategory>('pregnant');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [foodDetails, setFoodDetails] = useState<string>(PREGNANT_FOOD_OPTIONS[0]);
  const [customFoodDetails, setCustomFoodDetails] = useState<string>('');
  const [complianceCommitment, setComplianceCommitment] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Table filter state
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAllFactory, setShowAllFactory] = useState<boolean>(false);

  // QR Modal
  const [selectedQrItem, setSelectedQrItem] = useState<FoodRegistration | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Security Direct Action Modal
  const [rejectModalItem, setRejectModalItem] = useState<FoodRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const isGuard = isSecurityRole(currentUser);
  const isAdminOrManager =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'hr' ||
    currentUser?.role === 'manager';

  const isDateRange = category === 'pregnant' || category === 'medicine_drink';

  // Load Initial Data
  const loadData = () => {
    const loadedUsers = storage.getUsers();
    setUsers(loadedUsers);
    const loadedRegs = storage.getFoodRegistrations();
    setRegistrations(loadedRegs);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync Form with Current User
  useEffect(() => {
    if (currentUser) {
      setSelectedEmployeeId(currentUser.id);
      setEmployeeName(currentUser.name);
      setDepartment(currentUser.department || 'Phân xưởng sản xuất');
    }
  }, [currentUser]);

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

  // Switch Food Category
  const handleCategoryChange = (newCat: FoodCategory) => {
    setCategory(newCat);
    if (newCat === 'pregnant') {
      setFoodDetails(PREGNANT_FOOD_OPTIONS[0]);
    } else if (newCat === 'vegetarian') {
      setFoodDetails(VEGETARIAN_FOOD_OPTIONS[0]);
      setCustomFoodDetails('');
    } else if (newCat === 'medicine_drink') {
      setFoodDetails('Nước thuốc');
    } else if (newCat === 'other') {
      setFoodDetails('');
      setCustomCategory('');
    }
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

    // Date validations
    if (isDateRange) {
      if (!entryDate) {
        showToast('Vui lòng chọn ngày bắt đầu ("Từ ngày").', 'error');
        return;
      }
      if (!toDate) {
        showToast('Vui lòng chọn ngày kết thúc ("Đến ngày").', 'error');
        return;
      }
      if (toDate < entryDate) {
        showToast('Ngày kết thúc ("Đến ngày") phải sau hoặc bằng ngày bắt đầu ("Từ ngày").', 'error');
        return;
      }
    } else {
      if (!entryDate) {
        showToast('Vui lòng chọn ngày mang thực phẩm vào.', 'error');
        return;
      }
      if (!shift) {
        showToast('Vui lòng chọn ca làm việc.', 'error');
        return;
      }
    }

    // Food details resolution
    let resolvedFoodDetails = foodDetails.trim();
    if (category === 'pregnant') {
      if (!resolvedFoodDetails) resolvedFoodDetails = PREGNANT_FOOD_OPTIONS[0];
    } else if (category === 'medicine_drink') {
      resolvedFoodDetails = 'Nước thuốc';
    } else if (category === 'vegetarian') {
      if (foodDetails === 'Khác') {
        if (!customFoodDetails.trim()) {
          showToast('Vui lòng nhập chi tiết món chay của bạn.', 'error');
          return;
        }
        resolvedFoodDetails = customFoodDetails.trim();
      } else {
        resolvedFoodDetails = foodDetails || VEGETARIAN_FOOD_OPTIONS[0];
      }
    } else if (category === 'other') {
      if (!customCategory.trim()) {
        showToast('Vui lòng ghi rõ phân loại thực phẩm khi chọn "Khác".', 'error');
        return;
      }
      if (!resolvedFoodDetails) {
        showToast('Vui lòng nhập chi tiết món ăn mang vào.', 'error');
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
      const qrUrl = getQrConfirmUrl('food', newId);
      const qrDataUrl = await generateQrDataUrl(qrUrl);

      const now = new Date().toISOString();
      const newRegistration: FoodRegistration = {
        id: newId,
        employeeId: selectedEmployeeId.trim(),
        employeeName: employeeName.trim(),
        department: department.trim(),
        entryDate,
        toDate: isDateRange ? toDate : undefined,
        shift: isDateRange ? undefined : shift,
        category,
        customCategory: category === 'other' ? customCategory.trim() : undefined,
        foodDetails: resolvedFoodDetails,
        customFoodDetails: category === 'vegetarian' && foodDetails === 'Khác' ? customFoodDetails.trim() : undefined,
        complianceCommitment: true,
        status: 'pending',
        qrCodeUrl: qrUrl,
        qrDataUrl,
        createdAt: now,
        updatedAt: now,
      };

      storage.saveFoodRegistration(newRegistration, {
        id: currentUser?.id || selectedEmployeeId,
        name: currentUser?.name || employeeName,
      });

      // Update state
      const updatedList = storage.getFoodRegistrations();
      setRegistrations(updatedList);

      // Reset form fields
      if (category === 'pregnant') {
        setFoodDetails(PREGNANT_FOOD_OPTIONS[0]);
      } else if (category === 'vegetarian') {
        setFoodDetails(VEGETARIAN_FOOD_OPTIONS[0]);
        setCustomFoodDetails('');
      } else if (category === 'medicine_drink') {
        setFoodDetails('Nước thuốc');
      } else {
        setFoodDetails('');
        setCustomCategory('');
      }
      setComplianceCommitment(false);

      showToast(`Đăng ký thành công! Mã phiếu của bạn là: ${newId}`);

      // Open QR modal automatically so employee can save or show to guard
      setSelectedQrItem(newRegistration);
      setIsQrModalOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Có lỗi xảy ra khi gửi đăng ký.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Registration
  const handleCancelRegistration = (item: FoodRegistration) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy phiếu đăng ký "${item.id}" không?`)) return;
    storage.cancelFoodRegistration(item.id, {
      id: currentUser?.id || 'user',
      name: currentUser?.name || 'Người dùng',
    });
    setRegistrations(storage.getFoodRegistrations());
    showToast(`Đã hủy phiếu đăng ký ${item.id}`);
  };

  // Guard Direct Confirmation
  const handleGuardConfirm = (item: FoodRegistration) => {
    const guardName = currentUser?.name || 'Bảo vệ cổng';
    storage.confirmFoodRegistration(item.id, guardName, 'Đã kiểm tra bao gói sạch sẽ, đủ điều kiện cho mang vào', currentUser?.id);
    setRegistrations(storage.getFoodRegistrations());
    showToast(`Bảo vệ đã xác nhận cho mang vào (Phiếu ${item.id})`);
  };

  // Guard Direct Rejection
  const handleGuardRejectSubmit = () => {
    if (!rejectModalItem) return;
    const guardName = currentUser?.name || 'Bảo vệ cổng';
    const reason = rejectReason.trim() || 'Không đảm bảo an toàn vệ sinh thực phẩm';
    storage.rejectFoodRegistration(rejectModalItem.id, guardName, reason, currentUser?.id);
    setRegistrations(storage.getFoodRegistrations());
    setRejectModalItem(null);
    setRejectReason('');
    showToast(`Đã ghi nhận không xác nhận / từ chối phiếu ${rejectModalItem.id}`);
  };

  // Filtered List for Table
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      // Role check: Normal employees only see their own registrations unless guard or admin
      if (!isGuard && !isAdminOrManager && !showAllFactory) {
        if (currentUser && item.employeeId.toLowerCase() !== currentUser.id.toLowerCase()) {
          return false;
        }
      }

      // Date Filter
      if (filterDate && item.entryDate !== filterDate) return false;

      // Status Filter
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      // Category Filter
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;

      // Search Term (ID, Name, MSNV, Dept, Details)
      if (filterSearch.trim()) {
        const q = filterSearch.trim().toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchName = item.employeeName.toLowerCase().includes(q);
        const matchEmpId = item.employeeId.toLowerCase().includes(q);
        const matchDept = item.department.toLowerCase().includes(q);
        const matchDetails = item.foodDetails.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchEmpId && !matchDept && !matchDetails) {
          return false;
        }
      }

      return true;
    });
  }, [registrations, currentUser, isGuard, isAdminOrManager, showAllFactory, filterDate, filterStatus, filterCategory, filterSearch]);

  // Counters
  const counts = useMemo(() => {
    const myOrAll = registrations.filter((r) => {
      if (!isGuard && !isAdminOrManager && !showAllFactory) {
        return currentUser ? r.employeeId.toLowerCase() === currentUser.id.toLowerCase() : true;
      }
      return true;
    });
    return {
      total: myOrAll.length,
      pending: myOrAll.filter((r) => r.status === 'pending').length,
      confirmed: myOrAll.filter((r) => r.status === 'confirmed').length,
      rejected: myOrAll.filter((r) => r.status === 'rejected').length,
    };
  }, [registrations, currentUser, isGuard, isAdminOrManager, showAllFactory]);

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

      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide uppercase text-emerald-100 border border-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span>An toàn vệ sinh thực phẩm nhà máy Long Khải</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <UtensilsCrossed className="w-8 h-8 sm:w-9 sm:h-9" />
              <span>Đăng Ký Mang Thực Phẩm Vào Nhà Máy</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 max-w-2xl leading-relaxed">
              Dành cho nhân viên mang thức ăn riêng (chế độ thai sản, ăn chay, nước thuốc...). Hệ thống tự động sinh mã QR để nhân viên bảo vệ quét xác nhận nhanh chóng tại cổng.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center min-w-[85px]">
              <span className="text-[10px] text-emerald-200 block font-semibold">Tổng số</span>
              <span className="text-xl sm:text-2xl font-black">{counts.total}</span>
            </div>
            <div className="bg-amber-400/20 backdrop-blur-md p-3 rounded-2xl border border-amber-300/30 text-center min-w-[85px]">
              <span className="text-[10px] text-amber-200 block font-semibold">Chờ xác nhận</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">{counts.pending}</span>
            </div>
            <div className="bg-emerald-400/20 backdrop-blur-md p-3 rounded-2xl border border-emerald-300/30 text-center min-w-[85px]">
              <span className="text-[10px] text-emerald-200 block font-semibold">Đã xác nhận</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300">{counts.confirmed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left/Top + History on Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Biểu Mẫu Đăng Ký Mang Vào
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Điền đầy đủ thông tin để cấp mã QR kiểm soát
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Employee ID & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã số NV (MSNV) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeIdChange(e.target.value)}
                    placeholder="Ví dụ: 1008"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Họ và tên nhân viên"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* 2. Department / Workshop / Line */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Bộ phận / Phân xưởng / Chuyền sản xuất *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ví dụ: Phân xưởng may - Chuyền 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* 3. Food Category Selection (Pills / Radio) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Phân loại thực phẩm *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['pregnant', 'vegetarian', 'medicine_drink', 'other'] as FoodCategory[]).map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">{FOOD_CATEGORY_ICONS[cat]}</span>
                      <span className="text-xs truncate">{FOOD_CATEGORY_LABELS[cat]}</span>
                    </button>
                  );
                })}
              </div>

              {category === 'other' && (
                <div className="mt-2.5 animate-in fade-in duration-200">
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ghi rõ phân loại thực phẩm (Ví dụ: Chế độ ăn kiêng y tế...)"
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* 4. Food Details Dropdown / Input (Hidden for 'medicine_drink') */}
            {category === 'pregnant' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chi tiết món ăn *
                </label>
                <select
                  value={foodDetails}
                  onChange={(e) => setFoodDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {PREGNANT_FOOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {category === 'vegetarian' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chi tiết món ăn *
                </label>
                <select
                  value={foodDetails}
                  onChange={(e) => setFoodDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {VEGETARIAN_FOOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'Khác' ? 'Khác (tự nhập món ăn)' : opt}
                    </option>
                  ))}
                </select>

                {foodDetails === 'Khác' && (
                  <div className="animate-in fade-in duration-200">
                    <input
                      type="text"
                      required
                      value={customFoodDetails}
                      onChange={(e) => setCustomFoodDetails(e.target.value)}
                      placeholder="Nhập chi tiết món chay mang vào (Ví dụ: Cơm chay sườn non, bánh mỳ chay...)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {category === 'other' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chi tiết món ăn *
                </label>
                <input
                  type="text"
                  required
                  value={foodDetails}
                  onChange={(e) => setFoodDetails(e.target.value)}
                  placeholder="Nhập chi tiết món ăn mang vào..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* 5. Date & Shift Section (Placed AFTER 'Chi tiết món ăn') */}
            {isDateRange ? (
              /* Date Range: "Từ ngày" & "Đến ngày" for pregnant & medicine_drink */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Từ ngày *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Đến ngày *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      min={entryDate}
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Single Date & Shift: "Ngày mang vào" & "Ca làm việc" for vegetarian & other */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ngày mang vào *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ca làm việc *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {FOOD_ENTRY_SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 6. Compliance Commitment Checkbox (Mandatory) */}
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
                  &ldquo;Cam kết thực phẩm đảm bảo nguồn gốc, dùng trong ngày, không mang vào khu vực sản xuất và tự chịu trách nhiệm về ATVSTP.&rdquo;
                </span>
              </div>
            </div>

            {/* 7. Submit Button */}
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
                  <span>Đang xử lý đăng ký & tạo mã QR...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Đăng Ký Thực Phẩm</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History & Management Table Card (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Danh Sách Đăng Ký Thực Phẩm Mang Vào</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isGuard || isAdminOrManager
                  ? 'Xem và đối soát các lượt thực phẩm qua cổng bảo vệ'
                  : 'Theo dõi tình trạng đơn đăng ký và lấy mã QR'}
              </p>
            </div>

            {(isGuard || isAdminOrManager) && (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer self-start sm:self-auto bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={showAllFactory}
                  onChange={(e) => setShowAllFactory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Xem toàn bộ nhà máy</span>
              </label>
            )}
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

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="rejected">Không xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                <option value="all">Tất cả phân loại</option>
                <option value="pregnant">Mang thai</option>
                <option value="vegetarian">Ăn chay</option>
                <option value="medicine_drink">Nước thuốc</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>

          {/* Table / List Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            {filteredRegistrations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <UtensilsCrossed className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                <p>Chưa có dữ liệu đăng ký thực phẩm nào phù hợp.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                    <th className="p-3 whitespace-nowrap">Mã phiếu</th>
                    <th className="p-3 whitespace-nowrap">Người mang vào</th>
                    <th className="p-3 whitespace-nowrap">Ngày &amp; Ca</th>
                    <th className="p-3 whitespace-nowrap">Phân loại</th>
                    <th className="p-3 min-w-[180px]">Chi tiết món ăn</th>
                    <th className="p-3 whitespace-nowrap">Trạng thái</th>
                    <th className="p-3 whitespace-nowrap text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredRegistrations.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Doc ID */}
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQrItem(item);
                            setIsQrModalOpen(true);
                          }}
                          className="hover:underline flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.id}</span>
                        </button>
                      </td>

                      {/* Employee Info */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.employeeName}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {item.employeeId} &bull; {item.department}
                        </span>
                      </td>

                      {/* Entry Date & Shift */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {item.toDate && item.toDate !== item.entryDate
                            ? `${formatDate(item.entryDate)} → ${formatDate(item.toDate)}`
                            : formatDate(item.entryDate)}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                          {item.shift || (item.toDate ? 'Theo đợt' : '-')}
                        </span>
                      </td>

                      {/* Food Category Badge */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span>{FOOD_CATEGORY_ICONS[item.category]}</span>
                          <span>
                            {item.category === 'other' && item.customCategory
                              ? item.customCategory
                              : FOOD_CATEGORY_LABELS[item.category]}
                          </span>
                        </span>
                      </td>

                      {/* Details */}
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        <p className="line-clamp-2 text-xs font-normal" title={item.foodDetails}>
                          {item.foodDetails}
                        </p>
                        {item.guardNote && item.status === 'confirmed' && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 italic mt-0.5">
                            Bảo vệ {item.guardName}: {item.guardNote}
                          </p>
                        )}
                        {item.rejectedReason && item.status === 'rejected' && (
                          <p className="text-[10px] text-rose-500 italic mt-0.5">
                            Từ chối: {item.rejectedReason}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${FOOD_STATUS_BADGES[item.status]}`}
                        >
                          {FOOD_STATUS_LABELS[item.status]}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* QR Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQrItem(item);
                              setIsQrModalOpen(true);
                            }}
                            title="Xem mã QR để quét tại cổng"
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Cancel Button (Owner can cancel if pending) */}
                          {item.status === 'pending' &&
                            (currentUser?.id === item.employeeId || currentUser?.role === 'admin') && (
                              <button
                                type="button"
                                onClick={() => handleCancelRegistration(item)}
                                title="Hủy đơn đăng ký này"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                          {/* Guard Direct Confirm Buttons if pending */}
                          {(isGuard || isAdminOrManager) && item.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleGuardConfirm(item)}
                                title="Xác nhận cho mang vào ngay"
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Cho vào</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalItem(item);
                                  setRejectReason('');
                                }}
                                title="Từ chối / không cho mang vào"
                                className="px-2 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Từ chối</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <FoodQrModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedQrItem(null);
        }}
        registration={selectedQrItem}
      />

      {/* Security Guard Rejection Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Từ Chối Cho Mang Vào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phiếu: <b className="font-mono">{rejectModalItem.id}</b> - {rejectModalItem.employeeName}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Lý do từ chối / không xác nhận: *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Thực phẩm tươi sống dễ ôi thiu không đảm bảo vệ sinh, bao gói rách, mang sai ca..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-medium"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleGuardRejectSubmit}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/20"
              >
                <XCircle className="w-4 h-4" />
                <span>Xác nhận từ chối</span>
              </button>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
