import React from 'react';
import {
  ShieldCheck,
  Calendar,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Phone,
  User,
  KeyRound,
  ArrowLeft,
  MapPin,
  Clock,
  Check,
} from 'lucide-react';
import type { CheckInContract } from '../../../types';

export interface CustomerVerificationCardProps {
  contract: CheckInContract;
  onBack?: () => void;
  onOpenFloorPlan?: () => void;
}

export const CustomerVerificationCard: React.FC<CustomerVerificationCardProps> = ({
  contract,
  onBack,
  onOpenFloorPlan,
}) => {
  const isRelocating = Boolean(
    contract.relocationEligible ||
    contract.isAwaitingRelocation ||
    !contract.storageUnitCode ||
    contract.storageUnitCode === 'Chờ gán lại ô kho'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const hasAllocatedUnit = Boolean(
    !isRelocating &&
    contract.storageUnitId &&
    contract.storageUnitCode &&
    contract.storageUnitCode !== 'Chưa chọn ô'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs h-fit space-y-5">
      {/* Header thẻ Hồ sơ tiếp đón */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title="Quay lại Nhiệm vụ ca trực"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <KeyRound className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
            HỒ SƠ TIẾP ĐÓN
          </h3>
        </div>
        <span className="font-mono text-xs font-bold text-gray-400">
          #{contract.code}
        </span>
      </div>

      {/* Cảnh báo màu nhẹ nhàng khi đang chờ FM phân bổ ô mới */}
      {isRelocating && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Đang chờ FM phân bổ ô mới</p>
            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
              Hồ sơ đã chuyển tiếp Quản lý cơ sở để cấp ô thay thế trên sơ đồ 2D.
            </p>
          </div>
        </div>
      )}

      {/* 1. Thông tin chung ô kho (Làm phẳng, bỏ khung viền lồng nhau) */}
      <div className="space-y-3 pb-5 border-b border-gray-100 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Ô kho:</span>
          {isRelocating ? (
            <span className="text-xs font-bold text-amber-700">Chưa gán số ô</span>
          ) : hasAllocatedUnit ? (
            <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-md text-sm">
              {contract.storageUnitCode}
            </span>
          ) : (
            <span className="text-xs font-bold text-rose-600">Chưa gán số ô</span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Vị trí & Tầng:</span>
          <span className="text-xs font-medium text-gray-800">
            {isRelocating
              ? 'Chờ cấp ô mới'
              : contract.floor
              ? `Tầng ${contract.floor} · ${contract.position || ''}`
              : 'Chưa xác định vị trí'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Loại ô kho:</span>
          <span className="text-xs font-medium text-gray-900 text-right">
            {contract.unitTypeName}
            {contract.unitTypeDimensions && (
              <span className="text-gray-400 font-normal ml-1">({contract.unitTypeDimensions})</span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Cơ sở:</span>
          <span
            className="text-xs font-medium text-gray-900 text-right truncate max-w-[200px]"
            title={contract.facilityName}
          >
            {contract.facilityName}
          </span>
        </div>

        {onOpenFloorPlan && !isRelocating && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onOpenFloorPlan}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span>Xem vị trí ô trên Sơ đồ 2D</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Khách hàng & CCCD */}
      <div className="space-y-3 pb-5 border-b border-gray-100 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <User className="w-4 h-4 text-gray-400 shrink-0" />
            <h4 className="text-sm font-bold text-gray-900">{contract.customerName}</h4>
          </div>
          {contract.customerPhone && (
            <a
              href={`tel:${contract.customerPhone}`}
              className="inline-flex items-center gap-1 font-mono text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
            >
              <Phone className="w-3 h-3 text-gray-500" />
              <span>{contract.customerPhone}</span>
            </a>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              CCCD: <strong className="font-mono text-gray-800">{contract.customerIdentityNumber}</strong>
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
            <Check className="w-3 h-3 text-emerald-600" />
            Trùng khớp
          </span>
        </div>
      </div>

      {/* 3. Kỳ hạn thuê & Thời gian ân hạn */}
      <div className="space-y-2.5 pb-5 border-b border-gray-100 text-xs">
        <div className="flex items-center justify-between text-gray-600">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>Kỳ hạn ({contract.rentalMonths} tháng):</span>
          </span>
          <strong className="text-gray-900 font-semibold">
            {contract.startDate} → {contract.endDateExclusive}
          </strong>
        </div>

        <div className="flex items-center justify-between text-gray-600">
          <span className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>Thời gian ân hạn:</span>
          </span>
          <span className="text-gray-700 font-medium">
            Ân hạn {contract.checkinGraceDays ?? 10} ngày (Còn {contract.graceDaysRemaining ?? 10} ngày)
          </span>
        </div>
      </div>

      {/* 4. Thanh toán */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
            <span>Tổng thanh toán:</span>
          </span>
          <span className="text-base font-bold text-brand-700 tabular-nums">
            {formatCurrency(contract.totalPayable)}
          </span>
        </div>

        {contract.isFullyPaid ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold w-full justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Đã thanh toán 100%</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold w-full justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Chưa hoàn tất thanh toán (Tạm khóa bàn giao)</span>
          </div>
        )}
      </div>
    </div>
  );
};

