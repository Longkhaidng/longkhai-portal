'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { isSuperAdminOrBOD, isMaintenanceStaff } from '@/lib/permissions';
import { RepairProposalSubView } from './RepairProposalSubView';
import { StationeryProposalSubView } from './StationeryProposalSubView';
import { GeneralProposalSubView } from './GeneralProposalSubView';
import { StationeryCatalogModal } from './StationeryCatalogModal';
import {
  Wrench,
  Package,
  FileQuestion,
  Layers,
  Settings,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

export type ProposalCategory = 'repair' | 'stationery' | 'general';

export interface ProposalHubViewProps {
  initialCategory?: ProposalCategory;
}

export function ProposalHubView({ initialCategory = 'repair' }: ProposalHubViewProps) {
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ProposalCategory>(initialCategory);
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Sync category if prop changes
  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Check if current user is Admin or HCNS to show "Quản lý danh mục VPP"
  const canManageCatalog = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdminOrBOD(currentUser)) return true;
    if (currentUser.role === 'admin') return true;
    if (currentUser.id === '1139' || currentUser.id === '1867') return true;
    if (currentUser.department && /hcns|nhân sự/i.test(currentUser.department)) return true;
    return false;
  }, [currentUser]);

  // Pending counts for badges
  const [repairPendingCount, setRepairPendingCount] = useState(0);
  const [stationeryPendingCount, setStationeryPendingCount] = useState(0);
  const [generalPendingCount, setGeneralPendingCount] = useState(0);

  const calculatePendingCounts = () => {
    if (!currentUser) return;
    const uid = currentUser.id.toLowerCase();
    const isBOD = isSuperAdminOrBOD(currentUser);
    const isMaintenance = isMaintenanceStaff(currentUser);
    const isManager = currentUser.role === 'manager' || currentUser.role === 'team_leader';
    const isHRStaff =
      currentUser.id === '1139' ||
      currentUser.role === 'hr' ||
      (Boolean(currentUser.department) && /hcns|nhân sự/i.test(currentUser.department!) && currentUser.role !== 'manager');
    const isHRManager =
      currentUser.id === '1867' ||
      (currentUser.role === 'manager' && Boolean(currentUser.department) && /hcns|nhân sự/i.test(currentUser.department!));

    // Repair count
    try {
      const repairs = storage.getRepairProposals();
      const rCount = repairs.filter((p) => {
        if (isManager && p.status === 'pending_manager') return true;
        if (isMaintenance && p.status === 'maintenance_pending') return true;
        if (p.employeeId.toLowerCase() === uid && p.status === 'pending_confirmation') return true;
        return false;
      }).length;
      setRepairPendingCount(rCount);
    } catch (e) {
      // ignore
    }

    // Stationery count
    try {
      const stationeries = storage.getStationeryProposals();
      const sCount = stationeries.filter((p) => {
        if ((isHRStaff || isBOD) && p.status === 'pending_hr') return true;
        if ((isHRManager || isBOD) && p.status === 'pending_manager') return true;
        return false;
      }).length;
      setStationeryPendingCount(sCount);
    } catch (e) {
      // ignore
    }

    // General count
    try {
      const generals = storage.getGeneralProposals();
      const gCount = generals.filter((p) => {
        if (p.status === 'pending_receiver') {
          const isTarget = p.receiverUserId?.toLowerCase() === uid;
          const isIT = (currentUser.role === 'admin' || /cntt|it/i.test(currentUser.department || '')) && /cntt|it/i.test(p.receiverDepartment);
          return isTarget || isIT || isBOD;
        }
        if (p.status === 'pending_manager') {
          const isManagerDept = isManager && p.receiverDepartment.toLowerCase() === (currentUser.department || '').toLowerCase();
          return isManagerDept || isBOD;
        }
        return false;
      }).length;
      setGeneralPendingCount(gCount);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    calculatePendingCounts();
    const handleStorageChange = () => {
      calculatePendingCounts();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Top Main Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-slate-700/50 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-amber-400 shrink-0">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Phiếu Đề Xuất
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Proposal Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Cổng tiếp nhận và điều phối mọi loại đề xuất nội bộ: Sửa chữa thiết bị máy móc, Yêu cầu văn phòng phẩm, và các Kiến nghị đề xuất khác.
              </p>
            </div>
          </div>

          {/* Quick Action: Catalog Management */}
          {canManageCatalog && (
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-bold text-white transition-all backdrop-blur-md cursor-pointer shadow-xs"
              >
                <Settings className="w-4 h-4 text-blue-300" />
                <span>Quản lý danh mục VPP</span>
              </button>
            </div>
          )}
        </div>

        {/* 3 Main Proposal Category Tabs */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6 pt-5 border-t border-white/10">
          {/* Tab 1: Sửa chữa máy móc thiết bị */}
          <button
            type="button"
            onClick={() => setActiveCategory('repair')}
            className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeCategory === 'repair'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.01]'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  activeCategory === 'repair'
                    ? 'bg-black/20 text-white'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">Sửa chữa máy móc thiết bị</div>
                <div
                  className={`text-[11px] ${
                    activeCategory === 'repair' ? 'text-amber-100' : 'text-slate-400'
                  }`}
                >
                  Cơ điện & Cơ sở vật chất
                </div>
              </div>
            </div>
            {repairPendingCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeCategory === 'repair'
                    ? 'bg-white text-amber-600'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {repairPendingCount}
              </span>
            )}
          </button>

          {/* Tab 2: Văn phòng phẩm */}
          <button
            type="button"
            onClick={() => setActiveCategory('stationery')}
            className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeCategory === 'stationery'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  activeCategory === 'stationery'
                    ? 'bg-black/20 text-white'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">Văn phòng phẩm</div>
                <div
                  className={`text-[11px] ${
                    activeCategory === 'stationery' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  HCNS (1139) tiếp nhận
                </div>
              </div>
            </div>
            {stationeryPendingCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeCategory === 'stationery'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {stationeryPendingCount}
              </span>
            )}
          </button>

          {/* Tab 3: Đề xuất khác */}
          <button
            type="button"
            onClick={() => setActiveCategory('general')}
            className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer text-left ${
              activeCategory === 'general'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.01]'
                : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  activeCategory === 'general'
                    ? 'bg-black/20 text-white'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm">Đề xuất khác</div>
                <div
                  className={`text-[11px] ${
                    activeCategory === 'general' ? 'text-purple-100' : 'text-slate-400'
                  }`}
                >
                  CNTT & Các Trưởng bộ phận
                </div>
              </div>
            </div>
            {generalPendingCount > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeCategory === 'general'
                    ? 'bg-white text-purple-600'
                    : 'bg-purple-500 text-white'
                }`}
              >
                {generalPendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Proposal View Content */}
      <div className="transition-all">
        {activeCategory === 'repair' && <RepairProposalSubView />}
        {activeCategory === 'stationery' && <StationeryProposalSubView />}
        {activeCategory === 'general' && <GeneralProposalSubView />}
      </div>

      {/* Catalog Management Modal */}
      {canManageCatalog && (
        <StationeryCatalogModal
          isOpen={showCatalogModal}
          onClose={() => setShowCatalogModal(false)}
        />
      )}
    </div>
  );
}
