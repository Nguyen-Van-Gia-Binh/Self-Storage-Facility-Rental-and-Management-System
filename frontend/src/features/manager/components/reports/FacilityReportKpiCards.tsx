// frontend/src/features/manager/components/reports/FacilityReportKpiCards.tsx

import React from 'react';
import { Layers, CheckCircle2, Wrench, TrendingUp } from 'lucide-react';
import type { FacilityOverviewReport } from '../../types/report';

interface Props {
  data: FacilityOverviewReport;
  loading?: boolean;
}

export const FacilityReportKpiCards: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  const rawRate = data.occupancyRate ?? 0;
  // Chuẩn hóa tỷ lệ lấp đầy: nếu Backend trả về tỷ lệ hệ số (0.0 -> 1.0) thì quy đổi về dạng phần trăm 0..100%
  const rate = rawRate > 0 && rawRate <= 1 ? rawRate * 100 : rawRate;
  const isOptimal = rate >= 80;
  const isModerate = rate >= 50 && rate < 80;

  return (
    <div className="space-y-4">
      {/* Hàng 4 thẻ chỉ số kho (AC-1) + 1 Thẻ Usage Rate lớn (AC-2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Tổng số ô kho */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng ô kho</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{data.totalUnits}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Mặt bằng vật lý cơ sở</p>
          </div>
        </div>

        {/* Card 2: Đang thuê (Occupied) */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đang thuê</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">{data.occupiedUnits}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {data.totalUnits > 0 ? ((data.occupiedUnits / data.totalUnits) * 100).toFixed(1) : 0}% tổng kho
            </p>
          </div>
        </div>

        {/* Card 3: Ô kho trống (Available) */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ô kho trống</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-sky-600">{data.availableUnits}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Sẵn sàng nhận khách mới</p>
          </div>
        </div>

        {/* Card 4: Đang bảo trì (Maintenance) */}
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bảo trì</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{data.maintenanceUnits}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Tạm ngưng phục vụ sửa chữa</p>
          </div>
        </div>

        {/* Card 5: Tỷ lệ lấp đầy Usage Rate (AC-2) */}
        <div
          className={`p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
            isOptimal
              ? 'bg-emerald-50/50 border-emerald-200'
              : isModerate
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Tỷ lệ lấp đầy (Usage)</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isOptimal
                  ? 'bg-emerald-100 text-emerald-700'
                  : isModerate
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{rate.toFixed(1)}%</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOptimal
                    ? 'bg-emerald-200 text-emerald-900'
                    : isModerate
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-rose-200 text-rose-900'
                }`}
              >
                {isOptimal ? 'Tối ưu' : isModerate ? 'Trung bình' : 'Thấp'}
              </span>
            </div>

            {/* Thanh Progress Bar trực quan */}
            <div className="w-full bg-slate-200/80 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isOptimal ? 'bg-emerald-600' : isModerate ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
