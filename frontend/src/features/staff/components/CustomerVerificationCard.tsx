import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  KeyRound,
  ArrowLeft,
  MapPin,
  Check,
} from 'lucide-react';
import type { CheckInContract } from '../../../types';
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';

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

  const formatSafeDate = (iso?: string) => {
    if (!iso) return '—';
    const trimmed = iso.trim();
    return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? formatDateVN(trimmed.slice(0, 10)) : trimmed;
  };

  const hasAllocatedUnit = Boolean(
    !isRelocating &&
    contract.storageUnitId &&
    contract.storageUnitCode &&
    contract.storageUnitCode !== 'Chưa chọn ô'
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs h-fit space-y-5">
      {/* Header Hồ sơ tiếp đón */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 gap-2">
        <div className="flex items-center gap-2 min-w-0">
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
          <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900 truncate">
            Hồ sơ tiếp đón
          </h3>
        </div>
        <span className="font-mono text-xs font-medium text-gray-500 shrink-0">
          {contract.code}
        </span>
      </div>

      {/* Cảnh báo nhẹ khi đang chờ FM phân bổ ô mới */}
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

      {/* 1. Thông tin khách hàng & CCCD */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Khách hàng</span>
          <span className="font-bold text-gray-900 text-right">{contract.customerName}</span>
        </div>

        {contract.customerPhone && (
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Số điện thoại</span>
            <a
              href={`tel:${contract.customerPhone}`}
              className="font-medium text-gray-900 hover:text-brand-600 tabular-nums transition-colors"
            >
              {contract.customerPhone}
            </a>
          </div>
        )}

        <div className="flex justify-between items-center gap-3">
          <span className="text-gray-500">CCCD</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-900 text-xs">{contract.customerIdentityNumber}</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
              Trùng khớp
            </span>
          </div>
        </div>
      </div>

      {/* 2. Thông tin Ô kho */}
      <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center gap-3">
          <span className="text-gray-500">Ô kho</span>
          {isRelocating ? (
            <span className="text-xs font-semibold text-amber-700">Chưa gán số ô</span>
          ) : hasAllocatedUnit ? (
            <span className="font-bold text-brand-600 font-mono">
              {contract.storageUnitCode}
            </span>
          ) : (
            <span className="text-xs font-semibold text-rose-600">Chưa gán số ô</span>
          )}
        </div>

        <div className="flex justify-between items-center gap-3">
          <span className="text-gray-500">Vị trí &amp; Tầng</span>
          <span className="font-medium text-gray-900 text-right">
            {isRelocating
              ? 'Chờ cấp ô mới'
              : contract.floor
              ? `Tầng ${contract.floor}${contract.position ? ` · ${contract.position}` : ''}`
              : 'Chưa xác định'}
          </span>
        </div>

        <div className="flex justify-between items-start gap-3">
          <span className="text-gray-500 shrink-0">Loại kho</span>
          <span className="font-medium text-gray-900 text-right">
            {contract.unitTypeName}
            {contract.unitTypeDimensions && (
              <span className="block text-xs text-gray-500 font-normal">
                ({contract.unitTypeDimensions})
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center gap-3">
          <span className="text-gray-500 shrink-0">Cơ sở</span>
          <span
            className="font-medium text-gray-900 text-right truncate max-w-[200px]"
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Xem vị trí ô trên Sơ đồ 2D</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Kỳ hạn thuê & Thời gian ân hạn */}
      <div className="space-y-2.5 border-t border-gray-100 pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Kỳ hạn ({contract.rentalMonths} tháng)</span>
          <span className="font-medium text-gray-900 tabular-nums text-xs sm:text-sm">
            {formatSafeDate(contract.startDate)} – {formatSafeDate(contract.endDateExclusive)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Ân hạn nhận kho</span>
          <span className="font-medium text-gray-700 text-xs sm:text-sm">
            {contract.checkinGraceDays ?? 10} ngày (Còn {contract.graceDaysRemaining ?? 10} ngày)
          </span>
        </div>
      </div>

      {/* 4. Thanh toán */}
      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Tổng thanh toán:</span>
          <span className="text-lg font-bold text-gray-900 tabular-nums">
            {formatCurrency(contract.totalPayable)}
          </span>
        </div>

        {contract.isFullyPaid ? (
          <div className="w-full py-2 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold rounded-lg border border-emerald-200 flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Đã thanh toán 100%</span>
          </div>
        ) : (
          <div className="w-full py-2 bg-rose-50 text-rose-700 text-xs sm:text-sm font-semibold rounded-lg border border-rose-200 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Chưa hoàn tất thanh toán (Tạm khóa bàn giao)</span>
          </div>
        )}
      </div>
    </div>
  );
};
