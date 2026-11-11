import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, RotateCcw, PlusCircle, Trash2 } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import type { SettlementPreviewData } from '@/types';
import { approveSettlementRefund, getSettlementPreview } from '@/api/contract';

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
  const [note, setNote] = useState<string>('');
  const [showExtraCostInput, setShowExtraCostInput] = useState<boolean>(false);
  const [additionalCost, setAdditionalCost] = useState<number>(0);
  const [additionalCostReason, setAdditionalCostReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SettlementPreviewData | null>(null);

  React.useEffect(() => {
    if (!isOpen || !contract) return;
    setNote(contract.damageNotes ? `Căn cứ theo biên bản: ${contract.damageNotes}` : '');
    setShowExtraCostInput(false);
    setAdditionalCost(0);
    setAdditionalCostReason('');
    setPreview(null);
    setError(null);
    getSettlementPreview(contract.id)
      .then(setPreview)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Không tải được bảng tất toán.');
      });
  }, [isOpen, contract]);

  if (!isOpen || !contract) return null;

  const originalDeposit = preview?.depositAmount ?? contract.depositAmount ?? 0;
  const overdueFee = preview?.overdueFee ?? contract.overdueFeeAccrued ?? 0;
  const recordedDamage = preview?.damageCost ?? 0;
  const unpaidExtras = preview?.unpaidExtraCharges ?? 0;
  const baseNetRefund = preview?.depositRefundAmount ?? 0;
  const basePayableAmount = preview?.payableAmount ?? 0;

  const isOverdueTerminated =
    contract.status === 'TERMINATED' &&
    (Boolean(contract.checkinDate) ||
      (contract.overdueDays ?? 0) > 0 ||
      overdueFee > 0 ||
      (preview != null && preview.earlyRentRefund === 0 && baseNetRefund === 0));

  const sealingAndImpoundFee = isOverdueTerminated
    ? Math.max(0, originalDeposit - overdueFee)
    : 0;

  const extraCostValue = showExtraCostInput ? Math.max(0, Number(additionalCost) || 0) : 0;
  const totalDamageCost = recordedDamage + extraCostValue;
  const netRefund = Math.max(0, baseNetRefund - extraCostValue);
  const payableAmount = basePayableAmount + Math.max(0, extraCostValue - baseNetRefund);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const extraNoteSegment =
        showExtraCostInput && extraCostValue > 0
          ? `[Chi phí phát sinh Kho Tổng/Khác: +${extraCostValue.toLocaleString('vi-VN')}đ${
              additionalCostReason.trim() ? ` - ${additionalCostReason.trim()}` : ''
            }]`
          : '';
      const combinedNote = [note.trim(), extraNoteSegment].filter(Boolean).join(' | ');

      const res = await approveSettlementRefund({
        contractId: contract.id,
        damageCost: totalDamageCost,
        depositRefundAmount: netRefund,
        penaltyAmount: overdueFee,
        note: combinedNote || undefined,
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-200" />
            <div>
              <h3 className="font-bold text-base">Phê duyệt quyết toán & Hoàn cọc</h3>
              <p className="text-xs text-purple-200">
                Thanh lý hợp đồng và xuất lệnh hoàn tiền cọc trong 7 ngày
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

        <div className="p-6 space-y-4 overflow-y-auto">
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
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-purple-900 uppercase tracking-wider text-[11px]">
                {isOverdueTerminated
                  ? 'Bảng quyết toán cưỡng chế & Lưu giữ Kho Tổng (D+7)'
                  : 'Bảng tính quyết toán hoàn cọc'}
              </h4>
              {!showExtraCostInput && (
                <button
                  type="button"
                  onClick={() => setShowExtraCostInput(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-[11px] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Thêm chi phí phát sinh
                </button>
              )}
            </div>

            <div className="flex justify-between text-slate-700 pt-1">
              <span>1. Tiền cọc ban đầu:</span>
              <span className="font-mono font-semibold text-slate-900">
                +{originalDeposit.toLocaleString('vi-VN')} đ
              </span>
            </div>

            {isOverdueTerminated ? (
              <>
                <div className="flex justify-between text-rose-600">
                  <span>2. Phí quá hạn lũy kế (D+1..D+7 — 15% lưu kho + 40% phạt = 55% cọc):</span>
                  <span className="font-mono font-semibold">
                    -{overdueFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>3. Phí cắt khóa, kiểm kê, niêm phong & chuyển về Kho Tổng (45% cọc):</span>
                  <span className="font-mono font-semibold">
                    -{sealingAndImpoundFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {(recordedDamage > 0 || unpaidExtras > 0) && (
                  <div className="flex justify-between text-rose-700">
                    <span>4. Chi phí khắc phục / phụ phí đã ghi nhận trước đó:</span>
                    <span className="font-mono font-semibold">
                      -{(recordedDamage + unpaidExtras).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                  <p className="font-semibold">Hướng dẫn quyết toán tài sản tại Kho Tổng (BR-OVD-11):</p>
                  <p>• <strong>Khách đến Kho Tổng nhận lại đồ (trong 30 ngày):</strong> Bấm <em>"+ Thêm chi phí phát sinh"</em> để nhập phí lưu Kho Tổng. Khách thanh toán xong hợp đồng sẽ tự đóng (CLOSED).</p>
                  <p>• <strong>Khách bỏ tài sản quá 1 tháng (&gt; 30 ngày):</strong> Sau khi thanh lý ngoại tuyến, giữ chi phí phát sinh = 0 đ và bấm Duyệt để đóng hợp đồng (CLOSED).</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-slate-700">
                  <span>2. Chi phí khắc phục đã ghi nhận:</span>
                  <span className="font-mono font-semibold text-rose-700">
                    -{recordedDamage.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>3. Phụ phí chưa thanh toán:</span>
                  <span className="font-mono font-semibold text-rose-700">
                    -{unpaidExtras.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {overdueFee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>4. Khấu trừ phí quá hạn phát sinh:</span>
                    <span className="font-mono font-semibold">
                      -{overdueFee.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </>
            )}

            {showExtraCostInput && (
              <div className="p-3 bg-white rounded-xl border border-purple-300 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-[11px]">
                    Chi phí phát sinh do Quản lý cơ sở (FM) nhập thêm (Lưu Kho Tổng / Khác)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtraCostInput(false);
                      setAdditionalCost(0);
                      setAdditionalCostReason('');
                    }}
                    className="text-slate-400 hover:text-rose-600 inline-flex items-center gap-1 text-[11px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Bỏ thêm phí
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Số tiền thu thêm (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={additionalCost || ''}
                      onChange={(e) => setAdditionalCost(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="VD: 300000"
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lý do / Diễn giải phí phát sinh
                    </label>
                    <input
                      type="text"
                      value={additionalCostReason}
                      onChange={(e) => setAdditionalCostReason(e.target.value)}
                      placeholder="VD: Phí lưu giữ tại Kho Tổng 10 ngày"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                {extraCostValue > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-slate-100">
                    <span>Khấu trừ / Thu thêm chi phí phát sinh:</span>
                    <span className="font-mono">-{extraCostValue.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-sm font-bold">
              <span className="text-purple-950">
                {payableAmount > 0 ? 'Khách phải nộp thêm (Thu nợ VNPay):' : 'Thực hoàn trả khách hàng:'}
              </span>
              <span className={`font-mono text-base ${payableAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {payableAmount > 0 ? `+${payableAmount.toLocaleString('vi-VN')} đ` : `${netRefund.toLocaleString('vi-VN')} đ`}
              </span>
            </div>
          </div>

          {/* Ghi chú phê duyệt */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ghi chú phê duyệt & Biên bản đối soát / Thanh lý
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isOverdueTerminated
                  ? 'Nhập ghi chú xuất trả hàng tại Kho Tổng hoặc biên bản thanh lý tài sản ngoại tuyến sau 30 ngày...'
                  : 'Nhập ghi chú hoặc biên bản đối soát...'
              }
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
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
            disabled={loading || preview == null}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              'Đang xử lý...'
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {payableAmount > 0
                  ? 'Ghi nhận phí phát sinh & Chờ khách thanh toán'
                  : isOverdueTerminated
                  ? 'Chốt tất toán & Đóng hợp đồng (CLOSED)'
                  : 'Duyệt quyết toán & Hoàn cọc'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
