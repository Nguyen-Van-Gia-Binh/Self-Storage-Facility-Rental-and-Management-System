import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { scheduleContractReturn } from '@/api/customerRentals';
import type { RentedContract } from '../types';

export interface ScheduleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onReturnScheduled: (contractId: string, returnDate: string, note: string) => void;
}

export const ScheduleReturnModal: React.FC<ScheduleReturnModalProps> = ({
  isOpen,
  onClose,
  contract,
  onReturnScheduled,
}) => {
  // Tính ngày tối thiểu: ít nhất 7 ngày kể từ hôm nay (US-SC-05.4, return.notice_days)
  const minNoticeDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  const [returnDate, setReturnDate] = useState<string>(minNoticeDate);
  const [notes, setNotes] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Kiểm tra xem có trả sớm hơn ngày kết thúc hợp đồng không (BR-RET-06)
  const isEarlyReturn = useMemo(() => {
    if (!contract || !returnDate) return false;
    return new Date(returnDate) < new Date(contract.endDate);
  }, [contract, returnDate]);

  // Kiểm tra xem ngày trả có sau hạn hợp đồng không (BR-RET-10)
  const isPastEndDate = useMemo(() => {
    if (!contract || !returnDate) return false;
    return new Date(returnDate) > new Date(contract.endDate);
  }, [contract, returnDate]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError(null);
      setAgreeTerms(false);
      setIsSuccess(false);
    }, 180);
  };

  const validate = (): boolean => {
    if (!returnDate) {
      setError('Vui lòng chọn ngày hẹn trả kho.');
      return false;
    }

    if (new Date(returnDate) < new Date(minNoticeDate)) {
      setError('Quy định hệ thống yêu cầu thông báo trả kho trước ít nhất 7 ngày (return.notice_days).');
      return false;
    }

    if (isEarlyReturn && !agreeTerms) {
      setError('Bạn phải xác nhận đã hiểu và đồng ý quy định không hoàn tiền thuê các tháng chưa sử dụng (BR-RET-06).');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await scheduleContractReturn({
        contractId: contract.id,
        returnDate,
        notes,
      });

      setIsSuccess(true);
      setIsSubmitting(false);
      onReturnScheduled(contract.id, returnDate, notes);

      setTimeout(() => {
        handleClose();
      }, 1300);
    } catch (err) {
      console.error('Lỗi đăng ký trả kho:', err);
      setError('Không thể đăng ký lịch trả kho. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
            <RotateCcw className="w-4 h-4" />
            <span>Quy Trình Trả Kho & Quyết Toán Cọc (US-SC-05.4)</span>
          </div>

          <h3 className="text-xl font-black text-white">Đăng Ký Lịch Trả Kho Ngăn {contract.unitNumber}</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">{contract.facilityName}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Unit Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Mã hợp đồng:</span>
              <span className="font-mono font-bold text-slate-800">{contract.contractNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Hạn hợp đồng hiện tại:</span>
              <span className="font-semibold text-slate-800">{contract.endDate}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200/80 pt-1.5">
              <span className="text-slate-600 font-medium">Tiền cọc dự kiến quyết toán hoàn lại:</span>
              <span className="font-bold text-emerald-700 text-sm">{formatVND(contract.depositHeld)}</span>
            </div>
          </div>

          {/* Date Picker (Notice >= 7 days) */}
          <div className="space-y-1">
            <Input
              label="Ngày hẹn trả kho & nghiệm thu bàn giao (Ít nhất 7 ngày)"
              type="date"
              min={minNoticeDate}
              value={returnDate}
              onChange={(e) => {
                setReturnDate(e.target.value);
                if (error) setError(null);
              }}
              required
            />
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>Thời hạn thông báo trước tối thiểu 7 ngày theo quy định hệ thống.</span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú cho nhân viên quầy (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Tôi sẽ dọn đồ vào buổi sáng từ 9h-11h..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Early Return Warning: BR-RET-06 */}
          {isEarlyReturn && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
              <div className="flex items-start gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Quy định trả kho trước hạn hợp đồng (BR-RET-06):</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Ngày hẹn trả kho của bạn sớm hơn ngày kết thúc hợp đồng ({contract.endDate}).
                Theo điều khoản, <strong>khoản tiền thuê các tháng còn lại sẽ không được hoàn trả</strong>.
                Khoản tiền cọc <strong>{formatVND(contract.depositHeld)}</strong> vẫn sẽ được hoàn trả 100% nếu ô kho không hư hại theo biên bản nghiệm thu (BR-RET-04).
              </p>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none text-xs font-semibold text-amber-950">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                  required
                />
                <span>Tôi xác nhận đã hiểu và chấp nhận điều khoản không hoàn tiền thuê còn lại.</span>
              </label>
            </div>
          )}

          {/* Past End Date Warning: BR-RET-10 */}
          {isPastEndDate && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Cảnh báo (BR-RET-10):</strong> Ngày hẹn trả kho sau ngày hết hạn ({contract.endDate}). Hợp đồng sẽ chuyển sang trạng thái quá hạn từ ngày D+1 cho đến khi bạn hoàn tất bàn giao.
              </span>
            </div>
          )}

          {/* Standard Deposit Refund Policy */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Quy trình trả kho (BR-RET-04): Bạn vui lòng dọn dẹp sạch sẽ tài sản trong ngăn tủ. Nhân viên sẽ cùng bạn nghiệm thu hiện trạng và hoàn trả 100% tiền cọc trong vòng 24-48 giờ làm việc.
            </span>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">Đăng ký trả kho thành công! Hợp đồng đã chuyển sang Chờ trả kho.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting || isSuccess}
              className="px-4 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isSuccess || (isEarlyReturn && !agreeTerms)}
              className="px-5 font-bold cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Đang gửi...' : 'Xác nhận đăng ký trả kho'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
