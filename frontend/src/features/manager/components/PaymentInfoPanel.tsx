// frontend/src/features/manager/components/PaymentInfoPanel.tsx
import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';

interface PaymentInfoPanelProps {
  contract: ManagerContractItem;
}

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

export const PaymentInfoPanel: React.FC<PaymentInfoPanelProps> = ({ contract }) => {
  const monthly = contract.monthlyPrice || 0;
  const deposit = contract.depositAmount || 0;
  const months = contract.rentalMonths || 1;
  const totalRent = monthly * months;
  const totalPaid = totalRent + deposit;
  const isOverdue = contract.status === 'OVERDUE';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="border-b border-slate-100 pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Thông tin tài chính & Thanh toán
        </h3>
      </div>

      {/* 2 Khối Đơn giá và Cọc (Refactoring UI: Group related metrics side-by-side) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Đơn giá thuê / tháng</span>
          <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 block">{fmt(monthly)}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">Tiền cọc bảo chứng</span>
          <span className="text-sm font-mono font-bold text-emerald-700 mt-0.5 block">{fmt(deposit)}</span>
        </div>
      </div>

      {/* Tổng tiền đã thanh toán (Visual anchor) */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50/50 border border-brand-100/70 mb-3">
        <div>
          <span className="text-[11px] font-semibold text-brand-900/80 uppercase tracking-wider block">
            Tổng tiền đã thanh toán
          </span>
          <span className="text-[11px] text-slate-500">{months} tháng thuê + tiền cọc</span>
        </div>
        <span className="text-base font-mono font-extrabold text-brand-700">{fmt(totalPaid)}</span>
      </div>

      {/* Tình trạng thanh toán */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500 font-medium">Tình trạng thanh toán:</span>
        {isOverdue ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Nợ phí quá hạn
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã hoàn tất thanh toán
          </span>
        )}
      </div>
    </div>
  );
};
