'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PCCCDevice } from '@/types/pccc';
import { storage } from '@/lib/storage';
import { QrCode, X, Camera, Upload, Search, CheckCircle2, AlertCircle } from 'lucide-react';

interface PCCCQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceDetected: (device: PCCCDevice) => void;
  lastSavedDevice?: PCCCDevice | null;
}

export function PCCCQrScannerModal({
  isOpen,
  onClose,
  onDeviceDetected,
  lastSavedDevice,
}: PCCCQrScannerModalProps) {
  const [scannerMode, setScannerMode] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const devices = storage.getPCCCDevices();

  // Play short confirmation beep on successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  // Clean device ID from QR text
  const extractDeviceId = (text: string): string => {
    let trimmed = text.trim();
    try {
      trimmed = decodeURIComponent(trimmed);
    } catch {}
    // Check if format is ?pccc=HT-xxx or &pccc=HT-xxx
    if (trimmed.includes('pccc=')) {
      const match = trimmed.match(/pccc=([A-Za-z0-9_ -]+)/i);
      if (match && match[1]) return match[1].trim().toUpperCase();
    }
    if (trimmed.toUpperCase().startsWith('PCCC:')) {
      return trimmed.slice(5).trim().toUpperCase();
    }
    // Direct code e.g. HT-CO2-01, HT-BOT-05
    return trimmed.toUpperCase();
  };

  const handleSuccessfulScan = (decodedText: string) => {
    const cleanId = extractDeviceId(decodedText);
    const found = devices.find(
      (d) => d.id.toUpperCase() === cleanId || d.id.toUpperCase() === cleanId.replace(/\s+/g, '')
    );

    if (found) {
      playBeep();
      stopScanner();
      onDeviceDetected(found);
      onClose();
    } else {
      // Partial match
      const partial = devices.find((d) => cleanId.includes(d.id.toUpperCase()));
      if (partial) {
        playBeep();
        stopScanner();
        onDeviceDetected(partial);
        onClose();
      } else {
        alert(`Mã QR "${decodedText}" không khớp với thiết bị PCCC nào trong danh mục 111 thiết bị.`);
      }
    }
  };

  const startScanner = async () => {
    setCameraError(null);
    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          await scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      scannerRef.current = new Html5Qrcode('pccc-reader');
      setIsScanning(true);

      const qrConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: Math.max(edge, 180), height: Math.max(edge, 180) };
        },
        aspectRatio: 1.0,
      };

      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          qrConfig,
          (decodedText) => {
            handleSuccessfulScan(decodedText);
          },
          () => {}
        );
      } catch (envErr) {
        console.warn('FacingMode environment failed, trying available cameras:', envErr);
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find((c) => /back|rear|environment|sau/i.test(c.label)) || cameras[cameras.length - 1];
          await scannerRef.current.start(
            backCam.id,
            qrConfig,
            (decodedText) => {
              handleSuccessfulScan(decodedText);
            },
            () => {}
          );
        } else {
          throw envErr;
        }
      }
    } catch (err: any) {
      console.warn('Camera scan failed to start:', err);
      setCameraError(
        'Không thể mở camera trên trình duyệt điện thoại (chưa cấp quyền truy cập hoặc camera đang bị ứng dụng khác sử dụng). Bạn có thể chọn tải ảnh chụp mã QR hoặc nhập nhanh mã thiết bị.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (isScanning || scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen && scannerMode === 'camera') {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, scannerMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const html5QrCode = new Html5Qrcode('pccc-file-reader');
        const result = await html5QrCode.scanFile(file, true);
        handleSuccessfulScan(result);
      } catch (err) {
        alert('Không tìm thấy mã QR hợp lệ trong ảnh. Vui lòng thử lại với ảnh chụp rõ nét hơn.');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-600 rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Quét Mã QR Thiết Bị PCCC</h3>
              <p className="text-[11px] text-slate-400">Tự động nhận diện thiết bị & mở phiếu kiểm tra</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-3 bg-slate-100 dark:bg-slate-850 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setScannerMode('camera')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              scannerMode === 'camera'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera trực tiếp</span>
          </button>
          <button
            onClick={() => {
              stopScanner();
              setScannerMode('manual');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              scannerMode === 'manual'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Nhập mã nhanh</span>
          </button>
        </div>

        {/* Success Banner when returned from a previous inspection */}
        {lastSavedDevice && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold">
                ✓ Đã lưu kết quả: <span className="font-mono text-emerald-700 dark:text-emerald-300">{lastSavedDevice.id}</span> - {lastSavedDevice.name}
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                Mời hướng camera vào mã QR của <strong>thiết bị tiếp theo</strong> để tiếp tục kiểm tra.
              </p>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 space-y-4">
          {scannerMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center border-2 border-slate-700">
                <div id="pccc-reader" className="w-full h-full" />
                <div id="pccc-file-reader" className="hidden" />

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col items-center justify-center text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs text-slate-300">{cameraError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Tải ảnh QR từ máy</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Upload photo button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">Hoặc chọn ảnh đã chụp:</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn file ảnh</span>
                </button>
              </div>
            </div>
          )}

          {scannerMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nhập mã thiết bị PCCC
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ví dụ: HT-CO2-01 hoặc HT-BOT-15"
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 uppercase"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              {/* Quick Select Buttons from List */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Hoặc chọn nhanh thiết bị:
                </span>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {devices.slice(0, 15).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSuccessfulScan(d.id)}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white mr-2">{d.id}</span>
                        <span className="text-slate-500">{d.location}</span>
                      </div>
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                        Chọn
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kiểm tra thiết bị này</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer with Finish / Close button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lastSavedDevice ? 'Đang trong phiên kiểm tra liên tục' : 'Sẵn sàng quét mã QR'}
          </p>
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
