// frontend/src/features/manager/components/FacilityCard.tsx
import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Compass,
} from 'lucide-react';
import type { FacilityListItem } from '@/types';
import { getFacilityTheme } from '../utils/facilityTheme';

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
  const [copied, setCopied] = useState(false);
  const theme = getFacilityTheme(facility);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (facility.phone) {
      navigator.clipboard?.writeText(facility.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleOpenMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (facility.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${facility.name}, ${facility.address}`
      )}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 select-none cursor-pointer flex flex-col justify-between overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-200/60 ${
        facility.isActive
          ? `border-slate-200/90 ${theme.borderAccent}`
          : 'border-slate-200 bg-slate-50/40 opacity-80'
      }`}
    >
      {/* Top Ambient Glow / Gradient Background */}
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${theme.gradientBg} pointer-events-none transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative p-5">
        {/* Top Header: Icon + Info + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-xs ${theme.iconBg}`}
            >
              <Building2 className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${theme.iconColor}`} />
            </div>

            <div className="min-w-0">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100/90 text-slate-700 border border-slate-200/80 inline-block">
                {facility.code}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeTextCol} ${theme.badgeBorder}`}
                >
                  <Compass className="w-2.5 h-2.5" />
                  {theme.regionLabel}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border shadow-2xs ${
              facility.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {facility.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </div>

        {/* Facility Name */}
        <div className="mt-3.5">
          <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base line-clamp-1">
            {facility.name}
          </h3>
          {facility.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {facility.description}
            </p>
          )}
        </div>

        {/* Info Rows: Địa chỉ chi tiết + Map Link */}
        <div className="mt-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-slate-600 line-clamp-2 leading-relaxed">
                {facility.address || 'Chưa cập nhật địa chỉ'}
              </p>
            </div>
            {facility.address && (
              <button
                type="button"
                onClick={handleOpenMap}
                className="text-slate-400 hover:text-brand-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
                title="Mở Google Maps chỉ đường"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Hotline Contact with Quick Copy */}
          {facility.phone && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span className="font-mono font-medium text-[11px] text-slate-700">
                  {facility.phone}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-brand-700 px-1.5 py-0.5 rounded hover:bg-slate-200/50 transition-colors cursor-pointer"
                title="Sao chép số hotline"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-bold group-hover:text-brand-700">
        <span>Vào quản lý ô kho</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
      </div>
    </div>
  );
};
