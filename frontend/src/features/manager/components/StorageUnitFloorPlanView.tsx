// frontend/src/features/manager/components/StorageUnitFloorPlanView.tsx
import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  Wrench,
  User,
  Calendar,
  ChevronRight,
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

  React.useEffect(() => {
    if (availableFloors.length > 0 && !availableFloors.includes(currentFloor)) {
      setCurrentFloor(availableFloors[0]);
    }
  }, [availableFloors, currentFloor]);

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
        tileLabel: 'BẢO TRÌ',
        note: 'Đang bảo trì kỹ thuật',
      };
    }

    if (contract) {
      const cStart = contract.startDate ? contract.startDate.substring(0, 10) : '';
      const cEnd = contract.endDateExclusive ? contract.endDateExclusive.substring(0, 10) : '';

      if (startDate && endDate) {
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
        isOccupied =
          unit.status === 'OCCUPIED' ||
          Boolean(cStart && cEnd && cStart <= todayStr && cEnd > todayStr);
        if (isOccupied) {
          note = `Khách ${contract.customerName} đang thuê`;
        }
      }
    }

    const computedStatus: UnitStatus = isOccupied
      ? 'OCCUPIED'
      : unit.status === 'RESERVED'
        ? 'RESERVED'
        : 'AVAILABLE';

    return {
      contract,
      status: computedStatus,
      statusLabel:
        computedStatus === 'OCCUPIED'
          ? 'Đang thuê'
          : computedStatus === 'RESERVED'
            ? 'Chờ nhận kho'
            : 'Đang trống',
      tileLabel:
        computedStatus === 'OCCUPIED'
          ? 'ĐANG THUÊ'
          : computedStatus === 'RESERVED'
            ? 'CHỜ NHẬN'
            : 'TRỐNG',
      note: note || (computedStatus === 'AVAILABLE' ? 'Sẵn sàng cho thuê' : ''),
    };
  };

  const filteredFloorUnits = useMemo(() => {
    return floorUnits.filter((u) => {
      if (filterThisTypeOnly && currentUnitTypeId) {
        return u.unitTypeId === currentUnitTypeId;
      }
      return true;
    });
  }, [floorUnits, filterThisTypeOnly, currentUnitTypeId]);

  const nextFloorForStaircase = useMemo(() => {
    if (availableFloors.length <= 1) return currentFloor;
    const currentIndex = availableFloors.indexOf(currentFloor);
    if (currentIndex >= availableFloors.length - 1) {
      return availableFloors[0];
    }
    return availableFloors[currentIndex + 1];
  }, [availableFloors, currentFloor]);

  const getTileClasses = (status: UnitStatus, isSelected: boolean) => {
    if (isSelected) {
      return 'border-2 border-brand-500 bg-brand-50 shadow-xs';
    }
    switch (status) {
      case 'AVAILABLE':
        return 'border border-gray-200 bg-white hover:border-brand-400 hover:shadow-xs';
      case 'OCCUPIED':
        return 'border border-gray-200 bg-gray-50 hover:border-gray-300';
      case 'RESERVED':
        return 'border border-gray-200 bg-white hover:border-amber-300';
      case 'MAINTENANCE':
        return 'border border-gray-200 bg-gray-50 opacity-65 hover:opacity-100';
      default:
        return 'border border-gray-200 bg-white hover:border-gray-300';
    }
  };

  const getTileStatusVisual = (status: UnitStatus, isSelected: boolean) => {
    if (status === 'AVAILABLE') {
      return isSelected
        ? { text: 'text-brand-700', dot: 'bg-brand-500' }
        : { text: 'text-gray-500', dot: 'bg-gray-300' };
    }
    if (status === 'OCCUPIED') {
      return { text: 'text-blue-700', dot: 'bg-blue-500' };
    }
    if (status === 'RESERVED') {
      return { text: 'text-amber-700', dot: 'bg-amber-500' };
    }
    return { text: 'text-gray-500', dot: 'bg-gray-400' };
  };

  const getBadgeClasses = (status: UnitStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OCCUPIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MAINTENANCE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleToggleMaintenance = async () => {
    if (!selectedUnit || !onStatusChange) return;
    const newStatus: UnitStatus =
      selectedUnit.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* 1. Header Toolbar Mặt bằng & Bộ chọn Tầng */}
      <div className="px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-base font-bold text-gray-900 tracking-tight">
            Sơ đồ Mặt bằng 2D — {facilityName}
          </h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
            {currentUnitTypeName}
          </span>
          {startDate && endDate && (
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 tabular-nums inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatVnDate(startDate)} - {formatVnDate(endDate)}
            </span>
          )}
        </div>

        {/* Floor Switcher & Filter Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg border border-gray-200">
            {availableFloors.map((floor) => {
              const count = units.filter((u) => (u.floor ?? 1) === floor).length;
              const isActive = floor === currentFloor;
              return (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setCurrentFloor(floor)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>Tầng {floor}</span>
                  <span
                    className={`text-[11px] tabular-nums ${
                      isActive ? 'text-brand-600 font-bold' : 'text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={filterThisTypeOnly}
              onChange={(e) => setFilterThisTypeOnly(e.target.checked)}
              className="w-3.5 h-3.5 accent-brand-600 rounded cursor-pointer"
            />
            <span>Chỉ hiện {currentUnitTypeName}</span>
          </label>
        </div>
      </div>

      {/* 2. Floor Plan Canvas (Full-width, sạch, không cột tím cầu thang) */}
      <div className="p-5 space-y-4">
        {/* Sub-header: Tiêu đề Tầng bên trái + Điểm neo Cầu thang nhỏ gọn bên phải */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-gray-900 uppercase tracking-wide text-xs">
              Mặt bằng Tầng {currentFloor}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500 tabular-nums">
              {filteredFloorUnits.length} ô kho hiển thị
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentFloor === 1 && (
              <span className="text-xs text-gray-400">
                Sảnh chính & Quầy lễ tân
              </span>
            )}
            <button
              type="button"
              data-testid="interactive-staircase-hub"
              onClick={() => setCurrentFloor(nextFloorForStaircase)}
              title={
                availableFloors.length > 1
                  ? `Điểm neo mặt bằng · Click để chuyển sang Tầng ${nextFloorForStaircase}`
                  : 'Điểm neo: Cầu thang bộ & Thang máy'
              }
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Điểm neo: Cầu thang bộ & Thang máy
                {availableFloors.length > 1 ? ` (→ Tầng ${nextFloorForStaircase})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Unit Grid */}
        {filteredFloorUnits.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">
              Không có ô kho nào phù hợp với bộ lọc tại Tầng {currentFloor}.
            </p>
            <p className="text-xs text-gray-400">
              Hãy thử tắt tùy chọn lọc hoặc chọn tầng khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredFloorUnits.map((unit) => {
              const isThisType = unit.unitTypeId === currentUnitTypeId;
              const isSelected = selectedUnit?.id === unit.id;
              const meta = getUnitOperationalMeta(unit);
              const visual = getTileStatusVisual(meta.status, isSelected);

              return (
                <button
                  key={unit.id}
                  type="button"
                  data-testid={`unit-tile-${unit.code}`}
                  onClick={() => setSelectedUnit(unit)}
                  className={`flex flex-col p-3 rounded-lg text-left transition-all w-full min-h-[92px] cursor-pointer ${getTileClasses(
                    meta.status,
                    isSelected
                  )}`}
                  title={`Ô ${unit.code} — ${meta.statusLabel} (${unit.unitTypeName || 'Hạng kho'})`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span
                      className={`font-mono font-bold text-sm truncate ${
                        meta.status === 'MAINTENANCE' && !isSelected
                          ? 'text-gray-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {unit.code}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-semibold text-brand-700 shrink-0">
                        Đang chọn
                      </span>
                    ) : isThisType ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"
                        title={`Thuộc ${currentUnitTypeName}`}
                      />
                    ) : null}
                  </div>

                  <span
                    className={`text-xs truncate mt-0.5 mb-3 w-full ${
                      isSelected ? 'text-gray-700' : 'text-gray-500'
                    }`}
                  >
                    {unit.unitTypeName || unit.position || `Tầng ${unit.floor}`}
                  </span>

                  <div className="mt-auto flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] font-semibold inline-flex items-center gap-1.5 ${visual.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${visual.dot}`} />
                      {meta.tileLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Flattened Bottom Inspector Panel (Không hộp lồng hộp, nút đồng bộ bên phải) */}
      {selectedUnit && selectedUnitMeta && (
        <div
          data-testid="selected-unit-inspector-drawer"
          className="bg-white border-t-2 border-brand-500 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          {/* Thông tin ô kho bên trái */}
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-md text-sm font-mono font-bold text-gray-900 tracking-wider shrink-0">
              {selectedUnit.code}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-gray-900">
                  {selectedUnit.unitTypeName || `Ô kho ${selectedUnit.code}`}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded border ${getBadgeClasses(
                    selectedUnitMeta.status
                  )}`}
                >
                  {selectedUnitMeta.statusLabel}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Tầng {selectedUnit.floor}
                {selectedUnit.position ? ` · ${selectedUnit.position}` : ''}
                {selectedUnit.locationNote ? ` · ${selectedUnit.locationNote}` : ''}
                {selectedUnitMeta.note ? ` · ${selectedUnitMeta.note}` : ''}
              </p>

              {selectedContract && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1 font-medium text-gray-800">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {selectedContract.customerName} ({selectedContract.customerPhone})
                  </span>
                  <span className="text-gray-300">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatVnDate(selectedContract.startDate)} -{' '}
                    {formatVnDate(selectedContract.endDateExclusive)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nút thao tác bên phải — Bảo trì (Outline Đỏ) + Chi tiết (Primary Solid Mint) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onStatusChange && (
              <button
                type="button"
                disabled={
                  isUpdatingStatus ||
                  selectedUnitMeta.status === 'OCCUPIED' ||
                  selectedUnitMeta.status === 'RESERVED'
                }
                onClick={handleToggleMaintenance}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  selectedUnit.status === 'MAINTENANCE'
                    ? 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    : 'bg-white border border-rose-300 text-rose-600 hover:bg-rose-50'
                }`}
                title={
                  selectedUnitMeta.status === 'OCCUPIED' ||
                  selectedUnitMeta.status === 'RESERVED'
                    ? 'Ô kho đang có khách thuê/giữ chỗ — không thể đổi trạng thái'
                    : undefined
                }
              >
                <Wrench className="w-4 h-4" />
                <span>
                  {selectedUnit.status === 'MAINTENANCE' ? 'Hoàn tất bảo trì' : 'Đưa vào bảo trì'}
                </span>
              </button>
            )}

            {onSelectUnit && (
              <button
                type="button"
                onClick={() => onSelectUnit(selectedUnit)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Chi tiết ô kho</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
