'use client';

import React, { useState, useEffect } from 'react';
import { GasStation } from '@/types/gas-inspection';
import { generateQrDataUrl } from '@/lib/qr';
import {
  X,
  Printer,
  Download,
  QrCode,
  Flame,
  Shield,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface GasQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: GasStation[];
}

export function GasQrGeneratorModal({
  isOpen,
  onClose,
  stations,
}: GasQrGeneratorModalProps) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [selectedStationId, setSelectedStationId] = useState<string>('all');

  const displayStations =
    selectedStationId === 'all'
      ? stations
      : stations.filter((s) => s.id === selectedStationId);

  useEffect(() => {
    if (!isOpen) return;
    const generateAll = async () => {
      const map: Record<string, string> = {};
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://longkhai-portal.vercel.app';

      for (const st of stations) {
        // Direct scan URL opening gas inspection tab
        const url = `${origin}/?tab=gas_inspection&scan=true&stationId=${encodeURIComponent(st.id)}`;
        const qr = await generateQrDataUrl(url);
        map[st.id] = qr;
      }
      setQrMap(map);
    };

    generateAll();
  }, [isOpen, stations]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (st: GasStation) => {
    const dataUrl = qrMap[st.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_GAS_${st.code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header - Screen only */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Mã QR Kiểm Tra Hệ Thống Gas</h3>
              <p className="text-xs text-amber-100">
                In thẻ QR Code để dán tại các trạm gas, khu vực nấu bếp và cụm van điều áp
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" /> In mã thẻ (A4)
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar - Screen only */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Lọc theo trạm:</span>
            <select
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="all">Tất cả trạm gas ({stations.length})</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-500">
            Hiển thị {displayStations.length} thẻ mã QR
          </span>
        </div>

        {/* QR cards list */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50 print:bg-white print:p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
            {displayStations.map((st) => {
              const qrUrl = qrMap[st.id];
              return (
                <div
                  key={st.id}
                  className="bg-white border-2 border-amber-500/80 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col items-center text-center print:border-black print:rounded-none print:shadow-none print:break-inside-avoid"
                >
                  {/* Top Company Badge */}
                  <div className="w-full pb-2 mb-2 border-b border-slate-200 flex items-center justify-between text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center font-black text-white text-xs">
                        LK
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase text-slate-800 tracking-tight leading-tight">
                          LONG KHẢI PORTAL
                        </div>
                        <div className="text-[9px] text-slate-500">HỆ THỐNG AN TOÀN GAS & PCCC</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] tracking-wider uppercase border border-amber-300">
                      {st.code}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-extrabold text-slate-900 mt-1 uppercase tracking-tight flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    {st.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    {st.location}
                  </p>

                  {/* QR Image Box */}
                  <div className="my-4 p-3 bg-white border border-slate-300 rounded-xl shadow-inner relative flex items-center justify-center">
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR Code ${st.name}`}
                        className="w-48 h-48 object-contain"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                        Đang tạo mã QR...
                      </div>
                    )}
                  </div>

                  {/* Instructions */}
                  <div className="w-full bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-950 font-medium">
                    <div className="font-bold text-amber-800 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      QUY TRÌNH KIỂM TRA BẮT BUỘC
                    </div>
                    <p className="mt-1 text-slate-700 leading-snug">
                      Nhân viên kiểm tra quét mã QR trước khi bắt đầu. Thời gian kiểm tra thực tế
                      sẽ được hệ thống tự động ghi nhận và đồng bộ trực tuyến.
                    </p>
                  </div>

                  {/* Download button - screen only */}
                  <div className="mt-4 flex gap-2 print:hidden w-full">
                    <button
                      type="button"
                      onClick={() => handleDownload(st)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải ảnh QR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Công ty Cổ phần Long Khải tại Đà Nẵng</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
