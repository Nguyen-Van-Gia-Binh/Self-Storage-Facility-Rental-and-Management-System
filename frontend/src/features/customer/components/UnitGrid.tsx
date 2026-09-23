import React, { useState, useMemo } from 'react';
import type { StorageUnit, UnitStatus, StorageType, UnitSizeCategory } from '../types';
import { 
  Check, 
  Lock, 
  AlertTriangle, 
  Clock, 
  DoorOpen, 
  ShieldAlert, 
  Layers, 
  Filter, 
  Wind, 
  ThermometerSnowflake,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';

interface UnitGridProps {
  units: StorageUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unit: StorageUnit) => void;
  filterType?: StorageType | 'ALL';
  filterSize?: UnitSizeCategory | 'ALL';
  onConfirmSelection?: (unit: StorageUnit) => void;
  facilityName?: string;
}

// Bảng ánh xạ màu sắc trạng thái chuẩn UI-DESIGN-SYSTEM.md § 2.2
const statusConfigMap: Record<UnitStatus, { 
  label: string; 
  badgeVariant: 'available' | 'reserved' | 'occupied' | 'maintenance' | 'overdue' | 'locked';
  cardClass: string; 
  isSelectable: boolean;
  hint: string;
}> = {
  AVAILABLE: {
    label: 'Còn trống',
    badgeVariant: 'available',
    cardClass: 'bg-white border-emerald-300 text-emerald-950 hover:border-brand-500 hover:ring-2 hover:ring-brand-500/20 hover:shadow-md cursor-pointer transition-all',
    isSelectable: true,
    hint: 'Nhấp để chọn ô kho này',
  },
  RESERVED: {
    label: 'Đang giữ 48h',
    badgeVariant: 'reserved',
    cardClass: 'bg-sky-50/60 border-sky-200 text-sky-900 cursor-not-allowed opacity-80',
    isSelectable: false,
    hint: 'Ô kho đang được giữ chỗ trực tuyến (BR-DEP-03)',
  },
  OCCUPIED: {
    label: 'Đang thuê',
    badgeVariant: 'occupied',
    cardClass: 'bg-slate-100/70 border-slate-200 text-slate-500 cursor-not-allowed opacity-65',
    isSelectable: false,
    hint: 'Đang có khách hàng lưu trữ đồ đạc',
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    badgeVariant: 'maintenance',
    cardClass: 'bg-amber-50/50 border-amber-200 text-amber-800 cursor-not-allowed opacity-75',
    isSelectable: false,
    hint: 'Đang kiểm định PCCC hoặc vệ sinh định kỳ',
  },
  OVERDUE: {
    label: 'Quá hạn',
    badgeVariant: 'overdue',
    cardClass: 'bg-red-50/40 border-red-200 text-red-700 cursor-not-allowed opacity-70',
    isSelectable: false,
    hint: 'Hợp đồng quá hạn đang xử lý',
  },
  LOCKED: {
    label: 'Khóa an ninh',
    badgeVariant: 'locked',
    cardClass: 'bg-rose-50/50 border-rose-300 text-rose-800 cursor-not-allowed opacity-70',
    isSelectable: false,
    hint: 'Khóa an ninh kiểm soát cơ sở',
  },
};

