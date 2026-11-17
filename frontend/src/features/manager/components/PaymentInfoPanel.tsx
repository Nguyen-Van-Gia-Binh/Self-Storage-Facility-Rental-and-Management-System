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
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        Thông tin Tài chính
      </h3>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Đơn giá thuê / tháng:</span>
          <span className="font-medium text-gray-900 tabular-nums">{fmt(monthly)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Tiền cọc bảo đảm:</span>
          <span className="font-medium text-gray-900 tabular-nums">{fmt(deposit)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-500">Kỳ hạn thanh toán:</span>
          <span className="font-medium text-gray-900 tabular-nums">{months} tháng</span>
        </div>

        <hr className="border-gray-100 my-3" />

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-gray-900">Tổng đã thanh toán:</span>
            <span className="text-lg font-bold text-brand-600 tabular-nums">{fmt(totalPaid)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{months} tháng thuê + tiền cọc</p>
        </div>

        <div className="pt-2">
          {isOverdue ? (
            <div className="w-full py-2 px-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Nợ phí quá hạn</span>
            </div>
          ) : (
            <div className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Đã hoàn tất thanh toán</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
