import React from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';
import type { StorageType, UnitSizeCategory, StorageUnit } from '../types';

export interface UnitPickerSidebarProps {
  facilityName: string;
  selectedUnit: StorageUnit | null;
  unitTypeName?: string;
  typeFull?: boolean;
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
  unitTypeName,
  typeFull,
  storageType: _storageType,
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
  const hasSelected = !!unitTypeName || !!selectedUnit;

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
          {hasSelected ? 'Đã chọn hạng' : 'Chưa chọn kho'}
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
          <span className="shrink-0 text-slate-500 font-medium">Hạng kho:</span>
          <span className="text-slate-900 text-right font-bold truncate max-w-[190px]">
            {unitTypeName || 'Vui lòng chọn loại kho'}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="shrink-0 text-slate-500 font-medium">Quy cách:</span>
          <span className="text-slate-900 text-right font-medium">
            {hasSelected ? (
              `Size ${selectedSize}${areaM2 ? ` · ${areaM2} m²` : ''}`
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

      {/* Bảng tính toán tiền thuê và tiền cọc hoặc Empty State khi chưa chọn kho */}
      {hasSelected ? (
        <>
          <div className="pt-1 space-y-2 text-xs animate-in fade-in-50 duration-150">
            <div className="flex justify-between text-slate-600">
              <span>
                Tiền thuê ({durationMonths} tháng):
              </span>
              <span className="font-semibold text-slate-900 num">
                {formatVND(priceCalculation.grossRent)}
              </span>
            </div>

            {priceCalculation.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>
                  {priceCalculation.discountProgramName
                    ? `${priceCalculation.discountProgramName}${
                        priceCalculation.discountPercent > 0 && !priceCalculation.discountProgramName.includes('%')
                          ? ` (-${priceCalculation.discountPercent}%)`
                          : ''
                      }:`
                    : `Chiết khấu (-${priceCalculation.discountPercent}%):`}
                </span>
                <span className="num text-emerald-800 font-black">
                  -{formatVND(priceCalculation.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
              <span className="font-semibold text-slate-900 num">
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
              <span className="text-xl font-black text-[#008B74] num tracking-tight">
                {formatVND(priceCalculation.totalDue)}
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Empty State tóm tắt báo giá */
        <div className="flex flex-col items-center justify-center py-7 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-4 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Vui lòng chọn loại kho<br />để xem báo giá chi tiết.
          </p>
        </div>
      )}

      {/* CTA Button */}
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={onProceedToBooking}
        disabled={isConfirming || !hasSelected || typeFull}
        className="w-full py-3 text-xs sm:text-sm font-extrabold bg-[#008B74] hover:bg-[#007461] active:bg-[#005e4f] text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConfirming ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang khởi tạo đơn...</span>
          </>
        ) : typeFull ? (
          <span>Hết chỗ — Vui lòng chọn loại kho khác</span>
        ) : !hasSelected ? (
          <span>Vui lòng chọn loại kho</span>
        ) : (
          <span>Điền thông tin và thanh toán</span>
        )}
      </Button>
    </div>
  );
};
