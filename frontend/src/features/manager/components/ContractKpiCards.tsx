import React from 'react';
import {
  FileCheck,
  AlertTriangle,
  Clock,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import type { ContractKpiData } from '@/types/contractManager';

interface ContractKpiCardsProps {
  kpi: ContractKpiData;
  activeTab: string;
  checkinGraceDays?: number;
  onSelectTab: (tabKey: 'ACTIVE' | 'PENDING_CHECK_IN' | 'RETURN' | 'OVERDUE') => void;
}

export const ContractKpiCards: React.FC<ContractKpiCardsProps> = ({
  kpi,
  activeTab,
  checkinGraceDays,
  onSelectTab,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Active Contracts */}
      <div
        onClick={() => onSelectTab('ACTIVE')}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm ${
          activeTab === 'ACTIVE'
            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-400/30'
            : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Đang thuê hiệu lực
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800">{kpi.activeCount}</span>
          <span className="text-xs text-slate-700">hợp đồng</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-amber-800 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {kpi.nearExpiringCount} sắp hết hạn (≤7 ngày)
          </span>
        </div>
      </div>

      {/* 2. Reservations & Pending Check-in */}
      <div
        onClick={() => onSelectTab('PENDING_CHECK_IN')}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm ${
          activeTab === 'PENDING_CHECK_IN'
            ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/30'
            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
            Chờ nhận bàn giao
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800">{kpi.pendingCheckInCount}</span>
          <span className="text-xs text-slate-700">lượt check-in</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-blue-800 font-medium">
            Ân hạn nhận kho {checkinGraceDays ?? '…'} ngày (BR-CAN-04)
          </span>
        </div>
      </div>

      {/* 3. Return & Settlement */}
      <div
        onClick={() => onSelectTab('RETURN')}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm ${
          activeTab === 'RETURN'
            ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/30'
            : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">
            Trả kho & Quyết toán
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-800">{kpi.pendingSettlementCount}</span>
          <span className="text-xs text-slate-700">hồ sơ chờ duyệt</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-purple-800 font-medium">
            Duyệt hoàn cọc trong 7 ngày
          </span>
        </div>
      </div>

      {/* 4. Overdue & Sealing Protocol */}
      <div
        onClick={() => onSelectTab('OVERDUE')}
        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 shadow-sm ${
          activeTab === 'OVERDUE'
            ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-400/30'
            : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
            Quá hạn & Niêm phong
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-600">{kpi.overdueCount}</span>
          <span className="text-xs text-slate-700">hợp đồng</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-rose-800 font-semibold">
            Nợ: {kpi.totalOverdueDebt.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>
    </div>
  );
};
