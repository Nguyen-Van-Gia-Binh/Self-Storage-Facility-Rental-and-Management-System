// frontend/src/features/manager/components/StorageUnitMiniPanel.tsx
import React from 'react';
import { Box } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface StorageUnitMiniPanelProps {
  unitCode: string;
  unitType?: string;
  floor?: number | string;
  zone?: string;
  status?: string;
  onViewUnitDetail?: () => void;
}

export const StorageUnitMiniPanel: React.FC<StorageUnitMiniPanelProps> = ({
  unitCode,
  unitType = 'Kho Tiêu Chuẩn',
  floor = 1,
  zone = 'Khu A',
  status = 'OCCUPIED',
  onViewUnitDetail,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ô KHO LIÊN KẾT
              </span>
              <h4 className="font-mono font-bold text-sm text-slate-900">{unitCode}</h4>
            </div>
          </div>
          <StatusBadge status={status} size="sm" />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Loại ô kho:</span>
            <span className="font-semibold text-slate-800">{unitType}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Vị trí tầng / khu:</span>
            <span className="font-medium text-slate-700">
              Tầng {floor} · {zone}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Trạng thái ô:</span>
            <span className="font-semibold text-slate-800">{status}</span>
          </div>
        </div>
      </div>

      {onViewUnitDetail && (
        <button
          onClick={onViewUnitDetail}
          className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-brand-600 hover:text-brand-700 text-left transition-colors"
        >
          Xem chi tiết ô kho →
        </button>
      )}
    </div>
  );
};
