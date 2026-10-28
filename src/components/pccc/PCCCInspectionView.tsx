'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
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
import { exportPCCCReportToExcel, downloadPCCCDevicesTemplate, formatPCCCChecklistSummary } from '@/lib/excel';
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
  FileCheck2,
  Printer,
  Download,
  Upload,
  Plus,
  Eye,
  Check,
  Edit2,
  Trash2,
  Layers,
  FileSpreadsheet,
  Calendar,
  Filter,
} from 'lucide-react';

export function PCCCInspectionView() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'ehs';

  const [devices, setDevices] = useState<PCCCDevice[]>([]);
  const [inspections, setInspections] = useState<PCCCInspection[]>([]);

  // 3 Sub-tabs: 'dashboard' | 'devices' | 'history'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'devices' | 'history'>('dashboard');

  // Filters for Dashboard/Devices
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // History filters
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const [historyResultFilter, setHistoryResultFilter] = useState<'all' | 'pass' | 'fail'>('all');

  // Modals state
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [preSelectedDevice, setPreSelectedDevice] = useState<PCCCDevice | null>(null);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [selectedDeviceForQr, setSelectedDeviceForQr] = useState<PCCCDevice | null>(null);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<PCCCDevice | null>(null);

  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  // Selected inspection for detail modal
  const [viewingInspection, setViewingInspection] = useState<PCCCInspection | null>(null);

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

  // Check expiring within 30 days
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

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (statusFilter === 'pass' && d.lastInspection?.status !== 'pass') return false;
      if (statusFilter === 'fail' && d.lastInspection?.status !== 'fail') return false;
      if (statusFilter === 'none' && d.lastInspection) return false;

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

  // Filtered inspections (History)
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      if (categoryFilter !== 'all' && insp.category !== categoryFilter) return false;
      if (historyResultFilter !== 'all' && insp.overallResult !== historyResultFilter) return false;

      if (historyFromDate) {
        const inspD = new Date(insp.inspectedAt).toISOString().slice(0, 10);
        if (inspD < historyFromDate) return false;
      }
      if (historyToDate) {
        const inspD = new Date(insp.inspectedAt).toISOString().slice(0, 10);
        if (inspD > historyToDate) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          insp.deviceId.toLowerCase().includes(q) ||
          insp.deviceName.toLowerCase().includes(q) ||
          insp.location.toLowerCase().includes(q) ||
          insp.inspectorName.toLowerCase().includes(q) ||
          insp.inspectorId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inspections, categoryFilter, historyResultFilter, historyFromDate, historyToDate, searchTerm]);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header & Mobile Responsive Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 no-print">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-red-600 text-white shadow-md shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
              Kiểm Tra & Quản Lý Thiết Bị PCCC
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống giám sát định kỳ 111 thiết bị PCCC, checklist tiêu chuẩn & quét mã QR tại hiện trường
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            <span>Quét QR</span>
          </button>

          <button
            onClick={() => {
              setPreSelectedDevice(null);
              setIsInspectionModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Kiểm tra mới</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">In báo cáo</span>
          </button>
        </div>
      </div>

      {/* 3 Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Dashboard & Giám Sát</span>
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'devices'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh Sách Thiết Bị PCCC ({devices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Nhật Ký & Báo Cáo ({inspections.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: DASHBOARD & GIÁM SÁT (Chuẩn Hình 1) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 sm:space-y-6">
          {/* TOP 4 METRICS CARDS (Responsive: 2-col on phone, 4-col on desktop) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Card 1: TỔNG THIẾT BỊ */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border-2 border-red-500 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  TỔNG THIẾT BỊ
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{totalCount}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">thiết bị</span>
              </div>
            </div>

            {/* Card 2: ĐẠT TIÊU CHUẨN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600">
                  ĐẠT TIÊU CHUẨN
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{passCount}</span>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {passRate}%
                </span>
              </div>
            </div>

            {/* Card 3: CẦN XỬ LÝ / HỎNG */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-600">
                  CẦN XỬ LÝ / HỎNG
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 border border-rose-200 dark:border-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">{failCount}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">cần nạp/sửa</span>
              </div>
            </div>

            {/* Card 4: HẾT HẠN / SẮP HẠN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-600">
                  HẾT HẠN / SẮP HẠN
                </span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{expiringCount}</span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">trong 30 ngày</span>
              </div>
            </div>
          </div>

          {/* PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 sm:py-1 rounded-full border border-rose-200 dark:border-rose-900">
                Bấm vào nhóm để xem danh sách
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {/* 1. Bình Bột */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'binh_bot' ? 'all' : 'binh_bot')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'binh_bot'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-red-500 shadow-md ring-2 ring-red-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-1.5 sm:mb-2">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Bình Bột</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.binh_bot}
                </div>
              </button>

              {/* 2. Bình CO2 */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'binh_co2' ? 'all' : 'binh_co2')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'binh_co2'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-1.5 sm:mb-2">
                  <Snowflake className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Bình CO2</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.binh_co2}
                </div>
              </button>

              {/* 3. Báo Cháy */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'nut_chuong' ? 'all' : 'nut_chuong')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'nut_chuong'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-1.5 sm:mb-2">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Báo Cháy</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.nut_chuong}
                </div>
              </button>

              {/* 4. Tủ Vách Tường */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'tu_voi_vach' ? 'all' : 'tu_voi_vach')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tu_voi_vach'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 mb-1.5 sm:mb-2">
                  <Box className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Tủ Vách Tường</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tu_voi_vach}
                </div>
              </button>

              {/* 5. Trạm Bơm */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'tram_bom' ? 'all' : 'tram_bom')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tram_bom'
                    ? 'bg-slate-200 dark:bg-slate-700 border-slate-600 shadow-md ring-2 ring-slate-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 mb-1.5 sm:mb-2">
                  <Cog className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Trạm Bơm</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tram_bom}
                </div>
              </button>

              {/* 6. Tủ Trung Tâm */}
              <button
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === 'tu_trung_tam' ? 'all' : 'tu_trung_tam')}
                className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                  categoryFilter === 'tu_trung_tam'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-1.5 sm:mb-2">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">Tủ Trung Tâm</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {countByCategory.tu_trung_tam}
                </div>
              </button>
            </div>
          </div>

          {/* DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ (Bảng tra cứu & kiểm tra nhanh) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide uppercase">
                  DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Dữ liệu kết hợp giữa Master Data và Nhật ký kiểm định thực tế mới nhất
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:flex-initial min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm mã, tên, vị trí..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
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
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="pass">Đạt tiêu chuẩn ({passCount})</option>
                  <option value="fail">Cần xử lý / Hỏng ({failCount})</option>
                </select>

                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setSearchTerm('');
                    loadData();
                  }}
                  title="Tải lại dữ liệu"
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                    <th className="p-3 pl-4 sm:pl-6">MÃ THIẾT BỊ</th>
                    <th className="p-3">TÊN THIẾT BỊ</th>
                    <th className="p-3">CHỦNG LOẠI</th>
                    <th className="p-3">VỊ TRÍ ĐẶT</th>
                    <th className="p-3">CHUẨN KỸ THUẬT</th>
                    <th className="p-3">HẠN KIỂM ĐỊNH</th>
                    <th className="p-3">TÌNH TRẠNG & LẦN KT THỰC TẾ</th>
                    <th className="p-3 text-center pr-4 sm:pr-6">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
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
                          <td className="p-3 pl-4 sm:pl-6 font-mono font-black text-slate-900 dark:text-white">
                            {d.id}
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{d.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              {catInfo?.name || d.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={d.location}>
                            {d.location}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                            {d.specs}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {d.inspectionExpiry}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {hasLast ? (
                              isPass ? (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 w-fit">
                                  <Check className="w-3 h-3" />
                                  <span>ĐẠT ({d.lastInspection?.date})</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-rose-100/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>CẦN XỬ LÝ ({d.lastInspection?.date})</span>
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium bg-slate-100 text-slate-500">
                                Chưa kiểm tra
                              </span>
                            )}
                          </td>
                          <td className="p-3 pr-4 sm:pr-6 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleInspectDevice(d)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
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
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                DANH MỤC THIẾT BỊ PCCC TOÀN NHÀ MÁY
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý thông tin 111 thiết bị PCCC, vị trí đặt, chuẩn định mức và tải file Excel mẫu
              </p>
            </div>

            {/* Admin Management Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => downloadPCCCDevicesTemplate()}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file Excel mẫu</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsImportExcelModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải lên từ Excel mẫu</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDeviceToEdit(null);
                    setIsDeviceModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In tất cả tem QR</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="relative flex-1 sm:flex-initial min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã, tên, vị trí, chuẩn KT..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="all">Tất cả chủng loại ({devices.length})</option>
              <option value="binh_bot">Bình Bột ({countByCategory.binh_bot})</option>
              <option value="binh_co2">Bình CO2 ({countByCategory.binh_co2})</option>
              <option value="nut_chuong">Báo Cháy ({countByCategory.nut_chuong})</option>
              <option value="tu_voi_vach">Tủ Vách Tường ({countByCategory.tu_voi_vach})</option>
              <option value="tram_bom">Trạm Bơm ({countByCategory.tram_bom})</option>
              <option value="tu_trung_tam">Tủ Trung Tâm ({countByCategory.tu_trung_tam})</option>
            </select>

            <span className="text-slate-500 font-medium ml-auto">
              Hiển thị <strong className="text-slate-900 dark:text-white">{filteredDevices.length}</strong> / {devices.length} thiết bị
            </span>
          </div>

          {/* Master Devices Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3 pl-4">MÃ THIẾT BỊ</th>
                  <th className="p-3">TÊN THIẾT BỊ</th>
                  <th className="p-3">CHỦNG LOẠI</th>
                  <th className="p-3">VỊ TRÍ ĐẶT</th>
                  <th className="p-3 text-center">CHUẨN KỸ THUẬT</th>
                  <th className="p-3 text-center">HẠN KIỂM ĐỊNH</th>
                  <th className="p-3">GHI CHÚ</th>
                  <th className="p-3 text-center pr-4">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredDevices.map((d) => {
                  const catInfo = PCCC_CATEGORIES[d.category];
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 pl-4 font-mono font-black text-red-600">{d.id}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{d.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border">
                          {catInfo?.name || d.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={d.location}>
                        {d.location}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">{d.specs}</td>
                      <td className="p-3 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {d.inspectionExpiry}
                      </td>
                      <td className="p-3 text-slate-500 italic max-w-xs truncate" title={d.notes || ''}>
                        {d.notes || '-'}
                      </td>
                      <td className="p-3 pr-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeviceToEdit(d);
                                setIsDeviceModalOpen(true);
                              }}
                              title="Sửa thông tin"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors cursor-pointer"
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
                            className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDevice(d)}
                              title="Xóa thiết bị"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
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

      {/* SUB-TAB 3: NHẬT KÝ & BÁO CÁO TỔNG HỢP KIỂM TRA PCCC */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs no-print">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã TB, người KT, vị trí..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="all">Tất cả chủng loại</option>
                <option value="binh_bot">Bình Bột</option>
                <option value="binh_co2">Bình CO2</option>
                <option value="nut_chuong">Báo Cháy</option>
                <option value="tu_voi_vach">Tủ Vách Tường</option>
                <option value="tram_bom">Trạm Bơm</option>
                <option value="tu_trung_tam">Tủ Trung Tâm</option>
              </select>

              <select
                value={historyResultFilter}
                onChange={(e) => setHistoryResultFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
              >
                <option value="all">Tất cả kết quả</option>
                <option value="pass">Chỉ đạt tiêu chuẩn</option>
                <option value="fail">Chỉ không đạt / hỏng</option>
              </select>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Từ:</span>
                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => setHistoryFromDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <span className="text-slate-500">Đến:</span>
                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => setHistoryToDate(e.target.value)}
                  className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In PDF</span>
              </button>
            </div>
          </div>

          {/* Printable Formal Document Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Factory Formal Letterhead */}
            <div className="border-b-2 border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain shrink-0" />
                <div>
                  <div className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                    CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Hệ thống Quản trị & Điều hành Sản xuất Nội bộ - Ban Quản lý PCCC
                  </div>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  Mã tài liệu: BC-LK-PCCC/2026
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white">
                BÁO CÁO TỔNG HỢP KIỂM TRA ĐỊNH KỲ THIẾT BỊ PCCC
              </h2>
              <p className="text-xs text-slate-500 italic">
                {categoryFilter !== 'all' ? `Chủng loại: ${PCCC_CATEGORIES[categoryFilter as PCCCCategory]?.name} • ` : ''}
                {historyFromDate && historyToDate
                  ? `Từ ngày ${historyFromDate} đến ngày ${historyToDate}`
                  : 'Tất cả nhật ký kiểm định thực tế mới nhất'}
              </p>
            </div>

            {/* Comprehensive Report Table (13 Columns matching specification) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] sm:text-[11px]">
                    <th className="p-2 border border-slate-300 text-center w-10">STT</th>
                    <th className="p-2 border border-slate-300 text-center">Mã TB</th>
                    <th className="p-2 border border-slate-300">Tên thiết bị</th>
                    <th className="p-2 border border-slate-300 text-center">Chủng loại</th>
                    <th className="p-2 border border-slate-300">Vị trí đặt</th>
                    <th className="p-2 border border-slate-300 text-center">Chuẩn KT</th>
                    <th className="p-2 border border-slate-300 text-center">Hạn KĐ</th>
                    <th className="p-2 border border-slate-300 text-center">Thời gian KT</th>
                    <th className="p-2 border border-slate-300">Người kiểm tra</th>
                    <th className="p-2 border border-slate-300">Chi tiết các đầu mục kiểm tra</th>
                    <th className="p-2 border border-slate-300 text-center">Đánh giá</th>
                    <th className="p-2 border border-slate-300 text-center w-20">Ký nhận</th>
                    <th className="p-2 border border-slate-300">Ghi chú / Đề xuất</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-[11px]">
                  {filteredDevices.map((d, idx) => {
                    const insp = inspections.find((i) => i.deviceId === d.id);
                    const catInfo = PCCC_CATEGORIES[d.category];
                    const details = formatPCCCChecklistSummary(insp);
                    const isPass = d.lastInspection?.status === 'pass';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2 border border-slate-300 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold text-red-600 text-center whitespace-nowrap">
                          {d.id}
                        </td>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900 dark:text-white">
                          {d.name}
                        </td>
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                          {catInfo?.name || d.category}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-700 dark:text-slate-300 max-w-xs">
                          {d.location}
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-mono whitespace-nowrap">{d.specs}</td>
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap">{d.inspectionExpiry}</td>
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap text-[10px] font-mono">
                          {d.lastInspection?.date || insp?.inspectedAt || 'Chưa KT'}
                        </td>
                        <td className="p-2 border border-slate-300 whitespace-nowrap">
                          {d.lastInspection
                            ? `${d.lastInspection.inspectorName} (${d.lastInspection.inspectorId})`
                            : insp
                            ? `${insp.inspectorName} (${insp.inspectorId})`
                            : '-'}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-700 dark:text-slate-300 max-w-xs text-[10px] leading-relaxed">
                          {details}
                        </td>
                        <td className="p-2 border border-slate-300 text-center whitespace-nowrap">
                          {d.lastInspection ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPass
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isPass ? 'ĐẠT' : 'KHÔNG ĐẠT'}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Chưa KT</span>
                          )}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          {/* Ô ký xác nhận trống phục vụ in ấn */}
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-500 italic max-w-xs">
                          {d.lastInspection?.notes || insp?.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures Block for Print */}
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
        onImportSuccess={(count) => {
          loadData();
          alert(`Đã tải lên và cập nhật thành công ${count} thiết bị PCCC vào hệ thống!`);
        }}
      />
    </div>
  );
}
