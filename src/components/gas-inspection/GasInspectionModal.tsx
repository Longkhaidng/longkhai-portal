'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { storage } from '@/lib/storage';
import {
  GasInspectionRecord,
  GasStation,
  GasCylinderItem,
  GasCylinderStatus,
  GasInspectionChecklist,
  InspectionCheckStatus,
} from '@/types/gas-inspection';
import {
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  UserCheck,
  Save,
  Check,
  Sparkles,
  Info,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface GasInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  station?: GasStation | null;
  scanTimestamp?: string;
  isQrScanned?: boolean;
  onSaved: (inspection: GasInspectionRecord) => void;
}

export function GasInspectionModal({
  isOpen,
  onClose,
  station,
  scanTimestamp,
  isQrScanned = false,
  onSaved,
}: GasInspectionModalProps) {
  const { currentUser } = useAuth();
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef = useRef<HTMLInputElement>(null);

  // Stations
  const stations = storage.getGasStations();
  const [selectedStationId, setSelectedStationId] = useState<string>(
    station?.id || stations[0]?.id || 'GAS-STATION-01'
  );

  // Actual Realtime Stamped Timestamp
  const [actualTimestamp, setActualTimestamp] = useState<string>(
    scanTimestamp || new Date().toISOString()
  );

  // Supplier info
  const [supplierName, setSupplierName] = useState('Công ty TNHH Khí Đốt Miền Trung (Danang Gas)');
  const [supplierRepName, setSupplierRepName] = useState('Lê Văn Tuấn');
  const [supplierPhone, setSupplierPhone] = useState('0913888999');
  const [supplierConfirmed, setSupplierConfirmed] = useState(true);

  // Company gas operator
  const [companyOperatorName, setCompanyOperatorName] = useState(
    currentUser?.department?.toLowerCase().includes('cơ điện')
      ? currentUser.name
      : 'Nguyễn Văn Hùng'
  );
  const [companyOperatorCode, setCompanyOperatorCode] = useState(
    currentUser?.department?.toLowerCase().includes('cơ điện') ? currentUser.id : '1024'
  );
  const [operatorConfirmed, setOperatorConfirmed] = useState(true);

  // Cylinders
  const [cylinders, setCylinders] = useState<GasCylinderItem[]>([
    { id: '1', serialNumber: 'VT-08921', weightKg: '45kg', expiryDate: '10/2028', status: 'good' },
    { id: '2', serialNumber: 'VT-08922', weightKg: '45kg', expiryDate: '10/2028', status: 'good' },
    { id: '3', serialNumber: 'VT-07115', weightKg: '45kg', expiryDate: '08/2027', status: 'good' },
    { id: '4', serialNumber: 'VT-07119', weightKg: '45kg', expiryDate: '08/2027', status: 'good' },
    { id: '5', serialNumber: 'VT-06540', weightKg: '45kg', expiryDate: '05/2028', status: 'good' },
    { id: '6', serialNumber: 'VT-06542', weightKg: '45kg', expiryDate: '05/2028', status: 'good' },
  ]);

  // Checklist
  const [valvesHosesRegulators, setValvesHosesRegulators] = useState<{
    valvesStatus: InspectionCheckStatus;
    hosesStatus: InspectionCheckStatus;
    regulatorStatus: InspectionCheckStatus;
    status: InspectionCheckStatus;
    notes: string;
  }>({
    valvesStatus: 'pass',
    hosesStatus: 'pass',
    regulatorStatus: 'pass',
    status: 'pass',
    notes: 'Van khóa nhẹ nhàng kín khít, dây mềm cao áp không rạn nứt, áp suất điều áp 2.8 bar ổn định',
  });

  const [leakageCheck, setLeakageCheck] = useState<{
    status: InspectionCheckStatus;
    method: 'soap_bubble' | 'detector' | 'pressure_drop' | 'other';
    leakLocation: string;
    notes: string;
  }>({
    status: 'pass',
    method: 'detector',
    leakLocation: '',
    notes: 'Đo máy dò khí rò rỉ: 0 ppm, các đầu nối và rắc co kín tuyệt đối',
  });

  const [detectorSensitivity, setDetectorSensitivity] = useState<{
    status: InspectionCheckStatus;
    responseTimeSeconds: number;
    notes: string;
  }>({
    status: 'pass',
    responseTimeSeconds: 3,
    notes: 'Thử xịt khí test đầu dò: Phản ứng tốt sau 3 giây, tiếp điểm đóng ngắt hoạt động',
  });

  const [alarmAndAutoValve, setAlarmAndAutoValve] = useState<{
    alarmHornStatus: InspectionCheckStatus;
    alarmStrobeStatus: InspectionCheckStatus;
    autoShutoffValveStatus: InspectionCheckStatus;
    status: InspectionCheckStatus;
    notes: string;
  }>({
    alarmHornStatus: 'pass',
    alarmStrobeStatus: 'pass',
    autoShutoffValveStatus: 'pass',
    status: 'pass',
    notes: 'Còi hú to rõ, đèn chớp cảnh báo sáng, van ngắt tự động (Solenoid) đóng dứt khoát tức thì',
  });

  // Photos (Before & After)
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);

  // Issues and Remedial Actions
  const [issuesFound, setIssuesFound] = useState('');
  const [remedialActions, setRemedialActions] = useState(
    'Hệ thống an toàn, tiếp tục duy trì kiểm tra định kỳ trước các ca nấu.'
  );

  // Inspector Info (Full)
  const [inspectorName, setInspectorName] = useState(currentUser?.name || 'Trần Lê Hữu Lực');
  const [inspectorCode, setInspectorCode] = useState(currentUser?.id || '2265');
  const [inspectorDept, setInspectorDept] = useState(
    currentUser?.department || 'Bộ Phận CNTT / Kỹ Thuật'
  );
  const [inspectorPhone, setInspectorPhone] = useState(currentUser?.phone || '0905123456');

  // Kitchen Confirmation
  const [kitchenStaffName, setKitchenStaffName] = useState('Đoàn Thị Lan');
  const [kitchenEmpId, setKitchenEmpId] = useState('1049');
  const [kitchenDept, setKitchenDept] = useState('Nhà Bếp');
  const [kitchenConfirmed, setKitchenConfirmed] = useState(true);
  const [kitchenNotes, setKitchenNotes] = useState(
    'Bếp xác nhận người kiểm tra đã thực hiện đầy đủ các bước kiểm tra an toàn hệ thống gas.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep track of current station object
  const currentStation =
    stations.find((s) => s.id === selectedStationId) || stations[0] || station;

  useEffect(() => {
    if (station) {
      setSelectedStationId(station.id);
    }
    if (scanTimestamp) {
      setActualTimestamp(scanTimestamp);
    } else {
      setActualTimestamp(new Date().toISOString());
    }
  }, [station, scanTimestamp, isOpen]);

  // Compress image before storing
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotos = async (
    files: FileList | null,
    target: 'before' | 'after'
  ) => {
    if (!files || files.length === 0) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('image/')) {
        const compressed = await compressImage(f);
        newPhotos.push(compressed);
      }
    }
    if (target === 'before') {
      setPhotosBefore((prev) => [...prev, ...newPhotos]);
    } else {
      setPhotosAfter((prev) => [...prev, ...newPhotos]);
    }
  };

  // Cylinder management
  const handleAddCylinder = () => {
    const nextIdx = cylinders.length + 1;
    setCylinders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        serialNumber: `VT-0${Math.floor(1000 + Math.random() * 9000)}`,
        weightKg: '45kg',
        expiryDate: '12/2028',
        status: 'good',
        notes: '',
      },
    ]);
  };

  const handleRemoveCylinder = (id: string) => {
    if (cylinders.length <= 1) {
      alert('Phải có ít nhất 01 bình gas trong biên bản kiểm tra.');
      return;
    }
    setCylinders((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCylinder = (id: string, field: keyof GasCylinderItem, value: any) => {
    setCylinders((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Save report
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inspectorName.trim() || !inspectorCode.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin Người kiểm tra.');
      return;
    }

    if (!supplierName.trim()) {
      alert('Vui lòng nhập tên Đơn vị thay gas/bảo trì.');
      return;
    }

    if (!companyOperatorName.trim()) {
      alert('Vui lòng nhập tên Người vận hành gas của Công ty.');
      return;
    }

    // Determine overall result
    const hasFail =
      valvesHosesRegulators.status === 'fail' ||
      leakageCheck.status === 'fail' ||
      detectorSensitivity.status === 'fail' ||
      alarmAndAutoValve.status === 'fail' ||
      cylinders.some((c) => c.status === 'leaking' || c.status === 'expired');

    const overallResult: 'pass' | 'warning' | 'fail' = hasFail
      ? 'fail'
      : cylinders.some((c) => c.status === 'rusty' || c.status === 'dented') || issuesFound.trim().length > 0
      ? 'warning'
      : 'pass';

    // Generate unique ID
    const yearShort = new Date().getFullYear().toString().slice(-2);
    const existing = storage.getGasInspections();
    const nextSeq = (existing.length + 1).toString().padStart(4, '0');
    const newId = `GAS${yearShort}-${nextSeq}`;

    const newRecord: GasInspectionRecord = {
      id: newId,
      stationId: currentStation?.id || 'GAS-STATION-01',
      stationName: currentStation?.name || 'Trạm Gas Nhà Bếp',
      scanTimestamp: actualTimestamp,
      isQrScanned: Boolean(isQrScanned),
      supplierName: supplierName.trim(),
      companyOperatorName: companyOperatorName.trim(),
      companyOperatorCode: companyOperatorCode.trim(),
      cylinders,
      checklist: {
        valvesHosesRegulators,
        leakageCheck,
        detectorSensitivity,
        alarmAndAutoValve,
      },
      photosBefore,
      photosAfter,
      issuesFound: issuesFound.trim(),
      remedialActions: remedialActions.trim(),
      overallResult,
      inspector: {
        id: inspectorCode.trim(),
        name: inspectorName.trim(),
        department: inspectorDept.trim(),
        phone: inspectorPhone.trim(),
        signedAt: new Date().toISOString(),
      },
      operatorConfirmation: {
        name: companyOperatorName.trim(),
        empId: companyOperatorCode.trim(),
        department: 'Phòng Cơ điện',
        confirmed: operatorConfirmed,
        confirmedAt: operatorConfirmed ? new Date().toISOString() : undefined,
      },
      supplierRepresentative: {
        company: supplierName.trim(),
        representativeName: supplierRepName.trim(),
        phone: supplierPhone.trim(),
        confirmed: supplierConfirmed,
        confirmedAt: supplierConfirmed ? new Date().toISOString() : undefined,
      },
      kitchenConfirmation: {
        staffName: kitchenStaffName.trim(),
        empId: kitchenEmpId.trim(),
        department: kitchenDept.trim(),
        confirmed: kitchenConfirmed,
        confirmedAt: kitchenConfirmed ? new Date().toISOString() : undefined,
        notes: kitchenNotes.trim(),
      },
      status: kitchenConfirmed ? 'completed' : 'pending_kitchen',
      createdAt: actualTimestamp,
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      storage.saveGasInspection(newRecord, {
        id: currentUser?.id || 'admin',
        name: currentUser?.name || 'User',
      });
      onSaved(newRecord);
      onClose();
    } catch (err) {
      console.error('Failed to save gas inspection:', err);
      alert('Có lỗi khi lưu báo cáo kiểm tra. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 md:p-6 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col my-auto overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  Phiếu Kiểm Tra An Toàn Hệ Thống Gas
                </h3>
                {isQrScanned ? (
                  <span className="px-2.5 py-0.5 bg-emerald-400 text-emerald-950 font-bold text-xs rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Quét mã QR thực tế
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-white/20 text-white font-medium text-xs rounded-full">
                    Tạo phiếu trực tiếp
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-100 flex items-center gap-2 mt-0.5">
                <span>CN CÔNG TY CỔ PHẦN LONG KHẢI TẠI ĐÀ NẴNG</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Ghi nhận thực tế: {formatDateTime(actualTimestamp)}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Section 1: Thông tin trạm & Thời gian thực tế */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                1. Thông tin Vị trí Trạm & Thời gian kiểm tra thực tế
              </h4>
              <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDateTime(actualTimestamp)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vị trí / Trạm gas kiểm tra: *
                </label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1 italic">{currentStation?.location}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngày, giờ ghi nhận thực tế khi quét mã:
                </label>
                <div className="w-full text-sm px-3.5 py-2.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl font-bold flex items-center justify-between">
                  <span>{formatDateTime(actualTimestamp)}</span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Đã khóa thời gian thực
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  * Hệ thống tự động ghi nhận tại thời điểm nhân viên quét mã QR tại trạm.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Đơn vị thay gas & Người vận hành Công ty */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-amber-600" />
              2. Đơn vị thay gas / bảo trì & Người vận hành gas của Công ty
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bên đơn vị cung cấp gas */}
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200/70 space-y-3">
                <div className="font-bold text-xs text-orange-900 uppercase tracking-wider">
                  Đại diện Đơn vị thay Gas / Bảo trì:
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đơn vị thay gas/bảo trì: *
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="VD: Công ty TNHH Khí Đốt Miền Trung"
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ tên người giao/thay:
                    </label>
                    <input
                      type="text"
                      value={supplierRepName}
                      onChange={(e) => setSupplierRepName(e.target.value)}
                      placeholder="Lê Văn Tuấn"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại:
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="0913888999"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={supplierConfirmed}
                    onChange={(e) => setSupplierConfirmed(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Đại diện đơn vị cấp gas xác nhận đã bàn giao & kiểm tra an toàn</span>
                </label>
              </div>

              {/* Bên công ty Long Khải */}
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200/70 space-y-3">
                <div className="font-bold text-xs text-sky-900 uppercase tracking-wider">
                  Người vận hành gas của Công ty Long Khải:
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên người vận hành: *
                  </label>
                  <input
                    type="text"
                    value={companyOperatorName}
                    onChange={(e) => setCompanyOperatorName(e.target.value)}
                    placeholder="Nguyễn Văn Hùng"
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã nhân viên (MSNV):
                    </label>
                    <input
                      type="text"
                      value={companyOperatorCode}
                      onChange={(e) => setCompanyOperatorCode(e.target.value)}
                      placeholder="1024"
                      className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bộ phận:
                    </label>
                    <input
                      type="text"
                      defaultValue="Phòng Cơ điện"
                      disabled
                      className="w-full text-sm px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={operatorConfirmed}
                    onChange={(e) => setOperatorConfirmed(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Người vận hành đã giám sát, kiểm tra áp suất và nghiệm thu</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Mã số bình gas & Tình trạng bình */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  3. Mã số bình gas & Tình trạng vỏ bình ({cylinders.length} bình)
                </h4>
                <p className="text-xs text-slate-500">
                  Ghi nhận số seri vỏ bình, hạn kiểm định và tình trạng từng bình gas tại trạm
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCylinder}
                className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs rounded-xl border border-amber-300 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm bình
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Mã số bình (Seri) *</th>
                    <th className="py-2.5 px-3 w-28">Trọng lượng</th>
                    <th className="py-2.5 px-3 w-32">Hạn kiểm định</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Tình trạng vỏ bình *</th>
                    <th className="py-2.5 px-3 min-w-[150px]">Ghi chú</th>
                    <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cylinders.map((cyl, idx) => (
                    <tr key={cyl.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={cyl.serialNumber}
                          onChange={(e) =>
                            handleUpdateCylinder(cyl.id, 'serialNumber', e.target.value)
                          }
                          placeholder="VT-xxxxx"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
                          required
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={cyl.weightKg || '45kg'}
                          onChange={(e) =>
                            handleUpdateCylinder(cyl.id, 'weightKg', e.target.value)
                          }
                          className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="45kg">Bình 45kg</option>
                          <option value="12kg">Bình 12kg</option>
                          <option value="48kg">Bình 48kg</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={cyl.expiryDate || ''}
                          onChange={(e) =>
                            handleUpdateCylinder(cyl.id, 'expiryDate', e.target.value)
                          }
                          placeholder="VD: 10/2028"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={cyl.status}
                          onChange={(e) =>
                            handleUpdateCylinder(
                              cyl.id,
                              'status',
                              e.target.value as GasCylinderStatus
                            )
                          }
                          className={`w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border focus:outline-none ${
                            cyl.status === 'good'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : cyl.status === 'rusty'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : cyl.status === 'dented'
                              ? 'bg-orange-50 text-orange-800 border-orange-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="good">✓ Tốt, đạt chuẩn</option>
                          <option value="rusty">⚠ Rỉ sét bề mặt</option>
                          <option value="dented">⚠ Móp méo / biến dạng</option>
                          <option value="expired">✗ Hết hạn kiểm định</option>
                          <option value="leaking">✗ Nghi ngờ rò rỉ khí</option>
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={cyl.notes || ''}
                          onChange={(e) =>
                            handleUpdateCylinder(cyl.id, 'notes', e.target.value)
                          }
                          placeholder="Ghi chú thêm..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCylinder(cyl.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Xóa bình này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Checklist 4 nội dung kỹ thuật an toàn bắt buộc */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              4. Kết quả kiểm tra Kỹ thuật An toàn Hệ thống Gas
            </h4>

            {/* Item 4.1: Van, dây dẫn, bộ điều áp */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                    4.1. Kiểm tra Van, Dây dẫn & Bộ điều áp (Regulator):
                  </span>
                  <p className="text-xs text-slate-500">
                    Van khóa tổng, van nhánh, dây dẫn mềm cao áp, đồng hồ hiển thị áp lực gas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setValvesHosesRegulators((prev) => ({ ...prev, status: 'pass' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      valvesHosesRegulators.status === 'pass'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✓ ĐẠT CHUẨN
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setValvesHosesRegulators((prev) => ({ ...prev, status: 'fail' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      valvesHosesRegulators.status === 'fail'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✗ KHÔNG ĐẠT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valvesHosesRegulators.valvesStatus === 'pass'}
                    onChange={(e) =>
                      setValvesHosesRegulators((prev) => ({
                        ...prev,
                        valvesStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Van khóa tổng & nhánh kín, không kẹt</span>
                </label>
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valvesHosesRegulators.hosesStatus === 'pass'}
                    onChange={(e) =>
                      setValvesHosesRegulators((prev) => ({
                        ...prev,
                        hosesStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Dây mềm cao áp nguyên vẹn, không nứt</span>
                </label>
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={valvesHosesRegulators.regulatorStatus === 'pass'}
                    onChange={(e) =>
                      setValvesHosesRegulators((prev) => ({
                        ...prev,
                        regulatorStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Bộ điều áp ổn định áp suất</span>
                </label>
              </div>

              <input
                type="text"
                value={valvesHosesRegulators.notes}
                onChange={(e) =>
                  setValvesHosesRegulators((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chú chi tiết kết quả kiểm tra van, dây dẫn và điều áp..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Item 4.2: Độ kín & Phương pháp kiểm tra */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                    4.2. Kết quả kiểm tra Độ kín hệ thống (Leakage Check):
                  </span>
                  <p className="text-xs text-slate-500">
                    Kiểm tra độ kín tại các mối hàn, rắc co, ren nối và cổ bình gas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLeakageCheck((prev) => ({ ...prev, status: 'pass' }))}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      leakageCheck.status === 'pass'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✓ KÍN TUYỆT ĐỐI (ĐẠT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeakageCheck((prev) => ({ ...prev, status: 'fail' }))}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      leakageCheck.status === 'fail'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✗ PHÁT HIỆN RÒ RỈ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phương pháp kiểm tra:
                  </label>
                  <select
                    value={leakageCheck.method}
                    onChange={(e) =>
                      setLeakageCheck((prev) => ({
                        ...prev,
                        method: e.target.value as any,
                      }))
                    }
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  >
                    <option value="detector">Máy dò khí rò rỉ (Chuyên dụng)</option>
                    <option value="soap_bubble">Bọt xà phòng chuyên dụng</option>
                    <option value="pressure_drop">Kiểm tra độ tụt áp kế</option>
                    <option value="other">Phương pháp khác</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chi tiết & Vị trí rò rỉ (nếu có):
                  </label>
                  <input
                    type="text"
                    value={leakageCheck.notes}
                    onChange={(e) =>
                      setLeakageCheck((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Ghi nhận nồng độ rò rỉ (ppm) hoặc vị trí mối nối bị hở nếu phát hiện..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Item 4.3: Độ nhạy đầu dò gas */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                    4.3. Kết quả thử Độ nhạy Đầu dò Gas (Gas Detector Sensitivity):
                  </span>
                  <p className="text-xs text-slate-500">
                    Thử xịt khí test đầu dò, kiểm tra tốc độ phản ứng cảm biến và đèn báo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDetectorSensitivity((prev) => ({ ...prev, status: 'pass' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      detectorSensitivity.status === 'pass'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✓ NHẠY TỐT (ĐẠT)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDetectorSensitivity((prev) => ({ ...prev, status: 'fail' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      detectorSensitivity.status === 'fail'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✗ KÉM NHẠY / HỎNG
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thời gian phản ứng:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={detectorSensitivity.responseTimeSeconds || 3}
                      onChange={(e) =>
                        setDetectorSensitivity((prev) => ({
                          ...prev,
                          responseTimeSeconds: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                    />
                    <span className="text-xs text-slate-500 font-semibold">giây</span>
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ghi chú tình trạng đầu dò:
                  </label>
                  <input
                    type="text"
                    value={detectorSensitivity.notes}
                    onChange={(e) =>
                      setDetectorSensitivity((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Mô tả tốc độ kích hoạt, đèn báo hiệu đầu dò..."
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Item 4.4: Còi, đèn, van ngắt tự động */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                    4.4. Kiểm tra Còi, Đèn & Van ngắt tự động (Alarm & Auto-shutoff Valve):
                  </span>
                  <p className="text-xs text-slate-500">
                    Liên động còi hú, đèn chớp cảnh báo và van điện từ ngắt gas tự động khẩn cấp
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAlarmAndAutoValve((prev) => ({ ...prev, status: 'pass' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      alarmAndAutoValve.status === 'pass'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✓ HOẠT ĐỘNG TỐT (ĐẠT)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAlarmAndAutoValve((prev) => ({ ...prev, status: 'fail' }))
                    }
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      alarmAndAutoValve.status === 'fail'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    ✗ HỎNG / KHÔNG NGẮT
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alarmAndAutoValve.alarmHornStatus === 'pass'}
                    onChange={(e) =>
                      setAlarmAndAutoValve((prev) => ({
                        ...prev,
                        alarmHornStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Còi báo động hú to rõ (&gt;85dB)</span>
                </label>
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alarmAndAutoValve.alarmStrobeStatus === 'pass'}
                    onChange={(e) =>
                      setAlarmAndAutoValve((prev) => ({
                        ...prev,
                        alarmStrobeStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Đèn chớp cảnh báo nháy sáng tốt</span>
                </label>
                <label className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alarmAndAutoValve.autoShutoffValveStatus === 'pass'}
                    onChange={(e) =>
                      setAlarmAndAutoValve((prev) => ({
                        ...prev,
                        autoShutoffValveStatus: e.target.checked ? 'pass' : 'fail',
                      }))
                    }
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Van ngắt tự động (Solenoid) đóng dứt khoát</span>
                </label>
              </div>

              <input
                type="text"
                value={alarmAndAutoValve.notes}
                onChange={(e) =>
                  setAlarmAndAutoValve((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ghi chú chi tiết kết quả thử còi, đèn và van điện từ ngắt khẩn cấp..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Section 5: Hình ảnh trước và sau kiểm tra */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Camera className="w-4 h-4 text-amber-600" />
              5. Hình ảnh TRƯỚC và SAU khi kiểm tra / thay gas
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ảnh TRƯỚC kiểm tra */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Hình ảnh TRƯỚC kiểm tra ({photosBefore.length})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Hiện trạng trạm gas, cụm van và bình cũ trước khi thao tác
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileBeforeRef}
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files, 'before')}
                  />
                  <button
                    type="button"
                    onClick={() => fileBeforeRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-slate-700 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Thêm ảnh
                  </button>
                </div>

                {photosBefore.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photosBefore.map((src, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-black">
                        <img src={src} alt="Trước kiểm tra" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotosBefore((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    Chưa có ảnh trước kiểm tra
                  </div>
                )}
              </div>

              {/* Ảnh SAU kiểm tra */}
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Hình ảnh SAU kiểm tra ({photosAfter.length})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Hiện trạng sau khi đấu nối, thử bọt xà phòng / máy đo kín
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileAfterRef}
                    className="hidden"
                    onChange={(e) => handleAddPhotos(e.target.files, 'after')}
                  />
                  <button
                    type="button"
                    onClick={() => fileAfterRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-700 text-slate-700 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Thêm ảnh
                  </button>
                </div>

                {photosAfter.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {photosAfter.map((src, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-black">
                        <img src={src} alt="Sau kiểm tra" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotosAfter((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    Chưa có ảnh sau kiểm tra
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Các lỗi phát hiện & Biện pháp khắc phục */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              6. Các lỗi phát hiện & Biện pháp khắc phục
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Các lỗi phát hiện trong quá trình kiểm tra:
                </label>
                <textarea
                  rows={3}
                  value={issuesFound}
                  onChange={(e) => setIssuesFound(e.target.value)}
                  placeholder="Ghi nhận tồn tại (nếu có): van rít, vỏ bình trầy xước rỉ sét, gioăng cao su chai cứng..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Biện pháp khắc phục đã xử lý hoặc kiến nghị:
                </label>
                <textarea
                  rows={3}
                  value={remedialActions}
                  onChange={(e) => setRemedialActions(e.target.value)}
                  placeholder="Phương án xử lý: đã siết chặt lại rắc co, thay gioăng mới, yêu cầu đơn vị đổi vỏ bình..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Người kiểm tra - Thông tin đầy đủ */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-amber-600" />
              7. Người kiểm tra - Thông tin đầy đủ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên người kiểm tra: *
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã số nhân viên (MSNV): *
                </label>
                <input
                  type="text"
                  value={inspectorCode}
                  onChange={(e) => setInspectorCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng ban / Bộ phận:
                </label>
                <input
                  type="text"
                  value={inspectorDept}
                  onChange={(e) => setInspectorDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ:
                </label>
                <input
                  type="text"
                  value={inspectorPhone}
                  onChange={(e) => setInspectorPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 8: Bếp xác nhận tình trạng người kiểm tra đã thực hiện đầy đủ */}
          <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-300/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                8. Đại diện Nhà Bếp xác nhận (Bếp xác nhận người kiểm tra đã thực hiện đầy đủ)
              </h4>
              <span className="text-xs px-2.5 py-0.5 bg-emerald-200/80 text-emerald-900 font-bold rounded-full">
                Bước xác nhận chéo an toàn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Người đại diện Bếp xác nhận:
                </label>
                <input
                  type="text"
                  value={kitchenStaffName}
                  onChange={(e) => setKitchenStaffName(e.target.value)}
                  placeholder="Đoàn Thị Lan"
                  className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Mã nhân viên Bếp:
                </label>
                <input
                  type="text"
                  value={kitchenEmpId}
                  onChange={(e) => setKitchenEmpId(e.target.value)}
                  placeholder="1049"
                  className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-900 mb-1">
                  Bộ phận:
                </label>
                <input
                  type="text"
                  value={kitchenDept}
                  onChange={(e) => setKitchenDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-emerald-300 cursor-pointer shadow-sm">
                <input
                  type="checkbox"
                  checked={kitchenConfirmed}
                  onChange={(e) => setKitchenConfirmed(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <div className="font-bold text-xs text-emerald-900">
                    BẾP XÁC NHẬN: Người kiểm tra đã thực hiện đầy đủ quy trình kiểm tra an toàn gas
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Xác nhận người kiểm tra và đơn vị gas đã kiểm tra thực tế tại hiện trường bếp,
                    độ kín, van ngắt tự động, còi đèn báo động và ký biên bản đầy đủ.
                  </p>
                </div>
              </label>

              <input
                type="text"
                value={kitchenNotes}
                onChange={(e) => setKitchenNotes(e.target.value)}
                placeholder="Ý kiến hoặc ghi chú của Nhà Bếp..."
                className="w-full text-xs px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </form>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu báo cáo...' : 'Lưu Báo Cáo Kiểm Tra'}
          </button>
        </div>
      </div>
    </div>
  );
}
