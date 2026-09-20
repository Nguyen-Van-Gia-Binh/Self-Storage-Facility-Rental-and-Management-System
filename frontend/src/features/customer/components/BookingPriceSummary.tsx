import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Clock, Tag } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { PricingCalculationResult } from '../utils/pricing';
import type { UnitType, Facility } from '../types';

export interface BookingPriceSummaryProps {
  unitType: UnitType;
  facility: Facility;
  calculation: PricingCalculationResult;
  startDate: string;
  endDate: string;
}

export const BookingPriceSummary: React.FC<BookingPriceSummaryProps> = ({
  unitType,
  facility,
  calculation,
  startDate,
  endDate,
}) => {
  return (
    <Card className="p-6 bg-white border border-slate-200/90 shadow-sm rounded-xl sticky top-24 space-y-6">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7c94c3] bg-[#7c94c3]/10 px-2.5 py-0.5 rounded-full">
            {unitType.badge || 'KHO CHUẨN'} · Cỡ {unitType.sizeCategory}
          </span>
          {unitType.storageType === 'CLIMATE_CONTROLLED' && (
            <Badge variant="info">
              Máy lạnh 24/7
            </Badge>
          )}
        </div>
        <h3 className="text-lg font-bold text-[#0a1614]">
          {unitType.name}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {facility.name} — {facility.address}
        </p>
      </div>

      {/* Date Span */}
      <div className="bg-[#f2f9f7] rounded-lg p-3.5 border border-emerald-100 text-xs space-y-1.5">
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
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-slate-600">
          <span>Giá thuê niêm yết:</span>
          <span className="font-medium text-slate-800">{formatVND(calculation.monthlyRate)}/tháng</span>
        </div>

        <div className="flex justify-between items-center text-slate-600">
          <span>Tiền thuê ({calculation.months} tháng):</span>
          <span className="font-medium text-slate-800">{formatVND(calculation.rawRentTotal)}</span>
        </div>

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
          <div className="flex items-center gap-1.5">
            <span>Tiền cọc (1 tháng):</span>
            <span 
              className="text-[#96b3cf] cursor-help" 
              title="BR-DEP-01: Tiền đặt cọc bằng đúng 1 tháng tiền thuê, được hoàn trả khi kết thúc hợp đồng."
            >
              ℹ️
            </span>
          </div>
          <span className="font-semibold text-slate-800">{formatVND(calculation.depositAmount)}</span>
        </div>

        <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-baseline">
          <div>
            <span className="text-base font-bold text-[#0a1614] block">Tổng thanh toán hôm nay:</span>
            <span className="text-[11px] text-slate-500">Đã bao gồm tiền thuê + tiền cọc</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-brand-600">
              {formatVND(calculation.totalDueToday)}
            </span>
          </div>
        </div>
      </div>

      {/* 48h Hold Banner (BR-DEP-03) */}
      <div className="rounded-lg p-3 bg-[#96b3cf]/12 border border-[#96b3cf]/30 flex items-start gap-2.5 text-xs text-slate-700">
        <Clock className="w-4 h-4 text-[#7c94c3] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#0a1614]">Giữ chỗ trong 48 giờ:</strong> Hệ thống sẽ khóa ngăn kho này cho bạn trong vòng 48h để quý khách hoàn tất chuyển khoản VietQR.
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0" />
        <span>Cam kết bảo mật thông tin & hoàn cọc 100% khi thanh lý đúng hạn.</span>
      </div>
    </Card>
  );
};
