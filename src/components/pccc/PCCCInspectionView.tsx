'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isSuperAdminOrBOD } from '@/lib/permissions';
import { storage } from '@/lib/storage';
import {
  PCCCCategory,
  PCCCDevice,
  PCCCInspection,
  PCCC_CATEGORIES,
  formatPCCCDate,
} from '@/types/pccc';
import { PCCCInspectionModal } from './PCCCInspectionModal';
import { PCCCQrScannerModal } from './PCCCQrScannerModal';
import { PCCCQrCodeModal } from './PCCCQrCodeModal';
import { PCCCDeviceModal } from './PCCCDeviceModal';
import { PCCCImportExcelModal } from './PCCCImportExcelModal';
import { exportPCCCReportToExcel, downloadPCCCDevicesTemplate } from '@/lib/excel';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flame,
  Snowflake,
  Bell,
  Box,
  Cog,
  Monitor,
  Search,
  RotateCcw,
  QrCode,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Check,
  Edit2,
  Trash2,
  Layers,
  Building2,
  ArrowRight,
  History,
  MapPin,
} from 'lucide-react';

export function PCCCInspectionView() {
  const { currentUser } = useAuth();
  const isAdmin =
    isSuperAdminOrBOD(currentUser) ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'ehs' ||
    currentUser?.role === 'manager' ||
    (Boolean(currentUser?.department) && /hcns|nhân sự|cơ điện|bảo trì|an toàn|ehs|pccc/i.test(currentUser!.department));

  const [devices, setDevices] = useState<PCCCDevice[]>([]);
  const [inspections, setInspections] = useState<PCCCInspection[]>([]);

  // 2 Sub-tabs: 'dashboard' | 'devices' (Bỏ mục Nhật Ký & Báo Cáo theo yêu cầu)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'devices'>('dashboard');

  // Filters for Dashboard/Devices
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardRightTab, setDashboardRightTab] = useState<'inspections' | 'areas'>('inspections');

  // Modals state
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [preSelectedDevice, setPreSelectedDevice] = useState<PCCCDevice | null>(null);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [selectedDeviceForQr, setSelectedDeviceForQr] = useState<PCCCDevice | null>(null);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<PCCCDevice | null>(null);

  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);
  const [importInitialMode, setImportInitialMode] = useState<'update_new' | 'replace_all'>('update_new');

  // Load data
  const loadData = () => {
    const devList = storage.getPCCCDevices();
    const inspList = storage.getPCCCInspections();
    setDevices(devList);
    setInspections(inspList);
  };

  useEffect(() => {
    loadData();

    // Listen to storage sync events
    const handleStorageChange = () => {
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);

    // Check if URL has ?pccc=HT-xxx
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pcccParam = urlParams.get('pccc');
      if (pcccParam) {
        const devList = storage.getPCCCDevices();
        const found = devList.find(
          (d) => d.id.toUpperCase() === pcccParam.toUpperCase()
        );
        if (found) {
          setPreSelectedDevice(found);
          setIsInspectionModalOpen(true);
        }
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Compute Metrics
  const totalCount = devices.length;
  const passCount = devices.filter((d) => d.lastInspection?.status === 'pass').length;
  const failCount = devices.filter((d) => d.lastInspection?.status === 'fail').length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 100;

  // Check expiring within 30 days or expired
  const expiringCount = useMemo(() => {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return devices.filter((d) => {
      if (!d.inspectionExpiry) return false;
      const parts = d.inspectionExpiry.split('/');
      if (parts.length === 3) {
        const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        return expDate <= in30Days;
      }
      return false;
    }).length;
  }, [devices]);

  // Counts by category
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      binh_bot: 0,
      binh_co2: 0,
      nut_chuong: 0,
      tu_voi_vach: 0,
      tram_bom: 0,
      tu_trung_tam: 0,
    };
    devices.forEach((d) => {
      if (counts[d.category] !== undefined) {
        counts[d.category]++;
      }
    });
    return counts;
  }, [devices]);

  // Dynamic Donut chart categories data
  const categoriesList = useMemo(() => {
    const configs = [
      { key: 'binh_co2', name: 'Bình CO2 (MT3)', count: countByCategory.binh_co2 || 0, color: '#0284c7', dot: 'bg-sky-500', text: 'text-sky-600' },
      { key: 'binh_bot', name: 'Bình Bột (MFZ)', count: countByCategory.binh_bot || 0, color: '#e11d48', dot: 'bg-rose-500', text: 'text-rose-600' },
      { key: 'tu_voi_vach', name: 'Tủ Vòi Vách Tường', count: countByCategory.tu_voi_vach || 0, color: '#ef4444', dot: 'bg-red-500', text: 'text-red-500' },
      { key: 'nut_chuong', name: 'Báo Cháy (Nút & Chuông)', count: countByCategory.nut_chuong || 0, color: '#f59e0b', dot: 'bg-amber-500', text: 'text-amber-600' },
      { key: 'tram_bom', name: 'Trạm Bơm', count: countByCategory.tram_bom || 0, color: '#475569', dot: 'bg-slate-600', text: 'text-slate-600 dark:text-slate-300' },
      { key: 'tu_trung_tam', name: 'Tủ Trung Tâm', count: countByCategory.tu_trung_tam || 0, color: '#1d4ed8', dot: 'bg-blue-700', text: 'text-blue-700 dark:text-blue-400' },
    ];

    const circumference = 339.292; // 2 * PI * 54
    let currentOffset = 0;

    return configs.map((cat) => {
      const percent = totalCount > 0 ? cat.count / totalCount : 0;
      const strokeDash = percent * circumference;
      const offset = currentOffset;
      currentOffset += strokeDash;
      return {
        ...cat,
        percent: (percent * 100).toFixed(1),
        strokeDasharray: `${strokeDash.toFixed(1)} ${circumference}`,
        strokeDashoffset: (-offset).toFixed(1),
      };
    });
  }, [countByCategory, totalCount]);

  // 5 latest inspection records
  const recentInspections = useMemo(() => {
    return inspections.slice(0, 5);
  }, [inspections]);

  // Area distribution breakdown
  const areaBreakdown = useMemo(() => {
    const areas: Record<string, number> = {
      'PX. Hoàn Thiện (PXHT)': 0,
      'Kho Hàng & Nguyên Liệu': 0,
      'Văn Phòng Điều Hành': 0,
      'Nhà Xe & Phụ Trợ': 0,
      'Phân Xưởng Dệt': 0,
      'Trạm Bơm & Cổng BV': 0,
    };
    devices.forEach((d) => {
      const loc = (d.location || '').toUpperCase();
      if (loc.includes('PXHT') || loc.includes('HOÀN THIỆN') || loc.includes('ĐÓNG KIỆN') || loc.includes('ỦI') || loc.includes('KIỂM PHẨM')) {
        areas['PX. Hoàn Thiện (PXHT)']++;
      } else if (loc.includes('KHO') || loc.includes('NGUYÊN LIỆU') || loc.includes('PHỤ LIỆU') || loc.includes('THÀNH PHẨM')) {
        areas['Kho Hàng & Nguyên Liệu']++;
      } else if (loc.includes('VĂN PHÒNG') || loc.includes('VP') || loc.includes('ĐIỀU HÀNH') || loc.includes('GIÁM ĐỐC') || loc.includes('KẾ TOÁN') || loc.includes('HCNS') || loc.includes('IT')) {
        areas['Văn Phòng Điều Hành']++;
      } else if (loc.includes('NHÀ XE') || loc.includes('XE NÂNG') || loc.includes('LÒ HƠI') || loc.includes('NƯỚC THẢI')) {
        areas['Nhà Xe & Phụ Trợ']++;
      } else if (loc.includes('DỆT') || loc.includes('MAY') || loc.includes('CẮT') || loc.includes('RẬP')) {
        areas['Phân Xưởng Dệt']++;
      } else {
        areas['Trạm Bơm & Cổng BV']++;
      }
    });
    return Object.entries(areas).map(([name, count]) => ({
      name,
      count,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    }));
  }, [devices, totalCount]);

  // Smooth scroll to table helper
  const scrollToTable = () => {
    setTimeout(() => {
      const el = document.getElementById('pccc-device-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (statusFilter === 'pass' && d.lastInspection?.status !== 'pass') return false;
      if (statusFilter === 'fail' && d.lastInspection?.status !== 'fail') return false;
      if (statusFilter === 'none' && d.lastInspection) return false;
      if (statusFilter === 'expiring') {
        if (!d.inspectionExpiry) return false;
        const parts = d.inspectionExpiry.split('/');
        if (parts.length === 3) {
          const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          const now = new Date();
          const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          if (expDate > in30Days) return false;
        } else {
          return false;
        }
      }

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
  }, [devices, categoryFilter, statusFilter, searchTerm]);

  // Handle open inspection modal for a specific device
  const handleInspectDevice = (d: PCCCDevice) => {
    setPreSelectedDevice(d);
    setIsInspectionModalOpen(true);
  };

  // Handle device detected by QR Scanner
  const handleDeviceDetectedFromQR = (d: PCCCDevice) => {
    setPreSelectedDevice(d);
    setIsInspectionModalOpen(true);
  };

  // Delete a device from Master Data
  const handleDeleteDevice = (d: PCCCDevice) => {
    if (!isAdmin) {
      alert('Chỉ Quản trị viên hoặc Cán bộ HSE mới có quyền xóa thiết bị khỏi hệ thống.');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa thiết bị "${d.id} - ${d.name}" khỏi danh mục không?`)) {
      const remaining = devices.filter((item) => item.id !== d.id);
      storage.savePCCCDevices(remaining);
      loadData();
    }
  };

  // Handle Export Excel
  const handleExportExcel = () => {
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportPCCCReportToExcel({
      devices: filteredDevices,
      inspections,
      subtitle:
        categoryFilter !== 'all'
          ? `Chủng loại: ${PCCC_CATEGORIES[categoryFilter as PCCCCategory]?.name || categoryFilter}`
          : 'Tất cả 111 thiết bị PCCC',
      docCode: 'BC-LK-PCCC/2026',
      fileName: `LONGKHAI_Bao_Cao_PCCC_${nowStr}`,
    });
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Top Header & Mobile Responsive Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 no-print">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="p-1.5 sm:p-2 rounded-xl bg-red-600 text-white shadow-xs shrink-0">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
              Kiểm Tra & Quản Lý Thiết Bị PCCC
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống giám sát định kỳ 111 thiết bị PCCC, checklist tiêu chuẩn & quét mã QR tại hiện trường
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar - Thu nhỏ kích thước tinh gọn */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Quét QR</span>
          </button>

          <button
            onClick={() => {
              setPreSelectedDevice(null);
              setIsInspectionModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kiểm tra mới</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-2.5 sm:px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">In báo cáo</span>
          </button>
        </div>
      </div>

      {/* 2 Sub-Navigation Tabs (Đã bỏ tab 'Nhật Ký & Báo Cáo' theo Hình 3) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1.5 overflow-x-auto no-scrollbar no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Dashboard & Giám Sát</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'devices'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Danh Sách Thiết Bị PCCC ({devices.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: DASHBOARD & GIÁM SÁT (TINH GỌN & HIỆN ĐẠI) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* 4 Thẻ KPI Căn Bản Nhất */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Tổng thiết bị */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
                setActiveTab('devices');
              }}
              className="p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tổng thiết bị
                </span>
                <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                  <Shield className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">
                  {totalCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">thiết bị</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                <span>100% gắn mã QR tra cứu</span>
              </div>
            </button>

            {/* 2. Đạt tiêu chuẩn */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('pass');
                setCategoryFilter('all');
                setActiveTab('devices');
              }}
              className="p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Đạt tiêu chuẩn
                </span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                  {passCount}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  {passRate}%
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Sẵn sàng vận hành</span>
              </div>
            </button>

            {/* 3. Cần xử lý / Hỏng */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('fail');
                setCategoryFilter('all');
                setActiveTab('devices');
              }}
              className="p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${failCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                  Cần xử lý / Hỏng
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${failCount > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black font-mono leading-none ${failCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {failCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">thiết bị</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                <span>{failCount > 0 ? 'Cần bảo dưỡng / sửa chữa' : 'Không có sự cố'}</span>
              </div>
            </button>

            {/* 4. Hết hạn / Sắp hạn */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('expiring');
                setCategoryFilter('all');
                setActiveTab('devices');
              }}
              className="p-3.5 sm:p-4 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${expiringCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                  Hết hạn / Sắp hạn
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${expiringCount > 0 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={`text-2xl sm:text-3xl font-black font-mono leading-none ${expiringCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {expiringCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">trong 30 ngày</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                <span>{expiringCount > 0 ? 'Đến kỳ kiểm định' : 'Hạn kiểm định an toàn'}</span>
              </div>
            </button>
          </div>

          {/* 2 Khối Thông Tin Căn Bản Nhất: Cơ cấu 6 Chủng Loại & Hoạt Động Giám Sát */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Khối Trái (7 phần): Cơ cấu 6 chủng loại thiết bị PCCC */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        Cơ Cấu 6 Chủng Loại Thiết Bị PCCC
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {totalCount} thiết bị được phân loại theo tiêu chuẩn an toàn PCCC
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-block">
                    {passRate}% Đạt chuẩn
                  </span>
                </div>

                {/* Donut Chart + Category List */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-1">
                  {/* SVG Donut Chart */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
                    <div className="relative w-36 h-36 sm:w-40 sm:h-40">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                        {/* Circle Background */}
                        <circle
                          cx="70"
                          cy="70"
                          r="54"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="16"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        {/* Dynamic Category Slices */}
                        {categoriesList.map((cat) => {
                          if (cat.count === 0) return null;
                          return (
                            <circle
                              key={cat.key}
                              cx="70"
                              cy="70"
                              r="54"
                              fill="transparent"
                              stroke={cat.color}
                              strokeWidth="16"
                              strokeDasharray={cat.strokeDasharray}
                              strokeDashoffset={cat.strokeDashoffset}
                              className="transition-all duration-500 hover:opacity-85"
                            />
                          );
                        })}
                      </svg>

                      {/* Center Number */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                          {totalCount}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          Thiết bị
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Category Items List */}
                  <div className="sm:col-span-7 grid grid-cols-1 gap-2">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat.key);
                          setActiveTab('devices');
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cat.dot}`}></span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{cat.count} TB</span>
                          <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            {cat.percent}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Bấm vào chủng loại để lọc danh mục</span>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setActiveTab('devices');
                  }}
                  className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả danh mục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Khối Phải (5 phần): Nhật Ký Kiểm Tra Gần Đây & Phân Bố Khu Vực */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                {/* Header with Sub-Tabs */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                      {dashboardRightTab === 'inspections' ? (
                        <History className="w-4 h-4" />
                      ) : (
                        <Building2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {dashboardRightTab === 'inspections' ? 'Nhật Ký Kiểm Tra Gần Đây' : 'Phân Bố Theo Khu Vực'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {dashboardRightTab === 'inspections'
                          ? `${recentInspections.length} lượt kiểm tra ghi nhận mới nhất`
                          : 'Mật độ bố trí thiết bị toàn nhà máy'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Sub-Tabs */}
                  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDashboardRightTab('inspections')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        dashboardRightTab === 'inspections'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Kiểm tra
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashboardRightTab('areas')}
                      className={`px-2 py-1 rounded-md transition-all ${
                        dashboardRightTab === 'areas'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Khu vực
                    </button>
                  </div>
                </div>

                {/* Content: Recent Inspections */}
                {dashboardRightTab === 'inspections' && (
                  <div className="space-y-2">
                    {recentInspections.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">Chưa có lượt kiểm tra nào được ghi nhận.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPreSelectedDevice(null);
                            setIsInspectionModalOpen(true);
                          }}
                          className="mt-2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          + Bắt đầu kiểm tra thiết bị ngay
                        </button>
                      </div>
                    ) : (
                      recentInspections.map((insp) => {
                        const isPass = insp.overallResult === 'pass';
                        return (
                          <div
                            key={insp.id}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-red-600">
                                  {insp.deviceId}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                                  {insp.deviceName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 truncate">
                                <span>{insp.inspectorName}</span>
                                <span>•</span>
                                <span className="font-mono">{insp.inspectedAt ? insp.inspectedAt.slice(0, 16) : '-'}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
                              }`}
                            >
                              {isPass ? 'ĐẠT' : 'CẦN XỬ LÝ'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Content: Area Breakdown */}
                {dashboardRightTab === 'areas' && (
                  <div className="space-y-2.5 py-1">
                    {areaBreakdown.map((area, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                            {area.name}
                          </span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                            {area.count} TB ({area.percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(area.percent, 3)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Dữ liệu thực tế giám sát PCCC</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('devices')}
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Mở bảng danh mục</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DANH SÁCH THIẾT BỊ PCCC (QUẢN TRỊ MASTER DATA & BULK EXCEL) */}
      {activeTab === 'devices' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 p-3.5 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                DANH MỤC THIẾT BỊ PCCC TOÀN NHÀ MÁY
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý thông tin {devices.length} thiết bị PCCC, vị trí đặt, chuẩn định mức và tải file Excel mẫu
              </p>
            </div>

            {/* Admin Management Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => downloadPCCCDevicesTemplate()}
                className="px-2.5 sm:px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-[11px] rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file Excel mẫu</span>
              </button>

              {/* Group tải lên từ file Excel gồm 2 mục: Cập nhật mới & Thay thế toàn bộ */}
              <div className="inline-flex items-center rounded-lg shadow-xs overflow-hidden border border-emerald-600/30">
                <button
                  type="button"
                  onClick={() => {
                    setImportInitialMode('update_new');
                    setIsImportExcelModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Thêm vào danh sách những thiết bị chưa có trên hệ thống từ file Excel"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cập nhật mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportInitialMode('replace_all');
                    setIsImportExcelModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] border-l border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Xóa toàn bộ danh sách hiện có trên hệ thống và thay bằng danh sách mới từ file Excel"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thay thế toàn bộ</span>
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDeviceToEdit(null);
                    setIsDeviceModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thiết bị mới</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedDeviceForQr(null);
                  setIsQrCodeModalOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In tất cả tem QR</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="relative flex-1 sm:flex-initial min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã, tên, vị trí, chuẩn KT..."
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
            >
              <option value="all">Tất cả chủng loại ({devices.length})</option>
              <option value="binh_bot">Bình Bột ({countByCategory.binh_bot})</option>
              <option value="binh_co2">Bình CO2 ({countByCategory.binh_co2})</option>
              <option value="nut_chuong">Báo Cháy ({countByCategory.nut_chuong})</option>
              <option value="tu_voi_vach">Tủ Vách Tường ({countByCategory.tu_voi_vach})</option>
              <option value="tram_bom">Trạm Bơm ({countByCategory.tram_bom})</option>
              <option value="tu_trung_tam">Tủ Trung Tâm ({countByCategory.tu_trung_tam})</option>
            </select>

            <span className="text-slate-500 text-[11px] font-medium ml-auto">
              Hiển thị <strong className="text-slate-900 dark:text-white">{filteredDevices.length}</strong> / {devices.length} thiết bị
            </span>
          </div>

          {/* Master Devices Table - Co dãn tối ưu */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[1080px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] sm:text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 pl-4 w-32 min-w-[120px] whitespace-nowrap">MÃ THIẾT BỊ</th>
                  <th className="py-2.5 px-3 min-w-[220px]">TÊN THIẾT BỊ</th>
                  <th className="py-2.5 px-3 w-28 min-w-[110px] text-center whitespace-nowrap">CHỦNG LOẠI</th>
                  <th className="py-2.5 px-3 min-w-[180px]">VỊ TRÍ ĐẶT</th>
                  <th className="py-2.5 px-3 w-28 min-w-[105px] text-center whitespace-nowrap">CHUẨN KỸ THUẬT</th>
                  <th className="py-2.5 px-3 w-28 min-w-[105px] text-center whitespace-nowrap">HẠN KIỂM ĐỊNH</th>
                  <th className="py-2.5 px-3 min-w-[140px]">GHI CHÚ</th>
                  <th className="py-2.5 px-3 w-32 min-w-[110px] text-center pr-4 whitespace-nowrap">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium text-[11px] sm:text-xs">
                {filteredDevices.map((d) => {
                  const catInfo = PCCC_CATEGORIES[d.category];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 pl-4 font-mono font-bold text-red-600 whitespace-nowrap">{d.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white leading-tight">{d.name}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border whitespace-nowrap inline-block">
                          {catInfo?.name || d.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 leading-tight" title={d.location}>
                        {d.location}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">{d.specs}</td>
                      <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                        {formatPCCCDate(d.inspectionExpiry)}
                      </td>
                      <td className="py-2 px-3 text-slate-500 italic max-w-xs truncate" title={d.notes || ''}>
                        {d.notes || '-'}
                      </td>
                      <td className="py-2 px-3 pr-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeviceToEdit(d);
                                setIsDeviceModalOpen(true);
                              }}
                              title="Sửa thông tin"
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDeviceForQr(d);
                              setIsQrCodeModalOpen(true);
                            }}
                            title="Xem mã QR tem"
                            className="p-1 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(d)}
                              title="Xóa thiết bị"
                              className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALL MODALS */}
      <PCCCInspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        preSelectedDevice={preSelectedDevice}
        onSaved={() => {
          loadData();
        }}
      />

      <PCCCQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onDeviceDetected={handleDeviceDetectedFromQR}
      />

      <PCCCQrCodeModal
        isOpen={isQrCodeModalOpen}
        onClose={() => setIsQrCodeModalOpen(false)}
        devices={devices}
        activeDevice={selectedDeviceForQr}
      />

      <PCCCDeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        deviceToEdit={deviceToEdit}
        onSaved={() => {
          loadData();
        }}
      />

      <PCCCImportExcelModal
        isOpen={isImportExcelModalOpen}
        onClose={() => setIsImportExcelModalOpen(false)}
        initialMode={importInitialMode}
        onImportSuccess={(count, mode, skippedCount) => {
          loadData();
          if (mode === 'replace_all') {
            alert(`Đã thay thế toàn bộ danh mục thành công với ${count} thiết bị PCCC từ file Excel!`);
          } else {
            alert(`Đã nạp thêm thành công ${count} thiết bị mới vào hệ thống!${skippedCount ? ` (Đã bỏ qua ${skippedCount} thiết bị trùng mã)` : ''}`);
          }
        }}
      />
    </div>
  );
}
