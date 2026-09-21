import React from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { RentedContract } from '../types';

export interface CustomerRentalsKpiSummaryProps {
  contracts: RentedContract[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const CustomerRentalsKpiSummary: React.FC<CustomerRentalsKpiSummaryProps> = ({
  contracts,
  activeTab,
  onSelectTab,
}) => {
  // Tính toán các chỉ số thống kê
  const totalCount = contracts.length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const pendingCheckinCount = contracts.filter((c) => c.status === 'PENDING_CHECKIN').length;
  const attentionCount = contracts.filter(
    (c) => c.status === 'EXPIRING_SOON' || c.status === 'OVERDUE' || c.status === 'PENDING_RETURN'
  ).length;

  const totalMonthlyRent = contracts
    .filter((c) => c.status !== 'CLOSED' && c.status !== 'TERMINATED')
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0);

  const kpis = [
    {
      id: 'ALL',
      title: 'Tổng số ngăn kho',
      count: totalCount,
      subtext: `Tổng phí thuê: ${formatVND(totalMonthlyRent)}/tháng`,
      icon: Layers,
      color: 'brand',
      bgGradient: 'from-emerald-500/10 to-brand-500/5',
      borderColor: 'border-brand-200/80',
      activeBorder: 'border-brand-600 ring-2 ring-brand-500/20',
      textColor: 'text-brand-900',
      iconColor: 'text-brand-600',
    },
    {
      id: 'ACTIVE',
      title: 'Đang hoạt động',
      count: activeCount,
      subtext: 'Mã PIN & QR mở khóa đang kích hoạt 24/7',
      icon: CheckCircle2,
      color: 'emerald',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-200/80',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20',
      textColor: 'text-emerald-950',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'PENDING_CHECKIN',
      title: 'Chờ nhận kho tại quầy',
      count: pendingCheckinCount,
      subtext: 'Cần đối chiếu CCCD gốc để cấp PIN (BR-CHK-01)',
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-200/80',
      activeBorder: 'border-amber-600 ring-2 ring-amber-500/20',
      textColor: 'text-amber-950',
      iconColor: 'text-amber-600',
    },
    {
      id: 'ATTENTION',
      title: 'Cần chú ý / Gia hạn',
      count: attentionCount,
      subtext: 'Ngăn tủ sắp hết hạn, quá hạn hoặc đang hẹn trả',
      icon: AlertTriangle,
      color: 'rose',
      bgGradient: 'from-rose-500/10 to-orange-500/5',
      borderColor: 'border-rose-200/80',
      activeBorder: 'border-rose-600 ring-2 ring-rose-500/20',
      textColor: 'text-rose-950',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeTab === kpi.id;

        return (
          <div
            key={kpi.id}
            onClick={() => onSelectTab(kpi.id)}
            className={`p-4 rounded-2xl bg-gradient-to-br ${kpi.bgGradient} bg-white border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
              isSelected ? kpi.activeBorder : kpi.borderColor
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-2 rounded-xl bg-white shadow-xs ${kpi.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${kpi.textColor}`}>
                {kpi.count}
              </span>
              <span className="text-xs font-semibold text-slate-400">ngăn</span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              {kpi.subtext}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-brand-700 transition-colors">
              <span>{isSelected ? 'Đang lọc xem' : 'Bấm để lọc danh sách'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
