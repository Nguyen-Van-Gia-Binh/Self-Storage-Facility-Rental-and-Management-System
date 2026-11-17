import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Trash2, RefreshCw, Plus, Receipt } from 'lucide-react';
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
  const [isCashCollected, setIsCashCollected] = useState<boolean>(true);
  const [showExtraCostInput, setShowExtraCostInput] = useState<boolean>(false);
  const [additionalCost, setAdditionalCost] = useState<number>(0);
  const [additionalCostReason, setAdditionalCostReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingPreview, setFetchingPreview] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SettlementPreviewData | null>(null);

  const fetchPreviewData = useCallback(async (contractId: number) => {
    setFetchingPreview(true);
    setError(null);
    try {
      const data = await getSettlementPreview(contractId);
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không tải được bảng tất toán từ hệ thống.');
    } finally {
      setFetchingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !contract) return;
    setNote(contract.damageNotes ? `Căn cứ theo biên bản: ${contract.damageNotes}` : '');
    setIsCashCollected(true);
    setShowExtraCostInput(false);
    setAdditionalCost(0);
    setAdditionalCostReason('');
    setPreview(null);
    fetchPreviewData(contract.id);
  }, [isOpen, contract?.id, fetchPreviewData]);

  if (!isOpen || !contract) return null;

  // Xác định chuẩn xác loại hình quyết toán
  const settlementType:
    | 'EARLY_RETURN'
    | 'NORMAL'
    | 'OVERDUE_TERMINATED'
    | 'REJECTED_CHECKIN'
    | 'CANCELLED_CHECKIN' =
    preview?.settlementType ??
    (contract.status === 'CANCELLED'
      ? 'CANCELLED_CHECKIN'
      : contract.status === 'TERMINATED'
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
  const totalRentalFee =
    preview?.totalRentalFee ?? (contract.monthlyPrice || 0) * Math.max(1, contract.rentalMonths || 1);
  const depositForfeited = preview?.depositForfeited ?? 0;

  const extraCostValue = showExtraCostInput ? Math.max(0, Number(additionalCost) || 0) : 0;
  const totalDeductionBase = recordedDamage + unpaidExtras + extraCostValue;

  let netRefund = 0;
  let payableAmount = 0;
  let sealingAndImpoundFee = 0;

  if (preview) {
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
      const basePayable = preview.payableAmount ?? (recordedDamage + unpaidExtras);
      payableAmount = basePayable + extraCostValue; // Bảo toàn công nợ hư hại / phụ phí chưa trả + phí phát sinh thêm
    } else if (settlementType === 'REJECTED_CHECKIN') {
      // BR-CHK-06: Hoàn 100% tiền thuê + cọc
      netRefund = preview.depositRefundAmount ?? ((earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee) + originalDeposit);
      payableAmount = 0;
    } else if (settlementType === 'CANCELLED_CHECKIN') {
      // Hủy nhận kho theo chính sách 3 mức (≥ 7 ngày: hoàn 100% cọc; 2-6 ngày: phạt 50% cọc; < 48h: phạt 100% cọc)
      const rentRefund = earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee;
      const depositRefund = Math.max(0, originalDeposit - depositForfeited);
      const baseRefund = preview.depositRefundAmount ?? (rentRefund + depositRefund);
      if (baseRefund >= extraCostValue) {
        netRefund = baseRefund - extraCostValue;
        payableAmount = 0;
      } else {
        netRefund = 0;
        payableAmount = extraCostValue - baseRefund;
      }
    }
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
        confirmPaid: payableAmount > 0 ? isCashCollected : true,
      });

      const successMsg =
        res.message ||
        (payableAmount > 0
          ? isCashCollected
            ? `Đã xác nhận thu đủ tiền nộp bù (+${payableAmount.toLocaleString('vi-VN')} đ) và đóng hợp đồng thành công (CLOSED)`
            : `Đã chốt công nợ bồi thường (+${payableAmount.toLocaleString('vi-VN')} đ). Hệ thống đã mở cổng nộp bù online cho khách hàng`
          : netRefund > 0
          ? `Đã phê duyệt quyết toán hoàn cọc ${netRefund.toLocaleString('vi-VN')} đ thành công`
          : 'Đã chốt quyết toán và đóng hợp đồng');

      onSuccess(contract.id, successMsg);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi phê duyệt quyết toán.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getSettlementBadge = () => {
    switch (settlementType) {
      case 'EARLY_RETURN':
        return {
          title: 'Bảng quyết toán trả kho sớm',
          tag: 'Trả kho sớm',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'NORMAL':
        return {
          title: 'Bảng quyết toán hoàn cọc đúng hạn',
          tag: 'Trả kho đúng hạn',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
        };
      case 'REJECTED_CHECKIN':
        return {
          title: 'Bảng hoàn tiền từ chối bàn giao',
          tag: 'Từ chối nhận kho',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CANCELLED_CHECKIN':
        return {
          title: 'Bảng quyết toán hủy nhận kho trước bàn giao',
          tag: 'Hủy trước bàn giao',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'OVERDUE_TERMINATED':
        return {
          title: 'Bảng quyết toán cưỡng chế & Kho Tổng (D+7)',
          tag: 'Cưỡng chế Kho Tổng',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
        };
    }
  };

  const badgeInfo = getSettlementBadge();
  const formatMoney = (amount: number) => `${amount.toLocaleString('vi-VN')} đ`;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-modal-title"
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200"
      >
        {/* KHỐI 1: HEADER NỀN TRẮNG CHUẨN ENTERPRISE */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="settlement-modal-title"
                className="font-bold text-base tracking-tight text-gray-900"
              >
                Quyết toán HĐ #{contract.code}
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeInfo.color}`}
              >
                {badgeInfo.tag}
              </span>
            </div>
            <p className="text-[13px] text-gray-500">
              Khách hàng: <span className="font-medium text-gray-700">{contract.customerName}</span>
              <span className="mx-1.5 text-gray-300">|</span>
              Ô kho:{' '}
              <span className="font-mono font-medium text-gray-700">
                {contract.storageUnitCode}
              </span>{' '}
              ({contract.unitTypeName})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KHỐI 2: NỘI DUNG VÀ BẢNG QUYẾT TOÁN TÀI CHÍNH */}
        <div className="p-6 space-y-5 overflow-y-auto bg-gray-50/40">
          {fetchingPreview ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center bg-white rounded-xl border border-gray-200">
              <RefreshCw className="w-6 h-6 text-brand-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-800">
                Đang đối soát &amp; nạp dữ liệu quyết toán...
              </p>
              <p className="text-xs text-gray-500">
                Hệ thống đang truy xuất bảng tính hoàn cọc, tiền thuê và phụ phí từ máy chủ
              </p>
            </div>
          ) : error && !preview ? (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-rose-700 text-sm font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <p className="text-xs text-rose-600/80">
                Không thể tính toán chi phí quyết toán do gặp sự cố kết nối.
              </p>
              <button
                type="button"
                onClick={() => contract && fetchPreviewData(contract.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử tải lại bảng quyết toán
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* BẢNG QUYẾT TOÁN TÀI CHÍNH MINH BẠCH */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{badgeInfo.title}</span>
                  </h4>
                  {!showExtraCostInput &&
                    settlementType !== 'REJECTED_CHECKIN' &&
                    settlementType !== 'CANCELLED_CHECKIN' && (
                      <button
                        type="button"
                        onClick={() => setShowExtraCostInput(true)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline underline-offset-2 inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm chi phí phát sinh</span>
                      </button>
                    )}
                </div>

                {/* CÁC DÒNG HẠCH TOÁN CĂN LỀ PHẢI TABULAR-NUMS */}
                <div className="divide-y divide-gray-100 text-sm">
                  {settlementType === 'EARLY_RETURN' && (
                    <>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">
                          Tiền thuê ngày chưa sử dụng (
                          {unusedDays > 0 ? `${unusedDays} ngày` : 'phần chưa dùng'})
                        </span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(earlyRentRefund)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-600">
                          Phạt vi phạm trả kho sớm (100% cọc — không hoàn)
                        </span>
                        <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                          - {formatMoney(originalDeposit)}
                        </span>
                      </div>
                    </>
                  )}

                  {settlementType === 'NORMAL' && (
                    <div className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-gray-700">Tiền cọc ban đầu được bảo toàn (100%)</span>
                      <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                        {formatMoney(originalDeposit)}
                      </span>
                    </div>
                  )}

                  {settlementType === 'REJECTED_CHECKIN' && (
                    <>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">Hoàn 100% Tiền thuê đã đóng</span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">Hoàn 100% Tiền cọc ban đầu</span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(originalDeposit)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 italic pt-2">
                        Miễn trừ toàn bộ chi phí do từ chối bàn giao ở khâu Check-in.
                      </p>
                    </>
                  )}

                  {settlementType === 'CANCELLED_CHECKIN' && (
                    <>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">
                          Hoàn 100% Tiền thuê đã thanh toán ({contract.rentalMonths || 1} tháng)
                        </span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">Tiền cọc ban đầu</span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(originalDeposit)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-600">
                          Khấu trừ phí hủy nhận kho (
                          {depositForfeited === 0
                            ? 'Hủy trước ≥ 7 ngày — Không phạt'
                            : depositForfeited >= originalDeposit
                            ? 'Hủy sát giờ < 48h — Phạt 100% cọc'
                            : 'Hủy trước 2 – 6 ngày — Phạt 50% cọc'}
                          )
                        </span>
                        <span
                          className={`font-medium tabular-nums text-right shrink-0 whitespace-nowrap ${
                            depositForfeited > 0 ? 'text-rose-600' : 'text-gray-600'
                          }`}
                        >
                          {depositForfeited > 0 ? `- ${formatMoney(depositForfeited)}` : '0 đ'}
                        </span>
                      </div>
                    </>
                  )}

                  {settlementType === 'OVERDUE_TERMINATED' && (
                    <>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-700">Tiền cọc ban đầu</span>
                        <span className="font-semibold text-gray-900 tabular-nums text-right shrink-0 whitespace-nowrap">
                          {formatMoney(originalDeposit)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-600">Phí quá hạn lũy kế (D+1..D+7 — 55% cọc)</span>
                        <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                          - {formatMoney(overdueFee)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4 py-2">
                        <span className="text-gray-600">
                          Phí niêm phong &amp; chuyển về Kho Tổng (45% cọc)
                        </span>
                        <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                          - {formatMoney(sealingAndImpoundFee)}
                        </span>
                      </div>
                      <div className="pt-2.5">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
                          <p>
                            • <strong className="text-gray-800">Khách chuộc đồ (trong 30 ngày):</strong> Bấm thêm chi phí lưu kho tổng phát sinh.
                          </p>
                          <p>
                            • <strong className="text-gray-800">Thanh lý ngoại tuyến (&gt; 30 ngày):</strong> Để chi phí phát sinh = 0 đ rồi duyệt chốt HĐ.
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* CÁC KHOẢN KHẤU TRỪ CHUNG */}
                  {recordedDamage > 0 && settlementType !== 'REJECTED_CHECKIN' && (
                    <div className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-gray-700">Khấu trừ hư hại / vệ sinh (BOM)</span>
                      <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                        - {formatMoney(recordedDamage)}
                      </span>
                    </div>
                  )}

                  {unpaidExtras > 0 && settlementType !== 'REJECTED_CHECKIN' && (
                    <div className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-gray-700">Phụ phí dịch vụ chưa thanh toán</span>
                      <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                        - {formatMoney(unpaidExtras)}
                      </span>
                    </div>
                  )}

                  {overdueFee > 0 && settlementType === 'NORMAL' && (
                    <div className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-gray-700">Khấu trừ phí quá hạn phát sinh</span>
                      <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                        - {formatMoney(overdueFee)}
                      </span>
                    </div>
                  )}

                  {showExtraCostInput && extraCostValue > 0 && (
                    <div className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-gray-700">
                        Chi phí phát sinh ghi nhận thêm
                        {additionalCostReason.trim() ? ` (${additionalCostReason.trim()})` : ''}
                      </span>
                      <span className="font-medium text-rose-600 tabular-nums text-right shrink-0 whitespace-nowrap">
                        - {formatMoney(extraCostValue)}
                      </span>
                    </div>
                  )}
                </div>

                {/* KHUNG THÊM CHI PHÍ PHÁT SINH */}
                {showExtraCostInput && (
                  <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-xs">
                        Chi phí phát sinh Quản lý cơ sở (FM) ghi nhận thêm
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowExtraCostInput(false);
                          setAdditionalCost(0);
                          setAdditionalCostReason('');
                        }}
                        className="text-gray-500 hover:text-rose-600 inline-flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bỏ thêm phí</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Số tiền phát sinh (VNĐ)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10000}
                          value={additionalCost || ''}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault();
                          }}
                          onChange={(e) => setAdditionalCost(Math.max(0, Number(e.target.value) || 0))}
                          placeholder="VD: 300000"
                          className="w-full px-3 py-1.5 text-sm tabular-nums bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Lý do / Diễn giải
                        </label>
                        <input
                          type="text"
                          value={additionalCostReason}
                          onChange={(e) => setAdditionalCostReason(e.target.value)}
                          placeholder="VD: Lưu Kho Tổng 10 ngày..."
                          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* KHỐI TỔNG TIỀN (HIGHLIGHT BOX TRỌNG TÂM TÀI CHÍNH) */}
                <div
                  className={`p-4 rounded-lg border space-y-1 ${
                    payableAmount > 0
                      ? 'bg-rose-50/50 border-rose-200'
                      : netRefund > 0
                      ? 'bg-brand-50/40 border-brand-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {payableAmount > 0
                      ? 'Khách nộp bổ sung cho cơ sở'
                      : netRefund > 0
                      ? 'Cơ sở thực hoàn trả khách hàng'
                      : 'Tất toán công nợ'}
                  </p>
                  <p
                    className={`text-2xl font-bold tabular-nums tracking-tight ${
                      payableAmount > 0
                        ? 'text-rose-700'
                        : netRefund > 0
                        ? 'text-gray-900'
                        : 'text-gray-800'
                    }`}
                  >
                    {payableAmount > 0 ? formatMoney(payableAmount) : formatMoney(netRefund)}
                  </p>
                  <p className="text-xs italic text-gray-500">
                    {payableAmount > 0
                      ? isCashCollected
                        ? 'Đã đối soát & thu đủ tiền mặt/chuyển khoản trước khi đóng HĐ'
                        : 'Hệ thống sẽ ghi nhận công nợ và mở cổng VietQR cho khách thanh toán online'
                      : netRefund > 0
                      ? 'Hoàn trả về tài khoản gốc của khách hàng trong 7 ngày'
                      : 'Công nợ cân bằng 0 đ, đủ điều kiện đóng hợp đồng ngay'}
                  </p>
                </div>
              </div>

              {/* KHỐI 3: HÌNH THỨC THU & GHI CHÚ ĐỐI SOÁT */}
              <div className="space-y-3">
                {payableAmount > 0 && (
                  <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-2">
                    <span className="text-xs font-semibold text-gray-800 block">
                      Hình thức thu khoản nộp bù ({formatMoney(payableAmount)}):
                    </span>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="collectionMethod"
                          checked={isCashCollected}
                          onChange={() => setIsCashCollected(true)}
                          className="accent-brand-600 cursor-pointer"
                        />
                        <span>
                          Đã thu tiền mặt / chuyển khoản trực tiếp tại quầy{' '}
                          <strong>(Đóng HĐ ngay)</strong>
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="collectionMethod"
                          checked={!isCashCollected}
                          onChange={() => setIsCashCollected(false)}
                          className="accent-brand-600 cursor-pointer"
                        />
                        <span>
                          Khách sẽ quét mã VietQR tự thanh toán online{' '}
                          <strong>(Đóng HĐ sau khi thanh toán)</strong>
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="settlement-reconcile-note"
                    className="block text-xs font-semibold text-gray-700 mb-1.5"
                  >
                    Ghi chú đối soát
                  </label>
                  <input
                    id="settlement-reconcile-note"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      payableAmount > 0
                        ? isCashCollected
                          ? 'VD: Đã thu tiền mặt đủ tại quầy từ khách...'
                          : 'VD: Khách chọn quét mã QR thanh toán nộp bù...'
                        : netRefund > 0
                        ? 'VD: Đã xác nhận STK hoàn tiền qua Vietcombank...'
                        : 'VD: Đã đối soát tất toán hoàn tất...'
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* KHỐI 4: FOOTER CĂN PHẢI, NÚT NGẮN GỌN CHUẨN ACTION */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={loading || fetchingPreview || preview == null}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer ${
              payableAmount > 0
                ? isCashCollected
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {payableAmount > 0 && !isCashCollected
                  ? 'Đang mở cổng QR...'
                  : 'Đang xử lý...'}
              </span>
            ) : fetchingPreview ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang nạp bảng tính...
              </span>
            ) : payableAmount > 0 ? (
              isCashCollected ? (
                'Xác nhận thu tiền & Đóng HĐ'
              ) : (
                'Chốt công nợ & Mở cổng QR'
              )
            ) : netRefund > 0 ? (
              'Xác nhận hoàn tiền'
            ) : (
              'Chốt tất toán & Đóng HĐ'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
