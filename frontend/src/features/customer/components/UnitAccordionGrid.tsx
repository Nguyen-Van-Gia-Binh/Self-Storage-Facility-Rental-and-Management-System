import React from 'react';
import type { StorageUnit } from '../types';

export interface UnitAccordionGridProps {
  typeName: string;
  units: StorageUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unit: StorageUnit) => void;
}

/**
 * UnitAccordionGrid — Sơ đồ hiển thị ma trận các ô kho con trong Accordion loại kho
 */
export const UnitAccordionGrid: React.FC<UnitAccordionGridProps> = ({
  typeName,
  units,
  selectedUnitId,
  onSelectUnit,
}) => {
  return (
    <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          Chọn vị trí ô kho cụ thể ({typeName}):
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-600 font-semibold flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
            <span>Còn trống</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#008B74]"></span>
            <span>Đang chọn</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
            <span>Giữ chỗ</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-300"></span>
            <span>Đã thuê</span>
          </span>
        </div>
      </div>

      {units.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {units.map((unit) => {
            const isUnitSelected = selectedUnitId === unit.id;
            const isAvailable = unit.status === 'AVAILABLE';
            const isReserved =
              (unit.status as string) === 'RESERVED' || (unit.status as string) === 'PENDING_PAYMENT';

            return (
              <button
                key={unit.id}
                type="button"
                disabled={!isAvailable}
                onClick={() => onSelectUnit(unit)}
                className={`p-3 rounded-xl text-center transition-all cursor-pointer border-2 flex flex-col items-center justify-center ${
                  isUnitSelected
                    ? 'bg-[#008B74] text-white border-[#006e5c] shadow-md ring-2 ring-[#008B74]/20 scale-[1.02]'
                    : isAvailable
                    ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46] hover:border-[#10b981] hover:bg-[#d1fae5]'
                    : isReserved
                    ? 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af] cursor-not-allowed opacity-70'
                    : 'bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] cursor-not-allowed opacity-60'
                }`}
              >
                <span className="text-xs font-black font-mono block">
                  {unit.unitNumber}
                </span>
                <span
                  className={`text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded block ${
                    isUnitSelected
                      ? 'bg-white/20 text-white'
                      : isAvailable
                      ? 'bg-emerald-100 text-emerald-800'
                      : isReserved
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isUnitSelected ? 'Đang chọn' : isAvailable ? 'Trống' : isReserved ? 'Giữ chỗ' : 'Đã thuê'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600">
          Hiện chưa có ô kho cụ thể nào được gán cho loại này.
        </div>
      )}

      <p className="text-[11px] text-slate-500 font-medium italic">
        💡 Hệ thống đã tự động gán ô trống khả dụng đầu tiên. Quý khách có thể click chọn ô khác trên sơ đồ để đổi vị trí.
      </p>
    </div>
  );
};
