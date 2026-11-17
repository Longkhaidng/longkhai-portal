'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FoodInspectionRecord,
  FoodInspectionSettings,
  FoodInspectionStepKey,
  FreshTemplateItem,
  DryTemplateItem,
  CookingTemplateItem,
  ServingTemplateItem,
  SampleFoodTemplateItem,
} from '@/types/food-inspection';
import {
  add24Hours,
  addMinutesToTime,
  downloadFoodImportTemplateSampleExcel,
  downloadFoodInspectionSampleExcel,
  formatDateTimeDisplay,
  formatVNDate,
  getCookingRowFields,
  getFreshRowFields,
  getNowTimeString,
  parseFoodImportTemplateRows,
  parseIngredient,
  parseToDateTimeLocal,
  processParsedInspectionRows,
} from '@/lib/food-inspection-utils';
import {
  X,
  Check,
  CheckCheck,
  FileSpreadsheet,
  Download,
  Upload,
  ClipboardPaste,
  Save,
  Sliders,
  Clock,
  Lock,
  Plus,
} from 'lucide-react';

// =====================================================================
// 1. EXCEL IMPORT & PASTE MODAL
// =====================================================================
interface ExcelImportModalProps {
  isOpen: boolean;
  initialStep: FoodInspectionStepKey;
  defaultDate: string;
  inspector: string;
  onClose: () => void;
  onConfirmImport: (step: FoodInspectionStepKey, rows: string[][]) => void;
}

