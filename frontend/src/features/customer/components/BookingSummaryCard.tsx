import React from 'react';
import { formatVND } from '../utils/pricing';
import { formatDateVN } from '../utils/unitPickerHelpers';

export interface BookingSummaryCardProps {
  facilityName: string;
  finalUnitNumber: string;
  unitTypeName: string;
  sizeCategory: string;
  areaM2: number;
  startDate: string;
  endDate: string;
  durationMonths: number;
  calculation: {
    monthlyRate?: number;
    rentalFee: number;
    discountPercent: number;
    discountAmount: number;
    discountProgramName?: string | null;
    depositAmount: number;
    totalDueToday: number;
  };
  depositMultiplierLabel: string;
}

/**
 * BookingSummaryCard — Bảng tóm tắt thông tin đặt chỗ (đồng bộ giao diện 1:1 với Hóa đơn ở màn chọn kho)
 */
export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  facilityName,
  finalUnitNumber,
  unitTypeName,
  sizeCategory,
  areaM2,
  startDate,
  endDate,
  durationMonths,
  calculation,
  depositMultiplierLabel,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-24 space-y-3">
      {/* Invoice Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Chi tiết đặt kho
        </h3>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200/60">
          Đã chọn ô
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
            <span className="font-mono text-xs px-2 py-0.5 rounded-md border font-black text-brand-800 bg-brand-50 border-brand-300">
              {finalUnitNumber}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Loại kho:</span>
          <span className="text-slate-900 text-right font-medium">
            {unitTypeName} (Size {sizeCategory}{areaM2 ? ` · ${areaM2} m²` : ''})
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Kỳ thuê:</span>
          <span className="text-slate-900 text-right font-medium">
            {durationMonths} tháng ({formatDateVN(startDate)} → {formatDateVN(endDate)})
          </span>
        </div>
      </div>

      {/* Bảng tính toán tiền thuê và tiền cọc */}
      <div className="pt-1 space-y-2 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Tiền thuê ({durationMonths} tháng):</span>
          <span className="font-semibold text-slate-900 font-mono">
            {formatVND(calculation.rentalFee)}
          </span>
        </div>

        {calculation.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
            <span>
              {calculation.discountProgramName
                ? `${calculation.discountProgramName}${
                    calculation.discountPercent > 0 && !calculation.discountProgramName.includes('%')
                      ? ` (-${calculation.discountPercent}%)`
                      : ''
                  }:`
                : `Chiết khấu (-${calculation.discountPercent}%):`}
            </span>
            <span className="font-mono text-emerald-800 font-black">
              -{formatVND(calculation.discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-slate-600">
          <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
          <span className="font-semibold text-slate-900 font-mono">
            {formatVND(calculation.depositAmount)}
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
            {formatVND(calculation.totalDueToday)}
          </span>
        </div>
      </div>
    </div>
  );
};
