import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  MapPin,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Sparkles,
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

        // Nếu có highlightUnitId, tự động chuyển đến tầng của ô đó
        if (highlightUnitId) {
          const target = list.find((u) => u.id === highlightUnitId);
          if (target && target.floor) {
            setCurrentFloor(target.floor);
            // Trong chế độ Picker (chọn ô phân bổ), không tự động chọn ô cũ gặp sự cố/bảo trì
            // để tránh hiện thanh preview thừa thãi ở chân trang
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
  }, [isOpen, facilityId, highlightUnitId, initialUnits]);

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

  // Đảm bảo currentFloor hợp lệ
  useEffect(() => {
    if (availableFloors.length > 0 && !availableFloors.includes(currentFloor)) {
      setCurrentFloor(availableFloors[0]);
    }
  }, [availableFloors, currentFloor]);

  // Các ô kho thuộc tầng đang chọn
  const floorUnits = useMemo(() => {
    return units.filter((u) => (u.floor ?? 1) === currentFloor);
  }, [units, currentFloor]);

  // Lọc theo trạng thái nếu có
  const filteredFloorUnits = useMemo(() => {
    if (statusFilter === 'ALL') return floorUnits;
    return floorUnits.filter((u) => u.status === statusFilter);
  }, [floorUnits, statusFilter]);

  // Xác định tầng kế tiếp khi click vào Cầu thang
  const nextFloorForStaircase = useMemo(() => {
    if (availableFloors.length <= 1) return currentFloor;
    const currentIndex = availableFloors.indexOf(currentFloor);
    if (currentIndex >= availableFloors.length - 1) {
      // Đang ở tầng cao nhất -> xuống tầng thấp nhất hoặc tầng trước đó
      return availableFloors[0];
    }
    return availableFloors[currentIndex + 1];
  }, [availableFloors, currentFloor]);

  if (!isOpen) return null;

  const isPickerMode = Boolean(onSelectUnit);

  // Đếm số ô khả dụng cùng loại ban đầu của hợp đồng/đơn đặt chỗ
  const sameTypeAvailableCount = useMemo(() => {
    if (!allowedUnitTypeId) return 0;
    return units.filter((u) => u.unitTypeId === allowedUnitTypeId && u.status === 'AVAILABLE').length;
  }, [units, allowedUnitTypeId]);

  // Thông tin loại ô kho ban đầu
  const targetUnitType = useMemo(() => {
    if (!allowedUnitTypeId) return null;
    return unitTypes.find((ut) => ut.id === allowedUnitTypeId) || null;
  }, [unitTypes, allowedUnitTypeId]);

  // Môi trường lưu trữ yêu cầu (STANDARD hoặc CLIMATE_CONTROLLED)
  const targetEnvironment = useMemo(() => {
    if (targetUnitType?.environment) return targetUnitType.environment.toUpperCase();
    if (targetUnitTypeName?.toLowerCase().includes('máy lạnh') || targetUnitTypeName?.toLowerCase().includes('ac')) {
      return 'CLIMATE_CONTROLLED';
    }
    return 'STANDARD';
  }, [targetUnitType, targetUnitTypeName]);

  // Diện tích kho ban đầu (m²)
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

  // Kích hoạt Chế độ Đền bù Nâng hạng khi đã tải xong dữ liệu (!loading), ở chế độ Picker, có yêu cầu loại ô và cơ sở đã hết sạch ô cùng loại
  const isUpgradeCompensationMode = Boolean(
    !loading && isPickerMode && allowedUnitTypeId && sameTypeAvailableCount === 0
  );

  // Kiểm tra một ô kho có phải là ô Nâng hạng đền bù hợp lệ (cùng môi trường, diện tích lớn hơn)
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

  const getStatusColor = (
    status: string,
    isHighlighted: boolean,
    isSelected: boolean,
    isSelectable: boolean,
    isUpgrade?: boolean
  ) => {
    // 1. Ô đang được chọn
    if (isSelected) {
      return 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-500/40 shadow-md scale-105 z-20 font-bold';
    }

    // 2. Ô được làm nổi bật (ô bàn giao / ô sự cố ban đầu của hợp đồng)
    // BẮT BUỘC giữ đúng màu trạng thái thực tế: BẢO TRÌ phải có màu đỏ/hồng, không bị ép thành màu xanh
    if (isHighlighted) {
      switch (status) {
        case 'MAINTENANCE':
          return 'bg-rose-100 text-rose-950 border-rose-400 ring-4 ring-rose-400/60 shadow-md scale-105 z-20 font-bold';
        case 'OCCUPIED':
          return 'bg-indigo-100 text-indigo-950 border-indigo-400 ring-4 ring-indigo-400/60 shadow-md scale-105 z-20 font-bold';
        case 'OVERDUE':
          return 'bg-amber-100 text-amber-950 border-amber-400 ring-4 ring-amber-400/60 shadow-md scale-105 z-20 font-bold';
        case 'RESERVED':
          return 'bg-sky-100 text-sky-950 border-sky-400 ring-4 ring-sky-400/60 shadow-md scale-105 z-20 font-bold';
        case 'AVAILABLE':
        default:
          return 'bg-emerald-100 text-emerald-950 border-emerald-500 ring-4 ring-emerald-500/60 shadow-md scale-105 z-20 font-bold';
      }
    }

    if (isPickerMode && !isSelectable) {
      return 'bg-slate-100/80 text-slate-400 border-slate-200/80 opacity-40 cursor-not-allowed';
    }

    // Màu vàng hổ phách nổi bật riêng biệt cho ô Nâng hạng đền bù khi hết ô cùng loại
    if (isPickerMode && isSelectable && isUpgrade) {
      return 'bg-amber-50 text-amber-950 border-amber-400 ring-2 ring-amber-400/50 hover:bg-amber-100 hover:border-amber-500 shadow-xs cursor-pointer font-semibold';
    }

    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 shadow-2xs cursor-pointer';
      case 'RESERVED':
        return 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 shadow-2xs';
      case 'OCCUPIED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 opacity-90 shadow-2xs';
      case 'OVERDUE':
        return 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-2xs';
      case 'MAINTENANCE':
        return 'bg-rose-50 text-rose-800 border-rose-300 opacity-75 shadow-2xs';
      case 'CLEANING':
        return 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100 shadow-2xs';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Trống';
      case 'RESERVED': return 'Chờ nhận kho';
      case 'OCCUPIED': return 'Đang thuê';
      case 'OVERDUE': return 'Quá hạn';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'CLEANING': return 'Đang vệ sinh';
      default: return status;
    }
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Sơ đồ Mặt bằng 2D Ô kho — {facilityName}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading
                  ? 'Đang tải dữ liệu ô kho của cơ sở...'
                  : isPickerMode
                  ? targetUnitTypeName
                    ? `Click vào ô trống [${targetUnitTypeName}] để phân bổ.`
                    : 'Click vào ô trống trên sơ đồ để phân bổ.'
                  : 'Sơ đồ định vị không gian thực địa, phân tầng và trạng thái trực quan các ô kho.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh Điều hướng Tầng & Bộ lọc */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ chọn Tầng (Floor Switcher Tabs) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
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
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>Tầng {floor}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
                      {loading ? '...' : count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Chế độ đền bù nâng hạng gọn gàng */}
            {!loading && isUpgradeCompensationMode && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-bold">Chế độ Đền bù Nâng hạng</span>
                <span className="text-[11px] text-amber-700">
                  (Hết ô cùng loại • Nâng hạng đền bù)
                </span>
              </span>
            )}
          </div>

          {/* Lọc trạng thái nhanh */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Lọc:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">Tất cả trạng thái {loading ? '' : `(${floorUnits.length})`}</option>
              <option value="AVAILABLE">Ô trống {loading ? '' : `(${floorUnits.filter((u) => u.status === 'AVAILABLE').length})`}</option>
              <option value="RESERVED">Chờ nhận kho {loading ? '' : `(${floorUnits.filter((u) => u.status === 'RESERVED').length})`}</option>
              <option value="OCCUPIED">Đang thuê {loading ? '' : `(${floorUnits.filter((u) => u.status === 'OCCUPIED').length})`}</option>
              <option value="MAINTENANCE">Bảo trì {loading ? '' : `(${floorUnits.filter((u) => u.status === 'MAINTENANCE').length})`}</option>
            </select>
          </div>
        </div>

        {/* Nội dung Sơ đồ 2D */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Đang tải cấu trúc mặt bằng 2D cơ sở...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Sơ đồ mặt bằng ô kho toàn màn hình */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                    <span className="font-bold text-slate-800">Mặt bằng Tầng {currentFloor}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 text-[11px]">{filteredFloorUnits.length} ô kho</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {currentFloor === 1 && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Cổng vào & Quầy tiếp tân ➔
                      </span>
                    )}

                    {/* Lối chuyển tầng nhỏ gọn, không chiếm diện tích */}
                    <button
                      type="button"
                      data-testid="interactive-staircase-hub"
                      onClick={() => setCurrentFloor(nextFloorForStaircase)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 hover:border-indigo-300 text-indigo-900 transition-all cursor-pointer shadow-2xs"
                      title={`Click để chuyển sang sơ đồ Tầng ${nextFloorForStaircase}`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Cầu thang & Thang máy</span>
                      <span className="text-[11px] text-indigo-600 font-normal">
                        {currentFloor === 1 ? '(Click để lên sơ đồ Tầng 2)' : `(Chuyển sang Tầng ${nextFloorForStaircase})`}
                      </span>
                      <span className="hidden sm:inline text-indigo-700 font-semibold">
                        Chuyển sang Tầng {nextFloorForStaircase}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {filteredFloorUnits.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium">
                    Không có ô kho nào phù hợp với bộ lọc tại Tầng {currentFloor}.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                      {filteredFloorUnits.map((unit) => {
                        const isHighlighted = unit.id === highlightUnitId;
                        const isSelected = selectedUnit?.id === unit.id;
                        const isUpgrade = checkIsUpgradeUnit(unit);
                        const matchesType = !allowedUnitTypeId || unit.unitTypeId === allowedUnitTypeId || isUpgrade;
                        const isSelectable = isPickerMode && unit.status === 'AVAILABLE' && matchesType;

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
                            className={`relative p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[72px] ${getStatusColor(
                              unit.status,
                              isHighlighted,
                              isSelected,
                              isSelectable,
                              isUpgrade
                            )}`}
                            title={`Ô ${unit.code} — ${getStatusLabel(unit.status)} (${unit.unitTypeName || 'Hạng tiêu chuẩn'}) ${
                              isUpgrade ? '[Nâng hạng đền bù]' : ''
                            }`}
                          >
                            {/* Badges đặc biệt */}
                            {isHighlighted && (
                              <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs ${
                                unit.status === 'MAINTENANCE' ? 'bg-rose-700' : 'bg-brand-700'
                              }`}>
                                Ô bàn giao
                              </span>
                            )}
                            {isSelected && !isHighlighted && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs">
                                Đã chọn
                              </span>
                            )}
                            {isUpgrade && isSelectable && !isSelected && !isHighlighted && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs flex items-center gap-0.5 border border-amber-400">
                                <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                                Nâng hạng
                              </span>
                            )}

                            <div className="w-full">
                              <span className="font-mono text-xs font-bold truncate block">
                                {unit.code}
                              </span>
                              <span className="text-[10px] opacity-80 truncate block">
                                {unit.unitTypeName || unit.position || `T${unit.floor}`}
                              </span>
                            </div>

                            <span className="text-[9px] font-semibold mt-1 px-1.5 py-0.2 rounded-md bg-black/5 dark:bg-white/10 uppercase tracking-tight">
                              {getStatusLabel(unit.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              {/* Panel xem trước thông tin ô kho khi click */}
              {selectedUnit && (
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                      <Info className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Ô kho <span className="font-mono text-brand-700">{selectedUnit.code}</span>
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          selectedUnit.status === 'AVAILABLE'
                            ? checkIsUpgradeUnit(selectedUnit)
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : selectedUnit.status === 'MAINTENANCE'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {checkIsUpgradeUnit(selectedUnit) ? '✨ Nâng hạng đền bù' : getStatusLabel(selectedUnit.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tầng {selectedUnit.floor ?? 1} • {selectedUnit.position || 'Khu A'} • {selectedUnit.unitTypeName || 'Hạng tiêu chuẩn'}
                        {selectedUnit.monthlyPrice ? ` • ${new Intl.NumberFormat('vi-VN').format(selectedUnit.monthlyPrice)} đ/tháng` : ''}
                      </p>
                    </div>
                  </div>

                  {isPickerMode && selectedUnit.status === 'AVAILABLE' && (
                    <div>
                      {checkIsUpgradeUnit(selectedUnit) ? (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-xs text-amber-900 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 font-semibold flex items-center gap-1.5 shadow-2xs">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Nâng hạng đền bù (Khách giữ nguyên giá)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectUnit && onSelectUnit(selectedUnit)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                          >
                            <Sparkles className="w-4 h-4 text-amber-200" />
                            <span>Xác nhận nâng hạng sang ô {selectedUnit.code}</span>
                          </button>
                        </div>
                      ) : (!allowedUnitTypeId || selectedUnit.unitTypeId === allowedUnitTypeId) ? (
                        <button
                          type="button"
                          onClick={() => onSelectUnit && onSelectUnit(selectedUnit)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Xác nhận phân bổ ô {selectedUnit.code}</span>
                        </button>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
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

        {/* Footer Chú giải màu sắc (Color Legend) */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-medium">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Chú giải:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-2xs" />
              <span>Trống khả dụng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-400 border border-amber-500 shadow-2xs" />
              <span className="font-semibold text-amber-900 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-amber-600 inline" /> Nâng hạng đền bù
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-sky-500 shadow-2xs" />
              <span>Chờ nhận kho</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-indigo-600 shadow-2xs" />
              <span>Đang thuê</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500 shadow-2xs" />
              <span>Quá hạn</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500 shadow-2xs" />
              <span>Bảo trì</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer text-xs ml-auto"
          >
            Đóng sơ đồ
          </button>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
