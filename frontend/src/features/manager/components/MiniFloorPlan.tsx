import { MapPin } from 'lucide-react';
import type { StorageUnitResponse } from '@/types/unit';

interface MiniFloorPlanProps {
  currentUnit: StorageUnitResponse;
  surroundingUnits?: StorageUnitResponse[];
  onSelectUnit?: (unitId: number) => void;
}

export const MiniFloorPlan: React.FC<MiniFloorPlanProps> = ({
  currentUnit,
  surroundingUnits = [],
  onSelectUnit,
}) => {
  // Gom các ô kho cùng tầng (nếu có), nếu không có xung quanh thì tạo sơ đồ đại diện
  const floor = currentUnit.floor ?? 1;
  const sameFloorUnits = surroundingUnits.length > 0
    ? surroundingUnits.filter((u) => (u.floor ?? 1) === floor)
    : [currentUnit];

  // Nếu danh sách cùng tầng chưa chứa currentUnit, thêm vào
  const displayUnits = sameFloorUnits.some((u) => u.id === currentUnit.id)
    ? sameFloorUnits
    : [currentUnit, ...sameFloorUnits];

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-brand-600 text-white ring-4 ring-brand-500/30 font-extrabold shadow-sm scale-105 z-10';
    }
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
      case 'OCCUPIED':
        return 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
      case 'MAINTENANCE':
        return 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Sơ đồ mặt bằng Tầng {floor} — Vị trí ô kho
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-semibold">
          {currentUnit.position || 'Mặt bằng chung'}
        </span>
      </div>

      {/* Sơ đồ mặt bằng trực quan dạng ma trận */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {displayUnits.slice(0, 18).map((unit) => {
            const isCurrent = unit.id === currentUnit.id;
            return (
              <div
                key={unit.id}
                onClick={() => onSelectUnit && onSelectUnit(unit.id)}
                className={`relative p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[58px] ${getStatusColor(
                  unit.status,
                  isCurrent
                )}`}
                title={`Ô ${unit.code} (${unit.status})`}
              >
                <span className="font-mono text-xs font-bold leading-tight truncate w-full">
                  {unit.code}
                </span>
                <span className="text-[10px] mt-0.5 opacity-90 truncate w-full">
                  {isCurrent ? 'Đang chọn' : unit.position || `T${unit.floor}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chú giải (Legend) */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-600 font-medium justify-center sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-brand-600 ring-2 ring-brand-500/20" />
            <span className="font-bold text-slate-900">Ô đang xem</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span>Trống (Available)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500" />
            <span>Đang thuê (Occupied)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500" />
            <span>Bảo trì (Maintenance)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
