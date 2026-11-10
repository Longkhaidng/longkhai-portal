'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Building,
  Calendar,
  LogIn,
  LogOut,
  QrCode,
  FileText,
  CreditCard,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Package,
  UtensilsCrossed,
  Camera,
  RefreshCw,
  Search,
  Lock,
  KeyRound,
  ScanLine,
  Check,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ISSUE_TYPE_LABELS } from '@/types/attendance';
import { checkFoodQrValidity } from '@/types/food-registration';
import { storage } from '@/lib/storage';
import { User as UserType } from '@/types/user';
import { isSecurityRole } from '@/lib/permissions';

// Parse QR Code content to extract document ID and type
function parseQrCodeContent(text: string): { id: string; type?: 'gate_pass' | 'attendance' | 'food' } {
  const trimmed = text.trim();
  try {
    if (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('/scan-confirm')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://longkhai-portal.vercel.app${trimmed}`);
      const id = url.searchParams.get('id') || url.searchParams.get('code') || '';
      const type = (url.searchParams.get('type') as any) || undefined;
      if (id) return { id: id.trim().toUpperCase(), type };
    }
  } catch {}

  if (trimmed.startsWith('LONGKHAI_GATEPASS:')) {
    const parts = trimmed.split(':');
    return { id: (parts[1] || trimmed).trim().toUpperCase(), type: 'gate_pass' };
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('TP')) return { id: upper, type: 'food' };
  if (upper.startsWith('GP')) return { id: upper, type: 'gate_pass' };
  if (upper.startsWith('ATT')) return { id: upper, type: 'attendance' };

  return { id: upper };
}

const SESSION_KEY = 'lk_portal_active_session_empid';

function getSavedSessionUser(): UserType | null {
  try {
    if (typeof window === 'undefined') return null;
    const savedEmpId = localStorage.getItem(SESSION_KEY);
    if (!savedEmpId) return null;
    const cleanId = savedEmpId.toUpperCase() === 'ADMIN01' ? '2265' : savedEmpId;
    const users = storage.getUsers();
    return users.find((u) => u.id.toLowerCase() === cleanId.toLowerCase() && u.isActive) || null;
  } catch {
    return null;
  }
}

