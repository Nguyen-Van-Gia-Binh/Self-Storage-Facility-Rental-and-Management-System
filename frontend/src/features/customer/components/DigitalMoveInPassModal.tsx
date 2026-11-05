import React, { useState } from 'react';
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
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { MoveInPassData } from '@/types';

export interface DigitalMoveInPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: MoveInPassData | null;
  onConfirmSignature?: (signatureName: string) => void;
}

export const DigitalMoveInPassModal: React.FC<DigitalMoveInPassModalProps> = ({
  isOpen,
  onClose,
  passData,
  onConfirmSignature,
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

  // E-Handover & Digital Signature states
  const [signatureName, setSignatureName] = useState('');
  const [agreeSafetyTerms, setAgreeSafetyTerms] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  if (!isOpen || !passData) return null;

  // Giả lập mã PIN 6 số điện tử (sinh ngẫu nhiên ổn định từ mã đơn nếu chưa có)
  const smartLockPin =
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
    }, 180);
  };

  const handleGoToMyUnits = () => {
    handleClose();
    navigate('/customer/my-units');
  };

  const handleSignAndActivatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureName.trim()) {
      setSignatureError('Vui lòng nhập họ và tên của bạn để ký số xác nhận nhận bàn giao.');
      return;
    }
    if (!agreeSafetyTerms) {
      setSignatureError('Vui lòng đọc và tích chọn đồng ý với nội quy an toàn lưu kho.');
      return;
    }

    setSignatureError(null);
    setIsSigned(true);
    if (onConfirmSignature) {
      onConfirmSignature(signatureName.trim());
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
        className={`bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-[#0d6050] to-[#12836d] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Thanh Toán Hoàn Tất
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Thẻ Nhận Kho Điện Tử
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Xác nhận bàn giao online &amp; Kích hoạt mã PIN mở cửa tự động 24/7
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* CỤM 1: IOT TELEMETRY LIVE SENSORS (NHIỆT ĐỘ, ĐỘ ẨM, PIN SMART LOCK) */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Dữ liệu Cảm biến IoT Ô {passData.unitNumber} (Thời gian thực)
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                <Wifi className="w-3 h-3 text-emerald-400" />
                Online 24/7
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              {/* Thẻ 1: Nhiệt độ */}
              <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-center text-amber-400 mb-0.5">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div className="text-base sm:text-lg font-black text-white">24.5°C</div>
                <div className="text-[10px] text-slate-400">Điều hòa chuẩn</div>
              </div>

              {/* Thẻ 2: Độ ẩm */}
              <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-center text-cyan-400 mb-0.5">
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="text-base sm:text-lg font-black text-white">52% RH</div>
                <div className="text-[10px] text-slate-400">Chống ẩm mốc</div>
              </div>

              {/* Thẻ 3: Pin Smart Lock */}
              <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-center text-emerald-400 mb-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-400">98% Pin</div>
                <div className="text-[10px] text-slate-400">Khóa sẵn sàng</div>
              </div>
            </div>
          </div>

          {/* CỤM 2: BOARDING PASS TICKET BOX (QR VÀ THÔNG TIN KHÁCH) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3.5">
            {/* QR Code & Unit Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* QR Image Box */}
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

              {/* Unit & Booking Details */}
              <div className="space-y-2.5 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Ô kho được phân bổ</span>
                  <div className="text-xl font-black text-[#0a1614] flex items-center gap-2">
                    Ô {passData.unitNumber}
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Đã giữ chỗ
                    </span>
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
                    <span>CCCD: <strong className="font-mono text-slate-800">{passData.customerIdentity}</strong></span>
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

          {/* CỤM 3: E-HANDOVER KÝ SỐ VÀ KÍCH HOẠT MÃ PIN SMART LOCK 24/7 */}
          {!isSigned ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <FileSignature className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Xác nhận Ký số Bàn giao Điện tử (E-Handover 24/7)</span>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                Quý khách có thể tự nhận kho ngay mà không cần chờ nhân viên trực quầy bằng cách xác nhận họ tên ký số điện tử bên dưới:
              </p>

              <form onSubmit={handleSignAndActivatePin} className="space-y-2.5">
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
                    Tôi xác nhận đã đọc quy định an toàn lưu kho, đồng ý tình trạng ô kho đạt chuẩn qua cảm biến IoT và cam kết tuân thủ nội quy cơ sở.
                  </span>
                </label>

                {signatureError && (
                  <p className="text-[11px] text-rose-600 font-medium">{signatureError}</p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full py-2.5 text-xs font-bold bg-[#0d6050] hover:bg-[#12836d] text-white flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>Ký số &amp; Kích hoạt mã PIN mở kho 24/7</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã Ký Số Thành Công · Bàn Giao Điện Tử 24/7
                </span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  Người ký: {signatureName}
                </span>
              </div>

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
                👉 <strong>Cách mở khóa:</strong> Tại cửa ô kho <strong>{passData.unitNumber}</strong>, nhập mã PIN <strong>{smartLockPin}</strong> rồi bấm phím <strong>#</strong> để mở cửa kho.
              </p>
            </div>
          )}

          {/* ACTION BUTTONS */}
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
        </div>
      </div>
    </div>,
    document.body
  );
};
