'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  FoodInspectionRecord,
  FoodInspectionSettings,
  FoodInspectionStepKey,
  FoodInspectionStore,
  FreshTemplateItem,
  DryTemplateItem,
  createInitialFoodInspectionStore,
} from '@/types/food-inspection';
import {
  getCookingRowFields,
  getFreshRowFields,
  getNowTimeString,
  parseIngredient,
} from '@/lib/food-inspection-utils';
import {
  FoodInspectionBatchModal,
  FoodInspectionExcelModal,
  FoodInspectionSettingsModal,
  FoodInspectionSingleEntryModal,
  FoodImportTemplateModal,
} from './FoodInspectionModals';
import {
  ShieldCheck,
  PackageOpen,
  Flame,
  Utensils,
  Thermometer,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
} from 'lucide-react';

export function FoodInspection3StepView() {
  const { currentUser } = useAuth();
  const [store, setStore] = useState<FoodInspectionStore>(() =>
    createInitialFoodInspectionStore()
  );
  const [currentDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const isViewAll = true;
  const [mainTab, setMainTab] = useState<'tab1' | 'tab2' | 'tab3' | 'tab4' | 'import_list'>('tab1');
  const [step1SubTab, setStep1SubTab] = useState<'STEP1_FRESH' | 'STEP1_DRY'>('STEP1_FRESH');
  const [importSubTab, setImportSubTab] = useState<'FRESH' | 'DRY'>('FRESH');
  const [openTime] = useState<string>(() => getNowTimeString());

  // Permission check: Danh sách nhập thực phẩm chỉ Chuyên viên HCNS và Admin mới có thể thấy và chỉnh sửa, xóa
  const canManageImportList = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'hr' || currentUser.role === 'cb') {
      return true;
    }
    const pos = (currentUser.position || '').toLowerCase();
    const dept = (currentUser.department || '').toLowerCase();
    if (
      pos.includes('hành chính nhân sự') ||
      pos.includes('hcns') ||
      dept.includes('hcns') ||
      dept.includes('hành chính nhân sự')
    ) {
      return true;
    }
    return false;
  }, [currentUser]);

  // Modals state
  const [batchModalStep, setBatchModalStep] = useState<FoodInspectionStepKey | null>(null);
  const [singleModalState, setSingleModalState] = useState<{
    stepKey: FoodInspectionStepKey;
    editingItem: FoodInspectionRecord | null;
  } | null>(null);
  const [importTemplateModalState, setImportTemplateModalState] = useState<{
    type: 'FRESH' | 'DRY';
    editingItem: (FreshTemplateItem | DryTemplateItem) | null;
    editingIndex: number | null;
  } | null>(null);
  const [excelModalStep, setExcelModalStep] = useState<FoodInspectionStepKey | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadFromStorage = () => {
    const loaded = storage.getFoodInspectionStore();
    setStore(loaded);
  };

  useEffect(() => {
    loadFromStorage();
    const handleSync = () => setStore(storage.getFoodInspectionStore());
    window.addEventListener('storage', handleSync);
    window.addEventListener('food_inspection_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('food_inspection_updated', handleSync);
    };
  }, []);

  const persistStore = (nextStore: FoodInspectionStore) => {
    setStore(nextStore);
    storage.saveFoodInspectionStore(
      nextStore,
      currentUser ? { id: currentUser.id, name: currentUser.name } : undefined
    );
  };

  const freshRows = useMemo(() => store.STEP1_FRESH || [], [store.STEP1_FRESH]);
  const dryRows = useMemo(() => store.STEP1_DRY || [], [store.STEP1_DRY]);
  const cookRows = useMemo(() => store.STEP2_COOKING || [], [store.STEP2_COOKING]);
  const eatRows = useMemo(() => store.STEP3_SERVING || [], [store.STEP3_SERVING]);
  const sampleRows = useMemo(() => store.STEP4_SAMPLE || [], [store.STEP4_SAMPLE]);

  const handleOpenAddModal = (stepKey: FoodInspectionStepKey) => {
    if (stepKey === 'STEP1_FRESH' || stepKey === 'STEP1_DRY') {
      setBatchModalStep(stepKey);
      return;
    }
    const templateMap: Record<FoodInspectionStepKey, unknown[]> = {
      STEP1_FRESH: store.freshTemplates || [],
      STEP1_DRY: store.dryTemplates || [],
      STEP2_COOKING: store.cookingTemplates || [],
      STEP3_SERVING: store.servingTemplates || [],
      STEP4_SAMPLE: store.sampleFoodTemplates || [],
    };
    if ((templateMap[stepKey] || []).length === 0) {
      setSingleModalState({ stepKey, editingItem: null });
    } else {
      setBatchModalStep(stepKey);
    }
  };

  const handleSaveImportTemplate = (
    type: 'FRESH' | 'DRY',
    item: FreshTemplateItem | DryTemplateItem,
    existingId?: string
  ) => {
    if (type === 'FRESH') {
      const list = [...(store.freshTemplates || [])];
      const editIdx = importTemplateModalState?.editingIndex;
      if (existingId || (editIdx !== null && editIdx !== undefined && editIdx >= 0)) {
        const idx =
          editIdx !== null && editIdx !== undefined && editIdx >= 0
            ? editIdx
            : list.findIndex((t) => t.id === existingId);
        if (idx >= 0) {
          list[idx] = item as FreshTemplateItem;
        } else {
          list.push(item as FreshTemplateItem);
        }
      } else {
        list.push(item as FreshTemplateItem);
      }
      persistStore({
        ...store,
        freshTemplates: list,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const list = [...(store.dryTemplates || [])];
      const editIdx = importTemplateModalState?.editingIndex;
      if (existingId || (editIdx !== null && editIdx !== undefined && editIdx >= 0)) {
        const idx =
          editIdx !== null && editIdx !== undefined && editIdx >= 0
            ? editIdx
            : list.findIndex((t) => t.id === existingId);
        if (idx >= 0) {
          list[idx] = item as DryTemplateItem;
        } else {
          list.push(item as DryTemplateItem);
        }
      } else {
        list.push(item as DryTemplateItem);
      }
      persistStore({
        ...store,
        dryTemplates: list,
        updatedAt: new Date().toISOString(),
      });
    }
    setImportTemplateModalState(null);
    showToast('Đã lưu vào danh sách nhập thực phẩm!');
  };

  const handleDeleteImportTemplate = (type: 'FRESH' | 'DRY', idx: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này khỏi danh sách nhập thực phẩm?')) return;
    if (type === 'FRESH') {
      const next = (store.freshTemplates || []).filter((_, i) => i !== idx);
      persistStore({
        ...store,
        freshTemplates: next,
        updatedAt: new Date().toISOString(),
      });
    } else {
      const next = (store.dryTemplates || []).filter((_, i) => i !== idx);
      persistStore({
        ...store,
        dryTemplates: next,
        updatedAt: new Date().toISOString(),
      });
    }
    showToast('Đã xóa mục khỏi danh sách nhập thực phẩm!');
  };

  // CRUD Handlers
  const handleBatchSubmit = (
    stepKey: FoodInspectionStepKey,
    targetDate: string,
    rows: string[][]
  ) => {
    const prefixMap: Record<FoodInspectionStepKey, string> = {
      STEP1_FRESH: 'TS',
      STEP1_DRY: 'KG',
      STEP2_COOKING: 'CB',
      STEP3_SERVING: 'KA',
      STEP4_SAMPLE: 'LM',
    };
    const prefix = prefixMap[stepKey];
    const timeBase = Date.now();
    const newRecords: FoodInspectionRecord[] = rows.map((row, idx) => {
      const id = `${prefix}_${timeBase}_${idx + 1}`;
      const rec: FoodInspectionRecord = {
        id,
        rowIndex: (store[stepKey]?.length || 0) + idx + 2,
        date: row[1] || targetDate,
      };
      row.forEach((val, cIdx) => {
        rec[`col_${cIdx}`] = cIdx === 0 ? id : val;
      });
      return rec;
    });

    const nextStore: FoodInspectionStore = {
      ...store,
      [stepKey]: [...(store[stepKey] || []), ...newRecords],
      updatedAt: new Date().toISOString(),
    };
    persistStore(nextStore);
    setBatchModalStep(null);
    showToast(`Đã lưu thành công ${newRecords.length} bản ghi!`);
  };

  const handleSingleSave = (
    stepKey: FoodInspectionStepKey,
    rowValues: string[],
    existingId?: string
  ) => {
    const list = [...(store[stepKey] || [])];
    if (existingId) {
      const idx = list.findIndex((r) => r.id === existingId);
      if (idx >= 0) {
        const updated: FoodInspectionRecord = {
          ...list[idx],
          date: rowValues[1] || list[idx].date,
        };
        rowValues.forEach((val, cIdx) => {
          updated[`col_${cIdx}`] = cIdx === 0 ? existingId : val;
        });
        list[idx] = updated;
      }
    } else {
      const newId = `REC_${Date.now()}`;
      const rec: FoodInspectionRecord = {
        id: newId,
        rowIndex: list.length + 2,
        date: rowValues[1] || currentDate,
      };
      rowValues.forEach((val, cIdx) => {
        rec[`col_${cIdx}`] = cIdx === 0 ? newId : val;
      });
      list.push(rec);
    }

    persistStore({
      ...store,
      [stepKey]: list,
      updatedAt: new Date().toISOString(),
    });
    setSingleModalState(null);
    showToast('Lưu bản ghi thành công!');
  };

  const handleDeleteRecord = (stepKey: FoodInspectionStepKey, id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này khỏi danh sách?')) return;
    const nextList = (store[stepKey] || []).filter((r) => r.id !== id);
    persistStore({
      ...store,
      [stepKey]: nextList,
      updatedAt: new Date().toISOString(),
    });
    showToast('Đã xóa bản ghi thành công!');
  };

  const handleSaveSettings = (newSettings: FoodInspectionSettings) => {
    persistStore({
      ...store,
      settings: newSettings,
      updatedAt: new Date().toISOString(),
    });
    setIsSettingsOpen(false);
    showToast('Đã cập nhật thông tin cơ sở!');
  };

  const renderPassBadge = (val?: string) => {
    if (!val) return null;
    const isPass =
      String(val).toLowerCase().includes('đạt') &&
      !String(val).toLowerCase().includes('không');
    return isPass ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Đạt</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold">
        <XCircle className="w-3.5 h-3.5" />
        <span>Không đạt</span>
      </span>
    );
  };

  const renderMiniPass = (val?: string) => {
    if (!val) return null;
    const isPass =
      String(val).toLowerCase().includes('đạt') &&
      !String(val).toLowerCase().includes('không');
    return isPass ? (
      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓ Đạt</span>
    ) : (
      <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">✕ Không đạt</span>
    );
  };

  // Group Step 2 Cooking rows by (date + meal + time) and dishName
  const cookGroupedView = useMemo(() => {
    const groups: {
      key: string;
      date: string;
      meal: string;
      time: string;
      items: { record: FoodInspectionRecord; fields: ReturnType<typeof getCookingRowFields> }[];
    }[] = [];
    let currentGroup: (typeof groups)[0] | null = null;
    for (let i = 0; i < cookRows.length; i++) {
      const r = cookRows[i];
      const f = getCookingRowFields(r);
      const dateKey = r.col_1 || r.date || '';
      const groupKey = `${dateKey}___${f.meal}___${f.mealTime}`;
      if (!currentGroup || currentGroup.key !== groupKey) {
        currentGroup = {
          key: groupKey,
          date: dateKey,
          meal: f.meal,
          time: f.mealTime,
          items: [{ record: r, fields: f }],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push({ record: r, fields: f });
      }
    }
    return groups;
  }, [cookRows]);

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-bold flex items-center gap-2 ${
            toastMsg.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Banner (Hidden when printing) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#107c41] to-[#0b532c] text-white p-4 sm:p-5 shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wide uppercase">
              KIỂM THỰC 3 BƯỚC &amp; LƯU MẪU THỨC ĂN
            </h1>
            <p className="text-xs text-emerald-100">
              Theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs (Hidden when printing) */}
      <div className="flex overflow-x-auto gap-1.5 border-b border-slate-200 dark:border-slate-800 print:hidden">
        {(
          [
            { id: 'tab1', label: 'Bước 1: Trước chế biến', icon: PackageOpen },
            { id: 'tab2', label: 'Bước 2: Khi chế biến', icon: Flame },
            { id: 'tab3', label: 'Bước 3: Trước khi ăn', icon: Utensils },
            { id: 'tab4', label: 'Lưu & Hủy mẫu', icon: Thermometer },
            ...(canManageImportList
              ? [{ id: 'import_list' as const, label: 'Danh sách nhập thực phẩm', icon: ClipboardList }]
              : []),
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = mainTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMainTab(t.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap border-b-3 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-[#107c41] dark:text-emerald-400 border-[#107c41]'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: BƯỚC 1 - TRƯỚC KHI CHẾ BIẾN */}
      {/* ============================================================= */}
      {mainTab === 'tab1' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStep1SubTab('STEP1_FRESH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  step1SubTab === 'STEP1_FRESH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                1. Thực phẩm tươi sống, đông lạnh ({freshRows.length})
              </button>
              <button
                type="button"
                onClick={() => setStep1SubTab('STEP1_DRY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  step1SubTab === 'STEP1_DRY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                2. Thực phẩm khô, gia vị, phụ gia ({dryRows.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExcelModalStep(step1SubTab)}
                className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal(step1SubTab)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {step1SubTab === 'STEP1_FRESH'
                    ? 'Nhập thực phẩm tươi sống'
                    : 'Nhập thực phẩm khô'}
                </span>
              </button>
            </div>
          </div>

          {step1SubTab === 'STEP1_FRESH' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-11">TT</th>
                      {isViewAll && (
                        <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày</th>
                      )}
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Tên thực phẩm</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày giờ nhập<br /><span className="font-normal text-[10px] text-slate-500">(ngày, giờ)</span></th>
                      <th colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2">Khối lượng<br /><span className="font-normal text-[10px] text-slate-500">(kg/lít...)</span></th>
                      <th colSpan={3} className="border border-slate-300 dark:border-slate-700 p-2">Nơi cung cấp</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Chứng từ,<br />hóa đơn</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Giấy ĐK<br />VS thú y</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Giấy<br />kiểm dịch</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-32">Kiểm tra cảm quan<br /><span className="font-normal text-[10px] text-slate-500">(màu, mùi vị, trạng thái...)</span></th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-32">Xét nghiệm nhanh<br /><span className="font-normal text-[10px] text-slate-500">(Vi Sinh, Hóa Lý)</span></th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Biện pháp xử lý/<br />ghi chú</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-16">KL</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-16">ĐVT</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Tên cơ sở</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Địa chỉ, điện thoại</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[130px]">Tên người giao hàng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {freshRows.length === 0 ? (
                      <tr>
                        <td colSpan={isViewAll ? 16 : 15} className="p-6 text-center text-slate-400">
                          Chưa có thực phẩm tươi sống nào được nhập cho ngày này.
                        </td>
                      </tr>
                    ) : (
                      freshRows.map((r, i) => {
                        const f = getFreshRowFields(r);
                        return (
                          <tr key={r.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                            {isViewAll && (
                              <td className="p-2.5 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                                  {r.col_1 || r.date}
                                </span>
                              </td>
                            )}
                            <td className="p-2.5 font-bold text-slate-900 dark:text-white">{f.name}</td>
                            <td className="p-2.5 text-center text-slate-500">{f.time}</td>
                            <td className="p-2.5 text-center font-bold text-blue-600">{f.qty}</td>
                            <td className="p-2.5 text-center text-slate-500 font-semibold">{f.unit}</td>
                            <td className="p-2.5">{f.supplier}</td>
                            <td className="p-2.5 text-slate-500">{f.addr}</td>
                            <td className="p-2.5">{f.deliverer}</td>
                            <td className="p-2.5 text-center">{f.doc}</td>
                            <td className="p-2.5 text-center">{f.vet}</td>
                            <td className="p-2.5 text-center">{f.quar}</td>
                            <td className="p-2.5 text-center">{renderPassBadge(f.sense)}</td>
                            <td className="p-2.5 text-center">{f.test}</td>
                            <td className="p-2.5">{f.handle}</td>
                            <td className="p-2.5 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSingleModalState({ stepKey: 'STEP1_FRESH', editingItem: r })}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                                  title="Sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord('STEP1_FRESH', r.id)}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-11">TT</th>
                      {isViewAll && (
                        <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày</th>
                      )}
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Tên thực phẩm</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên cơ sở sản xuất</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Địa chỉ sản xuất</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Thời gian nhập<br /><span className="font-normal text-[10px] text-slate-500">(ngày/giờ)</span></th>
                      <th colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2">Khối lượng</th>
                      <th colSpan={3} className="border border-slate-300 dark:border-slate-700 p-2">Nơi cung cấp</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-28">Hạn sử dụng</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-28">Điều kiện bảo quản</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Chứng từ,<br />hóa đơn</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-32">Kiểm tra cảm quan<br /><span className="font-normal text-[10px] text-slate-500">(nhãn, bao bì, bảo quản...)</span></th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Biện pháp xử lý/<br />ghi chú</th>
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-16">KL</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-16">ĐVT</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Tên cơ sở</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[120px]">Tên chủ giao hàng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Địa chỉ, điện thoại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dryRows.length === 0 ? (
                      <tr>
                        <td colSpan={isViewAll ? 17 : 16} className="p-6 text-center text-slate-400">
                          Chưa có thực phẩm khô/gia vị nào được nhập cho ngày này.
                        </td>
                      </tr>
                    ) : (
                      dryRows.map((r, i) => (
                        <tr key={r.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                          {isViewAll && (
                            <td className="p-2.5 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                                {r.col_1 || r.date}
                              </span>
                            </td>
                          )}
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{r.col_3 || ''}</td>
                          <td className="p-2.5 font-semibold">{r.col_4 || ''}</td>
                          <td className="p-2.5 text-slate-500">{r.col_5 || ''}</td>
                          <td className="p-2.5 text-center">{r.col_2 || ''}</td>
                          <td className="p-2.5 text-center font-bold text-blue-600">{r.col_11 || ''}</td>
                          <td className="p-2.5 text-center text-slate-500">{r.col_10 || ''}</td>
                          <td className="p-2.5">{r.col_6 || ''}</td>
                          <td className="p-2.5 font-semibold">{r.col_7 || ''}</td>
                          <td className="p-2.5 text-slate-500">
                            <div>{r.col_8 || ''}</div>
                            {r.col_9 && <div className="text-blue-600">{r.col_9}</div>}
                          </td>
                          <td className="p-2.5 text-center">{r.col_12 || ''}</td>
                          <td className="p-2.5 text-center">{r.col_13 || ''}</td>
                          <td className="p-2.5 text-center">
                            <div>{r.col_14 || ''}</div>
                            {r.col_15 && <div className="text-[11px] text-slate-400">{r.col_15}</div>}
                          </td>
                          <td className="p-2.5 text-center">{renderPassBadge(r.col_16)}</td>
                          <td className="p-2.5">{r.col_17 || ''}</td>
                          <td className="p-2.5 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setSingleModalState({ stepKey: 'STEP1_DRY', editingItem: r })}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord('STEP1_DRY', r.id)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: BƯỚC 2 - KHI CHẾ BIẾN THỨC ĂN */}
      {/* ============================================================= */}
      {mainTab === 'tab2' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Mẫu số 2: Kiểm tra khi chế biến thức ăn</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExcelModalStep('STEP2_COOKING')}
                className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('STEP2_COOKING')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm món đang chế biến</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-11">TT</th>
                    {isViewAll && (
                      <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày</th>
                    )}
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-28">Ca/ bữa ăn<br /><span className="font-normal text-[10px] text-slate-500">(bữa ăn, giờ ăn)</span></th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên món ăn</th>
                    <th colSpan={2} className="border border-slate-300 dark:border-slate-700 p-2">Nguyên liệu chính để chế biến<br /><span className="font-normal text-[10px] text-slate-500">(Tên, Số lượng...)</span></th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Số lượng/<br />số suất ăn</th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Thời gian sơ chế xong<br /><span className="font-normal text-[10px] text-slate-500">(ngày, giờ)</span></th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-24">Thời gian chế biến xong<br /><span className="font-normal text-[10px] text-slate-500">(ngày, giờ)</span></th>
                    <th colSpan={3} className="border border-slate-300 dark:border-slate-700 p-2">Kiểm tra điều kiện vệ sinh</th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-32">Kiểm tra cảm quan thức ăn<br /><span className="font-normal text-[10px] text-slate-500">(Đạt/không đạt)</span></th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Biện pháp xử lý/<br />Ghi chú</th>
                    <th rowSpan={2} className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[130px]">Tên nguyên liệu</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Số lượng</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Người tham gia chế biến</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Trang thiết bị dụng cụ</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Khu vực chế biến &amp; phụ trợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cookRows.length === 0 ? (
                    <tr>
                      <td colSpan={isViewAll ? 15 : 14} className="p-6 text-center text-slate-400">
                        Chưa có món ăn nào được kiểm tra khi nấu cho ngày này.
                      </td>
                    </tr>
                  ) : (
                    cookGroupedView.map((g, gIdx) => {
                      const dishGroups: {
                        key: string;
                        dishName: string;
                        items: typeof g.items;
                      }[] = [];
                      let currDish: (typeof dishGroups)[0] | null = null;
                      for (let j = 0; j < g.items.length; j++) {
                        const it = g.items[j];
                        const dName = (it.fields.dishName || '').trim();
                        const dKey = dName.toLowerCase();
                        if (!dKey || !currDish || currDish.key !== dKey) {
                          currDish = { key: dKey, dishName: dName, items: [it] };
                          dishGroups.push(currDish);
                        } else {
                          currDish.items.push(it);
                        }
                      }
                      const mealRowspan = g.items.length;
                      let isFirstMealRow = true;

                      return dishGroups.map((dg, dgIdx) => {
                        const dishRowspan = dg.items.length;
                        return dg.items.map((it, dIdx) => {
                          const r = it.record;
                          const f = it.fields;
                          const isFirstDishRow = dIdx === 0;
                          const showMealCells = isFirstMealRow;
                          isFirstMealRow = false;
                          const parsedIng =
                            f.ingName || f.ingQty
                              ? { names: f.ingName || '', qtys: f.ingQty || '' }
                              : parseIngredient(f.ingCombined);

                          return (
                            <tr key={r.id || `${gIdx}-${dgIdx}-${dIdx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              {showMealCells && (
                                <>
                                  <td rowSpan={mealRowspan} className="p-2.5 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800 align-middle">
                                    {gIdx + 1}
                                  </td>
                                  {isViewAll && (
                                    <td rowSpan={mealRowspan} className="p-2.5 text-center whitespace-nowrap border-r border-slate-100 dark:border-slate-800 align-middle">
                                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                                        {r.col_1 || r.date}
                                      </span>
                                    </td>
                                  )}
                                  <td rowSpan={mealRowspan} className="p-2.5 text-center border-r border-slate-100 dark:border-slate-800 align-middle">
                                    {g.meal && (
                                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold text-[11px]">
                                        {g.meal}
                                      </span>
                                    )}
                                    {g.time && (
                                      <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center justify-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{g.time}</span>
                                      </div>
                                    )}
                                  </td>
                                </>
                              )}
                              {isFirstDishRow && (
                                <td rowSpan={dishRowspan} className="p-2.5 font-bold text-slate-900 dark:text-white align-middle">
                                  {f.dishName || ''}
                                </td>
                              )}
                              <td className="p-2.5 font-semibold align-middle">{parsedIng.names || ''}</td>
                              <td className="p-2.5 text-center font-bold text-blue-600 align-middle">{parsedIng.qtys || ''}</td>
                              {isFirstDishRow && (
                                <>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center align-middle">
                                    {f.servings ? (
                                      <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold">
                                        {f.servings} suất
                                      </span>
                                    ) : null}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center text-slate-500 align-middle">
                                    {f.prepTime || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center font-bold align-middle">
                                    {f.cookTime || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center align-middle">
                                    {renderMiniPass(f.hygP)}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center align-middle">
                                    {renderMiniPass(f.hygE)}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center align-middle">
                                    {renderMiniPass(f.hygA)}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 text-center align-middle">
                                    {renderPassBadge(f.sense)}
                                  </td>
                                  <td rowSpan={dishRowspan} className="p-2.5 align-middle">
                                    {f.handle || ''}
                                  </td>
                                </>
                              )}
                              <td className="p-2.5 text-center print:hidden align-middle">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSingleModalState({ stepKey: 'STEP2_COOKING', editingItem: r })}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                    title="Sửa"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRecord('STEP2_COOKING', r.id)}
                                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Xóa"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: BƯỚC 3 - TRƯỚC KHI ĂN */}
      {/* ============================================================= */}
      {mainTab === 'tab3' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mẫu số 3: Kiểm tra trước khi ăn</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExcelModalStep('STEP3_SERVING')}
                className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('STEP3_SERVING')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm món trước khi ăn</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-11">TT</th>
                    {isViewAll && (
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày</th>
                    )}
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-32">Ca/ bữa ăn<br /><span className="font-normal text-[10px] text-slate-500">(bữa ăn, giờ ăn)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Tên món ăn</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Số lượng<br />suất ăn</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Thời gian chia món xong<br /><span className="font-normal text-[10px] text-slate-500">(ngày, giờ)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Thời gian bắt đầu ăn<br /><span className="font-normal text-[10px] text-slate-500">(ngày, giờ)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[180px]">Dụng cụ chia, chứa đựng, che đậy, bảo quản thức ăn</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-32">Kiểm tra cảm quan món ăn<br /><span className="font-normal text-[10px] text-slate-500">(Đạt/Không đạt)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Biện pháp xử lý/<br />Ghi chú</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eatRows.length === 0 ? (
                    <tr>
                      <td colSpan={isViewAll ? 11 : 10} className="p-6 text-center text-slate-400">
                        Chưa có món ăn nào được kiểm tra trước khi ăn cho ngày này.
                      </td>
                    </tr>
                  ) : (
                    eatRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                        {isViewAll && (
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                              {r.col_1 || r.date}
                            </span>
                          </td>
                        )}
                        <td className="p-2.5 text-center font-semibold">{r.col_2 || ''}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{r.col_3 || ''}</td>
                        <td className="p-2.5 text-center font-bold">{r.col_4 || ''}</td>
                        <td className="p-2.5 text-center">{r.col_5 || ''}</td>
                        <td className="p-2.5 text-center font-bold text-blue-600">{r.col_6 || ''}</td>
                        <td className="p-2.5">{r.col_7 || ''}</td>
                        <td className="p-2.5 text-center">{renderPassBadge(r.col_8)}</td>
                        <td className="p-2.5">{r.col_9 || ''}</td>
                        <td className="p-2.5 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSingleModalState({ stepKey: 'STEP3_SERVING', editingItem: r })}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord('STEP3_SERVING', r.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: THEO DÕI LƯU & HỦY THỨC ĂN LƯU */}
      {/* ============================================================= */}
      {mainTab === 'tab4' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-600" />
              <span>Mẫu theo dõi lưu và hủy thức ăn lưu</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExcelModalStep('STEP4_SAMPLE')}
                className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Nhập từ Excel</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddModal('STEP4_SAMPLE')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mẫu lưu thức ăn</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-11">TT</th>
                    {isViewAll && (
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Ngày</th>
                    )}
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên mẫu thức ăn</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Bữa ăn<br /><span className="font-normal text-[10px] text-slate-500">(giờ ăn...)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Số lượng<br />suất ăn</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Khối lượng/ thể tích<br /><span className="font-normal text-[10px] text-slate-500">(gam/ml)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Dụng cụ chứa mẫu thức ăn lưu</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Nhiệt độ bảo quản<br /><span className="font-normal text-[10px] text-slate-500">(°C)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-32">Thời gian lấy mẫu<br /><span className="font-normal text-[10px] text-slate-500">(giờ, ngày, tháng, năm)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-32">Thời gian hủy mẫu<br /><span className="font-normal text-[10px] text-slate-500">(giờ, ngày, tháng, năm)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Ghi chú<br /><span className="font-normal text-[10px] text-slate-500">(chất lượng mẫu...)</span></th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Người lưu mẫu</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Người hủy mẫu</th>
                    <th className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sampleRows.length === 0 ? (
                    <tr>
                      <td colSpan={isViewAll ? 14 : 13} className="p-6 text-center text-slate-400">
                        Chưa có mẫu lưu thức ăn nào cho ngày này.
                      </td>
                    </tr>
                  ) : (
                    sampleRows.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                        {isViewAll && (
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                              {r.col_1 || r.date}
                            </span>
                          </td>
                        )}
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{r.col_3 || ''}</td>
                        <td className="p-2.5 text-center">{r.col_2 || ''}</td>
                        <td className="p-2.5 text-center font-semibold">{r.col_4 || ''}</td>
                        <td className="p-2.5 text-center font-bold text-rose-600">{r.col_5 || ''}</td>
                        <td className="p-2.5">{r.col_6 || ''}</td>
                        <td className="p-2.5 text-center font-semibold text-cyan-700 dark:text-cyan-400">{r.col_7 || ''}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">{r.col_8 || ''}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600 whitespace-nowrap">{r.col_9 || ''}</td>
                        <td className="p-2.5 text-slate-500">{r.col_10 || ''}</td>
                        <td className="p-2.5 text-center font-medium">{r.col_11 || ''}</td>
                        <td className="p-2.5 text-center font-medium">{r.col_12 || ''}</td>
                        <td className="p-2.5 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSingleModalState({ stepKey: 'STEP4_SAMPLE', editingItem: r })}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              title="Sửa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord('STEP4_SAMPLE', r.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB DANH SÁCH NHẬP THỰC PHẨM (CHỈ CHUYÊN VIÊN HCNS & ADMIN) */}
      {/* ============================================================= */}
      {mainTab === 'import_list' && canManageImportList && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setImportSubTab('FRESH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  importSubTab === 'FRESH'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                1. Thực phẩm tươi sống ({(store.freshTemplates || []).length})
              </button>
              <button
                type="button"
                onClick={() => setImportSubTab('DRY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  importSubTab === 'DRY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                2. Thực phẩm khô ({(store.dryTemplates || []).length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setImportTemplateModalState({
                    type: importSubTab,
                    editingItem: null,
                    editingIndex: null,
                  })
                }
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {importSubTab === 'FRESH'
                    ? 'Thêm thực phẩm tươi sống'
                    : 'Thêm thực phẩm khô'}
                </span>
              </button>
            </div>
          </div>

          {importSubTab === 'FRESH' ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-12">STT</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Ngày nhập hàng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Tên thực phẩm</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Khối lượng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Đơn vị tính</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên cơ sở cung cấp</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Địa chỉ/điện thoại</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Tên người giao hàng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Chứng từ/hóa đơn</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Giấy ĐK VS thú y</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Giấy kiểm dịch</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(store.freshTemplates || []).length === 0 ? (
                      <tr>
                        <td colSpan={12} className="p-6 text-center text-slate-400">
                          Chưa có thực phẩm tươi sống nào trong danh sách nhập thực phẩm.
                        </td>
                      </tr>
                    ) : (
                      (store.freshTemplates || []).map((item, i) => (
                        <tr key={item.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {item.importDate ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                                {item.importDate}
                              </span>
                            ) : (
                              ''
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.name || ''}</td>
                          <td className="p-2.5 text-center font-bold text-blue-600">{item.qty || ''}</td>
                          <td className="p-2.5 text-center text-slate-500 font-semibold">{item.unit || ''}</td>
                          <td className="p-2.5">{item.supplier || ''}</td>
                          <td className="p-2.5 text-slate-500">{item.addr || ''}</td>
                          <td className="p-2.5">{item.deliverer || ''}</td>
                          <td className="p-2.5 text-center">{item.doc || ''}</td>
                          <td className="p-2.5 text-center">{item.vet || ''}</td>
                          <td className="p-2.5 text-center">{item.quar || ''}</td>
                          <td className="p-2.5 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setImportTemplateModalState({
                                    type: 'FRESH',
                                    editingItem: item,
                                    editingIndex: i,
                                  })
                                }
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteImportTemplate('FRESH', i)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-center">
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-12">STT</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-28">Ngày nhập hàng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Tên thực phẩm</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên cơ sở sản xuất</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Địa chỉ sản xuất</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Khối lượng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-24">Đơn vị tính</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[150px]">Tên cơ sở cung cấp</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[140px]">Tên chủ giao hàng</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 text-left min-w-[160px]">Địa chỉ/điện thoại</th>
                      <th className="border border-slate-300 dark:border-slate-700 p-2 w-20 print:hidden">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(store.dryTemplates || []).length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400">
                          Chưa có thực phẩm khô nào trong danh sách nhập thực phẩm.
                        </td>
                      </tr>
                    ) : (
                      (store.dryTemplates || []).map((item, i) => (
                        <tr key={item.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {item.importDate ? (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">
                                {item.importDate}
                              </span>
                            ) : (
                              ''
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{item.name || ''}</td>
                          <td className="p-2.5 font-semibold">{item.producer || ''}</td>
                          <td className="p-2.5 text-slate-500">{item.prod_addr || ''}</td>
                          <td className="p-2.5 text-center font-bold text-blue-600">{item.qty || ''}</td>
                          <td className="p-2.5 text-center text-slate-500 font-semibold">{item.unit || ''}</td>
                          <td className="p-2.5">{item.supplier || ''}</td>
                          <td className="p-2.5 font-semibold">{item.deliverer || ''}</td>
                          <td className="p-2.5 text-slate-500">{item.addr || ''}</td>
                          <td className="p-2.5 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setImportTemplateModalState({
                                    type: 'DRY',
                                    editingItem: item,
                                    editingIndex: i,
                                  })
                                }
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                                title="Sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteImportTemplate('DRY', i)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <FoodImportTemplateModal
        isOpen={!!importTemplateModalState}
        type={importTemplateModalState?.type || 'FRESH'}
        editingItem={importTemplateModalState?.editingItem || null}
        onClose={() => setImportTemplateModalState(null)}
        onSave={handleSaveImportTemplate}
      />
      <FoodInspectionBatchModal
        isOpen={!!batchModalStep}
        stepKey={batchModalStep || 'STEP1_FRESH'}
        defaultDate={currentDate}
        openTime={openTime}
        inspector={store.settings.inspector}
        freshTemplates={store.freshTemplates}
        dryTemplates={store.dryTemplates}
        cookingTemplates={store.cookingTemplates}
        servingTemplates={store.servingTemplates}
        sampleFoodTemplates={store.sampleFoodTemplates}
        onClose={() => setBatchModalStep(null)}
        onOpenSingleAdd={() => {
          if (batchModalStep) {
            setSingleModalState({ stepKey: batchModalStep, editingItem: null });
          }
        }}
        onSubmitBatch={handleBatchSubmit}
      />

      <FoodInspectionSingleEntryModal
        isOpen={!!singleModalState}
        stepKey={singleModalState?.stepKey || 'STEP1_FRESH'}
        editingItem={singleModalState?.editingItem || null}
        targetDate={currentDate}
        inspector={store.settings.inspector}
        onClose={() => setSingleModalState(null)}
        onSave={handleSingleSave}
      />

      <FoodInspectionExcelModal
        isOpen={!!excelModalStep}
        initialStep={excelModalStep || 'STEP1_FRESH'}
        defaultDate={currentDate}
        inspector={store.settings.inspector}
        onClose={() => setExcelModalStep(null)}
        onConfirmImport={(step, rows) => {
          handleBatchSubmit(step, rows[0]?.[1] || currentDate, rows);
          setExcelModalStep(null);
        }}
      />

      <FoodInspectionSettingsModal
        isOpen={isSettingsOpen}
        settings={store.settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
