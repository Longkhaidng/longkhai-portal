'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { User } from '@/types/user';
import {
  OvertimeRegistration,
  OvertimeItem,
  OvertimeMealMenu,
  OvertimeDayType,
  OvertimeCategory,
  OvertimeCompensation,
  OvertimeReasonType,
  OVERTIME_SHIFTS,
  OVERTIME_DAY_TYPE_LABELS,
  OVERTIME_CATEGORY_LABELS,
  OVERTIME_COMPENSATION_LABELS,
  OVERTIME_REASON_LABELS,
  OVERTIME_CONFIRM_STATUS_LABELS,
  OVERTIME_CONFIRM_STATUS_BADGES,
  OVERTIME_APPROVAL_STATUS_LABELS,
  OVERTIME_APPROVAL_STATUS_BADGES,
  calculateOvertimeTimes,
  computeHoursBetween,
  checkEmployeeEditDeadline,
} from '@/types/overtime';
import { OvertimeTeamModal } from './OvertimeTeamModal';
import { OvertimeConfirmModal } from './OvertimeConfirmModal';
import { OvertimeMenuModal } from './OvertimeMenuModal';
import {
  Timer,
  Plus,
  Users,
  Trash2,
  Clock,
  Utensils,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Building2,
  Info,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import * as XLSX from 'xlsx';

export function OvertimeView() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'register' | 'tracking' | 'menu'>('register');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState<boolean>(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    item: OvertimeItem;
    registrationId: string;
    registrationDate: string;
  } | null>(null);

  // Storage data
  const [registrations, setRegistrations] = useState<OvertimeRegistration[]>([]);
  const [mealMenus, setMealMenus] = useState<OvertimeMealMenu[]>([]);

  // Registration Form State
  const [registrationDate, setRegistrationDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [batchNotes, setBatchNotes] = useState<string>('');
  const [registrationItems, setRegistrationItems] = useState<OvertimeItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tracking Table Filters
  const [searchTracking, setSearchTracking] = useState<string>('');
  const [trackingDateFilter, setTrackingDateFilter] = useState<string>('');
  const [confirmStatusFilter, setConfirmStatusFilter] = useState<string>('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('all');
  const [myOvertimeOnly, setMyOvertimeOnly] = useState<boolean>(false);

  // Load initial data
  const loadAllData = () => {
    const loadedUsers = storage.getUsers();
    setUsers(loadedUsers);
    const loadedRegs = storage.getOvertimeRegistrations();
    setRegistrations(loadedRegs);
    const loadedMenus = storage.getOvertimeMealMenus();
    setMealMenus(loadedMenus);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Determine permissions:
  // "Thêm cả tổ: mục này chỉ dành cho tổ trưởng, nhân viên kinh tế hoặc trưởng bộ phận đăng ký. Nhân viên bình thường sẽ không thấy nút này."
  const canAddTeam = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'hr') return true;
    if (currentUser.role === 'manager' || currentUser.role === 'team_leader') return true;

    const pos = (currentUser.position || '').toLowerCase();
    if (pos.includes('tổ trưởng') || pos.includes('kinh tế') || pos.includes('trưởng') || pos.includes('phụ trách')) {
      return true;
    }
    // Check if any user lists current user as teamLeaderId or economicStaffId
    return users.some(
      (u) => u.teamLeaderId === currentUser.id || u.economicStaffId === currentUser.id
    );
  }, [currentUser, users]);

  // Can manage menus (Admin & HR)
  const canManageMenus = currentUser?.role === 'admin' || currentUser?.role === 'hr';

  // Can approve overtime (Manager, HR, Admin, Team Leader)
  const canApprove =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'hr' ||
    currentUser?.role === 'manager' ||
    currentUser?.position?.toLowerCase().includes('trưởng') ||
    currentUser?.position?.toLowerCase().includes('phụ trách');

  // Available meals for selected registrationDate
  const availableMealsForDate = useMemo(() => {
    return mealMenus.filter((m) => m.date === registrationDate);
  }, [mealMenus, registrationDate]);

  // Handle adding an individual row
  const handleAddIndividualRow = () => {
    // If current user is a normal employee, default to current user
    let defaultUser = currentUser;
    if (!defaultUser && users.length > 0) {
      defaultUser = users[0];
    }

    const defaultShift = 'Ca HC (08:00 - 16:30)';
    const defaultOvertimeType: OvertimeCategory = 'sau_ca';
    const defaultHours = 1.5;
    const times = calculateOvertimeTimes(defaultShift, defaultOvertimeType, defaultHours);

    const newItem: OvertimeItem = {
      id: `OT-ITEM-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: defaultUser?.id || '',
      employeeName: defaultUser?.name || '',
      position: defaultUser?.position || '',
      team: defaultUser?.department || '',
      department: defaultUser?.department || '',
      shift: defaultShift,
      dayType: 'ngay_thuong',
      overtimeType: defaultOvertimeType,
      compensationType: 'tinh_luong',
      reasonType: 'ke_hoach_sx',
      hours: defaultHours,
      fromTime: times.fromTime,
      toTime: times.toTime,
      mealOption: defaultHours < 2 ? 'Không áp dụng (< 2h)' : 'Tự túc / Không ăn',
      employeeConfirmStatus: 'pending',
      approvalStatus: 'pending',
    };

    setRegistrationItems((prev) => [...prev, newItem]);
  };

  // Handle adding team members from modal
  const handleApplyTeamMembers = (teamItems: OvertimeItem[]) => {
    setRegistrationItems((prev) => {
      // Filter out duplicates by employeeId if already present in current registration batch
      const existingIds = new Set(prev.map((it) => it.employeeId));
      const newUnique = teamItems.filter((it) => !existingIds.has(it.employeeId));
      return [...prev, ...newUnique];
    });
    showToast(`Đã thêm ${teamItems.length} nhân viên tổ vào danh sách đăng ký!`);
  };

  // Remove row from registration table
  const handleRemoveRow = (id: string) => {
    setRegistrationItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Update item field in registration list
  const updateRegistrationItem = (id: string, updates: Partial<OvertimeItem>) => {
    setRegistrationItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };

        // If employeeId changed, auto-lookup user info
        if (updates.employeeId !== undefined && updates.employeeId !== item.employeeId) {
          const matchUser = users.find(
            (u) =>
              u.id.toLowerCase() === updates.employeeId!.trim().toLowerCase() ||
              u.name.toLowerCase() === updates.employeeId!.trim().toLowerCase()
          );
          if (matchUser) {
            updated.employeeId = matchUser.id;
            updated.employeeName = matchUser.name;
            updated.position = matchUser.position || 'Công nhân';
            updated.department = matchUser.department;
            updated.team = matchUser.department;
          }
        }

        // Auto-recalculate from/to times when shift, overtimeType or hours change
        if (
          updates.shift !== undefined ||
          updates.overtimeType !== undefined ||
          updates.hours !== undefined
        ) {
          const calcShift = updates.shift || item.shift;
          const calcOTType = updates.overtimeType || item.overtimeType;
          const calcHours = updates.hours !== undefined ? updates.hours : item.hours;
          const calcTimes = calculateOvertimeTimes(calcShift, calcOTType, calcHours);
          updated.fromTime = calcTimes.fromTime;
          updated.toTime = calcTimes.toTime;
        }

        // If user manually updates fromTime or toTime, recompute hours
        if (updates.fromTime !== undefined || updates.toTime !== undefined) {
          const f = updates.fromTime || item.fromTime;
          const t = updates.toTime || item.toTime;
          if (f && t) {
            updated.hours = computeHoursBetween(f, t);
          }
        }

        // Check meal rule: under 2 hours no meal applied
        if (updated.hours < 2) {
          updated.mealOption = 'Không áp dụng (< 2h)';
        } else if (
          updated.mealOption === 'Không áp dụng (< 2h)' ||
          !updated.mealOption
        ) {
          updated.mealOption = availableMealsForDate[0]?.dishName || 'Tự túc / Không ăn';
        }

        return updated;
      })
    );
  };

  // Submit complete registration form
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationItems.length === 0) {
      alert('Vui lòng thêm ít nhất 1 nhân viên vào danh sách đăng ký tăng ca');
      return;
    }

    // Validate that all items have employeeId and employeeName
    for (const it of registrationItems) {
      if (!it.employeeId || !it.employeeName) {
        alert('Có dòng chưa nhập đầy đủ Mã số nhân viên hoặc Họ tên. Vui lòng kiểm tra lại!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newRegistration: OvertimeRegistration = {
        id: `OT-${registrationDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
        registrationDate,
        createdDate: new Date().toISOString(),
        createdById: currentUser?.id || '---',
        createdByName: currentUser?.name || 'Nhân viên',
        createdRole: currentUser?.role || 'employee',
        department: currentUser?.department || 'Nhà máy',
        notes: batchNotes.trim() || undefined,
        items: registrationItems,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      storage.saveOvertimeRegistration(newRegistration, {
        id: currentUser?.id || '',
        name: currentUser?.name || '',
      });

      loadAllData();
      setRegistrationItems([]);
      setBatchNotes('');
      showToast(`Đã gửi danh sách đăng ký làm thêm giờ thành công (${newRegistration.id})!`);
      setActiveTab('tracking');
    } catch {
      alert('Đã có lỗi xảy ra khi lưu đơn đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flattened tracking records for the table
  const allTrackingItems = useMemo(() => {
    const list: {
      regId: string;
      regDate: string;
      createdDate: string;
      createdByName: string;
      department: string;
      item: OvertimeItem;
    }[] = [];

    registrations.forEach((reg) => {
      reg.items.forEach((item) => {
        list.push({
          regId: reg.id,
          regDate: reg.registrationDate,
          createdDate: reg.createdDate,
          createdByName: reg.createdByName,
          department: reg.department,
          item,
        });
      });
    });

    // Sort newest registration date first
    return list.sort((a, b) => {
      const dateA = new Date(a.regDate).getTime();
      const dateB = new Date(b.regDate).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    });
  }, [registrations]);

  // Filtered tracking items
  const filteredTrackingItems = useMemo(() => {
    return allTrackingItems.filter((entry) => {
      const { item, regDate } = entry;

      if (myOvertimeOnly && currentUser && item.employeeId !== currentUser.id) {
        return false;
      }
      if (trackingDateFilter && regDate !== trackingDateFilter) {
        return false;
      }
      if (confirmStatusFilter !== 'all' && item.employeeConfirmStatus !== confirmStatusFilter) {
        return false;
      }
      if (approvalStatusFilter !== 'all' && item.approvalStatus !== approvalStatusFilter) {
        return false;
      }
      if (searchTracking.trim()) {
        const q = searchTracking.toLowerCase();
        const matchId = item.employeeId.toLowerCase().includes(q);
        const matchName = item.employeeName.toLowerCase().includes(q);
        const matchTeam = (item.team || '').toLowerCase().includes(q);
        const matchDept = (item.department || '').toLowerCase().includes(q);
        const matchReason = (item.customReason || item.reasonType).toLowerCase().includes(q);
        if (!matchId && !matchName && !matchTeam && !matchDept && !matchReason) return false;
      }
      return true;
    });
  }, [
    allTrackingItems,
    myOvertimeOnly,
    currentUser,
    trackingDateFilter,
    confirmStatusFilter,
    approvalStatusFilter,
    searchTracking,
  ]);

  // KPI counts
  const totalOvertimeEntries = allTrackingItems.length;
  const pendingConfirmCount = allTrackingItems.filter((e) => e.item.employeeConfirmStatus === 'pending').length;
  const confirmedCount = allTrackingItems.filter((e) => e.item.employeeConfirmStatus === 'confirmed').length;
  const pendingApprovalCount = allTrackingItems.filter((e) => e.item.approvalStatus === 'pending').length;

  // Handle employee confirmation from modal
  const handleEmployeeConfirmSubmit = (
    registrationId: string,
    itemId: string,
    confirmData: {
      confirmHours: number;
      confirmTime: string;
      status: 'confirmed' | 'rejected';
      note?: string;
    }
  ) => {
    storage.updateOvertimeItemConfirm(registrationId, itemId, confirmData, {
      id: currentUser?.id || '',
      name: currentUser?.name || '',
    });
    loadAllData();
    showToast(
      confirmData.status === 'confirmed'
        ? 'Đã xác nhận thời gian làm thêm giờ thành công!'
        : 'Đã gửi từ chối tăng ca!'
    );
  };

  // Handle Manager quick approve / reject
  const handleApprovalAction = (
    registrationId: string,
    itemId: string,
    action: 'approved' | 'rejected'
  ) => {
    const actionText = action === 'approved' ? 'phê duyệt' : 'từ chối';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} giờ tăng ca này?`)) return;

    storage.updateOvertimeItemApproval(registrationId, itemId, action, undefined, {
      id: currentUser?.id || '',
      name: currentUser?.name || '',
    });
    loadAllData();
    showToast(`Đã ${actionText} giờ tăng ca thành công!`);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredTrackingItems.length === 0) {
      alert('Không có dữ liệu tăng ca để xuất Excel');
      return;
    }

    const rows = filteredTrackingItems.map((entry, idx) => ({
      STT: idx + 1,
      'Ngày Gửi Đơn': formatDateTime(entry.createdDate),
      'Ngày Đăng Ký Tăng Ca': formatDate(entry.regDate),
      'Mã Số NV': entry.item.employeeId,
      'Họ Và Tên': entry.item.employeeName,
      'Chức Vụ': entry.item.position,
      'Tổ / Bộ Phận': entry.item.team || entry.department,
      'Ca Làm Việc': entry.item.shift,
      'Loại Tăng Ca': OVERTIME_CATEGORY_LABELS[entry.item.overtimeType],
      'Lý Do Tăng Ca': entry.item.customReason || OVERTIME_REASON_LABELS[entry.item.reasonType],
      'Thời Gian Thỏa Thuận Ban Đầu': `${entry.item.fromTime} - ${entry.item.toTime}`,
      'Số Giờ Ban Đầu': entry.item.hours,
      'Giờ Xác Nhận Của NLĐ': entry.item.employeeConfirmTime || '-',
      'Số Giờ Xác Nhận': entry.item.employeeConfirmHours || '-',
      'Trạng Thái Xác Nhận': OVERTIME_CONFIRM_STATUS_LABELS[entry.item.employeeConfirmStatus],
      'Trạng Thái Duyệt': OVERTIME_APPROVAL_STATUS_LABELS[entry.item.approvalStatus],
      'Món Ăn Giữa Ca': entry.item.mealOption || 'Không',
      'Loại Bù / Lương': OVERTIME_COMPENSATION_LABELS[entry.item.compensationType],
      'Ghi Chú Của NLĐ': entry.item.employeeConfirmNote || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TheoDoiTangCa');
    XLSX.writeFile(
      workbook,
      `LONGKHAI_Theo_Doi_Lam_Them_Gio_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 shadow-xl shadow-blue-900/10 no-print">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold border border-white/15">
              <Timer className="w-3.5 h-3.5 text-blue-300" />
              <span>Chế Độ Làm Việc &bull; Nhà Máy Long Khải</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Đăng Ký &amp; Theo Dõi Làm Thêm Giờ</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Đăng ký tăng ca cá nhân &amp; theo tổ, chọn món ăn giữa ca hằng ngày và theo dõi xác nhận của người lao động.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageMenus && (
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-xs"
                title="Quản lý thực đơn ăn giữa ca hằng ngày"
              >
                <Utensils className="w-4 h-4 text-amber-300" />
                <span>Thực đơn ăn giữa ca ({mealMenus.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Xuất danh sách sang Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-bold border border-white/10 transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Tổng lượt tăng ca</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {totalOvertimeEntries} <span className="text-xs font-normal text-blue-200">lượt</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-amber-200 font-medium">Chờ NV xác nhận</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">
              {pendingConfirmCount} <span className="text-xs font-normal text-amber-200">người</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">Đã xác nhận đồng ý</div>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">
              {confirmedCount} <span className="text-xs font-normal text-emerald-200">người</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Chờ Trưởng BP duyệt</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {pendingApprovalCount} <span className="text-xs font-normal text-blue-200">lượt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'register'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-slate-900/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>1. Đăng Ký Làm Thêm Giờ</span>
          {registrationItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {registrationItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tracking'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-slate-900/10'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>2. Theo Dõi Xác Nhận Làm Thêm Giờ</span>
          {pendingConfirmCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingConfirmCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ĐĂNG KÝ LÀM THÊM GIỜ */}
      {/* ========================================================= */}
      {activeTab === 'register' && (
        <form onSubmit={handleSubmitRegistration} className="space-y-5 no-print">
          {/* Top Form Meta Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Thời Gian Đăng Ký Làm Thêm Giờ</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn ngày tăng ca và thêm nhân viên cá nhân hoặc toàn bộ tổ vào danh sách
                </p>
              </div>

              {/* Action Buttons: Thêm dòng & Thêm cả tổ */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddIndividualRow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm dòng (cá nhân đăng ký)</span>
                </button>

                {/* Nút THÊM CẢ TỔ: Chỉ dành cho Tổ trưởng, NV kinh tế, Trưởng bộ phận, Admin/HR */}
                {canAddTeam && (
                  <button
                    type="button"
                    onClick={() => setIsTeamModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Nạp tự động toàn bộ nhân viên trong tổ theo mã số Tổ trưởng"
                  >
                    <Users className="w-4 h-4" />
                    <span>Thêm cả tổ</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Ngày đăng ký làm thêm giờ: *</span>
                </label>
                <input
                  type="date"
                  required
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do / Kế hoạch tăng ca chung của đợt này:
                </label>
                <input
                  type="text"
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Ví dụ: Hoàn tất đơn hàng dệt xuất khẩu, đóng gói xuất xưởng cuối tuần..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Registration Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Danh Sách Nhân Viên Đăng Ký Tăng Ca ({registrationItems.length} người)
                </span>
                {registrationItems.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    &bull; Ngày: <b>{formatDate(registrationDate)}</b>
                  </span>
                )}
              </div>

              {registrationItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xóa tất cả các dòng hiện tại?')) {
                      setRegistrationItems([]);
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {registrationItems.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                  <Timer className="w-7 h-7" />
                </div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Chưa có nhân viên nào trong danh sách đăng ký
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hãy bấm <b>&quot;Thêm dòng (cá nhân đăng ký)&quot;</b> để đăng ký cho bản thân, hoặc{' '}
                  {canAddTeam ? (
                    <b>&quot;Thêm cả tổ&quot;</b>
                  ) : (
                    'nhờ Tổ trưởng đăng ký cả tổ'
                  )}{' '}
                  để tự động tải danh sách nhân viên.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddIndividualRow}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm dòng cá nhân</span>
                  </button>
                  {canAddTeam && (
                    <button
                      type="button"
                      onClick={() => setIsTeamModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4" />
                      <span>Thêm cả tổ</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <tr>
                      <th className="p-3 w-10 text-center">STT</th>
                      <th className="p-3 w-28">MSNV</th>
                      <th className="p-3 min-w-[150px]">Họ tên</th>
                      <th className="p-3 min-w-[130px]">Chức vụ</th>
                      <th className="p-3 min-w-[180px]">Ca làm việc</th>
                      <th className="p-3 min-w-[130px]">Thời gian làm thêm</th>
                      <th className="p-3 min-w-[140px]">Loại tăng ca</th>
                      {/* Cột Số giờ nằm đầu tiên trong cụm thời gian tăng ca theo đúng yêu cầu */}
                      <th className="p-3 w-20 text-center bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                        Số giờ
                      </th>
                      <th className="p-3 w-24 text-center bg-blue-50/40 dark:bg-blue-950/20">Từ</th>
                      <th className="p-3 w-24 text-center bg-blue-50/40 dark:bg-blue-950/20">Đến</th>
                      <th className="p-3 min-w-[180px]">Lý do làm thêm</th>
                      <th className="p-3 min-w-[120px]">Bù / Lương</th>
                      <th className="p-3 min-w-[200px]">Ăn/uống giữa ca</th>
                      <th className="p-3 w-14 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {registrationItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 align-top">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>

                        {/* MSNV */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.employeeId}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { employeeId: e.target.value })
                            }
                            placeholder="MSNV"
                            className="w-full font-mono font-bold text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-blue-600"
                          />
                        </td>

                        {/* Họ tên */}
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            value={item.employeeName}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { employeeName: e.target.value })
                            }
                            placeholder="Họ và tên"
                            className="w-full font-semibold text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                          />
                        </td>

                        {/* Chức vụ */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.position}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { position: e.target.value })
                            }
                            placeholder="Chức vụ"
                            className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600"
                          />
                        </td>

                        {/* Ca làm việc */}
                        <td className="p-2">
                          <select
                            value={item.shift}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { shift: e.target.value })
                            }
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                          >
                            {OVERTIME_SHIFTS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Thời gian làm thêm */}
                        <td className="p-2">
                          <select
                            value={item.dayType}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, {
                                dayType: e.target.value as OvertimeDayType,
                              })
                            }
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                          >
                            <option value="ngay_thuong">{OVERTIME_DAY_TYPE_LABELS.ngay_thuong}</option>
                            <option value="ngay_nghi">{OVERTIME_DAY_TYPE_LABELS.ngay_nghi}</option>
                            <option value="ngay_le">{OVERTIME_DAY_TYPE_LABELS.ngay_le}</option>
                          </select>
                        </td>

                        {/* Loại tăng ca */}
                        <td className="p-2">
                          <select
                            value={item.overtimeType}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, {
                                overtimeType: e.target.value as OvertimeCategory,
                              })
                            }
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                          >
                            <option value="sau_ca">{OVERTIME_CATEGORY_LABELS.sau_ca}</option>
                            <option value="truoc_ca">{OVERTIME_CATEGORY_LABELS.truoc_ca}</option>
                            <option value="khong_theo_ca">{OVERTIME_CATEGORY_LABELS.khong_theo_ca}</option>
                          </select>
                        </td>

                        {/* Cột Số giờ (nằm đầu tiên) */}
                        <td className="p-2 bg-blue-50/40 dark:bg-blue-950/20">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="12"
                            value={item.hours}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, {
                                hours: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full text-center font-bold text-xs px-1.5 py-1.5 bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-600 rounded-lg text-blue-700 dark:text-blue-300"
                          />
                        </td>

                        {/* Từ giờ */}
                        <td className="p-2 bg-blue-50/20 dark:bg-blue-950/10">
                          <input
                            type="time"
                            value={item.fromTime}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { fromTime: e.target.value })
                            }
                            className="w-full text-center text-xs px-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-medium"
                          />
                        </td>

                        {/* Đến giờ */}
                        <td className="p-2 bg-blue-50/20 dark:bg-blue-950/10">
                          <input
                            type="time"
                            value={item.toTime}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, { toTime: e.target.value })
                            }
                            className="w-full text-center text-xs px-1.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-medium"
                          />
                        </td>

                        {/* Lý do làm thêm */}
                        <td className="p-2">
                          <select
                            value={item.reasonType}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, {
                                reasonType: e.target.value as OvertimeReasonType,
                              })
                            }
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                          >
                            <option value="ke_hoach_sx">{OVERTIME_REASON_LABELS.ke_hoach_sx}</option>
                            <option value="khac">{OVERTIME_REASON_LABELS.khac}</option>
                          </select>
                          {item.reasonType === 'khac' && (
                            <input
                              type="text"
                              value={item.customReason || ''}
                              onChange={(e) =>
                                updateRegistrationItem(item.id, { customReason: e.target.value })
                              }
                              placeholder="Nhập lý do cụ thể..."
                              className="mt-1 w-full text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                            />
                          )}
                        </td>

                        {/* Loại bù / lương */}
                        <td className="p-2">
                          <select
                            value={item.compensationType}
                            onChange={(e) =>
                              updateRegistrationItem(item.id, {
                                compensationType: e.target.value as OvertimeCompensation,
                              })
                            }
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                          >
                            <option value="tinh_luong">{OVERTIME_COMPENSATION_LABELS.tinh_luong}</option>
                            <option value="nghi_bu">{OVERTIME_COMPENSATION_LABELS.nghi_bu}</option>
                          </select>
                        </td>

                        {/* Ăn/uống giữa ca */}
                        <td className="p-2">
                          {item.hours < 2 ? (
                            <div className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-400 italic rounded-lg border border-slate-200 dark:border-slate-700 text-center text-[11px]">
                              Không áp dụng (&lt; 2h)
                            </div>
                          ) : (
                            <select
                              value={item.mealOption || 'Tự túc / Không ăn'}
                              onChange={(e) =>
                                updateRegistrationItem(item.id, { mealOption: e.target.value })
                              }
                              className="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-600 rounded-lg font-bold text-emerald-700 dark:text-emerald-400"
                            >
                              <option value="Tự túc / Không ăn">Tự túc / Không ăn</option>
                              {availableMealsForDate.map((m) => (
                                <option key={m.id} value={m.dishName}>
                                  {m.dishName}
                                </option>
                              ))}
                              {availableMealsForDate.length === 0 && (
                                <option value="Suất ăn nhà máy theo ca">
                                  Suất ăn nhà máy theo ca
                                </option>
                              )}
                            </select>
                          )}
                        </td>

                        {/* Nút xóa cuối dòng */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(item.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Xóa nhân viên này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Submit button footer */}
            {registrationItems.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Tổng cộng: <b className="text-blue-600">{registrationItems.length} nhân viên</b> &bull;{' '}
                  Tổng số giờ tăng ca:{' '}
                  <b>
                    {registrationItems.reduce((acc, it) => acc + (it.hours || 0), 0)} giờ
                  </b>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddIndividualRow}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Thêm dòng
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang gửi...' : 'Gửi danh sách đăng ký làm thêm giờ'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: THEO DÕI XÁC NHẬN LÀM THÊM GIỜ (Khớp hoàn toàn Ảnh 2) */}
      {/* ========================================================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Section Header matching User Image 2 */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase text-blue-600 dark:text-blue-400 tracking-wide">
              THEO DÕI XÁC NHẬN LÀM THÊM GIỜ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Danh sách các đơn bạn đã gửi, đang chờ nhân viên xác nhận đồng ý hoặc chờ Trưởng bộ phận duyệt
            </p>

            <div className="absolute right-4 top-4">
              <button
                type="button"
                onClick={loadAllData}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải lại</span>
              </button>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3 text-xs no-print">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                placeholder="Tìm theo MSNV, tên nhân viên, tổ, lý do..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Ngày tăng ca:</span>
              <input
                type="date"
                value={trackingDateFilter}
                onChange={(e) => setTrackingDateFilter(e.target.value)}
                className="py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              {trackingDateFilter && (
                <button
                  type="button"
                  onClick={() => setTrackingDateFilter('')}
                  className="text-blue-600 hover:underline text-[11px]"
                >
                  Tất cả
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Xác nhận:</span>
              <select
                value={confirmStatusFilter}
                onChange={(e) => setConfirmStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              >
                <option value="all">Tất cả xác nhận</option>
                <option value="pending">Chờ NV xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500">Duyệt:</span>
              <select
                value={approvalStatusFilter}
                onChange={(e) => setApprovalStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              >
                <option value="all">Tất cả duyệt</option>
                <option value="pending">Chờ TBP duyệt</option>
                <option value="approved">Đã phê duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>

            {currentUser && (
              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-blue-600 ml-auto">
                <input
                  type="checkbox"
                  checked={myOvertimeOnly}
                  onChange={(e) => setMyOvertimeOnly(e.target.checked)}
                  className="rounded-md text-blue-600"
                />
                <span>Chỉ xem của tôi ({currentUser.id})</span>
              </label>
            )}
          </div>

          {/* Tracking Table matching User Image 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-center whitespace-nowrap">
                    <th className="p-3 w-10">STT</th>
                    <th className="p-3">Ngày gửi đơn</th>
                    <th className="p-3">Ngày đăng ký tăng ca</th>
                    <th className="p-3">Mã số NV</th>
                    <th className="p-3 text-left">Tên nhân viên</th>
                    <th className="p-3 text-left">Tổ</th>
                    <th className="p-3">Thời gian thỏa thuận ban đầu</th>
                    <th className="p-3">Số giờ</th>
                    <th className="p-3 text-left">Lý do tăng ca</th>
                    <th className="p-3 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                      Giờ xác nhận của người lao động
                    </th>
                    <th className="p-3 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
                      Số giờ
                    </th>
                    <th className="p-3">Trạng thái xác nhận</th>
                    <th className="p-3">Trạng thái duyệt</th>
                    <th className="p-3 w-28 text-center no-print">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                  {filteredTrackingItems.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="p-12 text-center text-slate-400">
                        Không có đơn nào đang chờ xử lý hoặc phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTrackingItems.map((entry, idx) => {
                      const { item, regId, regDate, createdDate } = entry;
                      const deadlineCheck = checkEmployeeEditDeadline(regDate);
                      const isMyRecord = currentUser?.id === item.employeeId;
                      const canEmployeeConfirm = isMyRecord || currentUser?.role === 'admin';

                      return (
                        <tr
                          key={`${regId}-${item.id}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="p-2.5 text-center font-semibold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Ngày gửi đơn */}
                          <td className="p-2.5 text-center text-slate-500 whitespace-nowrap">
                            {formatDate(createdDate)}
                          </td>

                          {/* Ngày đăng ký tăng ca */}
                          <td className="p-2.5 text-center font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                            {formatDate(regDate)}
                          </td>

                          {/* Mã số NV */}
                          <td className="p-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                            {item.employeeId}
                          </td>

                          {/* Tên nhân viên */}
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {item.employeeName}
                            {isMyRecord && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                                Bạn
                              </span>
                            )}
                          </td>

                          {/* Tổ */}
                          <td className="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {item.team || item.department}
                          </td>

                          {/* Thời gian thỏa thuận ban đầu */}
                          <td className="p-2.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {item.fromTime} - {item.toTime}
                          </td>

                          {/* Số giờ */}
                          <td className="p-2.5 text-center font-bold text-blue-700 dark:text-blue-400">
                            {item.hours}
                          </td>

                          {/* Lý do tăng ca */}
                          <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={item.customReason || item.reasonType}>
                            {item.customReason || item.reasonType}
                          </td>

                          {/* Giờ xác nhận của người lao động */}
                          <td className="p-2.5 text-center font-mono font-bold bg-amber-50/40 dark:bg-amber-950/10 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {item.employeeConfirmTime || '-'}
                          </td>

                          {/* Số giờ xác nhận */}
                          <td className="p-2.5 text-center font-bold bg-amber-50/40 dark:bg-amber-950/10 text-amber-700 dark:text-amber-400">
                            {item.employeeConfirmHours !== undefined ? item.employeeConfirmHours : '-'}
                          </td>

                          {/* Trạng thái xác nhận */}
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                OVERTIME_CONFIRM_STATUS_BADGES[item.employeeConfirmStatus]
                              }`}
                            >
                              {OVERTIME_CONFIRM_STATUS_LABELS[item.employeeConfirmStatus]}
                            </span>
                          </td>

                          {/* Trạng thái duyệt */}
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                OVERTIME_APPROVAL_STATUS_BADGES[item.approvalStatus]
                              }`}
                            >
                              {OVERTIME_APPROVAL_STATUS_LABELS[item.approvalStatus]}
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="p-2.5 text-center whitespace-nowrap no-print">
                            <div className="flex items-center justify-center gap-1">
                              {/* Nút Xác nhận/Sửa giờ của người lao động */}
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModalData({
                                    item,
                                    registrationId: regId,
                                    registrationDate: regDate,
                                  })
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                                  deadlineCheck.isEditable
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                                title={
                                  deadlineCheck.isEditable
                                    ? 'Người lao động xác nhận hoặc điều chỉnh giờ tăng ca trước 15h00'
                                    : deadlineCheck.reason
                                }
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {item.employeeConfirmStatus === 'pending'
                                    ? 'Xác nhận'
                                    : 'Sửa giờ'}
                                </span>
                              </button>

                              {/* Nút Duyệt cho Trưởng bộ phận / Quản lý */}
                              {canApprove && item.approvalStatus === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovalAction(regId, item.id, 'approved')}
                                    className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                    title="Phê duyệt đơn này"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovalAction(regId, item.id, 'rejected')}
                                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                    title="Từ chối đơn này"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <div>
                Đang hiển thị <b>{filteredTrackingItems.length}</b> / {allTrackingItems.length} bản ghi tăng ca
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  <span>Chờ xác nhận</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Đã xác nhận</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Đã duyệt</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Cả Tổ */}
      <OvertimeTeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        users={users}
        currentUser={currentUser}
        registrationDate={registrationDate}
        mealMenus={mealMenus}
        onApplyTeam={handleApplyTeamMembers}
      />

      {/* Modal Xác nhận giờ của người lao động (kèm kiểm tra hạn 15h00) */}
      {confirmModalData && (
        <OvertimeConfirmModal
          isOpen={true}
          onClose={() => setConfirmModalData(null)}
          item={confirmModalData.item}
          registrationId={confirmModalData.registrationId}
          registrationDate={confirmModalData.registrationDate}
          currentUser={currentUser}
          onConfirm={handleEmployeeConfirmSubmit}
        />
      )}

      {/* Modal Thực đơn ăn giữa ca (HCNS & Admin) */}
      <OvertimeMenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menus={mealMenus}
        onSaveMenu={(menu) => {
          storage.saveOvertimeMealMenu(menu, {
            id: currentUser?.id || '',
            name: currentUser?.name || '',
          });
          loadAllData();
          showToast('Đã lưu thực đơn ăn giữa ca thành công!');
        }}
        onDeleteMenu={(id) => {
          storage.deleteOvertimeMealMenu(id, {
            id: currentUser?.id || '',
            name: currentUser?.name || '',
          });
          loadAllData();
          showToast('Đã xóa món ăn khỏi thực đơn!');
        }}
      />
    </div>
  );
}
