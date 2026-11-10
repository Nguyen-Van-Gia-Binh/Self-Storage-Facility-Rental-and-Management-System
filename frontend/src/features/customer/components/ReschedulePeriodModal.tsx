import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  CalendarDays,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { createCheckout, pollPaymentStatus } from '@/api/payment';
import { VnpayPayLinks } from './VnpayPayLinks';
import type { RentedContract } from '../types';
import { formatVND } from '../utils/pricing';

export interface ReschedulePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onSuccess: () => void;
}

export const ReschedulePeriodModal: React.FC<ReschedulePeriodModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(null);

  // BR-RES-06: Khóa dời lịch nếu hợp đồng đã dời lịch 1 lần
  const isAlreadyRescheduled = (contract?.rescheduleCount ?? 0) >= 1;

  // Kiểm tra điều kiện báo trước 48 giờ
  const hoursUntilStart = useMemo(() => {
    if (!contract?.startDate) return 999;
    const clean = contract.startDate.slice(0, 10);
    const startMs = new Date(clean + 'T00:00:00').getTime();
    const nowMs = Date.now();
    return (startMs - nowMs) / (1000 * 60 * 60);
  }, [contract?.startDate]);

  const isEligibleForReschedule = hoursUntilStart >= 48 && !isAlreadyRescheduled;

  // Giới hạn ngày chọn: từ ngày mai (hoặc startDate + 1) đến startDate + 7 ngày
  const { minDateStr, maxDateStr } = useMemo(() => {
    if (!contract?.startDate) return { minDateStr: '', maxDateStr: '' };
    const clean = contract.startDate.slice(0, 10);
    const [y, m, d] = clean.split('-').map(Number);
    const start = new Date(y, m - 1, d);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startPlus1 = new Date(start);
    startPlus1.setDate(startPlus1.getDate() + 1);

    const minDate = startPlus1 > tomorrow ? startPlus1 : tomorrow;

    const maxDate = new Date(start);
    maxDate.setDate(maxDate.getDate() + 7);

    const fmt = (dt: Date) => {
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${dt.getFullYear()}-${mm}-${dd}`;
    };

    return {
      minDateStr: fmt(minDate),
      maxDateStr: fmt(maxDate),
    };
  }, [contract?.startDate]);

  // Số tháng thuê của hợp đồng
  const rentalMonths = useMemo(() => {
    if (!contract) return 1;
    if (contract.rentalMonths && contract.rentalMonths > 0) return contract.rentalMonths;
    if (contract.startDate && contract.endDate) {
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return m > 0 ? m : 1;
    }
    return 1;
  }, [contract]);

  // Số ngày dời lịch thực tế
  const diffDays = useMemo(() => {
    if (!contract?.startDate || !newStartDate) return 0;
    const [y1, m1, d1] = contract.startDate.slice(0, 10).split('-').map(Number);
    const [y2, m2, d2] = newStartDate.slice(0, 10).split('-').map(Number);
    const t1 = new Date(y1, m1 - 1, d1).getTime();
    const t2 = new Date(y2, m2 - 1, d2).getTime();
    return Math.max(0, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
  }, [contract?.startDate, newStartDate]);

  // Đơn giá ngày = tiền thuê tháng / 30
  const dailyRate = useMemo(() => {
    const monthly = contract?.monthlyRent || 0;
    return Math.round(monthly / 30);
  }, [contract?.monthlyRent]);

  // Phí dời ngày = diffDays * dailyRate
  const rescheduleFee = useMemo(() => {
    return diffDays * dailyRate;
  }, [diffDays, dailyRate]);

  // Tính ngày kết thúc mới dự kiến
  const previewNewEndDate = useMemo(() => {
    if (!newStartDate) return '';
    try {
      const [y, m, d] = newStartDate.split('-').map(Number);
      const date = new Date(y, m - 1 + rentalMonths, d);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${mm}-${dd}`;
    } catch {
      return '';
    }
  }, [newStartDate, rentalMonths]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Tự động Polling kiểm tra trạng thái thanh toán VNPay khi có orderCode
  useEffect(() => {
    if (!orderCode || isSuccess || !isOpen) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await pollPaymentStatus(orderCode);
        if (res.status === 'PAID' || res.status === 'SUCCESS') {
          setIsSuccess(true);
          clearInterval(intervalId);
          setTimeout(() => {
            setIsSuccess(false);
            setOrderCode(null);
            setNewStartDate('');
            onClose();
            onSuccess();
          }, 1800);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái thanh toán dời ngày:', err);
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [orderCode, isSuccess, isOpen, onClose, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newStartDate || !isEligibleForReschedule) return;

    if (isAlreadyRescheduled) {
      setError('Mỗi hợp đồng chỉ được phép dời ngày nhận kho tối đa 1 lần duy nhất (BR-RES-06).');
      return;
    }

    if (newStartDate === contract.startDate) {
      setError('Ngày bắt đầu mới phải khác với ngày bắt đầu hiện tại.');
      return;
    }

    if (diffDays > 7 || diffDays < 1) {
      setError('Thời gian dời ngày nhận kho chỉ được phép từ 1 đến tối đa 7 ngày.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // BR-RES-06 Phương án 2: Tạo đơn checkout RESCHEDULE_FEE qua VNPay Sandbox
      const res = await createCheckout({
        referenceType: 'RESCHEDULE_FEE',
        referenceId: Number(contract.id),
        newStartDate,
        amount: rescheduleFee,
        description: `DOI KHO ${contract.unitNumber || contract.id}`.slice(0, 25),
      });

      if (res && res.orderCode) {
        setOrderCode(res.orderCode);
      } else {
        setError('Không thể khởi tạo mã giao dịch VNPay. Vui lòng thử lại sau.');
      }
    } catch (err: any) {
      console.error('Lỗi khởi tạo dời ngày:', err);
      setError(err.message || 'Không thể khởi tạo giao dịch dời ngày. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setOrderCode(null);
    setNewStartDate('');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen || !contract) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 my-8 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Điều chỉnh kế hoạch thuê
            </span>
            <h3 className="text-lg font-black text-slate-900">Dời ngày nhận kho</h3>
            <p className="text-xs text-slate-500">
              Ô kho <strong className="text-slate-800">{contract.unitNumber}</strong> · HĐ {contract.contractNumber}
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Dời ngày nhận kho thành công!</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              Hệ thống đã cập nhật ngày nhận kho mới: <strong className="text-emerald-700">{formatDateDisplay(newStartDate)}</strong>.
            </p>
          </div>
        ) : orderCode ? (
          /* Bước 2: Thanh toán phí dời ngày qua VNPay Sandbox */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Thanh toán phí dời ngày nhận kho
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Đơn #{orderCode}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                Lịch mới: <strong className="text-slate-900">{formatDateDisplay(newStartDate)}</strong> (Dời {diffDays} ngày)
              </div>
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">Số tiền cần thanh toán:</span>
                <span className="text-base font-black text-emerald-700">{formatVND(rescheduleFee)}</span>
              </div>
            </div>

            {/* Các tùy chọn thanh toán VNPay Sandbox */}
            <VnpayPayLinks orderCode={orderCode} />

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderCode(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Chọn lại ngày khác</span>
              </button>
              <span className="text-[11px] text-slate-400 italic">
                Hệ thống tự động kích hoạt sau khi thanh toán
              </span>
            </div>
          </div>
        ) : (
          /* Bước 1: Chọn ngày và tính phí */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cảnh báo nếu đã dời lịch 1 lần */}
            {isAlreadyRescheduled && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Không thể dời lịch thêm:</strong> mỗi hợp đồng chỉ được phép dời ngày nhận kho tối đa 1 lần duy nhất.
                </div>
              </div>
            )}

            {/* Cảnh báo nếu còn dưới 48h */}
            {!isAlreadyRescheduled && !isEligibleForReschedule && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Không thể đổi ngày trực tuyến:</strong> Yêu cầu dời ngày nhận kho cần gửi trước ít nhất <strong>48 giờ</strong>. Vui lòng liên hệ nhân viên cơ sở để được hỗ trợ.
                </div>
              </div>
            )}

            {/* Current Schedule Summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian thuê hiện tại
              </span>
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  Từ: <span className="text-slate-900 font-bold">{formatDateDisplay(contract.startDate)}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  Đến: <span className="text-slate-900 font-bold">{formatDateDisplay(contract.endDate)}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 text-right">
                Thời lượng thuê: <strong className="text-emerald-700">{rentalMonths} tháng</strong>
              </div>
            </div>

            {/* Select New Date */}
            <div className="space-y-1.5">
              <label htmlFor="newStartDate" className="block text-xs font-bold text-slate-700">
                Chọn ngày bắt đầu mới <span className="text-rose-500">*</span>
              </label>
              <input
                id="newStartDate"
                type="date"
                min={minDateStr}
                max={maxDateStr}
                value={newStartDate}
                disabled={!isEligibleForReschedule}
                onChange={(e) => {
                  setNewStartDate(e.target.value);
                  setError(null);
                }}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500">
                * Có thể dời từ 1 đến tối đa 7 ngày kể từ ngày bắt đầu ({formatDateDisplay(contract.startDate)}).
              </p>
            </div>

            {/* New Preview & Fee Breakdown */}
            {newStartDate && diffDays > 0 && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Khung thời gian mới sau khi dời
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Dời {diffDays} ngày
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-950">
                  <span>{formatDateDisplay(newStartDate)}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <span>{formatDateDisplay(previewNewEndDate)}</span>
                </div>

                {/* BẢNG TÍNH PHÍ DỜI NGÀY */}
                <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-xs">
                  <div className="flex justify-between text-emerald-800 text-[11px]">
                    <span>Đơn giá giữ kho theo ngày:</span>
                    <span>{formatVND(dailyRate)}/ngày</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 text-[11px]">
                    <span>Số ngày giữ kho bổ sung:</span>
                    <span className="font-semibold">{diffDays} ngày</span>
                  </div>
                  <div className="pt-1.5 border-t border-emerald-300 flex items-center justify-between font-bold text-xs text-emerald-950">
                    <span>Phí dời ngày cần thanh toán qua VNPay:</span>
                    <span className="text-sm font-black text-emerald-700">{formatVND(rescheduleFee)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Assurance Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-2 items-start text-[11px] text-slate-600">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Toàn bộ tiền thuê và tiền cọc đã đóng sẽ được bảo lưu sang thời gian thuê mới. Phí dời ngày thanh toán qua VNPay để giữ ô kho cho bạn.
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-700 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="whitespace-pre-line leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="cursor-pointer text-xs"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !newStartDate || !isEligibleForReschedule}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Đang tạo thanh toán...' : 'Xác nhận dời ngày & Thanh toán'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
