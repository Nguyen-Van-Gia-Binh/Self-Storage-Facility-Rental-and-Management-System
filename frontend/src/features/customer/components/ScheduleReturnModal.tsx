import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
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
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const canSubmit =
    !isSubmitting &&
    !isSuccess &&
    isCleaned &&
    isConditionOk &&
    (!isEarlyReturn || agreeEarlyTerms);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden relative ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header nền trắng hiện đại, phân tách tinh tế */}
        <div className="px-6 py-5 border-b border-gray-200 bg-white relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng cửa sổ"
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            Quy trình nghiệm thu &amp; Quyết toán
          </p>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-8">
            Xác Nhận Đã Dọn Đồ &amp; Báo Trả Kho
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Ô kho: <span className="font-semibold text-gray-700">{contract.unitNumber}</span> · Cơ sở{' '}
            {contract.facilityName.replace(/^Cơ sở\s+/i, '')}
          </p>
        </div>

        {/* 2. Body phẳng & tách ngữ nghĩa */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
            {/* Thông tin hợp đồng & Dự kiến hoàn cọc */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-gray-200">
                <div>
                  <span className="text-gray-500 block text-xs">Mã hợp đồng:</span>
                  <span className="font-mono font-semibold text-gray-900">{contract.contractNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Hạn hợp đồng:</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{contract.endDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Thời điểm báo trả:</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{todayDisplay} (Hôm nay)</span>
                </div>
              </div>

              {isEarlyReturn ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-rose-600 text-xs">
                    <span>Phạt trả sớm (100% cọc):</span>
                    <span className="font-semibold tabular-nums">-{formatVND(contract.depositHeld)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700 text-xs">
                    <span>Hoàn tiền thuê chưa dùng ({unusedRentInfo.unusedDays} ngày):</span>
                    <span className="font-semibold tabular-nums">+{formatVND(unusedRentInfo.estimatedUnusedRent)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                    <span className="font-semibold text-gray-700 text-sm">Dự kiến hoàn trả:</span>
                    <span className="font-bold text-gray-900 text-lg tabular-nums">
                      {formatVND(unusedRentInfo.estimatedUnusedRent)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    * Tạm tính trước kiểm tra thực tế ô kho.
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-700 font-medium text-xs sm:text-sm">
                    Tiền cọc dự kiến hoàn lại (trừ hư hại nếu có):
                  </span>
                  <span className="font-bold text-brand-600 text-lg sm:text-xl tabular-nums shrink-0">
                    {formatVND(contract.depositHeld)}
                  </span>
                </div>
              )}
            </div>

            {/* Cam kết tình trạng sau khi dọn (Làm phẳng, bỏ nền xanh lá) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Cam kết tình trạng sau khi dọn (Bắt buộc xác nhận):
              </h4>

              <label className="flex items-start gap-3 text-sm text-gray-700 hover:text-gray-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCleaned}
                  onChange={(e) => {
                    setIsCleaned(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-1 rounded border-gray-300 accent-brand-600 h-4 w-4 shrink-0 cursor-pointer"
                  required
                />
                <span className="leading-snug">
                  <strong className="text-gray-900">Đã dọn sạch 100% đồ đạc</strong> và không để lại rác thải.
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700 hover:text-gray-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConditionOk}
                  onChange={(e) => {
                    setIsConditionOk(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="mt-1 rounded border-gray-300 accent-brand-600 h-4 w-4 shrink-0 cursor-pointer"
                  required
                />
                <span className="leading-snug">
                  <strong className="text-gray-900">Ô kho nguyên vẹn:</strong> Cửa, sàn, vách ngăn và ổ khóa không hư hại.
                </span>
              </label>
            </div>

            {/* Thông tin trả kho quá hạn (Dùng màu Xanh dương Info thay vì Xanh lá) */}
            {isOverdue && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3 text-xs sm:text-sm text-blue-800">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold mb-0.5">
                    Thông tin trả kho quá hạn (D+{contract.overdueDays || 1})
                  </p>
                  <p>
                    Bạn đã tất toán đầy đủ phí lưu kho / phạt quá hạn. Mã PIN tạm thời sẽ bị vô hiệu hóa ngay khi nhân viên bắt đầu nghiệm thu.
                  </p>
                </div>
              </div>
            )}

            {/* Thông báo trả trong tháng cuối */}
            {isWithinFinalMonth && !isOverdue && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3 text-xs sm:text-sm text-blue-800">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <p className="font-bold mb-0.5">Thông tin trả kho sớm (trong tháng cuối)</p>
                  <p>
                    Hợp đồng còn <strong>{unusedRentInfo.unusedDays} ngày</strong> (hạn: {contract.endDate}). Bạn được hoàn trả <strong>100% tiền cọc ({formatVND(contract.depositHeld)})</strong> và không hoàn tiền lẻ ngày chưa dùng.
                  </p>
                </div>
              </div>
            )}

            {/* Lưu ý khi trả kho trước hạn dài (> 30 ngày) */}
            {isEarlyReturn && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg space-y-2 text-xs sm:text-sm text-amber-900">
                <div className="flex items-start gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Lưu ý khi trả kho trước hạn dài (&gt; 30 ngày):</span>
                </div>
                <div className="text-xs text-amber-800 space-y-1 pl-6">
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

                <label className="flex items-start gap-2 pt-2 border-t border-amber-200/80 cursor-pointer select-none text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={agreeEarlyTerms}
                    onChange={(e) => {
                      setAgreeEarlyTerms(e.target.checked);
                      if (error) setError(null);
                    }}
                    className="mt-0.5 rounded border-amber-400 accent-amber-600 h-4 w-4 shrink-0 cursor-pointer"
                    required
                  />
                  <span>Tôi đồng ý không nhận lại tiền cọc và nhận hoàn tiền thuê còn lại.</span>
                </label>
              </div>
            )}

            {/* Ghi chú */}
            <div className="pt-2 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Ghi chú thêm cho nhân viên cơ sở (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú về tình trạng ô kho hoặc thời gian thuận tiện (nếu có)..."
                className="w-full text-sm p-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Validation Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Đã gửi yêu cầu trả kho thành công.</span>
              </div>
            )}
          </div>

          {/* 3. Footer: Tiến trình rõ ràng (nổi bật mốc Quyết toán 7 ngày làm việc) + Nút Submit đậm nét */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                  1. Báo trả kho
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-gray-700">2. Nghiệm thu kho</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-900">3. Quyết toán (7 ngày làm việc)</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Đang gửi thông báo...' : 'Xác nhận & Báo trả kho'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
