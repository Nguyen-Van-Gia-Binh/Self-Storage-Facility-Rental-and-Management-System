// frontend/src/features/manager/components/PaymentInfoPanel.tsx
import React from 'react';
import { CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <CreditCard className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Thông tin tài chính & Thanh toán
        </h3>
      </div>

      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Đơn giá thuê / tháng:</span>
          <span className="font-mono font-bold text-slate-800">{fmt(monthly)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Tiền cọc bảo chứng:</span>
          <span className="font-mono font-bold text-emerald-700">{fmt(deposit)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Tổng tiền đã thanh toán:</span>
          <span className="font-mono font-extrabold text-brand-600 text-sm">
            {fmt(totalPaid)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Tình trạng thanh toán:</span>
          {isOverdue ? (
            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Nợ phí quá hạn
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Đã hoàn tất thanh toán
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
