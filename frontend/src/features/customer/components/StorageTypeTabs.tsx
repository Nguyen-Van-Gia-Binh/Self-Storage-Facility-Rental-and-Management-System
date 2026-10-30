import React from 'react';
import { Check } from 'lucide-react';
import type { StorageType } from '../types';

export interface StorageTypeTabsProps {
  storageType: StorageType | null;
  onSelectStorageType: (type: StorageType) => void;
  standardTypesCount: number;
  climateTypesCount: number;
}

/**
 * StorageTypeTabs — Bước 2.1: Chọn môi trường kho (Kho Tiêu Chuẩn vs Kho Máy Lạnh)
 * Khi mới vào trang: cả 2 tab đều ở trạng thái chưa chọn để khách hàng chủ động click.
 */
export const StorageTypeTabs: React.FC<StorageTypeTabsProps> = ({
  storageType,
  onSelectStorageType,
  standardTypesCount: _standardTypesCount,
  climateTypesCount: _climateTypesCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* Kho Tiêu Chuẩn */}
      <button
        type="button"
        onClick={() => onSelectStorageType('STANDARD')}
        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
          storageType === 'STANDARD'
            ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-900 block">Kho Tiêu Chuẩn</span>
            <span className="text-[11px] text-slate-500 block">
              Nhiệt độ phòng thoáng khí • Đồ gia dụng, nội thất
            </span>
          </div>
        </div>
        {storageType === 'STANDARD' && (
          <div className="w-5 h-5 rounded-full bg-[#008B74] text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </button>

      {/* Kho Máy Lạnh */}
      <button
        type="button"
        onClick={() => onSelectStorageType('CLIMATE_CONTROLLED')}
        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
          storageType === 'CLIMATE_CONTROLLED'
            ? 'border-[#008B74] bg-[#e6f7f4] shadow-xs ring-2 ring-[#008B74]/20'
            : 'border-slate-200 hover:border-slate-300 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">❄️</span>
          <div className="space-y-0.5">
            <span className="text-sm font-black text-slate-900 block">Kho Máy Lạnh</span>
            <span className="text-[11px] text-slate-500 block">
              Kiểm soát ẩm 22–25°C • Tài liệu, đồ da, điện tử
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
