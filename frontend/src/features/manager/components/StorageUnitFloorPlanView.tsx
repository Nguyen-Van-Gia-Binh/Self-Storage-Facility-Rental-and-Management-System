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
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  DoorOpen,
  PackageCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';

export type FloorPlanHorizonFilter =
  | 'ALL'
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'UPCOMING_CHECKIN'
  | 'UPCOMING_CHECKOUT'
  | 'OVERDUE'
  | 'MAINTENANCE'
  | 'FUTURE_DATE';

export interface StorageUnitFloorPlanViewProps {
  units: StorageUnitResponse[];
  contractsMap?: Record<number, ManagerContractItem>;
  currentUnitTypeId?: number;
  currentUnitTypeName?: string;
  facilityName?: string;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
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

const addDaysToStr = (baseDateStr: string, days: number): string => {
  const d = new Date(baseDateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
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

const formatVnDayMonth = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.substring(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

const getDaysDiff = (targetDateStr: string, baseDateStr: string): number => {
  const d1 = new Date(targetDateStr.substring(0, 10)).getTime();
  const d2 = new Date(baseDateStr.substring(0, 10)).getTime();
  return Math.round((d1 - d2) / (1000 * 3600 * 24));
};

export const StorageUnitFloorPlanView: React.FC<StorageUnitFloorPlanViewProps> = ({
  units,
  contractsMap = {},
  currentUnitTypeId,
  currentUnitTypeName = 'Loại ô kho',
  facilityName = 'Cơ sở lưu trữ',
  selectedDate,
  onDateChange,
  onSelectUnit,
  onStatusChange,
}) => {
  const todayStr = useMemo(() => getTodayStr(), []);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const [selectedUnit, setSelectedUnit] = useState<StorageUnitResponse | null>(null);
  const [horizonFilter, setHorizonFilter] = useState<FloorPlanHorizonFilter>('ALL');
  const [filterThisTypeOnly, setFilterThisTypeOnly] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Ngày mô phỏng tương lai (Timeline Simulator)
  const [localSimulatedDate, setLocalSimulatedDate] = useState<string>(
    selectedDate || addDaysToStr(todayStr, 30)
  );

  const activeSimulatedDate = selectedDate || localSimulatedDate;

  const handleSimulatedDateChange = (newDate: string) => {
    setLocalSimulatedDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

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

  // Tính toán chỉ số công việc hiện tại & tương lai cho từng ô kho
  const getUnitOperationalMeta = (unit: StorageUnitResponse) => {
    const contract = contractsMap[unit.id];
    const in7Days = addDaysToStr(todayStr, 7);
    const in14Days = addDaysToStr(todayStr, 14);

    const isUpcomingCheckin =
      Boolean(contract?.status === 'PENDING_CHECK_IN') ||
      Boolean(contract?.startDate && contract.startDate >= todayStr && contract.startDate <= in7Days) ||
      unit.status === 'RESERVED';

    const isUpcomingCheckout =
      Boolean(contract?.status === 'PENDING_RETURN') ||
      Boolean(contract?.endDateExclusive && contract.endDateExclusive >= todayStr && contract.endDateExclusive <= in14Days);

    const isOverdue = Boolean(contract?.status === 'OVERDUE');

    // Dự phóng tương lai theo activeSimulatedDate
    let futureStatus: UnitStatus = unit.status;
    let futureNote = '';

    if (unit.status === 'MAINTENANCE') {
      futureStatus = 'MAINTENANCE';
      futureNote = 'Bảo trì kỹ thuật';
    } else if (contract) {
      const cStart = contract.startDate ? contract.startDate.substring(0, 10) : '';
      const cEnd = contract.endDateExclusive ? contract.endDateExclusive.substring(0, 10) : '';

      if (cStart && cEnd && cStart <= activeSimulatedDate && cEnd > activeSimulatedDate) {
        futureStatus = 'OCCUPIED';
        futureNote = `Khách ${contract.customerName} đang thuê`;
      } else if (cEnd && cEnd <= activeSimulatedDate) {
        futureStatus = 'AVAILABLE';
        futureNote = `HĐ kết thúc ngày ${formatVnDate(cEnd)}, sẵn sàng đón khách mới`;
      }
    }

    return {
      contract,
      isUpcomingCheckin,
      isUpcomingCheckout,
      isOverdue,
      futureStatus,
      futureNote,
    };
  };

  // Đếm số lượng ô kho trên tầng hiện tại theo từng loại filter để hiển thị badge
  const countsByHorizon = useMemo(() => {
    let availableCount = 0;
    let occupiedCount = 0;
    let checkinCount = 0;
    let checkoutCount = 0;
    let overdueCount = 0;
    let maintenanceCount = 0;

    floorUnits.forEach((u) => {
      const meta = getUnitOperationalMeta(u);
      if (u.status === 'AVAILABLE') availableCount++;
      if (u.status === 'OCCUPIED') occupiedCount++;
      if (u.status === 'MAINTENANCE') maintenanceCount++;
      if (meta.isUpcomingCheckin) checkinCount++;
      if (meta.isUpcomingCheckout) checkoutCount++;
      if (meta.isOverdue) overdueCount++;
    });

    return {
      availableCount,
      occupiedCount,
      checkinCount,
      checkoutCount,
      overdueCount,
      maintenanceCount,
    };
  }, [floorUnits, contractsMap, todayStr]);

  // Lọc theo loại kho hiện tại & Horizon filter (Hiện tại vs Tương lai)
  const filteredFloorUnits = useMemo(() => {
    return floorUnits.filter((u) => {
      const matchType = !filterThisTypeOnly || u.unitTypeId === currentUnitTypeId;
      if (!matchType) return false;

      const meta = getUnitOperationalMeta(u);

      switch (horizonFilter) {
        case 'ALL':
          return true;
        case 'AVAILABLE':
          return u.status === 'AVAILABLE';
        case 'OCCUPIED':
          return u.status === 'OCCUPIED';
        case 'UPCOMING_CHECKIN':
          return meta.isUpcomingCheckin;
        case 'UPCOMING_CHECKOUT':
          return meta.isUpcomingCheckout;
        case 'OVERDUE':
          return meta.isOverdue;
        case 'MAINTENANCE':
          return u.status === 'MAINTENANCE';
        case 'FUTURE_DATE':
          return true;
        default:
          return true;
      }
    });
  }, [floorUnits, filterThisTypeOnly, currentUnitTypeId, horizonFilter, contractsMap, todayStr, activeSimulatedDate]);

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

    // Chế độ mô phỏng tương lai
    if (horizonFilter === 'FUTURE_DATE') {
      if (meta.futureStatus === 'AVAILABLE') {
        return `bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 ${borderStyle}`;
      }
      if (meta.futureStatus === 'OCCUPIED') {
        return `bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 ${borderStyle}`;
      }
      if (meta.futureStatus === 'MAINTENANCE') {
        return `bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 ${borderStyle}`;
      }
    }

    // Chế độ lọc nghiệp vụ nổi bật
    if (horizonFilter === 'UPCOMING_CHECKOUT' || meta.isUpcomingCheckout) {
      if (meta.isUpcomingCheckout) {
        return `bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/50 hover:bg-amber-100 ${borderStyle}`;
      }
    }

    if (horizonFilter === 'UPCOMING_CHECKIN' || meta.isUpcomingCheckin) {
      if (meta.isUpcomingCheckin) {
        return `bg-sky-50 text-sky-900 border-sky-300 ring-2 ring-sky-400/50 hover:bg-sky-100 ${borderStyle}`;
      }
    }

    if (horizonFilter === 'OVERDUE' || meta.isOverdue) {
      if (meta.isOverdue) {
        return `bg-rose-100 text-rose-900 border-rose-400 ring-2 ring-rose-500/50 hover:bg-rose-200 ${borderStyle}`;
      }
    }

    switch (unit.status) {
      case 'AVAILABLE':
        return `bg-emerald-50/90 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 ${borderStyle}`;
      case 'RESERVED':
        return `bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100 ${borderStyle}`;
      case 'OCCUPIED':
        return `bg-indigo-50/90 text-indigo-800 border-indigo-200 hover:bg-indigo-100 ${borderStyle}`;
      case 'MAINTENANCE':
        return `bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100 ${borderStyle}`;
      default:
        return `bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 ${borderStyle}`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Trống';
      case 'RESERVED': return 'Chờ nhận kho';
      case 'OCCUPIED': return 'Đang thuê';
      case 'MAINTENANCE': return 'Bảo trì';
      default: return status;
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
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Sơ đồ Mặt bằng 2D — {facilityName}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-mono">
                {currentUnitTypeName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Định vị không gian thực địa, phân bổ tầng và trực quan hóa trạng thái từng ô kho hiện tại & tương lai
            </p>
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

      {/* 2. Thanh Bộ Lọc Kế Hoạch Nghiệp Vụ Hiện Tại & Tương Lai (Operational Filters) */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full lg:w-auto">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-bold mr-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
            <span>Góc nhìn:</span>
          </div>

          {/* Preset Buttons Hiện tại */}
          <button
            type="button"
            onClick={() => setHorizonFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[10px] opacity-75">({floorUnits.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setHorizonFilter('AVAILABLE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Trống</span>
            <span className="text-[10px] opacity-80">({countsByHorizon.availableCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setHorizonFilter('OCCUPIED')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'OCCUPIED'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Đang thuê</span>
            <span className="text-[10px] opacity-80">({countsByHorizon.occupiedCount})</span>
          </button>

          {/* Bộ lọc Kế hoạch Tương lai: Sắp đón khách 7 ngày */}
          <button
            type="button"
            onClick={() => setHorizonFilter('UPCOMING_CHECKIN')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'UPCOMING_CHECKIN'
                ? 'bg-sky-600 text-white shadow-2xs ring-2 ring-sky-400'
                : 'bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100'
            }`}
            title="Các ô kho có khách sắp nhận kho trong 7 ngày tới"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Sắp đón khách (7d)</span>
            <span className={`text-[10px] px-1 rounded-full ${
              horizonFilter === 'UPCOMING_CHECKIN' ? 'bg-white/20' : 'bg-sky-200/80 text-sky-900'
            }`}>
              {countsByHorizon.checkinCount}
            </span>
          </button>

          {/* Bộ lọc Kế hoạch Tương lai: Sắp trả kho 14 ngày */}
          <button
            type="button"
            onClick={() => setHorizonFilter('UPCOMING_CHECKOUT')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'UPCOMING_CHECKOUT'
                ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
            title="Các ô kho có hợp đồng hết hạn trong 14 ngày tới cần lên lịch nghiệm thu & hoàn cọc"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Sắp trả kho (14d)</span>
            <span className={`text-[10px] px-1 rounded-full ${
              horizonFilter === 'UPCOMING_CHECKOUT' ? 'bg-white/20' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {countsByHorizon.checkoutCount}
            </span>
          </button>

          {/* Quá hạn */}
          {countsByHorizon.overdueCount > 0 && (
            <button
              type="button"
              onClick={() => setHorizonFilter('OVERDUE')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                horizonFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-400 animate-pulse'
                  : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Quá hạn</span>
              <span className="text-[10px] px-1 rounded-full bg-rose-200/80 text-rose-900">
                {countsByHorizon.overdueCount}
              </span>
            </button>
          )}

          {/* Bảo trì */}
          <button
            type="button"
            onClick={() => setHorizonFilter('MAINTENANCE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'MAINTENANCE'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Bảo trì</span>
            <span className="text-[10px] opacity-80">({countsByHorizon.maintenanceCount})</span>
          </button>

          {/* Chế độ Dự phóng ngày tương lai */}
          <button
            type="button"
            onClick={() => setHorizonFilter('FUTURE_DATE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              horizonFilter === 'FUTURE_DATE'
                ? 'bg-purple-600 text-white shadow-2xs ring-2 ring-purple-400'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Dự phóng tương lai</span>
          </button>
        </div>

        {/* Thanh điều khiển Mô phỏng Ngày tương lai khi chọn FUTURE_DATE */}
        {horizonFilter === 'FUTURE_DATE' && (
          <div className="w-full lg:w-auto p-2 rounded-xl bg-purple-50 border border-purple-200 flex flex-wrap items-center gap-2 text-xs animate-in fade-in duration-200">
            <span className="font-bold text-purple-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Ngày dự phóng:
            </span>
            <input
              type="date"
              value={activeSimulatedDate}
              onChange={(e) => handleSimulatedDateChange(e.target.value)}
              className="px-2.5 py-1 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-2xs"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSimulatedDateChange(addDaysToStr(todayStr, 7))}
                className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-800 font-semibold border border-purple-200 cursor-pointer text-[11px]"
              >
                +7 ngày
              </button>
              <button
                type="button"
                onClick={() => handleSimulatedDateChange(addDaysToStr(todayStr, 14))}
                className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-800 font-semibold border border-purple-200 cursor-pointer text-[11px]"
              >
                +14 ngày
              </button>
              <button
                type="button"
                onClick={() => handleSimulatedDateChange(addDaysToStr(todayStr, 30))}
                className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-800 font-semibold border border-purple-200 cursor-pointer text-[11px]"
              >
                +30 ngày
              </button>
              <button
                type="button"
                onClick={() => handleSimulatedDateChange(addDaysToStr(todayStr, 60))}
                className="px-2 py-0.5 rounded bg-white hover:bg-purple-100 text-purple-800 font-semibold border border-purple-200 cursor-pointer text-[11px]"
              >
                +60 ngày
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Floor Plan Canvas */}
      <div className="p-4 sm:p-6 bg-slate-50/50 space-y-4">
        {/* Banner thông báo khi đang lọc tương lai */}
        {horizonFilter === 'UPCOMING_CHECKOUT' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Kế hoạch Trả kho 14 ngày tới:</strong> Hiển thị các ô kho cần liên hệ khách hàng hẹn giờ nghiệm thu phòng (Inspection) và đối soát hoàn trả cọc (BR-DEP-04).
              </span>
            </div>
            <span className="font-mono font-bold text-amber-800">{countsByHorizon.checkoutCount} ô kho</span>
          </div>
        )}

        {horizonFilter === 'UPCOMING_CHECKIN' && (
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Kế hoạch Đón khách 7 ngày tới:</strong> Hiển thị các ô kho cần kiểm tra vệ sinh sạch sẽ, kích hoạt mã PIN điện tử/thẻ từ và chuẩn bị bàn giao.
              </span>
            </div>
            <span className="font-mono font-bold text-sky-800">{countsByHorizon.checkinCount} ô kho</span>
          </div>
        )}

        {horizonFilter === 'FUTURE_DATE' && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Mô phỏng mặt bằng ngày {formatVnDate(activeSimulatedDate)}:</strong> Dự phóng các ô kho sẽ tự động chuyển sang trạng thái Trống sau khi hợp đồng cũ đáo hạn hoặc có khách mới.
              </span>
            </div>
            <span className="font-bold text-purple-800">Dự phóng thực tế</span>
          </div>
        )}

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

            {/* Bảng chú giải trạng thái màu sắc & Nghiệp vụ */}
            <div className="mt-3 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Chú giải trạng thái & Kế hoạch
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <span className="w-3 h-3 rounded-md bg-emerald-400 border border-emerald-500 shrink-0" />
                  <span>Trống ({floorUnits.filter((u) => u.status === 'AVAILABLE').length})</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-indigo-800">
                  <span className="w-3 h-3 rounded-md bg-indigo-300 border border-indigo-400 shrink-0" />
                  <span>Đang thuê ({floorUnits.filter((u) => u.status === 'OCCUPIED').length})</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-sky-800">
                  <span className="w-3 h-3 rounded-md bg-sky-300 border border-sky-400 shrink-0" />
                  <span>Sắp đón ({countsByHorizon.checkinCount})</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-amber-800">
                  <span className="w-3 h-3 rounded-md bg-amber-300 border border-amber-400 shrink-0" />
                  <span>Sắp trả ({countsByHorizon.checkoutCount})</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-rose-800 col-span-2">
                  <span className="w-3 h-3 rounded-md bg-rose-300 border border-rose-400 shrink-0" />
                  <span>Bảo trì ({floorUnits.filter((u) => u.status === 'MAINTENANCE').length})</span>
                </div>
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
                      className={`relative p-3 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[88px] ${getStatusColor(
                        unit,
                        isThisType,
                        isSelected
                      )}`}
                      title={`Ô ${unit.code} — ${getStatusLabel(unit.status)} (${unit.unitTypeName || 'Hạng kho'})`}
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

                      {/* Hiển thị Nhãn Nghiệp vụ động: Sắp trả kho / Sắp đón khách / Dự kiến tương lai */}
                      {horizonFilter === 'FUTURE_DATE' ? (
                        <span className={`text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-md uppercase tracking-tight ${
                          meta.futureStatus === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : meta.futureStatus === 'OCCUPIED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {meta.futureStatus === 'AVAILABLE' ? 'Sẽ trống' : meta.futureStatus === 'OCCUPIED' ? 'Đang thuê' : 'Bảo trì'}
                        </span>
                      ) : meta.isUpcomingCheckout ? (
                        <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-md bg-amber-200/90 text-amber-900 border border-amber-300 truncate max-w-full">
                          Trả: {formatVnDayMonth(meta.contract?.endDateExclusive)}
                        </span>
                      ) : meta.isUpcomingCheckin ? (
                        <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-md bg-sky-200/90 text-sky-900 border border-sky-300 truncate max-w-full">
                          Đón: {formatVnDayMonth(meta.contract?.startDate)}
                        </span>
                      ) : meta.isOverdue ? (
                        <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-md bg-rose-200 text-rose-900 border border-rose-300 animate-pulse">
                          Quá hạn
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold mt-1.5 px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 uppercase tracking-tight">
                          {getStatusLabel(unit.status)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Panel Chi tiết Ô kho & Hộp Điều Phối Công Việc FM (Work Dispatch) */}
        {selectedUnit && selectedUnitMeta && (
          <div className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3.5 animate-in fade-in duration-150">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-extrabold text-slate-900 font-mono">
                      Ô Kho {selectedUnit.code}
                    </h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      selectedUnit.status === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedUnit.status === 'OCCUPIED'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : selectedUnit.status === 'MAINTENANCE'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {getStatusLabel(selectedUnit.status)}
                    </span>
                    {selectedUnit.unitTypeId === currentUnitTypeId && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        Thuộc {currentUnitTypeName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
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
                    disabled={isUpdatingStatus || selectedUnit.status === 'OCCUPIED' || selectedUnit.status === 'RESERVED'}
                    onClick={handleToggleMaintenance}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      selectedUnit.status === 'MAINTENANCE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                    title={
                      selectedUnit.status === 'OCCUPIED' || selectedUnit.status === 'RESERVED'
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

            {/* HỘP ĐIỀU PHỐI CÔNG VIỆC FM (WORK DISPATCH ADVISORY) */}
            <div className="pt-2 border-t border-slate-100">
              {selectedUnitMeta.isUpcomingCheckout && selectedContract ? (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <DoorOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">
                      Sắp đến hạn trả kho ({formatVnDate(selectedContract.endDateExclusive)} — còn {Math.max(0, getDaysDiff(selectedContract.endDateExclusive, todayStr))} ngày):
                    </span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      FM cần liên hệ khách hàng hẹn giờ bàn giao, lên lịch kiểm tra buồng kho (Inspection), nghiệm thu hiện trạng tài sản và đối soát trừ phí dịch vụ / hoàn trả tiền cọc theo quy định BR-DEP-04.
                    </p>
                  </div>
                </div>
              ) : selectedUnitMeta.isUpcomingCheckin && selectedContract ? (
                <div className="p-3 bg-sky-50/90 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-start gap-2.5">
                  <PackageCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sky-950">
                      Chuẩn bị đón khách mới ({formatVnDate(selectedContract.startDate)}):
                    </span>
                    <p className="mt-0.5 text-sky-800 leading-relaxed">
                      FM cần kiểm tra vệ sinh sạch sẽ buồng kho {selectedUnit.code}, kiểm tra hoạt động mã PIN điện tử/thẻ từ và chuẩn bị sẵn biên bản bàn giao để tiếp đón khách hàng.
                    </p>
                  </div>
                </div>
              ) : selectedUnitMeta.isOverdue && selectedContract ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-950">
                      Cảnh báo: Hợp đồng quá hạn thanh toán ({Math.abs(getDaysDiff(selectedContract.endDateExclusive, todayStr))} ngày):
                    </span>
                    <p className="mt-0.5 text-rose-800 leading-relaxed">
                      Cần tạm khóa quyền truy cập mã PIN (BR-OVD-01), thông báo cho khách tất toán tiền nợ hoặc phối hợp lập biên bản xử lý tài sản niêm phong theo quy trình.
                    </p>
                  </div>
                </div>
              ) : horizonFilter === 'FUTURE_DATE' ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2.5">
                  <CalendarClock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-purple-950">
                      Dự phóng tại ngày {formatVnDate(activeSimulatedDate)}:
                    </span>
                    <p className="mt-0.5 text-purple-800 leading-relaxed">
                      Trạng thái dự kiến: <strong>{getStatusLabel(selectedUnitMeta.futureStatus)}</strong>
                      {selectedUnitMeta.futureNote ? ` — ${selectedUnitMeta.futureNote}` : ''}.
                    </p>
                  </div>
                </div>
              ) : selectedUnit.status === 'AVAILABLE' ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-950">
                      Ô kho đang trống & sẵn sàng hoạt động:
                    </span>
                    <p className="mt-0.5 text-emerald-800 leading-relaxed">
                      Ô kho đã được kiểm tra đạt chuẩn an toàn, PCCC và sẵn sàng tiếp nhận yêu cầu đặt chỗ hoặc cho thuê mới ngay hôm nay.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900">
                      Tình trạng vận hành tiêu chuẩn:
                    </span>
                    <p className="mt-0.5 text-slate-600 leading-relaxed">
                      Hệ thống giám sát định kỳ 24/7. Mọi sự cố phát sinh sẽ được ghi nhận và đồng bộ trực tiếp lên bảng điều hành trung tâm.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
