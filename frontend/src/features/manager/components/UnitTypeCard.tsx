// frontend/src/features/manager/components/UnitTypeCard.tsx
import React from 'react';
import type { UnitTypeResponse } from '@/types/unit';
import {
  Edit2,
  Power,
  Snowflake,
  Package,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  TrendingUp,
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
  stats,
  onClick,
  onEdit,
  onToggle,
}) => {
  const isClimate = isClimateType(type);
  const isTypeActive = type.isActive ?? type.active ?? true;

  const total = stats ? stats.total : (type.totalUnits ?? 0);
  const available = stats ? stats.available : 0;
  const occupied = stats ? stats.occupied : 0;
  const maintenance = stats ? stats.maintenance : 0;

  // Tính tỷ lệ đã thuê / lấp đầy
  const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
  const isFull = (total > 0 && available === 0) || occupancyRate >= 100;
  const isNearFull = !isFull && occupancyRate >= 75;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border transition-all duration-200 p-5 select-none cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
          : 'border-slate-200/90 bg-white hover:border-brand-500/70 hover:shadow-md'
      }`}
    >
      <div>
        {/* Top Header: Name + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                {type.name}
              </h3>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80 mt-1 inline-block">
              {type.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isTypeActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                Vô hiệu
              </span>
            )}
            {isClimate ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                <Snowflake className="w-3 h-3 text-cyan-600" />
                Kho Máy Lạnh
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                <Package className="w-3 h-3 text-slate-400" />
                Tiêu chuẩn
              </span>
            )}
          </div>
        </div>

        {type.description && (
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {type.description}
          </p>
        )}

        {/* Specs & Pricing Banner */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium text-[11px] block">Diện tích quy chuẩn</span>
            <p className="font-mono font-bold text-slate-800 mt-0.5 text-sm">{type.areaM2} m²</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium text-[11px] block">Đơn giá niêm yết</span>
            {type.monthlyPrice &&
            type.monthlyPrice > 0 &&
            type.priceStatus !== 'UNLISTED' &&
            type.priceStatus !== 'Chưa niêm yết' ? (
              <p className="font-mono font-extrabold text-brand-600 mt-0.5 text-sm">
                {fmt(type.monthlyPrice)}
              </p>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 mt-0.5">
                Chờ BOM duyệt giá
              </span>
            )}
          </div>
        </div>

        {/* Mini Progress Bar tỉ lệ đã thuê / tổng */}
        <div className="mt-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              Đã thuê: {occupied} / {total} ô
            </span>
            <span
              className={`text-[11px] font-bold ${
                isFull ? 'text-rose-600' : isNearFull ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isFull ? 'Đã lấp đầy 100%' : `${occupancyRate.toFixed(0)}%`}
            </span>
          </div>

          {/* Thanh progress bar: Xanh (trống) -> Cam (gần full >=75%) -> Đỏ (full 100%) */}
          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' : isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
            />
          </div>
        </div>

        {/* Stats breakdown 3 màu: Trống (Xanh), Đang thuê (Cam), Bảo trì (Đỏ) */}
        <div className="mt-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl py-2 px-1">
              <div className="text-[10px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Trống</span>
              </div>
              <div className="text-sm font-bold text-emerald-800 mt-0.5">{available} ô</div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl py-2 px-1">
              <div className="text-[10px] font-semibold text-amber-700 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Đang thuê</span>
              </div>
              <div className="text-sm font-bold text-amber-800 mt-0.5">{occupied} ô</div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl py-2 px-1">
              <div className="text-[10px] font-semibold text-rose-700 flex items-center justify-center gap-1">
                <Wrench className="w-3 h-3 text-rose-600" />
                <span>Bảo trì</span>
              </div>
              <div className="text-sm font-bold text-rose-800 mt-0.5">{maintenance} ô</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
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
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
              isTypeActive
                ? 'text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300'
                : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300'
            }`}
            title={isTypeActive ? 'Vô hiệu hóa loại ô kho' : 'Kích hoạt loại ô kho'}
          >
            <Power className="w-3 h-3" />
            {isTypeActive ? 'Tắt' : 'Bật'}
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:text-brand-700">
          <span>{isFull ? 'Xem chi tiết' : 'Xem danh sách ô'}</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
