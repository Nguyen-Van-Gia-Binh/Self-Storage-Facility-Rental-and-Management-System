import React from 'react';
import { DollarSign, TrendingUp, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import type { SystemRevenueReport, SystemOccupancyReport, OverdueReportResponse } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface BomKpiSummaryProps {
  revenue?: SystemRevenueReport;
  occupancy?: SystemOccupancyReport;
  overdue?: OverdueReportResponse;
  isLoading?: boolean;
}

export const BomKpiSummary: React.FC<BomKpiSummaryProps> = ({
  revenue,
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
            <div className="h-8 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const totalRev = revenue?.totalRevenue ?? 0;
  const refundAmount = revenue?.totalRefundAmount ?? 0;
  const netMrr = revenue?.mrr ?? 0;
  const activeContracts = revenue?.activeContractCount ?? 0;
  const depositLiability = revenue?.totalDepositLiability ?? 0;
  const overdueCount = overdue?.totalOverdueContracts ?? 0;
  const overdueFee = overdue?.totalAccruedFee ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Dòng tiền thực thu (Cash Flow) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dòng Tiền Thực Thu (Cash)
          </span>
          <DollarSign className="w-4 h-4 text-emerald-600 stroke-[2]" />
        </div>
        <div className="mt-3">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatCurrency(totalRev)}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-semibold font-mono">
              Tiền ra: -{formatCurrency(refundAmount)}
            </span>
            <span className="text-emerald-700 font-bold font-mono">
              Ròng: {formatCurrency(Math.max(0, totalRev - refundAmount))}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Doanh thu định kỳ (Net MRR) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-sky-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Doanh Thu Định Kỳ (MRR)
          </span>
          <TrendingUp className="w-4 h-4 text-sky-600 stroke-[2]" />
        </div>
        <div className="mt-3">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900">
            {formatCurrency(netMrr)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{activeContracts}</span> hợp đồng ACTIVE đang hiệu lực
          </div>
        </div>
      </div>

      {/* 3. Tiền cọc đang giữ (Deposit Liability) - Nợ Phải Trả */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tiền Cọc Đang Giữ
            </span>
            <div className="relative group/tip inline-flex items-center">
              <Info
                className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help transition-colors"
                aria-label="Thông tin khoản nợ ký quỹ"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/tip:block z-30 w-60 p-2.5 text-[11px] font-normal leading-relaxed text-white bg-slate-800 rounded-lg shadow-lg pointer-events-none">
                Khoản tiền ký quỹ khách đã nộp. Đây là khoản <span className="text-amber-300 font-semibold">Nợ phải trả (Liability)</span>, không được tính vào doanh thu doanh nghiệp.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-slate-400 stroke-[2]" />
        </div>
        <div className="mt-3">
          <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-700">
            {formatCurrency(depositLiability)}
          </div>
          <div className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400" />
            Nợ phải trả (Không tính vào DT)
          </div>
        </div>
      </div>

      {/* 4. Nợ quá hạn (Overdue Bad Debt Risk) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-rose-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Nợ Quá Hạn & Rủi Ro
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-500 stroke-[2]" />
        </div>
        <div className="mt-3">
          <div className={`text-2xl lg:text-3xl font-bold font-mono tabular-nums tracking-tight ${
            overdueFee > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {formatCurrency(overdueFee)}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">
            {overdueCount > 0 ? (
              <span className="text-rose-600 font-medium">
                {overdueCount} hợp đồng quá hạn cần thu hồi
              </span>
            ) : (
              <span className="text-emerald-600">Không có rủi ro nợ xấu</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
