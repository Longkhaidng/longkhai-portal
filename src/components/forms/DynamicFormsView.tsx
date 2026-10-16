'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  DynamicFormSchema,
  DynamicFormSubmission,
  FormField,
  FieldType,
} from '@/types/dynamicForm';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Settings,
  Send,
  Eye,
  FileCheck,
} from 'lucide-react';
import { formatDate, generateDocId } from '@/lib/utils';

export function DynamicFormsView() {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState<DynamicFormSchema[]>(() => storage.getDynamicForms());
  const [submissions, setSubmissions] = useState<DynamicFormSubmission[]>(() =>
    storage.getFormSubmissions()
  );
  const [activeTab, setActiveTab] = useState<'available' | 'submissions' | 'builder'>('available');

  // Filling Form State
  const [activeFormToFill, setActiveFormToFill] = useState<DynamicFormSchema | null>(null);
  const [fillFormData, setFillFormData] = useState<Record<string, any>>({});

  // Form Builder State (Admin Only)
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDesc, setNewFormDesc] = useState('');
  const [newFormCat, setNewFormCat] = useState('Sản xuất & Vận hành');
  const [fields, setFields] = useState<FormField[]>([]);

  // New field input
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Add field to builder
  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const fieldId = `f_${Date.now()}`;
    const opts = newFieldOptions
      ? newFieldOptions.split('\n').filter(Boolean).map((o) => ({ label: o.trim(), value: o.trim() }))
      : undefined;

    const f: FormField = {
      id: fieldId,
      label: newFieldLabel.trim(),
      fieldType: newFieldType,
      required: newFieldRequired,
      options: opts,
    };

    setFields([...fields, f]);
    setNewFieldLabel('');
    setNewFieldOptions('');
    setNewFieldRequired(false);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  // Save new form schema
  const handleSaveFormSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || fields.length === 0) {
      alert('Vui lòng thêm ít nhất 1 trường dữ liệu vào biểu mẫu!');
      return;
    }

    const newFormId = `FORM-${Date.now().toString().slice(-6)}`;
    const newSchema: DynamicFormSchema = {
      id: newFormId,
      title: newFormTitle,
      description: newFormDesc,
      category: newFormCat,
      icon: 'FileSpreadsheet',
      allowedDepartments: ['all'],
      fields,
      workflow: [
        { stepOrder: 1, stepName: 'Quản lý trực tiếp duyệt', approverRole: 'manager', canReject: true },
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newSchema, ...forms];
    storage.saveDynamicForms(updated, { id: currentUser.id, name: currentUser.name });
    setForms(updated);
    setActiveTab('available');

    // Reset
    setNewFormTitle('');
    setNewFormDesc('');
    setFields([]);
  };

  // Submit filled form
  const handleSubmitFilledForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFormToFill || !currentUser) return;

    const subId = generateDocId('SUB', submissions.length);
    const newSub: DynamicFormSubmission = {
      id: subId,
      formId: activeFormToFill.id,
      formTitle: activeFormToFill.title,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      data: fillFormData,
      status: 'pending',
      currentStepIndex: 0,
      approvalHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveFormSubmission(newSub, { id: currentUser.id, name: currentUser.name });
    setSubmissions(storage.getFormSubmissions());
    setActiveFormToFill(null);
    setFillFormData({});
    setActiveTab('submissions');
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Quản Lý Biểu Mẫu Điện Tử Động
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tạo biểu mẫu mới kéo thả không cần sửa code, phân quyền sử dụng và phê duyệt trực tuyến
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'available'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Danh mục biểu mẫu
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'submissions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Phiếu đã gửi ({submissions.length})
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'builder'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo form mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: AVAILABLE FORMS (FOR EMPLOYEES TO FILL) */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {item.description}
                </p>
                <div className="text-[11px] text-slate-400">
                  {item.fields.length} trường thông tin &bull; Quy trình {item.workflow.length} bước duyệt
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    setActiveFormToFill(item);
                    setFillFormData({});
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Điền & Nộp phiếu</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS LIST */}
      {activeTab === 'submissions' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã phiếu</th>
                  <th className="py-3.5 px-4">Tên biểu mẫu</th>
                  <th className="py-3.5 px-4">Người nộp</th>
                  <th className="py-3.5 px-4">Ngày gửi</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Chưa có phiếu biểu mẫu nào được gửi.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{sub.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">
                        {sub.formTitle}
                      </td>
                      <td className="py-3 px-4">
                        <div>{sub.employeeName}</div>
                        <div className="text-[11px] text-slate-400">{sub.employeeId} - {sub.department}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(sub.createdAt)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {sub.status === 'pending' ? 'Đang duyệt' : 'Hoàn tất'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FORM BUILDER (ADMIN) */}
      {activeTab === 'builder' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Builder configuration (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Cấu hình thông tin biểu mẫu mới
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên biểu mẫu:
                </label>
                <input
                  type="text"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  placeholder="VD: Phiếu Bàn Giao Thiết Bị, Đề Xuất Mua Vật Tư..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả / Hướng dẫn:
                </label>
                <input
                  type="text"
                  value={newFormDesc}
                  onChange={(e) => setNewFormDesc(e.target.value)}
                  placeholder="Mô tả mục đích sử dụng biểu mẫu này..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nhóm chuyên mục:
                </label>
                <input
                  type="text"
                  value={newFormCat}
                  onChange={(e) => setNewFormCat(e.target.value)}
                  placeholder="Chất lượng, Bảo trì, Sản xuất, Hành chính..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            {/* Field Adder */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-800 dark:text-white uppercase">
                Thêm trường dữ liệu (Field):
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="Tên trường (VD: Số lượng lỗi, Tên thiết bị...)"
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="text">Chữ ngắn (Text)</option>
                  <option value="number">Số lượng (Number)</option>
                  <option value="textarea">Văn bản dài (Textarea)</option>
                  <option value="date">Chọn ngày (Date)</option>
                  <option value="select">Hộp chọn thả xuống (Select)</option>
                  <option value="file">Đính kèm tệp / ảnh (File)</option>
                  <option value="signature">Chữ ký số điện tử (Signature)</option>
                </select>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Các lựa chọn (Mỗi dòng một lựa chọn):
                  </label>
                  <textarea
                    rows={3}
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Lựa chọn 1&#10;Lựa chọn 2&#10;Lựa chọn 3"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Bắt buộc điền</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  + Thêm trường này
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleSaveFormSchema}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Lưu & Kích hoạt biểu mẫu
              </button>
            </div>
          </div>

          {/* Realtime Form Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Xem trước biểu mẫu ({fields.length} trường):
            </h3>

            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {newFormTitle || 'Tên biểu mẫu'}
              </h4>
              <p className="text-xs text-slate-500">
                {newFormDesc || 'Mô tả biểu mẫu sẽ hiển thị tại đây...'}
              </p>

              {fields.map((f, i) => (
                <div key={f.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                    <span>
                      {i + 1}. {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </span>
                    <button
                      onClick={() => handleRemoveField(f.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">Loại: {f.fieldType}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fill and Submit Dynamic Form */}
      {activeFormToFill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {activeFormToFill.title}
                </h3>
                <p className="text-xs text-slate-500">{activeFormToFill.description}</p>
              </div>
              <button
                onClick={() => setActiveFormToFill(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitFilledForm} className="space-y-3.5 text-xs">
              {activeFormToFill.fields.map((field) => (
                <div key={field.id}>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {field.fieldType === 'text' && (
                    <input
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder}
                      value={fillFormData[field.id] || ''}
                      onChange={(e) =>
                        setFillFormData({ ...fillFormData, [field.id]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  )}

                  {field.fieldType === 'number' && (
                    <input
                      type="number"
                      required={field.required}
                      value={fillFormData[field.id] || ''}
                      onChange={(e) =>
                        setFillFormData({ ...fillFormData, [field.id]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  )}

                  {field.fieldType === 'textarea' && (
                    <textarea
                      rows={3}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={fillFormData[field.id] || ''}
                      onChange={(e) =>
                        setFillFormData({ ...fillFormData, [field.id]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  )}

                  {field.fieldType === 'date' && (
                    <input
                      type="date"
                      required={field.required}
                      value={fillFormData[field.id] || ''}
                      onChange={(e) =>
                        setFillFormData({ ...fillFormData, [field.id]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  )}

                  {field.fieldType === 'select' && (
                    <select
                      required={field.required}
                      value={fillFormData[field.id] || ''}
                      onChange={(e) =>
                        setFillFormData({ ...fillFormData, [field.id]: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="">-- Chọn một tùy chọn --</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveFormToFill(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Nộp phiếu biểu mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
