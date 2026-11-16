// frontend/src/features/manager/components/OverdueAlertBanner.tsx
import React from 'react';
import { AlertTriangle, Receipt, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
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
}) => {
  const overdueDays = contract.overdueDays || 1;
  const deposit = contract.depositAmount || contract.monthlyPrice || 800000;
  // BR-OVD-02..07: D+1..D+3 = 5% cọc/ngày (15%), D+4..D+7 = +10% cọc/ngày (trần 55% cọc + 45% phí niêm phong Kho Tổng = 100% cọc)
  const stage1Days = Math.min(3, Math.max(0, overdueDays));
  const stage2Days = Math.min(4, Math.max(0, overdueDays - 3));
  const fallbackFee = Math.round(deposit * (stage1Days * 0.05 + stage2Days * 0.10));
  const accruedFee =
    contract.accruedOverdueFee !== undefined && contract.accruedOverdueFee !== null
      ? contract.accruedOverdueFee
      : fallbackFee;
  const remainingDeposit = overdueDays >= 7 ? 0 : Math.max(0, deposit - accruedFee);
  const isOverduePaid =
    contract.accruedOverdueFee !== undefined &&
    contract.accruedOverdueFee !== null &&
    contract.accruedOverdueFee <= 0;

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 shadow-2xs">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wide">
              Cảnh báo quá hạn
            </h3>
            <span className="text-xs num font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300/60">
              D+{overdueDays}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-md">
              <Lock className="w-3 h-3 text-rose-600" />
              Đã khóa mã PIN
            </span>
          </div>

          <p className="text-xs text-amber-900/80 mt-1">
            Hợp đồng quá hạn từ ngày <strong className="font-semibold text-amber-950">{contract.endDateExclusive || 'gần đây'}</strong>. Chế tài cưỡng chế về Kho Tổng tự động kích hoạt tại mốc <strong className="font-semibold text-rose-700">D+7</strong> nếu khách không tất toán.
          </p>

          {/* 3 Thẻ thống kê tài chính gọn gàng (Equal height & clean metrics) */}
          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/95 p-3.5 rounded-xl border border-amber-200/90 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Thời gian</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
                <span>{overdueDays} ngày</span>
                <span className="text-xs num font-bold text-amber-700">(D+{overdueDays})</span>
              </div>
            </div>

            <div className="bg-white/95 p-3.5 rounded-xl border border-amber-200/90 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Phí tích lũy</span>
              <div className="text-base num font-extrabold text-rose-600 mt-0.5">
                {fmt(accruedFee)}
              </div>
            </div>

            <div className="bg-white/95 p-3.5 rounded-xl border border-amber-200/90 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Cọc khả dụng</span>
              <div className="text-base num font-extrabold text-emerald-700 mt-0.5">
                {fmt(remainingDeposit)}
              </div>
            </div>
          </div>

          {/* Chân banner: Chế tài & Nút hành động */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-amber-200/70">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              {isOverduePaid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Đã tất toán nợ:</strong> Cấp PIN tạm trong ngày để khách dọn kho và báo trả.
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Chờ khách nộp phạt trên app hoặc cưỡng chế niêm phong tại <strong>D+7</strong>.
                  </span>
                </>
              )}
            </div>

            {onPayPenalty && (
              <button
                type="button"
                onClick={onPayPenalty}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-amber-100/60 text-slate-900 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                <span>Xem chi tiết công nợ & khấu trừ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
