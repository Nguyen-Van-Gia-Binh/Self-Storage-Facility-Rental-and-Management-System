// frontend/src/features/manager/components/FacilityCard.tsx
import React from 'react';
import { Building2, MapPin, Phone, Layers, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityStats {
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  maintenanceUnits: number;
  occupancyRate: number; // 0..100
}

interface FacilityCardProps {
  facility: FacilityListItem;
  stats?: FacilityStats;
  onClick: () => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, stats, onClick }) => {
  const total = stats?.totalUnits ?? 0;
  const occupied = stats?.occupiedUnits ?? 0;
  const available = stats?.availableUnits ?? 0;
  const rate = stats?.occupancyRate ?? (total > 0 ? (occupied / total) * 100 : 0);

  const isOptimal = rate >= 80;
  const isModerate = rate >= 50 && rate < 80;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-500/70 transition-all duration-200 p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Icon + Name + Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-brand-500 group-hover:text-white transition-all duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base line-clamp-1">
                  {facility.name}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
                {facility.code}
              </span>
            </div>
          </div>

          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
              facility.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {facility.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        {/* Info Rows: Địa chỉ + Hotline */}
        <div className="mt-4 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="line-clamp-2">{facility.address || 'Chưa cập nhật địa chỉ'}</p>
          </div>
          {facility.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{facility.phone}</span>
            </div>
          )}
        </div>

        {/* Mini Stats Grid */}
        <div className="mt-5 grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-center">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>Tổng ô</span>
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">{total}</div>
          </div>
          <div className="border-x border-slate-200/60">
            <div className="text-[11px] text-emerald-600 flex items-center justify-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đang thuê</span>
            </div>
            <div className="text-base font-bold text-emerald-700 mt-0.5">{occupied}</div>
          </div>
          <div>
            <div className="text-[11px] text-sky-600 flex items-center justify-center gap-1 font-medium">
              <span>Còn trống</span>
            </div>
            <div className="text-base font-bold text-sky-700 mt-0.5">{available}</div>
          </div>
        </div>

        {/* Tỷ lệ lấp đầy Usage Rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              Tỷ lệ lấp đầy
            </span>
            <span
              className={`font-bold ${
                isOptimal ? 'text-emerald-700' : isModerate ? 'text-amber-700' : 'text-slate-700'
              }`}
            >
              {rate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOptimal ? 'bg-emerald-500' : isModerate ? 'bg-amber-500' : 'bg-slate-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-bold group-hover:text-brand-700">
        <span>Vào quản lý cơ sở</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
