'use client';

import React, { useState, useEffect } from 'react';
import { PCCCDevice, PCCCCategory, PCCC_CATEGORIES } from '@/types/pccc';
import { storage } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { X, Save, Plus, Edit2, ShieldAlert } from 'lucide-react';

interface PCCCDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceToEdit?: PCCCDevice | null;
  onSaved: (device: PCCCDevice) => void;
}

export function PCCCDeviceModal({
  isOpen,
  onClose,
  deviceToEdit,
  onSaved,
}: PCCCDeviceModalProps) {
  const { currentUser } = useAuth();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PCCCCategory>('binh_bot');
  const [location, setLocation] = useState('');
  const [specs, setSpecs] = useState('4.0 kg');
  const [inspectionExpiry, setInspectionExpiry] = useState('20/12/2026');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (deviceToEdit) {
      setId(deviceToEdit.id);
      setName(deviceToEdit.name);
      setCategory(deviceToEdit.category);
      setLocation(deviceToEdit.location);
      setSpecs(deviceToEdit.specs);
      setInspectionExpiry(deviceToEdit.inspectionExpiry);
      setNotes(deviceToEdit.notes || '');
    } else {
      setId('');
      setName('');
      setCategory('binh_bot');
      setLocation('');
      setSpecs('4.0 kg');
      setInspectionExpiry('20/12/2026');
      setNotes('');
    }
  }, [deviceToEdit, isOpen]);

  // Adjust default specs when category changes for new device
  const handleCategoryChange = (cat: PCCCCategory) => {
    setCategory(cat);
    if (!deviceToEdit) {
      if (cat === 'binh_bot') setSpecs('4.0 kg');
      else if (cat === 'binh_co2') setSpecs('10 kg');
      else if (cat === 'nut_chuong') setSpecs('24VDC');
      else if (cat === 'tu_voi_vach') setSpecs('D50 - 20m');
      else if (cat === 'tram_bom') setSpecs('3 máy bơm 7-9 bar');
      else if (cat === 'tu_trung_tam') setSpecs('24VDC 10 Zone');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = id.trim().toUpperCase();
    if (!cleanId || !name.trim() || !location.trim()) {
      alert('Vui lòng nhập đầy đủ Mã thiết bị, Tên thiết bị và Vị trí đặt.');
      return;
    }

    const devices = storage.getPCCCDevices();
    // Check duplicate ID if new
    if (!deviceToEdit && devices.some((d) => d.id.toUpperCase() === cleanId)) {
      alert(`Mã thiết bị "${cleanId}" đã tồn tại trên hệ thống. Vui lòng nhập mã khác.`);
      return;
    }

    const updatedDevice: PCCCDevice = {
      id: cleanId,
      name: name.trim(),
      category,
      location: location.trim(),
      specs: specs.trim() || '-',
      inspectionExpiry: inspectionExpiry.trim() || '20/12/2026',
      notes: notes.trim() || undefined,
      lastInspection: deviceToEdit?.lastInspection || {
        status: 'pass',
        date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        inspectorId: currentUser?.id || '2265',
        inspectorName: currentUser?.name || 'Trần Lê Hữu Lực',
      },
    };

    storage.updatePCCCDevice(updatedDevice);
    onSaved(updatedDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 rounded-xl">
              {deviceToEdit ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {deviceToEdit ? `Chỉnh Sửa Thiết Bị: ${deviceToEdit.id}` : 'Thêm Thiết Bị PCCC Mới'}
              </h3>
              <p className="text-[11px] text-slate-400">Cập nhật thông tin vào Master Data PCCC nhà máy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mã Thiết Bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Ví dụ: HT-BOT-34"
                disabled={!!deviceToEdit}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl uppercase disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chủng Loại <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as PCCCCategory)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                {Object.entries(PCCC_CATEGORIES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tên Thiết Bị <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bình chữa cháy bột MFZ4 số 34"
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Vị Trí Đặt <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Xưởng may 2 - Cột D3"
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Chuẩn Kỹ Thuật
              </label>
              <input
                type="text"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                placeholder="4.0 kg, 10 kg, 24VDC..."
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hạn Kiểm Định
              </label>
              <input
                type="text"
                value={inspectionExpiry}
                onChange={(e) => setInspectionExpiry(e.target.value)}
                placeholder="dd/mm/yyyy (20/12/2026)"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{deviceToEdit ? 'Lưu thay đổi' : 'Thêm thiết bị'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
