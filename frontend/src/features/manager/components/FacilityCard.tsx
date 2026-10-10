import React from 'react';
import { Building2, MapPin, Phone, ArrowRight } from 'lucide-react';
import type { FacilityListItem } from '@/types';

export interface FacilityStats {
  totalUnits?: number;
  occupiedUnits?: number;
  availableUnits?: number;
  maintenanceUnits?: number;
  occupancyRate?: number;
}

interface FacilityCardProps {
  facility: FacilityListItem;
  stats?: FacilityStats;
  onClick: () => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onClick }) => {
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
        <div className="mt-4 space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <p className="line-clamp-2 leading-relaxed">{facility.address || 'Chưa cập nhật địa chỉ'}</p>
          </div>
          {facility.phone && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{facility.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-bold group-hover:text-brand-700">
        <span>Vào quản lý ô kho</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
