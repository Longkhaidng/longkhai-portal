'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import { PeriodicModuleType } from '@/types/periodic-inspection';
import { FirstAidModule } from './FirstAidModule';
import { EyewashModule } from './EyewashModule';
import { StormwaterModule } from './StormwaterModule';
import { GroundwaterSoilModule } from './GroundwaterSoilModule';
import {
  ClipboardCheck,
  CheckCircle2,
  Printer,
  ShieldCheck,
  Activity,
  Droplets,
  CloudRain,
  Sprout,
  HeartPulse,
} from 'lucide-react';

interface PeriodicInspectionViewProps {
  initialSubTab?: string;
}

export function PeriodicInspectionView({ initialSubTab }: PeriodicInspectionViewProps) {
  const { currentUser } = useAuth();

  // Determine initial module from initialSubTab
  const getInitialModule = (tab?: string): PeriodicModuleType => {
    if (!tab) return 'first_aid';
    if (tab === 'periodic_eyewash') return 'eyewash';
    if (tab === 'periodic_stormwater') return 'stormwater';
    if (tab === 'periodic_groundwater_soil') return 'groundwater_soil';
    return 'first_aid';
  };

  const [activeModule, setActiveModule] = useState<PeriodicModuleType>(getInitialModule(initialSubTab));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveModule(getInitialModule(initialSubTab));
    }
  }, [initialSubTab]);

  const handleShowToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Compute KPI summary
  const sccList = storage.getFirstAidInspections();
  const mrmList = storage.getEyewashInspections();
  const nmList = storage.getStormwaterInspections();
  const ngdList = storage.getGroundwaterSoilInspections();

  const totalAll = sccList.length + mrmList.length + nmList.length + ngdList.length;

  const handlePrintCurrent = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white p-6 shadow-lg shadow-blue-900/10 print:hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Hệ Thống An Toàn & Môi Trường &bull; Nhà Máy Long Khải</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Kiểm Tra Định Kỳ</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
              Theo dõi và giám sát 4 hạng mục định kỳ: Tủ sơ cấp cứu, Máy rửa mắt, Hệ thống nước mưa, Nước ngầm &amp; Đất theo quy chuẩn nhà máy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCurrent}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-md"
              title="In phiếu hoặc xuất PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* Minimalist Quick Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Tủ sơ cấp cứu</div>
            <div className="text-lg font-bold text-white mt-0.5">{sccList.length} <span className="text-xs font-normal text-blue-200">lần KT</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Máy rửa mắt</div>
            <div className="text-lg font-bold text-white mt-0.5">{mrmList.length} <span className="text-xs font-normal text-blue-200">lần KT</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Hệ thống nước mưa</div>
            <div className="text-lg font-bold text-white mt-0.5">{nmList.length} <span className="text-xs font-normal text-blue-200">lần KT</span></div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-medium">Nước ngầm &amp; đất</div>
            <div className="text-lg font-bold text-white mt-0.5">{ngdList.length} <span className="text-xs font-normal text-blue-200">khảo sát</span></div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 no-scrollbar print:hidden">
        <button
          onClick={() => setActiveModule('first_aid')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeModule === 'first_aid'
              ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-red-500" />
          <span>1. Tủ Sơ Cấp Cứu ({sccList.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('eyewash')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeModule === 'eyewash'
              ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Droplets className="w-4 h-4 text-cyan-500" />
          <span>2. Máy Rửa Mắt ({mrmList.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('stormwater')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeModule === 'stormwater'
              ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CloudRain className="w-4 h-4 text-blue-500" />
          <span>3. Hệ Thống Nước Mưa ({nmList.length})</span>
        </button>

        <button
          onClick={() => setActiveModule('groundwater_soil')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeModule === 'groundwater_soil'
              ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Sprout className="w-4 h-4 text-emerald-500" />
          <span>4. Nước Ngầm Và Đất ({ngdList.length})</span>
        </button>
      </div>

      {/* Active Module Component */}
      <div className="transition-all">
        {activeModule === 'first_aid' && <FirstAidModule onSuccessToast={handleShowToast} />}
        {activeModule === 'eyewash' && <EyewashModule onSuccessToast={handleShowToast} />}
        {activeModule === 'stormwater' && <StormwaterModule onSuccessToast={handleShowToast} />}
        {activeModule === 'groundwater_soil' && <GroundwaterSoilModule onSuccessToast={handleShowToast} />}
      </div>
    </div>
  );
}
