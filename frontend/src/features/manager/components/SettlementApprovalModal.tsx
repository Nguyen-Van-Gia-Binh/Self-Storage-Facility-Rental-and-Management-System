import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, RotateCcw, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
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

  // Xác định chính xác loại hình quyết toán
  const settlementType: 'EARLY_RETURN' | 'NORMAL' | 'OVERDUE_TERMINATED' | 'REJECTED_CHECKIN' =
    preview?.settlementType ??
    (contract.status === 'TERMINATED'
      ? contract.checkinDate == null
        ? 'REJECTED_CHECKIN'
        : 'OVERDUE_TERMINATED'
      : preview?.earlyReturn || (preview?.earlyRentRefund ?? 0) > 0
      ? 'EARLY_RETURN'
      : 'NORMAL');

  const originalDeposit = preview?.depositAmount ?? contract.depositAmount ?? 0;
  const earlyRentRefund = preview?.earlyRentRefund ?? 0;
  const unusedDays = preview?.unusedDays ?? 0;
  const recordedDamage = preview?.damageCost ?? 0;
  const unpaidExtras = preview?.unpaidExtraCharges ?? 0;
  const overdueFee = preview?.overdueFee ?? contract.overdueFeeAccrued ?? 0;
  const totalRentalFee = preview?.totalRentalFee ?? 0;

  const extraCostValue = showExtraCostInput ? Math.max(0, Number(additionalCost) || 0) : 0;
  const totalDeductionBase = recordedDamage + unpaidExtras + extraCostValue;

  let netRefund = 0;
  let payableAmount = 0;
  let sealingAndImpoundFee = 0;

  if (settlementType === 'EARLY_RETURN') {
    // BR-RET-06: Hoàn tiền thuê chưa dùng, phạt 100% cọc phòng trống
    const available = earlyRentRefund;
    if (available >= totalDeductionBase) {
      netRefund = available - totalDeductionBase;
      payableAmount = 0;
    } else {
      netRefund = 0;
      payableAmount = totalDeductionBase - available;
    }
  } else if (settlementType === 'NORMAL') {
    // BR-RET-04: Bảo toàn 100% cọc ban đầu
    const totalDeduction = totalDeductionBase + overdueFee;
    if (originalDeposit >= totalDeduction) {
      netRefund = originalDeposit - totalDeduction;
      payableAmount = 0;
    } else {
      netRefund = 0;
      payableAmount = totalDeduction - originalDeposit;
    }
  } else if (settlementType === 'OVERDUE_TERMINATED') {
    // BR-OVD-07, BR-OVD-11: Cọc đã khấu trừ hết (55% quá hạn + 45% niêm phong)
    sealingAndImpoundFee = Math.max(0, originalDeposit - overdueFee);
    netRefund = 0;
    payableAmount = extraCostValue; // Chỉ thu nợ thêm nếu FM nhập phí lưu Kho Tổng
  } else if (settlementType === 'REJECTED_CHECKIN') {
    // BR-CHK-06: Hoàn 100% tiền thuê + cọc
    netRefund = (earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee) + originalDeposit;
    payableAmount = 0;
  }

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const extraNoteSegment =
        showExtraCostInput && extraCostValue > 0
          ? `[Chi phí phát sinh: +${extraCostValue.toLocaleString('vi-VN')}đ${
              additionalCostReason.trim() ? ` - ${additionalCostReason.trim()}` : ''
            }]`
          : '';
      const combinedNote = [note.trim(), extraNoteSegment].filter(Boolean).join(' | ');

      const res = await approveSettlementRefund({
        contractId: contract.id,
        damageCost: recordedDamage + extraCostValue,
        depositRefundAmount: netRefund,
        penaltyAmount: overdueFee,
        note: combinedNote || undefined,
        confirmPaid: true, // FM xác nhận đã đối soát tài chính (chi hoàn hoặc thu bù) và chốt đóng HĐ ngay
      });

      const successMsg =
        res.message ||
        (payableAmount > 0
          ? `Đã xác nhận thu đủ tiền nộp bù (+${payableAmount.toLocaleString('vi-VN')} đ) và đóng hợp đồng thành công (CLOSED)`
          : netRefund > 0
          ? `Đã xác nhận hoàn trả (${netRefund.toLocaleString('vi-VN')} đ) và đóng hợp đồng thành công (CLOSED)`
          : `Đã chốt tất toán và đóng hợp đồng thành công (CLOSED)`);

      onSuccess(contract.id, successMsg);
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
              <h3 className="font-bold text-base">Phê duyệt quyết toán hợp đồng</h3>
              <p className="text-xs text-purple-200">
                Đối soát tất toán công nợ và hoàn tất đóng hợp đồng (CLOSED)
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
              <span className="text-slate-500">Ô kho thuê:</span>
              <span className="font-medium text-purple-700">
                {contract.storageUnitCode} ({contract.unitTypeName})
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bảng tính quyết toán minh bạch */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-purple-900 uppercase tracking-wider text-[11px]">
                {settlementType === 'EARLY_RETURN' && 'Bảng quyết toán trả kho sớm (Win-Win BR-RET-06)'}
                {settlementType === 'NORMAL' && 'Bảng quyết toán hoàn cọc đúng hạn (BR-RET-04)'}
                {settlementType === 'OVERDUE_TERMINATED' && 'Bảng quyết toán cưỡng chế & Kho Tổng (D+7)'}
                {settlementType === 'REJECTED_CHECKIN' && 'Bảng hoàn tiền từ chối bàn giao (BR-CHK-06)'}
              </h4>
              {!showExtraCostInput && settlementType !== 'REJECTED_CHECKIN' && (
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

            {/* TRƯỜNG HỢP 1: TRẢ KHO SỚM (EARLY_RETURN) */}
            {settlementType === 'EARLY_RETURN' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                  <span>
                    1. Tiền thuê ngày chưa sử dụng ({unusedDays > 0 ? `${unusedDays} ngày` : 'phần chưa dùng'}):
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{earlyRentRefund.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 px-1 text-[11px]">
                  <span>2. Phạt vi phạm trả kho sớm (Phạt 100% Cọc bù phòng trống):</span>
                  <span className="font-mono font-semibold line-through text-slate-400">
                    +{originalDeposit.toLocaleString('vi-VN')} đ (0 đ hoàn)
                  </span>
                </div>
                {recordedDamage > 0 && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>3. Chi phí khắc phục hư hại / vệ sinh (BOM):</span>
                    <span className="font-mono font-semibold">
                      -{recordedDamage.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                {unpaidExtras > 0 && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>4. Phụ phí dịch vụ chưa thanh toán:</span>
                    <span className="font-mono font-semibold">
                      -{unpaidExtras.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TRƯỜNG HỢP 2: TRẢ KHO ĐÚNG HẠN (NORMAL) */}
            {settlementType === 'NORMAL' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-700 px-1">
                  <span>1. Tiền cọc ban đầu được bảo toàn (100%):</span>
                  <span className="font-mono font-semibold text-slate-900">
                    +{originalDeposit.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 px-1">
                  <span>2. Chi phí khắc phục hư hại / vệ sinh:</span>
                  <span className="font-mono font-semibold">
                    -{recordedDamage.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 px-1">
                  <span>3. Phụ phí chưa thanh toán:</span>
                  <span className="font-mono font-semibold">
                    -{unpaidExtras.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                {overdueFee > 0 && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>4. Khấu trừ phí quá hạn phát sinh:</span>
                    <span className="font-mono font-semibold">
                      -{overdueFee.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* TRƯỜNG HỢP 3: CƯỠNG CHẾ D+7 KHO TỔNG (OVERDUE_TERMINATED) */}
            {settlementType === 'OVERDUE_TERMINATED' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-700 px-1">
                  <span>1. Tiền cọc ban đầu:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    +{originalDeposit.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 px-1">
                  <span>2. Phí quá hạn lũy kế (D+1..D+7 — 55% cọc):</span>
                  <span className="font-mono font-semibold">
                    -{overdueFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 px-1">
                  <span>3. Phí niêm phong & chuyển về Kho Tổng (45% cọc):</span>
                  <span className="font-mono font-semibold">
                    -{sealingAndImpoundFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1 mt-2">
                  <p className="font-semibold">Quy chuẩn quyết toán tài sản tại Kho Tổng (BR-OVD-11):</p>
                  <p>
                    • <strong>Khách chuộc lại đồ trong 30 ngày:</strong> Bấm <em>"+ Thêm chi phí phát sinh"</em> nhập phí lưu Kho Tổng. Khách nộp tiền mặt/chuyển khoản quầy xong, FM bấm duyệt để đóng hợp đồng.
                  </p>
                  <p>
                    • <strong>Khách bỏ đồ &gt; 30 ngày:</strong> Sau khi cơ sở thanh lý ngoại tuyến, giữ chi phí phát sinh = 0 đ và bấm chốt thanh lý để đóng hợp đồng.
                  </p>
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 4: TỪ CHỐI BÀN GIAO CHECK-IN (REJECTED_CHECKIN) */}
            {settlementType === 'REJECTED_CHECKIN' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                  <span>1. Hoàn 100% Tiền thuê đã thanh toán trước:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{(earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                  <span>2. Hoàn 100% Tiền cọc ban đầu:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{originalDeposit.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic px-1">
                  (Miễn trừ toàn bộ chi phí do từ chối bàn giao ở khâu Check-in theo BR-CHK-06)
                </p>
              </div>
            )}

            {/* Khung nhập chi phí phát sinh (nếu có) */}
            {showExtraCostInput && (
              <div className="p-3 bg-white rounded-xl border border-purple-300 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-[11px]">
                    Chi phí phát sinh Quản lý cơ sở (FM) ghi nhận thêm
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
                      Số tiền phát sinh (VNĐ)
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
                      Lý do / Diễn giải
                    </label>
                    <input
                      type="text"
                      value={additionalCostReason}
                      onChange={(e) => setAdditionalCostReason(e.target.value)}
                      placeholder="VD: Phí lưu Kho Tổng 10 ngày / Vệ sinh đặc biệt"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
                {extraCostValue > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold pt-1 border-t border-slate-100">
                    <span>Khấu trừ / Thu thêm:</span>
                    <span className="font-mono">-{extraCostValue.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
              </div>
            )}

            {/* Dòng Tổng kết thực tế */}
            <div className="pt-2 border-t border-purple-200 flex justify-between items-center text-sm font-bold">
              <span className="text-purple-950">
                {payableAmount > 0
                  ? 'Khách nộp bổ sung cho cơ sở:'
                  : netRefund > 0
                  ? 'Cơ sở thực hoàn trả khách hàng:'
                  : 'Tất toán công nợ:'}
              </span>
              <span
                className={`font-mono text-base ${
                  payableAmount > 0
                    ? 'text-rose-600'
                    : netRefund > 0
                    ? 'text-emerald-600'
                    : 'text-slate-700'
                }`}
              >
                {payableAmount > 0
                  ? `+${payableAmount.toLocaleString('vi-VN')} đ`
                  : `${netRefund.toLocaleString('vi-VN')} đ`}
              </span>
            </div>

            {/* Chú thích hướng dẫn thao tác trực tiếp */}
            <div className="p-2.5 bg-slate-100/80 rounded-lg text-[11px] text-slate-600 leading-relaxed">
              {payableAmount > 0 ? (
                <span>
                  💡 <strong>Thao tác:</strong> Khách thanh toán nộp bù bằng tiền mặt tại quầy hoặc chuyển khoản trực tiếp cho cơ sở. Quản lý kiểm tra nhận đủ tiền, ghi chú chứng từ và nhấn nút bên dưới để đóng hợp đồng.
                </span>
              ) : netRefund > 0 ? (
                <span>
                  💡 <strong>Thao tác:</strong> Quản lý cơ sở đã chuyển khoản trả lại số tiền này về STK của khách (hoặc chi tiền mặt tại quầy). Nhấn xác nhận để hoàn tất lệnh hoàn và đóng hợp đồng.
                </span>
              ) : (
                <span>
                  💡 <strong>Thao tác:</strong> Hợp đồng đã hoàn tất khấu trừ toàn bộ công nợ. Nhấn xác nhận để đóng hợp đồng sang trạng thái <strong>CLOSED</strong>.
                </span>
              )}
            </div>
          </div>

          {/* Ghi chú đối soát & Chứng từ thực tế */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ghi chú đối soát & Thông tin thanh toán thực tế
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                payableAmount > 0
                  ? 'VD: Đã thu tiền mặt 500.000đ tại quầy tiếp tân cơ sở ngày 15/11...'
                  : netRefund > 0
                  ? 'VD: Đã chuyển khoản hoàn 9.800.000đ về STK Vietcombank khách hàng ngày 15/11...'
                  : 'VD: Đã đối soát hiện trường và thanh lý tài sản ngoại tuyến...'
              }
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Footer: Nút bấm dứt khoát 1-Click */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-300 hover:bg-white transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={loading || preview == null}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer ${
              payableAmount > 0
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang xử lý đóng hợp đồng...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {payableAmount > 0
                  ? `Xác nhận đã thu đủ ${payableAmount.toLocaleString('vi-VN')} đ & Đóng HĐ`
                  : netRefund > 0
                  ? `Xác nhận đã hoàn ${netRefund.toLocaleString('vi-VN')} đ & Đóng HĐ`
                  : 'Chốt tất toán & Đóng hợp đồng (CLOSED)'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
