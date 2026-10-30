'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { exportReportToExcel, exportStationeryReportToExcel, exportPCCCReportToExcel, formatPCCCChecklistSummary } from '@/lib/excel';
import {
  Flame,
  ClipboardCheck,
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Clock,
  CalendarDays,
  QrCode,
  Building2,
  Utensils,
  Search,
  RotateCcw,
  Wrench,
  Package,
  FileQuestion,
} from 'lucide-react';
import { formatDate, formatDateTime, sortNewestFirst } from '@/lib/utils';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { RepairProposal, REPAIR_STATUS_LABELS, REPAIR_STATUS_BADGES } from '@/types/repair';
import { PCCCDevice, PCCCInspection, PCCC_CATEGORIES, formatPCCCDate } from '@/types/pccc';
import {
  FirstAidInspection,
  EyewashInspection,
  StormwaterInspection,
  GroundwaterSoilInspection,
} from '@/types/periodic-inspection';
import {
  StationeryProposal,
  GeneralProposal,
  STATIONERY_STATUS_LABELS,
  STATIONERY_STATUS_BADGES,
  GENERAL_STATUS_LABELS,
  GENERAL_STATUS_BADGES,
} from '@/types/proposal';
import { filterUserLeaves, filterUserAttendances, filterUserGatePasses, filterUserRepairProposals, filterUserStationeryProposals, filterUserGeneralProposals } from '@/lib/permissions';

