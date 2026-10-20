import React from 'react';
import { ChevronDown } from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { StorageUnit, UnitType } from '../types';
import type { AvailabilityResponse } from '@/api/reservation';
import { UnitAccordionGrid } from './UnitAccordionGrid';

interface UnitTypeAccordionListProps {
  availableTypes: UnitType[];
  selectedTypeId: string;
  expandedTypeId: string | null;
  availabilityMap: Record<string, AvailabilityResponse>;
  displayFacilityUnits: StorageUnit[];
  selectedUnit: StorageUnit | null;
  onSelectType: (type: UnitType) => void;
  onSelectUnitOnGrid: (unit: StorageUnit) => void;
}

/**
 * Danh sách Kích thước dạng List Card Rows kèm Accordion Sơ đồ ô kho (Progressive Disclosure)
 * Tích hợp kiểm tra loại kho niêm yết (ISS-80, ISS-113) và số ô trống thời gian thực.
 */
export const UnitTypeAccordionList: React.FC<UnitTypeAccordionListProps> = ({
  availableTypes,
  selectedTypeId,
  expandedTypeId,
  availabilityMap,
  displayFacilityUnits,
  selectedUnit,
  onSelectType,
  onSelectUnitOnGrid,
}) => {
  if (availableTypes.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm">
        Hiện tại cơ sở chưa có loại ô kho nào được niêm yết giá chính thức cho danh mục này. Quý khách vui lòng chọn phân loại khác.
      </div>
    );
  }

  return (
    <div data-filter-type-id={selectedTypeId} /* filterUnitTypeId={selectedTypeId} */ className="space-y-3">
      {availableTypes.map((type) => {
        const isUnlisted = !type.baseMonthlyPrice || type.baseMonthlyPrice <= 0 || type.priceStatus === 'UNLISTED' || type.priceStatus === 'Chưa niêm yết';
        const isSelected = !isUnlisted && selectedTypeId === type.id;
        const isExpanded = isSelected && expandedTypeId === type.id;
        const avail = availabilityMap[type.id];
        const slots = avail ? avail.availableSlots : null;

        // Lọc các ô kho thuộc loại này để render trong Accordion
        const unitsForThisType = displayFacilityUnits.filter((u) => u.unitTypeId === type.id);

        return (
          <div
            key={type.id}
            className={`border-2 rounded-2xl transition-all overflow-hidden ${
              isUnlisted
                ? 'opacity-70 cursor-not-allowed border-slate-200 bg-slate-50/60'
                : isSelected
                ? 'border-[#008B74] bg-white shadow-xs ring-2 ring-[#008B74]/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
            }`}
          >
            {/* Row Header (Clickable Card) */}
            <button
              type="button"
              disabled={isUnlisted}
              title={isUnlisted ? 'Tạm chưa mở đặt' : undefined}
              onClick={() => {
                if (!isUnlisted) {
                  onSelectType(type);
                }
              }}
              className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer"
            >
              {/* Cột trái: Tên & Kích thước */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base">
                    {type.name}
                  </span>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Size {type.sizeCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {type.dimensions} • Thể tích: <strong className="text-slate-700 font-mono">{type.volumeM3} m³</strong> ({type.areaM2} m²)
                </p>
              </div>

              {/* Cột phải: Giá niêm yết, Trạng thái & Nút chọn */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <div className="text-left sm:text-right">
                  {isUnlisted ? (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Chưa niêm yết giá — Tạm chưa mở đặt
                    </span>
                  ) : (
                    <div className="text-base sm:text-lg font-black font-mono text-emerald-700">
                      {formatVND(type.baseMonthlyPrice)}
                      <span className="text-xs font-normal text-slate-500 font-sans">/tháng</span>
                    </div>
                  )}

                  <div className="text-[11px] font-bold mt-0.5">
                    {slots !== null ? (
                      slots > 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Còn {slots} ô trống
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                          Hết chỗ
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 text-[10px]">Đang kiểm tra...</span>
                    )}
                  </div>
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform ${
                  isSelected
                    ? 'bg-[#008B74] text-white border-[#008B74]'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </button>

            {/* Bước 2.3: Accordion Sơ đồ ô kho cụ thể của kích thước này */}
            {isExpanded && (
              <UnitAccordionGrid
                typeName={type.name}
                units={unitsForThisType}
                selectedUnitId={selectedUnit?.id || null}
                onSelectUnit={onSelectUnitOnGrid}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
