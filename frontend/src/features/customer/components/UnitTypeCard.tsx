import React, { useState } from 'react';
import { Ruler, Package, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import type { UnitTypeCatalog } from '@/types';
import { AvailabilityChecker } from './AvailabilityChecker';

interface UnitTypeCardProps {
  unitType: UnitTypeCatalog;
  facilityId: number;
  isFacilityActive?: boolean;
  onBook: (unitTypeId: number) => void;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' đ';
const isCC = (name: string) =>
  name.toLowerCase().includes('máy lạnh') || name.toLowerCase().includes('cc-');

export const UnitTypeCard: React.FC<UnitTypeCardProps> = ({ unitType, facilityId, isFacilityActive = true, onBook }) => {
  const [showChecker, setShowChecker] = useState(false);
  const cc = isCC(unitType.name);

  return (
    <div
      id={`unit-type-card-${unitType.id}`}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Left */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">{unitType.name}</h3>
            {cc && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                ❄ Máy lạnh
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 leading-snug">{unitType.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-slate-400" />
              {unitType.widthM}m × {unitType.depthM}m × {unitType.heightM}m
            </span>
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              {unitType.areaM2} m²
            </span>
            <span className="flex items-center gap-1">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              {unitType.totalUnits} ô kho
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="sm:text-right shrink-0 space-y-2.5">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Giá thuê / tháng</p>
            <p className="text-xl font-bold text-teal-700">{fmt(unitType.monthlyPrice)}</p>
            <p className="text-xs text-slate-400">+ cọc {fmt(unitType.monthlyPrice)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              id={`btn-book-unit-type-${unitType.id}`}
              onClick={() => isFacilityActive && onBook(unitType.id)}
              disabled={!isFacilityActive}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFacilityActive
                  ? 'bg-teal-600 text-white hover:bg-teal-700 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              }`}
            >
              {isFacilityActive ? 'Đặt chỗ ngay' : 'Tạm ngưng nhận đặt'}
            </button>
            <button
              id={`btn-toggle-checker-${unitType.id}`}
              onClick={() => setShowChecker((v) => !v)}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs text-teal-700 border border-teal-300 hover:bg-teal-50 transition-colors"
            >
              Kiểm tra phòng trống
              {showChecker ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {showChecker && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <AvailabilityChecker
            facilityId={facilityId}
            unitTypeId={unitType.id}
            unitTypeName={unitType.name}
            monthlyPrice={unitType.monthlyPrice}
          />
        </div>
      )}
    </div>
  );
};
