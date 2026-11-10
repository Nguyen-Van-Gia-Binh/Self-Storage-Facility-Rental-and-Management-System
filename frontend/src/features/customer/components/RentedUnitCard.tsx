import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  QrCode,
  X,
  FileText,
  RotateCcw,
  CreditCard,
  Clock,
  Calendar,
  XCircle,
  KeyRound,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import { formatDateVN, isCheckInAllowedToday } from '../utils/unitPickerHelpers';
import type { RentedContract } from '../types';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';
import { tokenStorage } from '@/utils/tokenStorage';

export interface RentedUnitCardProps {
  contract: RentedContract;
  onChangePin?: (contract: RentedContract) => void;
  onScheduleReturn?: (contract: RentedContract) => void;
  onViewDetail?: (contract: RentedContract) => void;
  onOpenOverduePayment?: (contract: RentedContract) => void;
  onCancelReturn?: (contract: RentedContract) => void;
  onReschedulePeriod?: (contract: RentedContract) => void;
  onCancelPendingCheckIn?: (contract: RentedContract) => void;
  renewalNoticeDays?: number;
}

export const RentedUnitCard: React.FC<RentedUnitCardProps> = ({
  contract,
  onScheduleReturn,
  onViewDetail,
  onOpenOverduePayment,
  onCancelReturn,
  onReschedulePeriod,
  onCancelPendingCheckIn,
  renewalNoticeDays,
}) => {
  const [showPin, setShowPin] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passMode, setPassMode] = useState<'pass' | 'checkin'>('pass');
  const [isClosingModal, setIsClosingModal] = useState(false);

  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const noticeThreshold = (renewalNoticeDays && renewalNoticeDays > 0 ? renewalNoticeDays : 30) + 7;
  const isExpiringSoon = contract.status === 'ACTIVE' && daysRemaining > 0 && daysRemaining <= noticeThreshold;
  const isUrgentExpiring = isExpiringSoon && daysRemaining <= 7;

  const overdueDays =
    contract.overdueDays !== undefined && contract.overdueDays > 0
      ? contract.overdueDays
      : daysRemaining < 0
      ? Math.abs(daysRemaining)
      : contract.status === 'OVERDUE'
      ? 1
      : 0;

  const penaltyFee = contract.overdueFee ?? 0;
  const isGracePeriod = contract.status === 'OVERDUE' && penaltyFee === 0 && overdueDays <= 3;
  // Khóa nút gia hạn khi < 20 ngày theo quy chế BR-REN-01 (đối với ACTIVE)
  const canRenewOnline =
    (contract.status === 'ACTIVE' && daysRemaining >= 20) ||
    (contract.status === 'EXPIRING_SOON' && daysRemaining >= 20) ||
    (contract.status === 'OVERDUE' && penaltyFee === 0);

  const handleOpenModal = () => {
    if (contract.status === 'PENDING_CHECKIN' || (contract.status as string) === 'PENDING_CHECK_IN') {
      setPassMode('pass');
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
        if (isExpiringSoon) {
          if (isUrgentExpiring) {
            return (
              <Badge variant="overdue" className="bg-red-50 text-red-700 border-red-300">
                Sắp hết hạn ({daysRemaining} ngày)
              </Badge>
            );
          }
          return (
            <Badge variant="warning">
              Sắp hết hạn ({daysRemaining} ngày)
            </Badge>
          );
        }
        return <Badge variant="available">Đang hoạt động</Badge>;
      case 'PENDING_CHECKIN':
      case 'PENDING_CHECK_IN' as any:
        if ((contract as any).relocationEligible) {
          return (
            <Badge variant="warning" className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
              Đổi ô kho
            </Badge>
          );
        }
        return <Badge variant="reserved">Chờ nhận kho</Badge>;
      case 'EXPIRING_SOON':
        return <Badge variant="warning">Sắp hết hạn</Badge>;
      case 'OVERDUE':
        if (penaltyFee === 0 && !isGracePeriod) {
          return (
            <Badge variant="warning" className="bg-amber-50 text-amber-800 border-amber-300">
              Chờ trả kho
            </Badge>
          );
        }
        return (
          <Badge variant={isGracePeriod ? 'warning' : 'overdue'}>
            {isGracePeriod ? `Ân hạn D+${overdueDays}` : `Quá hạn D+${overdueDays}`}
          </Badge>
        );
      case 'PENDING_RETURN':
        if (contract.inspectionDone) {
          return (
            <Badge variant="info" className="bg-purple-100 text-purple-800 border-purple-200">
              Đã nghiệm thu
            </Badge>
          );
        }
        return <Badge variant="warning">Chờ nghiệm thu</Badge>;
      case 'CLOSED':
        return <Badge variant="default">Đã kết thúc</Badge>;
      case 'TERMINATED' as any:
        if (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND')) {
          return (
            <Badge variant="danger" className="bg-rose-100 text-rose-800 border-rose-300 font-bold" title={contract.rejectionReason || 'Từ chối nhận bàn giao tại hiện trường'}>
              Từ chối nhận kho
            </Badge>
          );
        }
        if (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô' || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) {
          return (
            <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200" title="Đã hủy khi chưa phân bổ ô vật lý - Hoàn cọc 100%">
              Đã hủy
            </Badge>
          );
        }
        return (
          <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200" title="Đã hủy trước ngày nhận kho - Ô vật lý đã được giải phóng">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="default">{contract.status}</Badge>;
    }
  };

  const isAttention =
    isExpiringSoon ||
    contract.status === 'EXPIRING_SOON' ||
    contract.status === 'OVERDUE' ||
    contract.status === 'PENDING_RETURN';

  const moveInPassData =
    contract.status === 'PENDING_CHECKIN' || (contract.status as string) === 'PENDING_CHECK_IN'
      ? {
          passCode: `PASS-${contract.contractNumber}`,
          reservationId: contract.contractNumber,
          unitNumber: contract.unitNumber,
          facilityId: contract.facilityId || '',
          facilityName: contract.facilityName,
          facilityAddress: (contract as any).facilityAddress || contract.facilityName || 'Cơ sở lưu trữ SmartStorage',
          facilityPhone: '1900 8888',
          customerName: tokenStorage.getUser()?.fullName || 'Khách hàng',
          customerPhone: (tokenStorage.getUser() as any)?.phone || '',
          customerIdentity: '',
          startDate: contract.startDate,
          checkInWindow: '08:00 - 20:00 (Giờ làm việc quầy lễ tân)',
          status: 'PENDING_CHECKIN' as const,
          totalPaid: (contract.monthlyRent || 0) + (contract.depositHeld || 0),
        }
      : null;

  return (
    <>
      <div
        className={`bg-white rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-150 shadow-xs hover:shadow-md ${
          (contract.status === 'OVERDUE' && penaltyFee > 0) || isUrgentExpiring
            ? 'border-2 border-rose-300 bg-rose-50/20'
            : isAttention
            ? 'border border-amber-300 bg-amber-50/15'
            : 'border border-slate-200/90'
        }`}
      >
        {/* LEFT: UNIT & CONTRACT CORE INFO */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
              contract.status === 'OVERDUE' || isUrgentExpiring
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : isAttention
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-brand-50 border border-brand-100 text-brand-700'
            }`}
          >
            {contract.unitNumber ? contract.unitNumber.split('-').pop() : 'UNIT'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                Ô kho {contract.unitNumber}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {(contract.unitTypeName || 'Kho tiêu chuẩn').replace(/\s*\([^)]*\)/g, '').trim()}
              </span>
              {getStatusBadge()}
              {contract.hasPendingRenewal && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                  Chờ thanh toán gia hạn
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              {contract.facilityName}
            </p>
            {contract.status === 'OVERDUE' && penaltyFee === 0 && !isGracePeriod && (
              <p className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg mt-1 inline-block">
                Bạn đã hoàn tất nộp phạt quá hạn: Vui lòng dọn kho hoặc gia hạn hợp đồng.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: PIN PILL & CONTEXTUAL ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
          {/* ACCESS PIN PILL (FOR ACTIVE/EXPIRING CONTRACTS) */}
          {contract.accessPin && contract.status !== 'PENDING_CHECKIN' && (contract.status as string) !== 'PENDING_CHECK_IN' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">PIN:</span>
              <span className="font-mono font-black text-slate-800 tracking-wider">
                {showPin ? contract.accessPin : '••••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition-colors"
                title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopyPin(contract.accessPin!)}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition-colors"
                title="Sao chép PIN"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleOpenModal}
                className="text-slate-400 hover:text-emerald-700 p-0.5 cursor-pointer transition-colors"
                title="Mở mã QR mở khóa"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          )}

          {/* CONTEXTUAL BUTTONS */}
          {contract.status === 'PENDING_CHECKIN' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPassMode('pass');
                  setShowPassModal(true);
                }}
                className="text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
                title="Xem mã QR và thông tin vé nhận kho"
              >
                <QrCode className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Vé nhận kho
              </Button>
              {isStorageUnitAssigned(contract.unitNumber) && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!isCheckInAllowedToday(contract.startDate)}
                  onClick={() => {
                    if (!isCheckInAllowedToday(contract.startDate)) return;
                    setPassMode('checkin');
                    setShowPassModal(true);
                  }}
                  className={`text-xs font-bold shadow-xs ${
                    isCheckInAllowedToday(contract.startDate)
                      ? 'bg-[#0d6050] hover:bg-[#12836d] text-white cursor-pointer'
                      : 'bg-slate-100 hover:bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    isCheckInAllowedToday(contract.startDate)
                      ? 'Tự làm thủ tục ký số nhận bàn giao & kích hoạt mã PIN mở kho 24/7'
                      : `Chưa đến ngày nhận kho (${formatDateVN(contract.startDate)}). Chỉ được check-in vào đúng ngày trên hợp đồng.`
                  }
                >
                  <KeyRound className={`w-3.5 h-3.5 mr-1 ${isCheckInAllowedToday(contract.startDate) ? 'text-amber-300' : 'text-slate-400'}`} />
                  Check-in online
                </Button>
              )}
              {onReschedulePeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(contract.rescheduleCount ?? 0) >= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if ((contract.rescheduleCount ?? 0) < 1) {
                      onReschedulePeriod(contract);
                    }
                  }}
                  title={
                    (contract.rescheduleCount ?? 0) >= 1
                      ? 'Mỗi hợp đồng chỉ được phép dời lịch nhận kho tối đa 1 lần duy nhất (BR-RES-06)'
                      : 'Yêu cầu dời ngày bắt đầu nhận kho (trước ít nhất 48h)'
                  }
                  className={`text-xs font-semibold ${
                    (contract.rescheduleCount ?? 0) >= 1
                      ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50 cursor-pointer'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  {(contract.rescheduleCount ?? 0) >= 1 ? 'Đã dời lịch (1/1)' : 'Dời ngày'}
                </Button>
              )}
              {onCancelPendingCheckIn && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelPendingCheckIn(contract);
                  }}
                  className="text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer"
                  title="Hủy đơn nhận kho & yêu cầu hoàn tiền"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Hủy nhận kho
                </Button>
              )}
            </>
          )}

          {contract.status === 'OVERDUE' && penaltyFee > 0 && onOpenOverduePayment && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenOverduePayment(contract)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1" />
              Nộp phạt {formatVND(penaltyFee)}
            </Button>
          )}

          {/* SCHEDULE RETURN / CANCEL RETURN */}
          {contract.status === 'PENDING_RETURN' && !contract.inspectionDone ? (
            onCancelReturn && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancelReturn(contract)}
                className="text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
              >
                Hủy yêu cầu trả kho
              </Button>
            )
          ) : (
            onScheduleReturn &&
            (contract.status === 'EXPIRING_SOON' ||
              isGracePeriod ||
              (contract.status === 'OVERDUE' && penaltyFee === 0)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onScheduleReturn(contract)}
                className="text-xs font-semibold text-slate-600 hover:text-rose-700 hover:border-rose-200 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Báo trả kho
              </Button>
            )
          )}

          {/* VIEW DETAIL MODAL TRIGGER */}
          {onViewDetail && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Hợp đồng điện tử"
              onClick={() => onViewDetail(contract)}
              className="text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Chi tiết
            </Button>
          )}

          {/* RENEW BUTTON */}
          {canRenewOnline && (
            <Link
              to={
                contract.hasPendingRenewal && contract.pendingRenewalOrderCode
                  ? `/customer/renew/${contract.id}?orderCode=${contract.pendingRenewalOrderCode}&step=3`
                  : `/customer/renew/${contract.id}`
              }
            >
              <Button
                variant={contract.status === 'EXPIRING_SOON' || isExpiringSoon || contract.hasPendingRenewal ? 'primary' : 'outline'}
                size="sm"
                className={`text-xs font-bold shadow-xs cursor-pointer ${
                  contract.hasPendingRenewal
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : contract.status === 'EXPIRING_SOON' || isExpiringSoon
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                    : 'text-brand-700 border-brand-200 hover:bg-brand-50'
                }`}
              >
                {contract.hasPendingRenewal ? 'Tiếp tục thanh toán' : 'Gia hạn'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* QR Code Modal for Door Unlock */}
      {showQrModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ${
            isClosingModal ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleCloseModal}
        >
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl relative transition-all duration-200 transform ${
              isClosingModal ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block">
                Mã QR Mở Cửa 24/7
              </span>
              <h3 className="text-xl font-black text-slate-900">Ô kho {contract.unitNumber}</h3>
              <p className="text-xs text-slate-500">{contract.facilityName}</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `SMARTSTORAGE:UNLOCK:${contract.contractNumber}:${contract.unitNumber}:${contract.accessPin || 'ACTIVE'}`
                )}`}
                alt="QR Mở Khóa"
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <div className="bg-brand-50/80 p-3.5 rounded-xl border border-brand-200 text-xs text-brand-900">
              <span className="font-bold block mb-0.5">Mã PIN dự phòng:</span>
              <span className="font-mono text-lg font-black tracking-widest text-brand-700">
                {contract.accessPin || '••••'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Đưa mã QR này trước camera tại cổng an ninh hoặc cửa kho để mở khóa tự động.
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Digital Move-In Pass Modal for Check-in */}
      <DigitalMoveInPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        initialMode={passMode}
        contractId={contract.id}
        passData={moveInPassData}
      />
    </>
  );
};
