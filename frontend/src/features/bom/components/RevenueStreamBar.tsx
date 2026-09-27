import React from 'react';
import { PieChart, Info } from 'lucide-react';
import type { SystemRevenueReport } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface RevenueStreamBarProps {
  revenue?: SystemRevenueReport;
  isLoading?: boolean;
}

export const RevenueStreamBar: React.FC<RevenueStreamBarProps> = ({ revenue, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-slate-200 rounded w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const rental = revenue?.rentalRevenue ?? 0;
  const deposit = revenue?.depositBalance ?? 0;
  const surcharge = revenue?.surchargeRevenue ?? 0;
  const renewal = revenue?.renewalRevenue ?? 0;
  const overdue = revenue?.overdueFeeRevenue ?? 0;
  const refund = revenue?.totalRefundAmount ?? 0;
  const total = revenue?.totalRevenue ?? 0;

  // Tổng các khoản phát sinh để tính tỷ trọng
  const streamSum = rental + deposit + surcharge + renewal + overdue;

  const streams = [
    {
      id: 'rental',
      label: 'Tiền thuê kho',
      amount: rental,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      dotColor: 'bg-emerald-500',
      desc: 'Dòng tiền hợp đồng cốt lõi',
    },
    {
      id: 'deposit',
      label: 'Cọc giữ chỗ & đảm bảo',
      amount: deposit,
      color: 'bg-sky-500',
      textColor: 'text-sky-700',
      dotColor: 'bg-sky-500',
      desc: 'Khoản ký quỹ bảo đảm',
    },
    {
      id: 'surcharge',
      label: 'Phụ phí dịch vụ',
      amount: surcharge,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      dotColor: 'bg-amber-500',
      desc: 'Bốc dỡ, điện lạnh, vật tư',
    },
    {
      id: 'renewal',
      label: 'Phí gia hạn',
      amount: renewal,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700',
      dotColor: 'bg-indigo-500',
      desc: 'Hợp đồng tái tục kỳ mới',
    },
    {
      id: 'overdue',
      label: 'Phí phạt quá hạn',
      amount: overdue,
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      dotColor: 'bg-rose-500',
      desc: 'Phạt trễ hạn hợp đồng',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Bóc Tách Dòng Tiền & Cơ Cấu Doanh Thu Toàn Hệ Thống
          </h3>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Tổng phát sinh: <strong className="font-mono text-slate-900">{formatCurrency(total)}</strong></span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Làm tròn đến 1.000 đ</span>
          </div>
        </div>
      </div>

      {/* Thanh Stacked Bar phân bổ */}
      {streamSum === 0 ? (
        <div className="h-6 w-full bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 italic">
          Chưa có giao dịch phát sinh trong kỳ (US-BM-04.1)
        </div>
      ) : (
        <div className="h-6 w-full bg-slate-100 rounded-lg flex overflow-hidden shadow-inner p-0.5 gap-0.5">
          {streams.map((s) => {
            const percent = (s.amount / streamSum) * 100;
            if (percent <= 0) return null;
            return (
              <div
                key={s.id}
                style={{ width: `${percent}%` }}
                className={`${s.color} h-full transition-all rounded-sm relative group cursor-pointer`}
                title={`${s.label}: ${formatCurrency(s.amount)} (${percent.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      )}

      {/* Chú giải chi tiết từng nguồn thu */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
        {streams.map((s) => {
          const percent = streamSum > 0 ? (s.amount / streamSum) * 100 : 0;
          return (
            <div
              key={s.id}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dotColor} shrink-0`} />
                  <span className="text-xs font-semibold text-slate-700 truncate" title={s.label}>
                    {s.label}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-900">
                  {formatCurrency(s.amount)}
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/50 pt-1">
                <span>Tỷ trọng:</span>
                <span className={`font-mono font-semibold ${s.textColor}`}>
                  {percent.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dòng ghi nhận hoàn tiền */}
      {refund > 0 && (
        <div className="flex items-center justify-between text-xs px-3 py-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-amber-800">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Khoản tiền đã xử lý hoàn trả khách hàng:</span>
            <span>(Hủy lịch / thanh lý sớm / cọc dư hoàn sau kiểm tra đồ)</span>
          </div>
          <div className="font-bold font-mono text-amber-900">
            - {formatCurrency(refund)}
          </div>
        </div>
      )}
    </div>
  );
};
