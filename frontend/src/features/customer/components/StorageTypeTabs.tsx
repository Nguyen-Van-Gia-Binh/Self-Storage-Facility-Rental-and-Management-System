import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import type { StorageType } from '../types';

export interface StorageTypeTabsProps {
  storageType: StorageType;
  onSelectStorageType: (type: StorageType) => void;
  standardTypesCount: number;
  climateTypesCount: number;
}

/**
 * StorageTypeTabs — Bước 2.1: Tabs chọn môi trường kho (Tiêu Chuẩn vs Máy Lạnh 24/7)
 */
export const StorageTypeTabs: React.FC<StorageTypeTabsProps> = ({
  storageType,
  onSelectStorageType,
  standardTypesCount,
  climateTypesCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      <button
        type="button"
        onClick={() => onSelectStorageType('STANDARD')}
        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
          storageType === 'STANDARD'
            ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📦</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 block">Kho Tiêu Chuẩn</span>
              <span
                className="text-slate-400 hover:text-slate-600 cursor-help"
                title="Nhiệt độ phòng thoáng khí tự nhiên, phù hợp đồ đạc gia đình, nội thất, hàng hóa thông thường"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Nhiệt độ phòng thoáng khí ({standardTypesCount} loại)
            </span>
          </div>
        </div>
        {storageType === 'STANDARD' && (
          <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSelectStorageType('CLIMATE_CONTROLLED')}
        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
          storageType === 'CLIMATE_CONTROLLED'
            ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">❄️</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-900 block">Kho Máy Lạnh (24/7)</span>
              <span
                className="text-slate-400 hover:text-slate-600 cursor-help"
                title="Kiểm soát 22°C - 25°C và độ ẩm ổn định, chuyên dụng bảo quản tài liệu, đồ gỗ cao cấp, thiết bị điện tử"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              22°C - 25°C & kiểm soát ẩm ({climateTypesCount} loại)
            </span>
          </div>
        </div>
        {storageType === 'CLIMATE_CONTROLLED' && (
          <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </button>
    </div>
  );
};
