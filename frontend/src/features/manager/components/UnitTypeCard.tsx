// frontend/src/features/manager/components/UnitTypeCard.tsx
import React from 'react';
import type { UnitTypeResponse } from '@/types/unit';
import { Edit2, Power } from 'lucide-react';

interface UnitTypeCardProps {
  type: UnitTypeResponse;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onToggle: () => void;
}

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ/tháng';

export const UnitTypeCard: React.FC<UnitTypeCardProps> = ({
  type,
  isSelected,
  onClick,
  onEdit,
  onToggle,
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer rounded-2xl border transition-all duration-200 p-4 select-none ${
      isSelected
        ? 'border-brand-500 bg-brand-50/60 shadow-sm ring-2 ring-brand-500/20'
        : 'border-slate-200/90 bg-white hover:border-brand-300 hover:shadow-xs hover:bg-slate-50/50'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 tracking-tight truncate">{type.name}</span>
          {!type.isActive && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
              Vô hiệu
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{type.description}</p>
      </div>
    </div>

    <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
      <div>
        <span className="text-slate-400 font-medium text-[11px] block">Diện tích</span>
        <p className="font-mono font-bold text-slate-800 mt-0.5">{type.areaM2} m²</p>
      </div>
      <div>
        <span className="text-slate-400 font-medium text-[11px] block">Tổng ô</span>
        <p className="font-mono font-bold text-slate-800 mt-0.5">{type.totalUnits} ô</p>
      </div>
      <div className="col-span-2 pt-1 border-t border-slate-200/50">
        <span className="text-slate-400 font-medium text-[11px] block">Đơn giá niêm yết</span>
        <p className="font-mono font-extrabold text-brand-600 mt-0.5">{fmt(type.monthlyPrice)}</p>
      </div>
    </div>

    <div className="mt-3 flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="text-xs font-semibold text-slate-600 hover:text-brand-700 hover:bg-brand-50 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
        title="Chỉnh sửa loại kho"
      >
        <Edit2 className="w-3 h-3" />
        Sửa
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
          type.isActive
            ? 'text-rose-600 hover:bg-rose-50 border-rose-200 hover:border-rose-300'
            : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300'
        }`}
        title={type.isActive ? 'Vô hiệu hóa loại ô kho' : 'Kích hoạt loại ô kho'}
      >
        <Power className="w-3 h-3" />
        {type.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
      </button>
    </div>
  </div>
);
