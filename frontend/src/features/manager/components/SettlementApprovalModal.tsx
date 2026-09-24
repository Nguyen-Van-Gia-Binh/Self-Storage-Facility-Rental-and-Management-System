import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import { approveSettlementRefund } from '@/api/contract';

interface SettlementApprovalModalProps {
  isOpen: boolean;
  contract: ManagerContractItem | null;
  onClose: () => void;
  onSuccess: (contractId: number, message: string) => void;
}

export const SettlementApprovalModal: React.FC<SettlementApprovalModalProps> = ({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) => {
  const [damageCost, setDamageCost] = useState<number>(contract?.damageCost || 0);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial damage cost when contract changes
  React.useEffect(() => {
    if (contract) {
      setDamageCost(contract.damageCost || 0);
      setNote(contract.damageNotes ? `Căn cứ theo biên bản: ${contract.damageNotes}` : '');
    }
  }, [contract]);

  if (!isOpen || !contract) return null;

  const originalDeposit = contract.depositAmount || 800000;
  const overdueFee = contract.overdueFeeAccrued || 0;
  const totalDeduction = damageCost + overdueFee;
  const netRefund = Math.max(0, originalDeposit - totalDeduction);
  const payableAmount = Math.max(0, totalDeduction - originalDeposit);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await approveSettlementRefund({
        contractId: contract.id,
        damageCost,
        depositRefundAmount: netRefund,
        penaltyAmount: overdueFee,
        note: note.trim() || undefined,
      });
      onSuccess(contract.id, res.message);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi phê duyệt quyết toán.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-base">Phê duyệt quyết toán & Hoàn cọc (FM-04)</h3>
              <p className="text-xs text-purple-200">
                Thanh lý hợp đồng và xuất lệnh hoàn tiền cọc Deposit trong 7 ngày (BR-RET-05)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Thông tin hợp đồng & khách */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã hợp đồng:</span>
              <span className="font-mono font-bold text-slate-800">{contract.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-medium text-slate-800">{contract.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ô kho trả:</span>
              <span className="font-medium text-purple-700">{contract.storageUnitCode} ({contract.unitTypeName})</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bảng tính quyết toán */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs space-y-2.5">
            <h4 className="font-bold text-purple-900 uppercase tracking-wider text-[11px]">
              Bảng tính quyết toán hoàn cọc Deposit (BR-RET-04)
            </h4>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>1. Tiền cọc ban đầu (Deposit):</span>
              <span className="font-mono font-semibold text-slate-900">
                +{originalDeposit.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div className="flex justify-between text-slate-700 items-center">
              <span>2. Khấu trừ chi phí bồi thường hư hại:</span>
              <div className="flex items-center gap-1">
                <span className="text-rose-600 font-semibold font-mono">-</span>
                <input
                  type="number"
                  min={0}
                  value={damageCost}
                  onChange={(e) => setDamageCost(Number(e.target.value) || 0)}
                  className="w-28 px-2 py-1 text-right font-mono font-semibold text-xs border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <span className="text-xs text-slate-500">đ</span>
              </div>
            </div>

            {overdueFee > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>3. Khấu trừ phí quá hạn phát sinh:</span>
                <span className="font-mono font-semibold">
                  -{overdueFee.toLocaleString('vi-VN')} đ
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-sm font-bold">
              <span className="text-purple-950">
                {payableAmount > 0 ? 'Khách phải nộp thêm (Thu nợ PayOS):' : 'Thực hoàn trả khách hàng:'}
              </span>
              <span className={`font-mono text-base ${payableAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {payableAmount > 0 ? `+${payableAmount.toLocaleString('vi-VN')} đ` : `${netRefund.toLocaleString('vi-VN')} đ`}
              </span>
            </div>
          </div>

          {/* Ghi chú phê duyệt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ghi chú phê duyệt & Căn cứ nghiệm thu
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc biên bản đối soát..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-300 hover:bg-white transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              'Đang xử lý...'
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Duyệt quyết toán & Hoàn cọc
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
