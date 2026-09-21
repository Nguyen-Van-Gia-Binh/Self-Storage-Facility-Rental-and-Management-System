import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  KeyRound, 
  Calendar, 
  MapPin, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  ShieldCheck,
  QrCode,
  X
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { RentedContract } from '../types';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';

export interface RentedUnitCardProps {
  contract: RentedContract;
}

export const RentedUnitCard: React.FC<RentedUnitCardProps> = ({ contract }) => {
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [isClosingModal, setIsClosingModal] = useState(false);

  const handleOpenModal = () => {
    if (contract.status === 'PENDING_CHECKIN') {
      setShowPassModal(true);
      return;
    }
    setIsClosingModal(false);
    setShowQrModal(true);
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setShowQrModal(false);
      setIsClosingModal(false);
    }, 180);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const getStatusBadge = () => {
    switch (contract.status) {
      case 'ACTIVE':
        return <Badge variant="available">Đang hoạt động</Badge>;
      case 'PENDING_CHECKIN':
        return <Badge variant="reserved">Chờ đối chiếu CCCD tại quầy</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning">Sắp hết hạn</Badge>;
      case 'OVERDUE':
        return <Badge variant="overdue">Quá hạn thanh toán</Badge>;
      default:
        return <Badge variant="default">{contract.status}</Badge>;
    }
  };

  return (
    <>
      <Card className="p-6 bg-white border border-slate-200/90 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-[#7c94c3] bg-[#7c94c3]/12 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {contract.contractNumber}
              </span>
              {getStatusBadge()}
            </div>
            <h3 className="text-xl font-extrabold text-[#0a1614] flex items-center gap-2">
              Ngăn tủ {contract.unitNumber}
              <span className="text-sm font-normal text-slate-500">
                — {contract.unitTypeName} ({contract.sizeCategory})
              </span>
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#96b3cf] flex-shrink-0" />
              <span>{contract.facilityName}</span>
            </p>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-xs text-slate-400 block">Tiền thuê hàng tháng</span>
            <span className="text-lg font-bold text-brand-600">
              {formatVND(contract.monthlyRent)}
            </span>
            <span className="text-xs text-slate-500 block">
              Tiền cọc: {formatVND(contract.depositHeld)}
            </span>
          </div>
        </div>

        {/* Contract Duration and Access PIN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Period info */}
          <div className="bg-[#f2f9f7] p-3.5 rounded-lg border border-emerald-100/80 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Thời hạn hợp đồng</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Ngày bắt đầu:</span>
              <span className="font-semibold text-[#0a1614]">{contract.startDate}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Ngày kết thúc:</span>
              <span className="font-semibold text-[#0a1614]">{contract.endDate}</span>
            </div>
          </div>

          {/* Access PIN Box (BR-ACC-01) */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <span>Mã PIN Khóa Điện Tử</span>
              </div>
              {contract.accessPin && (
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-xs text-slate-500 hover:text-brand-600 flex items-center gap-1"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Ẩn' : 'Hiện'}</span>
                </button>
              )}
            </div>

            {contract.accessPin ? (
              <div className="flex items-center justify-between pt-1">
                <span className="font-mono text-base font-bold tracking-widest text-[#0a1614]">
                  {showPin ? contract.accessPin : '••••'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyPin(contract.accessPin!)}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded border border-brand-200 transition-colors"
                    title="Sao chép mã PIN"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPin ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200 transition-colors font-medium cursor-pointer"
                    title="Mở mã QR mở khóa (QR Pass)"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>Mã QR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/80 flex items-start gap-1.5 mt-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Mã PIN & QR mở khóa tự động kích hoạt sau khi nhân viên đối chiếu CCCD tại quầy (BR-ACC-01).</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-[#96b3cf]" />
            <span>Bảo vệ bằng khóa từ mã hóa & giám sát camera 24/7</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {contract.status === 'PENDING_CHECKIN' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenModal}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Xem mã QR Check-in tại quầy</span>
              </Button>
            ) : (
              <Link
                to={`/customer/renew/${contract.id}`}
                className="w-full sm:w-auto"
              >
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gia hạn hợp đồng trực tuyến</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* QR Code Modal with Smooth Open/Close Animation (BR-ACC-01 & BR-CHK-01) */}
      {showQrModal && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 ${
            isClosingModal ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleCloseModal}
        >
          <div 
            className={`bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 ${
              isClosingModal ? 'modal-panel-exit' : 'modal-panel-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-1 pr-6">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                {contract.status === 'PENDING_CHECKIN' ? 'Thẻ Nhận Kho Điện Tử' : 'Quyền Mở Cửa Số (QR Pass)'}
              </div>
              <h3 className="text-base font-extrabold text-[#0a1614]">
                {contract.status === 'PENDING_CHECKIN' ? 'Mã QR Check-in Tại Quầy' : 'Mã QR Mở Khóa Ô Kho'}
              </h3>
              <p className="text-xs text-slate-500">
                Ngăn tủ {contract.unitNumber} • {contract.facilityName}
              </p>
            </div>

            {/* QR Code Card */}
            <div className="flex flex-col items-center justify-center p-5 bg-[#f8fdfb] border-2 border-dashed border-brand-200 rounded-xl space-y-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  contract.status === 'PENDING_CHECKIN'
                    ? `SMARTSTORAGE:CHECKIN:${contract.contractNumber}:${contract.unitNumber}`
                    : `SMARTSTORAGE:ACCESS:${contract.contractNumber}:${contract.unitNumber}:${contract.accessPin}`
                )}`}
                alt="QR Code"
                className="w-44 h-44 rounded-lg bg-white p-2 shadow-xs border border-slate-200"
              />
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 inline-block">
                  {contract.status === 'PENDING_CHECKIN' ? contract.contractNumber : `Mã PIN: ${contract.accessPin || '••••'}`}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 leading-relaxed">
              {contract.status === 'PENDING_CHECKIN' ? (
                <>
                  <p className="font-semibold text-slate-800">Quy trình đón tiếp (BR-CHK-01):</p>
                  <p>Xuất trình mã QR này kèm CCCD/Hộ chiếu gốc tại quầy lễ tân để nhân viên hoàn tất đối chiếu và bàn giao kho.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-800">Cách mở cửa kho (BR-ACC-01):</p>
                  <p>Đưa mã QR này lại gần mắt đọc cảm ứng trên khóa điện tử ô kho, hoặc nhập mã PIN trực tiếp trên bàn phím số.</p>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseModal}
              className="w-full py-2 text-xs font-semibold cursor-pointer"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>
      )}

      {/* Digital Move-in Pass Modal cho hợp đồng PENDING_CHECKIN (SCR-SC-03.1) */}
      <DigitalMoveInPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        passData={{
          passCode: contract.contractNumber,
          reservationId: contract.id,
          unitNumber: contract.unitNumber,
          facilityId: contract.facilityId,
          facilityName: contract.facilityName,
          facilityAddress: '52 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP.HCM',
          facilityPhone: '1900 8888',
          customerName: 'Nguyễn Phạm Xuân Nhi',
          customerPhone: '0908 123 456',
          customerIdentity: '079199001234',
          startDate: contract.startDate,
          checkInWindow: 'Trong vòng 48 giờ kể từ lúc cọc',
          status: 'PENDING_CHECKIN',
          totalPaid: contract.monthlyRent + contract.depositHeld,
        }}
      />
    </>
  );
};

