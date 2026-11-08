import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Phone,
  X,
  CreditCard,
  Thermometer,
  Droplets,
  Wifi,
  KeyRound,
  Copy,
  Check,
  FileSignature,
  Lock,
  QrCode,
  Info,
  Loader2,
  ClipboardCheck,
  CheckSquare,
  Square,
  AlertOctagon,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import { formatDateVN, isCheckInAllowedToday } from '../utils/unitPickerHelpers';
import { checkInContract } from '@/api/contract';
import { SignaturePad } from '@/features/staff/components/SignaturePad';
import type { MoveInPassData } from '@/types';

export type CustomerHandoverAction = 'RELOCATE' | 'TERMINATE_REFUND';

export interface DigitalMoveInPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: MoveInPassData | null;
  contractId?: string | number;
  onConfirmSignature?: (signatureName: string, activatedPin?: string) => void;
  onSuccessCheckIn?: (activatedPin: string) => void;
  onRejectHandover?: (action: CustomerHandoverAction, reason: string) => void;
  initialMode?: 'pass' | 'checkin';
}

const REJECTION_REASONS = [
  'Cửa cuốn / khóa cơ bị kẹt, hư hỏng không vận hành trơn tru được',
  'Ô kho bị ẩm ướt / có dấu hiệu thấm dột từ trần kho',
  'Bàn phím số hoặc hệ thống khóa thông minh IoT bị lỗi kỹ thuật',
  'Mặt bằng ô kho chưa được vệ sinh sạch sẽ / còn vật cản',
  'Khách hàng thay đổi nhu cầu cá nhân, không đồng ý nhận kho',
  'Lý do kỹ thuật hoặc khiếm khuyết khác...',
];

