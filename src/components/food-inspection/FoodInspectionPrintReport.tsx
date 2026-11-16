'use client';

import React from 'react';
import {
  FoodInspectionRecord,
  FoodInspectionSettings,
  FoodReportFormKey,
} from '@/types/food-inspection';
import {
  formatVNDate,
  getCookingRowFields,
  getFreshRowFields,
  parseIngredient,
} from '@/lib/food-inspection-utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  RotateCw,
  FileSpreadsheet,
  Layers,
  Flame,
  Utensils,
  Archive,
  PackageOpen,
} from 'lucide-react';

interface FoodInspectionPrintReportProps {
  reportMonth: string;
  onChangeReportMonth: (month: string) => void;
  onStepReportMonth: (delta: number) => void;
  onSetCurrentMonth: () => void;
  onRefresh: () => void;
  selectedForm: FoodReportFormKey;
  onSelectForm: (form: FoodReportFormKey) => void;
  settings: FoodInspectionSettings;
  freshData: FoodInspectionRecord[];
  dryData: FoodInspectionRecord[];
  cookData: FoodInspectionRecord[];
  eatData: FoodInspectionRecord[];
  sampleData: FoodInspectionRecord[];
}

export function FoodInspectionPrintReport({
  reportMonth,
  onChangeReportMonth,
  onStepReportMonth,
  onSetCurrentMonth,
  onRefresh,
  selectedForm,
  onSelectForm,
  settings,
  freshData,
  dryData,
  cookData,
  eatData,
  sampleData,
}: FoodInspectionPrintReportProps) {
  const parts = reportMonth ? reportMonth.split('-') : [];
  const monthTitle =
    parts.length === 2 ? `Tháng ${parts[1]} năm ${parts[0]}` : reportMonth;
  const monthLabel =
    parts.length === 2 ? `Tháng ${parts[1]}/${parts[0]}` : reportMonth;

  const sortByDate = (arr: FoodInspectionRecord[]) =>
    [...(arr || [])].sort((a, b) => {
      const da = a.col_1 || a.date || '';
      const db = b.col_1 || b.date || '';
      return da.localeCompare(db);
    });

  const sortedFresh = sortByDate(freshData);
  const sortedDry = sortByDate(dryData);
  const sortedCook = sortByDate(cookData);
  const sortedEat = sortByDate(eatData);
  const sortedSample = sortByDate(sampleData);

  // Group cooking rows for Form 2
  const buildCookGroups = () => {
    const groups: {
      key: string;
      date: string;
      meal: string;
      time: string;
      items: { raw: FoodInspectionRecord; fields: ReturnType<typeof getCookingRowFields> }[];
    }[] = [];
    let currentGroup: (typeof groups)[0] | null = null;
    for (let i = 0; i < sortedCook.length; i++) {
      const r = sortedCook[i];
      const fields = getCookingRowFields(r);
      const dateKey = (r.col_1 || r.date || '').toString().trim();
      const mealKey = (fields.meal || '').toString().trim();
      const timeKey = (fields.mealTime || '').toString().trim();
      const groupKey = `${dateKey}___${mealKey}___${timeKey}`;
      if (!currentGroup || currentGroup.key !== groupKey) {
        currentGroup = {
          key: groupKey,
          date: dateKey,
          meal: mealKey,
          time: timeKey,
          items: [{ raw: r, fields }],
        };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push({ raw: r, fields });
      }
    }
    return groups;
  };

  const cookGroups = buildCookGroups();

  return (
    <div className="space-y-4">
      {/* Control Bar (Hidden on print) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs print:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Báo Cáo Kiểm Thực 3 Bước &amp; Lưu Mẫu</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Định dạng chuẩn theo mẫu Bộ Y Tế (QĐ 1246/QĐ-BYT), phân chia theo từng mẫu biểu và hiển thị theo từng tháng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Chọn tháng:</span>
            </span>
            <div className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
              <button
                type="button"
                onClick={() => onStepReportMonth(-1)}
                className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={reportMonth}
                onChange={(e) => onChangeReportMonth(e.target.value)}
                className="px-2 py-1 text-xs font-bold text-center bg-transparent text-slate-800 dark:text-slate-200 border-x border-slate-300 dark:border-slate-700 outline-none w-36"
              />
              <button
                type="button"
                onClick={() => onStepReportMonth(1)}
                className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onSetCurrentMonth}
              className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold cursor-pointer"
            >
              Tháng này
            </button>

            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Báo Cáo / Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* Form Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: 'ALL', label: 'Tất cả các mẫu', count: null, icon: Layers },
                { key: 'M1_1', label: 'Mẫu 1.1: Tươi sống, đông lạnh', count: sortedFresh.length, icon: PackageOpen },
                { key: 'M1_2', label: 'Mẫu 1.2: Thực phẩm khô', count: sortedDry.length, icon: PackageOpen },
                { key: 'M2', label: 'Mẫu số 2: Khi chế biến', count: sortedCook.length, icon: Flame },
                { key: 'M3', label: 'Mẫu số 3: Trước khi ăn', count: sortedEat.length, icon: Utensils },
                { key: 'M4', label: 'Mẫu số 4: Lưu & Hủy mẫu', count: sortedSample.length, icon: Archive },
              ] as const
            ).map((f) => {
              const Icon = f.icon;
              const isActive = selectedForm === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onSelectForm(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  {f.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-emerald-700'
                          : f.count > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Đang hiển thị dữ liệu {monthLabel}
          </div>
        </div>
      </div>

      {/* Printable Report Documents */}
      <div className="space-y-6">
        {/* FORM 1.1 */}
        {(selectedForm === 'ALL' || selectedForm === 'M1_1') && (
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 print:break-after-page">
            <div className="flex flex-wrap justify-between gap-4 pb-3 mb-3 border-b border-slate-300 text-xs">
              <div className="space-y-0.5">
                <div><b>Tên cơ sở/ Chi nhánh:</b> {settings.companyName}</div>
                <div><b>Người kiểm tra:</b> {settings.inspector}</div>
                <div><b>Thời gian kiểm tra:</b> {monthTitle}</div>
                <div><b>Địa điểm kiểm tra:</b> {settings.location}</div>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-emerald-700">
                  Mẫu số 1: Kiểm tra trước khi chế biến thức ăn (Bước 1)
                </h4>
                <div className="font-bold text-blue-700 text-xs">
                  1.1: Thực phẩm tươi sống, đông lạnh: thịt, cá, rau, củ, quả ...
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-9">TT</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Ngày</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Tên thực phẩm</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-16">Giờ nhập</th>
                    <th colSpan={2} className="border border-slate-800 p-1.5">Khối lượng</th>
                    <th colSpan={3} className="border border-slate-800 p-1.5">Nơi cung cấp</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Chứng từ,<br />hóa đơn</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Giấy ĐK<br />VS thú y</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Giấy<br />kiểm dịch</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-24">Kiểm tra<br />cảm quan<br /><i>(Đạt/K.Đạt)</i></th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-24">Xét nghiệm<br />nhanh<br /><i>(Âm tính/...)</i></th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Biện pháp xử lý/<br />ghi chú</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-800 p-1.5 w-12">KL</th>
                    <th className="border border-slate-800 p-1.5 w-12">ĐVT</th>
                    <th className="border border-slate-800 p-1.5">Tên cơ sở</th>
                    <th className="border border-slate-800 p-1.5">Địa chỉ, điện thoại</th>
                    <th className="border border-slate-800 p-1.5">Người giao hàng</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFresh.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="border border-slate-800 p-4 text-center text-slate-500">
                        Không có bản ghi thực phẩm tươi sống nào trong {monthTitle}
                      </td>
                    </tr>
                  ) : (
                    sortedFresh.map((r, i) => {
                      const f = getFreshRowFields(r);
                      return (
                        <tr key={r.id || i}>
                          <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-bold">{formatVNDate(r.col_1 || r.date)}</td>
                          <td className="border border-slate-800 p-1.5 font-bold">{f.name}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.time}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.qty}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.unit}</td>
                          <td className="border border-slate-800 p-1.5">{f.supplier}</td>
                          <td className="border border-slate-800 p-1.5">{f.addr}</td>
                          <td className="border border-slate-800 p-1.5">{f.deliverer}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.doc}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.vet}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.quar}</td>
                          <td className="border border-slate-800 p-1.5 text-center font-semibold">{f.sense}</td>
                          <td className="border border-slate-800 p-1.5 text-center">{f.test}</td>
                          <td className="border border-slate-800 p-1.5">{f.handle}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6 text-center text-xs px-8">
              <div>
                <b>Người kiểm tra</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người phụ trách cơ sở</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>.........................................</b>
              </div>
            </div>
          </div>
        )}

        {/* FORM 1.2 */}
        {(selectedForm === 'ALL' || selectedForm === 'M1_2') && (
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 print:break-after-page">
            <div className="flex flex-wrap justify-between gap-4 pb-3 mb-3 border-b border-slate-300 text-xs">
              <div className="space-y-0.5">
                <div><b>Tên cơ sở/ Chi nhánh:</b> {settings.companyName}</div>
                <div><b>Người kiểm tra:</b> {settings.inspector}</div>
                <div><b>Thời gian kiểm tra:</b> {monthTitle}</div>
                <div><b>Địa điểm kiểm tra:</b> {settings.location}</div>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-emerald-700">
                  Mẫu số 1: Kiểm tra trước khi chế biến thức ăn (Bước 1)
                </h4>
                <div className="font-bold text-blue-700 text-xs">
                  1.2: Thực phẩm khô: gia vị, phụ gia thực phẩm, phụ gia đóng gói ...
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-9">TT</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Ngày</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Tên thực phẩm</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Tên cơ sở sản xuất</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Địa chỉ sản xuất</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-16">Giờ nhập</th>
                    <th colSpan={2} className="border border-slate-800 p-1.5">Khối lượng</th>
                    <th colSpan={3} className="border border-slate-800 p-1.5">Nơi cung cấp</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-24">Hạn sử dụng</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">ĐK bảo quản</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Chứng từ,<br />hóa đơn</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Kiểm tra<br />cảm quan</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Biện pháp xử lý/<br />ghi chú</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-800 p-1.5 w-12">KL</th>
                    <th className="border border-slate-800 p-1.5 w-12">ĐVT</th>
                    <th className="border border-slate-800 p-1.5">Tên cơ sở</th>
                    <th className="border border-slate-800 p-1.5">Chủ giao hàng</th>
                    <th className="border border-slate-800 p-1.5">Địa chỉ, điện thoại</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDry.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="border border-slate-800 p-4 text-center text-slate-500">
                        Không có bản ghi thực phẩm khô/gia vị nào trong {monthTitle}
                      </td>
                    </tr>
                  ) : (
                    sortedDry.map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{formatVNDate(r.col_1 || r.date)}</td>
                        <td className="border border-slate-800 p-1.5 font-bold">{r.col_3 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_4 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_5 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_2 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_11 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_10 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_6 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_7 || ''}</td>
                        <td className="border border-slate-800 p-1.5">
                          {r.col_8 || ''}
                          {r.col_8 && r.col_9 ? ' - ' : ''}
                          {r.col_9 || ''}
                        </td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_12 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_13 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_14 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-semibold">{r.col_16 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_17 || ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6 text-center text-xs px-8">
              <div>
                <b>Người kiểm tra</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người phụ trách cơ sở</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>.........................................</b>
              </div>
            </div>
          </div>
        )}

        {/* FORM 2: KHI CHẾ BIẾN */}
        {(selectedForm === 'ALL' || selectedForm === 'M2') && (
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 print:break-after-page">
            <div className="flex flex-wrap justify-between gap-4 pb-3 mb-3 border-b border-slate-300 text-xs">
              <div className="space-y-0.5">
                <div><b>Tên cơ sở/ Chi nhánh:</b> {settings.companyName}</div>
                <div><b>Người kiểm tra:</b> {settings.inspector}</div>
                <div><b>Thời gian kiểm tra:</b> {monthTitle}</div>
                <div><b>Địa điểm:</b> {settings.location}</div>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-amber-700">
                  Mẫu số 2: Kiểm tra khi chế biến thức ăn (Bước 2)
                </h4>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-9">TT</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Ngày</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Ca/ bữa ăn</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Tên món ăn</th>
                    <th colSpan={2} className="border border-slate-800 p-1.5">Nguyên liệu chính để chế biến<br /><i>(Tên, Số lượng...)</i></th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-16">Số suất ăn</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-18">TG sơ chế xong</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-18">TG chế biến xong</th>
                    <th colSpan={3} className="border border-slate-800 p-1.5">Kiểm tra điều kiện vệ sinh</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5 w-20">Kiểm tra<br />cảm quan</th>
                    <th rowSpan={2} className="border border-slate-800 p-1.5">Biện pháp xử lý/<br />Ghi chú</th>
                  </tr>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-800 p-1.5">Tên nguyên liệu</th>
                    <th className="border border-slate-800 p-1.5 w-18">Số lượng</th>
                    <th className="border border-slate-800 p-1.5 w-20">Người chế biến</th>
                    <th className="border border-slate-800 p-1.5 w-20">Trang thiết bị</th>
                    <th className="border border-slate-800 p-1.5 w-20">Khu vực phụ trợ</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCook.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="border border-slate-800 p-4 text-center text-slate-500">
                        Không có bản ghi chế biến thức ăn nào trong {monthTitle}
                      </td>
                    </tr>
                  ) : (
                    cookGroups.map((g, gIdx) => {
                      const dishGroups: {
                        key: string;
                        dishName: string;
                        items: typeof g.items;
                      }[] = [];
                      let currDish: (typeof dishGroups)[0] | null = null;
                      for (let j = 0; j < g.items.length; j++) {
                        const itemObj = g.items[j];
                        const dName = (itemObj.fields.dishName || '').trim();
                        const dKey = dName.toLowerCase();
                        if (!dKey || !currDish || currDish.key !== dKey) {
                          currDish = { key: dKey, dishName: dName, items: [itemObj] };
                          dishGroups.push(currDish);
                        } else {
                          currDish.items.push(itemObj);
                        }
                      }
                      const mealRowspan = g.items.length;
                      let isFirstMealRow = true;

                      return dishGroups.map((dg, dgIdx) => {
                        const dishRowspan = dg.items.length;
                        return dg.items.map((itemObj, dIdx) => {
                          const f = itemObj.fields;
                          const parsedIng =
                            f.ingName || f.ingQty
                              ? { names: f.ingName || '-', qtys: f.ingQty || '-' }
                              : parseIngredient(f.ingredients);
                          const isFirstDishRow = dIdx === 0;
                          const showMealCells = isFirstMealRow;
                          isFirstMealRow = false;

                          return (
                            <tr key={`${gIdx}-${dgIdx}-${dIdx}`}>
                              {showMealCells && (
                                <>
                                  <td rowSpan={mealRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {gIdx + 1}
                                  </td>
                                  <td rowSpan={mealRowspan} className="border border-slate-800 p-1.5 text-center font-bold align-middle">
                                    {formatVNDate(g.date)}
                                  </td>
                                  <td rowSpan={mealRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    <div>{g.meal || ''}</div>
                                    {g.time && <div className="text-[10px]">{g.time}</div>}
                                  </td>
                                </>
                              )}
                              {isFirstDishRow && (
                                <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 font-bold align-middle">
                                  {f.dishName || ''}
                                </td>
                              )}
                              <td className="border border-slate-800 p-1.5 align-middle">{parsedIng.names || '-'}</td>
                              <td className="border border-slate-800 p-1.5 text-center align-middle">{parsedIng.qtys || '-'}</td>
                              {isFirstDishRow && (
                                <>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.servings || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.prepTime || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.cookTime || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.hygienePerson || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.hygieneEquipment || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center align-middle">
                                    {f.hygieneArea || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 text-center font-semibold align-middle">
                                    {f.senseStatus || ''}
                                  </td>
                                  <td rowSpan={dishRowspan} className="border border-slate-800 p-1.5 align-middle">
                                    {f.handle || ''}
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        });
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6 text-center text-xs px-8">
              <div>
                <b>Người kiểm tra</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người phụ trách cơ sở</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>.........................................</b>
              </div>
            </div>
          </div>
        )}

        {/* FORM 3: TRƯỚC KHI ĂN */}
        {(selectedForm === 'ALL' || selectedForm === 'M3') && (
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0 print:break-after-page">
            <div className="flex flex-wrap justify-between gap-4 pb-3 mb-3 border-b border-slate-300 text-xs">
              <div className="space-y-0.5">
                <div><b>Tên cơ sở/ Chi nhánh:</b> {settings.companyName}</div>
                <div><b>Người kiểm tra:</b> {settings.inspector}</div>
                <div><b>Thời gian kiểm tra:</b> {monthTitle}</div>
                <div><b>Địa điểm:</b> {settings.location}</div>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-blue-700">
                  Mẫu số 3: Kiểm tra trước khi ăn (Bước 3)
                </h4>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-800 p-1.5 w-9">TT</th>
                    <th className="border border-slate-800 p-1.5 w-20">Ngày</th>
                    <th className="border border-slate-800 p-1.5 w-24">Ca/ bữa ăn</th>
                    <th className="border border-slate-800 p-1.5">Tên món ăn</th>
                    <th className="border border-slate-800 p-1.5 w-20">Số suất ăn</th>
                    <th className="border border-slate-800 p-1.5 w-24">TG chia xong</th>
                    <th className="border border-slate-800 p-1.5 w-24">TG bắt đầu ăn</th>
                    <th className="border border-slate-800 p-1.5">Dụng cụ chia, chứa đựng, che đậy, bảo quản thức ăn</th>
                    <th className="border border-slate-800 p-1.5 w-24">Kiểm tra<br />cảm quan</th>
                    <th className="border border-slate-800 p-1.5">Biện pháp xử lý/Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEat.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-slate-800 p-4 text-center text-slate-500">
                        Không có bản ghi kiểm tra trước khi ăn nào trong {monthTitle}
                      </td>
                    </tr>
                  ) : (
                    sortedEat.map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{formatVNDate(r.col_1 || r.date)}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_2 || ''}</td>
                        <td className="border border-slate-800 p-1.5 font-bold">{r.col_3 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_4 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_5 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_6 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_7 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-semibold">{r.col_8 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_9 || ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6 text-center text-xs px-8">
              <div>
                <b>Người kiểm tra</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người phụ trách cơ sở</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>.........................................</b>
              </div>
            </div>
          </div>
        )}

        {/* FORM 4: LƯU & HỦY MẪU */}
        {(selectedForm === 'ALL' || selectedForm === 'M4') && (
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs print:shadow-none print:border-none print:p-0">
            <div className="flex flex-wrap justify-between gap-4 pb-3 mb-3 border-b border-slate-300 text-xs">
              <div className="space-y-0.5">
                <div><b>Tên cơ sở/ Chi nhánh:</b> {settings.companyName}</div>
                <div><b>Người lưu mẫu:</b> {settings.inspector}</div>
                <div><b>Thời gian:</b> {monthTitle}</div>
                <div><b>Địa điểm lưu mẫu:</b> {settings.location}</div>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-rose-700">
                  Mẫu số 4: Mẫu theo dõi lưu và hủy thức ăn lưu
                </h4>
                <div className="text-[11px] text-slate-500 italic">
                  (Ban hành kèm theo Quyết định số 1246/QĐ-BYT ngày 31/3/2017 của Bộ Y tế)
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] border border-slate-900">
                <thead>
                  <tr className="bg-slate-100 text-center font-bold">
                    <th className="border border-slate-800 p-1.5 w-9">TT</th>
                    <th className="border border-slate-800 p-1.5 w-20">Ngày lưu</th>
                    <th className="border border-slate-800 p-1.5">Tên mẫu thức ăn</th>
                    <th className="border border-slate-800 p-1.5 w-20">Bữa ăn</th>
                    <th className="border border-slate-800 p-1.5 w-16">Số suất ăn</th>
                    <th className="border border-slate-800 p-1.5 w-20">Khối lượng/<br />thể tích</th>
                    <th className="border border-slate-800 p-1.5">Dụng cụ chứa mẫu</th>
                    <th className="border border-slate-800 p-1.5 w-20">Nhiệt độ<br />bảo quản</th>
                    <th className="border border-slate-800 p-1.5 w-24">Thời gian lấy mẫu</th>
                    <th className="border border-slate-800 p-1.5 w-24">Thời gian hủy mẫu</th>
                    <th className="border border-slate-800 p-1.5">Ghi chú chất lượng</th>
                    <th className="border border-slate-800 p-1.5 w-24">Người lưu</th>
                    <th className="border border-slate-800 p-1.5 w-24">Người hủy</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSample.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="border border-slate-800 p-4 text-center text-slate-500">
                        Không có bản ghi lưu mẫu thức ăn nào trong {monthTitle}
                      </td>
                    </tr>
                  ) : (
                    sortedSample.map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="border border-slate-800 p-1.5 text-center">{i + 1}</td>
                        <td className="border border-slate-800 p-1.5 text-center font-bold">{formatVNDate(r.col_1 || r.date)}</td>
                        <td className="border border-slate-800 p-1.5 font-bold">{r.col_3 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_2 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_4 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_5 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_6 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_7 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_8 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_9 || ''}</td>
                        <td className="border border-slate-800 p-1.5">{r.col_10 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_11 || ''}</td>
                        <td className="border border-slate-800 p-1.5 text-center">{r.col_12 || ''}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-6 text-center text-xs px-8">
              <div>
                <b>Người lưu mẫu</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người hủy mẫu</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>{settings.inspector}</b>
              </div>
              <div>
                <b>Người phụ trách cơ sở</b>
                <div className="text-[11px] italic">(Ký và ghi rõ họ tên)</div>
                <div className="h-16" />
                <b>.........................................</b>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
