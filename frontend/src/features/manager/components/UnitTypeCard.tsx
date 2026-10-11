// frontend/src/features/manager/components/UnitTypeCard.tsx
import React from 'react';
import type { UnitTypeResponse } from '@/types/unit';
import {
  Edit2,
  Power,
  ArrowRight,
  Maximize2,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getUnitTypeTheme } from '../utils/unitTypeTheme';

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
  onEdit: () => void;
  onToggle: () => void;
}

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ/tháng';

export const isClimateType = (t: { code?: string; name: string }) => {
  const code = (t.code || '').toUpperCase();
  const name = t.name.toLowerCase();
  return (
    code.includes('CLIMATE') ||
    name.includes('lạnh') ||
    name.includes('máy lạnh') ||
    name.includes('điều hòa')
  );
};

export const UnitTypeCard: React.FC<UnitTypeCardProps> = ({
  type,
  isSelected = false,
  onClick,
  onEdit,
  onToggle,
}) => {
  const isTypeActive = type.isActive ?? type.active ?? true;
  const theme = getUnitTypeTheme(type);
  const IconComponent = theme.icon;

  const area = type.areaM2 || (type.widthM && type.depthM ? Number((type.widthM * type.depthM).toFixed(1)) : 0);
  const totalUnits = type.totalUnits ?? 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border transition-all duration-300 select-none cursor-pointer flex flex-col justify-between overflow-hidden bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
          : `border-slate-200/90 ${theme.borderAccent}`
      }`}
    >
      {/* Top Ambient Glow / Gradient Background */}
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${theme.gradientBg} pointer-events-none transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative p-5">
        {/* Header: Visual Icon + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-xs ${theme.iconBg}`}
            >
              <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${theme.iconColor}`} />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100/90 text-slate-600 border border-slate-200/80 inline-block">
                {type.code || 'UT-STD'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg} ${theme.badgeTextCol} ${theme.badgeBorder}`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {theme.categoryLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isTypeActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                Vô hiệu
              </span>
            )}
          </div>
        </div>

        {/* Name & Subtitle */}
        <div className="mt-3.5">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {type.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px] leading-relaxed">
            {type.description || `Khoang lưu trữ tiêu chuẩn phục vụ nhu cầu lưu trữ chuyên biệt với diện tích ${area} m².`}
          </p>
        </div>

        {/* Feature Pill Badge */}
        <div className="mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {theme.badgeText}
          </span>
        </div>

        {/* Technical Specs 3-Column Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-center">
          <div className="px-1">
            <span className="text-slate-400 font-medium text-[10px] flex items-center justify-center gap-1">
              <Maximize2 className="w-2.5 h-2.5" />
              Diện tích
            </span>
            <p className="font-mono font-bold text-slate-800 mt-0.5 text-xs">
              {area} m²
            </p>
          </div>
          <div className="px-1 border-x border-slate-200/70">
            <span className="text-slate-400 font-medium text-[10px] flex items-center justify-center gap-1">
              <Box className="w-2.5 h-2.5" />
              Kích thước
            </span>
            <p className="font-mono font-semibold text-slate-700 mt-0.5 text-[11px] whitespace-nowrap">
              {type.widthM}×{type.depthM}×{type.heightM}m
            </p>
          </div>
          <div className="px-1">
            <span className="text-slate-400 font-medium text-[10px] flex items-center justify-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              Tổng quy mô
            </span>
            <p className="font-mono font-bold text-slate-800 mt-0.5 text-xs">
              {totalUnits} ô
            </p>
          </div>
        </div>

        {/* Pricing Banner */}
        <div className="mt-3.5 bg-gradient-to-r from-slate-50 to-brand-50/30 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium text-[10px] block">Đơn giá niêm yết</span>
            {type.monthlyPrice &&
            type.monthlyPrice > 0 &&
            type.priceStatus !== 'UNLISTED' &&
            type.priceStatus !== 'Chưa niêm yết' ? (
              <p className="font-mono font-extrabold text-brand-700 mt-0.5 text-sm tracking-tight">
                {fmt(type.monthlyPrice)}
              </p>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 mt-0.5">
                Chờ BOM duyệt giá
              </span>
            )}
          </div>

          <span className="text-[11px] font-semibold text-slate-400">
            / tháng
          </span>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="relative px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Chỉnh sửa loại kho"
          >
            <Edit2 className="w-3 h-3" />
            Sửa
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer shadow-2xs ${
              isTypeActive
                ? 'text-rose-600 hover:bg-white border-rose-200 hover:border-rose-300'
                : 'text-emerald-700 hover:bg-white border-emerald-200 hover:border-emerald-300'
            }`}
            title={isTypeActive ? 'Vô hiệu hóa loại ô kho' : 'Kích hoạt loại ô kho'}
          >
            <Power className="w-3 h-3" />
            {isTypeActive ? 'Tắt' : 'Bật'}
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700">
          <span>Xem danh sách ô</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