export const UnitGrid: React.FC<UnitGridProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
  filterType = 'ALL',
  filterSize = 'ALL',
  onConfirmSelection,
  facilityName,
}) => {
  // 1. Tầng hiện tại (Floor Selector)
  const availableFloors = useMemo(() => {
    const floors = Array.from(new Set(units.map((u) => u.floor))).sort((a, b) => a - b);
    return floors.length > 0 ? floors : [1];
  }, [units]);

  const [currentFloor, setCurrentFloor] = useState<number>(availableFloors[0] || 1);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  // 2. Lọc danh sách ô kho theo Tầng, Khu vực, Chế độ và Kích cỡ
  const floorUnits = useMemo(() => {
    return units.filter((u) => u.floor === currentFloor);
  }, [units, currentFloor]);

  const availableZones = useMemo(() => {
    return Array.from(new Set(floorUnits.map((u) => u.zone))).sort();
  }, [floorUnits]);

  const filteredUnits = useMemo(() => {
    return floorUnits.filter((u) => {
      if (selectedZone !== 'ALL' && u.zone !== selectedZone) return false;
      if (onlyAvailable && u.status !== 'AVAILABLE') return false;
      if (filterType !== 'ALL' && u.storageType && u.storageType !== filterType) return false;
      if (filterSize !== 'ALL' && u.sizeCategory && u.sizeCategory !== filterSize) return false;
      return true;
    });
  }, [floorUnits, selectedZone, onlyAvailable, filterType, filterSize]);

  // Thống kê nhanh theo tầng
  const totalFloorCount = floorUnits.length;
  const availableFloorCount = floorUnits.filter((u) => u.status === 'AVAILABLE').length;

  // Ô kho đang được chọn
  const activeSelectedUnit = useMemo(() => {
    return units.find((u) => u.id === selectedUnitId) || null;
  }, [units, selectedUnitId]);

  return (
    <div className="space-y-4">
      {/* 1. THANH ĐIỀU KHIỂN & BỘ LỌC MẶT BẰNG (Floor & Zone Controls) */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Floor Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-600" /> Tầng:
            </span>
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/70">
              {availableFloors.map((floor) => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setCurrentFloor(floor)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    currentFloor === floor
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tầng {floor} {floor === 1 ? '(Trệt)' : ''}
                </button>
              ))}
            </div>

            {/* Zone Filter */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setSelectedZone('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedZone === 'ALL'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả khu
              </button>
              {availableZones.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => setSelectedZone(zone)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    selectedZone === zone
                      ? 'bg-white text-brand-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filters & Stats */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
              />
              <Filter className="w-3 h-3 text-slate-400" />
              Chỉ ô còn trống
            </label>

            <div className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Còn trống: {availableFloorCount}/{totalFloorCount} ô
            </div>
          </div>
        </div>

        {/* Legend Bảng chú thích màu sắc trạng thái chuẩn UI Design System */}
        <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chú thích:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">Còn trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-400"></span>
            <span className="text-slate-500">Đang giữ 48h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span>
            <span className="text-slate-500">Đang thuê</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400"></span>
            <span className="text-slate-500">Bảo trì</span>
          </div>
        </div>
      </div>

      {/* 2. KHUNG SƠ ĐỒ MẶT BẰNG KHO TRỰC QUAN (Architectural Floorplan Container) */}
      <div className="bg-slate-50/70 p-4 sm:p-6 rounded-2xl border-2 border-slate-200/90 relative overflow-hidden">
        {/* Floorplan Title & Landmarks Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            <span className="font-bold text-sm text-[#0a1614]">
              Mặt bằng Tầng {currentFloor} — {facilityName || 'Kho Phú Mỹ Hưng'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5 text-slate-600" /> Cửa vào chính (Phía Nam)
            </span>
            <span className="hidden sm:inline-block text-slate-300">|</span>
            <span className="hidden sm:flex items-center gap-1 text-sky-700">
              <ThermometerSnowflake className="w-3.5 h-3.5" /> Dãy máy lạnh 24/7
            </span>
          </div>
        </div>


        {/* Lưới các ô kho theo mặt bằng */}
        {filteredUnits.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold">Không tìm thấy ô kho nào phù hợp với bộ lọc hiện tại.</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng thử chuyển tầng hoặc chọn "Tất cả các khu".</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredUnits.map((unit) => {
              const config = statusConfigMap[unit.status];
              const isSelected = selectedUnitId === unit.id;
              const isAC = unit.storageType === 'CLIMATE_CONTROLLED';

              return (
                <div
                  key={unit.id}
                  onClick={() => {
                    if (config.isSelectable) {
                      onSelectUnit(unit);
                    }
                  }}
                  title={config.hint}
                  className={`p-3 rounded-xl border relative flex flex-col justify-between min-h-[105px] transition-all ${
                    isSelected
                      ? 'border-brand-500 ring-3 ring-brand-500/25 bg-brand-50/70 shadow-sm scale-[1.02] z-10'
                      : config.cardClass
                  }`}
                >
                  {/* Top: Unit Code & Status Icon */}
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="font-mono font-extrabold text-sm tracking-wide text-[#0a1614] block">
                        {unit.unitNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {unit.zone}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isAC && (
                        <span title="Kho máy lạnh 22-25°C" className="text-sky-600 bg-sky-100 p-0.5 rounded">
                          <ThermometerSnowflake className="w-3 h-3" />
                        </span>
                      )}
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      ) : unit.status === 'OCCUPIED' ? (
                        <Lock className="w-3 h-3 text-slate-400" />
                      ) : unit.status === 'RESERVED' ? (
                        <Clock className="w-3 h-3 text-sky-500" />
                      ) : unit.status === 'MAINTENANCE' ? (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      ) : (unit.status === 'OVERDUE' || unit.status === 'LOCKED') ? (
                        <ShieldAlert className="w-3 h-3 text-red-500" />
                      ) : null}
                    </div>
                  </div>

                  {/* Middle: Dimensions & Specs if available */}
                  <div className="my-1.5 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1">
                    <span>{unit.areaM2 ? `${unit.areaM2} m²` : 'Loại ' + (unit.sizeCategory || 'Tiêu chuẩn')}</span>
                    {unit.monthlyPrice && (
                      <span className="font-bold text-slate-700">{formatVND(unit.monthlyPrice)}</span>
                    )}
                  </div>

                  {/* Bottom: Status Badge */}
                  <div className="flex items-center justify-between pt-0.5">
                    <Badge 
                      variant={isSelected ? 'primary' : config.badgeVariant}
                      className="text-[10px] px-2 py-0.5 font-bold"
                    >
                      {isSelected ? 'Đang chọn' : config.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. THẺ TÓM TẮT Ô KHO ĐÃ CHỌN & NÚT XÁC NHẬN (Selected Unit Drawer) */}
      {activeSelectedUnit && (
        <div className="bg-white p-4 rounded-xl border-2 border-brand-500 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Đã chọn:</span>
                <span className="text-base font-extrabold text-[#0a1614] font-mono">
                  Ngăn kho {activeSelectedUnit.unitNumber}
                </span>
                <Badge variant="available" className="text-[10px]">Tầng {activeSelectedUnit.floor} · {activeSelectedUnit.zone}</Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {activeSelectedUnit.storageType === 'CLIMATE_CONTROLLED' ? (
                  <span className="text-sky-700 font-semibold inline-flex items-center gap-1">
                    <ThermometerSnowflake className="w-3 h-3" /> Kho Máy Lạnh 24/7
                  </span>
                ) : (
                  <span className="text-slate-600 inline-flex items-center gap-1">
                    <Wind className="w-3 h-3 text-brand-600" /> Kho Tiêu Chuẩn
                  </span>
                )}
                {activeSelectedUnit.areaM2 && ` · Diện tích: ${activeSelectedUnit.areaM2} m²`}
                {activeSelectedUnit.monthlyPrice && (
                  <> · Đơn giá: <strong className="text-brand-600 font-extrabold">{formatVND(activeSelectedUnit.monthlyPrice)}</strong>/tháng</>
                )}
              </p>
            </div>
          </div>

          {onConfirmSelection && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => onConfirmSelection(activeSelectedUnit)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs shrink-0 flex items-center justify-center gap-2"
            >
              <span>Xác nhận ô kho này & Tiếp tục</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
