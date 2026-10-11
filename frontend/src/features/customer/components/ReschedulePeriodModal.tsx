import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  CalendarDays,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { rescheduleRentalPeriod } from '@/api/customerRentals';
import type { RentedContract } from '../types';

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
  // Ngày tối thiểu được chọn: từ ngày mai
  const minDateStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const [newStartDate, setNewStartDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Số tháng thuê của hợp đồng
  const rentalMonths = useMemo(() => {
    if (!contract) return 1;
    if (contract.startDate && contract.endDate) {
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return m > 0 ? m : 1;
    }
    return 1;
  }, [contract]);

  // Tính ngày kết thúc mới dự kiến
  const previewNewEndDate = useMemo(() => {
    if (!newStartDate) return '';
    try {
      const d = new Date(newStartDate);
      d.setMonth(d.getMonth() + rentalMonths);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, [newStartDate, rentalMonths]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newStartDate) return;

    if (newStartDate === contract.startDate) {
      setError('Ngày bắt đầu mới phải khác với ngày bắt đầu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await rescheduleRentalPeriod(contract.id, newStartDate);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setNewStartDate('');
        onClose();
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Lỗi dời thời gian thuê:', err);
      setError(err.message || 'Không thể dời thời gian thuê. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
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
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8 animate-scaleUp"
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Điều chỉnh kế hoạch thuê
            </span>
            <h3 className="text-xl font-black text-slate-900">Dời ngày nhận kho</h3>
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
            <h4 className="text-lg font-bold text-slate-900">Dời thời gian thành công!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Hệ thống đã cập nhật khung thời gian thuê mới và điều chỉnh lịch nhận kho của bạn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Schedule Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian thuê hiện tại
              </span>
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  Từ: <span className="text-slate-900 font-bold">{formatDateDisplay(contract.startDate)}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  Đến: <span className="text-slate-900 font-bold">{formatDateDisplay(contract.endDate)}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 text-right">
                Thời lượng thuê: <strong className="text-emerald-700">{rentalMonths} tháng</strong>
              </div>
            </div>

            {/* Select New Date */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn ngày bắt đầu mới <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                value={newStartDate}
                onChange={(e) => {
                  setNewStartDate(e.target.value);
                  setError(null);
                }}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
              />
              <p className="text-[11px] text-slate-400">
                * Có thể chọn bắt đầu từ ngày mai trở đi. Thời lượng thuê ({rentalMonths} tháng) sẽ được giữ nguyên.
              </p>
            </div>

            {/* New Preview */}
            {newStartDate && (
              <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-4 space-y-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Khung thời gian mới sau khi dời
                </span>
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-950">
                  <span>{formatDateDisplay(newStartDate)}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  <span>{formatDateDisplay(previewNewEndDate)}</span>
                </div>
              </div>
            )}

            {/* Assurance Note */}
            <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex gap-2.5 items-start">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Quyền lợi bảo toàn 100%:</strong> Toàn bộ số tiền thuê và tiền cọc bạn đã thanh toán sẽ được chuyển trọn vẹn sang thời gian thuê mới, không phát sinh chi phí đổi lịch.
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
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !newStartDate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Đang kiểm tra & cập nhật...' : 'Xác nhận dời ngày'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
