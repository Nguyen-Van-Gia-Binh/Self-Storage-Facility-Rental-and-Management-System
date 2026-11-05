import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import type { RentedContract } from '../types';
import { formatVND } from '../utils/pricing';
import { cancelReservationApi } from '@/api/reservation';
import { calculateCancellationRefund } from '../utils/cancellationPolicy';
import { cancelContractPendingCheckIn } from '@/api/customerRentals';

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.slice(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export interface CancelCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onSuccess: () => void;
}

export const CancelCheckInModal: React.FC<CancelCheckInModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calc = useMemo(() => {
    if (!contract) return null;
    return calculateCancellationRefund({
      startDateStr: contract.startDate,
      createdAtStr: contract.createdAt,
      depositAmount: contract.depositHeld || 0,
      monthlyRent: contract.monthlyRent || 0,
      rentalMonths: contract.rentalMonths || 1,
    });
  }, [contract]);

  if (!contract || !calc) return null;

  const quickReasons = [
    'Thay đổi kế hoạch',
    'Chưa có nhu cầu',
    'Đổi sang kho khác',
    'Lý do khác',
  ];

  const handleConfirmCancel = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const cancelReasonText = reason.trim() || 'Khách hàng hủy nhận kho trên trang Kho của tôi';

      // Ưu tiên hủy trực tiếp theo contractId (chuẩn 1-to-1 cho hợp đồng đang xem)
      if (contract.id) {
        try {
          await cancelContractPendingCheckIn(contract.id, cancelReasonText);
          onSuccess();
          onClose();
          return;
        } catch (contractErr: any) {
          // Fallback qua reservationId nếu cần
          if (!contract.reservationId) {
            throw contractErr;
          }
        }
      }

      if (contract.reservationId) {
        await cancelReservationApi(contract.reservationId, cancelReasonText);
        onSuccess();
        onClose();
      } else {
        setErrorMessage('Không tìm thấy thông tin hợp đồng để thực hiện hủy nhận kho.');
      }
    } catch (err: any) {
      console.error('Lỗi khi hủy nhận kho:', err);
      setErrorMessage(
        err?.message || 'Không thể hủy nhận kho vào lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTierStyles = () => {
    switch (calc.tier) {
      case 'EARLY_FULL':
        return {
          bg: 'bg-emerald-50/80 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          text: 'text-emerald-900',
          refundText: 'text-emerald-700',
        };
      case 'MID_PARTIAL':
        return {
          bg: 'bg-amber-50/80 border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          text: 'text-amber-900',
          refundText: 'text-amber-700',
        };
      case 'LATE_NO_DEPOSIT':
      case 'IN_GRACE_PERIOD':
        return {
          bg: 'bg-orange-50/80 border-orange-200',
          badge: 'bg-orange-100 text-orange-800 border-orange-300',
          text: 'text-orange-900',
          refundText: 'text-orange-700',
        };
      case 'NO_SHOW_OVERDUE':
      default:
        return {
          bg: 'bg-rose-50/80 border-rose-200',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          text: 'text-rose-900',
          refundText: 'text-rose-700',
        };
    }
  };

  const tierStyles = getTierStyles();
  const totalDeductions = calc.depositPenalty + calc.rentCharged;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      className="max-w-md w-full p-5 overflow-hidden rounded-2xl"
    >
      <div className="space-y-4">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Hủy nhận kho</h3>
              <p className="text-xs text-slate-500">
                Ô {contract.unitNumber} · {contract.facilityName}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* THÔNG TIN NGÀY NHẬN */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs border border-slate-200/70">
          <span className="text-slate-500 font-medium">Ngày hẹn nhận kho:</span>
          <span className="font-bold text-slate-800">{formatDateVN(contract.startDate)}</span>
        </div>

        {/* BẢNG TÍNH TIỀN HOÀN GỌN GÀNG */}
        <div className={`p-3.5 rounded-xl border ${tierStyles.bg} space-y-2.5`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">{calc.tierName}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierStyles.badge}`}>
              {calc.tierBadge}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            {calc.explanation}
          </p>

          <div className="space-y-1 pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tiền thuê kho ({contract.rentalMonths || 1} tháng):</span>
              <span className="font-medium text-slate-900">
                {calc.refundableRentalFee > 0 ? `+${formatVND(calc.refundableRentalFee)}` : '0 ₫'}
              </span>
            </div>

            {calc.depositRefund > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tiền cọc hoàn lại:</span>
                <span className="font-medium text-emerald-700">+{formatVND(calc.depositRefund)}</span>
              </div>
            )}

            {totalDeductions > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Phí giữ chỗ & chuẩn bị kho:</span>
                <span className="font-medium text-rose-600">-{formatVND(totalDeductions)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex items-center justify-between font-bold text-xs text-slate-900">
              <span>Tổng tiền hoàn dự kiến:</span>
              <span className={`text-base font-extrabold ${tierStyles.refundText}`}>
                {formatVND(calc.totalRefund)}
              </span>
            </div>
          </div>
        </div>

        {/* LÝ DO HỦY */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Lý do hủy <span className="text-slate-400 font-normal">(tùy chọn)</span>:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  reason === r
                    ? 'bg-slate-800 text-white border-slate-800 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Hoặc nhập lý do khác..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
          />
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <p className="text-[11px] text-slate-500 text-center">
          Tiền hoàn sẽ được chuyển về tài khoản thanh toán ban đầu sau khi xác nhận.
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Quay lại
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            onClick={handleConfirmCancel}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
