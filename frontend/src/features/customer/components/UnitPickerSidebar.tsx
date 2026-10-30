import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';
import type { StorageType, UnitSizeCategory, StorageUnit } from '../types';

export interface UnitPickerSidebarProps {
  facilityName: string;
  selectedUnit: StorageUnit | null;
  storageType: StorageType | null;
  selectedSize: UnitSizeCategory;
  areaM2?: number;
  startDate: string;
  calculatedEndDate: string;
  durationMonths: number;
  depositMultiplierLabel: string;
  priceCalculation: {
    basePrice: number;
    grossRent: number;
    discountPercent: number;
    discountAmount: number;
    discountProgramName: string | null;
    netRent: number;
    depositAmount: number;
    totalDue: number;
  };
  isConfirming: boolean;
  formatDateVN: (dateStr: string) => string;
  onProceedToBooking: () => void;
}

/**
 * UnitPickerSidebar — Cột phải: Chi tiết đặt kho (Mini Invoice)
 * Hiển thị báo giá tạm tính minh bạch theo thời gian thực (BR-PRI-01, BR-DEP-01).
 * Khi khách chưa chọn loại kho, hiển thị trạng thái chờ thân thiện, không tính tiền trước.
 */
export const UnitPickerSidebar: React.FC<UnitPickerSidebarProps> = ({
  facilityName,
  selectedUnit,
  storageType,
  selectedSize,
  areaM2,
  startDate,
  calculatedEndDate,
  durationMonths,
  depositMultiplierLabel,
  priceCalculation,
  isConfirming,
  formatDateVN,
  onProceedToBooking,
}) => {
  const hasSelected = !!selectedUnit;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-24 space-y-3">
      {/* Invoice Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Chi tiết đặt kho
        </h3>
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
            hasSelected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {hasSelected ? 'Đã chọn ô' : 'Chưa chọn kho'}
        </span>
      </div>

      {/* Thông tin định danh cơ bản */}
      <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Cơ sở:</span>
          <span className="text-slate-900 text-right font-bold truncate max-w-[190px]">
            {facilityName}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Mã ô kho:</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            {hasSelected ? (
              <span className="font-mono text-xs px-2 py-0.5 rounded-md border font-black text-brand-800 bg-brand-50 border-brand-300">
                {selectedUnit.unitNumber}
              </span>
            ) : (
              <span className="text-slate-400 font-mono">--</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Loại kho:</span>
          <span className="text-slate-900 text-right font-medium">
            {hasSelected ? (
              `${storageType === 'CLIMATE_CONTROLLED' ? 'Kho Máy Lạnh' : 'Kho Tiêu Chuẩn'} (Size ${selectedSize}${areaM2 ? ` · ${areaM2} m²` : ''})`
            ) : (
              <span className="text-slate-400">Vui lòng chọn loại kho</span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Kỳ thuê:</span>
          <span className="text-slate-900 text-right font-medium">
            {durationMonths} tháng ({formatDateVN(startDate)} → {formatDateVN(calculatedEndDate)})
          </span>
        </div>
      </div>

      {/* Bảng tính toán tiền thuê và tiền cọc */}
      <div className="pt-1 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>
            Tiền thuê ({durationMonths} tháng):
          </span>
          <span className="font-semibold text-slate-900 font-mono">
            {hasSelected ? formatVND(priceCalculation.grossRent) : '-- đ'}
          </span>
        </div>

        {hasSelected && priceCalculation.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
            <span>
              {priceCalculation.discountProgramName
                ? `${priceCalculation.discountProgramName}${
                    priceCalculation.discountPercent > 0 && !priceCalculation.discountProgramName.includes('%')
                      ? ` (-${priceCalculation.discountPercent}%)`
                      : ''
                  }:`
                : `Chiết khấu (-${priceCalculation.discountPercent}%):`}
            </span>
            <span className="font-mono text-emerald-800 font-black">
              -{formatVND(priceCalculation.discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
          <span className="font-semibold text-slate-900 font-mono">
            {hasSelected ? formatVND(priceCalculation.depositAmount) : '-- đ'}
          </span>
        </div>
      </div>

      {/* Tổng thanh toán */}
      <div className="pt-2.5 border-t border-slate-200">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            Tổng thanh toán:
          </span>
          <span className="text-xl font-black text-[#008B74] font-mono tracking-tight">
            {hasSelected ? formatVND(priceCalculation.totalDue) : '-- đ'}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={onProceedToBooking}
        disabled={isConfirming || !hasSelected}
        className="w-full py-3 text-xs sm:text-sm font-extrabold bg-[#008B74] hover:bg-[#007461] active:bg-[#005e4f] text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang khởi tạo đơn...</span>
          </>
        ) : !hasSelected ? (
          <span>Vui lòng chọn loại kho</span>
        ) : (
          <>
            <span>Điền thông tin và thanh toán</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </>
        )}
      </Button>
    </div>
  );
};
