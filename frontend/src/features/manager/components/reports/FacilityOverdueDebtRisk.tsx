// frontend/src/features/manager/components/reports/FacilityOverdueDebtRisk.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import type { OverdueDebtReport } from '../../types/report';

interface Props {
  data: OverdueDebtReport;
  loading?: boolean;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FacilityOverdueDebtRisk: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return <div className="h-36 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  const allContracts = data.contracts || [];

  // Tính tổng tiền phạt quá hạn phát sinh tại cơ sở (tính từ các hợp đồng D+4 đến D+10)
  const totalPenaltyFee = allContracts.reduce(
    (sum, c) => sum + (c.accruedOverdueFee || 0),
    0
  );

  // Số hợp đồng đang trong giai đoạn ân hạn (D+1 đến D+3, phạt = 0đ)
  const graceContractsCount = allContracts.filter(
    (c) => c.overdueDays >= 1 && c.overdueDays <= 3
  ).length;

  // Số hợp đồng đang bị tính phạt (D+4 trở lên, 10%/ngày trên tiền cọc)
  const penalizedContractsCount = allContracts.filter(
    (c) => c.overdueDays >= 4
  ).length;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Tổng tiền phạt quá hạn tại cơ sở
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Giai đoạn D+1 đến D+3 được ân hạn miễn phạt; từ ngày D+4 đến D+10 áp dụng phạt 10%/ngày trên tiền cọc (trần tối đa 70%).
            </p>
          </div>
        </div>

        {/* Nút liên kết sang Quản lý hợp đồng */}
        <Link
          to="/manager/contracts"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shadow-xs shrink-0 self-start sm:self-center"
          title="Chuyển sang màn hình Giám sát Hợp đồng"
        >
          <span>Xem tại Quản lý hợp đồng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 1 Ô ghi tổng tiền phạt của tất cả hợp đồng tại cơ sở */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Khối chính: Tổng tiền phạt */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <span className="text-xs text-slate-500 font-medium block">
            Tổng tiền phạt phát sinh:
          </span>
          <div className="text-2xl font-black text-rose-600 my-1 font-mono">
            {formatVND(totalPenaltyFee)}
          </div>
          <p className="text-[11px] text-slate-500">
            {penalizedContractsCount > 0
              ? `${penalizedContractsCount} hợp đồng đang phát sinh tiền phạt`
              : 'Không có hợp đồng nào đang bị phạt trễ hạn'}
          </p>
        </div>

        {/* Khối phân rã tóm tắt số liệu ân hạn vs phạt */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 md:col-span-2 flex flex-col justify-between space-y-2">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Hợp đồng trong hạn ân hạn (D+1 đến D+3):</span>
              <span className="font-bold text-slate-800 font-mono">
                {graceContractsCount} hợp đồng (Miễn phạt 0 đ)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hợp đồng đang bị tính phạt (D+4 đến D+10):</span>
              <span className="font-bold text-rose-700 font-mono">
                {penalizedContractsCount} hợp đồng (Phạt 10%/ngày trên cọc)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
            Phí phạt được tính cộng dồn hàng ngày và chốt trần tối đa 70% tiền cọc bảo đảm tại mốc D+10 trước khi kích hoạt niêm phong.
          </div>
        </div>
      </div>
    </div>
  );
};
