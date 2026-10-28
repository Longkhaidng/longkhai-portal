'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  PCCCCategory,
  PCCCDevice,
  PCCCInspection,
  PCCC_CATEGORIES,
  BinhBotChecklist,
  BinhCO2Checklist,
  NutChuongChecklist,
  TuVoiVachChecklist,
  TramBomChecklist,
  TuTrungTamChecklist,
} from '@/types/pccc';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  Bell,
  Box,
  Cog,
  Monitor,
  Tag,
  Save,
} from 'lucide-react';

interface PCCCInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedDevice?: PCCCDevice | null;
  onSaved: (inspection: PCCCInspection) => void;
}

export function PCCCInspectionModal({
  isOpen,
  onClose,
  preSelectedDevice,
  onSaved,
}: PCCCInspectionModalProps) {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState<PCCCDevice[]>([]);

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<PCCCCategory>('binh_bot');

  // Selected device & location
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [location, setLocation] = useState('');
  const [deviceName, setDeviceName] = useState('');

  // Overall Result & Notes
  const [overallResult, setOverallResult] = useState<'pass' | 'fail'>('pass');
  const [notes, setNotes] = useState('');

  // 1. Bình Bột State
  const [binhBot, setBinhBot] = useState<BinhBotChecklist>({
    standardWeight: 4.0,
    pressureGauge: 'normal',
    nozzleHose: 'pass',
    safetyPinSeal: 'pass',
  });

  // 2. Bình CO2 State
  const [binhCO2, setBinhCO2] = useState<BinhCO2Checklist>({
    standardGrossWeight: 10,
    actualWeight: 10,
    gasLossPercent: 0,
    isLossAcceptable: true,
    co2Nozzle: 'pass',
    safetyPinSeal: 'pass',
  });

  // 3. Nút & Chuông State
  const [nutChuong, setNutChuong] = useState<NutChuongChecklist>({
    subType: 'Tổ hợp Chuông/Đèn/Nút',
    emergencyButton: 'pass',
    bellSiren: 'pass',
    locationLight: 'pass',
    resetSwitch: 'pass',
  });

  // 4. Tủ Vòi Vách State
  const [tuVoiVach, setTuVoiVach] = useState<TuVoiVachChecklist>({
    angleValve: 'pass',
    hoseLeak: 'pass',
    hoseCoupling: 'pass',
    nozzleAvailability: 'pass',
    nozzleCoupling: 'pass',
  });

  // 5. Trạm Bơm State
  const [tramBom, setTramBom] = useState<TramBomChecklist>({
    electricalControl: 'pass',
    mainPump1: 'pass',
    mainPump2: 'pass',
    jockeyPump: 'pass',
    pressureGauge: 'pass',
    waterLevel: 'pass',
  });

  // 6. Tủ Trung Tâm State
  const [tuTrungTam, setTuTrungTam] = useState<TuTrungTamChecklist>({
    acPowerLight: 'pass',
    zoneDisplayLight: 'pass',
    alarmLight: 'pass',
    faultLight: 'pass',
    batterySwitch: 'pass',
    alarmSwitch: 'pass',
    testSwitch: 'pass',
    backupBattery: 'pass',
  });

  // Load devices on open
  useEffect(() => {
    if (isOpen) {
      const all = storage.getPCCCDevices();
      setDevices(all);

      if (preSelectedDevice) {
        setActiveCategory(preSelectedDevice.category);
        setSelectedDeviceId(preSelectedDevice.id);
        setLocation(preSelectedDevice.location);
        setDeviceName(preSelectedDevice.name);
      } else {
        const first = all.find((d) => d.category === activeCategory);
        if (first) {
          setSelectedDeviceId(first.id);
          setLocation(first.location);
          setDeviceName(first.name);
        } else {
          setSelectedDeviceId('');
          setLocation('');
          setDeviceName('');
        }
      }
    }
  }, [isOpen, preSelectedDevice]);

  // When changing category tab
  const handleCategoryChange = (cat: PCCCCategory) => {
    setActiveCategory(cat);
    const firstInCat = devices.find((d) => d.category === cat);
    if (firstInCat) {
      setSelectedDeviceId(firstInCat.id);
      setLocation(firstInCat.location);
      setDeviceName(firstInCat.name);
    } else {
      setSelectedDeviceId('');
      setLocation('');
      setDeviceName('');
    }
  };

  // When changing device from dropdown
  const handleDeviceSelect = (id: string) => {
    setSelectedDeviceId(id);
    const d = devices.find((item) => item.id === id);
    if (d) {
      setLocation(d.location);
      setDeviceName(d.name);
    }
  };

  // Calculate CO2 gas loss
  const handleCO2WeightChange = (actual: number) => {
    const gross = binhCO2.standardGrossWeight;
    const lossDiff = Math.max(0, gross - actual);
    const lossPct = Math.round((lossDiff / 3.0) * 1000) / 10;
    const acceptable = lossPct <= 10.0;

    setBinhCO2({
      ...binhCO2,
      actualWeight: actual,
      gasLossPercent: lossPct,
      isLossAcceptable: acceptable,
    });

    if (!acceptable) {
      setOverallResult('fail');
    }
  };

  if (!isOpen) return null;

  const devicesInActiveCategory = devices.filter((d) => d.category === activeCategory);
  const catInfo = PCCC_CATEGORIES[activeCategory];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDeviceId) {
      alert('Vui lòng chọn mã thiết bị cần kiểm tra.');
      return;
    }

    const now = new Date();
    const nowStr = now
      .toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
      .replace('T', ' ');

    let checklistData: any;
    if (activeCategory === 'binh_bot') {
      checklistData = { type: 'binh_bot', data: binhBot };
    } else if (activeCategory === 'binh_co2') {
      checklistData = { type: 'binh_co2', data: binhCO2 };
    } else if (activeCategory === 'nut_chuong') {
      checklistData = { type: 'nut_chuong', data: nutChuong };
    } else if (activeCategory === 'tu_voi_vach') {
      checklistData = { type: 'tu_voi_vach', data: tuVoiVach };
    } else if (activeCategory === 'tram_bom') {
      checklistData = { type: 'tram_bom', data: tramBom };
    } else {
      checklistData = { type: 'tu_trung_tam', data: tuTrungTam };
    }

    const inspection: PCCCInspection = {
      id: `INSP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`,
      deviceId: selectedDeviceId,
      deviceName: deviceName || selectedDeviceId,
      category: activeCategory,
      location: location || 'Tại vị trí quy định',
      inspectorId: currentUser?.id || '2265',
      inspectorName: currentUser?.name || 'Trần Lê Hữu Lực',
      inspectedAt: nowStr,
      overallResult,
      notes,
      checklist: checklistData,
      createdAt: now.toISOString(),
    };

    storage.savePCCCInspection(inspection, currentUser || undefined);
    onSaved(inspection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-3xl h-[95vh] sm:h-auto sm:max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Sticky Top Header with 6 Tabs */}
        <div className="bg-slate-900 p-2.5 sm:p-4 border-b border-slate-800 shrink-0 text-white">
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-600 text-white">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold">Phiếu Kiểm Tra Thiết Bị PCCC</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400">Kiểm định định kỳ & ghi nhận hiện trường</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 6 Tabs with Smooth Touch Horizontal Scroll */}
          <div className="overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 min-w-max">
              {/* Tab 1: Bình Bột */}
              <button
                type="button"
                onClick={() => handleCategoryChange('binh_bot')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'binh_bot'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Flame className="w-4 h-4 text-rose-400" />
                <span>1. Bình Bột</span>
              </button>

              {/* Tab 2: Bình CO2 */}
              <button
                type="button"
                onClick={() => handleCategoryChange('binh_co2')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'binh_co2'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Snowflake className="w-4 h-4 text-sky-400" />
                <span>2. Bình CO2</span>
              </button>

              {/* Tab 3: Nút & Chuông */}
              <button
                type="button"
                onClick={() => handleCategoryChange('nut_chuong')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'nut_chuong'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>3. Nút & Chuông</span>
              </button>

              {/* Tab 4: Tủ Vòi Vách */}
              <button
                type="button"
                onClick={() => handleCategoryChange('tu_voi_vach')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'tu_voi_vach'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Box className="w-4 h-4 text-red-400" />
                <span>4. Tủ Vòi Vách</span>
              </button>

              {/* Tab 5: Trạm Bơm */}
              <button
                type="button"
                onClick={() => handleCategoryChange('tram_bom')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'tram_bom'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Cog className="w-4 h-4 text-slate-300" />
                <span>5. Trạm Bơm</span>
              </button>

              {/* Tab 6: Tủ Trung Tâm */}
              <button
                type="button"
                onClick={() => handleCategoryChange('tu_trung_tam')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCategory === 'tu_trung_tam'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>6. Tủ Trung Tâm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-4">
            {/* Card: THÔNG TIN NHẬN DIỆN THIẾT BỊ */}
            <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span className="uppercase tracking-wider">THÔNG TIN NHẬN DIỆN THIẾT BỊ</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900">
                  {catInfo.badgeTitle}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Mã Thiết Bị <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                      {devicesInActiveCategory.length} thiết bị
                    </span>
                  </div>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Chọn mã thiết bị ({devicesInActiveCategory.length} thiết bị trong nhóm) --</option>
                    {devicesInActiveCategory.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.id} - {d.name} ({d.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vị Trí Đặt <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ví dụ: Xưởng 1 - Cột A3"
                    className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 1. CHECKLIST FORM: BÌNH BỘT */}
            {activeCategory === 'binh_bot' && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Khối Lượng Chuẩn (kg)</h4>
                    <p className="text-[11px] text-slate-500">Trọng lượng theo tem định mức</p>
                  </div>
                  <div className="w-20 sm:w-24 text-center px-3 py-1.5 font-bold font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {binhBot.standardWeight.toFixed(1)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                  <label className="text-xs font-bold text-slate-900 dark:text-white block">
                    Kim Đồng Hồ Đo Áp Lực <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setBinhBot({ ...binhBot, pressureGauge: 'normal' })}
                      className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border transition-all active:scale-95 ${
                        binhBot.pressureGauge === 'normal'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Xanh: Đủ áp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBinhBot({ ...binhBot, pressureGauge: 'low' });
                        setOverallResult('fail');
                      }}
                      className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border transition-all active:scale-95 ${
                        binhBot.pressureGauge === 'low'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span>Đỏ: Tụt áp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBinhBot({ ...binhBot, pressureGauge: 'high' })}
                      className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 border transition-all active:scale-95 ${
                        binhBot.pressureGauge === 'high'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Vàng: Quá áp</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Loa Phun / Vòi Dẫn</h4>
                    <p className="text-[11px] text-slate-500">Không nứt vỡ, không biến dạng</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBinhBot({ ...binhBot, nozzleHose: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhBot.nozzleHose === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ĐẠT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinhBot({ ...binhBot, nozzleHose: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhBot.nozzleHose === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      HỎNG
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chốt An Toàn / Kẹp Chì</h4>
                    <p className="text-[11px] text-slate-500">Còn nguyên niêm phong, chưa bị giật</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBinhBot({ ...binhBot, safetyPinSeal: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhBot.safetyPinSeal === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ĐẠT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinhBot({ ...binhBot, safetyPinSeal: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhBot.safetyPinSeal === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      HỎNG
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CHECKLIST FORM: BÌNH CO2 */}
            {activeCategory === 'binh_co2' && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cân Nặng Thực Tế & Hao Hụt Khí CO2
                    </h4>
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
                      Quy chuẩn HSE ≤ 10%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Cả vỏ chuẩn (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={binhCO2.standardGrossWeight}
                        onChange={(e) =>
                          setBinhCO2({ ...binhCO2, standardGrossWeight: parseFloat(e.target.value) || 10 })
                        }
                        className="w-full px-3 py-2 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Cân thực tế (kg) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={binhCO2.actualWeight || ''}
                        onChange={(e) => handleCO2WeightChange(parseFloat(e.target.value) || 0)}
                        placeholder="Nhập số cân"
                        className="w-full px-3 py-2 text-xs font-bold font-mono bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Tỷ lệ hao hụt khí:</span>
                      <span className={`text-base font-black ${binhCO2.isLossAcceptable ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                        {binhCO2.gasLossPercent.toFixed(1)} %
                      </span>
                    </div>

                    <div>
                      {binhCO2.actualWeight === 0 ? (
                        <span className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                          Chưa nhập cân
                        </span>
                      ) : binhCO2.isLossAcceptable ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          Đạt quy chuẩn (≤ 10%)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                          Hao hụt &gt; 10%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Loa Phun CO2</h4>
                    <p className="text-[11px] text-slate-500">Loa to chịu lạnh, không nứt vỡ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBinhCO2({ ...binhCO2, co2Nozzle: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhCO2.co2Nozzle === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ĐẠT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinhCO2({ ...binhCO2, co2Nozzle: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhCO2.co2Nozzle === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      HỎNG
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chốt An Toàn & Niêm Phong</h4>
                    <p className="text-[11px] text-slate-500">Cụm mỏ vịt nguyên vẹn</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBinhCO2({ ...binhCO2, safetyPinSeal: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhCO2.safetyPinSeal === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ĐẠT
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBinhCO2({ ...binhCO2, safetyPinSeal: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        binhCO2.safetyPinSeal === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      HỎNG
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CHECKLIST FORM: NÚT & CHUÔNG */}
            {activeCategory === 'nut_chuong' && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chủng Loại Thiết Bị</h4>
                    <p className="text-[11px] text-slate-500">Hệ quy ước hoặc hệ địa chỉ</p>
                  </div>
                  <select
                    value={nutChuong.subType}
                    onChange={(e) => setNutChuong({ ...nutChuong, subType: e.target.value })}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Tổ hợp Chuông/Đèn/Nút">Tổ hợp Chuông/Đèn/Nút</option>
                    <option value="Hệ địa chỉ Addressable">Hệ địa chỉ Addressable</option>
                    <option value="Hệ quy ước Conventional">Hệ quy ước Conventional</option>
                  </select>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nút Ấn Khẩn Cấp</h4>
                    <p className="text-[11px] text-slate-500">Kính/màng bảo vệ, nút ấn nhạy</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNutChuong({ ...nutChuong, emergencyButton: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.emergencyButton === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNutChuong({ ...nutChuong, emergencyButton: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.emergencyButton === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Chuông / Còi Reo</h4>
                    <p className="text-[11px] text-slate-500">Âm lượng to rõ, không rè tiếng</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNutChuong({ ...nutChuong, bellSiren: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.bellSiren === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNutChuong({ ...nutChuong, bellSiren: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.bellSiren === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Đèn Chỉ Thị Vị Trí</h4>
                    <p className="text-[11px] text-slate-500">Đèn LED đỏ sáng bình thường</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNutChuong({ ...nutChuong, locationLight: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.locationLight === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNutChuong({ ...nutChuong, locationLight: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.locationLight === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cần Gạt / Khóa Reset</h4>
                    <p className="text-[11px] text-slate-500">Phục hồi trạng thái bình thường tốt</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNutChuong({ ...nutChuong, resetSwitch: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.resetSwitch === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNutChuong({ ...nutChuong, resetSwitch: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        nutChuong.resetSwitch === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. CHECKLIST FORM: TỦ VÒI VÁCH */}
            {activeCategory === 'tu_voi_vach' && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Họng Nước / Van Góc</h4>
                    <p className="text-[11px] text-slate-500">Có nước, van đóng mở trơn tru</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTuVoiVach({ ...tuVoiVach, angleValve: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.angleValve === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTuVoiVach({ ...tuVoiVach, angleValve: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.angleValve === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cuộn Vòi (Rò rỉ)</h4>
                    <p className="text-[11px] text-slate-500">Vải bạt không rách, không mục</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTuVoiVach({ ...tuVoiVach, hoseLeak: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.hoseLeak === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTuVoiVach({ ...tuVoiVach, hoseLeak: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.hoseLeak === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Rò rỉ
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cuộn Vòi (Khớp Nối Ngàm)</h4>
                    <p className="text-[11px] text-slate-500">Ron cao su kín, ngàm không móp</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTuVoiVach({ ...tuVoiVach, hoseCoupling: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.hoseCoupling === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTuVoiVach({ ...tuVoiVach, hoseCoupling: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.hoseCoupling === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Hỏng
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lăng Phun (Có Sẵn)</h4>
                    <p className="text-[11px] text-slate-500">Đầy đủ số lượng trong tủ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTuVoiVach({ ...tuVoiVach, nozzleAvailability: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.nozzleAvailability === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTuVoiVach({ ...tuVoiVach, nozzleAvailability: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.nozzleAvailability === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Thiếu
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lăng Phun (Khớp Nối)</h4>
                    <p className="text-[11px] text-slate-500">Khớp nối lắp vừa khít cuộn vòi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTuVoiVach({ ...tuVoiVach, nozzleCoupling: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.nozzleCoupling === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTuVoiVach({ ...tuVoiVach, nozzleCoupling: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tuVoiVach.nozzleCoupling === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      K.Đạt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CHECKLIST FORM: TRẠM BƠM */}
            {activeCategory === 'tram_bom' && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Hệ Thống Điện & Tủ Điều Khiển</h4>
                    <p className="text-[11px] text-slate-500">Đủ 3 pha, chế độ Auto sẵn sàng</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, electricalControl: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.electricalControl === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, electricalControl: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.electricalControl === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Lỗi
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Máy Bơm Chính 1 (Điện)</h4>
                    <p className="text-[11px] text-slate-500">Khởi động êm, không quá nhiệt</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, mainPump1: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.mainPump1 === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, mainPump1: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.mainPump1 === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Lỗi
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Máy Bơm Chính 2 (Điện )</h4>
                    <p className="text-[11px] text-slate-500">Khởi động êm, không quá nhiệt</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, mainPump2: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.mainPump2 === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, mainPump2: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.mainPump2 === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Lỗi
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Máy Bơm Bù Áp</h4>
                    <p className="text-[11px] text-slate-500">Tự ngắt khi đủ áp lực cài đặt</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, jockeyPump: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.jockeyPump === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, jockeyPump: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.jockeyPump === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Lỗi
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Đồng Hồ Áp Lực Hệ Thống</h4>
                    <p className="text-[11px] text-slate-500">Duy trì đủ áp lực (7 - 9 bar)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, pressureGauge: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.pressureGauge === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, pressureGauge: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.pressureGauge === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Tụt áp
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mực Nước Bể Dự Trữ PCCC</h4>
                    <p className="text-[11px] text-slate-500">Đầy bể (&gt;90% dung tích)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTramBom({ ...tramBom, waterLevel: 'pass' })}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.waterLevel === 'pass'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Đạt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTramBom({ ...tramBom, waterLevel: 'fail' });
                        setOverallResult('fail');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        tramBom.waterLevel === 'fail'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Cạn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CHECKLIST FORM: TỦ TRUNG TÂM */}
            {activeCategory === 'tu_trung_tam' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                    TRẠNG THÁI ĐÈN BÁO & NGUỒN
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">1. Đèn nguồn AC (Xanh)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, acPowerLight: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.acPowerLight === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, acPowerLight: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.acPowerLight === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">2. Đèn hiển thị Zone</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, zoneDisplayLight: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.zoneDisplayLight === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, zoneDisplayLight: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.zoneDisplayLight === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">3. Đèn báo cháy tổng</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, alarmLight: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.alarmLight === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, alarmLight: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.alarmLight === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">4. Đèn báo lỗi hệ thống</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, faultLight: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.faultLight === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        B.Thường
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, faultLight: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.faultLight === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Báo Lỗi
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
                    CÔNG TẮC VẬN HÀNH & ẮC QUY
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">5. Công tắc bình điện</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, batterySwitch: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.batterySwitch === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, batterySwitch: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.batterySwitch === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">6. Công tắc còi báo động</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, alarmSwitch: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.alarmSwitch === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, alarmSwitch: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.alarmSwitch === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">7. Công tắc Test cháy</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, testSwitch: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.testSwitch === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, testSwitch: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.testSwitch === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Lỗi
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">8. Ắc quy dự phòng (24VDC)</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTuTrungTam({ ...tuTrungTam, backupBattery: 'pass' })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.backupBattery === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Đạt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTuTrungTam({ ...tuTrungTam, backupBattery: 'fail' });
                          setOverallResult('fail');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          tuTrungTam.backupBattery === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Yếu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMMON BOTTOM: ĐÁNH GIÁ KẾT QUẢ KIỂM TRA */}
            <div className="bg-white dark:bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">
                ĐÁNH GIÁ KẾT QUẢ KIỂM TRA <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setOverallResult('pass')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                    overallResult === 'pass'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ĐẠT TIÊU CHUẨN</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOverallResult('fail')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                    overallResult === 'fail'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>KHÔNG ĐẠT / HỎNG</span>
                </button>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi Chú / Đề Xuất Khắc Phục
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhập yêu cầu nạp sạc, thay thế ron, bảo dưỡng máy bơm..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu kết quả kiểm tra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
