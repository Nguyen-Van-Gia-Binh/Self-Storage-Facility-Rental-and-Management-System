// frontend/src/features/manager/components/StorageUnitFloorPlanView.tsx
import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Wrench,
  User,
  Calendar,
  ExternalLink,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';

export interface StorageUnitFloorPlanViewProps {
  units: StorageUnitResponse[];
  contractsMap?: Record<number, ManagerContractItem>;
  currentUnitTypeId?: number;
  currentUnitTypeName?: string;
  facilityName?: string;
  startDate?: string;
  endDate?: string;
  onDateRangeChange?: (start: string, end: string) => void;
  onSelectUnit?: (unit: StorageUnitResponse) => void;
  onStatusChange?: (unit: StorageUnitResponse, status: UnitStatus) => Promise<void> | void;
}

// Helper date math & formatting
const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatVnDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.substring(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const StorageUnitFloorPlanView: React.FC<StorageUnitFloorPlanViewProps> = ({
  units,
  contractsMap = {},
  currentUnitTypeId,
  currentUnitTypeName = 'Loại ô kho',
  facilityName = 'Cơ sở lưu trữ',
  startDate,
  endDate,
  onSelectUnit,
  onStatusChange,
}) => {
  const todayStr = useMemo(() => getTodayStr(), []);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitResponse | null>(null);
  const [filterThisTypeOnly, setFilterThisTypeOnly] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Danh sách các tầng thực tế có ô kho trong dữ liệu
  const availableFloors = useMemo(() => {
    const floorSet = new Set<number>();
    units.forEach((u) => {
      floorSet.add(u.floor ?? 1);
    });
    const sorted = Array.from(floorSet).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [1, 2, 3];
  }, [units]);

  // Đảm bảo currentFloor luôn hợp lệ khi đổi danh sách
  React.useEffect(() => {
    if (availableFloors.length > 0 && !availableFloors.includes(currentFloor)) {
      setCurrentFloor(availableFloors[0]);
    }
  }, [availableFloors, currentFloor]);

  // Các ô kho thuộc tầng đang chọn
  const floorUnits = useMemo(() => {
    return units.filter((u) => (u.floor ?? 1) === currentFloor);
  }, [units, currentFloor]);

  // Tính toán trạng thái ô kho theo khoảng thời gian [startDate, endDate] hoặc thời gian thực
  const getUnitOperationalMeta = (unit: StorageUnitResponse) => {
    const contract = contractsMap[unit.id];
    let isOccupied = false;
    let note = '';

    if (unit.status === 'MAINTENANCE') {
      return {
        contract,
        status: 'MAINTENANCE' as UnitStatus,
        statusLabel: 'Bảo trì',
        note: 'Bảo trì kỹ thuật',
      };
    }

    if (contract) {
      const cStart = contract.startDate ? contract.startDate.substring(0, 10) : '';
      const cEnd = contract.endDateExclusive ? contract.endDateExclusive.substring(0, 10) : '';

      if (startDate && endDate) {
        // Giao cắt: cStart < endDate && cEnd > startDate
        isOccupied = Boolean(cStart && cEnd && cStart < endDate && cEnd > startDate);
        if (isOccupied) {
          note = `Khách ${contract.customerName} thuê đến ${formatVnDate(cEnd)}`;
        } else {
          note = `Trống trong khoảng ${formatVnDate(startDate)} - ${formatVnDate(endDate)}`;
        }
      } else if (startDate) {
        isOccupied = Boolean(cEnd && cEnd > startDate);
        if (isOccupied) {
          note = `Khách ${contract.customerName} thuê đến ${formatVnDate(cEnd)}`;
        }
      } else {
        isOccupied = unit.status === 'OCCUPIED' || Boolean(cStart && cEnd && cStart <= todayStr && cEnd > todayStr);
        if (isOccupied) {
          note = `Khách ${contract.customerName} đang thuê`;
        }
      }
    }

    const computedStatus: UnitStatus = isOccupied
      ? 'OCCUPIED'
      : (unit.status === 'RESERVED' ? 'RESERVED' : 'AVAILABLE');

    return {
      contract,
      status: computedStatus,
      statusLabel: computedStatus === 'OCCUPIED' ? 'Đang thuê' : (computedStatus === 'RESERVED' ? 'Chờ nhận kho' : 'Trống'),
      note: note || (computedStatus === 'AVAILABLE' ? 'Sẵn sàng đón khách' : ''),
    };
  };

  // Lọc theo loại kho hiện tại (nếu bật checkbox)
  const filteredFloorUnits = useMemo(() => {
    return floorUnits.filter((u) => {
      if (filterThisTypeOnly && currentUnitTypeId) {
        return u.unitTypeId === currentUnitTypeId;
      }
      return true;
    });
  }, [floorUnits, filterThisTypeOnly, currentUnitTypeId]);

  // Xác định tầng kế tiếp khi click vào Cầu thang tương tác
  const nextFloorForStaircase = useMemo(() => {
    if (availableFloors.length <= 1) return currentFloor;
    const currentIndex = availableFloors.indexOf(currentFloor);
    if (currentIndex >= availableFloors.length - 1) {
      return availableFloors[0];
    }
    return availableFloors[currentIndex + 1];
  }, [availableFloors, currentFloor]);

  const getStatusColor = (
    unit: StorageUnitResponse,
    isThisType: boolean,
    isSelected: boolean
  ) => {
    if (isSelected) {
      return 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-500/40 shadow-md scale-102 z-20 font-bold';
    }

    const borderStyle = isThisType ? 'border-2 ring-1 ring-brand-500/30' : 'border opacity-95';
    const meta = getUnitOperationalMeta(unit);

    switch (meta.status) {
      case 'AVAILABLE':
        return `bg-emerald-50/90 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 ${borderStyle}`;
      case 'OCCUPIED':
        return `bg-indigo-50/90 text-indigo-800 border-indigo-200 hover:bg-indigo-100 ${borderStyle}`;
      case 'MAINTENANCE':
        return `bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 ${borderStyle}`;
      case 'RESERVED':
        return `bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 ${borderStyle}`;
      default:
        return `bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 ${borderStyle}`;
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedUnit || !onStatusChange) return;
    const newStatus: UnitStatus = selectedUnit.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      setIsUpdatingStatus(true);
      await onStatusChange(selectedUnit, newStatus);
      setSelectedUnit((prev) => (prev ? { ...prev, status: newStatus } : null));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const selectedContract = selectedUnit ? contractsMap[selectedUnit.id] : null;
  const selectedUnitMeta = selectedUnit ? getUnitOperationalMeta(selectedUnit) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
      {/* 1. Header Toolbar Mặt bằng & Bộ chọn Tầng */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Sơ đồ Mặt bằng 2D — {facilityName}
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-mono">
              {currentUnitTypeName}
            </span>
            {startDate && endDate && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-300 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-600" />
                {formatVnDate(startDate)} → {formatVnDate(endDate)}
              </span>
            )}
          </div>
        </div>

        {/* Floor Switcher & Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs chọn Tầng */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
            {availableFloors.map((floor) => {
              const count = units.filter((u) => (u.floor ?? 1) === floor).length;
              const isActive = floor === currentFloor;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setCurrentFloor(floor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>Tầng {floor}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-brand-50 text-brand-700 font-bold' : 'bg-slate-300/80 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle Chỉ hiển thị loại kho đang chọn */}
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={filterThisTypeOnly}
              onChange={(e) => setFilterThisTypeOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-brand-500 rounded cursor-pointer"
            />
            <span>Chỉ hiện {currentUnitTypeName}</span>
          </label>
        </div>
      </div>

      {/* 2. Main Floor Plan Canvas */}
      <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4">
        {/* Layout: Cột Cầu thang tương tác + Ma trận Lưới Ô kho */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* CỘT CẦU THANG BỘ & THANG MÁY TƯƠNG TÁC (3 COLS) */}
          <div className="lg:col-span-3">
            <div
              data-testid="interactive-staircase-hub"
              onClick={() => setCurrentFloor(nextFloorForStaircase)}
              className="group relative p-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-b from-indigo-50/80 to-purple-50/80 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-500 transition-all cursor-pointer shadow-2xs flex flex-col justify-between min-h-[170px]"
              title={`Click để chuyển sang sơ đồ Tầng ${nextFloorForStaircase}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Lối chuyển tầng
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 group-hover:text-indigo-800">
                    Cầu thang bộ & Thang máy
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                    {currentFloor === 1
                      ? '↗ Click để lên sơ đồ Tầng 2'
                      : currentFloor === 2
                      ? '↗ Click để lên Tầng 3 (hoặc ↙ xuống T1)'
                      : '↙ Click để xuống lại Tầng 1'}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-indigo-200/80 flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Chuyển sang Tầng {nextFloorForStaircase}</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* MA TRẬN LƯỚI Ô KHO MẶT BẰNG (9 COLS) */}
          <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-slate-900 text-sm">Mặt bằng Tầng {currentFloor}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 text-xs">{filteredFloorUnits.length} ô kho hiển thị</span>
              </div>
              {currentFloor === 1 && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Sảnh chính & Quầy lễ tân ➔
                </span>
              )}
            </div>

            {filteredFloorUnits.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-medium space-y-1">
                <p>Không có ô kho nào phù hợp với bộ lọc tại Tầng {currentFloor}.</p>
                <p className="text-[11px] text-slate-400">Hãy thử tắt tùy chọn lọc hoặc chọn tầng khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredFloorUnits.map((unit) => {
                  const isThisType = unit.unitTypeId === currentUnitTypeId;
                  const isSelected = selectedUnit?.id === unit.id;
                  const meta = getUnitOperationalMeta(unit);

                  return (
                    <div
                      key={unit.id}
                      data-testid={`unit-tile-${unit.code}`}
                      onClick={() => setSelectedUnit(unit)}
                      className={`relative p-3 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[92px] ${getStatusColor(
                        unit,
                        isThisType,
                        isSelected
                      )}`}
                      title={`Ô ${unit.code} — ${meta.statusLabel} (${unit.unitTypeName || 'Hạng kho'})`}
                    >
                      {/* Badge Ô thuộc hạng kho đang chọn */}
                      {isThisType && !isSelected && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          Hạng xem
                        </span>
                      )}

                      {isSelected && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.2 rounded-full whitespace-nowrap shadow-xs">
                          Đang chọn
                        </span>
                      )}

                      <div className="w-full">
                        <span className="font-mono text-xs font-extrabold truncate block">
                          {unit.code}
                        </span>
                        <span className="text-[10px] opacity-80 truncate block mt-0.5">
                          {unit.unitTypeName || unit.position || `Tầng ${unit.floor}`}
                        </span>
                      </div>

                      {/* Hiển thị Nhãn trạng thái */}
                      <span className={`text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-md uppercase tracking-tight ${
                        meta.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : meta.status === 'OCCUPIED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : meta.status === 'MAINTENANCE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {meta.statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Panel Chi tiết Ô kho đang chọn (Selected Unit Inspector Drawer) */}
        {selectedUnit && selectedUnitMeta && (
          <div
            data-testid="selected-unit-inspector-drawer"
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-300 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                  {selectedUnit.code}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900">
                      Ô kho {selectedUnit.code}
                    </h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedUnitMeta.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedUnitMeta.status === 'OCCUPIED'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : selectedUnitMeta.status === 'MAINTENANCE'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {selectedUnitMeta.statusLabel}
                    </span>
                    {selectedUnit.unitTypeId === currentUnitTypeId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        Thuộc {currentUnitTypeName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedUnit.unitTypeName || 'Hạng chuẩn'} • Tầng {selectedUnit.floor} • {selectedUnit.locationNote || selectedUnit.position || 'Vị trí tiêu chuẩn'}
                  </p>

                  {/* Hợp đồng hiện hành nếu có */}
                  {selectedContract && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {selectedContract.customerName} ({selectedContract.customerPhone})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Kỳ hạn: <strong>{formatVnDate(selectedContract.startDate)}</strong> → <strong className="text-slate-800">{formatVnDate(selectedContract.endDateExclusive)}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions cho FM */}
              <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
                {onStatusChange && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus || selectedUnitMeta.status === 'OCCUPIED' || selectedUnitMeta.status === 'RESERVED'}
                    onClick={handleToggleMaintenance}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      selectedUnit.status === 'MAINTENANCE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                    title={
                      selectedUnitMeta.status === 'OCCUPIED' || selectedUnitMeta.status === 'RESERVED'
                        ? 'Ô kho đang có khách thuê/giữ chỗ — không thể đổi trạng thái'
                        : undefined
                    }
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{selectedUnit.status === 'MAINTENANCE' ? 'Hoàn tất bảo trì' : 'Đưa vào bảo trì'}</span>
                  </button>
                )}

                {onSelectUnit && (
                  <button
                    type="button"
                    onClick={() => onSelectUnit(selectedUnit)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Chi tiết ô kho</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin trạng thái chi tiết */}
            <div className="pt-2 border-t border-slate-100">
              {startDate && endDate ? (
                <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-purple-950">
                      Khoảng thời gian {formatVnDate(startDate)} → {formatVnDate(endDate)}:
                    </span>
                    <p className="mt-0.5 text-purple-800 leading-relaxed">
                      Tình trạng: <strong>{selectedUnitMeta.statusLabel}</strong>
                      {selectedUnitMeta.note ? ` — ${selectedUnitMeta.note}` : ''}.
                    </p>
                  </div>
                </div>
              ) : selectedUnitMeta.status === 'AVAILABLE' ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-950">
                      Ô kho đang trống & sẵn sàng hoạt động:
                    </span>
                    <p className="mt-0.5 text-emerald-800 leading-relaxed">
                      Chưa có hợp đồng thuê phát sinh. Sẵn sàng gán cho khách hàng đặt mới.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
