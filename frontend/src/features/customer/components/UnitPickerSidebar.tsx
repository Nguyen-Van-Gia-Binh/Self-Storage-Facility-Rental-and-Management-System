import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';
import type { StorageType, UnitSizeCategory, StorageUnit } from '../types';

export interface UnitPickerSidebarProps {
  facilityName: string;
  selectedUnit: StorageUnit | null;
  storageType: StorageType;
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
 * UnitPickerSidebar — Cột phải: Hóa đơn tóm tắt đặt chỗ (Mini Invoice)
 * Hiển thị báo giá tạm tính minh bạch theo thời gian thực (BR-PRI-01, BR-DEP-01).
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
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-24 space-y-3">
      {/* Invoice Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Hóa đơn đặt chỗ
        </h3>
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
            selectedUnit
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
              : 'bg-amber-50 text-amber-800 border-amber-200/60'
          }`}
        >
          {selectedUnit ? 'Đã chọn ô' : 'Tự động gán ô'}
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
            <span
              className={`font-mono text-xs px-2 py-0.5 rounded-md border font-black ${
                selectedUnit
                  ? 'text-brand-800 bg-brand-50 border-brand-300'
                  : 'text-amber-800 bg-amber-50 border-amber-300'
              }`}
            >
              {selectedUnit ? selectedUnit.unitNumber : 'Đang chọn ô...'}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Loại kho:</span>
          <span className="text-slate-900 text-right font-medium">
            {storageType === 'CLIMATE_CONTROLLED' ? 'Kho Máy Lạnh' : 'Kho Tiêu Chuẩn'} (Size {selectedSize}{areaM2 ? ` · ${areaM2} m²` : ''})
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
            {formatVND(priceCalculation.grossRent)}
          </span>
        </div>

        {priceCalculation.discountAmount > 0 && (
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
            {formatVND(priceCalculation.depositAmount)}
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
            {formatVND(priceCalculation.totalDue)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={onProceedToBooking}
        disabled={isConfirming || !selectedUnit}
        className="w-full py-3 text-xs sm:text-sm font-extrabold bg-[#008B74] hover:bg-[#007461] active:bg-[#005e4f] text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang khởi tạo đơn...</span>
          </>
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