export function ReportsView() {
  const { currentUser } = useAuth();
  const [reportType, setReportType] = useState<'leave' | 'attendance' | 'gate_pass' | 'meal_cut' | 'repair' | 'stationery' | 'general' | 'departments' | 'pccc' | 'periodic_inspection'>('leave');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pcccCategoryFilter, setPcccCategoryFilter] = useState('all');
  const [periodicCategoryFilter, setPeriodicCategoryFilter] = useState<'all' | 'first_aid' | 'eyewash' | 'stormwater' | 'groundwater_soil'>('all');

  const handleSelectReportType = (type: typeof reportType) => {
    setReportType(type);
    setStatusFilter(type === 'pccc' ? 'inspected' : 'all');
    setPcccCategoryFilter('all');
  };

  const departments = storage.getDepartments();
  const users = storage.getUsers();

  const leaves = useMemo(() => {
    return filterUserLeaves(storage.getLeaveRequests(), currentUser, 'all', users);
  }, [currentUser, users]);

  const attendances = useMemo(() => {
    return filterUserAttendances(storage.getAttendanceConfirms(), currentUser, 'all');
  }, [currentUser]);

  const gatePasses = useMemo(() => {
    return filterUserGatePasses(storage.getGatePasses(), currentUser, 'all');
  }, [currentUser]);

  const repairs = useMemo(() => {
    return filterUserRepairProposals(storage.getRepairProposals(), currentUser, 'all');
  }, [currentUser]);

  const stationeries = useMemo(() => {
    return filterUserStationeryProposals(storage.getStationeryProposals(), currentUser, 'all');
  }, [currentUser]);

  const generals = useMemo(() => {
    return filterUserGeneralProposals(storage.getGeneralProposals(), currentUser, 'all');
  }, [currentUser]);

  // All leave requests where Economic staff has confirmed cutting meals
  const mealCutLeaves = useMemo(() => {
    return leaves.filter((l) =>
      l.steps.some((s) => s.roleRequired === 'economic' && s.status === 'approved')
    );
  }, [leaves]);

  // Filter handlers
  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFromDate(today);
    setToDate(today);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setFromDate(firstDay);
    setToDate(lastDay);
  };

  const handleResetFilters = () => {
    setDepartmentFilter('all');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setStatusFilter(reportType === 'pccc' ? 'inspected' : 'all');
    setPcccCategoryFilter('all');
  };

  const hasActiveFilters =
    departmentFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    searchTerm.trim() !== '' ||
    (reportType === 'pccc'
      ? statusFilter !== 'inspected' || pcccCategoryFilter !== 'all'
      : statusFilter !== 'all');

  // 1. Filtered Leaves
  const filteredLeaves = useMemo(() => {
    return sortNewestFirst(leaves.filter((l) => {
      if (departmentFilter !== 'all' && l.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          l.id.toLowerCase().includes(q) ||
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          (l.department && l.department.toLowerCase().includes(q));
        if (!match) return false;
      }
      const start = l.fromDate || (l.createdAt ? l.createdAt.slice(0, 10) : '');
      const end = l.toDate || start;
      if (fromDate && end && end < fromDate) return false;
      if (toDate && start && start > toDate) return false;
      return true;
    }));
  }, [leaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 2. Filtered Attendances
  const filteredAttendances = useMemo(() => {
    return sortNewestFirst(attendances.filter((a) => {
      if (departmentFilter !== 'all' && a.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          a.id.toLowerCase().includes(q) ||
          a.employeeId.toLowerCase().includes(q) ||
          a.employeeName.toLowerCase().includes(q) ||
          (a.reason && a.reason.toLowerCase().includes(q)) ||
          (a.department && a.department.toLowerCase().includes(q)) ||
          (a.shift && a.shift.toLowerCase().includes(q));
        if (!match) return false;
      }
      const aDate = a.date || (a.createdAt ? a.createdAt.slice(0, 10) : '');
      if (fromDate && aDate && aDate < fromDate) return false;
      if (toDate && aDate && aDate > toDate) return false;
      return true;
    }));
  }, [attendances, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 3. Filtered Gate Passes
  const filteredGatePasses = useMemo(() => {
    return sortNewestFirst(gatePasses.filter((gp) => {
      if (departmentFilter !== 'all' && gp.department !== departmentFilter) return false;
      if (statusFilter !== 'all') {
        if (gp.status !== statusFilter) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          gp.id.toLowerCase().includes(q) ||
          gp.employeeId.toLowerCase().includes(q) ||
          gp.employeeName.toLowerCase().includes(q) ||
          (gp.purpose && gp.purpose.toLowerCase().includes(q)) ||
          (gp.department && gp.department.toLowerCase().includes(q)) ||
          (gp.shift && gp.shift.toLowerCase().includes(q));
        if (!match) return false;
      }
      const gpDate = (gp.actualDepartureTime || gp.estimatedDepartureTime || gp.createdAt || '').slice(0, 10);
      if (fromDate && gpDate && gpDate < fromDate) return false;
      if (toDate && gpDate && gpDate > toDate) return false;
      return true;
    }));
  }, [gatePasses, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 4. Filtered Meal Cut Leaves
  const filteredMealCutLeaves = useMemo(() => {
    return sortNewestFirst(mealCutLeaves.filter((l) => {
      if (departmentFilter !== 'all' && l.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          l.id.toLowerCase().includes(q) ||
          l.employeeId.toLowerCase().includes(q) ||
          l.employeeName.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q)) ||
          (l.department && l.department.toLowerCase().includes(q));
        if (!match) return false;
      }
      const start = l.fromDate || (l.createdAt ? l.createdAt.slice(0, 10) : '');
      const end = l.toDate || start;
      if (fromDate && end && end < fromDate) return false;
      if (toDate && start && start > toDate) return false;
      return true;
    }));
  }, [mealCutLeaves, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5. Filtered Repair Proposals
  const filteredRepairs = useMemo(() => {
    return sortNewestFirst(repairs.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.issueDescription.toLowerCase().includes(q) ||
          (p.proposedSolution && p.proposedSolution.toLowerCase().includes(q));
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [repairs, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5b. Filtered Stationery Proposals
  const filteredStationeries = useMemo(() => {
    return sortNewestFirst(stationeries.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const itemsStr = p.items.map((i) => `${i.itemId} ${i.itemName}`).join(' ').toLowerCase();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          itemsStr.includes(q) ||
          (p.notes && p.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [stationeries, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 5c. Filtered General Proposals
  const filteredGenerals = useMemo(() => {
    return sortNewestFirst(generals.filter((p) => {
      if (departmentFilter !== 'all' && p.department !== departmentFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.employeeId.toLowerCase().includes(q) ||
          p.employeeName.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.receiverDepartment.toLowerCase().includes(q) ||
          (p.receiverUserName && p.receiverUserName.toLowerCase().includes(q)) ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q);
        if (!match) return false;
      }
      const pDate = (p.createdAt || '').slice(0, 10);
      if (fromDate && pDate && pDate < fromDate) return false;
      if (toDate && pDate && pDate > toDate) return false;
      return true;
    }));
  }, [generals, departmentFilter, statusFilter, searchTerm, fromDate, toDate]);

  // 6. Filtered PCCC Devices & Inspections
  const [pcccVersion, setPcccVersion] = useState(0);

  useEffect(() => {
    const handleSync = () => setPcccVersion((v) => v + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('pccc_inspections_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('pccc_inspections_updated', handleSync);
    };
  }, []);

  const pcccDevices = useMemo(() => storage.getPCCCDevices(), [pcccVersion]);
  const pcccInspections = useMemo(() => storage.getPCCCInspections(), [pcccVersion]);

  const filteredPCCCDevices = useMemo(() => {
    const list = pcccDevices.filter((d) => {
      const insp = pcccInspections.find(
        (i) => i.deviceId.toLowerCase() === d.id.toLowerCase()
      );
      const isInspected = Boolean(
        insp && insp.checklist && formatPCCCChecklistSummary(insp) !== 'Chưa kiểm tra'
      );

      // Status filter tailored for PCCC
      // Mặc định hoặc chọn 'inspected': Chỉ hiển thị những thiết bị đã được kiểm tra
      if (statusFilter === 'inspected' || (!statusFilter && reportType === 'pccc')) {
        if (!isInspected) return false;
      } else if (statusFilter === 'pass') {
        if (!isInspected) return false;
        const isPass = insp ? insp.overallResult === 'pass' : d.lastInspection?.status === 'pass';
        if (!isPass) return false;
      } else if (statusFilter === 'fail') {
        if (!isInspected) return false;
        const isFail = insp ? insp.overallResult === 'fail' : d.lastInspection?.status === 'fail';
        if (!isFail) return false;
      } else if (statusFilter === 'none') {
        if (isInspected) return false;
      } else if (statusFilter === 'expiring') {
        const parts = (d.inspectionExpiry || '').split('/');
        if (parts.length === 3) {
          const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          if (isNaN(expDate.getTime()) || expDate > in30) return false;
        } else {
          return false;
        }
      }
      // statusFilter === 'all': Hiển thị tất cả thiết bị (kể cả chưa kiểm tra)

      // Category filter for PCCC
      if (pcccCategoryFilter !== 'all' && d.category !== pcccCategoryFilter) return false;

      // Area / Location filter
      if (departmentFilter !== 'all') {
        const locUpper = (d.location || '').toUpperCase();
        const idUpper = (d.id || '').toUpperCase();
        const depUpper = departmentFilter.toUpperCase();
        if (!locUpper.includes(depUpper) && !idUpper.startsWith(depUpper)) {
          return false;
        }
      }

      // Date Range Filter (by inspection date)
      if (fromDate || toDate) {
        const inspDateRaw = insp?.inspectedAt || (isInspected ? d.lastInspection?.date : '');
        const inspDate = inspDateRaw ? inspDateRaw.slice(0, 10) : '';
        if (fromDate && (!inspDate || inspDate < fromDate)) return false;
        if (toDate && (!inspDate || inspDate > toDate)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          d.id.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.specs.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sắp xếp: Thiết bị nào kiểm tra sau cùng (mới nhất) sẽ được hiển thị đầu tiên
    const getInspectionTime = (device: PCCCDevice): number => {
      const insp = pcccInspections.find(
        (i) => i.deviceId.toLowerCase() === device.id.toLowerCase()
      );
      const raw = insp?.inspectedAt || insp?.createdAt || (insp ? device.lastInspection?.date : '');
      if (!raw) return 0;
      const parsed = new Date(raw.replace(' ', 'T')).getTime();
      return isNaN(parsed) ? new Date(raw).getTime() || 0 : parsed;
    };

    return list.sort((a, b) => {
      const timeA = getInspectionTime(a);
      const timeB = getInspectionTime(b);
      if (timeB !== timeA) {
        return timeB - timeA; // Giảm dần: Kiểm tra gần nhất / sau cùng lên đầu
      }
      return a.id.localeCompare(b.id);
    });
  }, [pcccDevices, pcccInspections, statusFilter, pcccCategoryFilter, departmentFilter, fromDate, toDate, searchTerm, reportType]);
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (departmentFilter !== 'all' && d.name !== departmentFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const match =
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.managerName && d.managerName.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [departments, departmentFilter, searchTerm]);


  // --- Format Helpers for Periodic Inspections ---
  function formatFirstAidDetails(item: FirstAidInspection): string[] {
    const entries = item.items ? Object.entries(item.items) : [];
    if (entries.length === 0) return ['Chưa có dữ liệu vật tư'];
    const bangGac = ['Băng dính (cuộn)', 'Băng thun kích thước 5 x 200 cm', 'Băng chun', 'Băng cuộn vải (gói)', 'Băng dính cá nhân', 'Gạc thấm nước (10 miếng/gói)', 'Bông hút nước (gói)'];
    const dungCu = ['Garo cao su', 'Kéo cắt băng', 'Panh không mấu thẳng', 'Panh không mấu cong', 'Găng tay khám bệnh (đôi)'];
    const satKhuan = ['Nước muối sinh lý NaCl 9 ‰', 'Cồn 70°', 'Dung dịch Povidine'];
    const nep = ['Nẹp cổ (cái)', 'Nẹp cánh tay (bộ)', 'Nẹp cẳng tay (bộ)', 'Nẹp đùi (bộ)', 'Nẹp cẳng chân (bộ)'];

    const bgCount = bangGac.filter((k) => (item.items[k] ?? 0) > 0).length;
    const dcCount = dungCu.filter((k) => (item.items[k] ?? 0) > 0).length;
    const skCount = satKhuan.filter((k) => (item.items[k] ?? 0) > 0).length;
    const nepCount = nep.filter((k) => (item.items[k] ?? 0) > 0).length;

    return [
      `Danh mục vật tư: ${entries.length} loại kiểm tra`,
      `Băng gạc & bông: ${bgCount}/${bangGac.length} loại (Đủ)`,
      `Dụng cụ sơ cứu: ${dcCount}/${dungCu.length} loại (Đủ)`,
      `Dung dịch sát khuẩn: ${skCount}/${satKhuan.length} loại (Đủ)`,
      `Nẹp nắn chỉnh: ${nepCount}/${nep.length} loại (Đủ)`,
      `Đánh giá tủ: ${item.summaryStatus || 'Đầy đủ'}`,
    ];
  }

  function formatEyewashDetails(item: EyewashInspection): string[] {
    const criteria = ['Nguồn nước', 'Vòi phun', 'Nước chảy liên tục 10-15 phút', 'Nước chảy cao 15cm', 'Máy sạch sẽ'];
    return criteria.map((c) => `${c}: ${item.items?.[c] || 'Đạt'}`);
  }

  function formatStormwaterDetails(item: StormwaterInspection): string[] {
    const qMap: Record<number, string> = {
      1: 'Trời mưa gần đây',
      3: 'Nước cống có màu/mùi lạ',
      4: 'Kho rác tràn đổ',
      5: 'Kho hóa chất tràn đổ',
      6: 'Nhà vệ sinh tràn nước',
      7: 'Nén khí, lò hơi tràn dầu',
      8: 'Trạm bơm rò rỉ dầu',
      9: 'Nhà xe rò rỉ xăng',
      10: 'Cống bị xả thải',
      11: 'Cống nước thải rò rỉ',
      12: 'Nguồn nước mưa ô nhiễm',
    };
    const list = [1, 3, 4, 5, 7, 8, 11, 12];
    return list.map((qid) => {
      const a = item.answers ? item.answers[qid] : undefined;
      const val = a ? (typeof a === 'string' ? a : a.ketQua) : 'Không';
      return `${qMap[qid]}: ${val || 'Không'}`;
    });
  }

  function formatGroundwaterSoilDetails(item: GroundwaterSoilInspection): string[] {
    const criteriaMap: Record<number, string> = {
      1: 'Mùi đất bất thường',
      2: 'Đất đổi màu, loang dầu',
      3: 'Thực vật héo úa, chết',
      4: 'Kho HC thấm nền đất',
      5: 'Bồn nhiên liệu rò rỉ',
      6: 'Cống rãnh, hố ga nứt vỡ',
      7: 'Chất thải thấm xuống đất',
      8: 'Mặt đất sụt lún, nứt nẻ',
    };
    const lines = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => {
      const a = item.answers ? item.answers[id] : undefined;
      const val = a ? (typeof a === 'string' ? a : a.ketQua) : 'Đạt';
      return `${criteriaMap[id]}: ${val || 'Đạt'}`;
    });
    if (item.tongHop?.canLayMau) {
      lines.push(`Lấy mẫu phân tích: ${item.tongHop.canLayMau}`);
    }
    return lines;
  }

  const periodicInspections = useMemo(() => {
    const scc = storage.getFirstAidInspections() || [];
    const mrm = storage.getEyewashInspections() || [];
    const nm = storage.getStormwaterInspections() || [];
    const ngd = storage.getGroundwaterSoilInspections() || [];

    const list: {
      id: string;
      category: 'first_aid' | 'eyewash' | 'stormwater' | 'groundwater_soil';
      categoryName: string;
      categoryBadgeCls: string;
      location: string;
      thoiGian: string;
      dateObj: Date;
      inspector: string;
      department: string;
      detailLines: string[];
      status: string;
      statusCls: string;
      notes: string;
    }[] = [];

    scc.forEach((it) => {
      const isShort = it.summaryStatus === 'Thiếu vật tư';
      list.push({
        id: it.id,
        category: 'first_aid',
        categoryName: 'Tủ sơ cấp cứu',
        categoryBadgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
        location: it.diaDiem || 'Văn phòng',
        thoiGian: it.thoiGian || '',
        dateObj: new Date(it.createdAt || it.thoiGian || 0),
        inspector: it.nguoiKT || `${it.hoTen} (${it.maNV})`,
        department: it.boPhan || 'HCNS',
        detailLines: formatFirstAidDetails(it),
        status: isShort ? 'THIẾU VẬT TƯ' : 'ĐẦY ĐỦ',
        statusCls: isShort ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
        notes: it.ghiChu || '-',
      });
    });

    mrm.forEach((it) => {
      const isPass = it.danhGiaTongQuat === 'Đạt';
      list.push({
        id: it.id,
        category: 'eyewash',
        categoryName: 'Máy rửa mắt',
        categoryBadgeCls: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        location: it.diaDiem || 'Khu sản xuất',
        thoiGian: it.thoiGian || '',
        dateObj: new Date(it.createdAt || it.thoiGian || 0),
        inspector: it.nguoiKT || `${it.hoTen} (${it.maNV})`,
        department: it.boPhan || 'HCNS',
        detailLines: formatEyewashDetails(it),
        status: isPass ? 'ĐẠT' : 'KHÔNG ĐẠT',
        statusCls: isPass ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200',
        notes: it.deXuat || '-',
      });
    });

    nm.forEach((it) => {
      const isPass = it.danhGiaTongQuat === 'Đạt';
      list.push({
        id: it.id,
        category: 'stormwater',
        categoryName: 'Nước mưa',
        categoryBadgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
        location: 'Hệ thống cống & hố ga',
        thoiGian: it.thoiGian || '',
        dateObj: new Date(it.createdAt || it.thoiGian || 0),
        inspector: it.nguoiKT || `${it.hoTen} (${it.maNV})`,
        department: it.boPhan || 'HCNS',
        detailLines: formatStormwaterDetails(it),
        status: isPass ? 'ĐẠT' : 'CẦN XỬ LÝ',
        statusCls: isPass ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200',
        notes: it.ghiChuTongQuat || '-',
      });
    });

    ngd.forEach((it) => {
      const isPass = it.tongHop?.ketQuaSoBo === 'Đạt';
      const notes = [it.tongHop?.khuVucNghiNgo ? `KV nghi ngờ: ${it.tongHop.khuVucNghiNgo}` : '', it.tongHop?.khuyenNghi || '']
        .filter(Boolean)
        .join('. ');
      list.push({
        id: it.id,
        category: 'groundwater_soil',
        categoryName: 'Nước ngầm & đất',
        categoryBadgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        location: 'Khuôn viên nhà máy',
        thoiGian: it.thoiGian || '',
        dateObj: new Date(it.createdAt || it.thoiGian || 0),
        inspector: it.nguoiKT || `${it.hoTen} (${it.maNV})`,
        department: it.boPhan || 'HCNS',
        detailLines: formatGroundwaterSoilDetails(it),
        status: isPass ? 'ĐẠT' : 'KHÔNG ĐẠT',
        statusCls: isPass ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200',
        notes: notes || '-',
      });
    });

    // Sort newest inspections first
    return list.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, []);

  const filteredPeriodicInspections = useMemo(() => {
    return periodicInspections.filter((item) => {
      if (periodicCategoryFilter !== 'all' && item.category !== periodicCategoryFilter) return false;
      if (departmentFilter !== 'all' && item.department !== departmentFilter) return false;
      if (fromDate) {
        const itemDateStr = item.dateObj.toISOString().slice(0, 10);
        if (itemDateStr < fromDate) return false;
      }
      if (toDate) {
        const itemDateStr = item.dateObj.toISOString().slice(0, 10);
        if (itemDateStr > toDate) return false;
      }
      if (statusFilter === 'pass') {
        if (!['ĐẠT', 'ĐẦY ĐỦ', 'DƯ VẬT TƯ'].includes(item.status)) return false;
      } else if (statusFilter === 'fail') {
        if (!['KHÔNG ĐẠT', 'THIẾU VẬT TƯ', 'CẦN XỬ LÝ'].includes(item.status)) return false;
      }
      if (searchTerm.trim()) {
        const s = searchTerm.toLowerCase();
        const matchId = item.id.toLowerCase().includes(s);
        const matchCat = item.categoryName.toLowerCase().includes(s);
        const matchLoc = item.location.toLowerCase().includes(s);
        const matchInsp = item.inspector.toLowerCase().includes(s);
        const matchDept = item.department.toLowerCase().includes(s);
        const matchNote = item.notes.toLowerCase().includes(s);
        if (!matchId && !matchCat && !matchLoc && !matchInsp && !matchDept && !matchNote) return false;
      }
      return true;
    });
  }, [periodicInspections, periodicCategoryFilter, departmentFilter, fromDate, toDate, statusFilter, searchTerm]);

  // Current active result count
  const currentCount =
    reportType === 'leave'
      ? filteredLeaves.length
      : reportType === 'attendance'
      ? filteredAttendances.length
      : reportType === 'gate_pass'
      ? filteredGatePasses.length
      : reportType === 'meal_cut'
      ? filteredMealCutLeaves.length
      : reportType === 'repair'
      ? filteredRepairs.length
      : reportType === 'stationery'
      ? filteredStationeries.length
      : reportType === 'general'
      ? filteredGenerals.length
      : reportType === 'pccc' ? filteredPCCCDevices.length : reportType === 'periodic_inspection' ? filteredPeriodicInspections.length : filteredDepartments.length;

  // Export to Excel handler
  const handleExportExcel = () => {
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const subtitle =
      (departmentFilter !== 'all' ? `Phòng ban: ${departmentFilter} • ` : '') +
      (fromDate && toDate
        ? `Từ ngày ${formatDate(fromDate)} đến ngày ${formatDate(toDate)}`
        : fromDate
        ? `Từ ngày ${formatDate(fromDate)}`
        : toDate
        ? `Đến ngày ${formatDate(toDate)}`
        : 'Tất cả thời gian');

    let title = '';
    let fileName = '';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'leave') {
      title = 'NGHỈ PHÉP';
      fileName = `LONGKHAI_Bao_Cao_NGHI_PHEP_${nowStr}`;
      headers = [
        'Mã đơn',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Loại nghỉ phép',
        'Thời gian nghỉ',
        'Số ngày',
        'Lý do',
        'Trạng thái',
      ];
      rows = filteredLeaves.map((l) => [
        l.id,
        l.employeeId,
        l.employeeName,
        l.department,
        LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
        `${formatDate(l.fromDate)} → ${formatDate(l.toDate)}`,
        l.totalDays,
        l.reason || '',
        l.status === 'approved'
          ? 'Đã duyệt'
          : l.status === 'pending'
          ? 'Chờ duyệt'
          : l.status === 'rejected'
          ? 'Từ chối'
          : 'Đã hủy',
      ]);
    } else if (reportType === 'attendance') {
      title = 'XÁC NHẬN CÔNG';
      fileName = `LONGKHAI_Bao_Cao_XAC_NHAN_CONG_${nowStr}`;
      headers = [
        'Mã phiếu',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Lý do sự cố',
        'Ngày',
        'Ca làm việc',
        'Giờ vào thực tế',
        'Giờ ra thực tế',
        'Trạng thái',
      ];
      rows = filteredAttendances.map((a) => [
        a.id,
        a.employeeId,
        a.employeeName,
        a.department,
        ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType,
        formatDate(a.date),
        a.shift,
        a.actualCheckIn || '',
        a.actualCheckOut || '',
        a.status === 'approved'
          ? 'Đã duyệt'
          : a.status === 'pending'
          ? 'Chờ duyệt'
          : 'Từ chối',
      ]);
    } else if (reportType === 'gate_pass') {
      title = 'RA VÀO CỔNG & TÀI SẢN';
      fileName = `LONGKHAI_Bao_Cao_RA_VAO_CONG_${nowStr}`;
      headers = [
        'Mã phiếu',
        'Nhân viên',
        'Phòng ban',
        'Mục đích',
        'Tài sản mang theo',
        'Ca làm việc',
        'Giờ ra thực tế',
        'Giờ vào thực tế',
        'Trạng thái',
      ];
      rows = filteredGatePasses.map((gp) => {
        const empText = `${gp.employeeName} (${gp.employeeId})`;
        const assetStr =
          gp.hasAssets && gp.assets && gp.assets.length > 0
            ? gp.assets.map((a) => `${a.name} (${a.quantity})`).join(', ')
            : '';
        const depTime = gp.actualDepartureTime
          ? formatDateTime(gp.actualDepartureTime)
          : gp.timeType === 'nghi_dau_gio'
          ? ''
          : gp.estimatedDepartureTime && gp.status === 'approved'
          ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}`
          : '';
        const retTime =
          gp.timeType === 'nghi_cuoi_gio'
            ? ''
            : gp.actualReturnTime
            ? formatDateTime(gp.actualReturnTime)
            : gp.estimatedReturnTime && gp.status === 'approved'
            ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}`
            : '';
        const statusStr =
          gp.status === 'approved'
            ? 'Đã duyệt'
            : gp.status === 'departed'
            ? 'Đang ra ngoài'
            : gp.status === 'completed'
            ? 'Hoàn tất'
            : gp.status === 'pending'
            ? 'Chờ duyệt'
            : gp.status === 'rejected'
            ? 'Từ chối'
            : 'Hết hạn';

        return [
          gp.id,
          empText,
          gp.department,
          gp.purpose,
          assetStr,
          gp.shift || '',
          depTime,
          retTime,
          statusStr,
        ];
      });
    } else if (reportType === 'meal_cut') {
      title = 'CẮT CƠM NHÂN VIÊN';
      fileName = `LONGKHAI_Bao_Cao_CAT_COM_${nowStr}`;
      headers = [
        'STT',
        'Mã đơn',
        'Mã NV',
        'Họ và tên',
        'Phòng ban',
        'Loại nghỉ',
        'Thời gian nghỉ',
        'Số ngày cắt cơm',
        'NV Kinh tế xác nhận',
        'Thời gian xác nhận',
        'Trạng thái',
      ];
      rows = filteredMealCutLeaves.map((l, idx) => {
        const ecoStep = l.steps.find((s) => s.roleRequired === 'economic');
        return [
          idx + 1,
          l.id,
          l.employeeId,
          l.employeeName,
          l.department,
          LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType,
          `${formatDate(l.fromDate)} → ${formatDate(l.toDate)}`,
          `${l.totalDays} ngày`,
          ecoStep?.approverName || 'Nhân viên kinh tế',
          ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận',
          'Đã cắt cơm',
        ];
      });
    } else if (reportType === 'repair') {
      title = 'ĐỀ XUẤT SỬA CHỮA';
      fileName = `LONGKHAI_Bao_Cao_DE_XUAT_SUA_CHUA_${nowStr}`;
      headers = [
        'STT',
        'Mã phiếu',
        'Thời gian gửi',
        'MSNV',
        'Họ tên nhân viên',
        'Tổ / Bộ phận',
        'Khu vực thiết bị',
        'Tình trạng sự việc',
        'Đề xuất hướng khắc phục',
        'Trạng thái',
        'Thời gian hoàn thành',
      ];
      rows = filteredRepairs.map((p, idx) => [
        idx + 1,
        p.id,
        formatDateTime(p.createdAt),
        p.employeeId,
        p.employeeName,
        p.department,
        p.location,
        p.issueDescription,
        p.proposedSolution || p.managerComment || '',
        REPAIR_STATUS_LABELS[p.status] || p.status,
        p.creatorConfirmedAt ? formatDateTime(p.creatorConfirmedAt) : '',
      ]);
    } else if (reportType === 'stationery') {
      if (filteredStationeries.length === 0) {
        alert('Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel.');
        return;
      }
      exportStationeryReportToExcel({
        proposals: filteredStationeries,
        subtitle,
        docCode: 'BC-LK-2026/01',
        fileName: `LONGKHAI_Bao_Cao_TONG_HOP_VPP_${nowStr}`,
      });
      return;
    } else if (reportType === 'general') {
      title = 'ĐỀ XUẤT KHÁC';
      fileName = `LONGKHAI_Bao_Cao_DE_XUAT_KHAC_${nowStr}`;
      headers = [
        'STT',
        'Mã phiếu',
        'Thời gian gửi',
        'MSNV',
        'Họ tên nhân viên',
        'Tổ / Bộ phận',
        'Bộ phận tiếp nhận',
        'Tiêu đề đề xuất',
        'Nội dung chi tiết',
        'Trạng thái',
      ];
      rows = filteredGenerals.map((p, idx) => [
        idx + 1,
        p.id,
        formatDateTime(p.createdAt),
        p.employeeId,
        p.employeeName,
        p.department,
        p.receiverUserName ? `${p.receiverUserName} (${p.receiverDepartment})` : p.receiverDepartment,
        p.title,
        p.content,
        GENERAL_STATUS_LABELS[p.status] || p.status,
      ]);
    } else if (reportType === 'pccc') {
      if (filteredPCCCDevices.length === 0) {
        alert('Không có dữ liệu thiết bị PCCC phù hợp với bộ lọc hiện tại để xuất file Excel.');
        return;
      }
      exportPCCCReportToExcel({
        devices: filteredPCCCDevices,
        inspections: pcccInspections,
        subtitle,
        docCode: 'BC-LK-PCCC/2026',
        fileName: `LONGKHAI_Bao_Cao_PCCC_${nowStr}`,
      });
      return;
    } else if (reportType === 'departments') {
      title = 'CƠ CẤU PHÒNG BAN';
      fileName = `LONGKHAI_Bao_Cao_PHONG_BAN_${nowStr}`;
      headers = [
        'Mã phòng ban',
        'Tên phòng ban',
        'Mô tả chức năng',
        'Trưởng bộ phận',
        'Số nhân sự',
      ];
      rows = filteredDepartments.map((d) => [
        d.code,
        d.name,
        d.description || '',
        d.managerName || 'Chưa chỉ định',
        `${users.filter((u) => u.department === d.name).length} người`,
      ]);
    }

    if (rows.length === 0) {
      alert('Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất file Excel.');
      return;
    }

    exportReportToExcel({
      title,
      subtitle,
      docCode: 'BC-LK-2026/01',
      headers,
      rows,
      fileName,
    });
  };

  return (
    <div className="space-y-6">
      {/* TOP CONTROLS (Hidden completely on print/PDF) */}
      <div className="space-y-6 no-print print:hidden">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Báo Cáo & Thống Kê Tổng Hợp
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu số liệu, lọc dữ liệu đa chiều, xuất file Excel và in ấn báo cáo chuẩn quy cách nhà máy
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo / PDF</span>
          </button>
        </div>
      </div>

      {/* Select Report Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <button
          onClick={() => handleSelectReportType('leave')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'leave'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <CalendarDays className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Nghỉ phép</div>
          <div className="text-[11px] text-slate-500">
            {filteredLeaves.length} đơn {hasActiveFilters && `(${leaves.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('attendance')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'attendance'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-1 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Xác nhận công</div>
          <div className="text-[11px] text-slate-500">
            {filteredAttendances.length} phiếu {hasActiveFilters && `(${attendances.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('gate_pass')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'gate_pass'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <QrCode className="w-5 h-5 text-emerald-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Ra vào cổng</div>
          <div className="text-[11px] text-slate-500">
            {filteredGatePasses.length} lượt {hasActiveFilters && `(${gatePasses.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('repair')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'repair'
              ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 shadow-sm ring-1 ring-orange-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Wrench className="w-5 h-5 text-orange-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Đề xuất sửa chữa</div>
          <div className="text-[11px] text-slate-500">
            {filteredRepairs.length} đề xuất {hasActiveFilters && `(${repairs.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('meal_cut')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'meal_cut'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm ring-1 ring-rose-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Utensils className="w-5 h-5 text-rose-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cắt cơm</div>
          <div className="text-[11px] text-slate-500">
            {filteredMealCutLeaves.length} lượt {hasActiveFilters && `(${mealCutLeaves.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('stationery')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'stationery'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Package className="w-5 h-5 text-blue-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Văn phòng phẩm</div>
          <div className="text-[11px] text-slate-500">
            {filteredStationeries.length} phiếu {hasActiveFilters && `(${stationeries.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('general')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'general'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <FileQuestion className="w-5 h-5 text-purple-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Đề xuất khác</div>
          <div className="text-[11px] text-slate-500">
            {filteredGenerals.length} đề xuất {hasActiveFilters && `(${generals.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('pccc')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'pccc'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-red-500 shadow-sm ring-1 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Flame className="w-5 h-5 text-red-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Kiểm tra PCCC</div>
          <div className="text-[11px] text-slate-500">
            {filteredPCCCDevices.length} thiết bị {hasActiveFilters && `(${pcccDevices.length} gốc)`}
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('periodic_inspection')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'periodic_inspection'
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <ClipboardCheck className="w-5 h-5 text-indigo-600 mb-2" />
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">Kiểm tra định kỳ</div>
          <div className="text-xs text-slate-500 mt-1">
            Tủ SCC, Máy rửa mắt, Nước mưa, Đất &amp; Nước ngầm
          </div>
        </button>

        <button
          onClick={() => handleSelectReportType('departments')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            reportType === 'departments'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-5 h-5 text-purple-600 mb-2" />
          <div className="font-bold text-xs text-slate-900 dark:text-white">Cơ cấu phòng ban</div>
          <div className="text-[11px] text-slate-500">
            {filteredDepartments.length} phòng ban
          </div>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                reportType === 'pccc'
                  ? 'Tìm theo mã, tên thiết bị, vị trí...'
                  : reportType === 'departments'
                  ? 'Tìm phòng ban, mã số, quản lý...'
                  : reportType === 'stationery'
                  ? 'Tìm mã, người gửi, tên VPP...'
                  : reportType === 'repair'
                  ? 'Tìm mã, người gửi, vị trí, sự cố...'
                  : 'Tìm kiếm theo mã, họ tên, lý do...'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Department Filter */}
          {reportType !== 'departments' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 whitespace-nowrap text-xs">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                {reportType === 'pccc' ? 'Khu vực / Xưởng:' : 'Phòng ban:'}
              </span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {reportType === 'periodic_inspection' ? (
                  <>
                    <option value="all">Tất cả kết quả kiểm tra</option>
                    <option value="pass">Đạt / Đầy đủ tiêu chuẩn</option>
                    <option value="fail">Không đạt / Cần xử lý / Thiếu</option>
                  </>
                ) : reportType === 'pccc' ? (
                  <>
                    <option value="all">Tất cả khu vực</option>
                    <option value="PXHT">PX Hoàn Thiện (PXHT)</option>
                    <option value="KHO">Khu Vực Kho (KHO)</option>
                    <option value="VP">Văn Phòng Điều Hành (VP)</option>
                    <option value="D">Phân Xưởng Dệt (D)</option>
                    <option value="BV">Bảo Vệ Cổng Chính (BV)</option>
                    <option value="NX">Nhà Xe / Khu Phụ Trợ</option>
                    <option value="TRAMBOM">Trạm Bơm Chữa Cháy</option>
                  </>
                ) : (
                  <>
                    <option value="all">Tất cả phòng ban</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          )}

          {/* Chủng loại Filter (Dành riêng cho Kiểm tra PCCC) */}
          

      {reportType === 'pccc' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                Chủng loại:
              </span>
              <select
                value={pcccCategoryFilter}
                onChange={(e) => setPcccCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
              >
                <option value="all">Tất cả chủng loại ({pcccDevices.length})</option>
                <option value="binh_co2">Bình CO2 (45)</option>
                <option value="binh_bot">Bình Bột (33)</option>
                <option value="tu_voi_vach">Tủ Vách Tường (19)</option>
                <option value="nut_chuong">Báo Cháy (12)</option>
                <option value="tu_trung_tam">Tủ Trung Tâm (1)</option>
                <option value="tram_bom">Trạm Bơm (1)</option>
              </select>
            </div>
          )}

          {/* Status Filter (Áp dụng chính xác cho từng hạng mục) */}
          {reportType !== 'departments' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                Trạng thái:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {reportType === 'pccc' ? (
                  <>
                    <option value="inspected">Thiết bị đã kiểm tra (Mặc định)</option>
                    <option value="all">Tất cả thiết bị (kể cả chưa kiểm tra)</option>
                    <option value="pass">Đạt tiêu chuẩn kiểm định</option>
                    <option value="fail">Cần xử lý / Hỏng</option>
                    <option value="expiring">Hết hạn / Sắp hết hạn (30 ngày)</option>
                    <option value="none">Chưa kiểm tra</option>
                  </>
                ) : reportType === 'gate_pass' ? (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt (chưa ra)</option>
                    <option value="departed">Đang ra ngoài</option>
                    <option value="completed">Đã về lại / Hoàn tất</option>
                    <option value="rejected">Bị từ chối</option>
                  </>
                ) : reportType === 'repair' ? (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending_dept">Bước 1: Chờ Quản lý duyệt</option>
                    <option value="pending_manager">Bước 2: Chờ Trưởng BP duyệt</option>
                    <option value="maintenance_pending">Bước 3: Chờ Cơ điện sửa chữa</option>
                    <option value="pending_confirmation">Bước 4: Chờ nghiệm thu</option>
                    <option value="completed">Đã hoàn tất</option>
                    <option value="rejected">Bị từ chối</option>
                  </>
                ) : reportType === 'stationery' ? (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending_dept">Chờ Trưởng BP duyệt</option>
                    <option value="pending_hr">Chờ TP HCNS phê duyệt</option>
                    <option value="approved">Đã phê duyệt hoàn tất</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="cancelled">Đã hủy</option>
                  </>
                ) : reportType === 'general' ? (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending_dept">Chờ Trưởng BP duyệt</option>
                    <option value="pending_receiver">Chờ BP tiếp nhận duyệt</option>
                    <option value="pending_hr">Chờ TP HCNS duyệt</option>
                    <option value="approved">Đã phê duyệt hoàn tất</option>
                    <option value="rejected">Bị từ chối</option>
                  </>
                ) : reportType === 'meal_cut' ? (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Đã xác nhận cắt cơm</option>
                    <option value="pending">Chờ xác nhận</option>
                  </>
                ) : (
                  <>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Đã duyệt / Hoàn tất</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="rejected">Bị từ chối</option>
                    <option value="cancelled">Đã hủy</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Date Range Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Từ ngày"
              title="Lọc từ ngày"
            />
            <span className="text-slate-400">&rarr;</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="py-2 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Đến ngày"
              title="Lọc đến ngày"
            />

            {/* Quick date shortcuts */}
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-[11px] transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-[11px] transition-colors"
            >
              Tháng này
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div>
            Đang lọc: <strong className="text-slate-700 dark:text-slate-300">{currentCount}</strong> kết quả phù hợp
            {departmentFilter !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-md">
                Phòng: {departmentFilter}
              </span>
            )}
            {((reportType === 'pccc' && statusFilter !== 'inspected') || (reportType !== 'pccc' && statusFilter !== 'all')) && (
              <span className="ml-2 px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-md">
                Trạng thái: {
                  reportType === 'pccc'
                    ? (statusFilter === 'all' ? 'Tất cả thiết bị' : statusFilter === 'pass' ? 'Đạt tiêu chuẩn' : statusFilter === 'fail' ? 'Cần xử lý/Hỏng' : statusFilter === 'expiring' ? 'Sắp hết hạn' : 'Chưa kiểm tra')
                    : statusFilter
                }
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-md">
                {fromDate ? `Từ ${formatDate(fromDate)}` : ''} {toDate ? `đến ${formatDate(toDate)}` : ''}
              </span>
            )}
            {searchTerm.trim() && (
              <span className="ml-2 px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-md">
                Từ khóa: &quot;{searchTerm.trim()}&quot;
              </span>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Printable Paper Document Container */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 print-document print:p-0 print:border-none print:shadow-none print:m-0">
        {/* Factory Formal Letterhead */}
        <div className="border-b-2 border-slate-800 pb-4 flex flex-row justify-between items-start text-xs gap-4 w-full print-header-letterhead">
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.png"
              alt="Long Khai Logo"
              className="w-12 h-12 object-contain shrink-0"
            />
            <div>
              <div className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Hệ thống Quản trị & Điều hành Sản xuất Nội bộ
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 dark:text-slate-400 ml-auto shrink-0 print-header-right">
            <div className="whitespace-nowrap font-medium">Ngày xuất báo cáo: {formatDate(new Date().toISOString())}</div>
            <div className="font-mono font-bold whitespace-nowrap">
              {reportType === 'pccc' ? 'Mã tài liệu: BC-LK-PCCC/2026' : reportType === 'periodic_inspection' ? 'Mã tài liệu: BC-LK-ĐK/2026' : 'Mã tài liệu: BC-LK-2026/01'}
            </div>
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center">
          <h2 className="text-base md:text-lg font-black uppercase text-slate-900 dark:text-white">
            BÁO CÁO TỔNG HỢP{' '}
            {reportType === 'meal_cut'
              ? 'CẮT CƠM NHÂN VIÊN'
              : reportType === 'leave'
              ? 'NGHỈ PHÉP'
              : reportType === 'attendance'
              ? 'XÁC NHẬN CÔNG'
              : reportType === 'gate_pass'
              ? 'RA VÀO CỔNG & TÀI SẢN'
              : reportType === 'repair'
              ? 'ĐỀ XUẤT SỬA CHỮA'
              : reportType === 'stationery'
              ? 'VĂN PHÒNG PHẨM'
              : reportType === 'general'
              ? 'ĐỀ XUẤT KHÁC'
              : reportType === 'pccc'
              ? 'KIỂM TRA THIẾT BỊ PCCC'
              : 'CƠ CẤU PHÒNG BAN'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {departmentFilter !== 'all' ? `Phòng ban: ${departmentFilter} • ` : ''}
            {fromDate && toDate
              ? `Từ ngày ${formatDate(fromDate)} đến ngày ${formatDate(toDate)}`
              : fromDate
              ? `Từ ngày ${formatDate(fromDate)}`
              : toDate
              ? `Đến ngày ${formatDate(toDate)}`
              : 'Tất cả thời gian'}
          </p>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto">
          {/* LEAVE REPORT TABLE */}
          {reportType === 'leave' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã đơn</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Loại nghỉ</th>
                  <th className="p-2 border">Thời gian nghỉ</th>
                  <th className="p-2 border text-center">Số ngày</th>
                  <th className="p-2 border">Lý do</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu nghỉ phép phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{l.id}</td>
                      <td className="p-2 border text-center font-mono">{l.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {l.employeeName}
                      </td>
                      <td className="p-2 border">{l.department}</td>
                      <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</td>
                      <td className="p-2 border text-center font-medium">
                        {formatDate(l.fromDate)} – {formatDate(l.toDate)}
                      </td>
                      <td className="p-2 border text-center font-bold text-rose-600">
                        {l.totalDays}
                      </td>
                      <td className="p-2 border max-w-xs truncate text-slate-700 dark:text-slate-300" title={l.reason}>
                        {l.reason || ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : l.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : l.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {l.status === 'approved'
                            ? 'Đã duyệt'
                            : l.status === 'pending'
                            ? 'Chờ duyệt'
                            : l.status === 'rejected'
                            ? 'Từ chối'
                            : 'Đã hủy'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* ATTENDANCE REPORT TABLE */}
          {reportType === 'attendance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Lý do</th>
                  <th className="p-2 border">Ngày</th>
                  <th className="p-2 border">Ca làm việc</th>
                  <th className="p-2 border">Giờ vào thực tế</th>
                  <th className="p-2 border">Giờ ra thực tế</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu xác nhận công phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredAttendances.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{a.id}</td>
                      <td className="p-2 border text-center font-mono">{a.employeeId}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {a.employeeName}
                      </td>
                      <td className="p-2 border">{a.department}</td>
                      <td className="p-2 border">{ISSUE_TYPE_LABELS[a.issueType]?.text || a.issueType}</td>
                      <td className="p-2 border text-center font-medium">{formatDate(a.date)}</td>
                      <td className="p-2 border text-center font-medium text-slate-700 dark:text-slate-300">
                        {a.shift}
                      </td>
                      <td className="p-2 border text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {a.actualCheckIn || ''}
                      </td>
                      <td className="p-2 border text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {a.actualCheckOut || ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : a.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {a.status === 'approved'
                            ? 'Đã duyệt'
                            : a.status === 'pending'
                            ? 'Chờ duyệt'
                            : 'Từ chối'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* GATE PASS REPORT TABLE */}
          {reportType === 'gate_pass' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Nhân viên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Mục đích</th>
                  <th className="p-2 border">Tài sản mang theo</th>
                  <th className="p-2 border">Ca làm việc</th>
                  <th className="p-2 border">Giờ ra thực tế</th>
                  <th className="p-2 border">Giờ vào thực tế</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredGatePasses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu ra vào cổng phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredGatePasses.map((gp) => (
                    <tr key={gp.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border text-center font-mono font-bold text-blue-600">{gp.id}</td>
                      <td className="p-2 border font-semibold text-slate-900 dark:text-white">
                        {gp.employeeName} ({gp.employeeId})
                      </td>
                      <td className="p-2 border">{gp.department}</td>
                      <td className="p-2 border">{gp.purpose}</td>
                      <td className="p-2 border">
                        {gp.hasAssets && gp.assets && gp.assets.length > 0 ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {gp.assets.map((a) => `${a.name} (${a.quantity})`).join(', ')}
                          </span>
                        ) : null}
                      </td>
                      <td className="p-2 border text-center font-medium text-slate-700 dark:text-slate-300">
                        {gp.shift || ''}
                      </td>
                      <td className="p-2 border text-center">
                        {gp.actualDepartureTime
                          ? formatDateTime(gp.actualDepartureTime)
                          : gp.timeType === 'nghi_dau_gio'
                          ? ''
                          : gp.estimatedDepartureTime && gp.status === 'approved'
                          ? `Dự kiến ${formatDateTime(gp.estimatedDepartureTime)}`
                          : ''}
                      </td>
                      <td className="p-2 border text-center">
                        {gp.timeType === 'nghi_cuoi_gio'
                          ? ''
                          : gp.actualReturnTime
                          ? formatDateTime(gp.actualReturnTime)
                          : gp.estimatedReturnTime && gp.status === 'approved'
                          ? `Dự kiến ${formatDateTime(gp.estimatedReturnTime)}`
                          : ''}
                      </td>
                      <td className="p-2 border text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            gp.status === 'approved'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : gp.status === 'departed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : gp.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : gp.status === 'pending'
                              ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {gp.status === 'approved'
                            ? 'Đã duyệt'
                            : gp.status === 'departed'
                            ? 'Đang ra ngoài'
                            : gp.status === 'completed'
                            ? 'Hoàn tất'
                            : gp.status === 'pending'
                            ? 'Chờ duyệt'
                            : gp.status === 'rejected'
                            ? 'Từ chối'
                            : 'Hết hạn'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* MEAL CUT REPORT TABLE */}
          {reportType === 'meal_cut' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã đơn</th>
                  <th className="p-2 border">Mã NV</th>
                  <th className="p-2 border">Họ và tên</th>
                  <th className="p-2 border">Phòng ban</th>
                  <th className="p-2 border">Loại nghỉ</th>
                  <th className="p-2 border">Thời gian nghỉ</th>
                  <th className="p-2 border text-center">Số ngày cắt cơm</th>
                  <th className="p-2 border">NV Kinh tế xác nhận</th>
                  <th className="p-2 border">Thời gian xác nhận</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredMealCutLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Chưa có nhân viên nào được xác nhận cắt cơm phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredMealCutLeaves.map((l, idx) => {
                    const ecoStep = l.steps.find((s) => s.roleRequired === 'economic');
                    return (
                      <tr key={l.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-blue-600">{l.id}</td>
                        <td className="p-2 border font-mono">{l.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">
                          {l.employeeName}
                        </td>
                        <td className="p-2 border">{l.department}</td>
                        <td className="p-2 border">{LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType}</td>
                        <td className="p-2 border font-semibold text-slate-800 dark:text-slate-200">
                          {formatDate(l.fromDate)} &rarr; {formatDate(l.toDate)}
                        </td>
                        <td className="p-2 border text-center font-bold text-rose-600">
                          {l.totalDays} ngày
                        </td>
                        <td className="p-2 border font-medium text-emerald-700 dark:text-emerald-400">
                          {ecoStep?.approverName || 'Nhân viên kinh tế'}
                        </td>
                        <td className="p-2 border text-[11px] text-slate-500">
                          {ecoStep?.actionAt ? formatDateTime(ecoStep.actionAt) : 'Đã xác nhận'}
                        </td>
                        <td className="p-2 border">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đã cắt cơm
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* REPAIR PROPOSALS REPORT TABLE */}
          {reportType === 'repair' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Thời gian gửi</th>
                  <th className="p-2 border">MSNV</th>
                  <th className="p-2 border">Họ tên nhân viên</th>
                  <th className="p-2 border">Tổ / Bộ phận</th>
                  <th className="p-2 border">Khu vực thiết bị</th>
                  <th className="p-2 border">Tình trạng sự việc</th>
                  <th className="p-2 border">Đề xuất hướng khắc phục</th>
                  <th className="p-2 border">Trạng thái</th>
                  <th className="p-2 border">Thời gian hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Không tìm thấy đề xuất sửa chữa nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((p, idx) => {
                    const badge = REPAIR_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-amber-600">{p.id}</td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="p-2 border font-mono text-slate-700 dark:text-slate-300">{p.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">
                          {p.employeeName}
                        </td>
                        <td className="p-2 border">{p.department}</td>
                        <td className="p-2 border font-medium text-slate-800 dark:text-slate-200">{p.location}</td>
                        <td className="p-2 border max-w-xs whitespace-pre-line" title={p.issueDescription}>
                          {p.issueDescription}
                        </td>
                        <td className="p-2 border max-w-xs whitespace-pre-line text-slate-700 dark:text-slate-300" title={p.proposedSolution || p.managerComment || ''}>
                          {p.proposedSolution || p.managerComment || '-'}
                        </td>
                        <td className="p-2 border">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {p.creatorConfirmedAt ? formatDateTime(p.creatorConfirmedAt) : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* STATIONERY REPORT TABLE */}
          {reportType === 'stationery' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center w-12">STT</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Mã phiếu</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Thời gian gửi</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">MSNV</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Họ tên nhân viên</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Tổ / Bộ phận</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Mã VPP</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Tên văn phòng phẩm</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Số lượng duyệt</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center">Trạng thái</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600 text-center w-24">Ký nhận</th>
                  <th className="p-2 border border-slate-300 dark:border-slate-600">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filteredStationeries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-400">
                      Không tìm thấy dữ liệu văn phòng phẩm nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStationeries.map((p, idx) => {
                    const badge = STATIONERY_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    const items = p.items && p.items.length > 0 ? p.items : [{ itemId: '-', itemName: '-', unit: '', quantity: 0 }];
                    const rowSpan = items.length;

                    const renderQuantityCell = (item: any) => {
                      if (p.status === 'rejected') {
                        return <span className="text-rose-500 font-semibold italic text-[11px]">Từ chối</span>;
                      }
                      if (p.status === 'pending_hr' || p.status === 'pending_manager') {
                        return (
                          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px] italic">
                            Chờ duyệt ({item.quantity} {item.unit || ''})
                          </span>
                        );
                      }
                      const finalQty = item.approvedQuantity !== undefined ? item.approvedQuantity : item.quantity;
                      const hasDiff = item.approvedQuantity !== undefined && item.approvedQuantity !== item.quantity;
                      return (
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {finalQty} {item.unit || ''}
                          </span>
                          {hasDiff && (
                            <span className="text-[10px] text-slate-400 font-normal italic">
                              (Đề xuất: {item.quantity})
                            </span>
                          )}
                        </div>
                      );
                    };

                    return (
                      <React.Fragment key={p.id}>
                        {/* First Item Row with merged common cells */}
                        <tr className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-500 align-middle">
                            {idx + 1}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-blue-600 text-center align-middle whitespace-nowrap">
                            {p.id}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-[11px] text-center text-slate-600 dark:text-slate-300 whitespace-nowrap align-middle">
                            {formatDateTime(p.createdAt)}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-mono text-center text-slate-700 dark:text-slate-300 align-middle">
                            {p.employeeId}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white align-middle">
                            {p.employeeName}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 align-middle">
                            {p.department}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                            {items[0].itemId}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                            {items[0].itemName}
                          </td>
                          <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {renderQuantityCell(items[0])}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block whitespace-nowrap ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-center align-middle">
                            {/* Ký nhận bàn giao thực tế */}
                          </td>
                          <td rowSpan={rowSpan} className="p-2 border border-slate-300 dark:border-slate-700 text-slate-500 italic max-w-xs align-middle" title={p.notes || ''}>
                            {p.notes || ''}
                          </td>
                        </tr>

                        {/* Subsequent Item Rows (only columns 7, 8, 9) */}
                        {items.slice(1).map((item, itemIdx) => (
                          <tr key={`${p.id}-item-${itemIdx + 1}`} className="border-b border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                              {item.itemId}
                            </td>
                            <td className="p-2 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-white">
                              {item.itemName}
                            </td>
                            <td className="p-2 border border-slate-300 dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {renderQuantityCell(item)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* GENERAL REPORT TABLE */}
          {reportType === 'general' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border text-center w-12">STT</th>
                  <th className="p-2 border">Mã phiếu</th>
                  <th className="p-2 border">Thời gian gửi</th>
                  <th className="p-2 border">MSNV</th>
                  <th className="p-2 border">Họ tên nhân viên</th>
                  <th className="p-2 border">Tổ / Bộ phận</th>
                  <th className="p-2 border">Bộ phận tiếp nhận</th>
                  <th className="p-2 border">Tiêu đề đề xuất</th>
                  <th className="p-2 border">Nội dung chi tiết</th>
                  <th className="p-2 border">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredGenerals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Không tìm thấy đề xuất khác nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredGenerals.map((p, idx) => {
                    const badge = GENERAL_STATUS_BADGES[p.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-700',
                      border: 'border-slate-200',
                      label: p.status,
                    };
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-bold text-purple-600">{p.id}</td>
                        <td className="p-2 border text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="p-2 border font-mono text-slate-700 dark:text-slate-300">{p.employeeId}</td>
                        <td className="p-2 border font-bold text-slate-900 dark:text-white">{p.employeeName}</td>
                        <td className="p-2 border">{p.department}</td>
                        <td className="p-2 border text-purple-700 dark:text-purple-300 font-medium">
                          {p.receiverUserName ? `${p.receiverUserName} (${p.receiverDepartment})` : p.receiverDepartment}
                        </td>
                        <td className="p-2 border font-semibold text-slate-900 dark:text-white max-w-xs truncate" title={p.title}>
                          {p.title}
                        </td>
                        <td className="p-2 border max-w-xs whitespace-pre-line text-slate-700 dark:text-slate-300" title={p.content}>
                          {p.content}
                        </td>
                        <td className="p-2 border">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}


          {/* PCCC REPORT TABLE - Thu nhỏ cột hiển thị trọn vẹn trong trang */}
          {reportType === 'pccc' && (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-[10.5px] leading-tight">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold uppercase text-[9.5px] text-slate-700 dark:text-slate-300">
                    <th className="px-1.5 py-1.5 border text-center w-8 whitespace-nowrap">STT</th>
                    <th className="px-1.5 py-1.5 border text-center w-22 whitespace-nowrap">Mã TB</th>
                    <th className="px-2 py-1.5 border min-w-[125px]">Tên thiết bị</th>
                    <th className="px-1.5 py-1.5 border text-center w-20 whitespace-nowrap">Chủng loại</th>
                    <th className="px-2 py-1.5 border min-w-[125px]">Vị trí đặt</th>
                    <th className="px-1.5 py-1.5 border text-center w-20 whitespace-nowrap">Hạn KĐ</th>
                    <th className="px-1.5 py-1.5 border text-center w-24 whitespace-nowrap">Thời gian KT</th>
                    <th className="px-1.5 py-1.5 border text-center w-28 whitespace-nowrap">Người kiểm tra</th>
                    <th className="px-2 py-1.5 border min-w-[160px]">Chi tiết kiểm tra</th>
                    <th className="px-1.5 py-1.5 border text-center w-16 whitespace-nowrap">Đánh giá</th>
                    <th className="px-1.5 py-1.5 border min-w-[70px]">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPCCCDevices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        Không tìm thấy thiết bị PCCC nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredPCCCDevices.map((d, idx) => {
                      const catInfo = PCCC_CATEGORIES[d.category];
                      const insp = pcccInspections.find((i) => i.deviceId.toLowerCase() === d.id.toLowerCase());
                      const isInspected = Boolean(insp && insp.checklist && formatPCCCChecklistSummary(insp) !== 'Chưa kiểm tra');
                      const details = formatPCCCChecklistSummary(insp);
                      const isPass = insp ? insp.overallResult === 'pass' : d.lastInspection?.status === 'pass';
                      const inspDate = insp?.inspectedAt || (isInspected ? d.lastInspection?.date : '') || '-';
                      const inspectorName = insp
                        ? `${insp.inspectorName} (${insp.inspectorId})`
                        : isInspected && d.lastInspection
                        ? `${d.lastInspection.inspectorName} (${d.lastInspection.inspectorId})`
                        : '-';
                      const noteText = insp?.notes || d.lastInspection?.notes || d.notes || '-';

                      return (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-1.5 py-1 border text-center font-bold text-slate-500 whitespace-nowrap">{idx + 1}</td>
                          <td className="px-1.5 py-1 border font-mono font-bold text-red-600 text-center whitespace-nowrap">{d.id}</td>
                          <td className="px-2 py-1 border font-semibold text-slate-900 dark:text-white leading-tight">{d.name}</td>
                          <td className="px-1.5 py-1 border text-center whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 border whitespace-nowrap inline-block">
                              {catInfo?.name || d.category}
                            </span>
                          </td>
                          <td className="px-2 py-1 border leading-tight text-slate-700 dark:text-slate-300">{d.location}</td>
                          <td className="px-1.5 py-1 border text-center whitespace-nowrap font-mono text-[10px]">{formatPCCCDate(d.inspectionExpiry)}</td>
                          <td className="px-1.5 py-1 border text-center text-[10px] whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                            {inspDate}
                          </td>
                          <td className="px-1.5 py-1 border text-center whitespace-nowrap text-[10px]">
                            {inspectorName}
                          </td>
                          <td className="px-2 py-1.5 border text-[10px] text-slate-700 dark:text-slate-300 min-w-[160px] leading-normal">
                            {details === 'Chưa kiểm tra' ? (
                              <span className="text-slate-400 italic">Chưa kiểm tra</span>
                            ) : (
                              <div className="space-y-1">
                                {details.split(';').map((line, lIdx) => {
                                  const trimmed = line.trim();
                                  if (!trimmed) return null;
                                  return (
                                    <div key={lIdx} className="leading-tight whitespace-nowrap">
                                      {trimmed}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-1.5 py-1 border text-center whitespace-nowrap">
                            {isInspected ? (
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap inline-block ${
                                  isPass
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {isPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap inline-block">
                                CHƯA KT
                              </span>
                            )}
                          </td>
                          <td className="px-1.5 py-1 border text-[10px] text-slate-500 italic max-w-[100px] truncate" title={noteText !== '-' ? noteText : ''}>
                            {noteText}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* DEPARTMENTS REPORT TABLE */}
          {reportType === 'departments' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                  <th className="p-2 border">Mã phòng ban</th>
                  <th className="p-2 border">Tên phòng ban</th>
                  <th className="p-2 border">Mô tả chức năng</th>
                  <th className="p-2 border">Trưởng bộ phận</th>
                  <th className="p-2 border">Số nhân sự</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Không tìm thấy phòng ban phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border font-mono font-bold text-blue-600">{d.code}</td>
                      <td className="p-2 border font-bold">{d.name}</td>
                      <td className="p-2 border">{d.description || '-'}</td>
                      <td className="p-2 border">{d.managerName || 'Chưa chỉ định'}</td>
                      <td className="p-2 border font-bold">
                        {users.filter((u) => u.department === d.name).length} người
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Factory Signatures block for PCCC & Periodic Inspection */}
        {(reportType === 'pccc' || reportType === 'periodic_inspection') && (
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs">
            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">NGƯỜI LẬP BÁO CÁO</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">CÁN BỘ AN TOÀN HSE</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">TRƯỞNG PHÒNG CƠ ĐIỆN</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên)</div>
            </div>

            <div className="space-y-12">
              <div className="font-bold uppercase text-slate-900 dark:text-white">BAN GIÁM ĐỐC DUYỆT</div>
              <div className="text-[11px] text-slate-400 italic">(Ký, đóng dấu)</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
