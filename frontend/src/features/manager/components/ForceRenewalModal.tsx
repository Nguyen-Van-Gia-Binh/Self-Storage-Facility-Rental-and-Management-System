import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, RefreshCw, CreditCard, DollarSign, ArrowRightLeft } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import {
  getForceRenewalQuote,
  submitForceRenewal,
  resolveRenewalConflict,
  type ForceRenewalQuoteResponse,
} from '@/api/contract';

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
  const [reassigning, setReassigning] = useState<boolean>(false);
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = async (isSilent = false) => {
    if (!contract) return;
    if (!isSilent) setLoadingQuote(true);
    setCapacityConflict(false);
    setConflictMessage('');
    setError(null);
    try {
      const res = await getForceRenewalQuote(contract.id, renewalMonths);
      setQuote(res);
      if (res.hasCapacityConflict && !res.canReassignAlternative) {
        setCapacityConflict(true);
        setConflictMessage(
          res.conflictMessage ||
            'Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo và cơ sở không còn ô kho trống cùng loại.'
        );
      }
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || 'Không thể lấy báo giá gia hạn.';
      const code = err?.errorCode || err?.data?.errorCode;
      if (code === 'CAPACITY_NOT_AVAILABLE' || msg.includes('đặt trước') || msg.includes('CAPACITY_NOT_AVAILABLE')) {
        setCapacityConflict(true);
        setConflictMessage(
          msg || 'Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo và cơ sở không còn ô kho trống cùng loại.'
        );
      } else {
        setError(msg);
      }
    } finally {
      if (!isSilent) setLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !contract) return;
    setRenewalMonths(3);
    setPaymentMethod('CASH');
    setNotes('Khách hàng thanh toán trực tiếp tại quầy cơ sở');
    setError(null);
    setReassignSuccessMsg(null);
  }, [isOpen, contract]);

  useEffect(() => {
    if (!isOpen || !contract) return;
    fetchQuote();
  }, [isOpen, contract, renewalMonths]);

  if (!isOpen || !contract) return null;

  const handleReassign = async () => {
    if (!contract || !quote?.conflictingReservationId || !quote?.alternativeUnitId) return;
    setReassigning(true);
    setError(null);
    try {
      await resolveRenewalConflict(contract.id, quote.conflictingReservationId, quote.alternativeUnitId);
      setReassignSuccessMsg(
        `Đã chuyển thành công đơn ${quote.conflictingReservationCode} sang ô ${quote.alternativeUnitCode}! Ô kho ${contract.storageUnitCode} hiện đã sẵn sàng để gia hạn.`
      );
      // Tải lại báo giá mới (xung đột đã được giải phóng)
      await fetchQuote(true);
    } catch (err: any) {
      setError(err?.message || err?.data?.message || 'Không thể điều chuyển đơn đặt cọc.');
    } finally {
      setReassigning(false);
    }
  };

  const handleSubmit = async () => {
    if (capacityConflict || !quote || quote.hasCapacityConflict) return;
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
        `Đã gia hạn thành công hợp đồng ${contract.code} thêm ${renewalMonths} tháng đến ngày ${quote.newEndDate}! Đã thu ${fmt(quote.totalAmount)} (${paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}).`
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

          {/* Capacity Conflict View nếu ô kho đã bị cọc và KHÔNG CÒN ô nào cùng loại để điều chuyển (Hard Lock) */}
          {capacityConflict && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 text-rose-950">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-sm text-rose-900">Xung đột dung lượng kho (Hard Lock):</p>
                <p className="leading-relaxed text-rose-800">
                  {conflictMessage ||
                    'Ô kho này đã có khách hàng khác đặt trước cho chu kỳ tiếp theo và cơ sở không còn ô kho trống cùng loại nào để điều chuyển. Hệ thống từ chối gia hạn để đảm bảo quyền lợi khách mới.'}
                </p>
                <p className="text-[11px] text-rose-700 font-semibold pt-1">
                  💡 Hướng dẫn cho FM: Toàn bộ ô kho cùng loại tại cơ sở đã được lấp đầy. FM vui lòng tư vấn khách làm thủ tục bàn giao trả kho đúng hạn hoặc hỗ trợ khách làm thủ tục thuê một loại kho khác nếu còn trống.
                </p>
              </div>
            </div>
          )}

          {/* Reassignable Conflict View nếu ô kho đã bị cọc nhưng VẪN CÒN ô cùng loại để điều chuyển (BR-AVL-04) */}
          {!capacityConflict && quote?.hasCapacityConflict && quote?.canReassignAlternative && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3 text-amber-950">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-amber-950">
                      Phát hiện đơn đặt trước của khách khác (Có thể điều chuyển)
                    </p>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold text-[10px] uppercase">
                      Quyền FM (BR-AVL-04)
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Ô kho <strong className="font-mono text-slate-900">{contract.storageUnitCode}</strong> đang được phân bổ trước cho khách mới. Cơ sở hiện vẫn còn{' '}
                    <strong>{quote.alternativeAvailableUnits?.length ?? 1}</strong> ô kho trống cùng loại (
                    <span className="font-mono font-bold text-amber-950">{quote.alternativeAvailableUnits?.join(', ')}</span>).
                  </p>
                </div>
              </div>

              {/* Chi tiết đơn đặt trước bị xung đột */}
              <div className="bg-white/80 border border-amber-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã đơn cọc:</span>
                  <span className="font-mono font-bold text-slate-800">{quote.conflictingReservationCode || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Khách hàng mới:</span>
                  <span className="font-bold text-slate-800">
                    {quote.conflictingCustomerName || 'Khách đặt mới'}
                    {quote.conflictingCustomerPhone ? ` (${quote.conflictingCustomerPhone})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày bắt đầu thuê:</span>
                  <span className="font-mono text-slate-700">{quote.conflictingStartDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ô kho đề xuất chuyển sang:</span>
                  <span className="font-mono font-bold text-emerald-700">{quote.alternativeUnitCode}</span>
                </div>
              </div>

              {/* Nút bấm hành động điều chuyển */}
              <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-[11px] text-amber-800 italic">
                  💡 Quy chế BR-AVL-04: Khách mới đặt theo loại kho, FM có quyền phân bổ sang ô trống tương đương trước ngày check-in.
                </p>
                <button
                  type="button"
                  disabled={reassigning || submitting}
                  onClick={handleReassign}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${reassigning ? 'animate-spin' : ''}`} />
                  <span>{reassigning ? 'Đang điều chuyển...' : `Chuyển sang ô ${quote.alternativeUnitCode} & Mở khóa gia hạn`}</span>
                </button>
              </div>
            </div>
          )}

          {/* Thông báo điều chuyển thành công */}
          {reassignSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reassignSuccessMsg}</span>
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

              {/* Phương thức thanh toán */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Hình thức thanh toán phí gia hạn:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      paymentMethod === 'CASH'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tiền mặt tại quầy</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-brand-600 bg-brand-50/50 text-brand-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Chuyển khoản / Quét VietQR</span>
                  </label>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  💡 <strong>Quy trình xử lý tại quầy:</strong> Khách thanh toán tiền mặt hoặc chuyển khoản theo số tài khoản/mã QR của cơ sở. Sau khi xác nhận tiền đã vào tài khoản, FM bấm xác nhận để hệ thống lập tức gia hạn hợp đồng và cập nhật hạn thuê mới.
                </p>
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
            disabled={submitting || reassigning}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {!capacityConflict && (
            <button
              type="button"
              disabled={submitting || loadingQuote || !quote || Boolean(quote?.hasCapacityConflict)}
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Đang xử lý...'
                  : quote?.hasCapacityConflict
                  ? 'Cần điều chuyển đơn trước'
                  : 'Xác nhận Đã thu tiền & Gia hạn'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
