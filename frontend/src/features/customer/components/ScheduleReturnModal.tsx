import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { Button } from '@/components/ui/Button';
import { scheduleContractReturn } from '@/api/customerRentals';
import type { RentedContract } from '../types';
import { useActivePolicy } from '@/hooks/useActivePolicy';

export interface ScheduleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onReturnScheduled?: (contractId: string, returnDate: string, note?: string) => void;
}

export const ScheduleReturnModal: React.FC<ScheduleReturnModalProps> = ({
  isOpen,
  onClose,
  contract,
  onReturnScheduled,
}) => {
  const [returnDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isCleaned, setIsCleaned] = useState(false);
  const [isConditionOk, setIsConditionOk] = useState(false);
  const [agreeEarlyTerms, setAgreeEarlyTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const policy = useActivePolicy();
  const graceDays = policy?.overdueGraceDays ?? 0;
  const noticeDays = policy?.returnNoticeDays ?? 30;

  // Kiểm tra xem có trả sớm hơn 30 ngày (1 tháng thuê) không (BR-RET-01, BR-RET-06 Best-of-Both)
  const isEarlyReturn = useMemo(() => {
    if (!contract || !returnDate || !contract.endDate) return false;
    const retDate = new Date(returnDate);
    const endDate = new Date(contract.endDate);
    const diffDays = Math.ceil((endDate.getTime() - retDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > noticeDays;
  }, [contract, returnDate, noticeDays]);

  // Kiểm tra xem có trả kho trong tháng cuối không (0 < diffDays <= 30)
  const isWithinFinalMonth = useMemo(() => {
    if (!contract || !returnDate || !contract.endDate) return false;
    const retDate = new Date(returnDate);
    const endDate = new Date(contract.endDate);
    const diffDays = Math.ceil((endDate.getTime() - retDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= noticeDays;
  }, [contract, returnDate, noticeDays]);

  // Tính số ngày và tiền thuê chưa dùng khi trả sớm (BR-RET-06 & PolicyNumbers backend)
  const unusedRentInfo = useMemo(() => {
    if (!contract || !contract.endDate) return { unusedDays: 0, estimatedUnusedRent: 0 };
    const retDate = new Date(returnDate);
    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - retDate.getTime();
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // dailyRent theo chuẩn PolicyNumbers backend: Math.round((monthlyRent / 30) / 1000) * 1000
    const dailyRent = Math.round((contract.monthlyRent / 30) / 1000) * 1000;
    const estimatedUnusedRent = dailyRent * diffDays;
    return { unusedDays: diffDays, estimatedUnusedRent };
  }, [contract, returnDate]);

  const isOverdue = Boolean(contract && contract.status === 'OVERDUE');
  const isGracePeriod = Boolean(
    isOverdue &&
    contract &&
    contract.overdueDays !== undefined &&
    contract.overdueDays > 0 &&
    (graceDays === 0 || contract.overdueDays <= graceDays)
  );

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError(null);
      setIsSuccess(false);
      setNotes('');
      setIsCleaned(false);
      setIsConditionOk(false);
      setAgreeEarlyTerms(false);
    }, 180);
  };

  const validate = (): boolean => {
    if (!isCleaned) {
      setError('Vui lòng xác nhận đã dọn sạch toàn bộ đồ đạc khỏi ô kho.');
      return false;
    }

    if (!isConditionOk) {
      setError('Vui lòng xác nhận hiện trạng ô kho nguyên vẹn trước khi hoàn tất.');
      return false;
    }

    if (isEarlyReturn && !agreeEarlyTerms) {
      setError('Vui lòng xác nhận bạn đã hiểu và đồng ý điều khoản quyết toán trả kho trước hạn.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const combinedNotes = `[ĐÃ DỌN ĐỒ XONG] ${notes}`.trim();
      await scheduleContractReturn({
        contractId: contract.id,
        returnDate,
        notes: combinedNotes,
      });

      setIsSuccess(true);
      if (onReturnScheduled) {
        onReturnScheduled(contract.id, returnDate, combinedNotes);
      }
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi yêu cầu trả kho. Vui lòng thử lại.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayDisplay = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return createPortal(
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
        <div className="bg-gradient-to-r from-[#0d6050] to-[#14937a] px-5 py-4 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
            <RotateCcw className="w-4 h-4" />
            <span>Quy Trình Nghiệm Thu & Quyết Toán</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white">Xác Nhận Đã Dọn Đồ & Báo Trả Kho</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            Ô kho <span className="font-bold text-white">{contract.unitNumber}</span> — Cơ sở {contract.facilityName}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Card Tóm tắt hợp đồng + Thời điểm báo trả (gộp 2 cột gọn gàng) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Mã hợp đồng:</span>
                <span className="font-mono font-bold text-slate-800">{contract.contractNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Hạn hợp đồng:</span>
                <span className="font-semibold text-slate-800">{contract.endDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ô kho bàn giao:</span>
                <span className="font-bold text-emerald-800">{contract.unitNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời điểm báo trả:</span>
                <span className="font-semibold text-slate-800">Hôm nay ({todayDisplay})</span>
              </div>
            </div>

            {/* Chi tiết dự kiến quyết toán tài chính */}
            {isEarlyReturn ? (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between items-center text-rose-600 text-[11px]">
                  <span>Phạt trả sớm (100% cọc):</span>
                  <span className="font-semibold">-{formatVND(contract.depositHeld)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 text-[11px]">
                  <span>Hoàn tiền thuê chưa dùng ({unusedRentInfo.unusedDays} ngày):</span>
                  <span className="font-semibold">+{formatVND(unusedRentInfo.estimatedUnusedRent)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 text-xs">
                  <span className="font-bold text-slate-700">Dự kiến hoàn trả:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatVND(unusedRentInfo.estimatedUnusedRent)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Tạm tính trước kiểm tra thực tế ô kho.
                </p>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-0.5">
                <div>
                  <span className="text-slate-700 font-medium block">Tiền cọc dự kiến quyết toán hoàn lại:</span>
                  <span className="text-[10px] text-slate-400 italic">Trừ chi phí khắc phục hư hại sau nghiệm thu (nếu có)</span>
                </div>
                <span className="font-bold text-emerald-700 text-sm">{formatVND(contract.depositHeld)}</span>
              </div>
            )}
          </div>

          {/* Checklist cam kết: Đã dọn sạch đồ đạc */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Cam kết hiện trạng sau khi dọn (Bắt buộc xác nhận):</span>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCleaned}
                onChange={(e) => {
                  setIsCleaned(e.target.checked);
                  if (error) setError(null);
                }}
                className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                required
              />
              <span className="leading-snug">
                <strong>Đã dọn sạch 100% đồ đạc:</strong> Đã lấy hết toàn bộ tài sản cá nhân ra khỏi ô kho và không để lại rác thải.
              </span>
            </label>

            <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isConditionOk}
                onChange={(e) => {
                  setIsConditionOk(e.target.checked);
                  if (error) setError(null);
                }}
                className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                required
              />
              <span className="leading-snug">
                <strong>Ô kho nguyên vẹn:</strong> Cửa cuốn, sàn, vách ngăn và ổ khóa không bị hư hại, biến dạng hay vẽ bậy.
              </span>
            </label>
          </div>

          {/* Ưu đãi ân hạn: BR-OVD-02 */}
          {isGracePeriod && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">
                <strong>Chính sách ân hạn:</strong> Hợp đồng đã quá hạn {contract.overdueDays} ngày
                {graceDays > 0 ? ` (ân hạn ${graceDays} ngày trên chính sách đang hiệu lực)` : ''}. Nhờ bạn hoàn tất dọn đồ và báo trả hôm nay, bạn vẫn được <strong>hoàn trả 100% tiền cọc ({formatVND(contract.depositHeld)})</strong> và được <strong>miễn toàn bộ phí phạt quá hạn</strong>.
              </span>
            </div>
          )}

          {/* Thông báo trả trong tháng cuối: BR-RET-06 Best-of-Both */}
          {isWithinFinalMonth && !isGracePeriod && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">
                <strong>Chính sách tháng cuối hợp đồng:</strong> Hợp đồng còn <strong>{unusedRentInfo.unusedDays} ngày</strong> (hạn: {contract.endDate}). Theo chính sách Best-of-Both, bạn được <strong>hoàn trả 100% tiền cọc ({formatVND(contract.depositHeld)})</strong> và không hoàn tiền lẻ ngày thuê chưa dùng.
              </span>
            </div>
          )}

          {/* Lưu ý khi trả kho trước hạn dài (> 30 ngày) */}
          {isEarlyReturn && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
              <div className="flex items-start gap-1.5 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Lưu ý khi trả kho trước hạn dài (&gt; 30 ngày):</span>
              </div>
              <div className="text-[11px] text-amber-900 space-y-1 pl-5">
                <p>
                  • Hạn hợp đồng đến ngày <strong>{contract.endDate}</strong> (còn <strong>{unusedRentInfo.unusedDays} ngày</strong>).
                </p>
                <p>
                  • <strong>Tiền cọc ({formatVND(contract.depositHeld)}):</strong> Không được hoàn lại khi trả trước hạn (phạt 100% tiền cọc).
                </p>
                <p>
                  • <strong>Tiền thuê chưa dùng ({formatVND(unusedRentInfo.estimatedUnusedRent)}):</strong> Được hoàn trả 100%.
                </p>
              </div>

              <label className="flex items-start gap-2 pt-1 border-t border-amber-200/80 cursor-pointer select-none text-[11px] font-semibold text-amber-950">
                <input
                  type="checkbox"
                  checked={agreeEarlyTerms}
                  onChange={(e) => {
                    setAgreeEarlyTerms(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 h-4 w-4 shrink-0"
                  required
                />
                <span>Tôi đồng ý không nhận lại tiền cọc và nhận hoàn tiền thuê còn lại.</span>
              </label>
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú thêm cho nhân viên cơ sở (Tùy chọn)
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Tôi đã dọn xong và đang ở sảnh / Khóa số đã được reset về 0000..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Quy trình xử lý tiếp theo: Mini Stepper ngang 1 dòng */}
          <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">1</span>
                <span>Gửi báo trả</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px]">2</span>
                <span>Nghiệm thu kho</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <div className="flex items-center gap-1.5 font-bold text-purple-700">
                <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">3</span>
                <span>Quyết toán (7 ngày làm việc)</span>
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">Đã gửi yêu cầu trả kho thành công! Quản lý cơ sở đang cử nhân viên xuống kiểm tra.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-1 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              disabled={isSubmitting || isSuccess || !isCleaned || !isConditionOk || (isEarlyReturn && !agreeEarlyTerms)}
            >
              {isSubmitting ? 'Đang gửi thông báo...' : 'Tôi đã dọn xong — Báo trả kho'}
              <ArrowRight className="w-4 h-4 ml-1.5 inline" />
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
