import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Clock, ShieldCheck, AlertCircle, RotateCcw, X, Info } from 'lucide-react';
import type { RentedContract } from '../types';
import { formatVND } from '../utils/pricing';
import { cancelReservationApi } from '@/api/reservation';

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

  if (!contract) return null;

  // Tính số ngày và số giờ đến ngày nhận kho
  const now = new Date();
  const cleanStartDate = (contract.startDate || '').slice(0, 10);
  const startDateTime = new Date(cleanStartDate + 'T00:00:00');

  // Chuẩn hóa mốc 00:00:00 để tính số ngày giữ kho thực tế
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startZero = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
  const heldDays = Math.max(0, Math.floor((todayZero.getTime() - startZero.getTime()) / (1000 * 60 * 60 * 24)));

  // Số giờ trước thời điểm bắt đầu nhận kho (nếu trong tương lai)
  const hoursUntilStart = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  const graceDays = 10; // checkin.grace_days = 10 ngày theo BR-CAN-04 & BR-CHK-05

  // BR-CAN-01: Hủy trước 48h được hoàn 100% (cả cọc + tiền thuê)
  // BR-CAN-02: Hủy trong 48h hoặc trong ngày nhận kho / ân hạn: Phạt 100% cọc, hoàn tiền thuê kho
  // BR-CAN-04: Quá hạn 10 ngày nhận kho (heldDays > 10): Mới bị No-show phạt 100% cọc + 100% tiền thuê (Hoàn 0đ)
  const isFullRefund = hoursUntilStart >= 48;
  const isOverdueCheckIn = heldDays > graceDays;
  const isWithin48hOrGrace = !isFullRefund && !isOverdueCheckIn;

  const depositAmount = contract.depositHeld || 0;
  const rentalMonths = contract.rentalMonths || 1;
  const rentalFee = (contract.monthlyRent || 0) * rentalMonths;

  // Tính tiền thuê trừ theo ngày nếu hủy khi đã quá ngày bắt đầu (nếu heldDays = 0 thì không trừ)
  const dailyRent = Math.round(rentalFee / Math.max(1, rentalMonths * 30));
  const rentCharged = Math.min(rentalFee, dailyRent * heldDays);
  const refundableRentalFee = Math.max(0, rentalFee - rentCharged);

  let estimatedRefund = 0;
  if (isFullRefund) {
    estimatedRefund = rentalFee + depositAmount;
  } else if (isWithin48hOrGrace) {
    estimatedRefund = refundableRentalFee;
  } else {
    // Quá hạn No-show 10 ngày (BR-CAN-04): Không hoàn tiền cả 2 khoản
    estimatedRefund = 0;
  }

  const quickReasons = [
    'Thay đổi kế hoạch cá nhân',
    'Chưa có nhu cầu sử dụng kho',
    'Muốn đổi sang cơ sở/loại kho khác',
    'Tìm được phương án lưu trữ khác',
  ];

  const handleConfirmCancel = async () => {
    if (!contract.reservationId) {
      setErrorMessage('Không tìm thấy mã đơn đặt chỗ liên kết với hợp đồng này để hủy.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const cancelReasonText = reason.trim() || 'Khách hàng hủy nhận kho trên trang Kho của tôi';
      await cancelReservationApi(contract.reservationId, cancelReasonText);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi hủy nhận kho:', err);
      setErrorMessage(
        err?.message || 'Không thể hủy nhận kho vào lúc này. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      className="max-w-lg w-full p-5 sm:p-6 overflow-hidden"
    >
      <div className="space-y-4">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Xác nhận hủy nhận kho</h3>
              <p className="text-xs text-slate-500">Hủy đơn giữ chỗ & giải phóng ô kho</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* THÔNG TIN HỢP ĐỒNG & Ô KHO */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Hợp đồng & Ô kho:</span>
            <span className="font-bold text-slate-800">
              {contract.contractNumber} · Ô {contract.unitNumber} ({contract.unitTypeName})
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500 font-medium">Cơ sở lưu trữ:</span>
            <span className="font-semibold text-slate-700">{contract.facilityName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Ngày hẹn nhận kho:</span>
            <span className="font-bold text-slate-800">{formatDateVN(contract.startDate)}</span>
          </div>
        </div>

        {/* CHÍNH SÁCH HOÀN TIỀN & PHẠT CỌC */}
        {isFullRefund ? (
          <div className="p-4 bg-emerald-50/90 rounded-xl border border-emerald-200 text-xs space-y-3 text-emerald-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đủ điều kiện hoàn 100% toàn bộ chi phí (BR-CAN-01)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                Hủy sớm ≥ 48h
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Bạn đang hủy trước thời điểm bắt đầu hợp đồng hơn <strong>48 giờ</strong>. Bạn sẽ được hoàn lại{' '}
              <strong>100%</strong> toàn bộ số tiền đã thanh toán (gồm cả tiền thuê kho và tiền đặt cọc).
            </p>
            <div className="space-y-1.5 pt-2 border-t border-emerald-200/80 text-[11px]">
              <div className="flex justify-between text-emerald-800">
                <span>Tiền thuê kho ({rentalMonths} tháng):</span>
                <span className="font-semibold text-emerald-900">{formatVND(rentalFee)} (Hoàn 100%)</span>
              </div>
              <div className="flex justify-between text-emerald-800">
                <span>Tiền ký quỹ đặt cọc:</span>
                <span className="font-semibold text-emerald-900">{formatVND(depositAmount)} (Hoàn 100%)</span>
              </div>
              <div className="pt-2 border-t border-emerald-300 flex items-center justify-between font-bold text-xs text-emerald-950">
                <span>Tổng tiền hoàn lại dự kiến:</span>
                <span className="text-base font-black text-emerald-700">{formatVND(estimatedRefund)}</span>
              </div>
            </div>
          </div>
        ) : isWithin48hOrGrace ? (
          <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-200 text-xs space-y-3 text-amber-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chính sách hủy cận giờ &amp; trong hạn nhận kho (BR-CAN-02)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                {heldDays > 0 ? `Đã giữ kho ${heldDays} ngày` : 'Hủy cận giờ / Ngày nhận kho'}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              {heldDays > 0 ? (
                <>
                  Hợp đồng đã bắt đầu từ ngày <strong>{formatDateVN(contract.startDate)}</strong> (đang trong hạn nhận kho 10 ngày).
                  Theo quy định <strong>BR-CAN-02</strong>, tiền đặt cọc được giữ lại làm phí hủy đơn, và tiền thuê kho được hoàn trả sau khi trừ {heldDays} ngày đã giữ kho:
                </>
              ) : (
                <>
                  Bạn hủy trong vòng 48 giờ trước hoặc đúng ngày bắt đầu nhận kho (<strong>{formatDateVN(contract.startDate)}</strong>).
                  Theo quy định <strong>BR-CAN-02</strong>, tiền đặt cọc được khấu trừ làm phí giữ chỗ, và bạn sẽ được <strong>hoàn trả 100% tiền thuê kho</strong>:
                </>
              )}
            </p>
            <div className="space-y-1.5 pt-2 border-t border-amber-200/80 text-[11px]">
              <div className="flex justify-between text-amber-800">
                <span>Tiền ký quỹ đặt cọc:</span>
                <span className="font-semibold text-rose-600">-{formatVND(depositAmount)} (Khấu trừ phạt cọc 100%)</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>Tiền thuê kho ({rentalMonths} tháng):</span>
                <span className="font-semibold text-emerald-700">
                  +{formatVND(refundableRentalFee)} {heldDays > 0 ? `(Đã trừ ${formatVND(rentCharged)} cho ${heldDays} ngày)` : '(Hoàn trả 100%)'}
                </span>
              </div>
              <div className="pt-2 border-t border-amber-300 flex items-center justify-between font-bold text-xs text-amber-950">
                <span>Số tiền dự kiến hoàn trả:</span>
                <span className="text-base font-black text-amber-700">{formatVND(estimatedRefund)}</span>
              </div>
            </div>
          </div>
        ) : isOverdueCheckIn ? (
          <div className="p-4 bg-rose-50/90 rounded-xl border border-rose-200 text-xs space-y-3 text-rose-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Quá hạn nhận kho / No-show (BR-CAN-04)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                Quá {graceDays} ngày ân hạn
              </span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Lịch nhận kho của bạn đã quá hạn hơn <strong>{graceDays} ngày</strong> (từ ngày <strong>{formatDateVN(contract.startDate)}</strong>). Theo quy định No-show (BR-CAN-04 &amp; BR-CHK-05), toàn bộ chi phí đã thanh toán sẽ được giữ lại làm phí bồi thường và giải phóng ô kho:
            </p>
            <div className="space-y-1.5 pt-2 border-t border-rose-200/80 text-[11px]">
              <div className="flex justify-between text-rose-800">
                <span>Tiền ký quỹ đặt cọc:</span>
                <span className="font-semibold text-rose-600">-{formatVND(depositAmount)} (Tịch thu do vi phạm)</span>
              </div>
              <div className="flex justify-between text-rose-800">
                <span>Tiền thuê kho ({rentalMonths} tháng):</span>
                <span className="font-semibold text-rose-600">-{formatVND(rentalFee)} (Khấu trừ giữ kho quá hạn)</span>
              </div>
              <div className="pt-2 border-t border-rose-300 flex items-center justify-between font-bold text-xs text-rose-950">
                <span>Tổng tiền hoàn lại:</span>
                <span className="text-base font-black text-rose-700">0 ₫ (Không hoàn tiền)</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* LÝ DO HỦY */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Lý do hủy nhận kho <span className="text-slate-400 font-normal">(tùy chọn)</span>:
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
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
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập chi tiết lý do bạn muốn hủy đơn nhận kho..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 resize-none"
          />
        </div>

        {/* GHI CHÚ GIẢI PHÓNG Ô KHO (THÔNG TIN HỆ THỐNG TINH TẾ, ĐỒNG BỘ LOGIC) */}
        <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            {isOverdueCheckIn
              ? `Sau khi xác nhận, ô kho ${contract.unitNumber} sẽ lập tức được giải phóng về trạng thái Trống. Hợp đồng chấm dứt hiệu lực (TERMINATED) và không phát sinh giao dịch hoàn tiền.`
              : `Sau khi xác nhận, ô kho ${contract.unitNumber} sẽ lập tức được giải phóng về trạng thái Trống. Hợp đồng chấm dứt hiệu lực và lệnh hoàn trả ${formatVND(estimatedRefund)} sẽ được tự động ghi nhận vào hệ thống.`}
          </span>
        </div>

        {/* THÔNG BÁO LỖI NẾU CÓ */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Quay lại (Giữ hợp đồng)
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
                Đang xử lý hủy...
              </>
            ) : (
              'Xác nhận hủy nhận kho'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
