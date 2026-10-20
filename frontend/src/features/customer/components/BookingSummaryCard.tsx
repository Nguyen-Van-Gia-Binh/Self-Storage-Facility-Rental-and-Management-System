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
    monthlyRate: number;
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
 * BookingSummaryCard — Bảng tóm tắt chi tiết đơn đặt chỗ và chi phí (Bước 2)
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
    <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
      <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614] pb-2 border-b border-brand-100">
        Chi tiết đơn đặt chỗ
      </h2>

      <div className="space-y-3 text-xs text-slate-600">
        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-500 font-medium">Cơ sở lưu trữ:</span>
          <strong className="text-[#0a1614] text-right font-bold">{facilityName}</strong>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="text-slate-500 font-medium">Ô kho cụ thể:</span>
          <strong className="font-mono text-sm px-2.5 py-0.5 rounded-lg border font-black text-brand-800 bg-brand-50 border-brand-300">
            {finalUnitNumber}
          </strong>
        </div>

        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-500 font-medium">Loại kho:</span>
          <strong className="text-[#0a1614] text-right">
            {unitTypeName} — Size {sizeCategory} ({areaM2} m²)
          </strong>
        </div>

        <div className="flex justify-between items-start gap-2">
          <span className="text-slate-500 font-medium">Thời gian thuê:</span>
          <strong className="text-[#0a1614] text-right">
            {formatDateVN(startDate)} → {formatDateVN(endDate)} ({durationMonths} tháng)
          </strong>
        </div>
      </div>

      {/* Bảng tính chi phí */}
      <div className="border-t border-brand-100 pt-3.5 space-y-2.5 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Đơn giá niêm yết:</span>
          <span className="font-semibold text-[#0a1614] font-mono">
            {formatVND(calculation.monthlyRate)} / tháng
          </span>
        </div>

        <div className="flex justify-between">
          <span>Tiền thuê {durationMonths} tháng:</span>
          <span className="font-semibold text-[#0a1614] font-mono">
            {formatVND(calculation.rentalFee)}
          </span>
        </div>

        {calculation.discountAmount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <span>
              {calculation.discountProgramName
                ? `${calculation.discountProgramName}${
                    calculation.discountPercent > 0 && !calculation.discountProgramName.includes('%')
                      ? ` (-${calculation.discountPercent}%)`
                      : ''
                  }:`
                : `Chiết khấu (-${calculation.discountPercent}%):`}
            </span>
            <span className="font-mono text-emerald-800">
              -{formatVND(calculation.discountAmount)}
            </span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Tiền cọc giữ kho ({depositMultiplierLabel} tháng):</span>
          <span className="font-semibold text-[#0a1614] font-mono">
            {formatVND(calculation.depositAmount)}
          </span>
        </div>
      </div>

      <div className="pt-3.5 border-t-2 border-slate-900/10">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#0a1614]">
            Tổng thanh toán:
          </span>
          <span className="text-2xl font-black text-[#008B74] font-mono">
            {formatVND(calculation.totalDueToday)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 text-right">
          Đã gồm {durationMonths} tháng tiền thuê và {depositMultiplierLabel} tháng tiền cọc hoàn lại
        </p>
      </div>
    </div>
  );
};
