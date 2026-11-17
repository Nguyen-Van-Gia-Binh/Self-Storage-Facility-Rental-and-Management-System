import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  DoorOpen,
} from 'lucide-react';
import type { StorageUnitResponse, UnitTypeResponse } from '@/types/unit';
import { fetchStorageUnits, fetchUnitTypes } from '@/api/unit';

export interface FacilityFloorPlanMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: number;
  facilityName?: string;
  highlightUnitId?: number;
  allowedUnitTypeId?: number;
  targetUnitTypeName?: string;
  onSelectUnit?: (unit: StorageUnitResponse) => void;
  initialUnits?: StorageUnitResponse[];
}

export const FacilityFloorPlanMapModal: React.FC<FacilityFloorPlanMapModalProps> = ({
  isOpen,
  onClose,
  facilityId,
  facilityName = 'Cơ sở lưu trữ',
  highlightUnitId,
  allowedUnitTypeId,
  targetUnitTypeName,
  onSelectUnit,
  initialUnits,
}) => {
  const [units, setUnits] = useState<StorageUnitResponse[]>(initialUnits || []);
  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialUnits);
  const [error, setError] = useState<string | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const isPickerMode = Boolean(onSelectUnit);

  // Nạp danh mục các loại kho của cơ sở để xác định môi trường & diện tích
  useEffect(() => {
    if (!isOpen || !facilityId) return;
    let active = true;
    fetchUnitTypes(facilityId, { size: 100 })
      .then((res) => {
        if (active) {
          setUnitTypes(res.content || []);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, facilityId]);

  // Tải dữ liệu các ô kho của cơ sở
  useEffect(() => {
    if (!isOpen) return;

    if (initialUnits && initialUnits.length > 0) {
      setUnits(initialUnits);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setUnits([]);

    fetchStorageUnits(facilityId, { page: 0, size: 500 })
      .then((res) => {
        if (!active) return;
        const list = res.content || [];
        setUnits(list);

        if (highlightUnitId) {
          const target = list.find((u) => u.id === highlightUnitId);
          if (target && target.floor) {
            setCurrentFloor(target.floor);
            if (!isPickerMode) {
              setSelectedUnit(target);
            }
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không thể tải sơ đồ ô kho cơ sở.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, facilityId, highlightUnitId, initialUnits, isPickerMode]);

  // Danh sách các tầng thực tế có ô kho trong cơ sở
  const availableFloors = useMemo(() => {
    const floorSet = new Set<number>();
    units.forEach((u) => {
      if (u.floor !== undefined && u.floor !== null) {
        floorSet.add(u.floor);
      }
    });
    const sorted = Array.from(floorSet).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [1, 2];
  }, [units]);

  useEffect(() => {
    if (availableFloors.length > 0 && !availableFloors.includes(currentFloor)) {
      setCurrentFloor(availableFloors[0]);
    }
  }, [availableFloors, currentFloor]);

  const floorUnits = useMemo(() => {
    return units.filter((u) => (u.floor ?? 1) === currentFloor);
  }, [units, currentFloor]);

  const filteredFloorUnits = useMemo(() => {
    if (statusFilter === 'ALL') return floorUnits;
    return floorUnits.filter((u) => u.status === statusFilter);
  }, [floorUnits, statusFilter]);

  const nextFloorForStaircase = useMemo(() => {
    if (availableFloors.length <= 1) return currentFloor;
    const currentIndex = availableFloors.indexOf(currentFloor);
    if (currentIndex >= availableFloors.length - 1) {
      return availableFloors[0];
    }
    return availableFloors[currentIndex + 1];
  }, [availableFloors, currentFloor]);

  const sameTypeAvailableCount = useMemo(() => {
    if (!allowedUnitTypeId) return 0;
    return units.filter((u) => u.unitTypeId === allowedUnitTypeId && u.status === 'AVAILABLE').length;
  }, [units, allowedUnitTypeId]);

  const targetUnitType = useMemo(() => {
    if (!allowedUnitTypeId) return null;
    return unitTypes.find((ut) => ut.id === allowedUnitTypeId) || null;
  }, [unitTypes, allowedUnitTypeId]);

  const targetEnvironment = useMemo(() => {
    if (targetUnitType?.environment) return targetUnitType.environment.toUpperCase();
    if (
      targetUnitTypeName?.toLowerCase().includes('máy lạnh') ||
      targetUnitTypeName?.toLowerCase().includes('ac')
    ) {
      return 'CLIMATE_CONTROLLED';
    }
    return 'STANDARD';
  }, [targetUnitType, targetUnitTypeName]);

  const targetArea = useMemo(() => {
    if (targetUnitType?.areaM2) return Number(targetUnitType.areaM2);
    if (targetUnitType?.widthM && targetUnitType?.depthM) {
      return Number(targetUnitType.widthM) * Number(targetUnitType.depthM);
    }
    const name = (targetUnitTypeName || targetUnitType?.name || '').toUpperCase();
    if (name.includes('XL')) return 15;
    if (name.includes('XS')) return 1;
    if (name.includes(' S') || name.endsWith('S') || name.includes('-S')) return 3;
    if (name.includes(' M') || name.endsWith('M') || name.includes('-M')) return 6;
    if (name.includes(' L') || name.endsWith('L') || name.includes('-L')) return 10;
    return 0;
  }, [targetUnitType, targetUnitTypeName]);

  if (!isOpen) return null;

  const isUpgradeCompensationMode = Boolean(
    !loading && isPickerMode && allowedUnitTypeId && sameTypeAvailableCount === 0
  );

  const checkIsUpgradeUnit = (unit: StorageUnitResponse): boolean => {
    if (!isUpgradeCompensationMode) return false;
    if (unit.status !== 'AVAILABLE') return false;
    if (unit.unitTypeId === allowedUnitTypeId) return false;

    const uType = unitTypes.find((ut) => ut.id === unit.unitTypeId);
    const uEnv = (
      uType?.environment ||
      (unit.unitTypeCode?.includes('AC') || unit.unitTypeName?.toLowerCase().includes('máy lạnh')
        ? 'CLIMATE_CONTROLLED'
        : 'STANDARD')
    ).toUpperCase();

    if (uEnv !== targetEnvironment) return false;

    let uArea = 0;
    if (uType?.areaM2) {
      uArea = Number(uType.areaM2);
    } else if (uType?.widthM && uType?.depthM) {
      uArea = Number(uType.widthM) * Number(uType.depthM);
    } else {
      const name = (unit.unitTypeName || uType?.name || unit.unitTypeCode || '').toUpperCase();
      if (name.includes('XL')) uArea = 15;
      else if (name.includes('XS')) uArea = 1;
      else if (name.includes(' S') || name.endsWith('S') || name.includes('-S')) uArea = 3;
      else if (name.includes(' M') || name.endsWith('M') || name.includes('-M')) uArea = 6;
      else if (name.includes(' L') || name.endsWith('L') || name.includes('-L')) uArea = 10;
    }

    return uArea > targetArea;
  };

  // Enterprise 1px border + light tint status styling (zero thick ring-4, zero scale-105, zero floating shadow)
  const getTileStyle = (
    status: string,
    isHighlighted: boolean,
    isSelected: boolean,
    isSelectable: boolean,
    isUpgrade: boolean
  ) => {
    if (isSelected) {
      return 'bg-emerald-50 border-emerald-600 text-gray-900 cursor-pointer';
    }

    if (isHighlighted) {
      switch (status) {
        case 'MAINTENANCE':
          return 'bg-rose-100 border-rose-400 text-rose-900';
        case 'OCCUPIED':
          return 'bg-blue-50 border-blue-400 text-blue-950';
        case 'OVERDUE':
          return 'bg-orange-50 border-orange-400 text-orange-950';
        case 'RESERVED':
          return 'bg-sky-50 border-sky-400 text-sky-950';
        case 'AVAILABLE':
        default:
          return 'bg-emerald-50 border-emerald-500 text-emerald-950';
      }
    }

    if (isPickerMode && !isSelectable) {
      return 'bg-gray-50/70 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed';
    }

    if (isPickerMode && isSelectable && isUpgrade) {
      return 'bg-amber-50 border-amber-500 hover:bg-amber-100/70 text-amber-950 cursor-pointer';
    }

    switch (status) {
      case 'AVAILABLE':
        return 'bg-white border-gray-300 hover:border-emerald-600 hover:bg-emerald-50/40 text-gray-900 cursor-pointer';
      case 'RESERVED':
        return 'bg-sky-50/70 border-sky-300 text-sky-900';
      case 'OCCUPIED':
        return 'bg-blue-50/60 border-blue-200 text-blue-900';
      case 'OVERDUE':
        return 'bg-orange-50/80 border-orange-300 text-orange-900';
      case 'MAINTENANCE':
        return 'bg-rose-50 border-rose-300 text-rose-900';
      case 'CLEANING':
        return 'bg-gray-100 border-gray-300 text-gray-700';
      default:
        return 'bg-white border-gray-200 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Trống';
      case 'RESERVED':
        return 'Chờ nhận kho';
      case 'OCCUPIED':
        return 'Đang thuê';
      case 'OVERDUE':
        return 'Quá hạn';
      case 'MAINTENANCE':
        return 'Bảo trì';
      case 'CLEANING':
        return 'Đang vệ sinh';
      default:
        return status;
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-gray-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header phẳng, gọn */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3 bg-white">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Sơ đồ Mặt bằng 2D Ô kho — {facilityName}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {loading
                ? 'Đang tải dữ liệu ô kho của cơ sở...'
                : isPickerMode
                  ? targetUnitTypeName
                    ? `Click vào ô trống [${targetUnitTypeName}] để phân bổ.`
                    : 'Click vào ô trống trên sơ đồ để phân bổ.'
                  : 'Sơ đồ định vị không gian thực địa, phân tầng và trạng thái trực quan các ô kho.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Floor Tabs (Active Primary Đậm) + Filter chuẩn + Cảnh báo Đền bù */}
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Tabs chọn Tầng: nổi bật tab đang active bằng xanh lá đậm */}
            <div className="inline-flex items-center gap-1 p-0.5 bg-gray-200/70 rounded-md">
              {availableFloors.map((floor) => {
                const count = units.filter((u) => (u.floor ?? 1) === floor).length;
                const isActive = floor === currentFloor;
                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setCurrentFloor(floor)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-gray-700 hover:bg-white/70 hover:text-gray-900'
                    }`}
                  >
                    <span>Tầng {floor}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        isActive ? 'text-emerald-100' : 'text-gray-500'
                      }`}
                    >
                      {loading ? '...' : count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cảnh báo Chế độ Đền bù Nâng hạng (Cam/Đỏ rõ ràng) */}
            {!loading && isUpgradeCompensationMode && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-orange-50 text-orange-900 border border-orange-200 px-2.5 py-1 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="font-semibold text-orange-800">Chế độ Đền bù Nâng hạng</span>
                <span className="text-orange-700">· Hết ô cùng loại</span>
              </span>
            )}
          </div>

          {/* Dropdown lọc chuẩn + Badge tổng số tách biệt */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="floorplan-status-filter" className="text-gray-500 font-medium">
              Trạng thái:
            </label>
            <select
              id="floorplan-status-filter"
              aria-label="Lọc trạng thái ô kho"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-800 rounded-md px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Ô trống</option>
              <option value="RESERVED">Chờ nhận kho</option>
              <option value="OCCUPIED">Đang thuê</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
            {!loading && (
              <span className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 font-medium tabular-nums">
                {filteredFloorUnits.length} ô
              </span>
            )}
          </div>
        </div>

        {/* Nội dung Sơ đồ 2D */}
        <div className="flex-1 overflow-y-auto p-5 bg-white space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">
                Đang tải cấu trúc mặt bằng 2D cơ sở...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Sub-toolbar: Map Controls (Cổng vào & Cầu thang) + Chú giải (Legend) đặt ngay phía trên lưới */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-200">
                <div
                  data-testid="floorplan-legend"
                  className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600"
                >
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Chú giải:
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-white border border-gray-400" />
                    <span>Trống khả dụng</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-500" />
                    <span className="font-medium text-amber-900">Nâng hạng đền bù</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-100 border border-sky-400" />
                    <span>Chờ nhận kho</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-100 border border-blue-400" />
                    <span>Đang thuê</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-orange-100 border border-orange-400" />
                    <span>Quá hạn</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-100 border border-rose-400" />
                    <span>Bảo trì</span>
                  </span>
                </div>

                {/* Map Controls gọn góc phải (không lơ lửng đè layout) */}
                <div className="flex items-center gap-2 flex-wrap">
                  {currentFloor === 1 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 px-2 py-1 rounded-md bg-gray-50 border border-gray-200">
                      <DoorOpen className="w-3.5 h-3.5 text-gray-400" />
                      <span>Cổng vào & Quầy tiếp tân</span>
                    </span>
                  )}

                  <button
                    type="button"
                    data-testid="interactive-staircase-hub"
                    onClick={() => setCurrentFloor(nextFloorForStaircase)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                    title={
                      currentFloor === 1
                        ? 'Click để lên sơ đồ Tầng 2'
                        : `Chuyển sang Tầng ${nextFloorForStaircase}`
                    }
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span>Cầu thang & Thang máy</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-emerald-700 font-semibold">
                      Chuyển sang Tầng {nextFloorForStaircase}
                    </span>
                  </button>
                </div>
              </div>

              {/* Grid Phòng Enterprise (rounded-md 6px, viền 1px, mật độ thông tin cao, KHÔNG chữ TRỐNG lặp lại) */}
              {filteredFloorUnits.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500 font-medium border border-dashed border-gray-200 rounded-md">
                  Không có ô kho nào phù hợp với bộ lọc tại Tầng {currentFloor}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {filteredFloorUnits.map((unit) => {
                    const isHighlighted = unit.id === highlightUnitId;
                    const isSelected = selectedUnit?.id === unit.id;
                    const isUpgrade = checkIsUpgradeUnit(unit);
                    const matchesType =
                      !allowedUnitTypeId || unit.unitTypeId === allowedUnitTypeId || isUpgrade;
                    const isSelectable =
                      isPickerMode && unit.status === 'AVAILABLE' && matchesType;
                    const isDimmed = isPickerMode && !isSelectable && !isHighlighted && !isSelected;

                    return (
                      <div
                        key={unit.id}
                        data-testid={`unit-tile-${unit.code}`}
                        onClick={() => {
                          if (isPickerMode) {
                            if (isSelectable) {
                              setSelectedUnit(unit);
                              if (onSelectUnit) {
                                onSelectUnit(unit);
                              }
                            }
                          } else {
                            setSelectedUnit(unit);
                          }
                        }}
                        className={`p-3 rounded-md border text-left transition-colors flex flex-col justify-between min-h-[76px] ${getTileStyle(
                          unit.status,
                          isHighlighted,
                          isSelected,
                          isSelectable,
                          isUpgrade
                        )}`}
                        title={`Ô ${unit.code} — ${getStatusLabel(unit.status)} (${
                          unit.unitTypeName || 'Hạng tiêu chuẩn'
                        })${isUpgrade ? ' [Nâng hạng đền bù]' : ''}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-mono text-sm font-bold truncate ${
                                unit.status === 'MAINTENANCE'
                                  ? 'text-rose-800'
                                  : isDimmed
                                    ? 'text-gray-400'
                                    : 'text-gray-900'
                              }`}
                            >
                              {unit.code}
                            </span>

                            {isHighlighted && (
                              <span
                                className={`text-[10px] font-semibold shrink-0 ${
                                  unit.status === 'MAINTENANCE'
                                    ? 'text-rose-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                Ô bàn giao
                              </span>
                            )}
                            {isSelected && !isHighlighted && (
                              <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                                Đã chọn
                              </span>
                            )}
                            {isUpgrade && isSelectable && !isSelected && !isHighlighted && (
                              <span className="text-[10px] font-semibold text-amber-800 shrink-0">
                                Nâng hạng
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-xs truncate block mt-0.5 ${
                              unit.status === 'MAINTENANCE'
                                ? 'text-rose-700/80'
                                : isDimmed
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                            }`}
                          >
                            {unit.unitTypeName || unit.position || `Tầng ${unit.floor}`}
                          </span>
                        </div>

                        {/* Chỉ hiện nhãn trạng thái khi KHÔNG phải phòng trống (giảm 50% chữ rác) */}
                        {unit.status !== 'AVAILABLE' && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
                            {unit.status === 'MAINTENANCE' && (
                              <Wrench className="w-3 h-3 shrink-0" />
                            )}
                            <span>{getStatusLabel(unit.status)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Panel xem trước thông tin ô kho khi click */}
              {selectedUnit && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-900">
                          Ô kho <span className="font-mono">{selectedUnit.code}</span>
                        </h4>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                            selectedUnit.status === 'AVAILABLE'
                              ? checkIsUpgradeUnit(selectedUnit)
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : selectedUnit.status === 'MAINTENANCE'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {checkIsUpgradeUnit(selectedUnit)
                            ? 'Nâng hạng đền bù'
                            : getStatusLabel(selectedUnit.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Tầng {selectedUnit.floor ?? 1} · {selectedUnit.position || 'Khu A'} ·{' '}
                        {selectedUnit.unitTypeName || 'Hạng tiêu chuẩn'}
                        {selectedUnit.monthlyPrice
                          ? ` · ${new Intl.NumberFormat('vi-VN').format(selectedUnit.monthlyPrice)} đ/tháng`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {isPickerMode && selectedUnit.status === 'AVAILABLE' && (
                    <div>
                      {checkIsUpgradeUnit(selectedUnit) ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-xs text-orange-800 bg-orange-50 px-2.5 py-1.5 rounded-md border border-orange-200 font-medium">
                            Nâng hạng đền bù (Khách giữ nguyên giá)
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectUnit && onSelectUnit(selectedUnit)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận nâng hạng sang ô {selectedUnit.code}</span>
                          </button>
                        </div>
                      ) : !allowedUnitTypeId || selectedUnit.unitTypeId === allowedUnitTypeId ? (
                        <button
                          type="button"
                          onClick={() => onSelectUnit && onSelectUnit(selectedUnit)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Xác nhận phân bổ ô {selectedUnit.code}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-orange-700 bg-orange-50 px-2.5 py-1.5 rounded-md border border-orange-200 inline-flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          Khác hạng kho hợp đồng
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer gọn gàng */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>
            Mặt bằng Tầng {currentFloor} · {filteredFloorUnits.length} ô kho hiển thị
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md font-medium transition-colors cursor-pointer text-xs"
          >
            Đóng sơ đồ
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
