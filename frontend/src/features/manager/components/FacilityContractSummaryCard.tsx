// frontend/src/features/manager/components/FacilityContractSummaryCard.tsx
import React from 'react';
import {
  Building2,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityContractStats {
  total: number;
  active: number;
  pending: number; // PENDING_RETURN, PENDING_CHECK_IN
  overdue: number; // OVERDUE, TERMINATED
}

interface FacilityContractSummaryCardProps {
  facility: FacilityListItem;
  stats?: FacilityContractStats;
  onClick: () => void;
}

export const FacilityContractSummaryCard: React.FC<FacilityContractSummaryCardProps> = ({
  facility,
  stats,
  onClick,
}) => {
  const total = stats?.total ?? 0;
  const active = stats?.active ?? 0;
  const pending = stats?.pending ?? 0;
  const overdue = stats?.overdue ?? 0;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-500/70 transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Icon + Name + Code */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-white transition-all duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base truncate">
                {facility.name}
              </h3>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80 mt-1 inline-block">
                {facility.code}
              </span>
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
              facility.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {facility.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        {/* Địa chỉ cơ sở */}
        <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <p className="line-clamp-1">{facility.address || 'Chưa cập nhật địa chỉ'}</p>
        </div>

        {/* Đường phân cách */}
        <div className="my-4 border-t border-slate-100" />

        {/* Mini Stats Breakdown */}
        <div className="space-y-2 text-xs">
          {/* Tổng số hợp đồng */}
          <div className="flex items-center justify-between font-bold text-slate-900 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Tổng hợp đồng:</span>
            </div>
            <span className="font-mono text-sm">{total} HĐ</span>
          </div>

          {/* Hàng 3 mini stats có màu */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Active (Xanh lá) */}
            <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active</span>
              </div>
              <div className="font-mono font-bold text-emerald-800 text-sm mt-0.5">
                {active}
              </div>
            </div>

            {/* Chờ (Vàng cam) */}
            <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-amber-700">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Chờ xử lý</span>
              </div>
              <div className="font-mono font-bold text-amber-800 text-sm mt-0.5">
                {pending}
              </div>
            </div>

            {/* Quá hạn (Đỏ / Cam) */}
            <div className="p-2 bg-rose-50/80 rounded-xl border border-rose-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-rose-700">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Quá hạn</span>
              </div>
              <div className="font-mono font-bold text-rose-800 text-sm mt-0.5">
                {overdue}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-bold group-hover:text-brand-700">
        <span>Xem danh sách hợp đồng</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
