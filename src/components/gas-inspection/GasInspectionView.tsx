'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  GasInspectionRecord,
  GasStation,
} from '@/types/gas-inspection';
import { GasInspectionModal } from './GasInspectionModal';
import { GasInspectionDetailModal } from './GasInspectionDetailModal';
import { GasPrintReportModal } from './GasPrintReportModal';
import { GasQrScannerModal } from './GasQrScannerModal';
import { GasQrGeneratorModal } from './GasQrGeneratorModal';
import {
  Flame,
  Plus,
  QrCode,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  RotateCcw,
  Eye,
  Trash2,
  FileCheck,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface GasInspectionViewProps {
  initialScan?: boolean;
  initialStationId?: string;
}

export function GasInspectionView({
  initialScan = false,
  initialStationId,
}: GasInspectionViewProps) {
  const { currentUser } = useAuth();

  // Master data
  const [stations, setStations] = useState<GasStation[]>([]);
  const [inspections, setInspections] = useState<GasInspectionRecord[]>([]);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Active items for modals
  const [activeStation, setActiveStation] = useState<GasStation | null>(null);
  const [activeScanTimestamp, setActiveScanTimestamp] = useState<string>('');
  const [isQrScannedMode, setIsQrScannedMode] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<GasInspectionRecord | null>(null);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStationFilter, setSelectedStationFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedResultFilter, setSelectedResultFilter] = useState('all');

  // Load data
  const loadData = () => {
    const loadedStations = storage.getGasStations();
    const loadedInspections = storage.getGasInspections();
    setStations(loadedStations);
    setInspections(loadedInspections);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL initial scan trigger
  useEffect(() => {
    if (initialScan) {
      if (initialStationId) {
        const found = stations.find((s) => s.id === initialStationId);
        if (found) {
          handleOpenNewInspection(found, new Date().toISOString(), true);
          return;
        }
      }
      setIsScannerOpen(true);
    }
  }, [initialScan, initialStationId, stations]);

  // Open modal with pre-filled station and real-time timestamp
  const handleOpenNewInspection = (
    station?: GasStation,
    timestamp?: string,
    scanned: boolean = false
  ) => {
    setActiveStation(station || stations[0] || null);
    setActiveScanTimestamp(timestamp || new Date().toISOString());
    setIsQrScannedMode(scanned);
    setIsFormOpen(true);
  };

  // QR scan callback
  const handleScanSuccess = (data: {
    station: GasStation;
    scanTimestamp: string;
    isQrScanned: boolean;
  }) => {
    handleOpenNewInspection(data.station, data.scanTimestamp, data.isQrScanned);
  };

  // Delete inspection
  const handleDeleteInspection = (id: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu kiểm tra ${id}?`)) {
      storage.deleteGasInspection(id, {
        id: currentUser?.id || 'admin',
        name: currentUser?.name || 'User',
      });
      loadData();
    }
  };

  // Filtered inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((ins) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchId = ins.id.toLowerCase().includes(term);
        const matchStation = ins.stationName.toLowerCase().includes(term);
        const matchSupplier = ins.supplierName.toLowerCase().includes(term);
        const matchInspector = ins.inspector.name.toLowerCase().includes(term);
        const matchOperator = ins.companyOperatorName.toLowerCase().includes(term);
        const matchSerial = ins.cylinders?.some((c) =>
          c.serialNumber.toLowerCase().includes(term)
        );
        if (
          !matchId &&
          !matchStation &&
          !matchSupplier &&
          !matchInspector &&
          !matchOperator &&
          !matchSerial
        ) {
          return false;
        }
      }

      // 2. Station filter
      if (selectedStationFilter !== 'all' && ins.stationId !== selectedStationFilter) {
        return false;
      }

      // 3. Status filter
      if (selectedStatusFilter !== 'all' && ins.status !== selectedStatusFilter) {
        return false;
      }

      // 4. Result filter
      if (selectedResultFilter !== 'all' && ins.overallResult !== selectedResultFilter) {
        return false;
      }

      return true;
    });
  }, [
    inspections,
    searchTerm,
    selectedStationFilter,
    selectedStatusFilter,
    selectedResultFilter,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const total = inspections.length;
    const passCount = inspections.filter((i) => i.overallResult === 'pass').length;
    const warningCount = inspections.filter(
      (i) => i.overallResult === 'warning' || i.overallResult === 'fail'
    ).length;
    const pendingKitchen = inspections.filter(
      (i) => !i.kitchenConfirmation?.confirmed
    ).length;

    return { total, passCount, warningCount, pendingKitchen };
  }, [inspections]);

  const isKitchenOrAdmin =
    currentUser?.role === 'admin' ||
    (currentUser?.department &&
      /bếp|nhà bếp|nấu ăn|an toàn|ehs|hcns/i.test(currentUser.department));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-amber-200" />
              <span>Hệ Thống An Toàn EHS & Quản Lý Khí Đốt Công Nghiệp</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Kiểm Tra An Toàn Hệ Thống Gas
            </h2>
            <p className="text-xs text-amber-100 max-w-2xl">
              Quét mã QR tại hiện trường ghi nhận thời gian thực tế, kiểm tra van điều áp, độ kín,
              đầu dò, còi đèn ngắt tự động và xác nhận chéo từ Nhà Bếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <QrCode className="w-4 h-4 text-amber-600" />
              <span>Quét mã QR kiểm tra</span>
            </button>

            <button
              onClick={() => handleOpenNewInspection()}
              className="px-4 py-2.5 bg-amber-900/60 hover:bg-amber-900/80 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all border border-white/20 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo phiếu kiểm tra</span>
            </button>

            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors backdrop-blur-md"
              title="In thẻ mã QR trạm gas"
            >
              <Printer className="w-4 h-4" />
              <span>In mã QR trạm gas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng số lần kiểm tra
            </span>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats.total}</div>
            <span className="text-[11px] text-slate-400">Đã lưu trữ hệ thống</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Đạt tiêu chuẩn an toàn
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.passCount}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Hệ thống kín, nhạy tốt</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Cảnh báo / Cần xử lý
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">{stats.warningCount}</div>
            <span className="text-[11px] text-rose-600 font-medium">Lỗi vỏ bình hoặc rò rỉ</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Chờ Bếp xác nhận
            </span>
            <div className="text-2xl font-black text-orange-700 mt-1">{stats.pendingKitchen}</div>
            <span className="text-[11px] text-orange-600 font-medium">Cần ký xác nhận chéo</span>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã phiếu, trạm gas, đơn vị cấp, số seri bình..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Station Filter */}
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="all">Tất cả trạm ({stations.length})</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>

            {/* Result Filter */}
            <select
              value={selectedResultFilter}
              onChange={(e) => setSelectedResultFilter(e.target.value)}
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="all">Tất cả kết quả</option>
              <option value="pass">✓ Đạt an toàn</option>
              <option value="warning">⚠ Có cảnh báo</option>
              <option value="fail">✗ Không đạt</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="pending_kitchen">Chờ Bếp xác nhận</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedStationFilter('all');
                setSelectedResultFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table of Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 min-w-[130px]">Mã phiếu</th>
                <th className="py-3 px-4 min-w-[180px]">Vị trí trạm gas</th>
                <th className="py-3 px-4 min-w-[160px]">Thời gian thực tế</th>
                <th className="py-3 px-4 min-w-[160px]">Đơn vị thay gas / Người vận hành</th>
                <th className="py-3 px-4 min-w-[110px] text-center">Số bình gas</th>
                <th className="py-3 px-4 min-w-[130px] text-center">Kết quả kiểm tra</th>
                <th className="py-3 px-4 min-w-[140px] text-center">Bếp xác nhận</th>
                <th className="py-3 px-4 min-w-[130px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInspections.length > 0 ? (
                filteredInspections.map((ins, idx) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-amber-700">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>{ins.id}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Người KT: {ins.inspector?.name || '---'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{ins.stationName}</div>
                      <span className="text-[11px] text-slate-500">Mã: {ins.stationId}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {formatDateTime(ins.scanTimestamp)}
                      </div>
                      {ins.isQrScanned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Quét mã QR
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Tạo trực tiếp</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {ins.supplierName}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Vận hành: {ins.companyOperatorName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                        {ins.cylinders?.length || 0} bình
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          ins.overallResult === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ins.overallResult === 'warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ins.overallResult === 'pass'
                          ? '✓ Đạt an toàn'
                          : ins.overallResult === 'warning'
                          ? '⚠ Cảnh báo'
                          : '✗ Không đạt'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {ins.kitchenConfirmation?.confirmed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Đã xác nhận
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                          <Clock className="w-3.5 h-3.5 text-orange-600" />
                          Chờ Bếp xác nhận
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInspection(ins);
                            setIsDetailOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Xem chi tiết phiếu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInspection(ins);
                            setIsPrintOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="In biên bản kiểm tra"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteInspection(ins.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa phiếu kiểm tra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Flame className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold">Chưa có phiếu kiểm tra gas nào</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Bấm &ldquo;Quét mã QR kiểm tra&rdquo; hoặc &ldquo;+ Tạo phiếu kiểm tra&rdquo; để bắt đầu.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị <strong>{filteredInspections.length}</strong> / {inspections.length} biên bản
          </span>
          <span className="font-medium text-slate-600">
            CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
          </span>
        </div>
      </div>

      {/* Modals */}
      <GasQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <GasQrGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        stations={stations}
      />

      <GasInspectionModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        station={activeStation}
        scanTimestamp={activeScanTimestamp}
        isQrScanned={isQrScannedMode}
        onSaved={(record) => {
          loadData();
          setSelectedInspection(record);
          setIsDetailOpen(true);
        }}
      />

      <GasInspectionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        inspection={selectedInspection}
        onPrint={(ins) => {
          setSelectedInspection(ins);
          setIsPrintOpen(true);
        }}
        onUpdated={(updated) => {
          loadData();
          setSelectedInspection(updated);
        }}
      />

      <GasPrintReportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        inspection={selectedInspection}
      />
    </div>
  );
}
