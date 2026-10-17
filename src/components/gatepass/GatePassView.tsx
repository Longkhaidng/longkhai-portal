'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  GatePass,
  GatePassAsset,
  GatePassStatus,
  GatePassTimeType,
  GatePassReasonCategory,
  PERSONAL_REASONS,
} from '@/types/gatePass';
import {
  QrCode,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  Clock,
  Printer,
  ShieldCheck,
  ScanLine,
  ArrowRight,
  LogOut,
  LogIn,
  Trash2,
} from 'lucide-react';
import { formatDate, formatDateTime, generateDocId } from '@/lib/utils';
import { generateQrDataUrl } from '@/lib/qr';
import { dispatchApprovalEmail } from '@/lib/email';

export function GatePassView() {
  const { currentUser } = useAuth();
  const [passes, setPasses] = useState<GatePass[]>(() => storage.getGatePasses());
  const [activeTab, setActiveTab] = useState<'list' | 'security_gate'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [passRejectionReason, setPassRejectionReason] = useState('');

  // Security Gate scan input
  const [scanCode, setScanCode] = useState('');
  const [scannedPass, setScannedPass] = useState<GatePass | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Helper for datetime-local
  const getTodayDateTimeStr = (hour = '08', minute = '00') => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hour}:${minute}`;
  };

  // New GatePass Form State
  const [timeType, setTimeType] = useState<GatePassTimeType>('nghi_giua_gio');
  const [departureTime, setDepartureTime] = useState(() => getTodayDateTimeStr('11', '30'));
  const [returnTime, setReturnTime] = useState(() => getTodayDateTimeStr('13', '00'));
  const [reasonCategory, setReasonCategory] = useState<GatePassReasonCategory>('ca_nhan');
  const [specificReason, setSpecificReason] = useState<string>('');
  const [companyReason, setCompanyReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [hasAssets, setHasAssets] = useState(false);
  const [assets, setAssets] = useState<GatePassAsset[]>([]);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetQty, setNewAssetQty] = useState(1);
  const [newAssetSerial, setNewAssetSerial] = useState('');

  const handleSelectTimeType = (type: GatePassTimeType) => {
    setTimeType(type);
    if (type === 'nghi_dau_gio') {
      if (!returnTime) setReturnTime(getTodayDateTimeStr('09', '00'));
    } else if (type === 'nghi_cuoi_gio') {
      if (!departureTime) setDepartureTime(getTodayDateTimeStr('15', '00'));
    } else if (type === 'nghi_giua_gio') {
      if (!departureTime) setDepartureTime(getTodayDateTimeStr('11', '30'));
      if (!returnTime) setReturnTime(getTodayDateTimeStr('13', '00'));
    }
  };

  // Add Asset item to list
  const handleAddAsset = () => {
    if (!newAssetName.trim()) return;
    const item: GatePassAsset = {
      id: `AST-${Date.now()}`,
      name: newAssetName.trim(),
      quantity: Number(newAssetQty) || 1,
      unit: 'cái',
      serialNumber: newAssetSerial.trim() || undefined,
    };
    setAssets([...assets, item]);
    setNewAssetName('');
    setNewAssetSerial('');
  };

  const handleRemoveAsset = (id: string) => {
    setAssets(assets.filter((a) => a.id !== id));
  };

  // Submit new Gate Pass
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (reasonCategory === 'ca_nhan' && !specificReason) {
      alert('Vui lòng chọn lý do cụ thể trong danh sách.');
      return;
    }
    if (reasonCategory === 'cong_ty' && !companyReason.trim()) {
      alert('Vui lòng nhập nội dung công việc hoặc địa điểm công tác.');
      return;
    }
    if (reasonCategory === 'khac' && !otherReason.trim()) {
      alert('Vui lòng nhập lý do ra - vào cổng.');
      return;
    }

    if (timeType === 'nghi_dau_gio' && !returnTime) {
      alert('Vui lòng chọn thời gian vào cổng.');
      return;
    }
    if (timeType === 'nghi_cuoi_gio' && !departureTime) {
      alert('Vui lòng chọn thời gian ra cổng.');
      return;
    }
    if (timeType === 'nghi_giua_gio' && (!departureTime || !returnTime)) {
      alert('Vui lòng chọn thời gian ra và thời gian vào.');
      return;
    }

    let finalPurpose = '';
    let calculatedPassType: 'business' | 'personal' = 'personal';

    if (reasonCategory === 'ca_nhan') {
      finalPurpose = specificReason;
      calculatedPassType = 'personal';
    } else if (reasonCategory === 'cong_ty') {
      finalPurpose = `Công tác: ${companyReason.trim()}`;
      calculatedPassType = 'business';
    } else {
      finalPurpose = `Khác: ${otherReason.trim()}`;
      calculatedPassType = 'personal';
    }

    const docId = generateDocId('GP', passes.length);
    const timeRef = departureTime || returnTime || new Date().toISOString();
    const qrPayload = `LONGKHAI_GATEPASS:${docId}:${currentUser.id}:${timeRef}`;

    const newPass: GatePass = {
      id: docId,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      department: currentUser.department,
      purpose: finalPurpose,
      passType: calculatedPassType,
      timeType,
      reasonCategory,
      specificReason: reasonCategory === 'ca_nhan' ? specificReason : undefined,
      customReason: reasonCategory === 'cong_ty' ? companyReason.trim() : reasonCategory === 'khac' ? otherReason.trim() : undefined,
      hasAssets: hasAssets && assets.length > 0,
      assets: hasAssets ? assets : [],
      estimatedDepartureTime: (timeType === 'nghi_giua_gio' || timeType === 'nghi_cuoi_gio') ? departureTime : undefined,
      estimatedReturnTime: (timeType === 'nghi_dau_gio' || timeType === 'nghi_giua_gio') ? returnTime : undefined,
      status: 'pending',
      qrCodeData: qrPayload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.saveGatePass(newPass, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setShowCreateModal(false);

    // Look up manager's email to dispatch approval email
    const allUsers = storage.getUsers();
    let managerEmail = currentUser.departmentHeadEmail;
    let managerName = 'Trưởng bộ phận';

    if (!managerEmail && currentUser.departmentHeadId) {
      const mgr = allUsers.find((u) => u.id.toLowerCase() === currentUser.departmentHeadId?.toLowerCase());
      if (mgr?.email) {
        managerEmail = mgr.email;
        managerName = mgr.name;
      }
    }

    if (!managerEmail) {
      const allDepts = storage.getDepartments();
      const myDept = allDepts.find((d) => d.name === currentUser.department);
      if (myDept?.managerId) {
        const mgr = allUsers.find((u) => u.id.toLowerCase() === myDept.managerId?.toLowerCase());
        if (mgr?.email) {
          managerEmail = mgr.email;
          managerName = mgr.name;
        }
      }
    }

    if (managerEmail) {
      const timeDesc =
        timeType === 'nghi_dau_gio'
          ? `Nghỉ đầu giờ (Vào cổng: ${formatDateTime(returnTime)})`
          : timeType === 'nghi_cuoi_gio'
          ? `Nghỉ cuối giờ (Ra cổng: ${formatDateTime(departureTime)})`
          : `Nghỉ giữa giờ (Ra: ${formatDateTime(departureTime)} - Vào: ${formatDateTime(returnTime)})`;

      dispatchApprovalEmail({
        toEmail: managerEmail,
        managerName,
        type: 'gate_pass',
        docId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        details: {
          title: 'Chi tiết Phiếu Ra - Vào Cổng',
          items: [
            {
              label: 'Hình thức',
              value:
                timeType === 'nghi_dau_gio'
                  ? 'Nghỉ đầu giờ'
                  : timeType === 'nghi_cuoi_gio'
                  ? 'Nghỉ cuối giờ'
                  : 'Nghỉ giữa giờ',
            },
            { label: 'Thời gian dự kiến', value: timeDesc },
            { label: 'Lý do ra cổng', value: finalPurpose },
            {
              label: 'Tài sản mang theo',
              value: hasAssets && assets.length > 0 ? `${assets.length} món tài sản` : 'Không mang theo',
            },
          ],
        },
      })
        .then((res) => {
          if (res.success) {
            alert(`✓ Đã tạo phiếu thành công và gửi email thông báo duyệt đến Trưởng bộ phận (${managerEmail})!`);
          }
        })
        .catch(console.error);
    }

    // Reset
    setTimeType('nghi_giua_gio');
    setDepartureTime(getTodayDateTimeStr('11', '30'));
    setReturnTime(getTodayDateTimeStr('13', '00'));
    setReasonCategory('ca_nhan');
    setSpecificReason('');
    setCompanyReason('');
    setOtherReason('');
    setAssets([]);
    setHasAssets(false);
  };

  // Manager Approve
  const handleManagerApprove = async (pass: GatePass) => {
    if (!currentUser) return;
    const updated: GatePass = {
      ...pass,
      status: 'approved',
      managerApproverId: currentUser.id,
      managerApproverName: currentUser.name,
      managerApprovedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setSelectedPass(updated);
  };

  // Manager Reject
  const handleManagerReject = async (pass: GatePass) => {
    if (!currentUser) return;
    if (!passRejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối phiếu!');
      return;
    }
    const updated: GatePass = {
      ...pass,
      status: 'rejected',
      managerApproverId: currentUser.id,
      managerApproverName: currentUser.name,
      managerApprovedAt: new Date().toISOString(),
      rejectionReason: passRejectionReason.trim(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setSelectedPass(updated);
    setIsRejecting(false);
    setPassRejectionReason('');
  };

  // Show QR modal
  const handleShowQr = async (pass: GatePass) => {
    const url = await generateQrDataUrl(pass.qrCodeData);
    setQrModalUrl(url);
    setSelectedPass(pass);
  };

  // Security Scanner: Lookup Pass by ID
  const handleLookupPass = (codeToSearch?: string) => {
    const code = (codeToSearch || scanCode).trim().toUpperCase();
    setScanMessage(null);
    if (!code) return;

    const found = passes.find((p) => p.id.toUpperCase() === code || p.qrCodeData.includes(code));
    if (found) {
      setScannedPass(found);
    } else {
      setScannedPass(null);
      setScanMessage(`Không tìm thấy phiếu ra vào cổng có mã "${code}"`);
    }
  };

  // Security Confirm Entry for Nghỉ đầu giờ (Vào cổng đầu ca)
  const handleConfirmEntry = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: GatePass = {
      ...pass,
      status: 'completed',
      actualReturnTime: now,
      securityReturnGuardId: currentUser.id,
      updatedAt: now,
    };
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setScanMessage(`✓ Đã ghi nhận giờ VÀO CỔNG cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`);
  };

  // Security Confirm Departure (Ra cổng)
  const handleConfirmDeparture = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const newStatus: GatePassStatus = pass.timeType === 'nghi_cuoi_gio' ? 'completed' : 'departed';
    const updated: GatePass = {
      ...pass,
      status: newStatus,
      actualDepartureTime: now,
      securityDepartureGuardId: currentUser.id,
      updatedAt: now,
    };
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setScanMessage(
      pass.timeType === 'nghi_cuoi_gio'
        ? `✓ Đã ghi nhận giờ RA CỔNG (Nghỉ cuối giờ) cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`
        : `✓ Đã ghi nhận giờ RA CỔNG cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}`
    );
  };

  // Security Confirm Return (Vào cổng lại)
  const handleConfirmReturn = (pass: GatePass) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updated: GatePass = {
      ...pass,
      status: 'completed',
      actualReturnTime: now,
      securityReturnGuardId: currentUser.id,
      updatedAt: now,
    };
    storage.saveGatePass(updated, { id: currentUser.id, name: currentUser.name });
    setPasses(storage.getGatePasses());
    setScannedPass(updated);
    setScanMessage(`✓ Đã ghi nhận giờ VÀO CỔNG LẠI cho nhân viên ${pass.employeeName} lúc ${formatDateTime(now)}. Phiếu hoàn tất!`);
  };

  // Filter
  const filtered = passes.filter((p) => {
    const matchesSearch =
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.purpose.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Phiếu Ra - Vào Cổng Nhà Máy (Gate Pass)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý nhân viên ra cổng, kiểm soát tài sản mang theo và quét mã QR Code an ninh
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switch tab buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Danh sách phiếu
            </button>
            <button
              onClick={() => setActiveTab('security_gate')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'security_gate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Bảo vệ cổng quét QR</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo phiếu ra cổng</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIST VIEW */}
      {activeTab === 'list' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã phiếu, tên NV, mục đích..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ quản lý duyệt</option>
                <option value="approved">Đã duyệt (Có hiệu lực QR)</option>
                <option value="departed">Đang ở ngoài (Đã ra cổng)</option>
                <option value="completed">Đã về lại (Hoàn tất)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã phiếu</th>
                    <th className="py-3.5 px-4">Người yêu cầu</th>
                    <th className="py-3.5 px-4">Lý do ra - vào cổng</th>
                    <th className="py-3.5 px-4">Tài sản mang theo</th>
                    <th className="py-3.5 px-4">Thời gian dự kiến</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Mã QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Không có phiếu ra vào cổng nào.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedPass(item)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.employeeName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.employeeId} &bull; {item.department}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2 max-w-[260px]">
                            {item.purpose}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.reasonCategory === 'cong_ty'
                                ? 'Công ty'
                                : item.reasonCategory === 'khac'
                                ? 'Lý do khác'
                                : 'Cá nhân'}
                            </span>
                            {item.timeType && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                                {item.timeType === 'nghi_dau_gio'
                                  ? 'Đầu giờ'
                                  : item.timeType === 'nghi_cuoi_gio'
                                  ? 'Cuối giờ'
                                  : 'Giữa giờ'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.hasAssets ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                              <Package className="w-3 h-3" />
                              <span>{item.assets.length} món tài sản</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Không mang</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.timeType === 'nghi_dau_gio' ? (
                            <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              Vào: {formatDateTime(item.estimatedReturnTime)}
                            </div>
                          ) : item.timeType === 'nghi_cuoi_gio' ? (
                            <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              Ra: {formatDateTime(item.estimatedDepartureTime)}
                            </div>
                          ) : (
                            <>
                              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                Ra: {formatDateTime(item.estimatedDepartureTime)}
                              </div>
                              {item.estimatedReturnTime && (
                                <div className="text-[10px] text-slate-400">
                                  Vào: {formatDateTime(item.estimatedReturnTime)}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Chờ duyệt
                            </span>
                          )}
                          {item.status === 'approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Đã duyệt
                            </span>
                          )}
                          {item.status === 'departed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Đang ở ngoài
                            </span>
                          )}
                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              Hoàn tất
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowQr(item);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60"
                            title="Xem mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: SECURITY GUARD SCANNER VIEW */}
      {activeTab === 'security_gate' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-2">
              <ScanLine className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Cổng Kiểm Soát An Ninh Bảo Vệ
            </h2>
            <p className="text-xs text-slate-500">
              Nhập mã phiếu (GPxxxx) hoặc quét mã QR trên màn hình điện thoại nhân viên
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Nhập mã phiếu (Ví dụ: GP26-000001)..."
              className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookupPass();
              }}
            />
            <button
              onClick={() => handleLookupPass()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Kiểm tra phiếu
            </button>
          </div>

          {scanMessage && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 font-medium">
              {scanMessage}
            </div>
          )}

          {/* Scanned Pass Result Card */}
          {scannedPass && (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {scannedPass.id}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {scannedPass.employeeName} ({scannedPass.employeeId})
                  </h3>
                  <p className="text-xs text-slate-500">{scannedPass.department}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {scannedPass.status}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <div>Lý do ra - vào: <b>{scannedPass.purpose}</b></div>
                <div>Hình thức: <b>{
                  scannedPass.timeType === 'nghi_dau_gio'
                    ? 'Nghỉ đầu giờ'
                    : scannedPass.timeType === 'nghi_cuoi_gio'
                    ? 'Nghỉ cuối giờ'
                    : 'Nghỉ giữa giờ'
                }</b></div>
                {scannedPass.estimatedDepartureTime && (
                  <div>Giờ dự kiến ra: <b>{formatDateTime(scannedPass.estimatedDepartureTime)}</b></div>
                )}
                {scannedPass.estimatedReturnTime && (
                  <div>Giờ dự kiến vào: <b>{formatDateTime(scannedPass.estimatedReturnTime)}</b></div>
                )}
                <div>Giờ ra thực tế: <b>{formatDateTime(scannedPass.actualDepartureTime)}</b></div>
                <div>Giờ vào thực tế: <b>{formatDateTime(scannedPass.actualReturnTime)}</b></div>
                <div>Quản lý duyệt: <b>{scannedPass.managerApproverName || 'Chưa duyệt'}</b></div>
              </div>

              {/* Assets list */}
              {scannedPass.hasAssets && scannedPass.assets.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1.5">
                    <Package className="w-4 h-4" />
                    <span>Tài sản mang theo (Bảo vệ đối chiếu khi ra/vào):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200">
                    {scannedPass.assets.map((ast) => (
                      <li key={ast.id}>
                        {ast.name} - SL: <b>{ast.quantity} {ast.unit}</b> {ast.serialNumber && `(Số Seri: ${ast.serialNumber})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons for Security Guard */}
              <div className="pt-2 flex gap-3">
                {scannedPass.status === 'approved' && scannedPass.timeType === 'nghi_dau_gio' && (
                  <button
                    onClick={() => handleConfirmEntry(scannedPass)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Xác nhận CHO VÀO CỔNG (Nghỉ đầu giờ)</span>
                  </button>
                )}

                {scannedPass.status === 'approved' && scannedPass.timeType !== 'nghi_dau_gio' && (
                  <button
                    onClick={() => handleConfirmDeparture(scannedPass)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>
                      {scannedPass.timeType === 'nghi_cuoi_gio'
                        ? 'Xác nhận CHO RA CỔNG (Nghỉ cuối giờ)'
                        : 'Xác nhận CHO RA CỔNG'}
                    </span>
                  </button>
                )}

                {scannedPass.status === 'departed' && (
                  <button
                    onClick={() => handleConfirmReturn(scannedPass)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Xác nhận ĐÃ VÀO CỔNG LẠI</span>
                  </button>
                )}

                {scannedPass.status === 'completed' && (
                  <div className="w-full text-center py-2 text-xs font-bold text-slate-500">
                    Phiếu này đã hoàn tất vào/ra cổng!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create Gate Pass */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Tạo Phiếu Ra - Vào Cổng
                </h3>
                <p className="text-xs text-slate-500">
                  Người yêu cầu: <b>{currentUser?.name}</b> ({currentUser?.id} - {currentUser?.department})
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              {/* Lý do ra – vào cổng */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lý do ra – vào cổng:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setReasonCategory('ca_nhan')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'ca_nhan'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Cá nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setReasonCategory('cong_ty')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'cong_ty'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Công ty
                  </button>
                  <button
                    type="button"
                    onClick={() => setReasonCategory('khac')}
                    className={`py-2 text-center rounded-xl border font-semibold transition-all ${
                      reasonCategory === 'khac'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Lý do khác
                  </button>
                </div>

                {reasonCategory === 'ca_nhan' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Chọn lý do cụ thể: *
                    </label>
                    <select
                      required
                      value={specificReason}
                      onChange={(e) => setSpecificReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="">-- Chọn lý do --</option>
                      {PERSONAL_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reasonCategory === 'cong_ty' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nội dung công tác / Địa điểm đến: *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={companyReason}
                      onChange={(e) => setCompanyReason(e.target.value)}
                      placeholder="Ghi rõ nội dung công việc công tác hoặc địa điểm..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {reasonCategory === 'khac' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nhập lý do cụ thể: *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Ghi rõ lý do ra - vào cổng..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Thời gian ra – vào dự kiến */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Thời gian ra – vào dự kiến:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_dau_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_dau_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ đầu giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_giua_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_giua_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ giữa giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTimeType('nghi_cuoi_gio')}
                    className={`py-2 px-1 text-center rounded-xl border font-semibold transition-all ${
                      timeType === 'nghi_cuoi_gio'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Nghỉ cuối giờ
                  </button>
                </div>

                {/* Conditional inputs */}
                {timeType === 'nghi_dau_gio' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Thời gian vào cổng: *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}

                {timeType === 'nghi_giua_gio' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Thời gian ra: *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Thời gian vào: *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {timeType === 'nghi_cuoi_gio' && (
                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Thời gian ra cổng: *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Assets Declaration */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={hasAssets}
                    onChange={(e) => setHasAssets(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Có mang theo tài sản / thiết bị ra ngoài</span>
                </label>

                {hasAssets && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                        placeholder="Tên tài sản (VD: Laptop Dell, Bộ dụng cụ kiểm tra...)"
                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        value={newAssetQty}
                        onChange={(e) => setNewAssetQty(Number(e.target.value))}
                        className="w-16 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddAsset}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                      >
                        Thêm
                      </button>
                    </div>

                    {assets.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {assets.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <span>
                              {a.name} (SL: {a.quantity})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAsset(a.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Tạo phiếu ra cổng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: View QR Code */}
      {qrModalUrl && selectedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Mã QR Ra Vào Cổng
            </h3>
            <p className="text-xs text-slate-500">
              Xuất trình mã này tại bốt bảo vệ khi qua cổng
            </p>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-sm">
              <img src={qrModalUrl} alt="Mã QR Phiếu ra cổng" className="w-56 h-56 mx-auto" />
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
              <div className="font-bold font-mono text-emerald-600">{selectedPass.id}</div>
              <div>{selectedPass.employeeName} ({selectedPass.employeeId})</div>
              <div className="text-[11px] text-slate-400">{selectedPass.purpose}</div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setQrModalUrl(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pass Detail & Manager Approval */}
      {selectedPass && !qrModalUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-600">{selectedPass.id}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Chi Tiết Phiếu Ra Vào Cổng
                </h3>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Nhân viên: <b className="text-slate-900 dark:text-white">{selectedPass.employeeName}</b> ({selectedPass.employeeId})</span>
                <span>Phòng ban: <b>{selectedPass.department}</b></span>
              </div>
              <div>
                <span className="text-slate-400">Hình thức ra - vào:</span>{' '}
                <b className="text-blue-600 dark:text-blue-400">
                  {selectedPass.timeType === 'nghi_dau_gio'
                    ? 'Nghỉ đầu giờ'
                    : selectedPass.timeType === 'nghi_cuoi_gio'
                    ? 'Nghỉ cuối giờ'
                    : 'Nghỉ giữa giờ'}
                </b>
              </div>
              <div>
                <span className="text-slate-400">Phân loại:</span>{' '}
                <b>
                  {selectedPass.reasonCategory === 'cong_ty'
                    ? 'Công việc / Công tác'
                    : selectedPass.reasonCategory === 'khac'
                    ? 'Lý do khác'
                    : 'Việc cá nhân'}
                </b>
              </div>
              <div>
                <span className="text-slate-400">Lý do cụ thể:</span>{' '}
                <b className="text-slate-900 dark:text-white">{selectedPass.purpose}</b>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
                {selectedPass.timeType !== 'nghi_dau_gio' && (
                  <div>
                    Thời gian ra dự kiến: <b>{formatDateTime(selectedPass.estimatedDepartureTime)}</b>
                  </div>
                )}
                {selectedPass.timeType !== 'nghi_cuoi_gio' && (
                  <div>
                    Thời gian vào dự kiến: <b>{formatDateTime(selectedPass.estimatedReturnTime)}</b>
                  </div>
                )}
                {selectedPass.actualDepartureTime && (
                  <div className="text-emerald-600 dark:text-emerald-400">
                    Bảo vệ xác nhận ra cổng: <b>{formatDateTime(selectedPass.actualDepartureTime)}</b>
                  </div>
                )}
                {selectedPass.actualReturnTime && (
                  <div className="text-emerald-600 dark:text-emerald-400">
                    Bảo vệ xác nhận vào cổng: <b>{formatDateTime(selectedPass.actualReturnTime)}</b>
                  </div>
                )}
              </div>

              {selectedPass.rejectionReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300">
                  <span className="font-bold">Lý do từ chối: </span>
                  <span>{selectedPass.rejectionReason}</span>
                </div>
              )}

              <div>
                Trạng thái:{' '}
                <span className="font-bold uppercase tracking-wider">
                  {selectedPass.status === 'pending'
                    ? 'Chờ duyệt'
                    : selectedPass.status === 'approved'
                    ? 'Đã duyệt'
                    : selectedPass.status === 'rejected'
                    ? 'Bị từ chối'
                    : selectedPass.status === 'departed'
                    ? 'Đang ở ngoài'
                    : 'Hoàn tất'}
                </span>
              </div>
            </div>

            {/* Manager approval / reject actions */}
            {selectedPass.status === 'pending' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
                  Phê duyệt phiếu ra cổng:
                </span>
                {!isRejecting ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManagerApprove(selectedPass)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Quản lý đồng ý duyệt phiếu</span>
                    </button>
                    <button
                      onClick={() => setIsRejecting(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>✕ Từ chối</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-rose-700 dark:text-rose-400">
                      Lý do từ chối: *
                    </label>
                    <textarea
                      rows={2}
                      autoFocus
                      required
                      value={passRejectionReason}
                      onChange={(e) => setPassRejectionReason(e.target.value)}
                      placeholder="Ghi rõ lý do từ chối phiếu ra cổng..."
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRejecting(false);
                          setPassRejectionReason('');
                        }}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManagerReject(selectedPass)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Xác nhận từ chối
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleShowQr(selectedPass)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Xem mã QR</span>
              </button>
              <button
                onClick={() => setSelectedPass(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