export const DigitalMoveInPassModal: React.FC<DigitalMoveInPassModalProps> = ({
  isOpen,
  onClose,
  passData,
  contractId,
  onConfirmSignature,
  onSuccessCheckIn,
  onRejectHandover,
  initialMode = 'pass',
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pass' | 'checkin'>(initialMode);

  // Synchronize activeTab whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'checkin' && !isCheckInAllowedToday(passData?.startDate)) {
        setActiveTab('pass');
      } else {
        setActiveTab(initialMode);
      }
      setShowRejectionView(false);
      setRejectionResult(null);
      setSignatureDataUrl(null);
    }
  }, [isOpen, initialMode, passData?.startDate]);

  // 4 Tiêu chí nghiệm thu vật lý hiện trường theo BR-CHK-02
  const [criteria, setCriteria] = useState({
    cleanAndEmpty: false,
    doorWorking: false,
    dryWallsFloor: false,
    smartLockReady: false,
  });

  // E-Handover & Digital Signature states
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [agreeSafetyTerms, setAgreeSafetyTerms] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [activatedPin, setActivatedPin] = useState<string | null>(null);

  // Báo sự cố & Từ chối nhận bàn giao
  const [showRejectionView, setShowRejectionView] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [customReasonNote, setCustomReasonNote] = useState('');
  const [rejectionAction, setRejectionAction] = useState<CustomerHandoverAction>('RELOCATE');
  const [rejectionResult, setRejectionResult] = useState<{
    action: CustomerHandoverAction;
    reason: string;
  } | null>(null);

  if (!isOpen || !passData) return null;

  const hasUnitAssigned = isStorageUnitAssigned(passData.unitNumber);
  const isCheckInAvailable = isCheckInAllowedToday(passData.startDate);
  const currentTab = hasUnitAssigned && isCheckInAvailable ? activeTab : 'pass';
  const targetContractId = contractId || (passData as any)?.contractId;

  const allCriteriaPassed =
    criteria.cleanAndEmpty &&
    criteria.doorWorking &&
    criteria.dryWallsFloor &&
    criteria.smartLockReady;

  const canSubmitAcceptance =
    allCriteriaPassed &&
    (Boolean(signatureName.trim()) || Boolean(signatureDataUrl)) &&
    agreeSafetyTerms &&
    !isSubmittingCheckIn;

  // Mã PIN thông minh: ưu tiên mã kích hoạt từ backend thật, sau đó là passData hoặc fallback tính toán
  const smartLockPin =
    activatedPin ||
    (passData as any).accessPin ||
    String(
      Math.abs(
        String(passData.reservationId || passData.unitNumber)
          .split('')
          .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 900000, 100000)
      ) + 100000
    ).slice(0, 6);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowRejectionView(false);
      setRejectionResult(null);
    }, 180);
  };

  const handleGoToMyUnits = () => {
    handleClose();
    navigate('/customer/my-units');
  };

  const handleSelectAllCriteria = () => {
    setCriteria({
      cleanAndEmpty: true,
      doorWorking: true,
      dryWallsFloor: true,
      smartLockReady: true,
    });
  };

  const handleSignAndActivatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allCriteriaPassed) {
      setSignatureError('Quý khách vui lòng kiểm tra và tích chọn đủ 4 tiêu chí nghiệm thu vật lý.');
      return;
    }
    const finalSignerName = signatureName.trim() || passData.customerName || 'Khách hàng';
    if (!signatureName.trim() && !signatureDataUrl) {
      setSignatureError('Vui lòng ký tay hoặc nhập họ tên của bạn để ký số xác nhận nhận bàn giao.');
      return;
    }
    if (!agreeSafetyTerms) {
      setSignatureError('Vui lòng đọc và tích chọn cam kết tuân thủ nội quy an toàn lưu kho.');
      return;
    }

    setSignatureError(null);

    if (targetContractId) {
      setIsSubmittingCheckIn(true);
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const res = await checkInContract(Number(targetContractId), {
          checkinDate: todayStr,
          conditionNote: `Khách hàng check-in online 24/7 và ký số điện tử (Đạt 4/4 tiêu chí BR-CHK-02): ${finalSignerName}`,
          customerConfirmed: true,
        });

        const pinResult = res.accessCode || (res as any)?.pin || (res as any)?.accessPin;
        if (pinResult) {
          setActivatedPin(pinResult);
        }
        setIsSigned(true);
        if (onConfirmSignature) {
          onConfirmSignature(finalSignerName, pinResult);
        }
        if (onSuccessCheckIn) {
          onSuccessCheckIn(pinResult);
        }
      } catch (err: any) {
        console.error('Lỗi khi thực hiện check-in online:', err);
        setSignatureError(err.message || 'Không thể kích hoạt check-in online. Vui lòng thử lại hoặc liên hệ hotline.');
      } finally {
        setIsSubmittingCheckIn(false);
      }
    } else {
      setIsSigned(true);
      if (onConfirmSignature) {
        onConfirmSignature(finalSignerName);
      }
    }
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason =
      selectedReason === 'Lý do kỹ thuật hoặc khiếm khuyết khác...'
        ? customReasonNote.trim() || 'Khách hàng phát hiện khiếm khuyết vật lý tại hiện trường'
        : selectedReason;

    setRejectionResult({
      action: rejectionAction,
      reason: finalReason,
    });

    if (onRejectHandover) {
      onRejectHandover(rejectionAction, finalReason);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(smartLockPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const qrCheckinPayload = `SMARTSTORAGE:CHECKIN:${passData.reservationId || passData.unitNumber}:${passData.unitNumber}:${passData.customerIdentity}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrCheckinPayload
  )}`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div
          className={`p-5 text-white relative transition-colors duration-200 ${
            showRejectionView
              ? rejectionAction === 'RELOCATE'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700'
              : 'bg-gradient-to-r from-[#0d6050] to-[#12836d]'
          }`}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            {showRejectionView ? (
              <>
                <AlertOctagon className="w-6 h-6 text-amber-200 shrink-0" />
                <span>Báo Cáo Sự Cố &amp; Từ Chối Nhận Ô Kho</span>
              </>
            ) : currentTab === 'checkin' ? (
              <>
                <ClipboardCheck className="w-6 h-6 text-emerald-200 shrink-0" />
                <span>Nghiệm Thu Bàn Giao &amp; Check-in 24/7</span>
              </>
            ) : (
              'Thẻ Nhận Kho Điện Tử'
            )}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            {showRejectionView
              ? 'Ghi nhận hiện trường không đạt chuẩn và chọn hướng xử lý thỏa đáng'
              : currentTab === 'checkin'
              ? `Biên bản nghiệm thu 4 tiêu chí BR-CHK-02 cho ô kho ${passData.unitNumber}`
              : 'Mã QR quét tại cổng cơ sở &amp; Thông tin lịch nhận bàn giao ô kho'}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* ============================================================== */}
          {/* SUBVIEW: BÁO CÁO SỰ CỐ / TỪ CHỐI NHẬN BÀN GIAO                */}
          {/* ============================================================== */}
          {showRejectionView ? (
            rejectionResult ? (
              /* KẾT QUẢ TỪ CHỐI ĐÃ ĐƯỢC GHI NHẬN */
              <div className="space-y-4 animate-in fade-in">
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-3 ${
                    rejectionResult.action === 'RELOCATE'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {rejectionResult.action === 'RELOCATE' ? (
                      <RefreshCw className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">
                        {rejectionResult.action === 'RELOCATE'
                          ? 'Đã ghi nhận yêu cầu: Đổi sang ô kho khác cùng loại'
                          : 'Đã ghi nhận yêu cầu: Hủy hợp đồng & Hoàn tiền 100%'}
                      </h4>
                      <p className="leading-relaxed opacity-90">
                        {rejectionResult.action === 'RELOCATE'
                          ? `Hệ thống đã tạm dừng bàn giao ô kho ${passData.unitNumber}. Yêu cầu cấp ô mới đã được gửi tới Quản lý cơ sở để lựa chọn ô kho thay thế đạt chuẩn trên sơ đồ 2D. Đơn giá thuê và toàn bộ tiền cọc được bảo lưu 100%.`
                          : `Hợp đồng đối với ô kho ${passData.unitNumber} đã được chấm dứt do sự cố bàn giao tại hiện trường. Hệ thống sẽ tiến hành hoàn trả 100% chi phí (bao gồm tiền cọc và tiền thuê) về tài khoản của quý khách theo quy định.`}
                      </p>
                      <div className="pt-2 text-[11px] font-semibold">
                        <span>Lý do ghi nhận: </span>
                        <strong className="underline">{rejectionResult.reason}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleClose}
                    className="w-full sm:w-1/2 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    Đóng cửa sổ
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGoToMyUnits}
                    className="w-full sm:w-1/2 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Quay về Kho của tôi</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* FORM BÁO SỰ CỐ & CHỌN HƯỚNG XỬ LÝ (2 LỰA CHỌN) */
              <form onSubmit={handleConfirmRejection} className="space-y-4 text-xs">
                {/* Thông tin ô kho */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Khách hàng:</span>
                    <span className="font-bold text-slate-900">{passData.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[11px] block">Ô kho phát sinh sự cố:</span>
                    <span className="font-mono font-extrabold text-red-700 text-sm">Ô {passData.unitNumber}</span>
                  </div>
                </div>

                {/* 2 Lựa chọn tiếp đón nghiệp vụ */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    1. Hướng xử lý mong muốn của quý khách:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Hướng 1: Đổi ô kho */}
                    <label
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        rejectionAction === 'RELOCATE'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-2 ring-amber-400/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="customerRejectionAction"
                          value="RELOCATE"
                          checked={rejectionAction === 'RELOCATE'}
                          onChange={() => setRejectionAction('RELOCATE')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold block flex items-center gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                            Đổi ô kho khác cùng loại
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                            Bảo lưu 100% tiền thuê &amp; tiền cọc. Quản lý cơ sở sẽ bố trí đổi sang ô kho đạt chuẩn khác trên sơ đồ 2D.
                          </span>
                        </div>
                      </div>
                    </label>

                    {/* Hướng 2: Hủy & hoàn 100% */}
                    <label
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        rejectionAction === 'TERMINATE_REFUND'
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 shadow-xs ring-2 ring-rose-400/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="customerRejectionAction"
                          value="TERMINATE_REFUND"
                          checked={rejectionAction === 'TERMINATE_REFUND'}
                          onChange={() => setRejectionAction('TERMINATE_REFUND')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold block flex items-center gap-1 text-xs">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />
                            Hủy hợp đồng &amp; Hoàn tiền 100%
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                            Không muốn đổi kho. Chấm dứt hợp đồng ngay tại hiện trường và nhận hoàn trả 100% tiền thuê + cọc.
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Chọn lý do phát sinh khiếm khuyết */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    2. Lý do từ chối nhận bàn giao:
                  </label>
                  <div className="space-y-1.5">
                    {REJECTION_REASONS.map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                          selectedReason === reason
                            ? 'border-amber-400 bg-amber-50/50 text-amber-950 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedCustomerReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={() => setSelectedReason(reason)}
                          className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-[11px]">{reason}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === 'Lý do kỹ thuật hoặc khiếm khuyết khác...' && (
                    <div className="pt-1.5">
                      <textarea
                        rows={2}
                        value={customReasonNote}
                        onChange={(e) => setCustomReasonNote(e.target.value)}
                        placeholder="Mô tả cụ thể sự cố tại chỗ (ví dụ: ổ khóa không nhận mã, trần kho bị rỉ nước...)"
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Nút hành động trong form rejection */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectionView(false)}
                    className="py-2 text-xs font-semibold cursor-pointer"
                  >
                    Quay lại kiểm tra
                  </Button>

                  <Button
                    type="submit"
                    variant={rejectionAction === 'RELOCATE' ? 'primary' : 'danger'}
                    size="sm"
                    className={`py-2 px-4 text-xs font-bold text-white shadow-xs cursor-pointer ${
                      rejectionAction === 'RELOCATE'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    Xác nhận từ chối nhận kho
                  </Button>
                </div>
              </form>
            )
          ) : currentTab === 'checkin' ? (
            /* ============================================================== */
            /* TAB 2: CHECK-IN ONLINE THEO CHUẨN BIÊN BẢN CỦA STAFF (BR-CHK-02)*/
            /* ============================================================== */
            <>
              {/* Unit Quick Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center font-mono font-black text-emerald-800 text-xs">
                    {passData.unitNumber}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Ô kho {passData.unitNumber}</span>
                    <span className="text-[11px] text-slate-500">{passData.facilityName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pass')}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Xem vé QR</span>
                </button>
              </div>

              {/* IOT TELEMETRY LIVE SENSORS (NHIỆT ĐỘ, ĐỘ ẨM, PIN SMART LOCK) */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cảm biến IoT Thời gian thực (Ô {passData.unitNumber})
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    Online 24/7
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-center text-amber-400 mb-0.5">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">24.5°C</div>
                    <div className="text-[10px] text-slate-400">Điều hòa chuẩn</div>
                  </div>

                  <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-center text-cyan-400 mb-0.5">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <div className="text-base sm:text-lg font-black text-white">52% RH</div>
                    <div className="text-[10px] text-slate-400">Chống ẩm mốc</div>
                  </div>

                  <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                    <div className="flex items-center justify-center text-emerald-400 mb-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="text-base sm:text-lg font-black text-emerald-400">98% Pin</div>
                    <div className="text-[10px] text-slate-400">Khóa sẵn sàng</div>
                  </div>
                </div>
              </div>

              {/* BIÊN BẢN NGHIỆM THU 4 TIÊU CHÍ VẬT LÝ THEO CHUẨN STAFF (BR-CHK-02) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Kiểm tra 4 tiêu chí nghiệm thu vật lý (Bắt buộc)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCriteria}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#0d6050] hover:text-[#12836d] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chọn tất cả đạt (4/4)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Tiêu chí 1 */}
                  <div
                    onClick={() => setCriteria((prev) => ({ ...prev, cleanAndEmpty: !prev.cleanAndEmpty }))}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      criteria.cleanAndEmpty
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                    }`}
                  >
                    {criteria.cleanAndEmpty ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-[11.5px]">Kho sạch sẽ &amp; trống hoàn toàn</span>
                      <span className="text-[10.5px] text-slate-500 leading-tight block">Không có rác thải, bụi bẩn hoặc đồ đạc cũ</span>
                    </div>
                  </div>

                  {/* Tiêu chí 2 */}
                  <div
                    onClick={() => setCriteria((prev) => ({ ...prev, doorWorking: !prev.doorWorking }))}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      criteria.doorWorking
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                    }`}
                  >
                    {criteria.doorWorking ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-[11.5px]">Cửa cuốn kéo êm, không kẹt</span>
                      <span className="text-[10.5px] text-slate-500 leading-tight block">Khóa cơ và thanh ray trơn tru, không móp méo</span>
                    </div>
                  </div>

                  {/* Tiêu chí 3 */}
                  <div
                    onClick={() => setCriteria((prev) => ({ ...prev, dryWallsFloor: !prev.dryWallsFloor }))}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      criteria.dryWallsFloor
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                    }`}
                  >
                    {criteria.dryWallsFloor ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-[11.5px]">Sàn và vách ngăn khô ráo</span>
                      <span className="text-[10.5px] text-slate-500 leading-tight block">Không có vết thấm dột, trần kho nguyên vẹn</span>
                    </div>
                  </div>

                  {/* Tiêu chí 4 */}
                  <div
                    onClick={() => setCriteria((prev) => ({ ...prev, smartLockReady: !prev.smartLockReady }))}
                    className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                      criteria.smartLockReady
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
                    }`}
                  >
                    {criteria.smartLockReady ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-[11.5px]">Khóa thông minh sẵn sàng</span>
                      <span className="text-[10.5px] text-slate-500 leading-tight block">Đèn báo sáng tốt, bàn phím số nhạy bén</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI KÝ SỐ VÀ KÍCH HOẠT MÃ PIN HOẶC HIỂN THỊ MÃ PIN ĐÃ KÝ */}
              {!isSigned ? (
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <FileSignature className="w-4 h-4 text-[#0d6050] shrink-0" />
                    <span>2. Xác nhận Ký số Bàn giao Điện tử (E-Handover 24/7)</span>
                  </div>

                  <form onSubmit={handleSignAndActivatePin} className="space-y-3 text-xs">
                    {/* BẢNG KÝ TAY TRỰC TIẾP GIỐNG STAFF */}
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200">
                      <SignaturePad onSignatureChange={setSignatureDataUrl} />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Họ và tên người ký nhận bàn giao:
                      </label>
                      <input
                        type="text"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder={`Ví dụ: ${passData.customerName}`}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all shadow-2xs"
                      />
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreeSafetyTerms}
                        onChange={(e) => setAgreeSafetyTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/20 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-600 leading-snug">
                        Tôi xác nhận đã kiểm tra thực tế, xác nhận ô kho đạt chuẩn và cam kết tuân thủ nội quy an toàn lưu trữ cơ sở.
                      </span>
                    </label>

                    {signatureError && (
                      <p className="text-[11px] text-rose-600 font-medium">{signatureError}</p>
                    )}

                    {/* 2 NÚT HÀNH ĐỘNG CHÍNH: (1) NHẬN KHO KÍCH HOẠT PIN VS (2) PHÁT HIỆN SỰ CỐ TỪ CHỐI NHẬN */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      {/* Nút Đỏ: Phát hiện sự cố / Không nhận kho */}
                      <button
                        type="button"
                        onClick={() => setShowRejectionView(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span>Phát hiện sự cố / Không nhận kho</span>
                      </button>

                      {/* Nút Xanh: Đồng ý nhận kho & Kích hoạt mã PIN */}
                      <Button
                        type="submit"
                        disabled={!canSubmitAcceptance || isSubmittingCheckIn}
                        variant="primary"
                        size="sm"
                        className="py-2.5 px-4 text-xs font-bold bg-[#0d6050] hover:bg-[#12836d] disabled:opacity-50 text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                      >
                        {isSubmittingCheckIn ? (
                          <>
                            <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                            <span>Đang kích hoạt nhận kho...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 text-amber-300" />
                            <span>Đồng ý nhận kho &amp; Kích hoạt mã PIN</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đã Nghiệm Thu &amp; Ký Số Bàn Giao Thành Công!
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Người ký: {signatureName || passData.customerName}
                    </span>
                  </div>

                  {signatureDataUrl && (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600">Chữ ký tay điện tử:</span>
                      <img src={signatureDataUrl} alt="Chữ ký khách hàng" className="h-10 object-contain" />
                    </div>
                  )}

                  {/* HỘP MÃ PIN SMART LOCK NỔI BẬT */}
                  <div className="bg-white rounded-xl p-3.5 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 block font-medium">Mã PIN Smart Lock ô kho của bạn:</span>
                      <div className="text-2xl font-mono font-black tracking-widest text-[#0a1614] mt-0.5">
                        {smartLockPin}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl transition-colors cursor-pointer"
                      title="Sao chép mã PIN"
                    >
                      {copiedPin ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-emerald-700" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    👉 <strong>Cách mở khóa:</strong> Tại cửa ô kho <strong>{passData.unitNumber}</strong>, nhập mã PIN <strong>{smartLockPin}</strong> rồi bấm phím <strong>#</strong> để mở cửa kho 24/7.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* ============================================================== */
            /* TAB 1: BOARDING PASS TICKET BOX (QR QUÉT TẠI CỔNG & LỄ TÂN)    */
            /* ============================================================== */
            <>
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3.5">
                {/* QR Code & Unit Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <img
                      src={qrImageUrl}
                      alt="Check-in QR Pass"
                      className="w-36 h-36 object-contain rounded-lg"
                    />
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Mã quét tại cổng
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-400 block font-medium">Ô kho được phân bổ</span>
                      <div className="text-xl font-black text-[#0a1614] flex items-center gap-2">
                        {hasUnitAssigned ? (
                          <>
                            Ô {passData.unitNumber}
                            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Đã giữ chỗ
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-slate-700 text-base font-bold">Chưa gán số ô</span>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit mt-0.5">
                              Chờ quầy phân bổ
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-600 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <strong className="text-slate-800">{passData.customerName}</strong> ({passData.customerPhone})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>CCCD: <strong className="font-mono text-slate-800">{passData.customerIdentity || '—'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Bắt đầu từ: <strong className="text-slate-800">{passData.startDate}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facility Location Details */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{passData.facilityName}</span>
                  </div>
                  <p className="text-slate-500 pl-5 leading-relaxed text-[11px]">{passData.facilityAddress}</p>
                  <div className="flex items-center gap-3 pl-5 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {passData.facilityPhone}
                    </span>
                    <span>• Giờ mở cửa: 07:00 – 22:00 hàng ngày</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-between items-center bg-emerald-50/90 px-3.5 py-2 rounded-xl text-xs border border-emerald-100">
                  <span className="text-emerald-800 font-semibold">Tổng tiền đã thanh toán:</span>
                  <span className="text-sm font-black text-emerald-700">{formatVND(passData.totalPaid)}</span>
                </div>
              </div>

              {/* Call-to-action */}
              {hasUnitAssigned ? (
                <div
                  className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                    isCheckInAvailable
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        isCheckInAvailable ? 'text-emerald-950' : 'text-slate-800'
                      }`}
                    >
                      <Sparkles
                        className={`w-4 h-4 shrink-0 ${
                          isCheckInAvailable ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      {isCheckInAvailable
                        ? `Ô kho ${passData.unitNumber} đã sẵn sàng nhận kho 24/7!`
                        : `Ô kho ${passData.unitNumber} - Bắt đầu hợp đồng từ ${formatDateVN(passData.startDate)}`}
                    </span>
                    <p
                      className={`text-[11px] leading-relaxed ${
                        isCheckInAvailable ? 'text-emerald-800' : 'text-slate-500'
                      }`}
                    >
                      {isCheckInAvailable
                        ? 'Quý khách có thể tự kiểm tra 4 tiêu chuẩn nghiệm thu và nhận mã PIN mở cửa ngay.'
                        : `Chưa đến ngày nhận kho trên hợp đồng. Quý khách chỉ có thể check-in online vào đúng ngày bắt đầu hợp đồng (${formatDateVN(passData.startDate)}).`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!isCheckInAvailable}
                    onClick={() => {
                      if (!isCheckInAvailable) return;
                      setActiveTab('checkin');
                    }}
                    className={`font-bold text-xs shrink-0 whitespace-nowrap shadow-xs py-2 px-3 ${
                      isCheckInAvailable
                        ? 'bg-[#0d6050] hover:bg-[#12836d] text-white cursor-pointer'
                        : 'bg-slate-200 hover:bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      isCheckInAvailable
                        ? 'Tự làm thủ tục ký số nhận bàn giao & kích hoạt mã PIN mở kho 24/7'
                        : `Chưa đến ngày nhận kho (${formatDateVN(passData.startDate)}). Chỉ được check-in vào đúng ngày trên hợp đồng.`
                    }
                  >
                    <KeyRound
                      className={`w-3.5 h-3.5 mr-1 ${
                        isCheckInAvailable ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    />
                    Check-in online ngay
                  </Button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Ô kho đang được nhân viên cơ sở điều phối</span>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Ô kho cụ thể của quý khách sẽ được nhân viên quầy kiểm tra và hoàn tất phân bổ khi quý khách đến cơ sở. Vui lòng xuất trình mã QR trên tại quầy lễ tân để nhận kho.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ACTION BUTTONS DƯỚI CÙNG (KHI KHÔNG Ở CHẾ ĐỘ BÁO SỰ CỐ) */}
          {!showRejectionView && (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleClose}
                className="w-full sm:w-1/2 py-2.5 text-xs font-semibold cursor-pointer"
              >
                Đóng cửa sổ
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleGoToMyUnits}
                className="w-full sm:w-1/2 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Xem Kho của tôi</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
