import React from 'react';
import { MapPin, Phone, Clock, ChevronRight, Warehouse } from 'lucide-react';
import type { FacilityListItem } from '@/types';

interface FacilityCardProps {
  facility: FacilityListItem;
  onViewUnits: (facilityId: number) => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ/tháng';
}

export const FacilityCard: React.FC<FacilityCardProps> = ({ facility, onViewUnits }) => (
  <div id={`facility-card-${facility.id}`} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md flex flex-col">
    {/* Gradient header — industrial teal */}
    <div className="h-36 bg-gradient-to-br from-teal-700 to-slate-700 flex items-center justify-center relative overflow-hidden">
      <Warehouse className="w-16 h-16 text-teal-300/40 absolute -right-3 -bottom-3" />
      <div className="text-center z-10 px-4">
        <p className="text-teal-200 text-xs font-medium tracking-wide">SELF-STORAGE</p>
        <p className="text-white font-bold text-base leading-tight mt-0.5">{facility.name}</p>
      </div>
    </div>

    <div className="p-5 flex flex-col flex-1 gap-3">
      <p className="flex items-start gap-2 text-sm text-slate-600 leading-snug">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        {facility.address}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <p className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="w-3.5 h-3.5 text-slate-400" />{facility.phone}</p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="w-3.5 h-3.5 text-slate-400" />{facility.openingHours}</p>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-auto">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Giá thuê từ</p>
            <p className="text-lg font-bold text-teal-700 leading-tight">
              {facility.lowestMonthlyPrice ? formatPrice(facility.lowestMonthlyPrice) : 'Liên hệ'}
            </p>
          </div>
          {facility.activeUnitTypeCount !== undefined && (
            <span className="text-xs text-slate-500">{facility.activeUnitTypeCount} loại kho</span>
          )}
        </div>
      </div>

      <button
        id={`btn-view-units-${facility.id}`}
        onClick={() => onViewUnits(facility.id)}
        className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
      >
        Xem ô kho <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);
