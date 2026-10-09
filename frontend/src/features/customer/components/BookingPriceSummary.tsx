import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Clock, Tag, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { calculateBookingPrice } from '@/api/reservation';
import type { PricingCalculationResult } from '../utils/pricing';
import type { UnitType, Facility } from '../types';

export interface BookingPriceSummaryProps {
  unitType: UnitType;
  facility: Facility;
  calculation: PricingCalculationResult;
  startDate: string;
  endDate: string;
  holdHours?: number;
  /**
   * Hệ số cọc lấy từ chính sách BOM đang hiệu lực (BR-DEP-01).
   * Mặc định 1 để an toàn khi policy chưa sẵn sàng; backend vẫn là nơi tính số tiền cuối cùng.
   */
  depositMultiplier?: number;
}

export const BookingPriceSummary: React.FC<BookingPriceSummaryProps> = ({
  unitType,
  facility,
  calculation,
  startDate,
  endDate,
  holdHours,
  depositMultiplier = 1,
}) => {
  const multiplierLabel = Number.isInteger(depositMultiplier)
    ? String(depositMultiplier)
    : depositMultiplier.toFixed(1).replace(/\.0$/, '');

  // Issue #8: Verify price from backend when viewing cost breakdown (step 2 and step 3)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Only verify once per calculation change to avoid excessive API calls
    if (!unitType?.id || !facility?.id || !calculation || hasVerified.current) {
      return;
    }

    const facilityId = typeof facility.id === 'number' ? facility.id : parseInt(String(facility.id), 10);
    const unitTypeId = typeof unitType.id === 'number' ? unitType.id : parseInt(String(unitType.id), 10);

    if (!Number.isFinite(facilityId) || !Number.isFinite(unitTypeId)) {
      return;
    }

    hasVerified.current = true;

    async function verifyPrice() {
      try {
        const res = await calculateBookingPrice({
          facilityId,
          unitTypeId,
          months: calculation.months,
        });

        // Compare with displayed price
        const priceChanged =
          res.monthlyPrice !== calculation.monthlyRate ||
          res.totalDueToday !== calculation.totalDueToday;

        if (priceChanged) {
          setToastMessage('Giá đã được cập nhật, vui lòng xem lại');
          // Auto-hide toast after 4 seconds
          setTimeout(() => setToastMessage(null), 4000);
        }
      } catch {
        // Silently ignore price verification errors
      }
    }

    verifyPrice();
  }, [unitType?.id, facility?.id, calculation?.months]);

  // Reset verification flag when calculation changes significantly
  useEffect(() => {
    if (calculation) {
      hasVerified.current = false;
    }
  }, [calculation?.totalDueToday]);

  return (
    <Card className="p-5 bg-white border border-slate-200/90 shadow-sm rounded-xl sticky top-24 space-y-5">
      {/* Toast notification for price changes */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <h3 className="text-base font-bold text-[#0a1614] pb-2 border-b border-slate-100">
        Tóm Tắt Chi Phí Thuê
      </h3>

      {/* Date Span */}
      <div className="bg-[#f2f9f7] rounded-lg p-3 border border-emerald-100 text-xs space-y-1.5">
        <div className="flex justify-between items-center text-slate-600">
          <span>Ngày bắt đầu thuê:</span>
          <span className="font-semibold text-[#0a1614]">{startDate || 'Chưa chọn'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>Ngày kết thúc dự kiến:</span>
          <span className="font-semibold text-[#0a1614]">{endDate || 'Chưa chọn'}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-emerald-200/60">
          <span>Tổng thời gian:</span>
          <span className="font-bold text-brand-700">{calculation.months} tháng</span>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-2.5 text-xs sm:text-sm">
        <div className="flex justify-between items-center text-slate-600">
          <span>Giá thuê niêm yết:</span>
          <span className="font-medium text-slate-800">{formatVND(calculation.monthlyRate)}/tháng</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Tiền thuê ({calculation.months} tháng):</span>
          <span className="font-medium text-slate-800">{formatVND(calculation.rawRentTotal)}</span>
        </div>

        {(calculation.surcharges ?? []).map((line) => (
          <div key={line.name} className="flex justify-between items-center text-amber-800">
            <span>Phụ phí: {line.name}</span>
            <span className="font-medium">{formatVND(line.amount)}</span>
          </div>
        ))}

        {calculation.discountAmount > 0 && (
          <div className="flex justify-between items-center text-[#7c94c3] bg-[#7c94c3]/8 px-2.5 py-1.5 rounded-md text-xs font-semibold">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Ưu đãi giảm {(calculation.discountPercentage * 100).toFixed(0)}%:
            </span>
            <span>-{formatVND(calculation.discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-100">
          <span>Tiền cọc ({multiplierLabel} × tháng tiền thuê):</span>
          <span className="font-semibold text-slate-800">{formatVND(calculation.depositAmount)}</span>
        </div>

        <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-baseline">
          <span className="text-sm sm:text-base font-bold text-[#0a1614]">Tổng thanh toán:</span>
          <span className="text-xl font-extrabold text-brand-600">
            {formatVND(calculation.totalDueToday)}
          </span>
        </div>
      </div>

      {/* 48h Hold Banner */}
      <div className="rounded-lg p-3 bg-[#96b3cf]/12 border border-[#96b3cf]/30 flex items-start gap-2.5 text-xs text-slate-700">
        <Clock className="w-4 h-4 text-[#7c94c3] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0a1614]">Giữ chỗ trong {holdHours && holdHours > 0 ? holdHours : '…'} giờ:</strong> Hệ thống sẽ tạm giữ ô kho này trong vòng {holdHours && holdHours > 0 ? `${holdHours} giờ` : 'thời gian trên chính sách'} để quý khách hoàn tất chuyển khoản VietQR.
        </p>
      </div>
    </Card>
  );
};
