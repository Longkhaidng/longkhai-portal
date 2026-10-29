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

      {/* SUB-TAB 1: DASHBOARD & GIÁM SÁT */}
      {activeTab === 'dashboard' && (
        <div className="space-y-3 sm:space-y-4">
          {/* TOP 4 METRICS CARDS - Có thể click lọc & chuyển thẳng đến bảng */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* Card 1: TỔNG THIẾT BỊ */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
                scrollToTable();
              }}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'all' && categoryFilter === 'all'
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-red-500 shadow-xs ring-2 ring-red-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  TỔNG THIẾT BỊ
                </span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Shield className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{totalCount}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">thiết bị</span>
              </div>
            </button>

            {/* Card 2: ĐẠT TIÊU CHUẨN */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('pass');
                scrollToTable();
              }}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'pass'
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-xs ring-2 ring-emerald-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  ĐẠT TIÊU CHUẨN
                </span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{passCount}</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {passRate}%
                </span>
              </div>
            </button>

            {/* Card 3: CẦN XỬ LÝ / HỎNG */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('fail');
                scrollToTable();
              }}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'fail'
                  ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-500 shadow-xs ring-2 ring-rose-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-600">
                  CẦN XỬ LÝ / HỎNG
                </span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono">{failCount}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">cần nạp/sửa</span>
              </div>
            </button>

            {/* Card 4: HẾT HẠN / SẮP HẠN */}
            <button
              type="button"
              onClick={() => {
                setStatusFilter('expiring');
                scrollToTable();
              }}
              className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer active:scale-95 ${
                statusFilter === 'expiring'
                  ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-500 shadow-xs ring-2 ring-amber-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-600">
                  HẾT HẠN / SẮP HẠN
                </span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">{expiringCount}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">trong 30 ngày</span>
              </div>
            </button>
          </div>

          {/* BIỂU ĐỒ MÔ TẢ THIẾT BỊ PCCC TOÀN NHÀ MÁY (Thay thế mục khung đỏ) */}
          <div className="space-y-3.5 sm:space-y-4">
            {/* GRID 2 CỘT: CƠ CẤU 6 CHỦNG LOẠI & PHÂN BỔ KHU VỰC SẢN XUẤT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
              {/* CỘT TRÁI (7 Cột): BIỂU ĐỒ DONUT & CƠ CẤU 6 CHỦNG LOẠI */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-600" />
                        <span>Biểu Đồ Cơ Cấu 6 Chủng Loại Thiết Bị PCCC</span>
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                        Tổng cộng {totalCount} thiết bị đạt tiêu chuẩn sẵn sàng vận hành 100%
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                      Đạt chuẩn 100%
                    </span>
                  </div>

                  {/* DONUT CHART + LEGEND */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    {/* SVG DONUT CHART */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center relative py-2">
                      <div className="relative w-40 h-40 sm:w-44 sm:h-44">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                          {/* Circle Background */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="18"
                            className="text-slate-100 dark:text-slate-800"
                          />
                          {/* 1. Bình CO2 (45/111 = 40.5% -> 157.8) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#0284c7"
                            strokeWidth="18"
                            strokeDasharray="157.8 389.5"
                            strokeDashoffset="0"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                          {/* 2. Bình Bột (33/111 = 29.7% -> 115.7) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#e11d48"
                            strokeWidth="18"
                            strokeDasharray="115.7 389.5"
                            strokeDashoffset="-157.8"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                          {/* 3. Tủ Vòi Vách (19/111 = 17.1% -> 66.6) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#ef4444"
                            strokeWidth="18"
                            strokeDasharray="66.6 389.5"
                            strokeDashoffset="-273.5"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                          {/* 4. Báo Cháy (12/111 = 10.8% -> 42.1) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="18"
                            strokeDasharray="42.1 389.5"
                            strokeDashoffset="-340.1"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                          {/* 5. Trạm Bơm (1/111 = 0.9% -> 3.6) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#475569"
                            strokeWidth="18"
                            strokeDasharray="3.6 389.5"
                            strokeDashoffset="-382.2"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                          {/* 6. Tủ Trung Tâm (1/111 = 0.9% -> 3.6) */}
                          <circle
                            cx="80"
                            cy="80"
                            r="62"
                            fill="transparent"
                            stroke="#1d4ed8"
                            strokeWidth="18"
                            strokeDasharray="3.6 389.5"
                            strokeDashoffset="-385.8"
                            className="transition-all duration-500 hover:opacity-85"
                          />
                        </svg>

                        {/* Center Statistics */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">
                            {totalCount}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-1">
                            Thiết bị
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE LEGEND LIST */}
                    <div className="sm:col-span-7 space-y-2">
                      {/* 1. Bình CO2 */}
                      <div
                        onClick={() => {
                          setCategoryFilter('binh_co2');
                          setActiveTab('devices');
                        }}
                        className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-sky-300 dark:hover:border-sky-700 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-sky-600 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bình CO2 (MT3)</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-black text-sky-600">{countByCategory.binh_co2} TB</span>
                          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            40.5%
                          </span>
                        </div>
                      </div>

                      {/* 2. Bình Bột */}
                      <div
                        onClick={() => {
                          setCategoryFilter('binh_bot');
                          setActiveTab('devices');
                        }}
                        className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-rose-300 dark:hover:border-rose-700 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Bình Bột (MFZ)</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-black text-rose-600">{countByCategory.binh_bot} TB</span>
                          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            29.7%
                          </span>
                        </div>
                      </div>

                      {/* 3. Tủ Vòi Vách */}
                      <div
                        onClick={() => {
                          setCategoryFilter('tu_voi_vach');
                          setActiveTab('devices');
                        }}
                        className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-red-300 dark:hover:border-red-700 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Tủ Vòi Vách Tường</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-black text-red-600">{countByCategory.tu_voi_vach} TB</span>
                          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            17.1%
                          </span>
                        </div>
                      </div>

                      {/* 4. Báo Cháy */}
                      <div
                        onClick={() => {
                          setCategoryFilter('nut_chuong');
                          setActiveTab('devices');
                        }}
                        className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Báo Cháy (Nút & Chuông)</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-xs font-black text-amber-600">{countByCategory.nut_chuong} TB</span>
                          <span className="text-[10px] text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            10.8%
                          </span>
                        </div>
                      </div>

                      {/* 5. Trạm Bơm & Tủ Trung Tâm */}
                      <div className="grid grid-cols-2 gap-2">
                        <div
                          onClick={() => {
                            setCategoryFilter('tram_bom');
                            setActiveTab('devices');
                          }}
                          className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 shrink-0"></span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">Trạm Bơm</span>
                          </div>
                          <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300 shrink-0">
                            {countByCategory.tram_bom} TB
                          </span>
                        </div>

                        <div
                          onClick={() => {
                            setCategoryFilter('tu_trung_tam');
                            setActiveTab('devices');
                          }}
                          className="p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-700 shrink-0"></span>
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">Tủ TT</span>
                          </div>
                          <span className="text-[11px] font-black font-mono text-blue-700 dark:text-blue-400 shrink-0">
                            {countByCategory.tu_trung_tam} TB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 italic">Bấm vào bất kỳ chủng loại nào để xem danh mục thiết bị</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('devices')}
                    className="font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Xem chi tiết 111 thiết bị &rarr;
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI (5 Cột): BIỂU ĐỒ PHÂN BỔ THEO 6 KHU VỰC / PHÂN XƯỞNG */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>Phân Bổ Thiết Bị Theo 6 Khu Vực Nhà Máy</span>
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                        Mật độ bố trí thiết bị phòng cháy tại các xưởng sản xuất
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      6 Khu vực
                    </span>
                  </div>

                  {/* AREA BARS BREAKDOWN */}
                  <div className="space-y-2.5">
                    {/* Area 1: PX. Hoàn Thiện */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">1. PX. Hoàn Thiện (PXHT)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">31 TB (27.9%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-sky-600 h-full" style={{ width: '45%' }} title="14 Bình CO2"></div>
                        <div className="bg-rose-600 h-full" style={{ width: '32%' }} title="10 Bình Bột"></div>
                        <div className="bg-red-500 h-full" style={{ width: '16%' }} title="5 Tủ Vòi"></div>
                        <div className="bg-amber-500 h-full" style={{ width: '7%' }} title="2 Báo Cháy"></div>
                      </div>
                    </div>

                    {/* Area 2: Kho Hàng */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">2. Kho Hàng & Nguyên Liệu (KHO)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">31 TB (27.9%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-rose-600 h-full" style={{ width: '42%' }} title="13 Bình Bột"></div>
                        <div className="bg-sky-600 h-full" style={{ width: '29%' }} title="9 Bình CO2"></div>
                        <div className="bg-red-500 h-full" style={{ width: '16%' }} title="5 Tủ Vòi"></div>
                        <div className="bg-amber-500 h-full" style={{ width: '13%' }} title="4 Báo Cháy"></div>
                      </div>
                    </div>

                    {/* Area 3: Văn Phòng Điều Hành */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">3. Văn Phòng Điều Hành (VP)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">18 TB (16.2%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-sky-600 h-full" style={{ width: '39%' }} title="7 Bình CO2"></div>
                        <div className="bg-red-500 h-full" style={{ width: '33%' }} title="6 Tủ Vòi"></div>
                        <div className="bg-amber-500 h-full" style={{ width: '22%' }} title="4 Báo Cháy"></div>
                        <div className="bg-rose-600 h-full" style={{ width: '6%' }} title="1 Bình Bột"></div>
                      </div>
                    </div>

                    {/* Area 4: Nhà Xe & Khu Phụ Trợ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">4. Nhà Xe & Khu Phụ Trợ (NX, PT)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">15 TB (13.5%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-rose-600 h-full" style={{ width: '53%' }} title="8 Bình Bột (kể cả xe đẩy 35kg)"></div>
                        <div className="bg-sky-600 h-full" style={{ width: '47%' }} title="7 Bình CO2"></div>
                      </div>
                    </div>

                    {/* Area 5: Phân Xưởng Dệt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">5. Phân Xưởng Dệt (D)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">13 TB (11.7%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-sky-600 h-full" style={{ width: '62%' }} title="8 Bình CO2"></div>
                        <div className="bg-red-500 h-full" style={{ width: '23%' }} title="3 Tủ Vòi"></div>
                        <div className="bg-amber-500 h-full" style={{ width: '15%' }} title="2 Báo Cháy"></div>
                      </div>
                    </div>

                    {/* Area 6: Trạm Bơm & Bảo Vệ */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">6. Trạm Bơm & Cổng Bảo Vệ (BV, TB)</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">3 TB (2.8%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="bg-blue-700 h-full" style={{ width: '33.3%' }} title="1 Tủ Trung Tâm"></div>
                        <div className="bg-slate-600 h-full" style={{ width: '33.3%' }} title="1 Trạm Bơm"></div>
                        <div className="bg-rose-600 h-full" style={{ width: '33.4%' }} title="1 Bình Bột 8kg"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Màu sắc biểu thị tỷ trọng các chủng loại đặt tại khu vực</span>
                  <span className="font-bold text-emerald-600">Độ phủ 100%</span>
                </div>
              </div>
            </div>

            {/* PANEL DƯỚI: THÔNG SỐ KỸ THUẬT & ĐỘ SẴN SÀNG VẬN HÀNH */}
            <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white tracking-wide flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Chi Tiết Quy Cách Kỹ Thuật & Tình Trạng An Toàn Thiết Bị</span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                    Hạn kiểm định định kỳ toàn bộ 111 thiết bị: 20/12/2026 • 100% tem mã QR sẵn sàng tra cứu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('devices')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mở Bảng Danh Mục Thiết Bị (111)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Khối 1: Quy cách bình chữa cháy */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <span>Nhóm Bình Chữa Cháy (78 Bình)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 pl-1 font-medium">
                    <li className="flex justify-between items-center">
                      <span>• Bình khí CO2 MT3 (10 kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">45 bình</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Bình bột chữa cháy ABC (4 kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">25 bình</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Bình bột chữa cháy ABC (8 kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">7 bình</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Bình bột xe đẩy lớn (35 kg):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">1 bình</strong>
                    </li>
                  </ul>
                </div>

                {/* Khối 2: Tủ vòi vách tường */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                      <Box className="w-3.5 h-3.5" />
                    </div>
                    <span>Hệ Thống Vách Tường (19 Tủ)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 pl-1 font-medium">
                    <li className="flex justify-between items-center">
                      <span>• Tủ ngoài trời & vách xưởng:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">19 tủ</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Cuộn vòi chữa cháy D50 (20m):</span>
                      <strong className="font-mono text-slate-900 dark:text-white">Đủ 19 bộ</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Lăng phun kim loại & van góc:</span>
                      <strong className="font-mono text-emerald-600">Hoạt động tốt</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Áp lực duy trì đường ống:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">7 - 9 bar</strong>
                    </li>
                  </ul>
                </div>

                {/* Khối 3: Báo cháy & trạm bơm */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <span>Báo Cháy & Bơm PCCC (14 Hệ Thống)</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 pl-1 font-medium">
                    <li className="flex justify-between items-center">
                      <span>• Tổ hợp chuông đèn nút nhấn:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">12 cụm</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Tủ trung tâm báo cháy YunYang:</span>
                      <strong className="font-mono text-blue-600">1 hệ thống</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Trạm bơm chính + bù áp PCCC:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">1 trạm bơm</strong>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>• Nguồn điện dự phòng & ắc quy:</span>
                      <strong className="font-mono text-emerald-600">Sẵn sàng 24/7</strong>
                    </li>
                  </ul>
                </div>
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
