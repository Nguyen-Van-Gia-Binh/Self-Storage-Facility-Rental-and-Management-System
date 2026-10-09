import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import type { RentedContract } from '../types';

export interface CustomerRentalsKpiSummaryProps {
  contracts: RentedContract[];
  pendingReservationsCount?: number;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const CustomerRentalsKpiSummary: React.FC<CustomerRentalsKpiSummaryProps> = ({
  contracts,
  pendingReservationsCount = 0,
  activeTab,
  onSelectTab,
}) => {
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const pendingCheckinCount = contracts.filter(
    (c) => c.status === 'PENDING_CHECKIN' || (c.status as string) === 'PENDING_CHECK_IN'
  ).length;
  const attentionCount = contracts.filter(
    (c) => c.status === 'EXPIRING_SOON' || c.status === 'OVERDUE' || c.status === 'PENDING_RETURN'
  ).length;

  const bentoTiles = [
    {
      id: 'ACTIVE',
      label: 'Đang hoạt động',
      count: activeCount,
      unitLabel: 'ô kho',
      badgeText: 'Mã PIN 24/7',
      dotColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700',
      badgeIcon: CheckCircle2,
      countColor: 'text-slate-900',
    },
    {
      id: 'ATTENTION',
      label: 'Cần gia hạn',
      count: attentionCount,
      unitLabel: 'ô kho',
      badgeText: 'Sắp hết hạn',
      dotColor: attentionCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300',
      badgeBg: attentionCount > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-500',
      badgeIcon: AlertTriangle,
      countColor: attentionCount > 0 ? 'text-amber-600' : 'text-slate-900',
    },
    {
      id: 'PENDING_CHECKIN',
      label: 'Chờ nhận kho',
      count: pendingCheckinCount,
      unitLabel: 'ô kho',
      badgeText: 'Đã cọc thành công',
      dotColor: 'bg-sky-500',
      badgeBg: 'bg-sky-50 text-sky-800',
      badgeIcon: Clock,
      countColor: 'text-slate-900',
    },
    {
      id: 'PENDING_PAYMENT',
      label: 'Giữ chỗ 48h',
      count: pendingReservationsCount,
      unitLabel: 'đơn',
      badgeText: 'Chờ thanh toán',
      dotColor: pendingReservationsCount > 0 ? 'bg-rose-500' : 'bg-slate-300',
      badgeBg: pendingReservationsCount > 0 ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-500',
      badgeIcon: CreditCard,
      countColor: pendingReservationsCount > 0 ? 'text-rose-600' : 'text-slate-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
      {bentoTiles.map((tile) => {
        const isSelected = activeTab === tile.id;
        const BadgeIcon = tile.badgeIcon;

        return (
          <button
            key={tile.id}
            type="button"
            onClick={() => onSelectTab(tile.id)}
            className={`text-left p-3.5 sm:p-4 rounded-2xl bg-white transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
              isSelected
                ? 'border-2 border-brand-500 ring-2 ring-brand-500/10'
                : 'border border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={`text-xs font-bold transition-colors ${
                  isSelected ? 'text-brand-700' : 'text-slate-600 group-hover:text-slate-900'
                }`}
              >
                {tile.label}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${tile.dotColor}`} />
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${tile.countColor}`}>
                {tile.count}
              </span>
              <span className="text-xs font-semibold text-slate-400">{tile.unitLabel}</span>
            </div>

            <div
              className={`mt-2 text-[11px] font-medium px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${tile.badgeBg}`}
            >
              <BadgeIcon className="w-3 h-3 shrink-0" />
              <span className="truncate">{tile.badgeText}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