function saveSessionUser(user: UserType | null) {
  try {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(SESSION_KEY, user.id);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {}
}

// Format Realtime in Vietnam
function getVietnamTimeNow(): string {
  return new Date().toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function ScanConfirmContent() {
  const searchParams = useSearchParams();
  const rawIdFromUrl = searchParams.get('id') || searchParams.get('code') || '';
  const paramTypeFromUrl = searchParams.get('type') as 'gate_pass' | 'attendance' | 'food' | null;

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Login Form State
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Document State
  const [currentDocId, setCurrentDocId] = useState<string>(rawIdFromUrl);
  const [currentDocType, setCurrentDocType] = useState<'gate_pass' | 'attendance' | 'food' | null>(paramTypeFromUrl);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [docType, setDocType] = useState<'gate_pass' | 'attendance' | 'food'>('gate_pass');
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [managerInfo, setManagerInfo] = useState<any>(null);

  // Security Action States
  const [guardNote, setGuardNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Result Modal
  const [resultModal, setResultModal] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    message: string;
  } | null>(null);

  // QR Scanner States for next scan
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Check login on mount
  useEffect(() => {
    try {
      const u = getSavedSessionUser();
      if (u) {
        setCurrentUser(u);
      }
    } catch (e) {
      console.warn('Error reading user session', e);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // Fetch document by ID
  const fetchDoc = useCallback((idToFetch: string, typeHint?: 'gate_pass' | 'attendance' | 'food' | null) => {
    if (!idToFetch) {
      setDocData(null);
      setIsLoadingDoc(false);
      return;
    }

    setIsLoadingDoc(true);
    setErrorMsg(null);

    const query = new URLSearchParams({ id: idToFetch });
    if (typeHint) query.set('type', typeHint);

    fetch(`/api/scan-confirm?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setErrorMsg(data.message || 'Không tìm thấy phiếu trên hệ thống.');
          setDocData(null);
          return;
        }
        setDocData(data.record);
        setDocType(data.type);
        setEmployeeInfo(data.employee);
        setManagerInfo(data.manager);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
        setDocData(null);
      })
      .finally(() => {
        setIsLoadingDoc(false);
      });
  }, []);

  // Load document when currentDocId changes or on init
  useEffect(() => {
    if (currentDocId) {
      fetchDoc(currentDocId, currentDocType);
    } else {
      setDocData(null);
    }
  }, [currentDocId, currentDocType, fetchDoc]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cleanId = loginId.trim();
      const cleanPass = loginPassword.trim();
      if (!cleanId || !cleanPass) {
        setLoginError('Vui lòng nhập Mã số nhân viên và Mật khẩu.');
        setIsLoggingIn(false);
        return;
      }

      await storage.syncFromServer();
      const users = storage.getUsers();
      const user = users.find((u) => u.id.toLowerCase() === cleanId.toLowerCase());

      if (!user) {
        setLoginError('Mã số nhân viên không tồn tại trong hệ thống.');
        setIsLoggingIn(false);
        return;
      }

      if (user.password !== cleanPass) {
        setLoginError('Mật khẩu không chính xác.');
        setIsLoggingIn(false);
        return;
      }

      // Check security role or authorized staff
      if (!isSecurityRole(user) && user.role !== 'admin' && user.role !== 'manager' && user.role !== 'hr' && user.role !== 'ehs') {
        setLoginError('Tài khoản của bạn không có quyền xác nhận tại cổng bảo vệ. Vui lòng đăng nhập tài khoản Bảo vệ hoặc Quản trị viên.');
        setIsLoggingIn(false);
        return;
      }

      saveSessionUser(user);
      setCurrentUser(user);

      // If docId is pending, trigger fetch
      if (currentDocId && !docData) {
        fetchDoc(currentDocId, currentDocType);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi xử lý đăng nhập.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản bảo vệ?')) {
      saveSessionUser(null);
      setCurrentUser(null);
      setDocData(null);
    }
  };

  // Live Camera Scanner management
  const startCameraScanner = useCallback(async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('guard-live-qr-reader');
      }

      if (scannerRef.current.isScanning) {
        return;
      }

      setScannerActive(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          const parsed = parseQrCodeContent(decodedText);
          if (parsed.id) {
            // Stop camera and load document
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().then(() => {
                setScannerActive(false);
              }).catch(() => {});
            }
            setCurrentDocId(parsed.id);
            setCurrentDocType(parsed.type || null);
            fetchDoc(parsed.id, parsed.type || null);
          }
        },
        () => {}
      );
    } catch (err: any) {
      console.warn('Cannot start camera scanner:', err);
      setCameraError('Không thể mở camera trên trình duyệt. Bạn có thể nhập mã phiếu vào ô bên dưới.');
      setScannerActive(false);
    }
  }, [fetchDoc]);

  const stopCameraScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch {}
      setScannerActive(false);
    }
  }, []);

  // When view changes to scanner (docData is null and user logged in), auto-start camera
  useEffect(() => {
    if (currentUser && !docData && !isLoadingDoc) {
      const timer = setTimeout(() => {
        startCameraScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCameraScanner();
      };
    } else {
      stopCameraScanner();
    }
  }, [currentUser, docData, isLoadingDoc, startCameraScanner, stopCameraScanner]);

  // Handle manual code search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCodeInput.trim().toUpperCase();
    if (!clean) return;
    const parsed = parseQrCodeContent(clean);
    setCurrentDocId(parsed.id);
    setCurrentDocType(parsed.type || null);
    fetchDoc(parsed.id, parsed.type || null);
    setManualCodeInput('');
  };

  // Handle Food Action (Confirm or Reject)
  const handleFoodAction = (action: 'confirm' | 'reject', rejectReason?: string) => {
    if (!docData || !currentUser) return;
    setIsSubmitting(true);

    const actualTimeVN = getVietnamTimeNow();
    const payload = {
      type: 'food',
      id: docData.id,
      action,
      guardName: currentUser.name || 'Bảo vệ cổng',
      guardId: currentUser.id,
      actualTime: actualTimeVN,
      note: action === 'confirm'
        ? (guardNote.trim() || 'Đã kiểm tra thực phẩm đảm bảo ATVSTP, đóng gói kín')
        : (rejectReason || guardNote.trim() || 'Không đảm bảo an toàn vệ sinh thực phẩm'),
    };

    fetch('/api/scan-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocData(data.record);
          try {
            if (typeof window !== 'undefined') {
              const localFood = localStorage.getItem('lk_portal_food_registrations');
              if (localFood) {
                const list = JSON.parse(localFood);
                const idx = list.findIndex((f: any) => f.id === data.record.id);
                if (idx >= 0) list[idx] = data.record;
                else list.unshift(data.record);
                localStorage.setItem('lk_portal_food_registrations', JSON.stringify(list));
                window.dispatchEvent(new Event('food_registrations_updated'));
              }
            }
          } catch {}

          setResultModal({
            show: true,
            success: action === 'confirm',
            title: action === 'confirm' ? 'Xác Nhận Cho Mang Vào Thành Công' : 'Đã Từ Chối Cho Mang Vào',
            message: data.message || `Bảo vệ ${currentUser.name} đã ${action === 'confirm' ? 'xác nhận' : 'từ chối'} cho nhân viên ${docData.employeeName} mang thực phẩm lúc ${actualTimeVN}.`,
          });
          setRejectPromptOpen(false);
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Lỗi xác nhận',
            message: data.message || 'Có lỗi xảy ra khi xác nhận.',
          });
        }
      })
      .catch((err) => {
        setResultModal({
          show: true,
          success: false,
          title: 'Lỗi kết nối',
          message: err.message || 'Không thể kết nối máy chủ.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Handle Gate Pass Action
  const handleGatePassAction = (action: 'depart' | 'return') => {
    if (!docData || !currentUser) return;
    setIsSubmitting(true);

    const actualTimeVN = getVietnamTimeNow();
    const payload = {
      type: 'gate_pass',
      id: docData.id,
      action,
      actualTime: new Date().toISOString(),
      guardName: currentUser.name || 'Bảo vệ cổng',
      guardId: currentUser.id,
      note: guardNote.trim() || 'Đã xác nhận kiểm tra vào/ra thực tế qua quét mã QR',
    };

    fetch('/api/scan-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocData(data.record);
          setResultModal({
            show: true,
            success: true,
            title: action === 'depart' ? 'Xác nhận Cho Ra Cổng Thành Công' : 'Xác nhận Đã Vào Cổng Thành Công',
            message: data.message || `Đã ghi nhận thời gian thực tế lúc ${actualTimeVN}.`,
          });
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Không thể xác nhận',
            message: data.message || 'Có lỗi xảy ra.',
          });
        }
      })
      .catch((err) => {
        setResultModal({
          show: true,
          success: false,
          title: 'Lỗi kết nối',
          message: err.message || 'Không thể kết nối máy chủ.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Handle Attendance Action
  const handleAttendanceAction = (actionType: 'check_in' | 'check_out') => {
    if (!docData || !currentUser) return;
    setIsSubmitting(true);

    const actualTimeVN = getVietnamTimeNow();
    const payload = {
      type: 'attendance',
      id: docData.id,
      action: actionType === 'check_in' ? 'confirm_check_in' : 'confirm_check_out',
      actionType,
      time: actualTimeVN,
      guardName: currentUser.name || 'Bảo vệ cổng',
      guardId: currentUser.id,
      note: guardNote.trim() || 'Đã xác nhận kiểm tra vào/ra thực tế qua quét mã QR',
    };

    fetch('/api/scan-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDocData(data.record);
          const actionLabel = actionType === 'check_in' ? 'Thời Gian Vào' : 'Thời Gian Ra';
          setResultModal({
            show: true,
            success: true,
            title: `Xác Nhận ${actionLabel} Thực Tế Thành Công`,
            message: data.message || `Đã ghi nhận ${actionLabel.toLowerCase()} thực tế lúc ${actualTimeVN} cho nhân viên ${docData.employeeName}.`,
          });
        } else {
          setResultModal({
            show: true,
            success: false,
            title: 'Không thể xác nhận',
            message: data.message || 'Có lỗi xảy ra.',
          });
        }
      })
      .catch((err) => {
        setResultModal({
          show: true,
          success: false,
          title: 'Lỗi kết nối',
          message: err.message || 'Không thể kết nối máy chủ.',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Handle Close Modal and Return to Scanner for NEXT PERSON
  const handleNextPerson = () => {
    setResultModal(null);
    setDocData(null);
    setCurrentDocId('');
    setErrorMsg(null);
    setGuardNote('');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/scan-confirm');
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // =========================================================================
  // CASE 1: GUARD IS NOT LOGGED IN -> DISPLAY SYSTEM LOGIN FORM
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 py-8 px-4 flex flex-col items-center justify-center font-sans text-slate-100">
        <div className="bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 border-b border-slate-800 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 p-2 rounded-2xl bg-white/95 shadow-lg">
                <img
                  src="/logo.png"
                  alt="Long Khai Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
              CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
            </div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>ĐĂNG NHẬP BẢO VỆ CỔNG</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Vui lòng đăng nhập bằng Mã số nhân viên và Mật khẩu được cấp để xác nhận mã QR tại cổng bảo vệ.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mã số nhân viên (MSNV) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Ví dụ: 104, 101, 102..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Chỉ dành cho Tổ Bảo Vệ & An Ninh nhà máy
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CASE 2: GUARD IS LOGGED IN
  // =========================================================================
  const foodValidity = docType === 'food' && docData ? checkFoodQrValidity(docData) : null;
  const normalizedFoodDetails = docData?.foodDetails
    ? docData.foodDetails.replace(/Bánh \+ Sữa,\s*Trái cây \+ Sữa/gi, 'Bánh + Sữa hoặc Trái cây + Sữa')
    : 'Không có mô tả chi tiết';

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-start font-sans text-slate-100">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        
        {/* Authoritative Header */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-5 border-b border-slate-800 text-center relative">
          <div className="flex justify-center mb-2.5">
            <div className="w-13 h-13 p-1.5 rounded-2xl bg-white/95 shadow-lg">
              <img
                src="/logo.png"
                alt="Long Khai Corporation Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>XÁC NHẬN BẢO VỆ CỔNG (QUÉT MÃ QR)</span>
          </h1>

          {/* Active Guard Status Banner */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo vệ: {currentUser.name} ({currentUser.id}) &bull; Đang trực ca</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] text-slate-400 hover:text-rose-300 underline cursor-pointer ml-1"
            >
              Đổi tài khoản
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* 1. Loading State */}
          {isLoadingDoc && (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">
                Đang nạp dữ liệu phiếu từ mã QR...
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoadingDoc && errorMsg && (
            <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-center space-y-3">
              <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <div className="font-bold text-sm text-rose-200">Không thể tra cứu phiếu</div>
              <p className="text-xs text-rose-300/90">{errorMsg}</p>
              <button
                type="button"
                onClick={handleNextPerson}
                className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Quét mã khác
              </button>
            </div>
          )}

          {/* 3. DOCUMENT CONFIRMATION VIEW (When docData exists) */}
          {!isLoadingDoc && docData && (
            <>
              {/* Document Identity Banner: Corrected Title according to docType */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">
                    {docType === 'gate_pass'
                      ? 'Phiếu Ra - Vào Cổng'
                      : docType === 'food'
                      ? 'Phiếu Đăng Ký Mang Thực Phẩm'
                      : 'Phiếu Xác Nhận Công Vào - Ra'}
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                    {docData.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Thời gian tạo:</span>
                  <span className="text-xs font-semibold text-slate-300">
                    {docData.createdAt ? new Date(docData.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                </div>
              </div>

              {/* Employee Information Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>THÔNG TIN NGƯỜI LAO ĐỘNG</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Họ và tên:</span>
                    <span className="font-bold text-white text-sm">
                      {docData.employeeName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Mã số nhân viên:</span>
                    <span className="font-bold font-mono text-blue-400">
                      {docData.employeeId}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">Phòng ban / Xưởng:</span>
                    <span className="font-semibold text-slate-200">
                      {docData.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* DETAILS: FOOD REGISTRATION */}
              {docType === 'food' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                      <span>CHI TIẾT THỰC PHẨM ĐĂNG KÝ MANG VÀO</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block mb-1">Phân loại thực phẩm:</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {docData.category === 'pregnant'
                            ? '🤰 Thức ăn cho người mang thai'
                            : docData.category === 'vegetarian'
                            ? '🥗 Thực phẩm chay'
                            : docData.category === 'medicine_drink'
                            ? '🍵 Nước thuốc'
                            : docData.customCategory ? `🍱 Khác (${docData.customCategory})` : '🍱 Khác'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">{docData.toDate ? 'Thời gian mang vào:' : 'Ngày mang vào:'}</span>
                          <span className="font-bold text-white">
                            {docData.toDate && docData.toDate !== docData.entryDate ? `${formatDate(docData.entryDate)} → ${formatDate(docData.toDate)}` : formatDate(docData.entryDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Ca làm việc:</span>
                          <span className="font-semibold text-amber-300">
                            {docData.shift || (docData.toDate ? 'Theo đợt' : 'Ca làm việc tiêu chuẩn')}
                          </span>
                        </div>
                      </div>

                      {docData.timeFrame && (
                        <div>
                          <span className="text-slate-400 text-[11px] block">Khung giờ dự kiến mang vào:</span>
                          <span className="font-semibold text-slate-200">
                            {docData.timeFrame}
                          </span>
                        </div>
                      )}

                      {/* Chi tiết món ăn hoặc Lý do nước thuốc */}
                      {docData.category === 'medicine_drink' ? (
                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-slate-400 text-[11px] block mb-1">Lý do mang nước thuốc vào:</span>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold whitespace-pre-wrap leading-relaxed">
                            {docData.medicineReason || docData.foodDetails || 'Uống nước thuốc theo nhu cầu y tế'}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800/60">
                          <span className="text-slate-400 text-[11px] block mb-1">Chi tiết món ăn:</span>
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold whitespace-pre-wrap leading-relaxed">
                            {normalizedFoodDetails}
                          </div>
                          {docData.category === 'pregnant' && (
                            <div className="mt-2 text-[11px] text-amber-400 italic font-medium">
                              * Ghi chú: Mỗi người chỉ được phép mang vào 02 đơn vị cho mỗi loại thực phẩm.
                            </div>
                          )}
                          {docData.notes && (
                            <div className="mt-2 text-[11px] text-slate-300">
                              <span className="text-slate-400 font-medium">Ghi chú: </span>
                              {docData.notes}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/50 text-[11px] text-blue-300 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>Người lao động đã cam kết ATVSTP, sử dụng trong ngày và không mang vào khu vực sản xuất.</span>
                      </div>
                    </div>
                  </div>

                  {/* Validity check */}
                  {foodValidity?.isExpired ? (
                    <div className="p-5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-center space-y-2.5 animate-in fade-in">
                      <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                      <h4 className="text-sm sm:text-base font-black text-rose-200 uppercase tracking-wide">
                        Thời hạn đem thực phẩm vào nhà máy của bạn đã hết hiệu lực.
                      </h4>
                      <p className="text-xs text-rose-300">
                        Mã QR này không còn giá trị sử dụng qua cổng bảo vệ. Nhân viên bảo vệ không được phép xác nhận cho mang vào.
                      </p>
                    </div>
                  ) : !foodValidity?.isValid ? (
                    <div className="p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 text-center space-y-2 animate-in fade-in">
                      <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto" />
                      <h4 className="text-xs sm:text-sm font-bold text-amber-200 uppercase">
                        Chưa Được Cấp Phép Mang Vào
                      </h4>
                      <p className="text-xs text-amber-300 font-medium">
                        {foodValidity?.message || 'Đơn đăng ký cần được phê duyệt trước khi được phép mang vào.'}
                      </p>
                    </div>
                  ) : (
                    /* Valid Food Ticket Action */
                    <div className="space-y-4">
                      <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>MÃ QR HỢP LỆ</span>
                        </div>
                        <span className="text-[11px] font-medium text-emerald-200">{foodValidity.remainingText}</span>
                      </div>

                      {/* Action Box */}
                      <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-600/60 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Xác nhận kiểm tra thực phẩm tại cổng</span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                              Bảo vệ thực hiện xác nhận:
                            </label>
                            <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <User className="w-4 h-4 text-emerald-400" />
                                {currentUser.name} ({currentUser.id})
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">Thời gian: {getVietnamTimeNow()}</span>
                            </div>
                          </div>

                          <div>
                            <label className="text-slate-400 text-[11px] block mb-1 font-semibold">
                              Ghi chú kiểm tra (nếu có):
                            </label>
                            <input
                              type="text"
                              value={guardNote}
                              onChange={(e) => setGuardNote(e.target.value)}
                              placeholder="Ví dụ: Đã kiểm tra đúng món, đóng hộp kín đảm bảo ATVSTP"
                              className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleFoodAction('confirm')}
                              className="w-full py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{isSubmitting ? 'ĐANG LƯU...' : 'Xác nhận cho mang vào'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setRejectPromptOpen(true)}
                              className="w-full py-3.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Từ chối</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DETAILS: GATE PASS */}
              {docType === 'gate_pass' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <Briefcase className="w-4 h-4 text-amber-400" />
                      <span>CHI TIẾT XIN PHÉP RA - VÀO CỔNG</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Lý do ra cổng:</span>
                        <span className="font-bold text-amber-300 text-sm">
                          {docData.purpose}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Loại thời gian:</span>
                          <span className="font-semibold text-slate-200">
                            {docData.timeType === 'nghi_dau_gio'
                              ? 'Nghỉ đầu giờ (Vào trễ)'
                              : docData.timeType === 'nghi_giua_gio'
                              ? 'Nghỉ trong giờ (Ra & Vào lại)'
                              : docData.timeType === 'nghi_cuoi_gio'
                              ? 'Nghỉ cuối giờ (Về sớm)'
                              : 'Trong ca làm việc'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
                          <span className="font-bold text-emerald-400 uppercase">
                            {docData.status === 'approved' ? 'Đã duyệt ra cổng' : docData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gate Pass Action buttons */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-1 gap-2.5">
                      {docData.status === 'approved' && docData.timeType !== 'nghi_dau_gio' && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleGatePassAction('depart')}
                          className="w-full py-3.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{isSubmitting ? 'ĐANG LƯU...' : 'Xác nhận cho RA CỔNG'}</span>
                        </button>
                      )}

                      {docData.status === 'departed' && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleGatePassAction('return')}
                          className="w-full py-3.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>{isSubmitting ? 'ĐANG LƯU...' : 'Xác nhận ĐÃ VÀO CỔNG LẠI'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS: ATTENDANCE */}
              {docType === 'attendance' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>XÁC NHẬN CÔNG VÀO - RA</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Lý do quên thẻ:</span>
                        <span className="font-bold text-white">
                          {(ISSUE_TYPE_LABELS as any)[docData.issueType]?.text || 'Quên quẹt thẻ'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Ngày & Ca:</span>
                          <span className="font-semibold text-slate-200">
                            {formatDate(docData.date)} ({docData.shift})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px] block">Giờ thực tế:</span>
                          <span className="font-bold text-blue-400">
                            {docData.actualCheckIn ? `Vào: ${docData.actualCheckIn}` : ''}
                            {docData.actualCheckOut ? ` • Ra: ${docData.actualCheckOut}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAttendanceAction('check_in')}
                      className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Xác nhận giờ Vào</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleAttendanceAction('check_out')}
                      className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Xác nhận giờ Ra</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom return button to scanner */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleNextPerson}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Quay lại màn hình quét mã QR</span>
                </button>
              </div>
            </>
          )}

          {/* 4. SCANNER VIEW (When NO docData is active -> Ready to scan NEXT PERSON) */}
          {!isLoadingDoc && !docData && !errorMsg && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400">
                  <ScanLine className="w-4 h-4" />
                  <span>SẴN SÀNG QUÉT MÃ QR CHO NGƯỜI KẾ TIẾP</span>
                </div>
                <p className="text-xs text-slate-400">
                  Hướng camera vào mã QR của người lao động hoặc nhập mã phiếu bên dưới
                </p>
              </div>

              {/* Camera Scanner Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
                <div id="guard-live-qr-reader" className="w-full min-h-[260px] sm:min-h-[300px]" />
                
                {cameraError && (
                  <div className="p-4 bg-slate-900/90 text-center space-y-2 text-xs text-amber-300">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-400" />
                    <p>{cameraError}</p>
                    <button
                      type="button"
                      onClick={startCameraScanner}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử mở lại Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Input Form fallback */}
              <form onSubmit={handleManualSearch} className="space-y-2 pt-2">
                <label className="text-slate-400 text-xs font-semibold block">
                  Hoặc nhập trực tiếp mã số phiếu:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value)}
                      placeholder="Ví dụ: TP26-0005, GP26-0001, ATT26-0001..."
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-md transition-all"
                  >
                    Kiểm tra
                  </button>
                </div>
              </form>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center">
                💡 <span className="font-semibold text-slate-300">Mẹo cho bảo vệ:</span> Sau khi xác nhận cho một người, hệ thống tự động giữ đăng nhập và mở lại camera để bạn kiểm tra liên tục cho người tiếp theo!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/80 p-3.5 border-t border-slate-800/80 text-center text-[10px] text-slate-500 space-y-0.5">
          <div>Hệ thống Cổng Thông Tin Long Khải Portal &bull; Phiên bản bảo mật 2026</div>
        </div>
      </div>

      {/* POPUP REJECT REASON PROMPT */}
      {rejectPromptOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>Xác nhận từ chối cho mang vào</span>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-semibold">
                Lý do từ chối: *
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Ví dụ: Thực phẩm không đúng danh mục đã đăng ký, bao bì không kín, không đảm bảo ATVSTP..."
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectPromptOpen(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFoodAction('reject', rejectReasonInput)}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {isSubmitting ? 'Đang lưu...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP RESULT DIALOG - Match Image 2 exactly */}
      {resultModal && resultModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              resultModal.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {resultModal.success ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">
                {resultModal.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {resultModal.message}
              </p>
            </div>

            <button
              type="button"
              onClick={handleNextPerson}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Hoàn tất & Đóng</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ScanConfirmContent />
    </Suspense>
  );
}
