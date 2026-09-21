import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  QrCode,
  MapPin,
  Calendar,
  User,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Sparkles,
  Phone,
  X,
  CreditCard,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { MoveInPassData } from '@/types';

export interface DigitalMoveInPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  passData: MoveInPassData | null;
}

export const DigitalMoveInPassModal: React.FC<DigitalMoveInPassModalProps> = ({
  isOpen,
  onClose,
  passData,
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen || !passData) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  const handleCopyPassCode = () => {
    navigator.clipboard.writeText(passData.passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToMyUnits = () => {
    handleClose();
    navigate('/customer/my-units');
  };

  // QR Code payload cho nhân viên lễ tân quét đối chiếu (BR-CHK-01)
  const qrCheckinPayload = `SMARTSTORAGE:CHECKIN:${passData.passCode}:${passData.unitNumber}:${passData.customerIdentity}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrCheckinPayload
  )}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
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
            <span className="text-[11px] text-white/80">• SCR-SC-03.1</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Thẻ Nhận Kho Điện Tử
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Move-in Pass định danh tiếp đón tại quầy lễ tân • Giữ chỗ 48h
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-emerald-900">
                Ô kho {passData.unitNumber} đã được bảo lưu nguyên tử cho bạn!
              </p>
              <p className="text-emerald-700 leading-relaxed">
                Hệ thống đã tự động phân bổ ngăn tủ và ghi nhận khoản tiền cọc bảo đảm. Vui lòng xuất trình thẻ này khi
                đến nhận kho.
              </p>
            </div>
          </div>

          {/* Boarding Pass Ticket Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-4">
            {/* Pass Code Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Mã Thẻ Tiếp Đón (Pass Code)
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-brand-700 tracking-wider">
                  {passData.passCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPassCode}
                className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Chép mã'}</span>
              </button>
            </div>

            {/* QR Code & Unit Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* QR Image Box */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <img
                  src={qrImageUrl}
                  alt="Check-in QR Pass"
                  className="w-40 h-40 object-contain rounded-lg"
                />
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-2">
                  <QrCode className="w-3.5 h-3.5 text-brand-600" />
                  <span>Quét tiếp đón tại quầy</span>
                </div>
              </div>

              {/* Unit & Booking Details */}
              <div className="space-y-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Ngăn tủ được phân bổ</span>
                  <div className="text-xl font-black text-[#0a1614] flex items-center gap-2">
                    Ngăn {passData.unitNumber}
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Đã giữ chỗ
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      <strong className="text-slate-800">{passData.customerName}</strong> ({passData.customerPhone})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>CCCD: <strong className="font-mono text-slate-800">{passData.customerIdentity}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Bắt đầu từ: <strong className="text-slate-800">{passData.startDate}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-700 font-medium">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Hạn check-in: {passData.checkInWindow}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Facility Location Details */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                <span>{passData.facilityName}</span>
              </div>
              <p className="text-slate-500 pl-5 leading-relaxed">{passData.facilityAddress}</p>
              <div className="flex items-center gap-3 pl-5 pt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {passData.facilityPhone}
                </span>
                <span>• Giờ mở cửa: 07:00 – 22:00 hàng ngày</span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex justify-between items-center bg-emerald-50/80 px-3.5 py-2 rounded-lg text-xs border border-emerald-100">
              <span className="text-emerald-800 font-semibold">Tổng tiền đã thanh toán:</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatVND(passData.totalPaid)}</span>
            </div>
          </div>

          {/* Security Alert: BR-ACC-01 & BR-ACC-02 */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-amber-900">
              <p className="font-bold">Quy định an ninh mã khóa điện tử (BR-ACC-01):</p>
              <p className="text-amber-800 leading-relaxed">
                Để bảo vệ an toàn kho chứa, <strong>mã PIN mở khóa điện tử 24/7</strong> chỉ được kích hoạt trên hệ thống
                ngay sau khi bạn xuất trình CCCD/Hộ chiếu gốc tại quầy lễ tân để nhân viên hoàn tất đối chiếu và bàn giao chìa khóa số.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
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
              <span>Xem Kho của tôi (My Units)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
