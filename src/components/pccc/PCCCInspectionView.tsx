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
import { exportPCCCReportToExcel } from '@/lib/excel';
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
  Plus,
  Eye,
  Check,
} from 'lucide-react';

export function PCCCInspectionView() {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState<PCCCDevice[]>([]);
  const [inspections, setInspections] = useState<PCCCInspection[]>([]);

  // View Sub-tab: 'dashboard' (Danh mục & Dashboard) vs 'history' (Nhật ký kiểm tra)
  const [subTab, setSubTab] = useState<'dashboard' | 'history'>('dashboard');

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

  // Check expiring within 30 days (based on inspectionExpiry '20/12/2026')
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
      // Category filter
      if (categoryFilter !== 'all' && d.category !== categoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'pass' && d.lastInspection?.status !== 'pass') return false;
      if (statusFilter === 'fail' && d.lastInspection?.status !== 'fail') return false;
      if (statusFilter === 'none' && d.lastInspection) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = d.id.toLowerCase().includes(q);
        const matchName = d.name.toLowerCase().includes(q);
        const matchLoc = d.location.toLowerCase().includes(q);
        const matchSpecs = d.specs.toLowerCase().includes(q);
        return matchId || matchName || matchLoc || matchSpecs;
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

  // Handle Export Excel
  const handleExportExcel = () => {
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportPCCCReportToExcel({
      devices: filteredDevices,
      inspections,
      subtitle: categoryFilter !== 'all' ? `Chủng loại: ${PCCC_CATEGORIES[categoryFilter as PCCCCategory]?.name || categoryFilter}` : 'Tất cả 111 thiết bị PCCC',
      docCode: 'BC-LK-PCCC/2026',
      fileName: `LONGKHAI_Bao_Cao_PCCC_${nowStr}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Kiểm Tra & Quản Lý Thiết Bị PCCC
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Hệ thống giám sát định kỳ 111 thiết bị PCCC, checklist tiêu chuẩn & quét mã QR tại hiện trường
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Quét mã QR</span>
          </button>

          <button
            onClick={() => {
              setSelectedDeviceForQr(null);
              setIsQrCodeModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Mã QR thiết bị</span>
          </button>

          <button
            onClick={() => {
              setPreSelectedDevice(null);
              setIsInspectionModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Phiếu kiểm tra mới</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD TOP 4 METRICS CARDS (Faithful to Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TỔNG THIẾT BỊ (Red highlighted card) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-red-500 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              TỔNG THIẾT BỊ
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{totalCount}</span>
            <span className="text-xs text-slate-500 font-medium">thiết bị</span>
          </div>
        </div>

        {/* Card 2: ĐẠT TIÊU CHUẨN (Green) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600">
              ĐẠT TIÊU CHUẨN
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">{passCount}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {passRate}%
            </span>
          </div>
        </div>

        {/* Card 3: CẦN XỬ LÝ / HỎNG (Red) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">
              CẦN XỬ LÝ / HỎNG
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono">{failCount}</span>
            <span className="text-xs text-slate-500 font-medium">cần nạp/sửa</span>
          </div>
        </div>

        {/* Card 4: HẾT HẠN / SẮP HẠN (Amber) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600">
              HẾT HẠN / SẮP HẠN
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 border border-amber-200 dark:border-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 font-mono">{expiringCount}</span>
            <span className="text-xs text-slate-500 font-medium">trong 30 ngày</span>
          </div>
        </div>
      </div>

      {/* PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC (Faithful to Image 1) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            PHÂN BỐ THIẾT BỊ THEO 6 CHỦNG LOẠI PCCC
          </h3>
          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            Bấm vào nhóm để xem danh sách
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Bình Bột (33) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'binh_bot' ? 'all' : 'binh_bot')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'binh_bot'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-red-500 shadow-md ring-2 ring-red-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mb-2">
              <Flame className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Bình Bột</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.binh_bot}
            </div>
          </button>

          {/* 2. Bình CO2 (45) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'binh_co2' ? 'all' : 'binh_co2')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'binh_co2'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-md ring-2 ring-sky-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-2">
              <Snowflake className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Bình CO2</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.binh_co2}
            </div>
          </button>

          {/* 3. Báo Cháy (12) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'nut_chuong' ? 'all' : 'nut_chuong')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'nut_chuong'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-2">
              <Bell className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Báo Cháy</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.nut_chuong}
            </div>
          </button>

          {/* 4. Tủ Vách Tường (19) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'tu_voi_vach' ? 'all' : 'tu_voi_vach')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'tu_voi_vach'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 mb-2">
              <Box className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Tủ Vách Tường</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.tu_voi_vach}
            </div>
          </button>

          {/* 5. Trạm Bơm (1) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'tram_bom' ? 'all' : 'tram_bom')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'tram_bom'
                ? 'bg-slate-200 dark:bg-slate-700 border-slate-600 shadow-md ring-2 ring-slate-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 mb-2">
              <Cog className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Trạm Bơm</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.tram_bom}
            </div>
          </button>

          {/* 6. Tủ Trung Tâm (1) */}
          <button
            type="button"
            onClick={() => setCategoryFilter(categoryFilter === 'tu_trung_tam' ? 'all' : 'tu_trung_tam')}
            className={`p-4 rounded-2xl border text-center transition-all ${
              categoryFilter === 'tu_trung_tam'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400'
                : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mb-2">
              <Monitor className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Tủ Trung Tâm</div>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
              {countByCategory.tu_trung_tam}
            </div>
          </button>
        </div>
      </div>

      {/* DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ (Faithful to Image 1) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header and Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-wide uppercase">
              DANH MỤC & TÌNH TRẠNG THIẾT BỊ THỰC TẾ
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dữ liệu kết hợp giữa Master Data và Nhật ký kiểm định thực tế mới nhất
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã, tên, vị trí..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Chủng loại Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="all">Tất cả chủng loại</option>
              <option value="binh_bot">Bình Bột ({countByCategory.binh_bot})</option>
              <option value="binh_co2">Bình CO2 ({countByCategory.binh_co2})</option>
              <option value="nut_chuong">Báo Cháy ({countByCategory.nut_chuong})</option>
              <option value="tu_voi_vach">Tủ Vách Tường ({countByCategory.tu_voi_vach})</option>
              <option value="tram_bom">Trạm Bơm ({countByCategory.tram_bom})</option>
              <option value="tu_trung_tam">Tủ Trung Tâm ({countByCategory.tu_trung_tam})</option>
            </select>

            {/* Tình trạng Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="pass">Đạt tiêu chuẩn ({passCount})</option>
              <option value="fail">Cần xử lý / Hỏng ({failCount})</option>
              <option value="none">Chưa kiểm tra ({totalCount - (passCount + failCount)})</option>
            </select>

            {/* Reset / Reload Button */}
            <button
              onClick={() => {
                setCategoryFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                loadData();
              }}
              title="Tải lại danh sách"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Master Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 pl-6">MÃ THIẾT BỊ</th>
                <th className="p-3.5">TÊN THIẾT BỊ</th>
                <th className="p-3.5">CHỦNG LOẠI</th>
                <th className="p-3.5">VỊ TRÍ ĐẶT</th>
                <th className="p-3.5">CHUẨN KỸ THUẬT</th>
                <th className="p-3.5">HẠN KIỂM ĐỊNH</th>
                <th className="p-3.5">TÌNH TRẠNG & LẦN KT THỰC TẾ</th>
                <th className="p-3.5 text-center pr-6">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
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
                      {/* 1. Mã thiết bị */}
                      <td className="p-3.5 pl-6 font-mono font-black text-slate-900 dark:text-white">
                        {d.id}
                      </td>

                      {/* 2. Tên thiết bị */}
                      <td className="p-3.5 font-bold text-slate-800 dark:text-slate-100">
                        {d.name}
                      </td>

                      {/* 3. Chủng loại */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                          {catInfo?.name || d.category}
                        </span>
                      </td>

                      {/* 4. Vị trí đặt */}
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={d.location}>
                        {d.location}
                      </td>

                      {/* 5. Chuẩn kỹ thuật */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        {d.specs}
                      </td>

                      {/* 6. Hạn kiểm định */}
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {d.inspectionExpiry}
                      </td>

                      {/* 7. Tình trạng & Lần KT thực tế */}
                      <td className="p-3.5 whitespace-nowrap">
                        {hasLast ? (
                          isPass ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 w-fit">
                              <Check className="w-3.5 h-3.5" />
                              <span>ĐẠT ({d.lastInspection?.date})</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 w-fit">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>CẦN XỬ LÝ ({d.lastInspection?.date})</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-500">
                            Chưa kiểm tra
                          </span>
                        )}
                      </td>

                      {/* 8. Thao tác */}
                      <td className="p-3.5 pr-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInspectDevice(d)}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
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

      {/* MODALS */}
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
    </div>
  );
}
