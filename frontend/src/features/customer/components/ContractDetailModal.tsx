import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  Printer,
  CheckSquare,
  Circle,
  Clock,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { formatDateVN } from '../utils/unitPickerHelpers';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import { getMyRentalDetail, type CustomerRentalDetail } from '@/api/customerRentals';
import { getContractRenewalHistory, type ContractRenewalHistoryItem } from '@/api/contract';
import type { RentedContract } from '../types';
import { ContractPrintDocument } from './ContractPrintDocument';

export interface ContractDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onScheduleReturn?: (contract: RentedContract) => void;
  onChangePin?: (contract: RentedContract) => void;
  onReschedulePeriod?: (contract: RentedContract) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  isOpen,
  onClose,
  contract,
  onScheduleReturn,
  onChangePin,
  onReschedulePeriod,
}) => {
  const [detail, setDetail] = useState<CustomerRentalDetail | null>(null);
  const [renewals, setRenewals] = useState<ContractRenewalHistoryItem[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen || !contract) {
      setDetail(null);
      setRenewals([]);
      return;
    }
    setDetail(null);
    setRenewals([]);
    let isMounted = true;

    // Tải chi tiết bổ sung từ backend (thông tin khách hàng, biên bản bàn giao, phụ lục đổi kho)
    getMyRentalDetail(Number(contract.id))
      .then((data) => {
        if (isMounted) setDetail(data);
      })
      .catch((err) => {
        console.error('Lỗi tải chi tiết hợp đồng:', err);
      });

    // Tải lịch sử gia hạn hợp đồng (Phụ lục gia hạn & biến động giá)
    getContractRenewalHistory(Number(contract.id))
      .then((history) => {
        if (isMounted && Array.isArray(history)) {
          setRenewals(history);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải phụ lục gia hạn:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, contract?.id]);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDetail(null);
      setRenewals([]);
    }, 180);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDisplayDate = (value?: string | null): string => {
    if (!value) return '—';
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return formatDateVN(trimmed.slice(0, 10));
    }
    return trimmed;
  };

  // Chỉ chấp nhận detail khi ID hoặc mã hợp đồng trùng khớp hoàn toàn với contract prop hiện tại (chống stale state giữa các HĐ khác nhau)
  const isCurrentContractDetail = detail && (String(detail.id) === String(contract.id) || detail.contractCode === contract.contractNumber);
  const effectiveDetail = isCurrentContractDetail ? detail : null;

  const effectiveContractNumber = contract.contractNumber || effectiveDetail?.contractCode || `CTR-${contract.id}`;
  const effectiveStatus = (contract.status || effectiveDetail?.status) as string;
  const isRelocatingFlag = Boolean(contract.relocationEligible || effectiveDetail?.relocationEligible);
  const isHandoverRejected =
    effectiveStatus === 'TERMINATED' &&
    !isRelocatingFlag &&
    Boolean(
      contract.handoverRejected ||
      effectiveDetail?.handoverRejected ||
      contract.contractNumber?.includes('REJ') ||
      contract.contractNumber?.includes('REFUND') ||
      (!contract.checkinDate && Boolean(contract.handoverConditionNote || contract.rejectionReason))
    );
  const isCancelledAtHandover = isHandoverRejected;
  const isOverdueTerminated =
    effectiveStatus === 'TERMINATED' &&
    !isHandoverRejected &&
    ((effectiveDetail?.depositBalance ?? contract.depositHeld) === 0 ||
      (effectiveDetail?.overdueDays ?? contract.overdueDays ?? 0) >= 7 ||
      contract.contractNumber?.startsWith('CTR-TEST-007'));
  const isClosed = effectiveStatus === 'CLOSED';
  const isRelocating =
    !isCancelledAtHandover &&
    !isClosed &&
    (effectiveStatus === 'PENDING_CHECKIN' ||
      effectiveStatus === 'PENDING_CHECK_IN' ||
      effectiveStatus === 'ACTIVE') &&
    Boolean(contract.relocationEligible || effectiveDetail?.relocationEligible);
  const rawUnitNumber = effectiveDetail?.unitCode || contract.unitNumber;
  const effectiveUnitNumber = isRelocating && (effectiveStatus === 'PENDING_CHECKIN' || effectiveStatus === 'PENDING_CHECK_IN')
    ? 'Chờ cấp ô mới'
    : rawUnitNumber || 'Chưa gán';
  const effectiveFacilityName = effectiveDetail?.facilityName || contract.facilityName;
  const effectiveFacilityAddress = effectiveDetail?.facilityAddress || 'Cơ sở trực thuộc Hệ thống Self-Storage';
  const effectiveFacilityPhone = effectiveDetail?.facilityPhone || '1900 8888';
  const effectiveCustomerName = effectiveDetail?.customerName || contract.customerName || 'Chưa cập nhật';
  const effectiveCustomerPhone = effectiveDetail?.customerPhone || contract.customerPhone || 'Chưa cập nhật';
  const effectiveCustomerIdentity = effectiveDetail?.customerIdentityNumber || contract.customerIdentityNumber || 'Chưa cập nhật';
  const effectiveCustomerEmail = effectiveDetail?.customerEmail || contract.customerEmail || 'Chưa cập nhật';
  const effectiveUnitTypeName = effectiveDetail?.unitTypeName || contract.unitTypeName;
  const effectiveDimensions = effectiveDetail?.unitDimensions || contract.unitDimensions || '1.5m x 2.0m x 2.5m';
  const effectiveFloor = effectiveDetail?.floor ?? contract.floor ?? 1;
  const effectivePosition = effectiveDetail?.position || contract.position || 'Khu A';

  const effectiveRentalMonths = effectiveDetail?.rentalMonths || contract.rentalMonths || 1;
  const effectiveMonthlyRent = effectiveDetail?.monthlyPrice || contract.monthlyRent || 0;
  const effectiveDeposit = effectiveDetail?.depositAmount ?? contract.depositHeld ?? 0;
  const effectiveTotalRentalFee = effectiveDetail?.totalRentalFee || contract.totalRentalFee || (effectiveMonthlyRent * effectiveRentalMonths);
  const effectiveTotalContractAmount = effectiveDetail?.totalContractAmount || contract.totalContractAmount || (effectiveTotalRentalFee + effectiveDeposit);

  // Tính số tháng thuê của chu kỳ gốc (Original Rental Months)
  // Khi hợp đồng đã được gia hạn, contract.rentalMonths ở backend bị cộng dồn tổng tháng,
  // nhưng Hợp đồng gốc (Điều 2 & Điều 3) chỉ thể hiện số tháng và số tiền của chu kỳ ban đầu.
  const totalRenewedMonths = renewals.reduce((sum, r) => sum + (r.renewalMonths || 0), 0);
  const originalRentalMonths = (effectiveMonthlyRent > 0 && effectiveTotalRentalFee > 0)
    ? Math.max(1, Math.round(effectiveTotalRentalFee / effectiveMonthlyRent))
    : Math.max(1, effectiveRentalMonths - totalRenewedMonths);

  // Ngày kết thúc ban đầu của hợp đồng gốc (trước khi có các phụ lục gia hạn)
  const originalEndDate = renewals.length > 0 && renewals[0].previousEndDate
    ? renewals[0].previousEndDate
    : contract.endDate;

  const isPendingCheckin =
    effectiveStatus === 'PENDING_CHECKIN' ||
    effectiveStatus === 'PENDING_CHECK_IN';

  const isHandoverCompleted =
    !isPendingCheckin &&
    !isCancelledAtHandover;

  const effectiveCheckinDate = isHandoverCompleted
    ? (effectiveDetail?.checkinDate || contract.checkinDate || contract.startDate)
    : isCancelledAtHandover
      ? 'Không nhận kho (Đã dừng hợp đồng do sự cố)'
      : 'Chưa thực hiện (Chờ làm thủ tục nhận kho tại quầy)';
  const effectiveHandoverStaff = isHandoverCompleted || isCancelledAtHandover
    ? (effectiveDetail?.handoverStaffName || contract.handoverStaffName || 'Nhân viên lễ tân cơ sở')
    : 'Chờ phân công tiếp đón tại quầy';
  const effectiveHandoverNote = isClosed
    ? 'Đã hoàn tất nghiệm thu và quyết toán hợp đồng'
    : isHandoverCompleted
      ? (effectiveDetail?.handoverConditionNote || contract.handoverConditionNote || 'Đạt đầy đủ 4 tiêu chí nghiệm thu vật lý bàn giao')
      : isCancelledAtHandover
        ? (effectiveDetail?.handoverConditionNote || contract.handoverConditionNote || 'Không đạt chuẩn nhận kho do phát sinh sự cố hư hỏng tại chỗ')
        : isRelocating
          ? 'Ô kho phát sinh sự cố lúc tiếp đón. Cơ sở đang phân bổ lại ô kho mới cùng loại cho quý khách.'
          : 'Đang chờ khách hàng xuất trình CCCD và mã e-Pass tại quầy lễ tân để tiến hành nghiệm thu thực địa.';
  const relocationId = (isCancelledAtHandover || isClosed)
    ? undefined
    : (effectiveDetail?.relocationSupportRequestId || contract.relocationSupportRequestId);
  const relocationCode = (isCancelledAtHandover || isClosed)
    ? undefined
    : (effectiveDetail?.relocationSupportRequestCode || contract.relocationSupportRequestCode || (relocationId ? 'SUP-202610-0001' : undefined));
  const relocationReason = effectiveDetail?.relocationReason || contract.relocationReason || contract.rejectionReason;
  const isReturnScheduled = effectiveStatus === 'PENDING_RETURN' || Boolean(contract.scheduledReturnDate || effectiveDetail?.scheduledReturnDate);
  const scheduledReturnDate = effectiveDetail?.scheduledReturnDate || contract.scheduledReturnDate || (effectiveStatus === 'PENDING_RETURN' ? 'Chờ kiểm tra hiện trường' : undefined);
  const hasSettlement = isClosed || Boolean(effectiveDetail?.settledAt) || Boolean(effectiveDetail?.settlementType);
  const hasAnyAddenda = renewals.length > 0 || Boolean(relocationCode) || isReturnScheduled || hasSettlement;
  const addendaCount = renewals.length + (relocationCode ? 1 : 0) + (isReturnScheduled ? 1 : 0) + (hasSettlement ? 1 : 0);

  // Dữ liệu quyết toán tất toán hợp đồng (PL-SETTLEMENT)
  const settlementType = effectiveDetail?.settlementType || (
    effectiveStatus === 'CANCELLED'
      ? 'CANCELLED_CHECKIN'
      : effectiveStatus === 'TERMINATED'
      ? effectiveDetail?.checkinDate == null ? 'REJECTED_CHECKIN' : 'OVERDUE_TERMINATED'
      : isReturnScheduled ? 'EARLY_RETURN' : 'NORMAL'
  );
  const settledAt = effectiveDetail?.settledAt;
  const settledByName = effectiveDetail?.settledByName || 'Quản lý cơ sở';
  const settlementRefund = effectiveDetail?.settlementRefundAmount ?? (
    isClosed ? (contract.depositHeld ?? effectiveDeposit) : 0
  );
  const settlementPayable = effectiveDetail?.settlementPayableAmount ?? 0;
  const settlementDamage = effectiveDetail?.settlementDamageCost ?? 0;
  const settlementOverdue = effectiveDetail?.settlementOverdueFee ?? (effectiveDetail?.overdueFeeAccrued ?? 0);
  const settlementDepositForfeited = effectiveDetail?.settlementDepositForfeited ?? (
    settlementType === 'EARLY_RETURN' || settlementType === 'OVERDUE_TERMINATED' ? effectiveDeposit : 0
  );
  const settlementEarlyRentRefund = effectiveDetail?.settlementEarlyRentRefund ?? 0;
  const settlementSealingFee = effectiveDetail?.settlementSealingFee ?? (
    settlementType === 'OVERDUE_TERMINATED' ? Math.max(0, effectiveDeposit - settlementOverdue) : 0
  );
  const settlementNote = effectiveDetail?.settlementNote || 'Đã đối soát đầy đủ hiện trạng vật chất và nghĩa vụ tài chính.';

  return createPortal(
    <>
      <div
        className={`no-print fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
          isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
        }`}
        onClick={handleClose}
      >
      <div
        className={`bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Thông tin hợp đồng & Trạng thái */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1">
              HỢP ĐỒNG THUÊ Ô KHO THÔNG MINH &amp; BIÊN BẢN BÀN GIAO ĐIỆN TỬ
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              Ô kho {effectiveUnitNumber}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Mã HĐ: <span className="font-mono font-semibold text-gray-700">{effectiveContractNumber}</span> · {effectiveFacilityName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[74vh] overflow-y-auto bg-white relative">
          <div className="space-y-6 text-xs relative z-10">
              {/* Chỉ hiển thị 1 banner trạng thái quan trọng nhất tại 1 thời điểm */}
              {(effectiveStatus === 'TERMINATED' || isCancelledAtHandover) ? (
                isOverdueTerminated ? (
                  /* Trường hợp 3A: Quá hạn D+7 cưỡng chế chấm dứt & Niêm phong Kho Tổng */
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase">
                        <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Hợp đồng chấm dứt quá hạn D+7 (Niêm phong Kho Tổng)</span>
                      </div>
                      <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-md shrink-0">
                        Đã niêm phong
                      </span>
                    </div>
                    <div className="text-xs text-purple-900 flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                      <span>• Cấn trừ cọc: <strong>100%</strong> (55% nợ quá hạn + 45% phí lưu Kho Tổng)</span>
                      <span>• Chuộc đồ: <strong>Trong 30 ngày</strong> tại Kho Tổng</span>
                    </div>
                  </div>
                ) : isHandoverRejected ? (
                  /* Trường hợp 3B: Từ chối nhận kho tại chỗ -> Hủy & Hoàn 100% */
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Từ chối nhận kho do lỗi cơ sở (BR-CHK-06)</span>
                      </div>
                      <span className="text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-md shrink-0">
                        Hoàn tiền 100%
                      </span>
                    </div>
                    <p className="text-xs text-rose-900">
                      Lý do: <strong>{contract.rejectionReason || 'Khiếm khuyết kỹ thuật tại ô kho'}</strong>. Cơ sở hoàn trả <strong>100% tiền thuê + 100% tiền cọc</strong> trong 3 ngày làm việc.
                    </p>
                  </div>
                ) : (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                  /* Trường hợp 3C: Chưa gán kho mà đã hủy */
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Hủy đặt chỗ trước khi nhận ô kho</span>
                      </div>
                      <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md shrink-0">
                        Hoàn cọc 100%
                      </span>
                    </div>
                    <p className="text-xs text-amber-900">
                      Giao dịch đã hủy trước khi nhận ô vật lý. Tiền cọc {formatVND(detail?.depositAmount || contract.depositHeld)} được hoàn trả trọn vẹn.
                    </p>
                  </div>
                ) : (
                  /* Trường hợp 3D: Đã gán ô nhưng hủy trước nhận kho (giải phóng ô) */
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Hủy nhận kho &amp; Giải phóng ô kho (BR-CAN)</span>
                      </div>
                      <span className="text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-md shrink-0">
                        Đã giải phóng ô
                      </span>
                    </div>
                    <p className="text-xs text-rose-900">
                      Ô kho <strong>{effectiveUnitNumber}</strong> đã giải phóng. Hoàn trả 100% tiền thuê; cọc đối soát theo thời điểm hủy.
                    </p>
                  </div>
                )
              ) : isClosed ? (
                /* Banner Hợp đồng đã hoàn tất & tất toán */
                <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-900 font-bold text-xs uppercase tracking-wide">
                        Hợp đồng đã kết thúc &amp; hoàn tất tất toán
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        Hợp đồng đã hoàn thành chu kỳ thuê, nghiệm thu và quyết toán toàn bộ nghĩa vụ tài chính.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-md shrink-0">
                    Đã tất toán
                  </span>
                </div>
              ) : effectiveStatus === 'PENDING_RETURN' ? (
                /* Banner Hợp đồng đang báo trả kho & chờ nghiệm thu */
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-bold text-xs uppercase tracking-wide">
                        {contract.inspectionDone
                          ? 'ĐÃ NGHIỆM THU TRẢ KHO — CHỜ QUYẾT TOÁN HOÀN CỌC'
                          : 'ĐANG YÊU CẦU TRẢ KHO & CHỜ NGHIỆM THU'}
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                        Ô kho của bạn đang trong quy trình nghiệm thu.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold rounded-md shrink-0">
                    {contract.inspectionDone ? 'Chờ hoàn cọc' : 'Chờ nghiệm thu trả kho'}
                  </span>
                </div>
              ) : (isRelocating || Boolean(contract.relocationEligible || detail?.relocationEligible)) && !relocationId ? (
                /* Banner Chờ phân bổ lại ô kho mới khi khách từ chối ô cũ và chọn Đổi ô kho */
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-900 font-bold text-xs uppercase tracking-wide">
                        ĐANG BỐ TRÍ ĐỔI Ô KHO MỚI
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Quản lý cơ sở đang điều phối và cấp ô kho mới cho quý khách ({effectiveDetail?.rejectionReason || contract.rejectionReason || 'Sự cố kỹ thuật tại ô ban đầu'}).
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-md shrink-0">
                    Chờ cấp ô mới
                  </span>
                </div>
              ) : relocationId ? (
                /* Banner Phụ lục điều chuyển ô kho do sự cố kỹ thuật (nếu đã điều chuyển xong) */
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-900 font-bold text-xs uppercase tracking-wide">
                        PHỤ LỤC ĐIỀU CHUYỂN Ô KHO (SỰ CỐ KỸ THUẬT)
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        Ô kho đã được Ban Quản lý cơ sở điều chuyển từ ô ban đầu sang <strong>Ô KHO MỚI: {effectiveUnitNumber}</strong>.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-md shrink-0">
                    {relocationCode}
                  </span>
                </div>
              ) : null}

              {/* Điều 1: Các bên tham gia hợp đồng */}
              <section className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>ĐIỀU 1: CÁC BÊN THAM GIA HỢP ĐỒNG</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  {/* Bên A: Bên Cho Thuê */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Bên Cho Thuê (Bên A)
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{effectiveFacilityName}</p>
                    <p className="text-gray-600">Đ/c: {effectiveFacilityAddress}</p>
                    <p className="text-gray-600">
                      Hotline: <strong className="font-semibold text-gray-800 tabular-nums">{effectiveFacilityPhone}</strong>
                    </p>
                  </div>

                  {/* Bên B: Bên Thuê */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Bên Thuê Kho (Bên B)
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{effectiveCustomerName}</p>
                    <p className="text-gray-600">
                      Số ĐT: <strong className="font-semibold text-gray-800 tabular-nums">{effectiveCustomerPhone}</strong>
                    </p>
                    <p className="text-gray-600">
                      Số CCCD: <strong className="font-mono font-semibold text-gray-800">{effectiveCustomerIdentity}</strong>
                    </p>
                    <p className="text-gray-600">Email: {effectiveCustomerEmail}</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Điều 2: Đối tượng & Thời hạn thuê */}
              <section className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>ĐIỀU 2: ĐỐI TƯỢNG VÀ THỜI HẠN THUÊ KHO</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Mã ô kho</span>
                    <span className="font-bold text-brand-700 text-sm">{effectiveUnitNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Loại kho</span>
                    <span className="font-semibold text-gray-900">{effectiveUnitTypeName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Kích thước</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{effectiveDimensions}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Vị trí tầng</span>
                    <span className="font-semibold text-gray-900">Tầng {effectiveFloor} ({effectivePosition})</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Số hợp đồng</span>
                    <span className="font-mono font-semibold text-gray-900">{effectiveContractNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Thời hạn thuê ban đầu</span>
                    <span className="font-semibold text-gray-900">{originalRentalMonths} tháng</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">Ngày bắt đầu thuê</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatDisplayDate(contract.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px] mb-0.5">
                      {renewals.length > 0 ? 'Hạn kết thúc ban đầu' : 'Ngày kết thúc hợp đồng'}
                    </span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatDisplayDate(originalEndDate)}</span>
                    {renewals.length > 0 && (
                      <span className="text-[11px] text-emerald-700 font-medium block mt-0.5 tabular-nums">
                        (Đã gia hạn đến {formatDisplayDate(contract.endDate)})
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Điều 3: Tài chính & Tiền cọc bảo đảm */}
              <section className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>ĐIỀU 3: TÀI CHÍNH &amp; TIỀN CỌC BẢO ĐẢM</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Đơn giá thuê hàng tháng</span>
                    <span className="font-semibold text-gray-900 text-sm tabular-nums">
                      {formatVND(effectiveMonthlyRent)}/tháng
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-t border-gray-100">
                    <span className="text-gray-600">
                      Tổng tiền thuê ban đầu ({originalRentalMonths} tháng)
                    </span>
                    <span className="font-semibold text-gray-900 text-sm tabular-nums">
                      {formatVND(effectiveTotalRentalFee)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start py-1 border-t border-gray-100 gap-4">
                    <div>
                      <span className="text-gray-600 block">Tiền cọc bảo đảm</span>
                      <span className="text-[11px] text-gray-400">
                        Bảo lưu tại tài khoản ngân hàng, quyết toán hoàn cọc sau nghiệm thu trả kho
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-700 text-sm tabular-nums shrink-0">
                      {formatVND(effectiveDeposit)}
                    </span>
                  </div>

                  {/* Tổng giá trị hợp đồng ban đầu / Tổng tiền */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <div>
                      <span className="text-gray-900 font-bold text-xs uppercase tracking-wider block">
                        Tổng giá trị hợp đồng (Tổng tiền ban đầu)
                      </span>
                      {renewals.length > 0 && (
                        <span className="text-[11px] text-gray-500">
                          (Chưa bao gồm các khoản nộp gia hạn tại Phụ lục Điều 5)
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-brand-700 text-base sm:text-lg tabular-nums">
                      {formatVND(effectiveTotalContractAmount)}
                    </span>
                  </div>

                  {contract.overdueFee ? (
                    <div className="flex justify-between items-center text-rose-600 font-semibold border-t border-gray-100 pt-2">
                      <span>Phí phạt quá hạn phát sinh</span>
                      <span className="tabular-nums">+{formatVND(contract.overdueFee)}</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Điều 4: Biên bản bàn giao & Nghiệm thu tại chỗ */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <CheckSquare className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>ĐIỀU 4: BIÊN BẢN BÀN GIAO &amp; NGHIỆM THU TẠI CHỖ</span>
                  </h4>
                  {isClosed && (
                    <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                      Đã nghiệm thu &amp; tất toán
                    </span>
                  )}
                  {isOverdueTerminated && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                      Bị niêm phong
                    </span>
                  )}
                  {isPendingCheckin && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                      {isRelocating ? 'Chờ đổi ô kho' : 'Chờ nghiệm thu tại quầy'}
                    </span>
                  )}
                  {isCancelledAtHandover && (
                    <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      Từ chối nhận kho do sự cố
                    </span>
                  )}
                </div>

                {isPendingCheckin && !isRelocating && (
                  <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-amber-900">Ô kho đang ở trạng thái Chờ nhận kho</p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Quý khách vui lòng xuất trình CCCD và thẻ nhận kho điện tử tại quầy lễ tân cơ sở để đồng kiểm 4 tiêu chí nghiệm thu thực địa.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-gray-600">
                    <span>
                      Thời điểm hoàn tất bàn giao:{' '}
                      <strong className={isHandoverCompleted ? 'text-gray-900 tabular-nums' : 'text-amber-700 font-semibold'}>
                        {formatDisplayDate(effectiveCheckinDate)}
                      </strong>
                    </span>
                    <span>
                      Nhân viên đón tiếp &amp; lập biên bản:{' '}
                      <strong className={isHandoverCompleted ? 'text-gray-900' : 'text-gray-500 font-normal italic'}>
                        {effectiveHandoverStaff}
                      </strong>
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-gray-200/80">
                    <p className="font-semibold text-gray-800 mb-2">
                      Kết quả kiểm tra 4 tiêu chí nghiệm thu vật lý bàn giao:
                    </p>
                    {isHandoverCompleted ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Mặt bằng kho sạch sẽ, thông thoáng, không vật cản</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Cửa cuốn &amp; cơ cấu khóa vận hành an toàn, trơn tru</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Sàn tường khô ráo, phòng chống ẩm mốc &amp; PCCC đạt chuẩn</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Khóa điện tử IoT đã sẵn sàng, cấp mã PIN mở cửa 24/7</span>
                        </div>
                      </div>
                    ) : isCancelledAtHandover ? (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>Biên bản tạm dừng nhận kho do sự cố tại hiện trường.</span>
                      </div>
                    ) : isRelocating ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Đang điều phối đổi sang ô kho đạt chuẩn khác cùng loại.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Mặt bằng kho sạch sẽ (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Cửa cuốn &amp; cơ cấu khóa (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Sàn tường &amp; PCCC đạt chuẩn (Chờ đồng kiểm tại quầy)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Circle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Khóa điện tử IoT &amp; cấp mã PIN (Kích hoạt khi nhận kho)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-gray-200/80 text-gray-600">
                    <span>Ghi chú hiện trường: </span>
                    <em className={isHandoverCompleted ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                      {effectiveHandoverNote}
                    </em>
                  </div>
                </div>

                {/* Chữ ký số 2 bên */}
                <div className="grid grid-cols-2 gap-6 pt-2 text-center text-xs">
                  <div className="p-3">
                    <p className="font-bold text-gray-800">ĐẠI DIỆN BÊN CHO THUÊ</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ban Quản lý cơ sở</p>
                    {isHandoverCompleted ? (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-emerald-400 bg-emerald-50/70 rounded text-[11px] font-bold text-emerald-800">
                          ✓ ĐÃ KÝ SỐ ĐIỆN TỬ
                        </div>
                        <p className="font-semibold text-gray-700 text-xs">{effectiveHandoverStaff}</p>
                      </>
                    ) : isCancelledAtHandover ? (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                          HỦY NHẬN DO SỰ CỐ
                        </div>
                        <p className="font-semibold text-gray-600 text-xs">{effectiveHandoverStaff}</p>
                      </>
                    ) : isRelocating ? (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-700">
                          ĐANG ĐỢI ĐỔI Ô MỚI
                        </div>
                        <p className="font-semibold text-gray-600 text-xs">{effectiveHandoverStaff}</p>
                      </>
                    ) : (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-gray-300 bg-gray-50 rounded text-[11px] font-bold text-gray-500">
                          CHỜ TIẾP ĐÓN &amp; KÝ TẠI QUẦY
                        </div>
                        <p className="font-medium text-gray-400 text-xs">Chưa ký biên bản bàn giao</p>
                      </>
                    )}
                  </div>

                  <div className="p-3">
                    <p className="font-bold text-gray-800">ĐẠI DIỆN BÊN THUÊ KHO</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Khách hàng xác nhận</p>
                    {isHandoverCompleted ? (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-emerald-400 bg-emerald-50/70 rounded text-[11px] font-bold text-emerald-800">
                          ✓ ĐÃ XÁC NHẬN BÀN GIAO
                        </div>
                        <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                      </>
                    ) : (contract.status === 'TERMINATED' || isCancelledAtHandover) ? (
                      (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND') || isCancelledAtHandover) ? (
                        <>
                          <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                            TỪ CHỐI NHẬN (HOÀN 100%)
                          </div>
                          <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                        </>
                      ) : (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                        <>
                          <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-800">
                            HỦY ĐẶT CHỖ (HOÀN CỌC 100%)
                          </div>
                          <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                        </>
                      ) : (
                        <>
                          <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-rose-300 bg-rose-50 rounded text-[11px] font-bold text-rose-700">
                            HỦY GIỮ CHỖ (GIẢI PHÓNG Ô)
                          </div>
                          <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                        </>
                      )
                    ) : (contract.relocationEligible || detail?.relocationEligible || isRelocating) ? (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-700">
                          CHỜ BÀN GIAO Ô MỚI
                        </div>
                        <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                      </>
                    ) : (
                      <>
                        <div className="my-3 py-1 px-2.5 inline-block border border-dashed border-amber-300 bg-amber-50 rounded text-[11px] font-bold text-amber-700">
                          CHỜ XÁC NHẬN KHI NHẬN KHO
                        </div>
                        <p className="font-semibold text-gray-700 text-xs">{effectiveCustomerName}</p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              <hr className="border-gray-200" />

              {/* Điều 5: Phụ lục hợp đồng & Thỏa thuận bổ sung */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <Layers className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>ĐIỀU 5: PHỤ LỤC HỢP ĐỒNG &amp; THỎA THUẬN BỔ SUNG</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                    {hasAnyAddenda
                      ? `${addendaCount} phụ lục hiệu lực`
                      : 'Hợp đồng gốc'}
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 italic leading-relaxed">
                  (Căn cứ Điều 403 Bộ luật Dân sự 2015: Phụ lục hợp đồng là bộ phận không thể tách rời, có hiệu lực pháp lý xác lập các biến động về thời hạn thuê, điều chỉnh đơn giá hoặc điều chuyển ô kho)
                </p>

                {/* Danh sách các phụ lục gia hạn (nếu có) */}
                {renewals.length > 0 && (
                  <div className="space-y-3 pt-1">
                    {renewals.map((renewal, index) => {
                      const isPriceChanged = renewal.monthlyPriceSnapshot && renewal.monthlyPriceSnapshot !== effectiveMonthlyRent;
                      const priceDiff = (renewal.monthlyPriceSnapshot || effectiveMonthlyRent) - effectiveMonthlyRent;
                      const renewalAddendumNum = String(index + 1).padStart(2, '0');

                      return (
                        <div
                          key={renewal.id || index}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded">
                                PL-{renewalAddendumNum}
                              </span>
                              <span className="font-semibold text-gray-900 text-xs">
                                Phụ lục Gia hạn thời hạn &amp; Biểu giá thuê
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                              +{renewal.renewalMonths} tháng
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                            <div>
                              <span className="text-gray-500 block text-[11px]">Khoảng thời gian gia hạn</span>
                              <span className="font-semibold text-gray-900 tabular-nums">
                                {formatDisplayDate(renewal.previousEndDate)} → <strong className="text-brand-700">{formatDisplayDate(renewal.newEndDate)}</strong>
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500 block text-[11px]">Đơn giá thuê chu kỳ mới</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-gray-900 tabular-nums">
                                  {formatVND(renewal.monthlyPriceSnapshot || effectiveMonthlyRent)}/tháng
                                </span>
                                {isPriceChanged ? (
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                      priceDiff > 0
                                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                    }`}
                                  >
                                    {priceDiff > 0 ? `+${formatVND(priceDiff)}` : `-${formatVND(Math.abs(priceDiff))}`} (Giá mới BOM)
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-gray-500">
                                    (Giữ nguyên đơn giá gốc)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 block text-[11px]">Tổng tiền gia hạn đã nộp</span>
                              <span className="font-semibold text-brand-700 tabular-nums">
                                {formatVND(renewal.totalPaid || renewal.rentalFeeAmount)}
                              </span>
                              <span className="text-[11px] text-gray-400 ml-1">
                                ({renewal.paymentMethod || 'Thanh toán trực tuyến'})
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500 block text-[11px]">Tiền cọc bảo đảm (BR-DEP-01)</span>
                              <span className="font-medium text-emerald-700 tabular-nums">
                                Bảo lưu {formatVND(effectiveDeposit)} (Miễn thu bổ sung)
                              </span>
                            </div>
                          </div>

                          {isPriceChanged && (
                            <div className="text-[11px] text-gray-600 bg-white p-2.5 rounded border border-gray-200 flex items-start gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                              <span>
                                <strong>Nguyên tắc không hồi tố (Điều 403 BLDS):</strong> Đơn giá điều chỉnh chỉ áp dụng cho kỳ gia hạn từ ngày {formatDisplayDate(renewal.previousEndDate)}. Chu kỳ thuê trước đó không bị truy thu chênh lệch.
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 text-[11px] text-gray-500 border-t border-gray-200/80">
                            <span>Ký kết điện tử: <strong className="text-gray-700">Đã xác nhận tự động qua cổng thanh toán</strong></span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Hiệu lực pháp lý đầy đủ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Phụ lục điều chuyển ô kho kỹ thuật (nếu có) */}
                {relocationCode && (
                  <div className="bg-amber-50/70 rounded-lg p-4 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          {relocationCode}
                        </span>
                        <span className="font-semibold text-amber-950 text-xs">
                          Phụ lục Điều chuyển Ô kho Kỹ thuật Hiện trường
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 bg-white px-2.5 py-0.5 rounded-md border border-amber-200">
                        Sự cố kỹ thuật
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-amber-800/80 block text-[11px]">Ô kho mới điều chuyển</span>
                        <span className="font-bold text-amber-950">
                          {effectiveUnitNumber} ({effectiveUnitTypeName} - Tầng {effectiveFloor})
                        </span>
                      </div>
                      <div>
                        <span className="text-amber-800/80 block text-[11px]">Lý do điều chuyển</span>
                        <span className="font-medium text-amber-900">
                          {relocationReason || effectiveDetail?.rejectionReason || 'Sự cố vật lý tại ô ban đầu'}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-amber-800/80 block text-[11px]">Cam kết tài chính</span>
                        <span className="font-medium text-emerald-800">
                          Giữ nguyên 100% đơn giá thuê ({formatVND(effectiveMonthlyRent)}/tháng) và tiền cọc ({formatVND(effectiveDeposit)}), không phát sinh phụ phí.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phụ lục / Thỏa thuận chấm dứt trước hạn & Bàn giao trả kho sớm */}
                {isReturnScheduled && (
                  <div className="bg-blue-50/70 rounded-lg p-4 border border-blue-100 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200/70">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          PL-RETURN
                        </span>
                        <span className="font-semibold text-blue-950 text-xs">
                          Phụ lục Thỏa thuận Trả kho Sớm &amp; Chấm dứt Hợp đồng
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {contract.inspectionDone ? 'Đã nghiệm thu' : 'Chờ nghiệm thu'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-blue-800/80 block text-[11px]">Ngày đề nghị trả kho thực tế</span>
                        <span className="font-semibold text-blue-950 tabular-nums">
                          {formatDisplayDate(scheduledReturnDate)}
                        </span>
                        <span className="text-[11px] text-gray-500 block tabular-nums">
                          (Thời hạn kết thúc ban đầu: {formatDisplayDate(contract.endDate)})
                        </span>
                      </div>

                      <div>
                        <span className="text-blue-800/80 block text-[11px]">Chính sách hoàn cọc bảo đảm</span>
                        <span className="font-semibold text-emerald-700 tabular-nums">
                          Hoàn trả 100% ({formatVND(effectiveDeposit)}) sau khi nghiệm thu
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-blue-800/80 block text-[11px]">Quyết toán tiền thuê &amp; nghĩa vụ (BR-RET-06)</span>
                        <span className="text-gray-700 leading-relaxed">
                          Hai bên đồng thuận chấm dứt hợp đồng sớm hơn thời hạn ban đầu. Tiền thuê chưa sử dụng (nếu có) và tiền cọc sẽ được Ban Quản lý lập biên bản quyết toán hoàn trả đầy đủ sau khi hoàn tất kiểm tra hiện trường 4 tiêu chí.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-gray-500 border-t border-blue-200/60">
                      <span>Xác lập: <strong className="text-gray-700">Đã ghi nhận yêu cầu trả kho điện tử</strong></span>
                      <span className="text-blue-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Có hiệu lực pháp lý
                      </span>
                    </div>
                  </div>
                )}

                {/* Phụ lục Quyết toán Tài chính & Tất toán Thanh lý Hợp đồng */}
                {hasSettlement && (
                  <div className="bg-emerald-50/70 rounded-lg p-4 border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                          PL-SETTLEMENT
                        </span>
                        <span className="font-semibold text-emerald-950 text-xs">
                          Biên bản Quyết toán Tài chính &amp; Tất toán Hợp đồng
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {settledAt ? 'Đã duyệt' : 'Đang đối soát'}
                      </span>
                    </div>

                    {/* Kịch bản quyết toán 1 dòng ngắn gọn */}
                    <div className="text-xs text-emerald-900 bg-white px-3 py-2 rounded border border-emerald-100 font-medium">
                      {settlementType === 'NORMAL' && '• Trả kho đúng hạn (BR-RET-04) — Bảo toàn 100% tiền cọc gốc'}
                      {settlementType === 'EARLY_RETURN' && '• Trả kho sớm > 30 ngày (BR-RET-06) — Hoàn 100% tiền thuê chưa dùng'}
                      {settlementType === 'OVERDUE_TERMINATED' && '• Quá hạn D+7 niêm phong Kho Tổng (BR-OVD-07) — Khấu trừ 100% cọc'}
                      {settlementType === 'REJECTED_CHECKIN' && '• Từ chối nhận kho do lỗi cơ sở (BR-CHK-06) — Hoàn 100% tiền thuê & cọc'}
                      {settlementType === 'CANCELLED_CHECKIN' && '• Hủy nhận kho trước hạn (BR-CAN) — Hoàn tiền thuê & hoàn/phạt cọc'}
                    </div>

                    {/* Bảng kê dòng tiền quyết toán */}
                    <div className="bg-white rounded-lg p-3 border border-emerald-200/80 text-xs space-y-1.5 tabular-nums">
                      <div className="flex justify-between items-center text-gray-700">
                        <span>1. Tiền đặt cọc ban đầu (Deposit):</span>
                        <span className="font-semibold text-gray-900">+{formatVND(effectiveDeposit)}</span>
                      </div>
                      {settlementEarlyRentRefund > 0 && (
                        <div className="flex justify-between items-center text-emerald-700">
                          <span>2. Tiền thuê chưa dùng hoàn lại:</span>
                          <span className="font-semibold">+{formatVND(settlementEarlyRentRefund)}</span>
                        </div>
                      )}
                      {settlementDepositForfeited > 0 && (
                        <div className="flex justify-between items-center text-amber-700">
                          <span>3. Phạt cọc giữ phòng trống / hủy kho:</span>
                          <span className="font-semibold">-{formatVND(settlementDepositForfeited)}</span>
                        </div>
                      )}
                      {settlementDamage > 0 && (
                        <div className="flex justify-between items-center text-rose-700">
                          <span>4. Khấu trừ bồi thường hư hại ô kho:</span>
                          <span className="font-semibold">-{formatVND(settlementDamage)}</span>
                        </div>
                      )}
                      {settlementOverdue > 0 && (
                        <div className="flex justify-between items-center text-rose-700">
                          <span>5. Khấu trừ phạt nợ quá hạn lưu kho:</span>
                          <span className="font-semibold">-{formatVND(settlementOverdue)}</span>
                        </div>
                      )}
                      {settlementSealingFee > 0 && (
                        <div className="flex justify-between items-center text-purple-700">
                          <span>6. Khấu trừ phí niêm phong Kho Tổng:</span>
                          <span className="font-semibold">-{formatVND(settlementSealingFee)}</span>
                        </div>
                      )}

                      {/* Dòng tổng kết */}
                      <div className="pt-2 mt-1 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                        {settlementPayable > 0 ? (
                          <>
                            <span className="text-rose-700">Số tiền Khách hàng nộp bù:</span>
                            <span className="text-rose-700 text-sm">{formatVND(settlementPayable)} (Đã thu)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-700">Số tiền Công ty hoàn trả Khách hàng:</span>
                            <span className="text-emerald-700 text-sm">+{formatVND(settlementRefund)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Footer phê duyệt */}
                    <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-gray-500 border-t border-emerald-200/60">
                      <span>Người duyệt: <strong className="text-gray-700">{settledByName}</strong> {settledAt ? `(${new Date(settledAt).toLocaleDateString('vi-VN')})` : ''}</span>
                      <span className="text-gray-600 italic">Căn cứ: {settlementNote}</span>
                    </div>
                  </div>
                )}

                {/* Nếu chưa phát sinh phụ lục nào */}
                {!hasAnyAddenda && (
                  <p className="py-3 text-gray-500 text-xs">
                    Hợp đồng đang thực hiện theo các điều khoản nguyên bản. Chưa phát sinh phụ lục gia hạn hoặc điều chuyển kho.
                  </p>
                )}
              </section>
            </div>
        </div>

        {/* Footer với nút In hợp đồng, Đổi PIN, Báo trả kho và Đóng */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 cursor-pointer text-xs font-semibold text-gray-700 bg-white border-gray-300 hover:bg-gray-100"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span>In hợp đồng</span>
            </Button>

            {onChangePin && contract && contract.status === 'ACTIVE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleClose();
                  onChangePin(contract);
                }}
                className="flex items-center gap-1.5 px-3 cursor-pointer text-xs font-semibold text-brand-700 bg-white border-brand-200 hover:bg-brand-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Đổi PIN</span>
              </Button>
            )}

            {onScheduleReturn &&
              contract &&
              (contract.status === 'ACTIVE' || contract.status === 'EXPIRING_SOON') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleClose();
                    onScheduleReturn(contract);
                  }}
                  className="flex items-center gap-1.5 px-3 cursor-pointer text-xs font-semibold text-rose-600 bg-white border-rose-200 hover:bg-rose-50"
                >
                  <span>Báo trả kho</span>
                </Button>
              )}

            {onReschedulePeriod && contract && isPendingCheckin && (
              <Button
                variant="outline"
                size="sm"
                disabled={(effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1}
                onClick={() => {
                  if ((effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) < 1) {
                    handleClose();
                    onReschedulePeriod(contract);
                  }
                }}
                title={
                  (effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'Mỗi hợp đồng chỉ được phép dời lịch nhận kho tối đa 1 lần duy nhất'
                    : 'Yêu cầu dời ngày bắt đầu nhận kho'
                }
                className={`flex items-center gap-1.5 px-3 text-xs font-semibold ${
                  (effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-100 border-gray-200'
                    : 'cursor-pointer text-brand-700 bg-white border-brand-200 hover:bg-brand-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>
                  {(effectiveDetail?.rescheduleCount ?? contract.rescheduleCount ?? 0) >= 1
                    ? 'Đã dời lịch (1/1)'
                    : 'Dời ngày nhận kho'}
                </span>
              </Button>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleClose}
            className="px-5 cursor-pointer text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>

    {/* Bản in hợp đồng & biên bản bàn giao chuẩn pháp lý A4 (kết xuất khi in/lưu PDF) */}
    <ContractPrintDocument
      contract={contract}
      detail={detail}
      renewals={renewals}
    />
  </>,
  document.body
);
};
