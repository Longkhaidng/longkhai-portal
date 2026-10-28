'use client';

import React, { useState, useEffect } from 'react';
import { PCCCDevice, PCCC_CATEGORIES, formatPCCCDate } from '@/types/pccc';
import { generateQrDataUrl } from '@/lib/qr';
import { X, Printer, Download, QrCode } from 'lucide-react';

interface PCCCQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: PCCCDevice[];
  activeDevice?: PCCCDevice | null;
}

export function PCCCQrCodeModal({
  isOpen,
  onClose,
  devices,
  activeDevice,
}: PCCCQrCodeModalProps) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const displayDevices = activeDevice
    ? [activeDevice]
    : selectedCat === 'all'
    ? devices
    : devices.filter((d) => d.category === selectedCat);

  useEffect(() => {
    if (isOpen) {
      // Generate QR codes for displayed devices
      const generateAll = async () => {
        const newMap: Record<string, string> = {};
        for (const d of displayDevices.slice(0, 50)) {
          // Limit to first 50 per batch for rendering performance
          const qrText = `PCCC:${d.id}`;
          newMap[d.id] = await generateQrDataUrl(qrText);
        }
        setQrMap(newMap);
      };
      generateAll();
    }
  }, [isOpen, selectedCat, activeDevice]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-2xl">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {activeDevice ? `Tem Mã QR: ${activeDevice.id} - ${activeDevice.name}` : 'Danh Sách Tem Mã QR Thiết Bị PCCC'}
              </h3>
              <p className="text-xs text-slate-400">In tem dán lên thiết bị phục vụ kiểm tra nhanh bằng điện thoại</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In danh sách tem</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar (if not single device) */}
        {!activeDevice && (
          <div className="p-3 bg-slate-100 dark:bg-slate-850 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 no-print overflow-x-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-2 shrink-0">Lọc theo nhóm:</span>
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                selectedCat === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Tất cả (111)
            </button>
            {Object.entries(PCCC_CATEGORIES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setSelectedCat(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 ${
                  selectedCat === key
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {info.shortName} ({info.count})
              </button>
            ))}
          </div>
        )}

        {/* Grid of QR Stickers */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {displayDevices.map((d) => {
              const qr = qrMap[d.id];
              return (
                <div
                  key={d.id}
                  className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-2 shadow-xs"
                >
                  <div className="border-b border-slate-200 pb-1.5">
                    <div className="text-[10px] font-black tracking-wider uppercase text-slate-700">
                      LONG KHẢI PORTAL - PCCC
                    </div>
                    <div className="text-xs font-black text-red-600 font-mono">{d.id}</div>
                  </div>

                  <div className="flex justify-center py-1">
                    {qr ? (
                      <img src={qr} alt={d.id} className="w-32 h-32 object-contain" />
                    ) : (
                      <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded-lg">
                        Đang tạo QR...
                      </div>
                    )}
                  </div>

                  <div className="text-left text-[11px] space-y-0.5 border-t border-slate-200 pt-1.5">
                    <div className="font-bold text-slate-900 truncate" title={d.name}>
                      {d.name}
                    </div>
                    <div className="text-slate-600 truncate" title={d.location}>
                      📍 {d.location}
                    </div>
                    <div className="text-slate-500 font-medium text-[10px]">
                      Hạn KĐ: <span className="font-bold text-slate-800">{formatPCCCDate(d.inspectionExpiry)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
