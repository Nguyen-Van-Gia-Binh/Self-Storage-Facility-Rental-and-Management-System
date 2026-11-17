import React from 'react';
import { Package, Snowflake, Check } from 'lucide-react';
import type { StorageType } from '../types';

export interface StorageTypeTabsProps {
  storageType: StorageType | null;
  onSelectStorageType: (type: StorageType) => void;
  standardTypesCount: number;
  climateTypesCount: number;
}

/**
 * StorageTypeTabs — Bước 2.1: Chọn môi trường kho (Kho Tiêu Chuẩn vs Kho Máy Lạnh)
 * Thiết kế Card trực quan, icon avatar nổi bật, phản hồi hover/active rõ ràng.
 */
export const StorageTypeTabs: React.FC<StorageTypeTabsProps> = ({
  storageType,
  onSelectStorageType,
  standardTypesCount: _standardTypesCount,
  climateTypesCount: _climateTypesCount,
}) => {
  const isStandardActive = storageType === 'STANDARD';
  const isClimateActive = storageType === 'CLIMATE_CONTROLLED';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Thẻ 1: Kho Tiêu Chuẩn */}
      <button
        type="button"
        onClick={() => onSelectStorageType('STANDARD')}
        className={`group flex items-start justify-between p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
          isStandardActive
            ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-2 ring-brand-500/15'
            : 'border-slate-200 hover:border-brand-300 bg-white hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isStandardActive
                ? 'bg-brand-100 text-brand-700'
                : 'bg-slate-100 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600'
            }`}
          >
            <Package className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
              Kho Tiêu Chuẩn
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nhiệt độ phòng thoáng khí • Đồ gia dụng, nội thất
            </p>
          </div>
        </div>

        {isStandardActive && (
          <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </button>

      {/* Thẻ 2: Kho Máy Lạnh */}
      <button
        type="button"
        onClick={() => onSelectStorageType('CLIMATE_CONTROLLED')}
        className={`group flex items-start justify-between p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
          isClimateActive
            ? 'border-brand-500 bg-brand-50/40 shadow-xs ring-2 ring-brand-500/15'
            : 'border-slate-200 hover:border-brand-300 bg-white hover:bg-slate-50/50'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isClimateActive
                ? 'bg-sky-100 text-sky-700'
                : 'bg-slate-100 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600'
            }`}
          >
            <Snowflake className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
              Kho Máy Lạnh
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kiểm soát ẩm 22–25°C • Tài liệu, đồ da, điện tử
            </p>
          </div>
        </div>

        {isClimateActive && (
          <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        )}
      </button>
    </div>
  );
};
