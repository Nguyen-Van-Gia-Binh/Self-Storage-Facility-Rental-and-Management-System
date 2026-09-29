import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
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
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayDisplay = useMemo(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }, []);

  const [returnDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState('');
  const [isCleaned, setIsCleaned] = useState(false);
  const [isConditionOk, setIsConditionOk] = useState(false);
  const [agreeEarlyTerms, setAgreeEarlyTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Kiểm tra xem có trả sớm hơn ngày kết thúc hợp đồng không (BR-RET-06)
  const isEarlyReturn = useMemo(() => {
    if (!contract || !returnDate) return false;
    return new Date(returnDate) < new Date(contract.endDate);
  }, [contract, returnDate]);

  // Kiểm tra xem hợp đồng có đang trong 3 ngày ân hạn không (BR-OVD-02)
  const isGracePeriod = useMemo(() => {
    if (!contract) return false;
    return contract.status === 'OVERDUE' && (contract.overdueDays ?? 0) <= 3;
  }, [contract]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError(null);
      setIsCleaned(false);
      setIsConditionOk(false);
      setAgreeEarlyTerms(false);
      setIsSuccess(false);
    }, 180);
  };

  const validate = (): boolean => {
    if (!isCleaned) {
      setError('Vui lòng xác nhận bạn đã dọn sạch toàn bộ đồ đạc và rác thải trong ô kho.');
      return false;
    }

    if (!isConditionOk) {
      setError('Vui lòng xác nhận ô kho nguyên vẹn trước khi gửi yêu cầu nghiệm thu.');
      return false;
    }

    if (isEarlyReturn && !agreeEarlyTerms) {
      setError('Bạn phải xác nhận đã hiểu quy định không hoàn cước thuê các tháng chưa sử dụng.');
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
      const combinedNotes = `[ĐÃ DỌN ĐỒ XONG] ${notes}`.trim();
      await scheduleContractReturn({
        contractId: contract.id,
        returnDate,
        notes: combinedNotes,
      });

      setIsSuccess(true);
      setIsSubmitting(false);
      onReturnScheduled(contract.id, returnDate, combinedNotes);

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Lỗi báo trả kho:', err);
      setError('Không thể gửi yêu cầu trả kho. Vui lòng thử lại hoặc liên hệ quản lý cơ sở.');
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
            <span>Quy Trình Nghiệm Thu & Hoàn Cọc (FS-04 · FM-04)</span>
          </div>

          <h3 className="text-xl font-black text-white">Xác Nhận Đã Dọn Đồ & Báo Trả Kho</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            Ô kho <span className="font-bold text-white">{contract.unitNumber}</span> — Cơ sở {contract.facilityName}
          </p>
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

          {/* Checklist cam kết: Đã dọn sạch đồ đạc */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Cam kết hiện trạng sau khi dọn (Bắt buộc xác nhận):</span>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
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
                <strong>Đã dọn sạch 100% đồ đạc:</strong> Tôi xác nhận đã lấy hết toàn bộ tài sản cá nhân ra khỏi ô kho và không để lại rác thải.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer select-none">
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
                <strong>Ô kho nguyên vẹn:</strong> Cửa kho, sàn, vách ngăn và ổ khóa không bị hư hại, biến dạng hay vẽ bậy.
              </span>
            </label>
          </div>

          {/* Thời điểm báo trả kho */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Thời điểm hoàn tất dọn đồ & báo trả:</span>
            </div>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              Hôm nay ({todayDisplay})
            </span>
          </div>

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
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Ưu đãi ân hạn: BR-OVD-02 */}
          {isGracePeriod && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">
                <strong>Chính sách ân hạn:</strong> Hợp đồng đã quá hạn {contract.overdueDays} ngày (trong hạn 3 ngày ân hạn). Nhờ bạn hoàn tất dọn đồ và báo trả hôm nay, bạn vẫn được <strong>hoàn trả 100% tiền cọc ({formatVND(contract.depositHeld)})</strong> và được <strong>miễn toàn bộ phí phạt quá hạn</strong>.
              </span>
            </div>
          )}

          {/* Early Return Warning */}
          {isEarlyReturn && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
              <div className="flex items-start gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Quy định trả kho trước thời hạn hợp đồng:</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Ngày trả kho của bạn sớm hơn ngày kết thúc hợp đồng (<strong>{contract.endDate}</strong>).
                Khoản tiền cọc <strong>{formatVND(contract.depositHeld)}</strong> vẫn sẽ được hoàn trả 100% sau khi nghiệm thu đạt chuẩn.
                Lưu ý: <strong>Cước phí thuê các ngày/tháng chưa sử dụng sẽ không được hoàn trả</strong> theo quy định hợp đồng.
              </p>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none text-xs font-semibold text-amber-950">
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
                <span>Tôi xác nhận đã hiểu và đồng ý điều khoản không hoàn tiền cước thuê còn lại.</span>
              </label>
            </div>
          )}

          {/* Quy trình điều phối tiếp theo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Quy trình xử lý tiếp theo:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
              <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="font-bold text-emerald-700">1. Gửi báo trả</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Khách đã dọn đồ</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="font-bold text-blue-700">2. Nghiệm thu</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Staff kiểm tra kho</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="font-bold text-purple-700">3. Quyết toán</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Hoàn cọc 7 ngày làm việc</div>
              </div>
            </div>
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
              <span className="font-bold">Đã gửi yêu cầu trả kho thành công! Quản lý cơ sở đang cử nhân viên xuống kiểm tra.</span>
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
              disabled={isSubmitting || isSuccess || !isCleaned || !isConditionOk || (isEarlyReturn && !agreeEarlyTerms)}
              className="px-5 font-bold cursor-pointer shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              {isSubmitting ? (
                'Đang gửi yêu cầu...'
              ) : (
                <>
                  <span>Tôi đã dọn xong — Báo trả kho</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

