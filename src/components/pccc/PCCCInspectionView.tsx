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

          {/* PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC - Thu nhỏ kích thước tinh gọn */}
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                Bấm vào nhóm để xem danh sách
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
              {/* 1. Bình Bột */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'binh_bot' ? 'all' : 'binh_bot');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'binh_bot'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-red-500 shadow-xs ring-2 ring-red-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-1">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Bình Bột</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.binh_bot}
                </div>
              </button>

              {/* 2. Bình CO2 */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'binh_co2' ? 'all' : 'binh_co2');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'binh_co2'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-xs ring-2 ring-sky-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-1">
                  <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Bình CO2</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.binh_co2}
                </div>
              </button>

              {/* 3. Báo Cháy */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'nut_chuong' ? 'all' : 'nut_chuong');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'nut_chuong'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-xs ring-2 ring-amber-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-1">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Báo Cháy</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.nut_chuong}
                </div>
              </button>

              {/* 4. Tủ Vách Tường */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'tu_voi_vach' ? 'all' : 'tu_voi_vach');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tu_voi_vach'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-xs ring-2 ring-red-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 mb-1">
                  <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Tủ Vách Tường</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tu_voi_vach}
                </div>
              </button>

              {/* 5. Trạm Bơm */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'tram_bom' ? 'all' : 'tram_bom');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tram_bom'
                    ? 'bg-slate-200 dark:bg-slate-700 border-slate-600 shadow-xs ring-2 ring-slate-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 mb-1">
                  <Cog className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Trạm Bơm</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tram_bom}
                </div>
              </button>

              {/* 6. Tủ Trung Tâm */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(categoryFilter === 'tu_trung_tam' ? 'all' : 'tu_trung_tam');
                  scrollToTable();
                }}
                className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tu_trung_tam'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-xs ring-2 ring-blue-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-1">
                  <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300">Tủ Trung Tâm</div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tu_trung_tam}
                </div>
              </button>
            </div>
          </div>

          {/* DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ - Có ID cuộn & co dãn cột hoàn hảo */}
          <div
            id="pccc-device-table"
            className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden scroll-mt-4"
          >
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">
                  DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Dữ liệu kết hợp giữa Master Data và Nhật ký kiểm định thực tế mới nhất
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã, tên, vị trí..."
                    className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                >
                  <option value="all">Tất cả chủng loại</option>
                  <option value="binh_bot">Bình Bột ({countByCategory.binh_bot})</option>
                  <option value="binh_co2">Bình CO2 ({countByCategory.binh_co2})</option>
                  <option value="nut_chuong">Báo Cháy ({countByCategory.nut_chuong})</option>
                  <option value="tu_voi_vach">Tủ Vách Tường ({countByCategory.tu_voi_vach})</option>
                  <option value="tram_bom">Trạm Bơm ({countByCategory.tram_bom})</option>
                  <option value="tu_trung_tam">Tủ Trung Tâm ({countByCategory.tu_trung_tam})</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="pass">Đạt tiêu chuẩn ({passCount})</option>
                  <option value="fail">Cần xử lý / Hỏng ({failCount})</option>
                  <option value="expiring">Hết hạn / Sắp hạn ({expiringCount})</option>
                </select>

                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setSearchTerm('');
                    loadData();
                  }}
                  title="Tải lại dữ liệu"
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table - Co dãn chuẩn xác không bao giờ bị cắt rớt dòng cụt chữ */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1080px]">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                    <th className="py-2.5 px-3 pl-4 sm:pl-5 w-32 min-w-[120px] whitespace-nowrap">MÃ THIẾT BỊ</th>
                    <th className="py-2.5 px-3 min-w-[220px]">TÊN THIẾT BỊ</th>
                    <th className="py-2.5 px-3 w-28 min-w-[110px] text-center whitespace-nowrap">CHỦNG LOẠI</th>
                    <th className="py-2.5 px-3 min-w-[180px] max-w-[240px]">VỊ TRÍ ĐẶT</th>
                    <th className="py-2.5 px-3 w-28 min-w-[105px] text-center whitespace-nowrap">CHUẨN KỸ THUẬT</th>
                    <th className="py-2.5 px-3 w-28 min-w-[105px] text-center whitespace-nowrap">HẠN KIỂM ĐỊNH</th>
                    <th className="py-2.5 px-3 w-56 min-w-[200px] whitespace-nowrap">TÌNH TRẠNG & LẦN KT THỰC TẾ</th>
                    <th className="py-2.5 px-3 w-32 min-w-[120px] text-center pr-4 sm:pr-5 whitespace-nowrap">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-[11px] sm:text-xs">
                  {filteredDevices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Không tìm thấy thiết bị nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    filteredDevices.map((d) => {
                      const catInfo = PCCC_CATEGORIES[d.category];
                      const hasLast = !!d.lastInspection;
                      const isPass = d.lastInspection?.status === 'pass';

                      return (
                        <tr
                          key={d.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2 px-3 pl-4 sm:pl-5 font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                            {d.id}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                            {d.name}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap inline-block">
                              {catInfo?.name || d.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300 leading-tight" title={d.location}>
                            {d.location}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                            {d.specs}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                            {d.inspectionExpiry}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {hasLast ? (
                              isPass ? (
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>ĐẠT ({d.lastInspection?.date})</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>CẦN XỬ LÝ ({d.lastInspection?.date})</span>
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-500 inline-block">
                                Chưa kiểm tra
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 pr-4 sm:pr-5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleInspectDevice(d)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95"
                              >
                                Kiểm Tra
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeviceForQr(d);
                                  setIsQrCodeModalOpen(true);
                                }}
                                title="Xem mã QR tem dán"
                                className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
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
                        {d.inspectionExpiry}
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
