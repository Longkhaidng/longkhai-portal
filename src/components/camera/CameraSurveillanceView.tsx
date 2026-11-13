'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  CameraItem,
  CameraRequest,
  CameraPurpose,
  CAMERA_PURPOSE_LABELS,
  CAMERA_STATUS_LABELS,
  CAMERA_STATUS_BADGES,
} from '@/types/camera';
import {
  canAccessCameraReport,
  canApproveCameraIT,
  canApproveCameraHR,
  filterUserCameraRequests,
  isITStaff,
  isHRHead,
  isSuperAdminOrBOD,
} from '@/lib/permissions';
import { generateCameraTemplateExcel, parseCameraExcel } from '@/lib/excel';
import { capitalizeFirstLetter, formatDate, formatDateTime } from '@/lib/utils';
import {
  Camera,
  Shield,
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Send,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  Edit,
  Trash2,
  Check,
  X,
  Printer,
  Download,
  Filter,
} from 'lucide-react';

export function CameraSurveillanceView() {
  const { currentUser } = useAuth();

  // Navigation tab: 'form' | 'list' | 'manage_cameras'
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'manage_cameras'>('form');

  // Master Data state
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [requests, setRequests] = useState<CameraRequest[]>([]);

  // Load data
  const loadData = () => {
    setCameras(storage.getCameras());
    setRequests(storage.getCameraRequests());
  };

  useEffect(() => {
    loadData();

    const handleCamerasUpdated = () => setCameras(storage.getCameras());
    const handleRequestsUpdated = () => setRequests(storage.getCameraRequests());

    window.addEventListener('cameras_updated', handleCamerasUpdated);
    window.addEventListener('camera_requests_updated', handleRequestsUpdated);

    return () => {
      window.removeEventListener('cameras_updated', handleCamerasUpdated);
      window.removeEventListener('camera_requests_updated', handleRequestsUpdated);
    };
  }, []);

  // Determine user capabilities
  const isAdmin = isSuperAdminOrBOD(currentUser);
  const isIT = isITStaff(currentUser);
  const isHR = isHRHead(currentUser) || currentUser?.role === 'hr';
  const canManageCameras = isAdmin || isIT;

  // ----------------------------------------------------
  // FORM STATE & HANDLERS
  // ----------------------------------------------------
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [purpose, setPurpose] = useState<CameraPurpose>('kiem_tra_su_viec');
  const [purposeDetail, setPurposeDetail] = useState('');
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [cameraSearch, setCameraSearch] = useState('');
  const [cameraZoneFilter, setCameraZoneFilter] = useState('all');
  const [targetDate, setTargetDate] = useState(todayStr);
  const [fromTime, setFromTime] = useState('08:00');
  const [toTime, setToTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Camera list available for selection
  const cameraZones = useMemo(() => {
    const set = new Set<string>();
    cameras.forEach((c) => {
      if (c.zone) set.add(c.zone);
    });
    return Array.from(set);
  }, [cameras]);

  const filteredCamerasForSelect = useMemo(() => {
    return cameras.filter((c) => {
      if (c.status === 'inactive') return false;
      const matchSearch =
        !cameraSearch.trim() ||
        c.name.toLowerCase().includes(cameraSearch.toLowerCase()) ||
        c.code.toLowerCase().includes(cameraSearch.toLowerCase()) ||
        c.zone.toLowerCase().includes(cameraSearch.toLowerCase());
      const matchZone = cameraZoneFilter === 'all' || c.zone === cameraZoneFilter;
      return matchSearch && matchZone;
    });
  }, [cameras, cameraSearch, cameraZoneFilter]);

  const handleToggleCamera = (camId: string) => {
    setSelectedCameraIds((prev) =>
      prev.includes(camId) ? prev.filter((id) => id !== camId) : [...prev, camId]
    );
  };

  const handleResetForm = () => {
    setPurpose('kiem_tra_su_viec');
    setPurposeDetail('');
    setSelectedCameraIds([]);
    setCameraSearch('');
    setCameraZoneFilter('all');
    setTargetDate(todayStr);
    setFromTime('08:00');
    setToTime('10:00');
    setReason('');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (selectedCameraIds.length === 0) {
      alert('Vui lòng chọn ít nhất một camera cần xem!');
      return;
    }

    if (!reason.trim()) {
      alert('Vui lòng nhập lý do và nội dung cần kiểm tra!');
      return;
    }

    setFormSubmitting(true);

    try {
      // Generate ID matching CAM_001, CAM_002, etc.
      const existing = storage.getCameraRequests();
      let maxNum = 0;
      existing.forEach((r) => {
        const match = r.id.match(/^CAM_(\d+)$/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      });
      const nextNum = maxNum + 1;
      const nextId = `CAM_${String(nextNum).padStart(3, '0')}`;

      const selectedCams = cameras.filter((c) => selectedCameraIds.includes(c.id));
      const cameraNames = selectedCams.map((c) => c.name);

      const now = new Date().toISOString();
      const newRequest: CameraRequest = {
        id: nextId,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department || 'Chưa cập nhật',
        position: currentUser.position || 'Nhân viên',
        purpose,
        purposeDetail: purpose === 'khac' ? capitalizeFirstLetter(purposeDetail) : undefined,
        cameraIds: selectedCameraIds,
        cameraNames,
        targetDate,
        fromTime,
        toTime,
        reason: capitalizeFirstLetter(reason.trim()),
        status: 'pending_it',
        currentStepIndex: 0,
        steps: [
          {
            stepIndex: 0,
            stepName: 'Bộ phận IT kiểm tra & duyệt',
            roleRequired: 'it',
            status: 'pending',
          },
          {
            stepIndex: 1,
            stepName: 'Trưởng phòng HCNS phê duyệt',
            roleRequired: 'hr',
            status: 'pending',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      storage.saveCameraRequest(newRequest, { id: currentUser.id, name: currentUser.name });

      handleResetForm();
      setSubmitSuccessMsg(`Đã gửi thành công phiếu ${nextId}! Yêu cầu đang được chuyển đến Bộ phận IT kiểm tra.`);
      setTimeout(() => {
        setSubmitSuccessMsg('');
        setActiveTab('list');
      }, 1500);
    } catch (err: any) {
      alert('Lỗi tạo phiếu: ' + (err.message || 'Không xác định'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // LIST STATE & HANDLERS
  // ----------------------------------------------------
  const [listScope, setListScope] = useState<'all' | 'pending' | 'my'>('all');
  const [listSearch, setListSearch] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<CameraRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Approval modal states
  const [approvalComment, setApprovalComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Filter requests based on user permissions:
  // - Regular employee ONLY sees their own requests!
  // - IT and HR and Admin can see all / approver queue.
  const visibleRequests = useMemo(() => {
    // Basic permissions filter
    let base = filterUserCameraRequests(
      requests,
      currentUser,
      listScope === 'my' ? 'my' : listScope === 'pending' ? 'approver' : 'all'
    );

    // Filter by status dropdown
    if (listStatusFilter !== 'all') {
      base = base.filter((r) => r.status === listStatusFilter);
    }

    // Filter by search keyword
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      base = base.filter((r) => {
        return (
          r.id.toLowerCase().includes(q) ||
          r.employeeName.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.cameraNames.some((c) => c.toLowerCase().includes(q)) ||
          r.reason.toLowerCase().includes(q)
        );
      });
    }

    return base;
  }, [requests, currentUser, listScope, listStatusFilter, listSearch]);

  // Counts
  const pendingITCount = useMemo(
    () => requests.filter((r) => r.status === 'pending_it').length,
    [requests]
  );
  const pendingHRCount = useMemo(
    () => requests.filter((r) => r.status === 'pending_hr').length,
    [requests]
  );
  const myRequestsCount = useMemo(
    () => (currentUser ? requests.filter((r) => r.employeeId.toLowerCase() === currentUser.id.toLowerCase()).length : 0),
    [requests, currentUser]
  );

  const handleOpenDetail = (req: CameraRequest) => {
    setSelectedRequest(req);
    setApprovalComment('');
    setRejectionReason('');
    setShowRejectBox(false);
    setIsDetailModalOpen(true);
  };

  const handleApproveIT = () => {
    if (!selectedRequest || !currentUser) return;
    setProcessingAction(true);
    try {
      const updated = storage.approveCameraRequestIT(
        selectedRequest.id,
        { id: currentUser.id, name: currentUser.name },
        capitalizeFirstLetter(approvalComment.trim()) || 'Đã kiểm tra kỹ thuật và trích xuất dữ liệu'
      );
      if (updated) {
        setSelectedRequest(updated);
        alert(`Đã phê duyệt bước IT cho phiếu ${updated.id}! Phiếu được chuyển đến Trưởng phòng HCNS.`);
      }
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApproveHR = () => {
    if (!selectedRequest || !currentUser) return;
    setProcessingAction(true);
    try {
      const updated = storage.approveCameraRequestHR(
        selectedRequest.id,
        { id: currentUser.id, name: currentUser.name },
        capitalizeFirstLetter(approvalComment.trim()) || 'Đã phê duyệt xem camera'
      );
      if (updated) {
        setSelectedRequest(updated);
        alert(`Trưởng phòng HCNS đã phê duyệt hoàn tất phiếu ${updated.id}!`);
      }
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = () => {
    if (!selectedRequest || !currentUser) return;
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối phiếu!');
      return;
    }
    setProcessingAction(true);
    try {
      const updated = storage.rejectCameraRequest(
        selectedRequest.id,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: isIT ? 'Bộ phận IT' : 'Trưởng phòng HCNS',
        },
        capitalizeFirstLetter(rejectionReason.trim())
      );
      if (updated) {
        setSelectedRequest(updated);
        alert(`Đã từ chối phiếu ${updated.id}.`);
        setShowRejectBox(false);
      }
    } finally {
      setProcessingAction(false);
    }
  };

  // ----------------------------------------------------
  // CAMERA MASTER DATA STATE & HANDLERS (ADMIN / IT)
  // ----------------------------------------------------
  const [editingCamera, setEditingCamera] = useState<CameraItem | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [camFormCode, setCamFormCode] = useState('');
  const [camFormName, setCamFormName] = useState('');
  const [camFormZone, setCamFormZone] = useState('');
  const [camFormDesc, setCamFormDesc] = useState('');
  const [camFormStatus, setCamFormStatus] = useState<'active' | 'inactive'>('active');
  const [importingExcel, setImportingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenAddCamera = () => {
    setEditingCamera(null);
    setCamFormCode('');
    setCamFormName('');
    setCamFormZone('');
    setCamFormDesc('');
    setCamFormStatus('active');
    setIsCameraModalOpen(true);
  };

  const handleOpenEditCamera = (cam: CameraItem) => {
    setEditingCamera(cam);
    setCamFormCode(cam.code);
    setCamFormName(cam.name);
    setCamFormZone(cam.zone);
    setCamFormDesc(cam.description || '');
    setCamFormStatus(cam.status);
    setIsCameraModalOpen(true);
  };

  const normalizedCamCode = camFormCode.trim().toUpperCase();
  const duplicateCamera = useMemo(() => {
    if (!normalizedCamCode) return null;
    return (
      cameras.find((c) => {
        const isSameCode =
          c.code.trim().toUpperCase() === normalizedCamCode ||
          c.id.trim().toUpperCase() === normalizedCamCode;
        if (!isSameCode) return false;
        if (
          editingCamera &&
          (c.id.trim().toUpperCase() === editingCamera.id.trim().toUpperCase() ||
            c.code.trim().toUpperCase() === editingCamera.code.trim().toUpperCase())
        ) {
          return false;
        }
        return true;
      }) || null
    );
  }, [cameras, normalizedCamCode, editingCamera]);

  const handleSaveCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!camFormCode.trim() || !camFormName.trim()) {
      alert('Vui lòng nhập Mã camera và Tên camera!');
      return;
    }
    const normalizedCode = camFormCode.trim().toUpperCase();
    const currentList = storage.getCameras();
    const existingDup = currentList.find((c) => {
      const sameCode =
        c.code.trim().toUpperCase() === normalizedCode ||
        c.id.trim().toUpperCase() === normalizedCode;
      if (!sameCode) return false;
      if (
        editingCamera &&
        (c.id.trim().toUpperCase() === editingCamera.id.trim().toUpperCase() ||
          c.code.trim().toUpperCase() === editingCamera.code.trim().toUpperCase())
      ) {
        return false;
      }
      return true;
    });

    if (existingDup) {
      alert(
        `Mã camera "${normalizedCode}" đã tồn tại trên hệ thống (${existingDup.name} - ${existingDup.zone})! Mã camera là duy nhất, vui lòng nhập mã khác.`
      );
      return;
    }

    const now = new Date().toISOString();
    const item: CameraItem = {
      id: normalizedCode,
      code: normalizedCode,
      name: capitalizeFirstLetter(camFormName.trim()),
      zone: capitalizeFirstLetter(camFormZone.trim()) || 'Khu vực chung',
      description: capitalizeFirstLetter(camFormDesc.trim()),
      status: camFormStatus,
      createdAt: editingCamera?.createdAt || now,
      updatedAt: now,
    };
    try {
      storage.saveCamera(
        item,
        currentUser ? { id: currentUser.id, name: currentUser.name } : undefined,
        editingCamera?.id
      );
      setIsCameraModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Không thể lưu camera!');
    }
  };

  const handleDeleteCamera = (camId: string) => {
    if (confirm(`Bạn có chắc muốn xóa camera ${camId} khỏi hệ thống?`)) {
      storage.deleteCamera(camId, currentUser ? { id: currentUser.id, name: currentUser.name } : undefined);
    }
  };

  const handleDownloadTemplate = () => {
    generateCameraTemplateExcel();
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingExcel(true);
    try {
      const parsed = await parseCameraExcel(file);
      if (parsed.length === 0) {
        alert('Không tìm thấy dữ liệu camera hợp lệ trong tệp Excel!');
        return;
      }
      // Kiểm tra mã camera duy nhất, không ghi đè hoặc thêm trùng mã đã có
      const currentList = storage.getCameras();
      const existingCodes = new Set(currentList.map((c) => c.code.trim().toUpperCase()));
      const newCameras: CameraItem[] = [];
      const duplicateCodes: string[] = [];

      parsed.forEach((c) => {
        const codeUpper = c.code.trim().toUpperCase();
        if (existingCodes.has(codeUpper)) {
          duplicateCodes.push(codeUpper);
        } else {
          existingCodes.add(codeUpper);
          newCameras.push({
            ...c,
            id: codeUpper,
            code: codeUpper,
          });
        }
      });

      if (newCameras.length === 0) {
        alert(
          `Không thể thêm mới: Tất cả ${duplicateCodes.length} mã camera trong file Excel đã tồn tại trên hệ thống (${duplicateCodes.slice(0, 5).join(', ')}${duplicateCodes.length > 5 ? '...' : ''})! Mã camera là duy nhất, không được trùng mã.`
        );
        return;
      }

      const merged = [...currentList, ...newCameras];
      storage.saveCameras(merged, currentUser ? { id: currentUser.id, name: currentUser.name } : undefined);
      if (duplicateCodes.length > 0) {
        alert(
          `Đã thêm mới ${newCameras.length} camera từ file Excel!\n(Đã bỏ qua ${duplicateCodes.length} mã camera bị trùng: ${duplicateCodes.slice(0, 5).join(', ')}${duplicateCodes.length > 5 ? '...' : ''})`
        );
      } else {
        alert(`Đã nhập thành công ${newCameras.length} camera mới từ file Excel!`);
      }
    } catch (err: any) {
      alert('Lỗi khi đọc file Excel: ' + (err.message || 'Không thể xử lý'));
    } finally {
      setImportingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER / ACTION TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Đăng Ký & Quản Lý Dữ Liệu Camera An Ninh
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quy trình phê duyệt xem camera: <b>Nhân viên</b> → <b>Bộ phận IT kiểm tra</b> → <b>Trưởng phòng HCNS duyệt</b>
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'form'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gửi đăng ký mới</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Danh sách yêu cầu</span>
            {requests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {visibleRequests.length}
              </span>
            )}
          </button>

          {canManageCameras && (
            <button
              type="button"
              onClick={() => setActiveTab('manage_cameras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'manage_cameras'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Quản lý camera</span>
            </button>
          )}
        </div>
      </div>

      {submitSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FORM ĐĂNG KÝ (MATCHES camera_form.png) */}
      {/* ========================================================================= */}
      {activeTab === 'form' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#2D1B69] px-6 py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold tracking-tight">
                PHIẾU ĐĂNG KÝ XEM DỮ LIỆU CAMERA AN NINH
              </h2>
              <p className="text-xs text-purple-200 mt-0.5">
                Vui lòng điền đầy đủ và chính xác các thông tin để cấp có thẩm quyền phê duyệt
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs text-purple-100 font-medium self-start md:self-auto backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5 text-purple-200" />
              <span>Quy trình bảo mật nội bộ</span>
            </div>
          </div>

          <form onSubmit={handleCreateRequest} className="p-6 space-y-6">
            {/* Section 1: Thông tin người đăng ký */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  THÔNG TIN NGƯỜI ĐĂNG KÝ (TỰ ĐỘNG TỪ HỒ SƠ NHÂN VIÊN)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Mã nhân viên
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.id || ''}
                    className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.name || ''}
                    className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Bộ phận
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.department || 'Chưa cập nhật'}
                    className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.position || 'Nhân viên'}
                    className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Mục đích xem camera */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  MỤC ĐÍCH XEM CAMERA <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                  [
                    { key: 'kiem_tra_su_viec', label: 'Kiểm tra sự việc' },
                    { key: 'dieu_tra_su_co', label: 'Điều tra sự cố' },
                    { key: 'mat_tai_san', label: 'Mất tài sản' },
                    { key: 'khac', label: 'Khác' },
                  ] as const
                ).map((item) => {
                  const isSelected = purpose === item.key;
                  return (
                    <label
                      key={item.key}
                      onClick={() => setPurpose(item.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="purpose"
                        checked={isSelected}
                        onChange={() => setPurpose(item.key)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </label>
                  );
                })}
              </div>

              {purpose === 'khac' && (
                <div className="pt-2">
                  <input
                    type="text"
                    required
                    value={purposeDetail}
                    onChange={(e) => setPurposeDetail(capitalizeFirstLetter(e.target.value))}
                    placeholder="Vui lòng nêu rõ mục đích khác..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Camera cần xem (Cho phép chọn nhiều camera) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    CAMERA CẦN XEM (CHO PHÉP CHỌN NHIỀU CAMERA) <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  ĐÃ CHỌN {selectedCameraIds.length} CAMERA
                </div>
              </div>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={cameraSearch}
                    onChange={(e) => setCameraSearch(e.target.value)}
                    placeholder="Gõ tìm camera hoặc vị trí..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <select
                    value={cameraZoneFilter}
                    onChange={(e) => setCameraZoneFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">Tất cả khu vực</option>
                    {cameraZones.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cameras Grid */}
              <div className="max-h-64 overflow-y-auto p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30">
                {filteredCamerasForSelect.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    Không tìm thấy camera phù hợp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCamerasForSelect.map((cam) => {
                      const isSelected = selectedCameraIds.includes(cam.id);
                      return (
                        <div
                          key={cam.id}
                          onClick={() => handleToggleCamera(cam.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCamera(cam.id)}
                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {cam.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {cam.code} • {cam.zone}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Khoảng thời gian dữ liệu cần trích xuất */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  KHOẢNG THỜI GIAN CỦA DỮ LIỆU CAMERA CẦN TRÍCH XUẤT <span className="text-rose-500">*</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Ngày cần xem
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Từ giờ
                  </label>
                  <input
                    type="time"
                    required
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Đến giờ
                  </label>
                  <input
                    type="time"
                    required
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Trình bày lý do và nội dung kiểm tra */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                    5
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    TRÌNH BÀY LÝ DO VÀ NỘI DUNG CẦN KIỂM TRA <span className="text-rose-500">*</span>
                  </h3>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {reason.length} / 1.000 ký tự
                </span>
              </div>

              <textarea
                required
                maxLength={1000}
                rows={3}
                value={reason}
                onChange={(e) => setReason(capitalizeFirstLetter(e.target.value))}
                placeholder="Trình bày cụ thể diễn biến sự việc, hiện tượng nghi vấn, biển số xe, mã lô hàng hoặc nhân sự liên quan cần làm rõ..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
              />
            </div>

            {/* Section 6: Lộ trình phê duyệt tự động (Nhân viên -> Bộ phận IT -> Trưởng phòng HCNS) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                <span>Lộ trình phê duyệt tự động của phiếu này:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 shadow-2xs">
                  1. Người gửi đăng ký
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs">
                  2. Bộ phận IT kiểm tra kỹ thuật & duyệt
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 font-semibold text-purple-700 dark:text-purple-300 shadow-2xs">
                  3. Trưởng phòng HCNS phê duyệt
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Làm lại
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{formSubmitting ? 'Đang gửi...' : 'GỬI ĐĂNG KÝ'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DANH SÁCH YÊU CẦU XEM CAMERA (MATCHES camera_list.png) */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Scope Tabs if user has approval authority */}
            {(isAdmin || isIT || isHR) ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setListScope('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    listScope === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tất cả ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListScope('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    listScope === 'pending'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span>Cần tôi duyệt</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                    {isIT ? pendingITCount : isHR ? pendingHRCount : pendingITCount + pendingHRCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setListScope('my')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    listScope === 'my'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Phiếu của tôi ({myRequestsCount})
                </button>
              </div>
            ) : (
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span>Phiếu đăng ký của bạn</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold text-[11px]">
                  {visibleRequests.length}
                </span>
              </div>
            )}

            {/* Search & Status Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Tìm mã, camera, lý do..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending_it">Chờ IT duyệt</option>
                <option value="pending_hr">Chờ HCNS duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          </div>

          {/* TABLE - MATCHES camera_list.png */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã yêu cầu</th>
                    <th className="py-3.5 px-4">Ngày đăng ký</th>
                    <th className="py-3.5 px-4">Camera</th>
                    <th className="py-3.5 px-4">Mục đích</th>
                    <th className="py-3.5 px-4">Thời gian xem</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {visibleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Không có phiếu yêu cầu nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    visibleRequests.map((req) => {
                      const badge = CAMERA_STATUS_BADGES[req.status] || CAMERA_STATUS_BADGES.pending_it;
                      const statusLabel = CAMERA_STATUS_LABELS[req.status] || req.status;

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          {/* Mã yêu cầu (bold blue/indigo) */}
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {req.id}
                          </td>

                          {/* Ngày đăng ký */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {req.createdAt.slice(0, 10)}
                          </td>

                          {/* Camera */}
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs">
                            {req.cameraNames.join(', ')}
                          </td>

                          {/* Mục đích */}
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {CAMERA_PURPOSE_LABELS[req.purpose] || req.purpose}
                            {req.purpose === 'khac' && req.purposeDetail && ` (${req.purposeDetail})`}
                          </td>

                          {/* Thời gian xem */}
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {req.targetDate} ({req.fromTime} - {req.toTime})
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {req.status === 'approved' && <Check className="w-3.5 h-3.5" />}
                              {req.status.startsWith('pending') && <Clock className="w-3.5 h-3.5" />}
                              {req.status === 'rejected' && <X className="w-3.5 h-3.5" />}
                              <span>{statusLabel}</span>
                            </span>
                          </td>

                          {/* Chi tiết */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(req)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Xem</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ DANH MỤC CAMERA (ADMIN & IT) */}
      {/* ========================================================================= */}
      {activeTab === 'manage_cameras' && canManageCameras && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Danh Sách Camera Giám Sát Nhà Máy ({cameras.length} camera)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý các vị trí camera an ninh, tải file mẫu và nhập hàng loạt từ Excel
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Download Excel Template */}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tải file Excel mẫu</span>
              </button>

              {/* Upload Excel */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={handleUploadExcel}
                className="hidden"
              />
              <button
                type="button"
                disabled={importingExcel}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>{importingExcel ? 'Đang nhập...' : 'Nhập từ Excel'}</span>
              </button>

              {/* Add New Camera */}
              <button
                type="button"
                onClick={handleOpenAddCamera}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm camera mới</span>
              </button>
            </div>
          </div>

          {/* Camera Devices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">STT</th>
                    <th className="py-3 px-4">Mã camera</th>
                    <th className="py-3 px-4">Tên camera</th>
                    <th className="py-3 px-4">Khu vực</th>
                    <th className="py-3 px-4">Ghi chú</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {cameras.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                          {c.zone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {c.description || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCamera(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                            title="Sửa camera"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCamera(c.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Xóa camera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHI TIẾT & PHÊ DUYỆT PHIẾU CAMERA */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#2D1B69] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Chi Tiết Phiếu Yêu Cầu #{selectedRequest.id}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Ngày gửi: {formatDateTime(selectedRequest.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Status Header Badge */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500">Trạng thái:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${CAMERA_STATUS_BADGES[selectedRequest.status].bg} ${CAMERA_STATUS_BADGES[selectedRequest.status].text} ${CAMERA_STATUS_BADGES[selectedRequest.status].border}`}
                  >
                    {CAMERA_STATUS_LABELS[selectedRequest.status]}
                  </span>
                </div>
                <div className="text-slate-500">
                  Mục đích: <b>{CAMERA_PURPOSE_LABELS[selectedRequest.purpose]}</b>
                </div>
              </div>

              {/* Thông tin người yêu cầu */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div>
                  <span className="text-slate-400 block mb-0.5">Người làm đơn:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedRequest.employeeName} ({selectedRequest.employeeId})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Phòng ban / Chức vụ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedRequest.department} - {selectedRequest.position}
                  </span>
                </div>
              </div>

              {/* Camera & Thời gian */}
              <div className="space-y-2">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Camera yêu cầu trích xuất:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedRequest.cameraNames.map((name, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5 font-medium">Khoảng thời gian cần xem:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedRequest.targetDate} ({selectedRequest.fromTime} đến {selectedRequest.toTime})
                    </span>
                  </div>
                </div>
              </div>

              {/* Lý do & Nội dung */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1">
                <span className="text-slate-400 block font-medium">Lý do & nội dung cần kiểm tra:</span>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.reason}
                </p>
              </div>

              {/* Approval Process History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Lịch sử phê duyệt (Nhân viên → IT → Trưởng phòng HCNS)
                </h4>

                <div className="space-y-2.5">
                  {selectedRequest.steps?.map((st, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${
                        st.status === 'approved'
                          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30'
                          : st.status === 'rejected'
                          ? 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {st.stepName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.status === 'approved'
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                              : st.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {st.status === 'approved' ? '✓ Đã duyệt' : st.status === 'rejected' ? '✕ Từ chối' : '⏳ Đang chờ'}
                        </span>
                      </div>

                      {st.approverName && (
                        <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                          Người duyệt: <b>{st.approverName}</b> • Lúc: {formatDateTime(st.actionAt || '')}
                        </div>
                      )}
                      {st.comment && (
                        <div className="mt-1 text-[11px] text-slate-700 dark:text-slate-300 italic">
                          Ý kiến: &quot;{st.comment}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Message if any */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl">
                  <div className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Lý do từ chối:</span>
                  </div>
                  <p className="mt-1 text-xs">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* APPROVER ACTION BOX (Step 1: IT, Step 2: HR) */}
              {((canApproveCameraIT(currentUser, selectedRequest) && selectedRequest.status === 'pending_it') ||
                (canApproveCameraHR(currentUser, selectedRequest) && selectedRequest.status === 'pending_hr')) && (
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>
                      {selectedRequest.status === 'pending_it'
                        ? 'Xác nhận kiểm tra kỹ thuật (Bộ phận IT)'
                        : 'Phê duyệt cho phép xem camera (Trưởng phòng HCNS)'}
                    </span>
                  </div>

                  {!showRejectBox ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(capitalizeFirstLetter(e.target.value))}
                        placeholder={
                          selectedRequest.status === 'pending_it'
                            ? 'Ý kiến kỹ thuật IT (Ví dụ: Đã trích xuất dữ liệu camera sẵn sàng...)'
                            : 'Ý kiến phê duyệt HCNS (Ví dụ: Đồng ý cho xem dữ liệu tại phòng IT...)'
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowRejectBox(true)}
                          className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          Từ chối phiếu
                        </button>

                        <button
                          type="button"
                          disabled={processingAction}
                          onClick={selectedRequest.status === 'pending_it' ? handleApproveIT : handleApproveHR}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {processingAction
                              ? 'Đang xử lý...'
                              : selectedRequest.status === 'pending_it'
                              ? 'IT Duyệt & Chuyển HCNS'
                              : 'Trưởng phòng HCNS Phê Duyệt'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <textarea
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(capitalizeFirstLetter(e.target.value))}
                        placeholder="Nhập lý do từ chối yêu cầu xem camera..."
                        className="w-full p-2.5 text-xs rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-rose-500"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowRejectBox(false)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          disabled={processingAction}
                          onClick={handleReject}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA CAMERA (ADMIN & IT) */}
      {/* ========================================================================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-indigo-600 px-5 py-4 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingCamera ? 'Chỉnh Sửa Camera' : 'Thêm Camera Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(false)}
                className="p-1 rounded-lg text-indigo-100 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCamera} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Mã camera (Duy nhất) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={camFormCode}
                  onChange={(e) => setCamFormCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: CAM_KNL_05"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 font-mono ${
                    duplicateCamera
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'
                  }`}
                />
                {duplicateCamera && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Mã camera &quot;{normalizedCamCode}&quot; đã tồn tại ({duplicateCamera.name} - {duplicateCamera.zone}). Không được trùng mã!
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tên camera <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={camFormName}
                  onChange={(e) => setCamFormName(capitalizeFirstLetter(e.target.value))}
                  placeholder="Ví dụ: Cam Cửa phụ kho nguyên liệu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Khu vực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={camFormZone}
                  onChange={(e) => setCamFormZone(capitalizeFirstLetter(e.target.value))}
                  placeholder="Ví dụ: Kho nguyên liệu, Xưởng Ép..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Ghi chú mô tả vị trí
                </label>
                <textarea
                  rows={2}
                  value={camFormDesc}
                  onChange={(e) => setCamFormDesc(capitalizeFirstLetter(e.target.value))}
                  placeholder="Chi tiết góc quan sát hoặc vị trí lắp đặt..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  value={camFormStatus}
                  onChange={(e) => setCamFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!!duplicateCamera}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-colors ${
                    duplicateCamera
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  }`}
                >
                  {editingCamera ? 'Lưu thay đổi' : 'Thêm camera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
