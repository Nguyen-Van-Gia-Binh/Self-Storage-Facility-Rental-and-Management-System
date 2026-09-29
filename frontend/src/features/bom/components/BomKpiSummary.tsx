import React from 'react';
import { DollarSign, Layers, FileText, AlertTriangle } from 'lucide-react';
import type { SystemRevenueReport, SystemOccupancyReport, OverdueReportResponse } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';

export interface BomKpiSummaryProps {
  revenue?: SystemRevenueReport;
  occupancy?: SystemOccupancyReport;
  overdue?: OverdueReportResponse;
  isLoading?: boolean;
}

export const BomKpiSummary: React.FC<BomKpiSummaryProps> = ({
  revenue,
  occupancy,
  overdue,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-7 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const totalRev = revenue?.totalRevenue ?? 0;
  const refundAmount = revenue?.totalRefundAmount ?? 0;
  const avgOccupancy = occupancy?.averageOccupancyRate ?? 0;
  const occupiedUnits = occupancy?.occupiedUnitsSystem ?? 0;
  const overdueCount = overdue?.totalOverdueContracts ?? 0;
  const overdueFee = overdue?.totalAccruedFee ?? 0;
  const occupancyRows = occupancy?.data ?? [];
  const reservedUnits = occupancyRows.reduce(
    (sum, row) => sum + (row.reservedUnits || 0),
    0,
  );
  const occupiedForRate = occupancyRows.reduce(
    (sum, row) => sum + (row.occupiedUnits || 0),
    0,
  );
  const exploitableUnits = occupancyRows.reduce(
    (sum, row) => sum + Math.max(0, (row.totalUnits || 0) - (row.outOfServiceUnits || 0)),
    0,
  );
  const rateUnknown = exploitableUnits === 0;

  // Đánh giá tỷ lệ lấp đầy
  const getOccupancyBadge = (rate: number) => {
    if (rate >= 0.8) {
      return {
        label: 'Đạt chỉ tiêu (≥ 80%)',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (rate >= 0.5) {
      return {
        label: 'Mức ổn định (50-79%)',
        classes: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    return {
      label: 'Cần đẩy mạnh (< 50%)',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  };

  const occBadge = getOccupancyBadge(avgOccupancy);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu thực thu */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-brand-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tổng Doanh Thu Thực Thu
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {formatCurrency(totalRev)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            Đã hoàn {formatCurrency(refundAmount)}
          </div>
        </div>
      </div>

      {/* 2. Tỷ lệ lấp đầy toàn quốc */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-brand-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tỷ Lệ Lấp Đầy Hệ Thống
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {rateUnknown ? 'Không xác định' : formatPercent(avgOccupancy)}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            {rateUnknown ? (
              <span className="text-xs text-slate-500">Chưa có ô khai thác được</span>
            ) : (
              <>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${occBadge.classes}`}>
                  {occBadge.label}
                </span>
                <span className="text-xs text-slate-500">
                  ({occupiedForRate}/{exploitableUnits} ô)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quy mô hợp đồng active */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-brand-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ô đang thuê
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900">
            {occupiedUnits} <span className="text-sm font-medium text-slate-500">ô</span>
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            <span className="text-sky-600 font-medium">
              {reservedUnits} ô đang giữ chỗ
            </span>
          </div>
        </div>
      </div>

      {/* 4. Cảnh báo nợ quá hạn */}
      <div
        className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${
          overdueCount > 0 ? 'border-rose-200/80 hover:border-rose-300' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Hợp Đồng Quá Hạn
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              overdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueCount}{' '}
            <span className="text-sm font-medium text-slate-500">hợp đồng</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
            {overdueCount > 0 ? (
              <>
                <span className="text-rose-600 font-semibold font-mono">
                  {formatCurrency(overdueFee)}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-rose-600">Đôn đốc thu hồi</span>
              </>
            ) : (
              <span className="text-emerald-600 font-medium">0 rủi ro trễ hạn</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
