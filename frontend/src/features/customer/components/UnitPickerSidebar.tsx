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
    <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
      {/* Invoice Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          Hóa đơn đặt chỗ
        </h3>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          {selectedUnit ? 'Đã chọn ô' : 'Tự động gán ô'}
        </span>
      </div>

      {/* Thông tin định danh cơ bản */}
      <div className="space-y-2.5 text-xs text-slate-600">
        <div className="flex justify-between items-start gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Cơ sở:</span>
          <strong className="text-slate-900 text-right font-bold">{facilityName}</strong>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Mã ô kho:</span>
          <strong
            className={`font-mono text-sm px-2.5 py-0.5 rounded-lg border font-black ${
              selectedUnit
                ? 'text-brand-800 bg-brand-50 border-brand-300 ring-2 ring-brand-500/10'
                : 'text-amber-800 bg-amber-50 border-amber-300'
            }`}
          >
            {selectedUnit ? selectedUnit.unitNumber : 'Đang chọn ô trống...'}
          </strong>
        </div>

        <div className="flex justify-between items-start gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Loại kho:</span>
          <strong className="text-slate-900 text-right">
            {storageType === 'CLIMATE_CONTROLLED' ? 'Kho Máy Lạnh' : 'Kho Tiêu Chuẩn'} — Size {selectedSize} ({areaM2 || 4} m²)
          </strong>
        </div>

        <div className="flex justify-between items-start gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Kỳ thuê:</span>
          <strong className="text-slate-900 text-right font-medium">
            {formatDateVN(startDate)} → {formatDateVN(calculatedEndDate)}
          </strong>
        </div>
      </div>

      {/* Bảng tính toán tiền thuê và tiền cọc */}
      <div className="border-t border-slate-200 pt-3.5 space-y-2.5 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Đơn giá niêm yết:</span>
          <span className="font-semibold text-slate-900 font-mono">
            {formatVND(priceCalculation.basePrice)} / tháng
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Số tháng thuê:</span>
          <span className="font-bold text-slate-900 font-mono">x {durationMonths} tháng</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>Tạm tính tiền thuê:</span>
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
      <div className="pt-3.5 border-t-2 border-slate-900/10">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
            Tổng thanh toán:
          </span>
          <span className="text-2xl font-black text-[#008B74] font-mono tracking-tight">
            {formatVND(priceCalculation.totalDue)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onProceedToBooking}
        disabled={isConfirming || !selectedUnit}
        className="w-full py-4 text-sm sm:text-base font-extrabold bg-[#008B74] hover:bg-[#007461] active:bg-[#005e4f] text-white rounded-xl shadow-md transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Đang khởi tạo đơn...</span>
          </>
        ) : (
          <>
            <span>Điền thông tin và thanh toán</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </>
        )}
      </Button>
    </div>
  );
};
