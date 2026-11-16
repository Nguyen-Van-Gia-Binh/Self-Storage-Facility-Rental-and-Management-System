import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Trash2, RefreshCw, Plus, ShieldCheck, Receipt } from 'lucide-react';
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
          color: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'NORMAL':
        return {
          title: 'Bảng quyết toán hoàn cọc đúng hạn',
          tag: 'Trả kho đúng hạn',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'REJECTED_CHECKIN':
        return {
          title: 'Bảng hoàn tiền từ chối bàn giao',
          tag: 'Từ chối nhận kho',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'CANCELLED_CHECKIN':
        return {
          title: 'Bảng quyết toán hủy nhận kho trước bàn giao',
          tag: 'Hủy trước bàn giao',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'OVERDUE_TERMINATED':
        return {
          title: 'Bảng quyết toán cưỡng chế & Kho Tổng (D+7)',
          tag: 'Cưỡng chế Kho Tổng',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
        };
    }
  };

  const badgeInfo = getSettlementBadge();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settlement-modal-title"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
      >
        
        {/* KHỐI 1: HEADER & NGỮ CẢNH TINH GỌN */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 id="settlement-modal-title" className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-purple-400" />
                Quyết toán HĐ #{contract.code}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeInfo.color}`}>
                {badgeInfo.tag}
              </span>
            </div>
            <p className="text-[11px] text-purple-200 flex items-center gap-2">
              <span>{contract.customerName}</span>
              <span>•</span>
              <span className="font-mono font-medium text-purple-100">Ô {contract.storageUnitCode} ({contract.unitTypeName})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KHỐI 2: NỘI DUNG VÀ BẢNG HẠCH TOÁN */}
        <div className="p-5 space-y-3.5 overflow-y-auto">
          {fetchingPreview ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center bg-purple-50/40 rounded-xl border border-purple-100">
              <RefreshCw className="w-7 h-7 text-purple-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-800">Đang đối soát & nạp dữ liệu quyết toán...</p>
              <p className="text-[11px] text-slate-500">Hệ thống đang truy xuất bảng tính hoàn cọc, tiền thuê và phụ phí từ máy chủ</p>
            </div>
          ) : error && !preview ? (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2.5">
              <div className="flex items-center justify-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <p className="text-[11px] text-rose-600/80">Không thể tính toán chi phí quyết toán do gặp sự cố kết nối.</p>
              <button
                type="button"
                onClick={() => contract && fetchPreviewData(contract.id)}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-white hover:bg-rose-600 border border-rose-300 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử tải lại bảng quyết toán
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* BẢNG ĐỐI SOÁT TÀI CHÍNH TOÀN NĂNG (UNIVERSAL LEDGER) */}
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <h4 className="font-bold text-purple-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    {badgeInfo.title}
                  </h4>
                  {!showExtraCostInput && settlementType !== 'REJECTED_CHECKIN' && settlementType !== 'CANCELLED_CHECKIN' && (
                    <button
                      type="button"
                      onClick={() => setShowExtraCostInput(true)}
                      className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Thêm chi phí phát sinh
                    </button>
                  )}
                </div>

                {/* 1. NGUỒN TIỀN HOÀN KHẢ DỤNG */}
                {settlementType === 'EARLY_RETURN' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                      <span>1. Tiền thuê ngày chưa sử dụng ({unusedDays > 0 ? `${unusedDays} ngày` : 'phần chưa dùng'}):</span>
                      <span className="font-mono font-bold text-emerald-700">+{earlyRentRefund.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-slate-500 px-1 text-[11px]">
                      <span>2. Phạt vi phạm trả kho sớm (Phạt 100% Cọc bù phòng trống):</span>
                      <span className="font-mono font-semibold line-through text-slate-400">+{originalDeposit.toLocaleString('vi-VN')} đ (0 đ hoàn)</span>
                    </div>
                  </div>
                )}

                {settlementType === 'NORMAL' && (
                  <div className="flex justify-between text-slate-800 bg-blue-50/70 p-2 rounded-lg border border-blue-200 font-medium">
                    <span>1. Tiền cọc ban đầu được bảo toàn (100%):</span>
                    <span className="font-mono font-bold text-blue-900">+{originalDeposit.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {settlementType === 'REJECTED_CHECKIN' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                      <span>1. Hoàn 100% Tiền thuê đã đóng:</span>
                      <span className="font-mono font-bold text-emerald-700">+{(earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                      <span>2. Hoàn 100% Tiền cọc ban đầu:</span>
                      <span className="font-mono font-bold text-emerald-700">+{originalDeposit.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 italic px-1 pt-0.5">
                      (Miễn trừ toàn bộ chi phí do từ chối bàn giao ở khâu Check-in)
                    </p>
                  </div>
                )}

                {settlementType === 'CANCELLED_CHECKIN' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 font-medium">
                      <span>1. Hoàn 100% Tiền thuê đã thanh toán ({contract.rentalMonths || 1} tháng):</span>
                      <span className="font-mono font-bold text-emerald-700">+{(earlyRentRefund > 0 ? earlyRentRefund : totalRentalFee).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-slate-700 px-1">
                      <span>2. Tiền cọc ban đầu:</span>
                      <span className="font-mono font-semibold text-slate-900">+{originalDeposit.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between px-1">
                      <span className={depositForfeited > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        3. Khấu trừ phí hủy nhận kho (
                        {depositForfeited === 0
                          ? 'Hủy trước ≥ 7 ngày — Không phạt'
                          : depositForfeited >= originalDeposit
                          ? 'Hủy sát giờ < 48h — Phạt 100% cọc'
                          : 'Hủy trước 2 – 6 ngày — Phạt 50% cọc'}
                        ):
                      </span>
                      <span className={`font-mono font-semibold ${depositForfeited > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {depositForfeited > 0 ? `-${depositForfeited.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </span>
                    </div>
                  </div>
                )}

                {settlementType === 'OVERDUE_TERMINATED' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 px-1">
                      <span>1. Tiền cọc ban đầu:</span>
                      <span className="font-mono font-semibold text-slate-900">+{originalDeposit.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-rose-600 px-1">
                      <span>2. Phí quá hạn lũy kế (D+1..D+7 — 55% cọc):</span>
                      <span className="font-mono font-semibold">-{overdueFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="flex justify-between text-rose-600 px-1">
                      <span>3. Phí niêm phong & chuyển về Kho Tổng (45% cọc):</span>
                      <span className="font-mono font-semibold">-{sealingAndImpoundFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-0.5 mt-1">
                      <p>• <strong>Khách chuộc đồ (trong 30 ngày):</strong> Bấm thêm chi phí lưu kho tổng phát sinh.</p>
                      <p>• <strong>Thanh lý ngoại tuyến (&gt; 30 ngày):</strong> Để chi phí phát sinh = 0 đ rồi duyệt chốt HĐ.</p>
                    </div>
                  </div>
                )}

                {/* 2. CÁC KHOẢN KHẤU TRỪ CHUNG NẾU CÓ */}
                {recordedDamage > 0 && settlementType !== 'REJECTED_CHECKIN' && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>Khấu trừ hư hại / vệ sinh (BOM):</span>
                    <span className="font-mono font-semibold">-{recordedDamage.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {unpaidExtras > 0 && settlementType !== 'REJECTED_CHECKIN' && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>Phụ phí dịch vụ chưa thanh toán:</span>
                    <span className="font-mono font-semibold">-{unpaidExtras.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {overdueFee > 0 && settlementType === 'NORMAL' && (
                  <div className="flex justify-between text-rose-600 px-1">
                    <span>Khấu trừ phí quá hạn phát sinh:</span>
                    <span className="font-mono font-semibold">-{overdueFee.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {/* 3. KHUNG NGOẠI LỆ: CHI PHÍ PHÁT SINH */}
                {showExtraCostInput && (
                  <div className="p-2.5 bg-white rounded-lg border border-purple-300 space-y-2 shadow-2xs">
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
                        <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">Số tiền phát sinh (VNĐ)</label>
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
                          className="w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">Lý do / Diễn giải</label>
                        <input
                          type="text"
                          value={additionalCostReason}
                          onChange={(e) => setAdditionalCostReason(e.target.value)}
                          placeholder="VD: Lưu Kho Tổng 10 ngày..."
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CARD CHỐT SỔ TÀI CHÍNH NỔI BẬT */}
                <div
                  className={`mt-2 p-3 rounded-xl border flex items-center justify-between font-bold shadow-2xs transition-all ${
                    payableAmount > 0
                      ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                      : netRefund > 0
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                      : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs block">
                      {payableAmount > 0
                        ? 'Khách nộp bổ sung cho cơ sở:'
                        : netRefund > 0
                        ? 'Cơ sở thực hoàn trả khách hàng:'
                        : 'Tất toán công nợ:'}
                    </span>
                    <span className="text-[10px] font-normal opacity-80 block">
                      {payableAmount > 0
                        ? isCashCollected
                          ? 'Đã đối soát & thu đủ tiền mặt/chuyển khoản trước khi đóng HĐ'
                          : 'Hệ thống sẽ ghi nhận công nợ và mở cổng VietQR cho khách thanh toán online'
                        : netRefund > 0
                        ? 'Hoàn trả về tài khoản gốc của khách hàng trong 7 ngày'
                        : 'Công nợ cân bằng 0đ, đủ điều kiện đóng hợp đồng ngay'}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-base tracking-tight shrink-0 pl-2 ${
                      payableAmount > 0
                        ? 'text-rose-600'
                        : netRefund > 0
                        ? 'text-emerald-700'
                        : 'text-slate-700'
                    }`}
                  >
                    {payableAmount > 0
                      ? `+${payableAmount.toLocaleString('vi-VN')} đ`
                      : `${netRefund.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
              </div>

              {/* KHỐI 3: GHI CHÚ ĐỐI SOÁT & CHỨNG TỪ */}
              <div>
                {payableAmount > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mb-3">
                    <span className="text-xs font-bold text-amber-900 block">
                      Hình thức thu khoản nộp bù (+{payableAmount.toLocaleString('vi-VN')} đ):
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="collectionMethod"
                          checked={isCashCollected}
                          onChange={() => setIsCashCollected(true)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span>Đã thu tiền mặt / chuyển khoản trực tiếp tại quầy <strong>(Đóng HĐ ngay)</strong></span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="collectionMethod"
                          checked={!isCashCollected}
                          onChange={() => setIsCashCollected(false)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span>Khách sẽ quét mã VietQR tự thanh toán online <strong>(Đóng HĐ sau khi thanh toán)</strong></span>
                      </label>
                    </div>
                  </div>
                )}

                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ghi chú đối soát & Thông tin thanh toán thực tế
                </label>
                <input
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* KHỐI 4: FOOTER CTA DỨT KHOÁT 1-CLICK */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
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
            disabled={loading || fetchingPreview || preview == null}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer ${
              payableAmount > 0
                ? isCashCollected
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {payableAmount > 0 && !isCashCollected
                  ? 'Đang chốt công nợ & mở cổng QR...'
                  : 'Đang xử lý đóng hợp đồng...'}
              </span>
            ) : fetchingPreview ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang nạp bảng tính...
              </span>
            ) : payableAmount > 0 ? (
              isCashCollected
                ? `Xác nhận đã thu đủ ${payableAmount.toLocaleString('vi-VN')} đ & Đóng HĐ`
                : `Chốt công nợ & Mở cổng thanh toán QR (+${payableAmount.toLocaleString('vi-VN')} đ)`
            ) : netRefund > 0 ? (
              `Xác nhận đã hoàn ${netRefund.toLocaleString('vi-VN')} đ & Đóng HĐ`
            ) : (
              'Chốt tất toán & Đóng hợp đồng'
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