export function FoodInspectionExcelModal({
  isOpen,
  initialStep,
  defaultDate,
  inspector,
  onClose,
  onConfirmImport,
}: ExcelImportModalProps) {
  const [step, setStep] = useState<FoodInspectionStepKey>(initialStep);
  const [targetDate, setTargetDate] = useState<string>(defaultDate);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setTargetDate(defaultDate);
      setParsedRows([]);
      setPasteText('');
    }
  }, [isOpen, initialStep, defaultDate]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });
        if (!jsonRows || jsonRows.length <= 1) {
          alert('File Excel không có dữ liệu hoặc chỉ có dòng tiêu đề!');
          return;
        }
        const formatted = processParsedInspectionRows(
          jsonRows.slice(1),
          step,
          targetDate,
          inspector
        );
        if (!formatted.length) {
          alert('Không có dữ liệu hợp lệ nào được tìm thấy trong file!');
          return;
        }
        setParsedRows(formatted);
      } catch (err: any) {
        alert('Lỗi khi đọc file Excel: ' + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      alert('Vui lòng dán nội dung từ Excel vào ô trước!');
      return;
    }
    const rawRows = pasteText
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('\t'));
    const formatted = processParsedInspectionRows(rawRows, step, targetDate, inspector);
    if (!formatted.length) {
      alert('Không tìm thấy dòng dữ liệu hợp lệ nào!');
      return;
    }
    setParsedRows(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-700 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập Dữ Liệu Từ File Excel Hoặc Dán Trực Tiếp</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bước cần nhập dữ liệu:
              </label>
              <select
                value={step}
                onChange={(e) => {
                  setStep(e.target.value as FoodInspectionStepKey);
                  setParsedRows([]);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="STEP1_FRESH">Bước 1.1: Thực phẩm tươi sống, đông lạnh</option>
                <option value="STEP1_DRY">Bước 1.2: Thực phẩm khô, gia vị, phụ gia</option>
                <option value="STEP2_COOKING">Bước 2: Khi chế biến thức ăn</option>
                <option value="STEP3_SERVING">Bước 3: Trước khi ăn</option>
                <option value="STEP4_SAMPLE">Lưu &amp; Hủy mẫu thức ăn</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gán ngày kiểm tra:
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              />
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                type="button"
                onClick={() => downloadFoodInspectionSampleExcel(step)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải file mẫu Excel</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                mode === 'upload'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Cách 1: Tải tệp Excel (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                mode === 'paste'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Cách 2: Sao chép &amp; Dán ô từ Excel (Ctrl+V)</span>
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Nhấp vào đây để chọn tệp Excel từ máy tính của bạn
              </div>
              <div className="text-slate-500 mt-0.5">Hỗ trợ định dạng: .xlsx, .xls, .csv</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-500">
                Mở Excel, quét chọn vùng dữ liệu rồi nhấn <b>Ctrl + C</b>, sau đó nhấp vào ô bên dưới và nhấn <b>Ctrl + V</b>:
              </p>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Dán nội dung sao chép từ Excel vào đây..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
                >
                  Phân tích dữ liệu đã dán
                </button>
              </div>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                Xem trước dữ liệu đọc được ({parsedRows.length} dòng):
              </div>
              <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-center">TT</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Ngày</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Tên TP / Món ăn</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Chi tiết / Khối lượng</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Đánh giá / Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center font-bold">{idx + 1}</td>
                        <td className="p-2">{r[1] || ''}</td>
                        <td className="p-2 font-bold">
                          {step === 'STEP1_FRESH' ? r[2] : r[3] || r[4] || ''}
                        </td>
                        <td className="p-2">
                          {step === 'STEP1_FRESH'
                            ? `${r[4] || ''} ${r[5] || ''} (${r[6] || ''})`
                            : step === 'STEP1_DRY'
                            ? `${r[11] || ''} ${r[10] || ''} (${r[6] || ''})`
                            : step === 'STEP2_COOKING'
                            ? `${r[4] || ''} ${r[5] || ''} - ${r[6] || ''} suất`
                            : `${r[4] || ''} suất`}
                        </td>
                        <td className="p-2">
                          {step === 'STEP1_FRESH'
                            ? `${r[12] || ''} - ${r[14] || ''}`
                            : step === 'STEP1_DRY'
                            ? `${r[16] || ''} - ${r[17] || ''}`
                            : step === 'STEP2_COOKING'
                            ? `${r[12] || ''} - ${r[13] || ''}`
                            : step === 'STEP3_SERVING'
                            ? `${r[8] || ''} - ${r[9] || ''}`
                            : `${r[8] || ''} → ${r[9] || ''}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={() => onConfirmImport(step, parsedRows)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận nhập vào bảng</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 2. SETTINGS MODAL
// =====================================================================
interface SettingsModalProps {
  isOpen: boolean;
  settings: FoodInspectionSettings;
  onClose: () => void;
  onSave: (newSettings: FoodInspectionSettings) => void;
}

export function FoodInspectionSettingsModal({
  isOpen,
  settings,
  onClose,
  onSave,
}: SettingsModalProps) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [inspector, setInspector] = useState(settings.inspector);
  const [location, setLocation] = useState(settings.location);

  React.useEffect(() => {
    if (isOpen) {
      setCompanyName(settings.companyName);
      setInspector(settings.inspector);
      setLocation(settings.location);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="bg-slate-800 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <span>Cài Đặt Thông Tin Cơ Sở</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({
              companyName: companyName.trim(),
              inspector: inspector.trim(),
              location: location.trim(),
            });
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên cơ sở / Chi nhánh:
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Người kiểm tra mặc định:
            </label>
            <input
              type="text"
              required
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Địa điểm kiểm tra:
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              Lưu cài đặt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// 3. SINGLE RECORD ADD / EDIT MODAL
// =====================================================================
interface SingleEntryModalProps {
  isOpen: boolean;
  stepKey: FoodInspectionStepKey;
  editingItem: FoodInspectionRecord | null;
  targetDate: string;
  inspector: string;
  noteOnly?: boolean;
  onClose: () => void;
  onSave: (stepKey: FoodInspectionStepKey, rowValues: string[], existingId?: string) => void;
}

export function FoodInspectionSingleEntryModal({
  isOpen,
  stepKey,
  editingItem,
  targetDate,
  inspector,
  noteOnly = false,
  onClose,
  onSave,
}: SingleEntryModalProps) {
  const isEdit = !!editingItem;

  const [fDate, setFDate] = useState('');
  const [fName, setFName] = useState('');
  const [fTime, setFTime] = useState('');
  const [fQty, setFQty] = useState('');
  const [fUnit, setFUnit] = useState('');
  const [fSupplier, setFSupplier] = useState('');
  const [fAddr, setFAddr] = useState('');
  const [fDeliverer, setFDeliverer] = useState('');
  const [fDoc, setFDoc] = useState('');
  const [fVet, setFVet] = useState('');
  const [fQuar, setFQuar] = useState('');
  const [fSense, setFSense] = useState('');
  const [fTest, setFTest] = useState('');
  const [fHandle, setFHandle] = useState('');

  // Extra fields for Dry / Cooking / Serving / Sample
  const [fProducer, setFProducer] = useState('');
  const [fProdAddr, setFProdAddr] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fExp, setFExp] = useState('');
  const [fStorage, setFStorage] = useState('');
  const [fCert, setFCert] = useState('');

  // Cooking / Serving / Sample
  const [fMeal, setFMeal] = useState('');
  const [fMealTime, setFMealTime] = useState('');
  const [fIngName, setFIngName] = useState('');
  const [fIngQty, setFIngQty] = useState('');
  const [fServings, setFServings] = useState('');
  const [fPrepTime, setFPrepTime] = useState('');
  const [fCookTime, setFCookTime] = useState('');
  const [fHygP, setFHygP] = useState('');
  const [fHygE, setFHygE] = useState('');
  const [fHygA, setFHygA] = useState('');
  const [fNote, setFNote] = useState('');
  const [fFinishTime, setFFinishTime] = useState('');
  const [fStartEatTime, setFStartEatTime] = useState('');
  const [fContainer, setFContainer] = useState('');
  const [fWeight, setFWeight] = useState('');
  const [fBox, setFBox] = useState('');
  const [fTemp, setFTemp] = useState('');
  const [fTimeTake, setFTimeTake] = useState('');
  const [fTimeDestroy, setFTimeDestroy] = useState('');
  const [fPersonStore, setFPersonStore] = useState('');
  const [fPersonDestroy, setFPersonDestroy] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const realNowTime = getNowTimeString();
    const realToday = targetDate || new Date().toISOString().slice(0, 10);
    setFDate(editingItem?.col_1 || editingItem?.date || realToday);
    if (stepKey === 'STEP1_FRESH') {
      const f = editingItem ? getFreshRowFields(editingItem) : null;
      setFName(f?.name || '');
      setFTime(f?.time || realNowTime);
      setFQty(f?.qty || '');
      setFUnit(f?.unit || '');
      setFSupplier(f?.supplier || '');
      setFAddr(f?.addr || '');
      setFDeliverer(f?.deliverer || '');
      setFDoc(f?.doc || '');
      setFVet(f?.vet || '');
      setFQuar(f?.quar || '');
      setFSense(f?.sense || '');
      setFTest(f?.test || '');
      setFHandle(f?.handle || '');
    } else if (stepKey === 'STEP1_DRY') {
      setFName(editingItem?.col_3 || '');
      setFTime(editingItem?.col_2 || realNowTime);
      setFProducer(editingItem?.col_4 || '');
      setFProdAddr(editingItem?.col_5 || '');
      setFSupplier(editingItem?.col_6 || '');
      setFDeliverer(editingItem?.col_7 || '');
      setFAddr(editingItem?.col_8 || '');
      setFPhone(editingItem?.col_9 || '');
      setFUnit(editingItem?.col_10 || '');
      setFQty(editingItem?.col_11 || '');
      setFExp(editingItem?.col_12 || '');
      setFStorage(editingItem?.col_13 || '');
      setFDoc(editingItem?.col_14 || '');
      setFCert(editingItem?.col_15 || '');
      setFSense(editingItem?.col_16 || '');
      setFHandle(editingItem?.col_17 || '');
    } else if (stepKey === 'STEP2_COOKING') {
      const c = editingItem ? getCookingRowFields(editingItem) : null;
      const parsed = c && (c.ingName || c.ingQty)
        ? { names: c.ingName, qtys: c.ingQty }
        : parseIngredient(c?.ingredients || '');
      setFMeal(c?.meal || '');
      setFMealTime(c?.mealTime || '');
      setFName(c?.dishName || '');
      setFIngName(parsed.names || '');
      setFIngQty(parsed.qtys || '');
      setFServings(c?.servings || '');
      setFPrepTime(c?.prepTime || (editingItem ? '' : realNowTime));
      setFCookTime(c?.cookTime || '');
      setFHygP(c?.hygienePerson || '');
      setFHygE(c?.hygieneEquipment || '');
      setFHygA(c?.hygieneArea || '');
      setFSense(c?.senseStatus || '');
      setFHandle(c?.handle || '');
      setFNote(c?.note || '');
    } else if (stepKey === 'STEP3_SERVING') {
      let mName = editingItem?.col_2 || '';
      let mTime = editingItem?.col_6 || '';
      if (mName.includes('(') && mName.includes(')')) {
        const m = mName.match(/^(.*?)\s*\((.*?)\)$/);
        if (m) {
          mName = m[1].trim();
          if (m[2].trim()) mTime = m[2].trim();
        }
      }
      setFMeal(mName);
      setFName(editingItem?.col_3 || '');
      setFServings(editingItem?.col_4 || '');
      setFFinishTime(editingItem?.col_5 || (editingItem ? '' : realNowTime));
      setFStartEatTime(editingItem?.col_6 || mTime || '');
      setFContainer(editingItem?.col_7 || '');
      setFSense(editingItem?.col_8 || '');
      setFHandle(editingItem?.col_9 || '');
    } else if (stepKey === 'STEP4_SAMPLE') {
      const takeDt = editingItem?.col_8 ? parseToDateTimeLocal(editingItem.col_8, targetDate, '') : `${realToday}T${realNowTime}`;
      const destDt = editingItem?.col_9 ? parseToDateTimeLocal(editingItem.col_9, null, null, takeDt) : add24Hours(takeDt);
      setFName(editingItem?.col_3 || '');
      setFMeal(editingItem?.col_2 || '');
      setFServings(editingItem?.col_4 || '');
      setFWeight(editingItem?.col_5 || '');
      setFBox(editingItem?.col_6 || '');
      setFTemp(editingItem?.col_7 || '');
      setFTimeTake(takeDt);
      setFTimeDestroy(destDt);
      setFHandle(editingItem?.col_10 || '');
      setFPersonStore(editingItem?.col_11 || '');
      setFPersonDestroy(editingItem?.col_12 || '');
    }
  }, [isOpen, stepKey, editingItem, targetDate, inspector]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingItem?.id || '';
    const recDate = fDate.trim();

    if (stepKey === 'STEP1_FRESH') {
      onSave(
        stepKey,
        [
          id,
          recDate,
          fName.trim(),
          fTime.trim(),
          fQty.trim(),
          fUnit.trim(),
          fSupplier.trim(),
          fAddr.trim(),
          fDeliverer.trim(),
          fDoc.trim(),
          fVet.trim(),
          fQuar.trim(),
          fSense,
          fTest.trim(),
          fHandle.trim(),
          inspector,
          '',
        ],
        id || undefined
      );
    } else if (stepKey === 'STEP1_DRY') {
      onSave(
        stepKey,
        [
          id,
          recDate,
          fTime.trim(),
          fName.trim(),
          fProducer.trim(),
          fProdAddr.trim(),
          fSupplier.trim(),
          fDeliverer.trim(),
          fAddr.trim(),
          fPhone.trim(),
          fUnit.trim(),
          fQty.trim(),
          fExp.trim(),
          fStorage.trim(),
          fDoc.trim(),
          fCert.trim(),
          fSense,
          fHandle.trim(),
          inspector,
          '',
        ],
        id || undefined
      );
    } else if (stepKey === 'STEP2_COOKING') {
      const combinedMeal = fMealTime.trim() ? `${fMeal.trim()} ${fMealTime.trim()}` : fMeal.trim();
      onSave(
        stepKey,
        [
          id,
          recDate,
          combinedMeal,
          fName.trim(),
          fIngName.trim(),
          fIngQty.trim(),
          fServings.trim(),
          fPrepTime.trim(),
          fCookTime.trim(),
          fHygP,
          fHygE,
          fHygA,
          fSense,
          fHandle.trim(),
          inspector,
          fNote.trim(),
        ],
        id || undefined
      );
    } else if (stepKey === 'STEP3_SERVING') {
      const mealVal = fStartEatTime.trim() ? `${fMeal.trim()} (${fStartEatTime.trim()})` : fMeal.trim();
      onSave(
        stepKey,
        [
          id,
          recDate,
          mealVal,
          fName.trim(),
          fServings.trim(),
          fFinishTime.trim(),
          fStartEatTime.trim(),
          fContainer.trim(),
          fSense,
          fHandle.trim(),
          inspector,
          '',
        ],
        id || undefined
      );
    } else if (stepKey === 'STEP4_SAMPLE') {
      onSave(
        stepKey,
        [
          id,
          recDate,
          fMeal.trim(),
          fName.trim(),
          fServings.trim(),
          fWeight.trim(),
          fBox.trim(),
          fTemp.trim(),
          formatDateTimeDisplay(fTimeTake),
          formatDateTimeDisplay(fTimeDestroy),
          fHandle.trim(),
          fPersonStore.trim(),
          fPersonDestroy.trim(),
        ],
        id || undefined
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-700 px-5 py-3.5 text-white flex items-center justify-between">
          <h4 className="font-bold text-sm">
            {noteOnly
              ? 'Ghi chú lại nếu có sai sót'
              : isEdit
              ? 'Chỉnh sửa bản ghi'
              : 'Thêm bản ghi mới'}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {noteOnly && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-medium">
              Nhân viên không được phép xóa hoặc chỉnh sửa dữ liệu gốc đã nhập, chỉ được phép ghi chú lại vào mục <b>Biện pháp xử lý / Ghi chú</b> bên dưới nếu có sai sót.
            </div>
          )}

          {noteOnly ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div>
                  <span className="text-slate-500">Ngày nhập / kiểm tra:</span>{' '}
                  <b className="font-mono">{fDate || '--'}</b>
                </div>
                <div>
                  <span className="text-slate-500">Tên thực phẩm / món ăn:</span>{' '}
                  <b className="text-slate-900 dark:text-white">{fName || '--'}</b>
                </div>
                {fQty && (
                  <div>
                    <span className="text-slate-500">Khối lượng:</span>{' '}
                    <b>{fQty} {fUnit}</b>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                  Biện pháp xử lý / Ghi chú sai sót *:
                </label>
                <textarea
                  rows={3}
                  autoFocus
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  placeholder="Nhập nội dung ghi chú nếu có sai sót..."
                  className="w-full px-3 py-2 rounded-xl border border-emerald-500 dark:border-emerald-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="sm:col-span-6">
              <label className="block font-bold mb-1">Ngày nhập / Ngày kiểm tra:</label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              />
            </div>
          </div>

          {stepKey === 'STEP1_FRESH' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block font-bold mb-1">Tên thực phẩm *:</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block font-bold mb-1">Giờ nhập:</label>
                <input
                  type="text"
                  value={fTime}
                  onChange={(e) => setFTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Khối lượng (KL):</label>
                <input
                  type="text"
                  value={fQty}
                  onChange={(e) => setFQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Đơn vị tính (ĐVT):</label>
                <input
                  type="text"
                  value={fUnit}
                  onChange={(e) => setFUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Tên cơ sở cung cấp:</label>
                <input
                  type="text"
                  value={fSupplier}
                  onChange={(e) => setFSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Địa chỉ, điện thoại:</label>
                <input
                  type="text"
                  value={fAddr}
                  onChange={(e) => setFAddr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Tên người giao hàng:</label>
                <input
                  type="text"
                  value={fDeliverer}
                  onChange={(e) => setFDeliverer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Chứng từ, hóa đơn:</label>
                <input
                  type="text"
                  value={fDoc}
                  onChange={(e) => setFDoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Giấy ĐK VS thú y:</label>
                <input
                  type="text"
                  value={fVet}
                  onChange={(e) => setFVet(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Giấy kiểm dịch:</label>
                <input
                  type="text"
                  value={fQuar}
                  onChange={(e) => setFQuar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Kiểm tra cảm quan:</label>
                <select
                  value={fSense}
                  onChange={(e) => setFSense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ ĐẠT</option>
                  <option value="Không đạt">❌ KHÔNG ĐẠT</option>
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Xét nghiệm nhanh:</label>
                <input
                  type="text"
                  value={fTest}
                  onChange={(e) => setFTest(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-12">
                <label className="block font-bold mb-1">Biện pháp xử lý / ghi chú:</label>
                <input
                  type="text"
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {stepKey === 'STEP1_DRY' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="block font-bold mb-1">Tên thực phẩm *:</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block font-bold mb-1">Thời gian nhập:</label>
                <input
                  type="text"
                  value={fTime}
                  onChange={(e) => setFTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Tên cơ sở sản xuất:</label>
                <input
                  type="text"
                  value={fProducer}
                  onChange={(e) => setFProducer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Địa chỉ sản xuất:</label>
                <input
                  type="text"
                  value={fProdAddr}
                  onChange={(e) => setFProdAddr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Khối lượng (KL):</label>
                <input
                  type="text"
                  value={fQty}
                  onChange={(e) => setFQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Đơn vị tính (ĐVT):</label>
                <input
                  type="text"
                  value={fUnit}
                  onChange={(e) => setFUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Tên cơ sở cung cấp:</label>
                <input
                  type="text"
                  value={fSupplier}
                  onChange={(e) => setFSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Tên chủ giao hàng:</label>
                <input
                  type="text"
                  value={fDeliverer}
                  onChange={(e) => setFDeliverer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Địa chỉ, SĐT:</label>
                <input
                  type="text"
                  value={fAddr}
                  onChange={(e) => setFAddr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Hạn sử dụng:</label>
                <input
                  type="text"
                  value={fExp}
                  onChange={(e) => setFExp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Điều kiện bảo quản:</label>
                <input
                  type="text"
                  value={fStorage}
                  onChange={(e) => setFStorage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Chứng từ, hóa đơn:</label>
                <input
                  type="text"
                  value={fDoc}
                  onChange={(e) => setFDoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Kiểm tra cảm quan:</label>
                <select
                  value={fSense}
                  onChange={(e) => setFSense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ ĐẠT</option>
                  <option value="Không đạt">❌ KHÔNG ĐẠT</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Biện pháp xử lý:</label>
                <input
                  type="text"
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {stepKey === 'STEP2_COOKING' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Ca/ bữa ăn:</label>
                <input
                  type="text"
                  value={fMeal}
                  onChange={(e) => setFMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Giờ ăn:</label>
                <input
                  type="text"
                  value={fMealTime}
                  onChange={(e) => setFMealTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Tên món ăn:</label>
                <input
                  type="text"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block font-bold mb-1">Tên nguyên liệu chính:</label>
                <input
                  type="text"
                  value={fIngName}
                  onChange={(e) => setFIngName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Số lượng nguyên liệu:</label>
                <input
                  type="text"
                  value={fIngQty}
                  onChange={(e) => setFIngQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Số suất ăn:</label>
                <input
                  type="text"
                  value={fServings}
                  onChange={(e) => setFServings(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">TG sơ chế xong:</label>
                <input
                  type="text"
                  value={fPrepTime}
                  onChange={(e) => setFPrepTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">TG chế biến xong:</label>
                <input
                  type="text"
                  value={fCookTime}
                  onChange={(e) => setFCookTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">VS Người chế biến:</label>
                <select
                  value={fHygP}
                  onChange={(e) => setFHygP(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ Đạt</option>
                  <option value="Không đạt">❌ Không đạt</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">VS Trang thiết bị:</label>
                <select
                  value={fHygE}
                  onChange={(e) => setFHygE(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ Đạt</option>
                  <option value="Không đạt">❌ Không đạt</option>
                </select>
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">VS Khu vực chế biến:</label>
                <select
                  value={fHygA}
                  onChange={(e) => setFHygA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ Đạt</option>
                  <option value="Không đạt">❌ Không đạt</option>
                </select>
              </div>
              <div className="sm:col-span-5">
                <label className="block font-bold mb-1">Kiểm tra cảm quan:</label>
                <select
                  value={fSense}
                  onChange={(e) => setFSense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ ĐẠT</option>
                  <option value="Không đạt">❌ KHÔNG ĐẠT</option>
                </select>
              </div>
              <div className="sm:col-span-7">
                <label className="block font-bold mb-1">Biện pháp xử lý / Ghi chú:</label>
                <input
                  type="text"
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {stepKey === 'STEP3_SERVING' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Tên món ăn *:</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Ca/ bữa ăn:</label>
                <input
                  type="text"
                  value={fMeal}
                  onChange={(e) => setFMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Số lượng suất ăn:</label>
                <input
                  type="text"
                  value={fServings}
                  onChange={(e) => setFServings(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">TG chia món xong:</label>
                <input
                  type="text"
                  value={fFinishTime}
                  onChange={(e) => setFFinishTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">TG bắt đầu ăn:</label>
                <input
                  type="text"
                  value={fStartEatTime}
                  onChange={(e) => setFStartEatTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-12">
                <label className="block font-bold mb-1">Dụng cụ chia, chứa đựng, che đậy, bảo quản:</label>
                <input
                  type="text"
                  value={fContainer}
                  onChange={(e) => setFContainer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block font-bold mb-1">Kiểm tra cảm quan:</label>
                <select
                  value={fSense}
                  onChange={(e) => setFSense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="">-- Để trống --</option>
                  <option value="Đạt">✅ ĐẠT</option>
                  <option value="Không đạt">❌ KHÔNG ĐẠT</option>
                </select>
              </div>
              <div className="sm:col-span-7">
                <label className="block font-bold mb-1">Biện pháp xử lý / Ghi chú:</label>
                <input
                  type="text"
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}

          {stepKey === 'STEP4_SAMPLE' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Tên mẫu thức ăn *:</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Bữa ăn:</label>
                <input
                  type="text"
                  value={fMeal}
                  onChange={(e) => setFMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-bold mb-1">Số lượng suất ăn:</label>
                <input
                  type="text"
                  value={fServings}
                  onChange={(e) => setFServings(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Khối lượng / thể tích:</label>
                <input
                  type="text"
                  value={fWeight}
                  onChange={(e) => setFWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Dụng cụ chứa mẫu:</label>
                <input
                  type="text"
                  value={fBox}
                  onChange={(e) => setFBox(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block font-bold mb-1">Nhiệt độ bảo quản (°C):</label>
                <input
                  type="text"
                  value={fTemp}
                  onChange={(e) => setFTemp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Thời gian lấy mẫu:</label>
                <input
                  type="datetime-local"
                  value={fTimeTake}
                  onChange={(e) => {
                    setFTimeTake(e.target.value);
                    setFTimeDestroy(add24Hours(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Thời gian hủy mẫu (+24h):</label>
                <input
                  type="datetime-local"
                  value={fTimeDestroy}
                  onChange={(e) => setFTimeDestroy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>
              <div className="sm:col-span-12">
                <label className="block font-bold mb-1">Ghi chú chất lượng mẫu:</label>
                <input
                  type="text"
                  value={fHandle}
                  onChange={(e) => setFHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Người lưu mẫu:</label>
                <input
                  type="text"
                  value={fPersonStore}
                  onChange={(e) => setFPersonStore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block font-bold mb-1">Người hủy mẫu:</label>
                <input
                  type="text"
                  value={fPersonDestroy}
                  onChange={(e) => setFPersonDestroy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          )}
          </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu bản ghi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// 4. BATCH ENTRY MODAL (FOR ALL 5 STEPS)
// =====================================================================
interface BatchEntryModalProps {
  isOpen: boolean;
  stepKey: FoodInspectionStepKey;
  defaultDate: string;
  openTime: string;
  inspector: string;
  freshTemplates: FreshTemplateItem[];
  dryTemplates: DryTemplateItem[];
  cookingTemplates: CookingTemplateItem[];
  servingTemplates: ServingTemplateItem[];
  sampleFoodTemplates: SampleFoodTemplateItem[];
  onClose: () => void;
  onOpenSingleAdd: () => void;
  onSubmitBatch: (stepKey: FoodInspectionStepKey, targetDate: string, rows: string[][]) => void;
}

export function FoodInspectionBatchModal({
  isOpen,
  stepKey,
  defaultDate,
  openTime,
  inspector,
  freshTemplates,
  dryTemplates,
  cookingTemplates,
  servingTemplates,
  sampleFoodTemplates,
  onClose,
  onOpenSingleAdd,
  onSubmitBatch,
}: BatchEntryModalProps) {
  const [batchDate, setBatchDate] = useState(
    () => defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [batchInspector, setBatchInspector] = useState(inspector);
  const [items, setItems] = useState<any[]>([]);
  const [globalDestroyDt, setGlobalDestroyDt] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const today = defaultDate || new Date().toISOString().slice(0, 10);
    setBatchDate(today);
    setBatchInspector(inspector);
    setGlobalDestroyDt('');
    const realNowTime = getNowTimeString();

    if (stepKey === 'STEP1_FRESH') {
      setItems(
        freshTemplates.map((t, i) => ({
          ...t,
          stt: t.stt || i + 1,
          importDate: t.importDate || today,
          name: t.name || '',
          time: t.time || realNowTime,
          qty: t.qty || '',
          unit: t.unit || '',
          supplier: t.supplier || '',
          addr: t.addr || '',
          deliverer: t.deliverer || '',
          doc: t.doc || '',
          vet: t.vet || '',
          quar: t.quar || '',
          sense: t.sense || '',
          test: t.test || '',
          originalHandle: t.handle || '',
          handle: t.handle || '',
        }))
      );
    } else if (stepKey === 'STEP1_DRY') {
      setItems(
        dryTemplates.map((t, i) => ({
          ...t,
          stt: t.stt || i + 1,
          importDate: t.importDate || today,
          name: t.name || '',
          producer: t.producer || '',
          prod_addr: t.prod_addr || '',
          time: t.time || realNowTime,
          qty: t.qty || '',
          unit: t.unit || '',
          supplier: t.supplier || '',
          deliverer: t.deliverer || '',
          addr: t.addr || '',
          phone: t.phone || '',
          exp: t.exp || '',
          storage: t.storage || '',
          doc: t.doc || '',
          cert: t.cert || '',
          sense: t.sense || '',
          originalHandle: t.handle || '',
          handle: t.handle || '',
        }))
      );
    } else if (stepKey === 'STEP2_COOKING') {
      setItems(
        cookingTemplates.map((t, i) => ({
          ...t,
          stt: t.stt || i + 1,
          prepTime: t.prepTime || '',
          cookTime: t.cookTime || '',
          hygienePerson: t.hygienePerson || '',
          hygieneEquipment: t.hygieneEquipment || '',
          hygieneArea: t.hygieneArea || '',
          sense: t.sense || '',
          originalHandle: t.handle || '',
          handle: t.handle || '',
        }))
      );
    } else if (stepKey === 'STEP3_SERVING') {
      setItems(
        servingTemplates.map((t, i) => ({
          ...t,
          stt: t.stt || i + 1,
          finishTime: t.finishTime || '',
          startEatTime: t.startEatTime || '',
          sense: t.sense || '',
          originalHandle: t.handle || '',
          handle: t.handle || '',
        }))
      );
    } else if (stepKey === 'STEP4_SAMPLE') {
      setItems(
        sampleFoodTemplates.map((t, i) => ({
          ...t,
          stt: t.stt || i + 1,
          takeTime: t.takeTime || '',
          destroyDtLocal: '',
          destroyTime: t.destroyTime || '',
        }))
      );
    }
  }, [
    isOpen,
    stepKey,
    defaultDate,
    openTime,
    inspector,
    freshTemplates,
    dryTemplates,
    cookingTemplates,
    servingTemplates,
    sampleFoodTemplates,
  ]);

  if (!isOpen) return null;

  const visibleItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      if (!batchDate) return true;
      if (stepKey === 'STEP1_FRESH' || stepKey === 'STEP1_DRY') {
        return !item.importDate || item.importDate === batchDate;
      }
      return true;
    });

  const handleSetAllOk = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        hygienePerson: stepKey === 'STEP2_COOKING' ? 'Đạt' : it.hygienePerson,
        hygieneEquipment: stepKey === 'STEP2_COOKING' ? 'Đạt' : it.hygieneEquipment,
        hygieneArea: stepKey === 'STEP2_COOKING' ? 'Đạt' : it.hygieneArea,
        sense: 'Đạt',
      }))
    );
  };

  const handleSaveBatch = () => {
    const sourceList = visibleItems.map((v) => v.item);
    if (sourceList.length === 0) {
      onOpenSingleAdd();
      return;
    }
    const actualTime = getNowTimeString();
    const todayDate = defaultDate || new Date().toISOString().slice(0, 10);
    if (stepKey === 'STEP1_FRESH') {
      const rows = sourceList.map((item) => [
        '',
        String(item.importDate || batchDate || todayDate).trim(),
        String(item.name || '').trim(),
        String(item.time || actualTime).trim(),
        String(item.qty ?? '').trim(),
        String(item.unit ?? '').trim(),
        String(item.supplier || '').trim(),
        String(item.addr || '').trim(),
        String(item.deliverer || '').trim(),
        String(item.doc || '').trim(),
        String(item.vet || '').trim(),
        String(item.quar || '').trim(),
        String(item.sense || '').trim(),
        String(item.test || '').trim(),
        String(item.handle || '').trim(),
        batchInspector,
        String(item.note || '').trim(),
      ]);
      onSubmitBatch(stepKey, batchDate || sourceList[0]?.importDate || todayDate, rows);
    } else if (stepKey === 'STEP1_DRY') {
      const rows = sourceList.map((item) => [
        '',
        String(item.importDate || batchDate || todayDate).trim(),
        String(item.time || actualTime).trim(),
        String(item.name || '').trim(),
        String(item.producer || '').trim(),
        String(item.prod_addr || '').trim(),
        String(item.supplier || '').trim(),
        String(item.deliverer || '').trim(),
        String(item.addr || '').trim(),
        String(item.phone || '').trim(),
        String(item.unit || '').trim(),
        String(item.qty ?? '').trim(),
        String(item.exp || '').trim(),
        String(item.storage || '').trim(),
        String(item.doc || '').trim(),
        String(item.cert || '').trim(),
        String(item.sense || '').trim(),
        String(item.handle || '').trim(),
        batchInspector,
        String(item.note || '').trim(),
      ]);
      onSubmitBatch(stepKey, batchDate || sourceList[0]?.importDate || todayDate, rows);
    } else if (stepKey === 'STEP2_COOKING') {
      const rows = sourceList.map((item) => [
        '',
        batchDate,
        String(item.meal || '').trim(),
        String(item.dishName || item.name || '').trim(),
        String(item.ingName || '').trim(),
        String(item.ingQty || '').trim(),
        String(item.servings || '').trim(),
        String(item.prepTime || '').trim(),
        String(item.cookTime || '').trim(),
        String(item.hygienePerson || '').trim(),
        String(item.hygieneEquipment || '').trim(),
        String(item.hygieneArea || '').trim(),
        String(item.sense || '').trim(),
        String(item.handle || '').trim(),
        batchInspector,
        String(item.note || '').trim(),
      ]);
      onSubmitBatch(stepKey, batchDate, rows);
    } else if (stepKey === 'STEP3_SERVING') {
      const rows = sourceList.map((item) => [
        '',
        batchDate,
        String(item.meal || '').trim(),
        String(item.dishName || item.name || '').trim(),
        String(item.servings || '').trim(),
        String(item.finishTime || '').trim(),
        String(item.startEatTime || '').trim(),
        String(item.container || '').trim(),
        String(item.sense || '').trim(),
        String(item.handle || '').trim(),
        batchInspector,
        String(item.note || '').trim(),
      ]);
      onSubmitBatch(stepKey, batchDate, rows);
    } else if (stepKey === 'STEP4_SAMPLE') {
      const rows = sourceList.map((item) => [
        '',
        batchDate,
        String(item.meal || '').trim(),
        String(item.dishName || item.name || '').trim(),
        String(item.servings || '').trim(),
        String(item.weight || '').trim(),
        String(item.box || '').trim(),
        String(item.temp || '').trim(),
        String(item.takeTime || '').trim(),
        String(item.destroyTime || '').trim(),
        String(item.note || '').trim(),
        batchInspector,
        batchInspector,
      ]);
      onSubmitBatch(stepKey, batchDate, rows);
    }
  };

  const headerColor =
    stepKey === 'STEP2_COOKING'
      ? 'bg-amber-500 text-slate-950'
      : stepKey === 'STEP4_SAMPLE'
      ? 'bg-rose-600 text-white'
      : 'bg-emerald-700 text-white';

  const titleMap: Record<FoodInspectionStepKey, string> = {
    STEP1_FRESH: 'Nhập Thực Phẩm Tươi Sống',
    STEP1_DRY: 'Nhập Thực Phẩm Khô & Gia Vị',
    STEP2_COOKING: 'Kiểm Tra Khi Chế Biến Thức Ăn',
    STEP3_SERVING: 'Kiểm Tra Trước Khi Ăn',
    STEP4_SAMPLE: 'Theo Dõi Lưu & Hủy Mẫu Thức Ăn',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-[95vw] w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className={`${headerColor} px-5 py-3.5 flex items-center justify-between`}>
          <div>
            <h4 className="font-bold text-sm">{titleMap[stepKey]}</h4>
            </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSingleAdd();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dòng lẻ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-black/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 text-xs">
          {/* Top metadata bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex-1 max-w-sm">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {stepKey === 'STEP1_FRESH' || stepKey === 'STEP1_DRY'
                  ? 'Lọc theo ngày nhập hàng (để trống = hiển thị tất cả):'
                  : 'Ngày kiểm tra (để trống = hiển thị tất cả):'}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setBatchDate(newDate);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
                {batchDate && (
                  <button
                    type="button"
                    onClick={() => setBatchDate('')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Tất cả
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-end justify-end">
              {stepKey === 'STEP4_SAMPLE' ? (
                <div className="w-full sm:w-auto">
                  <label className="block text-[11px] font-bold text-rose-600 mb-1">
                    TG hủy mẫu (áp dụng tất cả):
                  </label>
                  <input
                    type="datetime-local"
                    value={globalDestroyDt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGlobalDestroyDt(val);
                      setItems((prev) =>
                        prev.map((it) => ({
                          ...it,
                          destroyDtLocal: val,
                          destroyTime: formatDateTimeDisplay(val),
                        }))
                      );
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white dark:bg-slate-800 font-bold text-rose-600"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSetAllOk}
                  className="px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Tất cả ĐẠT</span>
                </button>
              )}
            </div>
          </div>

          {/* Batch Table */}
          <div className="max-h-[460px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 font-bold text-center">
                {stepKey === 'STEP1_FRESH' ? (
                  <tr>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-10 min-w-[40px]">STT</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[180px]">Tên thực phẩm</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-24 min-w-[85px]">Khối lượng</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-20 min-w-[70px]">Đơn vị tính</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[150px] whitespace-nowrap">Kiểm tra cảm quan</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[140px]">Xét nghiệm nhanh</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[160px]">Biện pháp xử lý/ghi chú</th>
                  </tr>
                ) : stepKey === 'STEP1_DRY' ? (
                  <tr>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-10 min-w-[40px]">STT</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[180px]">Tên thực phẩm</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-24 min-w-[85px]">Khối lượng</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 w-20 min-w-[70px]">Đơn vị tính</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[120px]">Hạn sử dụng</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[140px]">Điều kiện bảo quản</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[130px]">Chứng từ/hóa đơn</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 min-w-[150px] whitespace-nowrap">Kiểm tra cảm quan</th>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[160px]">Biện pháp xử lý/ghi chú</th>
                  </tr>
                ) : stepKey === 'STEP2_COOKING' ? (
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 w-10">TT</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Ca/ bữa ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Tên món ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Nguyên liệu</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">SL NL</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Số suất</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">VS Người</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">VS Dụng cụ</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">VS Khu vực</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Cảm quan</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Xử lý</th>
                  </tr>
                ) : stepKey === 'STEP4_SAMPLE' ? (
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 w-10">TT</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Tên mẫu thức ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Bữa ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Số suất</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">KL / Thể tích</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Dụng cụ chứa</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Nhiệt độ</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">TG lấy mẫu</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">TG hủy mẫu (+24h)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 w-10">TT</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Tên món ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Ca/ Bữa ăn</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">Số suất</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 min-w-[150px] whitespace-nowrap">Kiểm tra cảm quan</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-left">Biện pháp xử lý</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-6 text-center text-slate-400">
                      {stepKey === 'STEP1_FRESH' || stepKey === 'STEP1_DRY'
                        ? 'Chưa có thực phẩm nào trong Danh sách nhập thực phẩm. Bạn có thể nhấn "Thêm dòng lẻ" ở góc trên bên phải để nhập trực tiếp.'
                        : 'Chưa có món ăn nào trong danh sách. Bạn có thể nhấn "Thêm dòng lẻ" ở góc trên bên phải để nhập món mới.'}
                    </td>
                  </tr>
                ) : (
                  visibleItems.map(({ item, originalIndex }, idx) => {
                    if (stepKey === 'STEP1_FRESH') {
                      return (
                        <tr key={originalIndex} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                            {item.name || ''}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold text-blue-600">
                            {item.qty || ''}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">
                            {item.unit || ''}
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700 text-center min-w-[150px]">
                            <select
                              value={item.sense || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, sense: val } : row
                                  )
                                );
                              }}
                              className="w-full min-w-[130px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                            >
                              <option value=""></option>
                              <option value="Đạt">✅ Đạt</option>
                              <option value="Không đạt">❌ Không đạt</option>
                            </select>
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.test || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, test: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.handle || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, handle: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                        </tr>
                      );
                    }

                    if (stepKey === 'STEP1_DRY') {
                      return (
                        <tr key={originalIndex} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                            {item.name || ''}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center font-bold text-blue-600">
                            {item.qty || ''}
                          </td>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 text-center">
                            {item.unit || ''}
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.exp || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, exp: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.storage || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, storage: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.doc || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, doc: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700 text-center min-w-[150px]">
                            <select
                              value={item.sense || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, sense: val } : row
                                  )
                                );
                              }}
                              className="w-full min-w-[130px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                            >
                              <option value=""></option>
                              <option value="Đạt">✅ Đạt</option>
                              <option value="Không đạt">❌ Không đạt</option>
                            </select>
                          </td>
                          <td className="p-1.5 border border-slate-200 dark:border-slate-700">
                            <input
                              type="text"
                              value={item.handle || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex ? { ...row, handle: val } : row
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            />
                          </td>
                        </tr>
                      );
                    }

                    if (stepKey === 'STEP2_COOKING') {
                      return (
                        <tr key={originalIndex}>
                          <td className="p-2 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 text-center">{item.meal || ''}</td>
                          <td className="p-2 font-bold">{item.dishName || ''}</td>
                          <td className="p-2">{item.ingName || ''}</td>
                          <td className="p-2 text-center font-semibold text-blue-600">{item.ingQty || ''}</td>
                          <td className="p-2 text-center">{item.servings || ''}</td>
                          {(['hygienePerson', 'hygieneEquipment', 'hygieneArea', 'sense'] as const).map((field) => (
                            <td key={field} className="p-1.5 text-center">
                              <select
                                value={item[field] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItems((prev) =>
                                    prev.map((row, rIdx) =>
                                      rIdx === originalIndex ? { ...row, [field]: val } : row
                                    )
                                  );
                                }}
                                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold"
                              >
                                <option value=""></option>
                                <option value="Đạt">✅ Đạt</option>
                                <option value="Không đạt">❌ K.Đạt</option>
                              </select>
                            </td>
                          ))}
                          <td className="p-2 text-xs">{item.handle || ''}</td>
                        </tr>
                      );
                    }

                    if (stepKey === 'STEP4_SAMPLE') {
                      return (
                        <tr key={originalIndex}>
                          <td className="p-2 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold">{item.dishName || item.name || ''}</td>
                          <td className="p-2 text-center">{item.meal || ''}</td>
                          <td className="p-2 text-center">{item.servings || ''}</td>
                          <td className="p-2 text-center font-bold text-rose-600">{item.weight || ''}</td>
                          <td className="p-2">{item.box || ''}</td>
                          <td className="p-2 text-center">{item.temp || ''}</td>
                          <td className="p-2 text-center">{item.takeTime || ''}</td>
                          <td className="p-2 text-center">
                            <input
                              type="datetime-local"
                              value={item.destroyDtLocal || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems((prev) =>
                                  prev.map((row, rIdx) =>
                                    rIdx === originalIndex
                                      ? {
                                          ...row,
                                          destroyDtLocal: val,
                                          destroyTime: formatDateTimeDisplay(val),
                                        }
                                      : row
                                  )
                                );
                              }}
                              className="px-2 py-1 rounded-lg border border-rose-300 text-rose-600 font-bold text-xs"
                            />
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={originalIndex}>
                        <td className="p-2 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900 dark:text-white">
                          {item.name || item.dishName || ''}
                        </td>
                        <td className="p-2 text-center font-bold">{item.meal || ''}</td>
                        <td className="p-2 text-center">{item.servings || ''}</td>
                        <td className="p-2 text-center min-w-[150px]">
                          <select
                            value={item.sense || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === originalIndex ? { ...row, sense: val } : row
                                )
                              );
                            }}
                            className="w-full min-w-[130px] px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                          >
                            <option value=""></option>
                            <option value="Đạt">✅ Đạt</option>
                            <option value="Không đạt">❌ Không đạt</option>
                          </select>
                        </td>
                        <td className="p-2">{item.handle || ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Tổng cộng: <b className="text-emerald-600">{visibleItems.length}</b> dòng dữ liệu
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveBatch}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu lại vào bảng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 5. FOOD IMPORT TEMPLATE MODAL (DANH SÁCH NHẬP THỰC PHẨM - HCNS & ADMIN)
// =====================================================================
export interface FoodImportTemplateModalProps {
  isOpen: boolean;
  type: 'FRESH' | 'DRY';
  editingItem: (FreshTemplateItem | DryTemplateItem) | null;
  onClose: () => void;
  onSave: (
    type: 'FRESH' | 'DRY',
    item: FreshTemplateItem | DryTemplateItem,
    existingId?: string,
    keepOpen?: boolean
  ) => void;
}

export function FoodImportTemplateModal({
  isOpen,
  type,
  editingItem,
  onClose,
  onSave,
}: FoodImportTemplateModalProps) {
  const isEdit = !!editingItem;
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [importDate, setImportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('');
  const [supplier, setSupplier] = useState('');
  const [addr, setAddr] = useState('');
  const [deliverer, setDeliverer] = useState('');
  // Fresh specific
  const [doc, setDoc] = useState('');
  const [vet, setVet] = useState('');
  const [quar, setQuar] = useState('');
  // Dry specific
  const [producer, setProducer] = useState('');
  const [prodAddr, setProdAddr] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().slice(0, 10);
    setImportDate(editingItem?.importDate || today);
    setName(editingItem?.name || '');
    setQty(editingItem?.qty || '');
    setUnit(editingItem?.unit || '');
    setSupplier(editingItem?.supplier || '');
    setAddr(editingItem?.addr || '');
    setDeliverer(editingItem?.deliverer || '');
    if (type === 'FRESH') {
      const f = editingItem as FreshTemplateItem | null;
      setDoc(f?.doc || '');
      setVet(f?.vet || '');
      setQuar(f?.quar || '');
    } else {
      const d = editingItem as DryTemplateItem | null;
      setProducer(d?.producer || '');
      setProdAddr(d?.prod_addr || '');
    }
  }, [isOpen, type, editingItem]);

  if (!isOpen) return null;

  const buildItem = () => {
    const existingId = editingItem?.id;
    const today = new Date().toISOString().slice(0, 10);
    if (type === 'FRESH') {
      const item: FreshTemplateItem = {
        id: existingId || `FT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        importDate: importDate.trim() || today,
        name: name.trim(),
        qty: qty.trim(),
        unit: unit.trim(),
        supplier: supplier.trim(),
        addr: addr.trim(),
        deliverer: deliverer.trim(),
        doc: doc.trim(),
        vet: vet.trim(),
        quar: quar.trim(),
      };
      return { item, existingId };
    } else {
      const item: DryTemplateItem = {
        id: existingId || `DT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        importDate: importDate.trim() || today,
        name: name.trim(),
        producer: producer.trim(),
        prod_addr: prodAddr.trim(),
        qty: qty.trim(),
        unit: unit.trim(),
        supplier: supplier.trim(),
        deliverer: deliverer.trim(),
        addr: addr.trim(),
      };
      return { item, existingId };
    }
  };

  const resetFieldsForNext = () => {
    setName('');
    setQty('');
    setUnit('');
    setSupplier('');
    setAddr('');
    setDeliverer('');
    setDoc('');
    setVet('');
    setQuar('');
    setProducer('');
    setProdAddr('');
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { item, existingId } = buildItem();
    onSave(type, item, existingId, false);
  };

  const handleSaveAndAddNew = () => {
    if (!name.trim()) {
      nameInputRef.current?.reportValidity();
      nameInputRef.current?.focus();
      return;
    }
    const { item, existingId } = buildItem();
    onSave(type, item, existingId, true);
    resetFieldsForNext();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-700 px-5 py-3.5 text-white flex items-center justify-between">
          <h4 className="font-bold text-sm">
            {isEdit ? 'Chỉnh sửa' : 'Thêm mới'} {type === 'FRESH' ? 'Thực phẩm tươi sống' : 'Thực phẩm khô'} (Danh sách nhập thực phẩm)
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block font-bold mb-1">Ngày nhập hàng:</label>
              <input
                type="date"
                value={importDate}
                onChange={(e) => setImportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              />
            </div>
            <div className="sm:col-span-7">
              <label className="block font-bold mb-1">Tên thực phẩm *:</label>
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {type === 'DRY' && (
              <>
                <div className="sm:col-span-6">
                  <label className="block font-bold mb-1">Tên cơ sở sản xuất:</label>
                  <input
                    type="text"
                    value={producer}
                    onChange={(e) => setProducer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block font-bold mb-1">Địa chỉ sản xuất:</label>
                  <input
                    type="text"
                    value={prodAddr}
                    onChange={(e) => setProdAddr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </>
            )}

            <div className="sm:col-span-6">
              <label className="block font-bold mb-1">Khối lượng:</label>
              <input
                type="text"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-6">
              <label className="block font-bold mb-1">Đơn vị tính:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block font-bold mb-1">Tên cơ sở cung cấp:</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>

            {type === 'FRESH' ? (
              <>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Địa chỉ/điện thoại:</label>
                  <input
                    type="text"
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Tên người giao hàng:</label>
                  <input
                    type="text"
                    value={deliverer}
                    onChange={(e) => setDeliverer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Chứng từ/hóa đơn:</label>
                  <input
                    type="text"
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Giấy ĐK VS thú y:</label>
                  <input
                    type="text"
                    value={vet}
                    onChange={(e) => setVet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Giấy kiểm dịch:</label>
                  <input
                    type="text"
                    value={quar}
                    onChange={(e) => setQuar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Tên chủ giao hàng:</label>
                  <input
                    type="text"
                    value={deliverer}
                    onChange={(e) => setDeliverer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block font-bold mb-1">Địa chỉ/điện thoại:</label>
                  <input
                    type="text"
                    value={addr}
                    onChange={(e) => setAddr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
            >
              Đóng
            </button>
            {!isEdit && (
              <button
                type="button"
                onClick={handleSaveAndAddNew}
                className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lưu và thêm mới</span>
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu vào danh sách</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// 6. EXCEL IMPORT MODAL FOR DANH SÁCH NHẬP THỰC PHẨM (FRESH / DRY)
// =====================================================================
export interface FoodImportTemplateExcelModalProps {
  isOpen: boolean;
  initialType: 'FRESH' | 'DRY';
  defaultDate: string;
  onClose: () => void;
  onConfirmImport: (
    type: 'FRESH' | 'DRY',
    items: (FreshTemplateItem | DryTemplateItem)[]
  ) => void;
}

export function FoodImportTemplateExcelModal({
  isOpen,
  initialType,
  defaultDate,
  onClose,
  onConfirmImport,
}: FoodImportTemplateExcelModalProps) {
  const [type, setType] = useState<'FRESH' | 'DRY'>(initialType);
  const [targetDate, setTargetDate] = useState<string>(defaultDate);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<(FreshTemplateItem | DryTemplateItem)[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setTargetDate(defaultDate || new Date().toISOString().slice(0, 10));
      setParsedItems([]);
      setPasteText('');
    }
  }, [isOpen, initialType, defaultDate]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });
        if (!jsonRows || jsonRows.length <= 1) {
          alert('File Excel không có dữ liệu hoặc chỉ có dòng tiêu đề!');
          return;
        }
        const formatted = parseFoodImportTemplateRows(
          jsonRows.slice(1),
          type,
          targetDate
        );
        if (!formatted.length) {
          alert('Không có dữ liệu thực phẩm hợp lệ nào được tìm thấy trong file!');
          return;
        }
        setParsedItems(formatted);
      } catch (err: any) {
        alert('Lỗi khi đọc file Excel: ' + (err.message || err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) {
      alert('Vui lòng dán nội dung từ Excel vào ô trước!');
      return;
    }
    const rawRows = pasteText
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split('\t'));
    const formatted = parseFoodImportTemplateRows(rawRows, type, targetDate);
    if (!formatted.length) {
      alert('Không tìm thấy dòng dữ liệu hợp lệ nào!');
      return;
    }
    setParsedItems(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-700 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Nhập Danh Sách Thực Phẩm Từ File Excel Mẫu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="sm:col-span-5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                1. Chọn danh sách cần nhập:
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as 'FRESH' | 'DRY');
                  setParsedItems([]);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              >
                <option value="FRESH">1. Thực phẩm tươi sống</option>
                <option value="DRY">2. Thực phẩm khô</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                2. Ngày nhập hàng mặc định:
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
              />
            </div>

            <div className="sm:col-span-4 flex items-end">
              <button
                type="button"
                onClick={() => downloadFoodImportTemplateSampleExcel(type, targetDate)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải file Excel mẫu (.xlsx)</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                mode === 'upload'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải lên file Excel (.xlsx, .xls, .csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
                mode === 'paste'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Copy &amp; Dán trực tiếp từ Excel</span>
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-800/40 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-slate-800 dark:text-slate-200">
                Nhấp vào đây để chọn tệp Excel từ máy tính của bạn
              </div>
              <div className="text-slate-500 mt-0.5">Hỗ trợ định dạng: .xlsx, .xls, .csv</div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-500">
                Mở Excel, quét chọn vùng dữ liệu rồi nhấn <b>Ctrl + C</b>, sau đó nhấp vào ô bên dưới và nhấn <b>Ctrl + V</b>:
              </p>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Dán nội dung sao chép từ Excel vào đây..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
                >
                  Phân tích dữ liệu đã dán
                </button>
              </div>
            </div>
          )}

          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                Xem trước dữ liệu đọc được ({parsedItems.length} thực phẩm):
              </div>
              <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700 text-center">STT</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Ngày nhập hàng</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Tên thực phẩm</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Khối lượng / ĐVT</th>
                      <th className="p-2 border-b border-slate-200 dark:border-slate-700">Cơ sở cung cấp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedItems.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 font-mono">{it.importDate || ''}</td>
                        <td className="p-2 font-bold">{it.name || ''}</td>
                        <td className="p-2">
                          {it.qty || ''} {it.unit || ''}
                        </td>
                        <td className="p-2">{it.supplier || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={() => onConfirmImport(type, parsedItems)}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Xác nhận thêm vào danh sách</span>
          </button>
        </div>
      </div>
    </div>
  );
}
