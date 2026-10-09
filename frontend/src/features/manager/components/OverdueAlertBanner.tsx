// frontend/src/features/manager/components/OverdueAlertBanner.tsx
import React from 'react';
import { AlertTriangle, CreditCard, ClipboardList } from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';

interface OverdueAlertBannerProps {
  contract: ManagerContractItem;
  onPayPenalty?: () => void;
  onRequestReturn?: () => void;
}

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  contract,
  onPayPenalty,
  onRequestReturn,
}) => {
  const overdueDays = contract.overdueDays || 1;
  const dailyPenalty = Math.round((contract.monthlyPrice || 800000) / 30);
  const accruedFee = contract.accruedOverdueFee || overdueDays * dailyPenalty;
  const deposit = contract.depositAmount || 0;
  const remainingDeposit = Math.max(0, deposit - accruedFee);

  return (
    <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-orange-950 uppercase tracking-wide">
              Cảnh báo quá hạn (Overdue)
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-orange-200/80 text-orange-900">
              D+{overdueDays}
            </span>
          </div>

          <p className="text-xs text-orange-800 mt-1">
            Hợp đồng đã quá hạn thuê từ ngày{' '}
            <strong>{contract.endDateExclusive || 'gần đây'}</strong>. Hệ thống tự động tính phí phạt
            quá hạn mỗi ngày và khóa mã truy cập vào mốc D+7 (BR-OVD-05).
          </p>

          {/* Chi tiết công nợ phạt */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-orange-200">
              <span className="text-slate-500 block text-[11px]">Số ngày quá hạn</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {overdueDays} ngày (D+{overdueDays})
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-orange-200">
              <span className="text-slate-500 block text-[11px]">Phí phạt tích lũy</span>
              <span className="font-mono font-bold text-rose-600 text-sm mt-0.5 block">
                {fmt(accruedFee)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                ({overdueDays} ngày × ~{fmt(dailyPenalty)}/ngày)
              </span>
            </div>

            <div className="bg-white/80 p-3 rounded-xl border border-orange-200">
              <span className="text-slate-500 block text-[11px]">Cọc còn lại sau phạt</span>
              <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                {fmt(remainingDeposit)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onPayPenalty && (
              <button
                type="button"
                onClick={onPayPenalty}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Đóng nợ phạt quá hạn</span>
              </button>
            )}

            {onRequestReturn && (
              <button
                type="button"
                onClick={onRequestReturn}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-900 border border-orange-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-orange-600" />
                <span>Báo trả kho & Tất toán</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
