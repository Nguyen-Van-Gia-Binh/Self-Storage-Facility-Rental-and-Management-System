// frontend/src/features/manager/components/UnitTypeCard.tsx
import React from 'react';
import type { UnitTypeResponse } from '@/types/unit';
import {
  Edit2,
  Power,
  ChevronRight,
  Snowflake,
  Box,
} from 'lucide-react';

export interface UnitTypeBreakdownStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

interface UnitTypeCardProps {
  type: UnitTypeResponse;
  isSelected?: boolean;
  stats?: UnitTypeBreakdownStats;
  onClick: () => void;
  onEdit?: () => void;
  onToggle?: () => void;
  canManage?: boolean;
}

export const isClimateType = (t: { code?: string; name: string }) => {
  const code = (t.code || '').toUpperCase();
  const name = t.name.toLowerCase();
  return (
    code.includes('CLIMATE') ||
    code.includes('AC') ||
    name.includes('lạnh') ||
    name.includes('máy lạnh') ||
    name.includes('điều hòa')
  );
};

export function cleanUnitTypeName(name?: string): string {
  if (!name) return '';
  return name.replace(/\s*\([a-zA-Z\s/-]+\)\s*/g, '').trim();
}

export const UnitTypeCard: React.FC<UnitTypeCardProps> = ({
  type,
  isSelected = false,
  stats,
  onClick,
  onEdit,
  onToggle,
  canManage = false,
}) => {
  const isTypeActive = type.isActive ?? type.active ?? true;
  const isClimate = isClimateType(type);
  const IconComponent = isClimate ? Snowflake : Box;

  const area =
    type.areaM2 ||
    (type.widthM && type.depthM ? Number((type.widthM * type.depthM).toFixed(1)) : 0);
  const totalUnits = stats ? stats.total : (type.totalUnits ?? 0);
  const dimensionsText =
    type.widthM && type.depthM && type.heightM
      ? `${type.widthM}×${type.depthM}×${type.heightM}m`
      : '—';

  const renderAvailabilityBadge = () => {
    if (!isTypeActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Vô hiệu
        </span>
      );
    }

    if (stats) {
      if (stats.available > 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Còn {stats.available} ô trống
          </span>
        );
      }
      if (stats.total > 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Hết ô
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
          Chưa có ô
        </span>
      );
    }

    return (
      <span className="text-xs font-medium text-gray-500 tabular-nums">
        {totalUnits > 0 ? `${totalUnits} ô tại cơ sở` : 'Chưa có ô'}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border p-5 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex flex-col h-full cursor-pointer select-none ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/15'
          : 'border-gray-200'
      }`}
    >
      {/* 1. Header: Monochrome Icon + Name + Code & Category */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-brand-50 transition-colors">
          <IconComponent className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-brand-700 transition-colors line-clamp-1">
            {cleanUnitTypeName(type.name)}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs font-mono text-gray-500">
              {type.code || 'UT-STD'}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs font-medium text-gray-600">
              {isClimate ? 'Kho Máy Lạnh' : 'Kho Tiêu Chuẩn'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1 leading-relaxed">
        {type.description ||
          `Khoang lưu trữ tiêu chuẩn phục vụ nhu cầu lưu trữ chuyên biệt với diện tích ${area} m².`}
      </p>

      {/* 3. Technical Specs (Flattened 3-column strip, zero gray box soup) */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100 mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            Diện tích
          </span>
          <span className="text-sm font-bold text-gray-900 tabular-nums mt-0.5">
            {area} m²
          </span>
        </div>

        <div className="flex flex-col border-l border-gray-100 pl-2">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            Kích thước
          </span>
          <span className="text-sm font-medium text-gray-700 tabular-nums mt-0.5 whitespace-nowrap">
            {dimensionsText}
          </span>
        </div>

        <div className="flex flex-col border-l border-gray-100 pl-2">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            Quy mô
          </span>
          <span className="text-sm font-medium text-gray-700 tabular-nums mt-0.5">
            {totalUnits} ô
          </span>
        </div>
      </div>

      {/* 4. Footer: Status / Manage actions + Ghost text action */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        {canManage && onEdit && onToggle ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-xs font-medium text-gray-700 hover:bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Chỉnh sửa loại kho"
            >
              <Edit2 className="w-3 h-3 text-gray-500" />
              Sửa
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                isTypeActive
                  ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                  : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
              }`}
              title={isTypeActive ? 'Vô hiệu hóa loại ô kho' : 'Kích hoạt loại ô kho'}
            >
              <Power className="w-3 h-3" />
              {isTypeActive ? 'Tắt' : 'Bật'}
            </button>
          </div>
        ) : (
          renderAvailabilityBadge()
        )}

        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-600 group-hover:text-brand-700 group-hover:underline shrink-0">
          <span>Xem chi tiết</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
