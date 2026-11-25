'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { GasStation } from '@/types/gas-inspection';
import { storage } from '@/lib/storage';
import {
  QrCode,
  X,
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

interface GasQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: {
    station: GasStation;
    scanTimestamp: string;
    isQrScanned: boolean;
  }) => void;
}

export function GasQrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: GasQrScannerModalProps) {
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stations = storage.getGasStations();

  // Extract station from text or URL
  const extractStation = (text: string): GasStation => {
    const trimmed = text.trim();
    // 1. Check if contains stationId query
    if (trimmed.includes('stationId=')) {
      const match = trimmed.match(/stationId=([A-Za-z0-9_-]+)/i);
      if (match && match[1]) {
        const found = stations.find(
          (s) =>
            s.id.toLowerCase() === match[1].toLowerCase() ||
            s.code.toLowerCase() === match[1].toLowerCase()
        );
        if (found) return found;
      }
    }
    // 2. Direct code e.g. GAS-STATION-01, TRAM-GAS-BEP
    const directMatch = stations.find(
      (s) =>
        s.id.toLowerCase() === trimmed.toLowerCase() ||
        s.code.toLowerCase() === trimmed.toLowerCase()
    );
    if (directMatch) return directMatch;

    // 3. Keyword match (bếp, kho, trạm gas)
    const lower = trimmed.toLowerCase();
    if (lower.includes('bếp') || lower.includes('bep')) {
      const found = stations.find((s) => s.id === 'GAS-STATION-01');
      if (found) return found;
    }
    if (lower.includes('kho') || lower.includes('vỏ')) {
      const found = stations.find((s) => s.id === 'GAS-STATION-02');
      if (found) return found;
    }

    // Default to the first station (Trạm Gas Nhà Bếp)
    return stations[0];
  };

  const handleScanSuccess = (decodedText: string) => {
    const scanTimestamp = new Date().toISOString();
    const station = extractStation(decodedText);

    // Audio chime / feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.1); // E6 note
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {}

    cleanupScanner();
    onClose();
    onScanSuccess({
      station,
      scanTimestamp,
      isQrScanned: true,
    });
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try {
            scannerRef.current?.clear();
          } catch {}
          scannerRef.current = null;
          setIsScanning(false);
        });
      } else {
        try {
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setCameraError(null);
      setManualCode('');
      return;
    }

    if (scannerMode === 'camera') {
      const timer = setTimeout(() => {
        const element = document.getElementById('gas-qr-reader');
        if (!element) return;

        const html5QrCode = new Html5Qrcode('gas-qr-reader');
        scannerRef.current = html5QrCode;

        html5QrCode
          .start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            () => {
              // ignore parse errors during live video
            }
          )
          .then(() => {
            setIsScanning(true);
            setCameraError(null);
          })
          .catch((err) => {
            console.error('Camera start error:', err);
            setCameraError(
              'Không thể truy cập Camera. Vui lòng cấp quyền truy cập Camera hoặc sử dụng chức năng tải ảnh mã QR.'
            );
            setIsScanning(false);
          });
      }, 300);

      return () => {
        clearTimeout(timer);
        cleanupScanner();
      };
    } else {
      cleanupScanner();
    }
  }, [isOpen, scannerMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode('gas-qr-file-reader');
    html5QrCode
      .scanFile(file, true)
      .then((decodedText) => {
        html5QrCode.clear();
        handleScanSuccess(decodedText);
      })
      .catch((err) => {
        console.error('Error scanning file:', err);
        alert('Không tìm thấy mã QR hợp lệ trong hình ảnh tải lên. Vui lòng thử lại với ảnh rõ nét hơn.');
        html5QrCode.clear();
      });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const scanTimestamp = new Date().toISOString();
    const station = extractStation(manualCode);
    cleanupScanner();
    onClose();
    onScanSuccess({
      station,
      scanTimestamp,
      isQrScanned: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Quét Mã QR Hệ Thống Gas</h3>
              <p className="text-xs text-amber-100 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Ghi nhận thời gian kiểm tra thực tế
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupScanner();
              onClose();
            }}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setScannerMode('camera')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              scannerMode === 'camera'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera trực tiếp
          </button>
          <button
            type="button"
            onClick={() => setScannerMode('manual')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              scannerMode === 'manual'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" /> Nhập mã / Chọn trạm
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {scannerMode === 'camera' ? (
            <div className="flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{cameraError}</p>
                    <p className="mt-1 text-xs text-rose-600">
                      Gợi ý: Bạn có thể bấm nút bên dưới để chọn ảnh chụp mã QR từ máy.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="relative w-full aspect-square max-w-[320px] bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-dashed border-amber-400/80 flex items-center justify-center">
                <div id="gas-qr-reader" className="w-full h-full" />
                <div id="gas-qr-file-reader" className="hidden" />

                {/* Target overlay corners */}
                <div className="absolute inset-8 pointer-events-none border-2 border-amber-400/60 rounded-xl">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1" />
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Hướng camera về phía mã QR dán tại trạm gas hoặc khu vực nấu bếp.
                Thời gian kiểm tra sẽ được tự động khóa tại thời điểm quét.
              </p>

              {/* Upload fallback button */}
              <div className="mt-4 flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-2 transition-colors border border-slate-300"
                >
                  <Upload className="w-4 h-4" /> Tải ảnh mã QR từ máy
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn trạm gas cần kiểm tra:
                </label>
                <div className="space-y-2">
                  {stations.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        const scanTimestamp = new Date().toISOString();
                        cleanupScanner();
                        onClose();
                        onScanSuccess({
                          station: st,
                          scanTimestamp,
                          isQrScanned: false,
                        });
                      }}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-start justify-between group"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-sm group-hover:text-amber-700 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-amber-600" />
                          {st.name}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{st.location}</p>
                        <p className="text-[11px] text-amber-700/80 font-medium mt-0.5">
                          Mã trạm: {st.code} • Số bình phục vụ: {st.activeCylindersCount} bình
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        Chọn
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Hoặc nhập mã trạm / nội dung mã QR:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="VD: GAS-STATION-01 hoặc TRAM-GAS-BEP"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                  >
                    Tiếp tục
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info banner */}
        <div className="bg-amber-50/70 border-t border-amber-100 px-6 py-3 flex items-center justify-between text-xs text-amber-900">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Hệ thống tự động ghi nhận ngày giờ thực tế khi quét
          </span>
          <span className="text-[11px] text-slate-400">Long Khải EHS</span>
        </div>
      </div>
    </div>
  );
}
