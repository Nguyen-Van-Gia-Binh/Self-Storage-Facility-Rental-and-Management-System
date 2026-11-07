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
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { StorageUnitResponse } from '@/types/unit';
import { fetchStorageUnits } from '@/api/unit';

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
  const [loading, setLoading] = useState<boolean>(!initialUnits);
  const [error, setError] = useState<string | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
            setSelectedUnit(target);
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

  const getStatusColor = (status: string, isHighlighted: boolean, isSelected: boolean, isSelectable: boolean) => {
    if (isHighlighted) {
      return 'bg-brand-600 text-white border-brand-500 ring-4 ring-brand-500/50 shadow-md scale-105 z-20 font-extrabold animate-pulse';
    }
    if (isSelected) {
      return 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-500/40 shadow-md scale-105 z-20 font-bold';
    }

    if (isPickerMode && !isSelectable) {
      return 'bg-slate-100/80 text-slate-400 border-slate-200/80 opacity-40 cursor-not-allowed';
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
                {isPickerMode && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Chế độ Chọn ô trực quan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPickerMode
                  ? targetUnitTypeName
                    ? `Click vào ô trống màu xanh lá thuộc hạng kho [${targetUnitTypeName}] để phân bổ.`
                    : 'Click vào ô trống màu xanh lá để phân bổ cho hợp đồng.'
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
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lọc trạng thái nhanh */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Lọc:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">Tất cả trạng thái ({floorUnits.length})</option>
              <option value="AVAILABLE">Ô trống ({floorUnits.filter((u) => u.status === 'AVAILABLE').length})</option>
              <option value="RESERVED">Chờ nhận kho ({floorUnits.filter((u) => u.status === 'RESERVED').length})</option>
              <option value="OCCUPIED">Đang thuê ({floorUnits.filter((u) => u.status === 'OCCUPIED').length})</option>
              <option value="MAINTENANCE">Bảo trì ({floorUnits.filter((u) => u.status === 'MAINTENANCE').length})</option>
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
              
              {/* Layout Mặt bằng: Cột Cầu thang tương tác + Ma trận Ô kho */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 1. KHỐI CẦU THANG BỘ & THANG MÁY TƯƠNG TÁC (3 cols) */}
                <div className="lg:col-span-3">
                  <div
                    data-testid="interactive-staircase-hub"
                    onClick={() => setCurrentFloor(nextFloorForStaircase)}
                    className="group relative p-4 rounded-2xl border-2 border-dashed border-indigo-300 bg-linear-to-b from-indigo-50/80 to-purple-50/80 hover:from-indigo-100 hover:to-purple-100 hover:border-indigo-500 transition-all cursor-pointer shadow-xs flex flex-col justify-between h-full min-h-[140px]"
                    title={`Click để chuyển sang sơ đồ Tầng ${nextFloorForStaircase}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/90 px-2 py-0.5 rounded-full">
                          Lối chuyển tầng
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 group-hover:text-indigo-800">
                          Cầu thang & Thang máy
                        </h4>
                        <p className="text-[11px] text-indigo-700 mt-1 leading-snug">
                          {currentFloor === 1
                            ? '↗ Click để lên sơ đồ Tầng 2'
                            : `↙ Click để xuống sơ đồ Tầng ${nextFloorForStaircase}`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-indigo-200/80 flex items-center justify-between text-[11px] font-bold text-indigo-900">
                      <span>Chuyển sang Tầng {nextFloorForStaircase}</span>
                      <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* 2. MA TRẬN LƯỚI CÁC Ô KHO (9 cols) */}
                <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-slate-800">Mặt bằng Tầng {currentFloor}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 text-[11px]">{filteredFloorUnits.length} ô kho</span>
                    </div>
                    {currentFloor === 1 && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Cổng vào & Quầy tiếp tân ➔
                      </span>
                    )}
                  </div>

                  {filteredFloorUnits.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      Không có ô kho nào phù hợp với bộ lọc tại Tầng {currentFloor}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                      {filteredFloorUnits.map((unit) => {
                        const isHighlighted = unit.id === highlightUnitId;
                        const isSelected = selectedUnit?.id === unit.id;
                        const matchesType = !allowedUnitTypeId || unit.unitTypeId === allowedUnitTypeId;
                        const isSelectable = isPickerMode && unit.status === 'AVAILABLE' && matchesType;

                        return (
                          <div
                            key={unit.id}
                            data-testid={`unit-tile-${unit.code}`}
                            onClick={() => {
                              setSelectedUnit(unit);
                              if (isPickerMode && isSelectable && onSelectUnit) {
                                onSelectUnit(unit);
                              }
                            }}
                            className={`relative p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[72px] ${getStatusColor(
                              unit.status,
                              isHighlighted,
                              isSelected,
                              isSelectable
                            )}`}
                            title={`Ô ${unit.code} — ${getStatusLabel(unit.status)} (${unit.unitTypeName || 'Hạng tiêu chuẩn'})`}
                          >
                            {/* Badges đặc biệt */}
                            {isHighlighted && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs">
                                Ô bàn giao
                              </span>
                            )}
                            {isSelected && !isHighlighted && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow-xs">
                                Đã chọn
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
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : selectedUnit.status === 'MAINTENANCE'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {getStatusLabel(selectedUnit.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tầng {selectedUnit.floor ?? 1} • {selectedUnit.position || 'Khu A'} • {selectedUnit.locationNote || selectedUnit.unitTypeName || 'Hạng tiêu chuẩn'}
                        {selectedUnit.monthlyPrice ? ` • ${new Intl.NumberFormat('vi-VN').format(selectedUnit.monthlyPrice)} đ/tháng` : ''}
                      </p>
                    </div>
                  </div>

                  {isPickerMode && (
                    <div>
                      {selectedUnit.status === 'AVAILABLE' ? (
                        (!allowedUnitTypeId || selectedUnit.unitTypeId === allowedUnitTypeId) ? (
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
                        )
                      ) : (
                        <span className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          Ô không khả dụng (Đang bận / Bảo trì)
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
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-brand-600 ring-2 ring-brand-500/30" />
              <span className="font-bold text-brand-900">Ô bàn giao</span>
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
