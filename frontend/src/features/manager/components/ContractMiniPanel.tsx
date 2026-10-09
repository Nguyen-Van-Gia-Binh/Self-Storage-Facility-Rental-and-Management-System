// frontend/src/features/manager/components/ContractMiniPanel.tsx
import React from 'react';
import { FileCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ContractMiniPanelProps {
  contractCode?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  onViewContractDetail?: () => void;
}

export const ContractMiniPanel: React.FC<ContractMiniPanelProps> = ({
  contractCode,
  startDate,
  endDate,
  status = 'ACTIVE',
  onViewContractDetail,
}) => {
  if (!contractCode) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-center items-center text-center text-slate-400 text-xs">
        <FileCheck className="w-8 h-8 text-slate-300 mb-2" />
        <span>Sự cố không gắn với hợp đồng thuê cụ thể</span>
      </div>
    );
  }

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('vi-VN');
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                HỢP ĐỒNG THUÊ
              </span>
              <h4 className="font-mono font-bold text-sm text-slate-900">{contractCode}</h4>
            </div>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Ngày bắt đầu thuê:</span>
            <span className="font-medium text-slate-800">{fmtDate(startDate)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Hạn hợp đồng:</span>
            <span className="font-medium text-slate-800">{fmtDate(endDate)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Tình trạng hợp đồng:</span>
            <span className="font-semibold text-emerald-600">Đang hiệu lực (Active)</span>
          </div>
        </div>
      </div>

      {onViewContractDetail && (
        <button
          onClick={onViewContractDetail}
          className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-brand-600 hover:text-brand-700 text-left transition-colors"
        >
          Xem chi tiết hợp đồng →
        </button>
      )}
    </div>
  );
};
