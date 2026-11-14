import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, RefreshCw, CreditCard, DollarSign } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import { getForceRenewalQuote, submitForceRenewal, type ForceRenewalQuoteResponse } from '@/api/contract';

interface ForceRenewalModalProps {
  isOpen: boolean;
  contract: ManagerContractItem | null;
  onClose: () => void;
  onSuccess: (contractId: number, message: string) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';

export const ForceRenewalModal: React.FC<ForceRenewalModalProps> = ({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) => {
  const [renewalMonths, setRenewalMonths] = useState<number>(3);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState<string>('Khách hàng thanh toán trực tiếp tại quầy cơ sở');
  const [quote, setQuote] = useState<ForceRenewalQuoteResponse | null>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [capacityConflict, setCapacityConflict] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !contract) return;
    setRenewalMonths(3);
    setPaymentMethod('CASH');
    setNotes('Khách hàng thanh toán trực tiếp tại quầy cơ sở');
    setError(null);
  }, [isOpen, contract]);

  useEffect(() => {
    if (!isOpen || !contract) return;
    let isMounted = true;

    const fetchQuote = async () => {
      setLoadingQuote(true);
      setCapacityConflict(false);
      setConflictMessage('');
      setError(null);
      try {
        const res = await getForceRenewalQuote(contract.id, renewalMonths);
        if (isMounted) {
          setQuote(res);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err?.message || err?.data?.message || 'Không thể lấy báo giá gia hạn.';
        const code = err?.errorCode || err?.data?.errorCode;
        if (code === 'CAPACITY_NOT_AVAILABLE' || msg.includes('đặt trước') || msg.includes('CAPACITY_NOT_AVAILABLE')) {
          setCapacityConflict(true);
          setConflictMessage(msg || 'Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo.');
        } else {
          setError(msg);
        }
      } finally {
        if (isMounted) setLoadingQuote(false);
      }
    };

    fetchQuote();

    return () => {
      isMounted = false;
    };
  }, [isOpen, contract, renewalMonths]);

  if (!isOpen || !contract) return null;

  const handleSubmit = async () => {
    if (capacityConflict || !quote) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitForceRenewal(contract.id, {
        renewalMonths,
        paymentMethod,
        notes: notes.trim(),
      });
      onSuccess(
        contract.id,
        `Đã gia hạn thành công hợp đồng ${contract.code} thêm ${renewalMonths} tháng đến ngày ${quote.newEndDate}! Đã thu ${fmt(quote.totalAmount)}.`
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Không thể thực hiện gia hạn ngoại lệ.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gia hạn Ngoại lệ (Force Renewal)</h3>
              <p className="text-xs text-slate-400">
                Chốt chặn T-20 ngày • Cấp quyền Facility Manager (BR-REN-10)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Thông tin HĐ tóm tắt */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Hợp đồng:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{contract.code}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Khách hàng:</span>
              <span className="font-bold text-slate-800">{contract.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ô kho hiện tại:</span>
              <span className="font-mono font-bold text-brand-700">{contract.storageUnitCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Ngày hết hạn cũ:</span>
              <span className="font-mono font-bold text-slate-800">{contract.endDateExclusive}</span>
            </div>
          </div>

          {/* Cảnh báo quy chế T-20 & Phụ phí 200k */}
          <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">Quy chế Chốt chặn T-20 ngày (BR-REN-10):</p>
              <p className="leading-relaxed">
                Hợp đồng đã bước vào khung thời gian &lt; 20 ngày. Cổng tự gia hạn của khách đã đóng để nhả chỗ cho thị trường. Hệ thống tự động thu thêm{' '}
                <strong className="text-rose-700 underline font-mono">200.000 đ</strong> phụ phí hành chính trễ hạn. Chỉ được duyệt khi ô kho{' '}
                <strong>chưa có khách hàng khác đặt cọc trước</strong>.
              </p>
            </div>
          </div>

          {/* Capacity Conflict View nếu ô kho đã bị cọc */}
          {capacityConflict && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm text-rose-900">Xung đột dung lượng kho (Hard Lock):</p>
                <p className="leading-relaxed text-rose-800">
                  {conflictMessage ||
                    'Ô kho này đã có khách hàng khác đặt trước và đặt cọc cho chu kỳ tiếp theo. Hệ thống từ chối gia hạn để đảm bảo quyền lợi khách mới.'}
                </p>
                <p className="text-[11px] text-rose-700 font-semibold pt-1">
                  💡 Hướng dẫn cho FM: Tư vấn khách làm thủ tục bàn giao trả kho đúng hạn hoặc hỗ trợ khách ký hợp đồng thuê một ô kho trống mới tại cơ sở.
                </p>
              </div>
            </div>
          )}

          {error && !capacityConflict && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Form chọn số tháng */}
          {!capacityConflict && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Số tháng gia hạn thêm:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={loadingQuote || submitting}
                      onClick={() => setRenewalMonths(m)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        renewalMonths === m
                          ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m} Tháng
                    </button>
                  ))}
                </div>
              </div>

              {/* Bảng báo giá chi tiết */}
              {loadingQuote ? (
                <div className="p-4 border border-slate-200 rounded-xl text-center text-slate-500 animate-pulse">
                  Đang kiểm tra dung lượng kho và tính báo giá...
                </div>
              ) : quote ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Hạn kết thúc mới sau gia hạn:</span>
                    <span className="font-mono font-bold text-brand-700 text-sm">
                      {quote.newEndDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Đơn giá niêm yết (BOM):</span>
                    <span className="font-mono">{fmt(quote.monthlyPriceSnapshot)} / tháng</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tiền thuê ({quote.renewalMonths} tháng):</span>
                    <span className="font-mono font-bold">{fmt(quote.rentalFeeAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-700 font-semibold">
                    <span>Phụ phí hành chính trễ hạn (BR-REN-10):</span>
                    <span className="font-mono">+{fmt(quote.lateAdminFee ?? 200000)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold text-sm">
                    <span>Tổng tiền FM cần thu tại quầy:</span>
                    <span className="font-mono text-emerald-600 text-base">
                      {fmt(quote.totalAmount)}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Phương thức thanh toán tại quầy */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Hình thức thanh toán tại quầy:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === 'CASH'}
                      onChange={() => setPaymentMethod('CASH')}
                      className="text-brand-600"
                    />
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Tiền mặt tại cơ sở</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === 'BANK_TRANSFER'}
                      onChange={() => setPaymentMethod('BANK_TRANSFER')}
                      className="text-brand-600"
                    />
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <span>Chuyển khoản VietQR</span>
                  </label>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Ghi chú hồ sơ ngoại lệ:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Khách thanh toán tiền mặt tại quầy do quá hạn online..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {!capacityConflict && (
            <button
              type="button"
              disabled={submitting || loadingQuote || !quote}
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Đang kích hoạt...' : 'Xác nhận Đã thu tiền & Gia hạn'}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
