import React from 'react';
import type { StorageUnit, UnitStatus } from '../types';
import { Check, Lock, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface UnitGridProps {
  units: StorageUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unit: StorageUnit) => void;
}

// Bảng ánh xạ màu sắc chuẩn theo UI-DESIGN-SYSTEM.md § 2.2
const statusBadgeMap: Record<UnitStatus, { label: string; badgeClass: string; cardClass: string; isSelectable: boolean }> = {
  AVAILABLE: {
    label: 'Còn trống',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    cardClass: 'bg-white border-emerald-300 text-emerald-950 hover:border-brand-500 hover:shadow-md cursor-pointer',
    isSelectable: true,
  },
  RESERVED: {
    label: 'Đã đặt chỗ',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-300',
    cardClass: 'bg-slate-50/80 border-slate-200 text-slate-400 cursor-not-allowed opacity-75',
    isSelectable: false,
  },
  OCCUPIED: {
    label: 'Đang thuê',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    cardClass: 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed opacity-60',
    isSelectable: false,
  },
  MAINTENANCE: {
    label: 'Bảo trì',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
    cardClass: 'bg-amber-50/40 border-amber-200 text-amber-700 cursor-not-allowed opacity-70',
    isSelectable: false,
  },
  OVERDUE: {
    label: 'Quá hạn',
    badgeClass: 'bg-red-50 text-red-700 border-red-300',
    cardClass: 'bg-red-50/30 border-red-200 text-red-600 cursor-not-allowed opacity-60',
    isSelectable: false,
  },
  LOCKED: {
    label: 'Khóa an ninh',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    cardClass: 'bg-rose-50/40 border-rose-200 text-rose-600 cursor-not-allowed opacity-60',
    isSelectable: false,
  },
};

export const UnitGrid: React.FC<UnitGridProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
}) => {
  // Gom nhóm theo Zone (Zone A, Zone B)
  const zones = Array.from(new Set(units.map((u) => u.zone))).sort();

  return (
    <div className="space-y-6">
      {/* Legend Bảng chú thích màu sắc trạng thái (UI-DESIGN-SYSTEM.md § 2.2) */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold">
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Chú thích:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
          <span className="text-slate-700">Còn trống (Chọn được)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-400"></span>
          <span className="text-slate-700">Đã đặt giữ chỗ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-400"></span>
          <span className="text-slate-700">Đang có khách thuê</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
          <span className="text-slate-700">Bảo trì</span>
        </div>
      </div>

      {/* Sơ đồ phân chia theo từng Zone */}
      {zones.map((zoneName) => {
        const zoneUnits = units.filter((u) => u.zone === zoneName);

        return (
          <div key={zoneName} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/90">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#0a1614] text-sm tracking-tight flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                {zoneName} — Tầng 1 (Floor 1)
              </h3>
              <span className="text-xs text-slate-500">
                {zoneUnits.filter((u) => u.status === 'AVAILABLE').length}/{zoneUnits.length} ô còn trống
              </span>
            </div>

            {/* Grid ô kho */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {zoneUnits.map((unit) => {
                const config = statusBadgeMap[unit.status];
                const isSelected = selectedUnitId === unit.id;

                return (
                  <div
                    key={unit.id}
                    onClick={() => {
                      if (config.isSelectable) {
                        onSelectUnit(unit);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all text-center flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/60 shadow-sm'
                        : config.cardClass
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono tracking-wider">
                        {unit.unitNumber}
                      </span>
                      {isSelected ? (
                        <span className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : unit.status === 'OCCUPIED' ? (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      ) : unit.status === 'RESERVED' ? (
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                      ) : unit.status === 'MAINTENANCE' ? (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      ) : null}
                    </div>

                    <div className="mt-2">
                      <Badge 
                        variant={isSelected ? 'primary' : (unit.status.toLowerCase() as 'available' | 'reserved' | 'occupied' | 'maintenance' | 'overdue' | 'locked')}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {isSelected ? 'Đang chọn' : config.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
